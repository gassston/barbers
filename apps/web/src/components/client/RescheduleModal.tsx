"use client";

import { useState, useEffect } from "react";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import type { AvailableSlot } from "@barbers/shared";

interface Appointment {
  id: string;
  service: { id: string; durationMinutes: number };
  staff: { id: string; user: { name: string } };
}

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onRescheduled: () => void;
}

const TODAY = startOfDay(new Date());

export function RescheduleModal({ appointment, onClose, onRescheduled }: Props) {
  const [selectedDate, setSelectedDate] = useState(format(addDays(TODAY, 1), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    api.availability
      .slots(appointment.staff.id, appointment.service.id, selectedDate)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, appointment.staff.id, appointment.service.id]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setError(null);
    setSubmitLoading(true);
    try {
      await api.appointments.reschedule(appointment.id, selectedSlot);
      onRescheduled();
    } catch (err: any) {
      setError(err.message);
      setSubmitLoading(false);
    }
  }

  const dateOptions = Array.from({ length: 30 }, (_, i) =>
    format(addDays(TODAY, i + 1), "yyyy-MM-dd"),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reagendar turno</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500">
          con <strong>{appointment.staff.user.name}</strong>
        </p>

        {/* Date selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {dateOptions.map((d) => (
              <option key={d} value={d}>
                {format(parseISO(d), "EEEE d 'de' MMMM", { locale: es })}
              </option>
            ))}
          </select>
        </div>

        {/* Slot selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horario
          </label>
          {slotsLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              Sin disponibilidad para este día.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {slots.map((slot) => {
                const time = format(parseISO(slot.start), "HH:mm");
                const selected = selectedSlot === slot.start;
                return (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`rounded-lg py-2 text-sm font-medium border transition-colors
                      ${
                        selected
                          ? "bg-brand-600 text-white border-brand-600"
                          : "border-gray-200 text-gray-700 hover:border-brand-400"
                      }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || submitLoading}
            className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {submitLoading ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
