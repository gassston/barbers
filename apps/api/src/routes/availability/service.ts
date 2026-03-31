import { addMinutes, format, isWithinInterval, parseISO, setHours, setMinutes } from "date-fns";
import { prisma } from "../../lib/prisma.js";

const SLOT_INTERVAL_MINUTES = 15;

export interface AvailableSlot {
  start: string; // ISO string
  end: string;
}

/**
 * Returns available time slots for a given staff + service on a given date.
 * Takes into account:
 *  - Staff working hours for that day of week
 *  - Staff time-off
 *  - Existing confirmed/pending appointments
 */
export async function getAvailableSlots(params: {
  staffId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
}): Promise<AvailableSlot[]> {
  const { staffId, serviceId, date } = params;

  const targetDate = parseISO(date);
  const dayOfWeek = targetDate.getDay();

  // Load all required data in parallel
  const [staffService, workingHours, timeOffList, existingAppointments] =
    await Promise.all([
      prisma.staffService.findFirst({
        where: { staffId, serviceId },
        include: { service: true },
      }),
      prisma.workingHours.findFirst({
        where: { staffId, dayOfWeek, isActive: true },
      }),
      prisma.timeOff.findMany({
        where: {
          staffId,
          date: targetDate,
          approved: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          staffId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startAt: {
            gte: new Date(`${date}T00:00:00`),
            lt: new Date(`${date}T23:59:59`),
          },
        },
      }),
    ]);

  if (!workingHours) return [];

  const durationMinutes =
    staffService?.customDuration ?? staffService?.service.durationMinutes ?? 30;

  // Full-day time-off check
  const hasFullDayOff = timeOffList.some(
    (t) => !t.startTime && !t.endTime,
  );
  if (hasFullDayOff) return [];

  // Build blocked intervals from time-off and appointments
  const blockedIntervals: Array<{ start: Date; end: Date }> = [];

  for (const t of timeOffList) {
    if (t.startTime && t.endTime) {
      blockedIntervals.push({
        start: parseTimeOnDate(targetDate, t.startTime),
        end: parseTimeOnDate(targetDate, t.endTime),
      });
    }
  }

  for (const appt of existingAppointments) {
    blockedIntervals.push({ start: appt.startAt, end: appt.endAt });
  }

  // Generate slots
  const dayStart = parseTimeOnDate(targetDate, workingHours.startTime);
  const dayEnd = parseTimeOnDate(targetDate, workingHours.endTime);
  const slots: AvailableSlot[] = [];
  const now = new Date();

  let cursor = dayStart;
  while (cursor < dayEnd) {
    const slotEnd = addMinutes(cursor, durationMinutes);

    if (slotEnd > dayEnd) break;
    if (cursor <= now) {
      cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
      continue;
    }

    const isBlocked = blockedIntervals.some(
      (interval) =>
        isWithinInterval(cursor, interval) ||
        isWithinInterval(addMinutes(slotEnd, -1), interval) ||
        (cursor <= interval.start && slotEnd >= interval.end),
    );

    if (!isBlocked) {
      slots.push({
        start: cursor.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
  }

  return slots;
}

function parseTimeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return setMinutes(setHours(new Date(date), hours), minutes);
}
