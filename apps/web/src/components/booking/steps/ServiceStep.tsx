"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ServiceDTO } from "@barbers/shared";

interface Props {
  onSelect: (service: ServiceDTO) => void;
}

export function ServiceStep({ onSelect }: Props) {
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.services
      .list()
      .then(setServices)
      .catch(() => setError("No se pudieron cargar los servicios."))
      .finally(() => setLoading(false));
  }, []);

  // Group by category
  const byCategory = services.reduce<Record<string, ServiceDTO[]>>((acc, s) => {
    const cat = s.category ?? "Otros";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">¿Qué servicio querés?</h2>
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((service) => (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left hover:border-brand-500 hover:bg-brand-50 transition-colors group"
              >
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-brand-700">
                    {service.name}
                  </p>
                  {service.description && (
                    <p className="text-sm text-gray-400 mt-0.5">{service.description}</p>
                  )}
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="font-bold text-brand-700">
                    ${service.price.toLocaleString("es-AR")}
                  </p>
                  <p className="text-xs text-gray-400">{service.durationMinutes} min</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
