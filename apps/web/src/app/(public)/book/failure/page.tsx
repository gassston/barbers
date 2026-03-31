import Link from "next/link";

export default function BookFailurePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-6xl">✗</div>
        <h1 className="text-2xl font-bold text-red-600">Pago no completado</h1>
        <p className="text-gray-600">
          El pago de la seña no pudo procesarse. Tu turno no fue confirmado.
        </p>
        <p className="text-sm text-gray-400">
          Podés intentarlo nuevamente o contactarnos para coordinar el pago.
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <Link
            href="/book"
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors"
          >
            Intentar de nuevo
          </Link>
          <Link
            href="/client/dashboard"
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Ver mis turnos
          </Link>
        </div>
      </div>
    </div>
  );
}
