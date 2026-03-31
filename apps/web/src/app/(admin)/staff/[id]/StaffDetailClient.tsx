"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WORK_DAYS = [1, 2, 3, 4, 5, 6]; // Mon–Sat

interface WorkingHour {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface TimeOff {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  approved: boolean;
}

interface StaffService {
  serviceId: string;
  service: { id: string; name: string };
}

interface Staff {
  id: string;
  bio: string | null;
  specialties: string[];
  instagramUrl: string | null;
  acceptsOnlineBooking: boolean;
  commissionPct: number;
  user: { id: string; name: string; email: string; phone: string | null; image: string | null };
  workingHours: WorkingHour[];
  staffServices: StaffService[];
  timeOff: TimeOff[];
}

async function patchJSON(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function putJSON(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function postJSON(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function StaffDetailClient({
  staff: initialStaff,
  services,
}: {
  staff: Staff;
  services: { id: string; name: string }[];
}) {
  const [staff, setStaff] = useState(initialStaff);
  const [tab, setTab] = useState<"profile" | "hours" | "services" | "timeoff">("profile");

  // Profile form
  const [bio, setBio] = useState(staff.bio ?? "");
  const [specialties, setSpecialties] = useState(staff.specialties.join(", "));
  const [instagram, setInstagram] = useState(staff.instagramUrl ?? "");
  const [acceptsOnline, setAcceptsOnline] = useState(staff.acceptsOnlineBooking);
  const [commission, setCommission] = useState(staff.commissionPct.toString());
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState(false);

  // Working hours form
  const [hours, setHours] = useState<WorkingHour[]>(() => {
    const map = Object.fromEntries(
      staff.workingHours.map((h) => [h.dayOfWeek, h]),
    );
    return WORK_DAYS.map((d) => map[d] ?? { dayOfWeek: d, startTime: "09:00", endTime: "18:00", isActive: false });
  });
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [hoursOk, setHoursOk] = useState(false);

  // Services form
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(staff.staffServices.map((s) => s.serviceId)),
  );
  const [servicesSaving, setServicesSaving] = useState(false);

  // Time-off form
  const [timeoffs, setTimeoffs] = useState<TimeOff[]>(staff.timeOff);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newReason, setNewReason] = useState("");
  const [toSaving, setToSaving] = useState(false);
  const [toError, setToError] = useState<string | null>(null);

  const base = `/api/v1/admin/staff-management/${staff.id}`;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileOk(false);
    setProfileSaving(true);
    try {
      await patchJSON(base, {
        bio: bio || undefined,
        specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
        instagramUrl: instagram || "",
        acceptsOnlineBooking: acceptsOnline,
        commissionPct: parseFloat(commission) || 0,
      });
      setProfileOk(true);
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveHours(e: React.FormEvent) {
    e.preventDefault();
    setHoursError(null);
    setHoursOk(false);
    setHoursSaving(true);
    try {
      await putJSON(`${base}/working-hours`, hours.filter((h) => h.isActive));
      setHoursOk(true);
    } catch (err: any) {
      setHoursError(err.message);
    } finally {
      setHoursSaving(false);
    }
  }

  async function saveServices() {
    setServicesSaving(true);
    try {
      await putJSON(`${base}/services`, { serviceIds: [...selectedServices] });
    } finally {
      setServicesSaving(false);
    }
  }

  function toggleService(id: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateHour(dayOfWeek: number, field: keyof WorkingHour, value: string | boolean) {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h)),
    );
  }

  async function addTimeOff(e: React.FormEvent) {
    e.preventDefault();
    setToError(null);
    setToSaving(true);
    try {
      const item = await postJSON(`${base}/time-off`, {
        date: newDate,
        startTime: newStartTime || undefined,
        endTime: newEndTime || undefined,
        reason: newReason || undefined,
      });
      setTimeoffs((prev) => [item, ...prev]);
      setNewDate("");
      setNewStartTime("");
      setNewEndTime("");
      setNewReason("");
    } catch (err: any) {
      setToError(err.message);
    } finally {
      setToSaving(false);
    }
  }

  async function approveTimeOff(timeOffId: string, approved: boolean) {
    await patchJSON(`${base}/time-off/${timeOffId}/approve`, { approved });
    setTimeoffs((prev) =>
      prev.map((t) => (t.id === timeOffId ? { ...t, approved } : t)),
    );
  }

  const tabs = [
    { key: "profile", label: "Perfil" },
    { key: "hours", label: "Horarios" },
    { key: "services", label: "Servicios" },
    { key: "timeoff", label: "Francos" },
  ] as const;

  return (
    <main className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/staff" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <div>
          <h1 className="text-xl font-bold">{staff.user.name}</h1>
          <p className="text-sm text-gray-400">{staff.user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <form onSubmit={saveProfile} className="space-y-4 bg-white rounded-2xl border border-gray-200 p-5">
          <div>
            <label className="label">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="input mt-1"
              placeholder="Descripción breve del profesional..."
            />
          </div>
          <div>
            <label className="label">Especialidades (separadas por coma)</label>
            <input
              type="text"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              className="input mt-1"
              placeholder="fade, corte clásico, barba"
            />
          </div>
          <div>
            <label className="label">Instagram URL</label>
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="input mt-1"
              placeholder="https://instagram.com/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Comisión (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="input mt-1"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptsOnline}
                  onChange={(e) => setAcceptsOnline(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Acepta reservas online</span>
              </label>
            </div>
          </div>
          {profileError && <p className="text-xs text-red-600">{profileError}</p>}
          {profileOk && <p className="text-xs text-green-600">Guardado correctamente.</p>}
          <button type="submit" disabled={profileSaving} className="btn-primary">
            {profileSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      )}

      {/* Working hours tab */}
      {tab === "hours" && (
        <form onSubmit={saveHours} className="space-y-3 bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-2">Activá los días laborables y configurá el horario.</p>
          {hours.map((h) => (
            <div key={h.dayOfWeek} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={h.isActive}
                onChange={(e) => updateHour(h.dayOfWeek, "isActive", e.target.checked)}
                className="rounded"
              />
              <span className="w-24 text-sm font-medium text-gray-700">
                {DAY_NAMES[h.dayOfWeek]}
              </span>
              <input
                type="time"
                value={h.startTime}
                disabled={!h.isActive}
                onChange={(e) => updateHour(h.dayOfWeek, "startTime", e.target.value)}
                className="input w-28 disabled:opacity-40"
              />
              <span className="text-gray-400 text-sm">a</span>
              <input
                type="time"
                value={h.endTime}
                disabled={!h.isActive}
                onChange={(e) => updateHour(h.dayOfWeek, "endTime", e.target.value)}
                className="input w-28 disabled:opacity-40"
              />
            </div>
          ))}
          {hoursError && <p className="text-xs text-red-600">{hoursError}</p>}
          {hoursOk && <p className="text-xs text-green-600">Horarios actualizados.</p>}
          <button type="submit" disabled={hoursSaving} className="btn-primary mt-2">
            {hoursSaving ? "Guardando..." : "Guardar horarios"}
          </button>
        </form>
      )}

      {/* Services tab */}
      {tab === "services" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <p className="text-sm text-gray-500">Seleccioná los servicios que realiza este profesional.</p>
          <div className="space-y-2">
            {services.map((svc: any) => (
              <label key={svc.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedServices.has(svc.id)}
                  onChange={() => toggleService(svc.id)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{svc.name}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  ${svc.price?.toLocaleString("es-AR")} · {svc.durationMinutes}min
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={saveServices}
            disabled={servicesSaving}
            className="btn-primary"
          >
            {servicesSaving ? "Guardando..." : "Guardar servicios"}
          </button>
        </div>
      )}

      {/* Time-off tab */}
      {tab === "timeoff" && (
        <div className="space-y-4">
          {/* Add new time-off */}
          <form
            onSubmit={addTimeOff}
            className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3"
          >
            <h3 className="font-semibold text-sm">Agregar franco / ausencia</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <label className="label">Fecha</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="label">Desde (opcional)</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="label">Hasta (opcional)</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="input mt-1"
                />
              </div>
            </div>
            <div>
              <label className="label">Motivo</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="input mt-1"
                placeholder="Vacaciones, enfermedad, etc."
              />
            </div>
            {toError && <p className="text-xs text-red-600">{toError}</p>}
            <button type="submit" disabled={toSaving} className="btn-primary">
              {toSaving ? "Agregando..." : "Agregar franco"}
            </button>
          </form>

          {/* List */}
          <div className="space-y-2">
            {timeoffs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Sin francos registrados.</p>
            )}
            {timeoffs.map((t) => (
              <div
                key={t.id}
                className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                  t.approved ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">
                    {format(parseISO(t.date), "EEEE d 'de' MMMM yyyy", { locale: es })}
                    {t.startTime && t.endTime && (
                      <span className="text-gray-500 font-normal">
                        {" "}{t.startTime}–{t.endTime}
                      </span>
                    )}
                  </p>
                  {t.reason && <p className="text-xs text-gray-500">{t.reason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!t.approved ? (
                    <button
                      onClick={() => approveTimeOff(t.id, true)}
                      className="text-xs text-green-700 font-medium hover:underline"
                    >
                      Aprobar
                    </button>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">Aprobado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
