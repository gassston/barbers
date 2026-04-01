import { StaffDetailClient } from "./StaffDetailClient";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar staff — PeluQ'arte Admin" };

async function getStaff(id: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/admin/staff-management/${id}`,
    { cache: "no-store", headers: { Cookie: cookieHeader } },
  );
  if (!res.ok) return null;
  return res.json();
}

async function getServices() {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/services`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, services] = await Promise.all([
    getStaff(id),
    getServices(),
  ]);

  if (!staff) {
    return <main className="p-8 text-gray-400">Profesional no encontrado.</main>;
  }

  return <StaffDetailClient staff={staff} services={services} />;
}
