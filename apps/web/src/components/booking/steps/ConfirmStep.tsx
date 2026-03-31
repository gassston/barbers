"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import type { ServiceDTO, StaffDTO, AvailableSlot } from "@barbers/shared";

interface Props {
  booking: {
    service: ServiceDTO;
    staff: StaffDTO;
    slot: AvailableSlot;
    date: string;
  };
  onBooked: (appointmentId: string) => void;
  onBack: () => void;
}

export function ConfirmStep({ booking, onBooked, onBack }: Props) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { service, staff, slot } = booking;
  const startDate = parseISO(slot.start);

  async function handleConfirm() {
    setError(null);
    setLoading(true);

    try {
      const appointment = await api.appointments.book({
        staffId: (staff as any).id,
        serviceId: service.id,
        startAt: slot.start,
        notes: notes.trim() || undefined,
      });

      const checkout = await api.appointments.checkout(appointment.id);

      if (checkout.skip) {
        // MP not configured — appointment confirmed directly
        onBooked(appointment.id);
      } else {
        // Redirect to Mercado Pago
        const url = checkout.init_point ?? checkout.sandbox_init_point;
        if (url) window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message ?? "No se pudo confirmar el turno. Intentá de nuevo.");
      setLoading(false);
    }
  }

  const deposit = Math.round(service.price * 0.2);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <h2 className="text-lg font-semibold">Confirmá tu turno</h2>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-brand-700 divide-y divide-brand-700 bg-brand-800">
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-400">Servicio</span>
          <span className="font-medium">{service.name}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-400">Profesional</span>
          <span className="font-medium">{(staff as any).user.name}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-400">Fecha</span>
          <span className="font-medium">
            {format(startDate, "EEEE d 'de' MMMM", { locale: es })}
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-400">Hora</span>
          <span className="font-medium">{format(startDate, "HH:mm")}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-400">Duración</span>
          <span className="font-medium">{service.durationMinutes} min</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-400">Precio total</span>
          <span className="font-medium text-gray-100">
            ${service.price.toLocaleString("es-AR")}
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 bg-brand-700">
          <span className="text-sm text-accent font-medium">Seña a abonar ahora (20%)</span>
          <span className="font-bold text-accent">
            ${deposit.toLocaleString("es-AR")}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          className="input"
          placeholder="Ej: quiero el fade bien bajo..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full rounded-xl bg-brand-500 px-4 py-3 text-white font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors"
      >
        {loading ? "Procesando..." : `Confirmar y pagar seña $${deposit.toLocaleString("es-AR")}`}
      </button>
    </div>
  );
}
