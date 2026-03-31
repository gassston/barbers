import twilio from "twilio";
import { config } from "../../config.js";

const client =
  config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN
    ? twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
    : null;

export async function sendSms(to: string, body: string): Promise<string | null> {
  if (!client || !config.TWILIO_PHONE_NUMBER) {
    console.warn("[SMS] Twilio not configured, skipping send to:", to);
    return null;
  }

  const message = await client.messages.create({
    body,
    from: config.TWILIO_PHONE_NUMBER,
    to,
  });

  return message.sid;
}

export function appointmentReminderText(params: {
  clientName: string;
  serviceName: string;
  staffName: string;
  startAt: Date;
}): string {
  const date = params.startAt.toLocaleDateString("es-AR");
  const time = params.startAt.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Hola ${params.clientName}! Recordatorio: tenés turno para ${params.serviceName} con ${params.staffName} el ${date} a las ${time}. Ante cualquier cambio, contactanos.`;
}
