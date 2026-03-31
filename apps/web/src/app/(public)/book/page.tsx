import { BookingWizard } from "@/components/booking/BookingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservar turno — PeluQ'arte",
};

export default function BookPage() {
  return (
    <main className="min-h-screen bg-brand-900 py-10">
      <div className="mx-auto max-w-xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest text-accent">PeluQ'arte</h1>
        </div>
        <div className="bg-brand-800 rounded-2xl border border-brand-700 p-6">
        <BookingWizard />
        </div>
      </div>
    </main>
  );
}
