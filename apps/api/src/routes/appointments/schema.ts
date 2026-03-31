import { z } from "zod";

export const createAppointmentSchema = z.object({
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  startAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  startAt: z.string().datetime(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
