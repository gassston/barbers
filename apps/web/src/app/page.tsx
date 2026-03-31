import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight text-brand-700">
        Barbers
      </h1>
      <p className="text-lg text-gray-500">
        Reservá tu turno online en segundos.
      </p>
      <div className="flex gap-4">
        <Link
          href="/book"
          className="rounded-lg bg-brand-600 px-6 py-3 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Reservar turno
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Ingresar
        </Link>
      </div>
    </main>
  );
}
