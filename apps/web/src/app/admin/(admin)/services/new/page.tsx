"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewServicePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: "30",
    price: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/services", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          durationMinutes: parseInt(form.durationMinutes),
          price: parseFloat(form.price),
          category: form.category || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? JSON.stringify(body?.error) ?? "Error al crear");
      }
      router.push("/admin/services");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/services" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <h1 className="text-xl font-bold">Nuevo servicio</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="label">Nombre *</label>
          <input type="text" required {...field("name")} className="input mt-1" placeholder="Corte de caballero" />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea rows={3} maxLength={500} {...field("description")} className="input mt-1" placeholder="Descripción breve del servicio..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Precio (ARS) *</label>
            <input type="number" required min="0" step="0.01" {...field("price")} className="input mt-1" placeholder="3500" />
          </div>
          <div>
            <label className="label">Duración (min) *</label>
            <input type="number" required min="5" max="480" {...field("durationMinutes")} className="input mt-1" />
          </div>
        </div>

        <div>
          <label className="label">Categoría</label>
          <input type="text" {...field("category")} className="input mt-1" placeholder="Corte, Color, Barba..." />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/services" className="flex-1 text-center rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {loading ? "Creando..." : "Crear servicio"}
          </button>
        </div>
      </form>
    </main>
  );
}
