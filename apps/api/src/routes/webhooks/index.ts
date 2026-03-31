import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { config } from "../../config.js";

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // Mercado Pago payment notification
  app.post("/webhooks/mercadopago", async (req, reply) => {
    const body = req.body as { type?: string; data?: { id?: string } };

    if (body.type === "payment" && body.data?.id && config.MP_ACCESS_TOKEN) {
      try {
        const { MercadoPagoConfig, Payment } = await import("mercadopago");
        const mp = new MercadoPagoConfig({ accessToken: config.MP_ACCESS_TOKEN });
        const paymentClient = new Payment(mp);
        const payment = await paymentClient.get({ id: body.data.id });

        if (payment.status === "approved" && payment.external_reference) {
          await prisma.appointment.update({
            where: { id: payment.external_reference },
            data: {
              depositPaid: true,
              mpPaymentId: String(payment.id),
              status: "CONFIRMED",
            },
          });
        }
      } catch (err) {
        app.log.error(err, "MP webhook error");
      }
    }

    return reply.status(200).send({ ok: true });
  });
}
