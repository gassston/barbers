"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

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

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4">
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

          {/* Mobile: book button + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/book"
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              Reservar
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg text-gray-300 hover:bg-brand-700 transition-colors"
              aria-label="Menú"
            >
              {open ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {open && (
          <div className="sm:hidden border-t border-brand-700 bg-brand-800 px-4 py-2 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-gray-300 hover:bg-brand-700 hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="block w-full text-left rounded-lg px-3 py-3 text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              Salir
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
