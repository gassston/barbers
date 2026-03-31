import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_req, reply) => {
    const checks = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
    ]);

    const db = checks[0].status === "fulfilled" ? "ok" : "error";
    const cache = checks[1].status === "fulfilled" ? "ok" : "error";
    const status = db === "ok" && cache === "ok" ? 200 : 503;

    return reply.status(status).send({
      status: status === 200 ? "ok" : "degraded",
      services: { db, cache },
    });
  });
}
