import { z } from "zod";

export const createAppointmentSchema = z.object({
  staffId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  startAt: z.string().datetime(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
