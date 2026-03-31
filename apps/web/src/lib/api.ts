const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:4000")
    : "";

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  services: {
    list: () => apiFetch<any[]>("/services"),
    get: (id: string) => apiFetch<any>(`/services/${id}`),
  },
  staff: {
    list: () => apiFetch<any[]>("/staff"),
    get: (id: string) => apiFetch<any>(`/staff/${id}`),
    reviews: (id: string) => apiFetch<any>(`/staff/${id}/reviews`),
  },
  availability: {
    slots: (staffId: string, serviceId: string, date: string) =>
      apiFetch<any[]>(`/availability?staffId=${staffId}&serviceId=${serviceId}&date=${date}`),
  },
  appointments: {
    list: () => apiFetch<any[]>("/appointments"),
    get: (id: string) => apiFetch<any>(`/appointments/${id}`),
    book: (data: { staffId: string; serviceId: string; startAt: string; notes?: string }) =>
      apiFetch<any>("/appointments", { method: "POST", body: JSON.stringify(data) }),
    cancel: (id: string, reason?: string) =>
      apiFetch<any>(`/appointments/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
    reschedule: (id: string, startAt: string) =>
      apiFetch<any>(`/appointments/${id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({ startAt }),
      }),
    checkout: (id: string) =>
      apiFetch<{ init_point?: string; sandbox_init_point?: string; depositAmount?: number; skip?: boolean }>(
        `/appointments/${id}/checkout`,
        { method: "POST" },
      ),
  },
  reviews: {
    create: (data: {
      appointmentId: string;
      rating: number;
      comment?: string;
    }) =>
      apiFetch<any>("/reviews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  client: {
    profile: () => apiFetch<any>("/client/profile"),
  },
};
