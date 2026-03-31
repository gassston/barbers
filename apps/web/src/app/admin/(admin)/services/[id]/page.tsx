"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditServicePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: "30",
    price: "",
    category: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState(0);

  useEffect(() => {
    fetch(`/api/v1/admin/services`, { credentials: "include" })
      .then((r) => r.json())
      .then((services: any[]) => {
        const svc = services.find((s) => s.id === id);
        if (svc) {
          setForm({
            name: svc.name,
            description: svc.description ?? "",
            durationMinutes: String(svc.durationMinutes),
            price: String(svc.price),
            category: svc.category ?? "",
            isActive: svc.isActive,
          });
          setAppointments(svc._count?.appointments ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/services/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          durationMinutes: parseInt(form.durationMinutes),
          price: parseFloat(form.price),
          category: form.category || null,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error ?? "Error al guardar");
      }
      router.push("/admin/services");
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${form.name}"? ${appointments > 0 ? "Tiene turnos registrados — se desactivará en lugar de eliminarse." : "Esta acción no se puede deshacer."}`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/services/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al eliminar");
      }
      router.push("/admin/services");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6 max-w-xl">
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse mb-6" />
        <div className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
      </main>
    );
  }

  return (
    <main className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/services" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <h1 className="text-xl font-bold flex-1">Editar servicio</h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {deleting ? "Eliminando..." : appointments > 0 ? "Desactivar" : "Eliminar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="label">Nombre *</label>
          <input type="text" required {...field("name")} className="input mt-1" />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea rows={3} maxLength={500} {...field("description")} className="input mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Precio (ARS) *</label>
            <input type="number" required min="0" step="0.01" {...field("price")} className="input mt-1" />
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Servicio activo (visible para reservas)</label>
        </div>

        {appointments > 0 && (
          <p className="text-xs text-gray-400">{appointments} turnos históricos vinculados a este servicio.</p>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/services" className="flex-1 text-center rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </Link>
          <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </main>
  );
}
