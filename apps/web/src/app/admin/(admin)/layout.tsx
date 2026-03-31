import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/schedule", label: "Agenda" },
  { href: "/admin/staff", label: "Profesionales" },
  { href: "/admin/services", label: "Servicios" },
  { href: "/admin/reports", label: "Reportes" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-brand-700 bg-brand-800 flex flex-col">
        <div className="px-5 py-6 border-b border-brand-700">
          <Link href="/admin/schedule" className="text-xl font-bold text-accent tracking-wide">
            PeluQ'arte
          </Link>
          <p className="text-xs text-brand-400 mt-0.5">Panel admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-brand-700 hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-brand-700">
          <Link
            href="/api/auth/sign-out"
            className="flex items-center rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Salir
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-brand-900">{children}</div>
    </div>
  );
}
