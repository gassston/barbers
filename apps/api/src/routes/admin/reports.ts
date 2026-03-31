import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eachDayOfInterval, eachWeekOfInterval, format, parseISO } from "date-fns";
import { prisma } from "../../lib/prisma.js";
import { requireRole } from "../../plugins/auth.js";

const rangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  groupBy: z.enum(["day", "week"]).default("day"),
});

export async function adminReportRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/admin/reports/revenue?from=&to=&groupBy=day|week
  app.get("/admin/reports/revenue", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const parsed = rangeSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { from, to, groupBy } = parsed.data;
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59`);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["COMPLETED", "CONFIRMED", "NO_SHOW", "CANCELLED"] },
        startAt: { gte: fromDate, lte: toDate },
      },
      select: {
        startAt: true,
        status: true,
        service: { select: { price: true } },
      },
    });

    // Group by day or week
    const buckets: Record<string, { date: string; revenue: number; completed: number; noShow: number; cancelled: number }> = {};

    const intervals =
      groupBy === "week"
        ? eachWeekOfInterval({ start: fromDate, end: toDate }, { weekStartsOn: 1 })
        : eachDayOfInterval({ start: fromDate, end: toDate });

    for (const d of intervals) {
      const key = format(d, "yyyy-MM-dd");
      buckets[key] = { date: key, revenue: 0, completed: 0, noShow: 0, cancelled: 0 };
    }

    for (const appt of appointments) {
      const key = format(
        groupBy === "week"
          ? // Snap to week start
            new Date(
              appt.startAt.getTime() -
                ((appt.startAt.getDay() || 7) - 1) * 86400000,
            )
          : appt.startAt,
        "yyyy-MM-dd",
      );

      if (!buckets[key]) continue;

      if (appt.status === "COMPLETED") {
        buckets[key].revenue += appt.service?.price ?? 0;
        buckets[key].completed++;
      } else if (appt.status === "NO_SHOW") {
        buckets[key].noShow++;
      } else if (appt.status === "CANCELLED") {
        buckets[key].cancelled++;
      }
    }

    return reply.send(Object.values(buckets));
  });

  // GET /api/v1/admin/reports/by-service?from=&to=
  app.get("/admin/reports/by-service", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { from, to } = req.query as { from: string; to: string };

    const rows = await prisma.appointment.groupBy({
      by: ["serviceId", "status"],
      where: {
        startAt: { gte: new Date(`${from}T00:00:00`), lte: new Date(`${to}T23:59:59`) },
      },
      _count: true,
    });

    const serviceIds = [...new Set(rows.map((r) => r.serviceId))];
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    });
    const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));

    const grouped: Record<string, {
      serviceId: string; name: string;
      total: number; completed: number; cancelled: number; noShow: number; revenue: number;
    }> = {};

    for (const row of rows) {
      const svc = serviceMap[row.serviceId];
      if (!svc) continue;
      if (!grouped[row.serviceId]) {
        grouped[row.serviceId] = {
          serviceId: row.serviceId,
          name: svc.name,
          total: 0, completed: 0, cancelled: 0, noShow: 0, revenue: 0,
        };
      }
      grouped[row.serviceId].total += row._count;
      if (row.status === "COMPLETED") {
        grouped[row.serviceId].completed += row._count;
        grouped[row.serviceId].revenue += svc.price * row._count;
      } else if (row.status === "CANCELLED") {
        grouped[row.serviceId].cancelled += row._count;
      } else if (row.status === "NO_SHOW") {
        grouped[row.serviceId].noShow += row._count;
      }
    }

    return reply.send(
      Object.values(grouped).sort((a, b) => b.total - a.total),
    );
  });

  // GET /api/v1/admin/reports/by-staff?from=&to=
  app.get("/admin/reports/by-staff", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { from, to } = req.query as { from: string; to: string };

    const rows = await prisma.appointment.groupBy({
      by: ["staffId", "status"],
      where: {
        startAt: { gte: new Date(`${from}T00:00:00`), lte: new Date(`${to}T23:59:59`) },
      },
      _count: true,
    });

    const staffIds = [...new Set(rows.map((r) => r.staffId))];
    const staffList = await prisma.staffProfile.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, user: { select: { name: true } } },
    });
    const staffMap = Object.fromEntries(staffList.map((s) => [s.id, s]));

    // Need service prices for revenue calculation
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        staffId: { in: staffIds },
        status: "COMPLETED",
        startAt: { gte: new Date(`${from}T00:00:00`), lte: new Date(`${to}T23:59:59`) },
      },
      select: { staffId: true, service: { select: { price: true } } },
    });

    const revenueByStaff: Record<string, number> = {};
    for (const a of completedAppointments) {
      revenueByStaff[a.staffId] = (revenueByStaff[a.staffId] ?? 0) + (a.service?.price ?? 0);
    }

    const grouped: Record<string, {
      staffId: string; name: string;
      total: number; completed: number; noShow: number; revenue: number;
    }> = {};

    for (const row of rows) {
      const staff = staffMap[row.staffId];
      if (!staff) continue;
      if (!grouped[row.staffId]) {
        grouped[row.staffId] = {
          staffId: row.staffId,
          name: staff.user.name,
          total: 0, completed: 0, noShow: 0,
          revenue: revenueByStaff[row.staffId] ?? 0,
        };
      }
      grouped[row.staffId].total += row._count;
      if (row.status === "COMPLETED") grouped[row.staffId].completed += row._count;
      if (row.status === "NO_SHOW") grouped[row.staffId].noShow += row._count;
    }

    return reply.send(
      Object.values(grouped).sort((a, b) => b.total - a.total),
    );
  });
}
