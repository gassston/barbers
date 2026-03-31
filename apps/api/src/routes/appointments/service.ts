import { addMinutes, differenceInHours } from "date-fns";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { reminderQueue } from "../../jobs/queues.js";
import { config } from "../../config.js";
import type { CreateAppointmentInput } from "./schema.js";

export class AppointmentConflictError extends Error {
  constructor() {
    super("The selected time slot is no longer available.");
  }
}

export class CancellationWindowError extends Error {
  constructor() {
    super(
      `Cancellations must be made at least ${config.CANCELLATION_HOURS_LIMIT} hours in advance.`,
    );
  }
}

export async function bookAppointment(
  clientId: string,
  input: CreateAppointmentInput,
) {
  const service = await prisma.staffService.findFirst({
    where: { staffId: input.staffId, serviceId: input.serviceId },
    include: { service: true },
  });

  const durationMinutes =
    service?.customDuration ?? service?.service.durationMinutes ?? 30;

  const startAt = new Date(input.startAt);
  const endAt = addMinutes(startAt, durationMinutes);

  // Check for overlap (atomic via transaction)
  const appointment = await prisma.$transaction(async (tx) => {
    const conflict = await tx.appointment.findFirst({
      where: {
        staffId: input.staffId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (conflict) throw new AppointmentConflictError();

    const price = service?.customPrice ?? service?.service.price ?? 0;
    const depositAmount = Math.round(price * 0.2 * 100) / 100;

    return tx.appointment.create({
      data: {
        clientId,
        staffId: input.staffId,
        serviceId: input.serviceId,
        startAt,
        endAt,
        notes: input.notes,
        status: "PENDING",
        depositAmount,
      },
      include: {
        client: true,
        staff: { include: { user: true } },
        service: true,
      },
    });
  });

  // Invalidate availability cache
  const dateStr = startAt.toISOString().split("T")[0];
  const cachePattern = `availability:${dateStr}:${input.staffId}:*`;
  const keys = await redis.keys(cachePattern);
  if (keys.length > 0) await redis.del(...keys);

  // Publish real-time update
  await redis.publish(
    `availability:${dateStr}:${input.staffId}`,
    JSON.stringify({ type: "slot_booked", startAt: startAt.toISOString() }),
  );

  // Schedule reminder 24h before (fire-and-forget)
  const reminderDelay = startAt.getTime() - Date.now() - 24 * 60 * 60 * 1000;
  if (reminderDelay > 0) {
    await reminderQueue.add(
      "appointment-reminder",
      { appointmentId: appointment.id, type: "both" },
      { delay: reminderDelay, jobId: `reminder-${appointment.id}` },
    );
  }

  return appointment;
}

export async function rescheduleAppointment(
  appointmentId: string,
  requesterId: string,
  newStartAt: string,
) {
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: {
      staff: true,
      service: true,
    },
  });

  if (appointment.clientId !== requesterId && appointment.staff.userId !== requesterId) {
    throw new Error("Not authorized to reschedule this appointment.");
  }

  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    throw new Error("Only pending or confirmed appointments can be rescheduled.");
  }

  const hoursUntilAppointment = differenceInHours(appointment.startAt, new Date());
  if (hoursUntilAppointment < config.CANCELLATION_HOURS_LIMIT) {
    throw new CancellationWindowError();
  }

  const staffService = await prisma.staffService.findFirst({
    where: { staffId: appointment.staffId, serviceId: appointment.serviceId },
    include: { service: true },
  });
  const durationMinutes =
    staffService?.customDuration ?? appointment.service.durationMinutes;

  const newStart = new Date(newStartAt);
  const newEnd = addMinutes(newStart, durationMinutes);

  const updated = await prisma.$transaction(async (tx) => {
    const conflict = await tx.appointment.findFirst({
      where: {
        id: { not: appointmentId },
        staffId: appointment.staffId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { lt: newEnd },
        endAt: { gt: newStart },
      },
    });

    if (conflict) throw new AppointmentConflictError();

    return tx.appointment.update({
      where: { id: appointmentId },
      data: { startAt: newStart, endAt: newEnd, reminderSent: false },
      include: {
        client: true,
        staff: { include: { user: true } },
        service: true,
      },
    });
  });

  // Invalidate cache for old and new date
  const oldDateStr = appointment.startAt.toISOString().split("T")[0];
  const newDateStr = newStart.toISOString().split("T")[0];
  const datesToInvalidate = [...new Set([oldDateStr, newDateStr])];

  for (const dateStr of datesToInvalidate) {
    const keys = await redis.keys(`availability:${dateStr}:${appointment.staffId}:*`);
    if (keys.length > 0) await redis.del(...keys);
    await redis.publish(
      `availability:${dateStr}:${appointment.staffId}`,
      JSON.stringify({ type: "slot_updated" }),
    );
  }

  // Replace reminder job
  const oldJob = await reminderQueue.getJob(`reminder-${appointmentId}`);
  if (oldJob) await oldJob.remove();

  const reminderDelay = newStart.getTime() - Date.now() - 24 * 60 * 60 * 1000;
  if (reminderDelay > 0) {
    await reminderQueue.add(
      "appointment-reminder",
      { appointmentId, type: "both" },
      { delay: reminderDelay, jobId: `reminder-${appointmentId}` },
    );
  }

  return updated;
}

export async function cancelAppointment(
  appointmentId: string,
  requesterId: string,
  reason?: string,
) {
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: { staff: true },
  });

  const isOwner = appointment.clientId === requesterId;
  const isStaff = appointment.staff.userId === requesterId;

  if (!isOwner && !isStaff) {
    throw new Error("Not authorized to cancel this appointment.");
  }

  // Enforce cancellation window for clients
  if (isOwner && !isStaff) {
    const hoursUntilAppointment = differenceInHours(
      appointment.startAt,
      new Date(),
    );
    if (hoursUntilAppointment < config.CANCELLATION_HOURS_LIMIT) {
      throw new CancellationWindowError();
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", cancellationReason: reason },
  });

  // Remove scheduled reminder
  const job = await reminderQueue.getJob(`reminder-${appointmentId}`);
  if (job) await job.remove();

  // Invalidate cache
  const dateStr = appointment.startAt.toISOString().split("T")[0];
  const keys = await redis.keys(`availability:${dateStr}:${appointment.staffId}:*`);
  if (keys.length > 0) await redis.del(...keys);

  await redis.publish(
    `availability:${dateStr}:${appointment.staffId}`,
    JSON.stringify({ type: "slot_freed", startAt: appointment.startAt.toISOString() }),
  );

  return updated;
}
