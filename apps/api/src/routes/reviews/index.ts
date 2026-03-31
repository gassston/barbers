import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireSession } from "../../plugins/auth.js";

const createReviewSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function reviewRoutes(app: FastifyInstance): Promise<void> {
  app.post("/reviews", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { appointmentId, rating, comment } = parsed.data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return reply.status(404).send({ error: "Appointment not found" });
    }

    if (appointment.clientId !== session.user.id) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    if (appointment.status !== "COMPLETED") {
      return reply.status(422).send({
        error: "Only completed appointments can be reviewed",
      });
    }

    const existing = await prisma.review.findUnique({
      where: { appointmentId },
    });
    if (existing) {
      return reply.status(409).send({ error: "Review already exists" });
    }

    const review = await prisma.review.create({
      data: {
        appointmentId,
        clientId: session.user.id,
        staffId: appointment.staffId,
        rating,
        comment,
      },
    });

    return reply.status(201).send(review);
  });
}
