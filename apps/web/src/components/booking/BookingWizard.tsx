"use client";

import { useState } from "react";
import { ServiceStep } from "./steps/ServiceStep";
import { StaffStep } from "./steps/StaffStep";
import { SlotStep } from "./steps/SlotStep";
import { ConfirmStep } from "./steps/ConfirmStep";
import type { ServiceDTO, StaffDTO, AvailableSlot } from "@barbers/shared";

type Step = "service" | "staff" | "slot" | "confirm" | "done";

interface BookingState {
  service: ServiceDTO | null;
  staff: StaffDTO | null;
  slot: AvailableSlot | null;
  date: string | null;
}

const STEPS: Step[] = ["service", "staff", "slot", "confirm"];
const STEP_LABELS: Record<Step, string> = {
  service: "Servicio",
  staff: "Profesional",
  slot: "Horario",
  confirm: "Confirmar",
  done: "Listo",
};

export function BookingWizard() {
  const [step, setStep] = useState<Step>("service");
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    staff: null,
    slot: null,
    date: null,
  });
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  function goBack() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function selectService(service: ServiceDTO) {
    setBooking((b) => ({ ...b, service, staff: null, slot: null, date: null }));
    setStep("staff");
  }

  function selectStaff(staff: StaffDTO) {
    setBooking((b) => ({ ...b, staff, slot: null, date: null }));
    setStep("slot");
  }

  function selectSlot(slot: AvailableSlot, date: string) {
    setBooking((b) => ({ ...b, slot, date }));
    setStep("confirm");
  }

  function onBooked(id: string) {
    setAppointmentId(id);
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-5xl text-accent">✓</div>
        <h2 className="text-2xl font-bold text-accent">¡Turno confirmado!</h2>
        <p className="text-gray-400">
          Vas a recibir un email de confirmación en breve.
        </p>
        <p className="text-xs text-gray-500">ID: {appointmentId}</p>
        <a
          href="/client/dashboard"
          className="inline-block mt-4 rounded-lg bg-brand-500 px-6 py-2.5 text-white font-semibold hover:bg-brand-600 transition-colors"
        >
          Ver mis turnos
        </a>
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(step);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold
                ${i < currentIdx ? "bg-brand-500 text-white" : ""}
                ${i === currentIdx ? "bg-brand-700 text-accent ring-2 ring-brand-500" : ""}
                ${i > currentIdx ? "bg-brand-800 text-gray-500" : ""}
              `}
            >
              {i < currentIdx ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i === currentIdx ? "font-semibold text-gray-100" : "text-gray-500"
              }`}
            >
              {STEP_LABELS[s]}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${i < currentIdx ? "bg-brand-500" : "bg-brand-700"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === "service" && <ServiceStep onSelect={selectService} />}
      {step === "staff" && booking.service && (
        <StaffStep service={booking.service} onSelect={selectStaff} onBack={goBack} />
      )}
      {step === "slot" && booking.service && booking.staff && (
        <SlotStep
          service={booking.service}
          staff={booking.staff}
          onSelect={selectSlot}
          onBack={goBack}
        />
      )}
      {step === "confirm" && booking.service && booking.staff && booking.slot && (
        <ConfirmStep
          booking={booking as Required<BookingState>}
          onBooked={onBooked}
          onBack={goBack}
        />
      )}
    </div>
  );
}
