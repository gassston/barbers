import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Servicios — PeluQ'arte Admin" };

async function getServices() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/admin/services`,
    { cache: "no-store", headers: { Cookie: cookieHeader } },
  );
  if (!res.ok) return [];
  return res.json();
}

const CATEGORY_COLORS: Record<string, string> = {
  Corte: "bg-blue-100 text-blue-700",
  Color: "bg-purple-100 text-purple-700",
  Barba: "bg-amber-100 text-amber-700",
};

export default async function ServicesPage() {
  const services = await getServices();

  const byCategory = services.reduce((acc: Record<string, any[]>, svc: any) => {
    const cat = svc.category ?? "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <Link
          href="/admin/services/new"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          + Agregar
        </Link>
      </div>

      {services.length === 0 && (
        <p className="text-gray-400 text-center py-12">No hay servicios registrados todavía.</p>
      )}

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {category}
          </h2>
          <div className="space-y-2">
            {(items as any[]).map((svc) => (
              <Link
                key={svc.id}
                href={`/admin/services/${svc.id}`}
                className={`flex items-center gap-4 rounded-xl border bg-white px-4 py-3 hover:border-brand-400 hover:shadow-sm transition-all ${
                  !svc.isActive ? "opacity-50" : "border-gray-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{svc.name}</p>
                    {!svc.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                    {svc.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[svc.category] ?? "bg-gray-100 text-gray-500"}`}>
                        {svc.category}
                      </span>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-sm text-gray-400 truncate mt-0.5">{svc.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-brand-700">${svc.price.toLocaleString("es-AR")}</p>
                  <p className="text-xs text-gray-400">{svc.durationMinutes} min</p>
                </div>
                <div className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  {svc._count.staffServices} prof · {svc._count.appointments} turnos
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
