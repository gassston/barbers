import type { FastifyInstance } from "fastify";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { prisma } from "../../lib/prisma.js";
import { requireRole } from "../../plugins/auth.js";

const appointmentInclude = {
  client: { select: { name: true, phone: true } },
  staff: { select: { user: { select: { name: true } } } },
  service: { select: { name: true, durationMinutes: true, price: true } },
} as const;

export async function adminDashboardRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/admin/dashboard — overview metrics
  app.get("/admin/dashboard", async (req, reply) => {
    const session = requireRole(req, reply, "STAFF");
    if (!session) return;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [
      todayCounts,
      weekCounts,
      upcomingToday,
      recentNoShows,
    ] = await Promise.all([
      // Today by status
      prisma.appointment.groupBy({
        by: ["status"],
        where: { startAt: { gte: todayStart, lte: todayEnd } },
        _count: true,
      }),
      // This week by status + price sum for completed
      prisma.appointment.findMany({
        where: { startAt: { gte: weekStart, lte: weekEnd } },
        select: { status: true, service: { select: { price: true } } },
      }),
      // Next appointments today (upcoming)
      prisma.appointment.findMany({
        where: {
          startAt: { gte: now, lte: todayEnd },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        orderBy: { startAt: "asc" },
        take: 8,
        include: appointmentInclude,
      }),
      // No-shows this week
      prisma.appointment.count({
        where: {
          status: "NO_SHOW",
          startAt: { gte: weekStart, lte: weekEnd },
        },
      }),
    ]);

    const todayMap = Object.fromEntries(
      todayCounts.map((r) => [r.status, r._count]),
    );

    const weekTotal = weekCounts.length;
    const weekCompleted = weekCounts.filter((a) => a.status === "COMPLETED");
    const weekRevenue = weekCompleted.reduce(
      (sum, a) => sum + (a.service?.price ?? 0),
      0,
    );
    const weekNoShowRate =
      weekTotal > 0 ? Math.round((recentNoShows / weekTotal) * 100) : 0;

    return reply.send({
      today: {
        total: Object.values(todayMap).reduce((s, v) => s + v, 0),
        confirmed: todayMap["CONFIRMED"] ?? 0,
        completed: todayMap["COMPLETED"] ?? 0,
        noShow: todayMap["NO_SHOW"] ?? 0,
        cancelled: todayMap["CANCELLED"] ?? 0,
      },
      week: {
        total: weekTotal,
        completed: weekCompleted.length,
        revenue: weekRevenue,
        noShows: recentNoShows,
        noShowRate: weekNoShowRate,
      },
      upcomingToday,
    });
  });
}
