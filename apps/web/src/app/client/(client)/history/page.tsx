"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useSession } from "@/lib/auth-client";
import { ReviewModal } from "@/components/client/ReviewModal";

interface HistoryAppointment {
  id: string;
  startAt: string;
  status: string;
  service: { name: string; durationMinutes: number; price: number };
  staff: { user: { name: string } };
  review: { id: string; rating: number; comment: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Ausente",
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "text-green-700 bg-green-50",
  CANCELLED: "text-gray-500 bg-gray-50",
  NO_SHOW: "text-red-600 bg-red-50",
};

export default function HistoryPage() {
  const { data: sessionData } = useSession();
  const [appointments, setAppointments] = useState<HistoryAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<HistoryAppointment | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/v1/client/appointments/history", {
        credentials: "include",
      });
      if (res.ok) setAppointments(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionData) load();
  }, [sessionData]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Historial</h1>

        {appointments.length === 0 ? (
          <p className="text-gray-400 py-10 text-center">
            No hay turnos en tu historial todavía.
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const start = parseISO(appt.startAt);
              return (
                <div
                  key={appt.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{appt.service.name}</p>
                      <p className="text-sm text-gray-500">con {appt.staff.user.name}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUS_STYLES[appt.status]}`}
                    >
                      {STATUS_LABELS[appt.status]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 capitalize">
                    {format(start, "EEEE d 'de' MMMM yyyy · HH:mm", { locale: es })}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-700">
                      ${appt.service.price.toLocaleString("es-AR")}
                    </span>

                    {appt.status === "COMPLETED" && (
                      appt.review ? (
                        <div className="flex items-center gap-1 text-sm text-yellow-500">
                          {"★".repeat(appt.review.rating)}
                          {"☆".repeat(5 - appt.review.rating)}
                          <span className="text-gray-400 ml-1 text-xs">Tu reseña</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewTarget(appt)}
                          className="text-sm text-brand-600 font-medium hover:underline"
                        >
                          Dejar reseña
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          appointmentId={reviewTarget.id}
          serviceName={reviewTarget.service.name}
          staffName={reviewTarget.staff.user.name}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null);
            load();
          }}
        />
      )}
    </>
  );
}
