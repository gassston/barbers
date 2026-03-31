import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios — PeluQ'arte",
};

async function getServices() {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/services`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Nuestros servicios</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service: any) => (
          <div
            key={service.id}
            className="rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">{service.name}</h2>
            {service.description && (
              <p className="text-sm text-gray-500 mt-1">{service.description}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-brand-700 font-bold">
                ${service.price.toLocaleString("es-AR")}
              </span>
              <span className="text-sm text-gray-400">
                {service.durationMinutes} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
