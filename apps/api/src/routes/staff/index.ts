import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export async function staffRoutes(app: FastifyInstance): Promise<void> {
  app.get("/staff", async (_req, reply) => {
    const staff = await prisma.staffProfile.findMany({
      where: { acceptsOnlineBooking: true },
      include: {
        user: { select: { name: true, image: true, email: true } },
        staffServices: { include: { service: true } },
      },
    });
    return reply.send(staff);
  });

  app.get("/staff/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const staff = await prisma.staffProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, image: true } },
        staffServices: { include: { service: true } },
        workingHours: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        galleryPhotos: { orderBy: { uploadedAt: "desc" }, take: 20 },
      },
    });

    if (!staff) return reply.status(404).send({ error: "Not found" });
    return reply.send(staff);
  });

  app.get("/staff/:id/reviews", async (req, reply) => {
    const { id } = req.params as { id: string };

    const reviews = await prisma.review.findMany({
      where: { staffId: id, isVisible: true },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, image: true } },
      },
    });

    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return reply.send({ reviews, averageRating: avg, total: reviews.length });
  });
}
