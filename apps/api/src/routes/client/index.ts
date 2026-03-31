import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireSession } from "../../plugins/auth.js";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
});

export async function clientRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/client/profile — returns user + clientProfile + stats
  app.get("/client/profile", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        clientProfile: {
          select: {
            loyaltyPoints: true,
            totalVisits: true,
            preferredStaffId: true,
            loyaltyEvents: {
              orderBy: { createdAt: "desc" },
              take: 10,
              select: {
                pointsDelta: true,
                reason: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) return reply.status(404).send({ error: "Not found" });

    // Aggregate appointment stats
    const stats = await prisma.appointment.groupBy({
      by: ["status"],
      where: { clientId: session.user.id },
      _count: true,
    });

    return reply.send({
      ...user,
      stats: Object.fromEntries(stats.map((s) => [s.status, s._count])),
    });
  });

  // PATCH /api/v1/client/profile
  app.patch("/client/profile", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, phone: true, image: true },
    });

    return reply.send(updated);
  });

  // GET /api/v1/client/appointments/history — completed, cancelled, no_show
  app.get("/client/appointments/history", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: session.user.id,
        status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
      },
      orderBy: { startAt: "desc" },
      include: {
        service: true,
        staff: { include: { user: { select: { name: true, image: true } } } },
        review: { select: { id: true, rating: true, comment: true } },
      },
    });

    return reply.send(appointments);
  });
}
