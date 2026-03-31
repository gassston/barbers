"use client";

import { useState } from "react";
import { format, parseISO, isPast, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import { RescheduleModal } from "./RescheduleModal";

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  service: { id: string; name: string; durationMinutes: number; price: number };
  staff: {
    id: string;
    user: { name: string; image: string | null };
  };
}

interface Props {
  appointment: Appointment;
  onUpdated: () => void;
  cancellationHoursLimit?: number;
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-brand-50 text-brand-700 border-brand-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-gray-50 text-gray-400 border-gray-200",
  NO_SHOW: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Ausente",
};

export function AppointmentCard({
  appointment,
  onUpdated,
  cancellationHoursLimit = 24,
}: Props) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAt = parseISO(appointment.startAt);
  const isUpcoming = !isPast(startAt);
  const hoursUntil = differenceInHours(startAt, new Date());
  const canModify =
    isUpcoming &&
    ["CONFIRMED", "PENDING"].includes(appointment.status) &&
    hoursUntil >= cancellationHoursLimit;

  async function handleCancel() {
    if (!confirm("¿Confirmar cancelación del turno?")) return;
    setError(null);
    setCancelLoading(true);
    try {
      await api.appointments.cancel(appointment.id);
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <>
      <div
        className={`rounded-2xl border p-5 space-y-3 ${STATUS_STYLES[appointment.status]}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-base">{appointment.service.name}</p>
            <p className="text-sm opacity-75">con {appointment.staff.user.name}</p>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full border shrink-0">
            {STATUS_LABELS[appointment.status]}
          </span>
        </div>

        {/* Date/time */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="opacity-60">Fecha </span>
            <span className="font-medium capitalize">
              {format(startAt, "EEEE d 'de' MMMM", { locale: es })}
            </span>
          </div>
          <div>
            <span className="opacity-60">Hora </span>
            <span className="font-medium">{format(startAt, "HH:mm")}</span>
          </div>
          <div>
            <span className="opacity-60">{appointment.service.durationMinutes} min</span>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <p className="text-sm opacity-70 italic">"{appointment.notes}"</p>
        )}

        {/* Time warning */}
        {isUpcoming && hoursUntil < cancellationHoursLimit && hoursUntil > 0 && (
          <p className="text-xs opacity-70">
            Dentro de {hoursUntil}h — ya no es posible modificar
          </p>
        )}

        {/* Error */}
        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* Actions */}
        {canModify && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowReschedule(true)}
              className="flex-1 rounded-lg border border-current py-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Reagendar
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="flex-1 rounded-lg bg-white/60 border border-current py-1.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
            >
              {cancelLoading ? "Cancelando..." : "Cancelar"}
            </button>
          </div>
        )}
      </div>

      {showReschedule && (
        <RescheduleModal
          appointment={appointment}
          onClose={() => setShowReschedule(false)}
          onRescheduled={() => {
            setShowReschedule(false);
            onUpdated();
          }}
        />
      )}
    </>
  );
}
