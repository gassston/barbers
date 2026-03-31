import { Resend } from "resend";
import { config } from "../../config.js";

const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<string | null> {
  if (!resend || !config.EMAIL_FROM) {
    console.warn("[Email] Resend not configured, skipping send:", payload.subject);
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: config.EMAIL_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  if (error) {
    throw new Error(`[Email] send failed: ${error.message}`);
  }

  return data?.id ?? null;
}

export function appointmentConfirmationHtml(params: {
  clientName: string;
  serviceName: string;
  staffName: string;
  startAt: Date;
  appointmentId: string;
}): string {
  const date = params.startAt.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = params.startAt.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <h2>¡Turno confirmado!</h2>
    <p>Hola <strong>${params.clientName}</strong>,</p>
    <p>Tu turno fue registrado correctamente:</p>
    <ul>
      <li><strong>Servicio:</strong> ${params.serviceName}</li>
      <li><strong>Profesional:</strong> ${params.staffName}</li>
      <li><strong>Fecha:</strong> ${date}</li>
      <li><strong>Hora:</strong> ${time}</li>
    </ul>
    <p>ID de turno: <code>${params.appointmentId}</code></p>
  `;
}
