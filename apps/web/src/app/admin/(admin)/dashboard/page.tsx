import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — PeluQ'arte Admin" };

async function getDashboard() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/admin/dashboard`,
    { cache: "no-store", headers: { Cookie: cookieHeader } },
  );
  if (!res.ok) return null;
  return res.json();
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${
        accent ? "bg-brand-600 text-white" : "bg-white border border-gray-200"
      }`}
    >
      <p className={`text-sm mb-1 ${accent ? "opacity-75" : "text-gray-500"}`}>{label}</p>
      <p className={`text-3xl font-bold ${accent ? "" : "text-gray-900"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "opacity-60" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

const STATUS_PILL: Record<string, string> = {
  CONFIRMED: "bg-brand-100 text-brand-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default async function AdminDashboardPage() {
  const data = await getDashboard();

  if (!data) {
    return (
      <main className="p-8 text-gray-400">
        No se pudo cargar el dashboard. Verificá que la API esté corriendo.
      </main>
    );
  }

  const { today, week, upcomingToday } = data;

  return (
    <main className="p-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5 capitalize">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Today stats */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Hoy
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total turnos" value={today.total} accent />
          <StatCard label="Confirmados" value={today.confirmed} />
          <StatCard label="Completados" value={today.completed} />
          <StatCard
            label="Ausentes"
            value={today.noShow}
            sub={today.cancelled > 0 ? `${today.cancelled} cancelados` : undefined}
          />
        </div>
      </section>

      {/* Week stats */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Esta semana
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total turnos" value={week.total} />
          <StatCard label="Completados" value={week.completed} />
          <StatCard
            label="Revenue"
            value={`$${week.revenue.toLocaleString("es-AR")}`}
            accent
          />
          <StatCard
            label="Tasa de ausencia"
            value={`${week.noShowRate}%`}
            sub={`${week.noShows} ausentes`}
          />
        </div>
      </section>

      {/* Upcoming today */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Próximos turnos hoy
          </h2>
          <Link
            href="/admin/schedule"
            className="text-xs text-brand-600 font-medium hover:underline"
          >
            Ver agenda completa →
          </Link>
        </div>

        {upcomingToday.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center rounded-2xl border border-dashed border-gray-200">
            No hay más turnos pendientes por hoy.
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingToday.map((appt: any) => {
              const start = parseISO(appt.startAt);
              return (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 rounded-xl bg-white border border-gray-200 px-4 py-3"
                >
                  <div className="text-center min-w-[48px]">
                    <p className="font-bold text-sm">{format(start, "HH:mm")}</p>
                    <p className="text-xs text-gray-400">{appt.service.durationMinutes}m</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{appt.client.name}</p>
                    <p className="text-sm text-gray-500 truncate">{appt.service.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{appt.staff.user.name}</p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_PILL[appt.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {appt.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/admin/schedule", label: "Ver agenda" },
          { href: "/admin/reports", label: "Ver reportes" },
          { href: "/admin/staff", label: "Gestionar staff" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-700 transition-colors text-center"
          >
            {link.label}
          </Link>
        ))}
      </section>
    </main>
  );
}
