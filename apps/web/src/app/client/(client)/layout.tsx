"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const NAV_ITEMS = [
  { href: "/client/dashboard", label: "Mis turnos" },
  { href: "/client/history", label: "Historial" },
  { href: "/client/profile", label: "Mi perfil" },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-brand-900">
      <header className="bg-brand-800 border-b border-brand-700 sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-accent tracking-wide">
            PeluQ'arte
          </Link>
          <nav className="flex items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-300 hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/book"
              className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              Nuevo turno
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              Salir
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
