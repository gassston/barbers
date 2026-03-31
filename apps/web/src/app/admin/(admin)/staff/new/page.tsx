"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewStaffPage() {
  const router = useRouter();
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    specialties: "",
  });
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/services", { credentials: "include" })
      .then((r) => r.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  function toggleService(id: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/staff-management", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
          serviceIds: [...selectedServices],
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? "Error al crear el profesional");
      }
      router.push("/admin/staff");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <main className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/staff" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <h1 className="text-xl font-bold">Agregar profesional</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Nombre completo *</label>
            <input type="text" required {...field("name")} className="input mt-1" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Email *</label>
            <input type="email" required {...field("email")} className="input mt-1" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Contraseña *</label>
            <input type="password" required minLength={6} {...field("password")} className="input mt-1" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Teléfono</label>
            <input type="tel" {...field("phone")} className="input mt-1" placeholder="+5492611234567" />
          </div>
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea rows={3} maxLength={500} {...field("bio")} className="input mt-1" />
        </div>

        <div>
          <label className="label">Especialidades (separadas por coma)</label>
          <input type="text" {...field("specialties")} className="input mt-1" placeholder="fade, corte clásico, barba" />
        </div>

        {services.length > 0 && (
          <div>
            <label className="label mb-2 block">Servicios que realiza</label>
            <div className="space-y-1.5">
              {services.map((svc) => (
                <label key={svc.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedServices.has(svc.id)} onChange={() => toggleService(svc.id)} className="rounded" />
                  {svc.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/staff" className="flex-1 text-center rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {loading ? "Creando..." : "Crear profesional"}
          </button>
        </div>
      </form>
    </main>
  );
}
