"use client";

import { useState, useTransition } from "react";
import { addDays, addWeeks, format, parseISO, subDays, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

type View = "day" | "week";

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  client: { name: string; phone: string | null };
  staff: { user: { name: string } };
  service: { name: string; durationMinutes: number };
}

interface Props {
  date: string;
  view: View;
  appointments: Appointment[];
  staffList: { id: string; user: { name: string } }[];
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-brand-100 border-brand-400 text-brand-800",
  PENDING: "bg-yellow-50 border-yellow-400 text-yellow-800",
  COMPLETED: "bg-green-50 border-green-400 text-green-800",
  CANCELLED: "bg-gray-100 border-gray-300 text-gray-500",
  NO_SHOW: "bg-red-50 border-red-300 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Ausente",
};

export function ScheduleView({ date, view, appointments, staffList }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const anchor = new Date(`${date}T00:00:00`);

  function navigate(newDate: Date, newView: View = view) {
    startTransition(() => {
      router.push(
        `/admin/schedule?date=${format(newDate, "yyyy-MM-dd")}&view=${newView}`,
      );
    });
  }

  function prev() {
    navigate(view === "day" ? subDays(anchor, 1) : subWeeks(anchor, 1));
  }

  function next() {
    navigate(view === "day" ? addDays(anchor, 1) : addWeeks(anchor, 1));
  }

  function today() {
    navigate(new Date());
  }

  const dateLabel =
    view === "day"
      ? format(anchor, "EEEE d 'de' MMMM yyyy", { locale: es })
      : `Semana del ${format(anchor, "d MMM", { locale: es })}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            ←
          </button>
          <button
            onClick={today}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Hoy
          </button>
          <button
            onClick={next}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            →
          </button>
          <h2 className="text-base font-semibold capitalize ml-2">
            {isPending ? "Cargando..." : dateLabel}
          </h2>
        </div>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(["day", "week"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => navigate(anchor, v)}
              className={`px-4 py-1.5 text-sm transition-colors ${
                view === v
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {v === "day" ? "Día" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const count = appointments.filter((a) => a.status === status).length;
          return (
            <div
              key={status}
              className={`rounded-xl border px-4 py-3 text-center ${STATUS_COLORS[status]}`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Appointments list */}
      {appointments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No hay turnos para este período.
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((appt) => {
            const start = parseISO(appt.startAt);
            const end = parseISO(appt.endAt);
            return (
              <div
                key={appt.id}
                className={`flex items-start gap-4 rounded-xl border px-4 py-3 ${STATUS_COLORS[appt.status]}`}
              >
                <div className="shrink-0 text-center min-w-[48px]">
                  <p className="font-bold text-base">{format(start, "HH:mm")}</p>
                  <p className="text-xs opacity-70">{format(end, "HH:mm")}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{appt.client.name}</p>
                  <p className="text-sm opacity-80">{appt.service.name}</p>
                  <p className="text-xs opacity-60">con {appt.staff.user.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-medium opacity-80">
                    {STATUS_LABELS[appt.status]}
                  </span>
                  {appt.client.phone && (
                    <p className="text-xs opacity-60 mt-1">{appt.client.phone}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
