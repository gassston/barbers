import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getAvailableSlots } from "./service.js";
import { redis } from "../../lib/redis.js";

const querySchema = z.object({
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function availabilityRoutes(app: FastifyInstance): Promise<void> {
  app.get("/availability", async (req, reply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { staffId, serviceId, date } = parsed.data;
    const cacheKey = `availability:${date}:${staffId}:${serviceId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return reply.send(JSON.parse(cached));
    }

    const slots = await getAvailableSlots({ staffId, serviceId, date });

    // Cache for 60 seconds; invalidated on new booking via pub/sub
    await redis.setex(cacheKey, 60, JSON.stringify(slots));

    return reply.send(slots);
  });

  // SSE endpoint for real-time availability updates
  app.get("/availability/stream", async (req, reply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { staffId, date } = parsed.data;
    const channel = `availability:${date}:${staffId}`;

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders();

    const subscriber = redis.duplicate();
    await subscriber.subscribe(channel);

    subscriber.on("message", (_ch: string, message: string) => {
      reply.raw.write(`data: ${message}\n\n`);
    });

    req.raw.on("close", () => {
      subscriber.unsubscribe(channel);
      subscriber.disconnect();
    });
  });
}
