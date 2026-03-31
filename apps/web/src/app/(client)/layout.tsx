import Link from "next/link";

const NAV_ITEMS = [
  { href: "/client/dashboard", label: "Mis turnos" },
  { href: "/client/history", label: "Historial" },
  { href: "/client/profile", label: "Mi perfil" },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">
            Barbers
          </Link>
          <nav className="flex items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/book"
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm text-white font-semibold hover:bg-brand-700 transition-colors"
            >
              Nuevo turno
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
