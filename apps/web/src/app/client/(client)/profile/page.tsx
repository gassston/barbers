"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  clientProfile: {
    loyaltyPoints: number;
    totalVisits: number;
    loyaltyEvents: {
      pointsDelta: number;
      reason: string;
      createdAt: string;
    }[];
  } | null;
  stats: Record<string, number>;
}

const LOYALTY_REASON_LABELS: Record<string, string> = {
  APPOINTMENT_COMPLETED: "Turno completado",
  REFERRAL: "Referido",
  MANUAL_ADJUSTMENT: "Ajuste manual",
  REDEEMED: "Puntos canjeados",
};

export default function ProfilePage() {
  const { data: sessionData } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionData) {
      api.client.profile().then((data: Profile) => {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone ?? "");
      }).finally(() => setLoading(false));
    }
  }, [sessionData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/v1/client/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const updated = await res.json();
      setProfile((p) => p ? { ...p, ...updated } : p);
      setEditing(false);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!profile) return null;

  const points = profile.clientProfile?.loyaltyPoints ?? 0;
  const totalVisits = profile.clientProfile?.totalVisits ?? 0;
  const completed = profile.stats["COMPLETED"] ?? 0;
  const cancelled = profile.stats["CANCELLED"] ?? 0;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl">
            {profile.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+5492611234567" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Teléfono</span>
              <span>{profile.phone ?? "—"}</span>
            </div>
            <button onClick={() => setEditing(true)} className="text-sm text-brand-600 font-medium hover:underline">
              Editar datos
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-brand-600 text-white p-6">
        <p className="text-sm opacity-80 mb-1">Puntos de fidelidad</p>
        <p className="text-5xl font-bold">{points.toLocaleString("es-AR")}</p>
        <p className="text-sm opacity-70 mt-1">
          {points >= 500
            ? "¡Podés canjear en tu próximo turno!"
            : `Te faltan ${500 - points} puntos para tu próximo beneficio`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Visitas totales", value: totalVisits },
          { label: "Completados", value: completed },
          { label: "Cancelados", value: cancelled },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {(profile.clientProfile?.loyaltyEvents?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-400">
            Movimiento de puntos
          </h2>
          <div className="space-y-2">
            {profile.clientProfile!.loyaltyEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{LOYALTY_REASON_LABELS[ev.reason] ?? ev.reason}</span>
                <span className={`font-semibold ${ev.pointsDelta >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {ev.pointsDelta >= 0 ? "+" : ""}{ev.pointsDelta}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
