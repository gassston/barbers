"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import type { ServiceDTO, StaffDTO } from "@barbers/shared";

interface Props {
  service: ServiceDTO;
  onSelect: (staff: StaffDTO) => void;
  onBack: () => void;
}

export function StaffStep({ service, onSelect, onBack }: Props) {
  const [staffList, setStaffList] = useState<StaffDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.staff
      .list()
      .then((all: any[]) =>
        // Filter to staff that offer this service
        all.filter((s: any) =>
          s.staffServices?.some((ss: any) => ss.serviceId === service.id),
        ),
      )
      .then(setStaffList)
      .catch(() => setError("No se pudieron cargar los profesionales."))
      .finally(() => setLoading(false));
  }, [service.id]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-brand-700 transition-colors">
          ←
        </button>
        <h2 className="text-lg font-semibold">¿Con quién querés el turno?</h2>
      </div>

      <div className="space-y-2">
        {staffList.map((staff: any) => (
          <button
            key={staff.id}
            onClick={() => onSelect(staff)}
            className="w-full flex items-center gap-4 rounded-xl border border-gray-200 px-4 py-3 text-left hover:border-brand-500 hover:bg-brand-50 transition-colors group"
          >
            <div className="h-12 w-12 rounded-full bg-brand-100 overflow-hidden flex-shrink-0">
              {staff.user.image ? (
                <Image
                  src={staff.user.image}
                  alt={staff.user.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-brand-600 font-bold text-lg">
                  {staff.user.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 group-hover:text-brand-700">
                {staff.user.name}
              </p>
              {staff.bio && (
                <p className="text-sm text-gray-400 truncate">{staff.bio}</p>
              )}
              {staff.specialties?.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {staff.specialties.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}

        {staffList.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">
            No hay profesionales disponibles para este servicio.
          </p>
        )}
      </div>
    </div>
  );
}
