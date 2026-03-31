import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireRole } from "../../plugins/auth.js";

const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480),
  price: z.number().min(0),
  category: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function adminServiceRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/admin/services — all services (including inactive)
  app.get("/admin/services", async (req, reply) => {
    const session = requireRole(req, reply, "STAFF");
    if (!session) return;

    const services = await prisma.service.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: { _count: { select: { appointments: true, staffServices: true } } },
    });

    return reply.send(services);
  });

  // POST /api/v1/admin/services — create
  app.post("/admin/services", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const service = await prisma.service.create({ data: parsed.data });
    return reply.status(201).send(service);
  });

  // PATCH /api/v1/admin/services/:id — update
  app.patch("/admin/services/:id", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { id } = req.params as { id: string };
    const parsed = serviceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: "Servicio no encontrado" });

    const updated = await prisma.service.update({ where: { id }, data: parsed.data });
    return reply.send(updated);
  });

  // DELETE /api/v1/admin/services/:id — deactivate if has appointments, hard-delete otherwise
  app.delete("/admin/services/:id", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { id } = req.params as { id: string };

    const service = await prisma.service.findUnique({
      where: { id },
      include: { _count: { select: { appointments: true } } },
    });

    if (!service) return reply.status(404).send({ error: "Servicio no encontrado" });

    if (service._count.appointments > 0) {
      // Has history — soft delete (deactivate)
      await prisma.service.update({ where: { id }, data: { isActive: false } });
      return reply.send({ deactivated: true });
    }

    // No history — hard delete
    await prisma.service.delete({ where: { id } });
    return reply.status(204).send();
  });
}
