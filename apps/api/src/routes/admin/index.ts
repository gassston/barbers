import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { prisma } from "../../lib/prisma.js";
import { requireRole } from "../../plugins/auth.js";
import { adminDashboardRoutes } from "./dashboard.js";
import { adminReportRoutes } from "./reports.js";
import { adminStaffManagementRoutes } from "./staff-management.js";
import { adminServiceRoutes } from "./services.js";

const scheduleQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  view: z.enum(["day", "week"]).default("day"),
  staffId: z.string().min(1).optional(),
});

const appointmentInclude = {
  client: { select: { id: true, name: true, phone: true, image: true } },
  staff: { select: { id: true, user: { select: { name: true, image: true } } } },
  service: { select: { id: true, name: true, durationMinutes: true, price: true } },
} as const;

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // Sub-routers
  await app.register(adminDashboardRoutes);
  await app.register(adminReportRoutes);
  await app.register(adminStaffManagementRoutes);
  await app.register(adminServiceRoutes);

  // GET /api/v1/admin/schedule
  app.get("/admin/schedule", async (req, reply) => {
    const session = requireRole(req, reply, "STAFF");
    if (!session) return;

    const parsed = scheduleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { date, view, staffId } = parsed.data;
    const anchor = new Date(`${date}T00:00:00`);
    const from = view === "week" ? startOfWeek(anchor, { weekStartsOn: 1 }) : startOfDay(anchor);
    const to = view === "week" ? endOfWeek(anchor, { weekStartsOn: 1 }) : endOfDay(anchor);

    const userRole = (session.user as any).role as string;
    const staffFilter =
      userRole === "ADMIN"
        ? staffId ? { staffProfile: { id: staffId } } : {}
        : { staffProfile: { userId: session.user.id } };

    const [appointments, staffList] = await Promise.all([
      prisma.appointment.findMany({
        where: { startAt: { gte: from }, endAt: { lte: to }, staff: staffFilter as any },
        orderBy: { startAt: "asc" },
        include: appointmentInclude,
      }),
      userRole === "ADMIN"
        ? prisma.staffProfile.findMany({
            select: { id: true, user: { select: { name: true, image: true } } },
          })
        : Promise.resolve([]),
    ]);

    return reply.send({ from: from.toISOString(), to: to.toISOString(), view, appointments, staff: staffList });
  });

  // PATCH /api/v1/admin/appointments/:id/status
  app.patch("/admin/appointments/:id/status", async (req, reply) => {
    const session = requireRole(req, reply, "STAFF");
    if (!session) return;

    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };

    const allowed = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"];
    if (!allowed.includes(status)) {
      return reply.status(400).send({ error: "Invalid status" });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: status as any },
      include: appointmentInclude,
    });

    return reply.send(appointment);
  });
}
