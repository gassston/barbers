"use client";

import { useEffect, useState } from "react";
import { format, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";

type Preset = "7d" | "30d" | "3m";

interface RevenueRow {
  date: string;
  revenue: number;
  completed: number;
  noShow: number;
  cancelled: number;
}

interface ServiceRow {
  serviceId: string;
  name: string;
  total: number;
  completed: number;
  revenue: number;
  noShow: number;
}

interface StaffRow {
  staffId: string;
  name: string;
  total: number;
  completed: number;
  noShow: number;
  revenue: number;
}

function getRange(preset: Preset): { from: string; to: string } {
  const to = format(new Date(), "yyyy-MM-dd");
  const from =
    preset === "7d"
      ? format(subDays(new Date(), 6), "yyyy-MM-dd")
      : preset === "30d"
      ? format(subDays(new Date(), 29), "yyyy-MM-dd")
      : format(subMonths(new Date(), 3), "yyyy-MM-dd");
  return { from, to };
}

async function fetchJSON(path: string) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

function BarChart({ data }: { data: RevenueRow[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="space-y-1.5">
      {data.map((row) => {
        const pct = (row.revenue / maxRevenue) * 100;
        const label =
          data.length <= 14
            ? format(new Date(row.date + "T12:00:00"), "d MMM", { locale: es })
            : format(new Date(row.date + "T12:00:00"), "d/M", { locale: es });
        return (
          <div key={row.date} className="flex items-center gap-3 group">
            <span className="text-xs text-gray-400 w-10 shrink-0 text-right">{label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative">
              <div
                className="h-full bg-brand-500 rounded-md transition-all duration-300"
                style={{ width: `${Math.max(pct, pct > 0 ? 1 : 0)}%` }}
              />
              {row.revenue > 0 && (
                <span className="absolute right-2 top-0 h-full flex items-center text-xs font-medium text-gray-600">
                  ${row.revenue.toLocaleString("es-AR")}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 w-12 shrink-0">{row.completed}t</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>("30d");
  const [groupBy, setGroupBy] = useState<"day" | "week">("day");
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [byService, setByService] = useState<ServiceRow[]>([]);
  const [byStaff, setByStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { from, to } = getRange(preset);
    const gb = preset === "3m" ? "week" : groupBy;
    setGroupBy(gb);
    setLoading(true);

    Promise.all([
      fetchJSON(`/api/v1/admin/reports/revenue?from=${from}&to=${to}&groupBy=${gb}`),
      fetchJSON(`/api/v1/admin/reports/by-service?from=${from}&to=${to}`),
      fetchJSON(`/api/v1/admin/reports/by-staff?from=${from}&to=${to}`),
    ]).then(([rev, svc, stf]) => {
      setRevenue(rev ?? []);
      setByService(svc ?? []);
      setByStaff(stf ?? []);
      setLoading(false);
    });
  }, [preset]);

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const totalCompleted = revenue.reduce((s, r) => s + r.completed, 0);
  const totalNoShow = revenue.reduce((s, r) => s + r.noShow, 0);
  const totalCancelled = revenue.reduce((s, r) => s + r.cancelled, 0);

  const presets: { key: Preset; label: string }[] = [
    { key: "7d", label: "7 días" },
    { key: "30d", label: "30 días" },
    { key: "3m", label: "3 meses" },
  ];

  return (
    <main className="p-6 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-4 py-1.5 text-sm transition-colors ${
                preset === p.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Revenue", value: `$${totalRevenue.toLocaleString("es-AR")}`, accent: true },
          { label: "Completados", value: totalCompleted },
          { label: "Ausentes", value: totalNoShow },
          { label: "Cancelados", value: totalCancelled },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl p-4 ${kpi.accent ? "bg-brand-600 text-white" : "bg-white border border-gray-200"}`}
          >
            <p className={`text-xs mb-1 ${kpi.accent ? "opacity-75" : "text-gray-500"}`}>
              {kpi.label}
            </p>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 rounded bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Revenue chart */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">Revenue por {groupBy === "day" ? "día" : "semana"}</h2>
            {revenue.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
            ) : (
              <BarChart data={revenue} />
            )}
          </section>

          {/* By service */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">Por servicio</h2>
            {byService.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2">Servicio</th>
                      <th className="text-right pb-2">Total</th>
                      <th className="text-right pb-2">Completados</th>
                      <th className="text-right pb-2">Revenue</th>
                      <th className="text-right pb-2">Ausentes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byService.map((row) => (
                      <tr key={row.serviceId} className="hover:bg-gray-50">
                        <td className="py-2.5 font-medium">{row.name}</td>
                        <td className="py-2.5 text-right text-gray-600">{row.total}</td>
                        <td className="py-2.5 text-right text-green-600">{row.completed}</td>
                        <td className="py-2.5 text-right font-medium text-brand-700">
                          ${row.revenue.toLocaleString("es-AR")}
                        </td>
                        <td className="py-2.5 text-right text-red-500">{row.noShow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* By staff */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">Por profesional</h2>
            {byStaff.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2">Profesional</th>
                      <th className="text-right pb-2">Total</th>
                      <th className="text-right pb-2">Completados</th>
                      <th className="text-right pb-2">Revenue</th>
                      <th className="text-right pb-2">Ausentes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byStaff.map((row) => (
                      <tr key={row.staffId} className="hover:bg-gray-50">
                        <td className="py-2.5 font-medium">{row.name}</td>
                        <td className="py-2.5 text-right text-gray-600">{row.total}</td>
                        <td className="py-2.5 text-right text-green-600">{row.completed}</td>
                        <td className="py-2.5 text-right font-medium text-brand-700">
                          ${row.revenue.toLocaleString("es-AR")}
                        </td>
                        <td className="py-2.5 text-right text-red-500">{row.noShow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
