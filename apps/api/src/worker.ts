import { Worker } from "bullmq";
import { redis } from "./lib/redis.js";
import { prisma } from "./lib/prisma.js";
import { sendEmail, appointmentConfirmationHtml } from "./lib/notifications/email.js";
import { sendSms, appointmentReminderText } from "./lib/notifications/sms.js";
import type { ReminderJobData } from "./jobs/queues.js";

console.log("[Worker] starting...");

await redis.connect();

const reminderWorker = new Worker<ReminderJobData>(
  "reminders",
  async (job) => {
    const { appointmentId, type } = job.data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        staff: { include: { user: true } },
        service: true,
      },
    });

    if (!appointment || appointment.status !== "CONFIRMED") {
      console.log(`[Worker] skipping reminder for appointment ${appointmentId} (status: ${appointment?.status})`);
      return;
    }

    const params = {
      clientName: appointment.client.name,
      serviceName: appointment.service.name,
      staffName: appointment.staff.user.name,
      startAt: appointment.startAt,
      appointmentId,
    };

    if (type === "email" || type === "both") {
      if (appointment.client.email) {
        await sendEmail({
          to: appointment.client.email,
          subject: `Recordatorio de turno: ${params.serviceName}`,
          html: appointmentConfirmationHtml(params),
        });
      }
    }

    if (type === "sms" || type === "both") {
      if (appointment.client.phone) {
        await sendSms(
          appointment.client.phone,
          appointmentReminderText(params),
        );
      }
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

reminderWorker.on("completed", (job) => {
  console.log(`[Worker] reminder job ${job.id} completed`);
});

reminderWorker.on("failed", (job, err) => {
  console.error(`[Worker] reminder job ${job?.id} failed:`, err.message);
});

process.on("SIGTERM", async () => {
  await reminderWorker.close();
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
