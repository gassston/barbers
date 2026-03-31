import Link from "next/link";

export default function BookSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-6xl">✓</div>
        <h1 className="text-2xl font-bold text-brand-700">¡Pago recibido!</h1>
        <p className="text-gray-600">
          Tu seña fue procesada correctamente. El turno quedó confirmado.
        </p>
        <p className="text-sm text-gray-400">
          Vas a recibir un email de confirmación en breve.
        </p>
        <Link
          href="/client/dashboard"
          className="inline-block mt-4 rounded-lg bg-brand-600 px-6 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Ver mis turnos
        </Link>
      </div>
    </div>
  );
}
