import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { ensureBucketExists } from "./lib/storage.js";
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./routes/health/index.js";
import { availabilityRoutes } from "./routes/availability/index.js";
import { appointmentRoutes } from "./routes/appointments/index.js";
import { serviceRoutes } from "./routes/services/index.js";
import { staffRoutes } from "./routes/staff/index.js";
import { adminRoutes } from "./routes/admin/index.js";
import { reviewRoutes } from "./routes/reviews/index.js";
import { clientRoutes } from "./routes/client/index.js";
import { webhookRoutes } from "./routes/webhooks/index.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug",
    transport:
      config.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

// ─── Plugins ─────────────────────────────────────────────────────────────────

await app.register(helmet, { contentSecurityPolicy: false });

await app.register(cors, {
  origin: config.NODE_ENV === "production"
    ? ["https://yourdomain.com"]
    : ["http://localhost:3000"],
  credentials: true,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: (req) => req.ip,
});

// Auth plugin registers /api/auth/* and decodes sessions on every request
await app.register(authPlugin);

// ─── Routes ──────────────────────────────────────────────────────────────────

await app.register(healthRoutes);

await app.register(
  async (instance) => {
    await instance.register(availabilityRoutes);
    await instance.register(appointmentRoutes);
    await instance.register(serviceRoutes);
    await instance.register(staffRoutes);
    await instance.register(adminRoutes);
    await instance.register(reviewRoutes);
    await instance.register(clientRoutes);
    await instance.register(webhookRoutes);
  },
  { prefix: "/api/v1" },
);

// ─── Lifecycle ───────────────────────────────────────────────────────────────

app.addHook("onClose", async () => {
  await prisma.$disconnect();
  redis.disconnect();
});

// ─── Start ───────────────────────────────────────────────────────────────────

try {
  if (redis.status === "wait") await redis.connect();
  await ensureBucketExists();
  await app.listen({ port: config.API_PORT, host: "0.0.0.0" });
  console.log(`API running on http://0.0.0.0:${config.API_PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
