import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Staff — PeluQ'arte Admin" };

async function getStaff() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/admin/staff-management`,
    { cache: "no-store", headers: { Cookie: cookieHeader } },
  );
  if (!res.ok) return [];
  return res.json();
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function StaffListPage() {
  const staffList = await getStaff();

  return (
    <main className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profesionales</h1>
        <Link
          href="/admin/staff/new"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          + Agregar
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {staffList.map((staff: any) => {
          const activeDays = staff.workingHours
            .filter((h: any) => h.isActive)
            .map((h: any) => DAY_NAMES[h.dayOfWeek])
            .join(", ");

          const monthTotal = Object.values(staff.monthStats as Record<string, number>)
            .reduce((s: number, v: number) => s + v, 0);
          const monthCompleted = (staff.monthStats["COMPLETED"] as number) ?? 0;

          return (
            <Link
              key={staff.id}
              href={`/admin/staff/${staff.id}`}
              className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow-sm transition-all space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                  {staff.user.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{staff.user.name}</p>
                  <p className="text-sm text-gray-400 truncate">{staff.user.email}</p>
                </div>
                {staff._count.timeOff > 0 && (
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full shrink-0">
                    {staff._count.timeOff} franco{staff._count.timeOff > 1 ? "s" : ""} pendiente{staff._count.timeOff > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {staff.bio && (
                <p className="text-sm text-gray-500 line-clamp-2">{staff.bio}</p>
              )}

              <div className="flex flex-wrap gap-1">
                {staff.specialties.slice(0, 4).map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                <span className="text-gray-400 text-xs">{activeDays || "Sin horarios"}</span>
                <span className="text-gray-600">
                  <span className="font-semibold text-green-600">{monthCompleted}</span>
                  <span className="text-gray-400">/{monthTotal} este mes</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {staffList.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          No hay profesionales registrados todavía.
        </p>
      )}
    </main>
  );
}
