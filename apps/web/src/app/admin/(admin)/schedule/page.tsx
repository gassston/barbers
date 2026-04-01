import { format } from "date-fns";
import { ScheduleView } from "@/components/admin/ScheduleView";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Agenda — PeluQ'arte Admin",
};

interface SearchParams {
  date?: string;
  view?: string;
  staffId?: string;
}

async function getSchedule(params: SearchParams) {
  const date = params.date ?? format(new Date(), "yyyy-MM-dd");
  const view = (params.view === "week" ? "week" : "day") as "day" | "week";
  const staffId = params.staffId;

  const qs = new URLSearchParams({ date, view });
  if (staffId) qs.set("staffId", staffId);

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  let res: Response;
  try {
    res = await fetch(
      `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/admin/schedule?${qs}`,
      { cache: "no-store", headers: { Cookie: cookieHeader } },
    );
  } catch {
    return { appointments: [], staff: [], date, view };
  }

  if (!res.ok) {
    return { appointments: [], staff: [], date, view };
  }

  const data = await res.json();
  return { ...data, date, view };
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { appointments, staff, date, view } = await getSchedule(await searchParams);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Agenda</h1>
      <ScheduleView
        date={date}
        view={view}
        appointments={appointments}
        staffList={staff}
      />
    </main>
  );
}
