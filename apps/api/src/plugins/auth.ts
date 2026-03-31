import fp from "fastify-plugin";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Role } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
  }
}

export default fp(async (app: FastifyInstance) => {
  // Register /api/auth/* routes via auth.handler (web Request/Response API).
  // We parse the body as a raw Buffer so we can reconstruct a web Request
  // without touching req.raw (which toNodeHandler needed but Fastify consumes).
  app.register(async (authScope) => {
    authScope.addContentTypeParser(
      ["application/json", "application/x-www-form-urlencoded"],
      { parseAs: "buffer" },
      (_req, body, done) => done(null, body),
    );

    authScope.all("/api/auth/*", async (req, reply) => {
      const url = `${req.protocol}://${req.headers.host}${req.url}`;

      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val === undefined) continue;
        if (Array.isArray(val)) {
          for (const v of val) headers.append(key, v);
        } else {
          headers.set(key, val);
        }
      }

      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      const webReq = new Request(url, {
        method: req.method,
        headers,
        body: hasBody && req.body instanceof Buffer ? req.body : null,
      });

      const webRes = await auth.handler(webReq);

      reply.status(webRes.status);
      for (const [key, value] of webRes.headers.entries()) {
        reply.header(key, value);
      }

      const buf = Buffer.from(await webRes.arrayBuffer());
      return reply.send(buf);
    });
  });

  // Decode session on every request (non-blocking — null if not authenticated)
  app.addHook("preHandler", async (req: FastifyRequest) => {
    req.session = await auth.api
      .getSession({ headers: fromNodeHeaders(req.headers) })
      .catch(() => null);
  });
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export function requireSession(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session) {
    reply.status(401).send({ error: "Unauthorized" });
    return null;
  }
  return req.session;
}

export function requireRole(
  req: FastifyRequest,
  reply: FastifyReply,
  role: Role,
) {
  const session = requireSession(req, reply);
  if (!session) return null;

  const userRole = (session.user as any).role as Role;
  if (userRole !== role && userRole !== "ADMIN") {
    reply.status(403).send({ error: "Forbidden" });
    return null;
  }
  return session;
}
