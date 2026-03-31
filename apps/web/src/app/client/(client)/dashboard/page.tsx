"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { isFuture, parseISO } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { AppointmentCard } from "@/components/client/AppointmentCard";

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  service: { id: string; name: string; durationMinutes: number; price: number };
  staff: { id: string; user: { name: string; image: string | null } };
}

export default function ClientDashboardPage() {
  const { data: sessionData, isPending } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setError(null);
    try {
      const data = await api.appointments.list();
      setAppointments(data);
    } catch (err: any) {
      setError("No se pudieron cargar los turnos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && sessionData) {
      loadAppointments();
    }
  }, [isPending, sessionData, loadAppointments]);

  const upcoming = appointments.filter(
    (a) =>
      ["CONFIRMED", "PENDING"].includes(a.status) && isFuture(parseISO(a.startAt)),
  );

  if (isPending || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Necesitás iniciar sesión.</p>
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-5 py-2 text-white font-semibold hover:bg-brand-700"
        >
          Ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis turnos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Hola, {sessionData.user.name}
          </p>
        </div>
        <Link
          href="/book"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          + Nuevo turno
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {upcoming.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 mb-4">No tenés turnos próximos.</p>
          <Link
            href="/book"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm text-white font-semibold hover:bg-brand-700 transition-colors"
          >
            Reservar turno
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Próximos ({upcoming.length})
          </h2>
          {upcoming.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onUpdated={loadAppointments}
            />
          ))}
        </div>
      )}

      <div className="pt-2">
        <Link
          href="/client/history"
          className="text-sm text-brand-600 font-medium hover:underline"
        >
          Ver historial completo →
        </Link>
      </div>
    </div>
  );
}
