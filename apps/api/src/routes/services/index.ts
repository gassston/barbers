import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export async function serviceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/services", async (_req, reply) => {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return reply.send(services);
  });

  app.get("/services/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        staffServices: {
          include: {
            staff: {
              include: {
                user: { select: { name: true, image: true } },
              },
            },
          },
        },
      },
    });

    if (!service) return reply.status(404).send({ error: "Not found" });
    return reply.send(service);
  });
}
