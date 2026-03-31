"use client";

import { useEffect, useState } from "react";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import type { ServiceDTO, StaffDTO, AvailableSlot } from "@barbers/shared";

interface Props {
  service: ServiceDTO;
  staff: StaffDTO;
  onSelect: (slot: AvailableSlot, date: string) => void;
  onBack: () => void;
}

const TODAY = startOfDay(new Date());
const MAX_DAYS_AHEAD = 30;

export function SlotStep({ service, staff, onSelect, onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(TODAY);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.availability
      .slots((staff as any).id, service.id, dateStr)
      .then(setSlots)
      .catch(() => setError("No se pudo cargar la disponibilidad."))
      .finally(() => setLoading(false));
  }, [dateStr, (staff as any).id, service.id]);

  // Generate date options (next 30 days)
  const dateOptions = Array.from({ length: MAX_DAYS_AHEAD }, (_, i) =>
    addDays(TODAY, i),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <h2 className="text-lg font-semibold">Elegí fecha y hora</h2>
      </div>

      {/* Date picker — horizontal scroll */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {dateOptions.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center rounded-xl px-3 py-2 text-sm border transition-colors
                  ${
                    isSelected
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-400"
                  }`}
              >
                <span className="text-xs uppercase">
                  {format(date, "EEE", { locale: es })}
                </span>
                <span className="font-bold text-base">{format(date, "d")}</span>
                <span className="text-xs">{format(date, "MMM", { locale: es })}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        {loading && (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && slots.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">
            No hay turnos disponibles para este día.
          </p>
        )}

        {!loading && !error && slots.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => {
              const time = format(parseISO(slot.start), "HH:mm");
              return (
                <button
                  key={slot.start}
                  onClick={() => onSelect(slot, dateStr)}
                  className="rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
