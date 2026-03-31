import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { config } from "../../config.js";
import {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  AppointmentConflictError,
  CancellationWindowError,
} from "./service.js";
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "./schema.js";
import { requireSession } from "../../plugins/auth.js";

export async function appointmentRoutes(app: FastifyInstance): Promise<void> {
  // List client's own appointments
  app.get("/appointments", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const appointments = await prisma.appointment.findMany({
      where: { clientId: session.user.id },
      orderBy: { startAt: "desc" },
      include: {
        service: true,
        staff: { include: { user: { select: { name: true, image: true } } } },
      },
    });

    return reply.send(appointments);
  });

  // Book a new appointment
  app.post("/appointments", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const appointment = await bookAppointment(session.user.id, parsed.data);
      return reply.status(201).send(appointment);
    } catch (err) {
      if (err instanceof AppointmentConflictError) {
        return reply.status(409).send({ error: err.message });
      }
      throw err;
    }
  });

  // Get appointment by id
  app.get("/appointments/:id", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const { id } = req.params as { id: string };
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        staff: { include: { user: { select: { name: true, image: true } } } },
        review: true,
      },
    });

    if (!appointment) return reply.status(404).send({ error: "Not found" });

    // Clients can only see their own appointments
    const userRole = (session.user as any).role as string;
    if (
      userRole === "CLIENT" &&
      appointment.clientId !== session.user.id
    ) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    return reply.send(appointment);
  });

  // Reschedule appointment
  app.patch("/appointments/:id/reschedule", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const { id } = req.params as { id: string };
    const parsed = rescheduleAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const appointment = await rescheduleAppointment(
        id,
        session.user.id,
        parsed.data.startAt,
      );
      return reply.send(appointment);
    } catch (err) {
      if (err instanceof AppointmentConflictError) {
        return reply.status(409).send({ error: err.message });
      }
      if (err instanceof CancellationWindowError) {
        return reply.status(422).send({ error: err.message });
      }
      if (err instanceof Error && err.message.includes("Not authorized")) {
        return reply.status(403).send({ error: err.message });
      }
      throw err;
    }
  });

  // Create Mercado Pago checkout preference for deposit payment
  app.post("/appointments/:id/checkout", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const { id } = req.params as { id: string };
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!appointment) return reply.status(404).send({ error: "Not found" });
    if (appointment.clientId !== session.user.id) return reply.status(403).send({ error: "Forbidden" });
    if (appointment.status !== "PENDING") return reply.status(409).send({ error: "Appointment already processed" });

    if (!config.MP_ACCESS_TOKEN) {
      // MP not configured — confirm immediately without payment
      await prisma.appointment.update({
        where: { id },
        data: { status: "CONFIRMED", depositPaid: true },
      });
      return reply.send({ skip: true });
    }

    const { MercadoPagoConfig, Preference } = await import("mercadopago");
    const mp = new MercadoPagoConfig({ accessToken: config.MP_ACCESS_TOKEN });
    const preference = new Preference(mp);

    const depositAmount = appointment.depositAmount ?? Math.round(appointment.service.price * 0.2 * 100) / 100;

    let result;
    try {
      result = await preference.create({
        body: {
          items: [
            {
              id: appointment.serviceId,
              title: `Seña — ${appointment.service.name}`,
              quantity: 1,
              unit_price: depositAmount,
              currency_id: "ARS",
            },
          ],
          external_reference: appointment.id,
          back_urls: {
            success: `${config.WEB_URL}/book/success?appointmentId=${id}`,
            failure: `${config.WEB_URL}/book/failure?appointmentId=${id}`,
            pending: `${config.WEB_URL}/book/success?appointmentId=${id}`,
          },
          ...(config.WEB_URL.includes("localhost") ? {} : { auto_return: "approved" }),
          notification_url: `${config.BETTER_AUTH_URL}/api/v1/webhooks/mercadopago`,
        },
      });
    } catch (err: any) {
      app.log.error(err, "MercadoPago preference creation failed");
      return reply.status(502).send({
        error: "No se pudo crear la preferencia de pago en Mercado Pago.",
        detail: err?.message ?? String(err),
      });
    }

    return reply.send({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      depositAmount,
    });
  });

  // Cancel appointment
  app.patch("/appointments/:id/cancel", async (req, reply) => {
    const session = requireSession(req, reply);
    if (!session) return;

    const { id } = req.params as { id: string };
    const parsed = cancelAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const appointment = await cancelAppointment(
        id,
        session.user.id,
        parsed.data.reason,
      );
      return reply.send(appointment);
    } catch (err) {
      if (err instanceof CancellationWindowError) {
        return reply.status(422).send({ error: err.message });
      }
      if (err instanceof Error && err.message.includes("Not authorized")) {
        return reply.status(403).send({ error: err.message });
      }
      throw err;
    }
  });
}
