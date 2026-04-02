"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/schedule", label: "Agenda" },
  { href: "/admin/staff", label: "Profesionales" },
  { href: "/admin/services", label: "Servicios" },
  { href: "/admin/reports", label: "Reportes" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — hidden on mobile, visible md+ */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-brand-700 bg-brand-800 flex-col">
        <div className="px-5 py-6 border-b border-brand-700">
          <Link href="/admin/schedule" className="text-xl font-bold text-accent tracking-wide">
            PeluQ'arte
          </Link>
          <p className="text-xs text-brand-400 mt-0.5">Panel admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-brand-700 hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-brand-700">
          <Link
            href="/api/auth/sign-out"
            className="flex items-center rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Salir
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-brand-800 border-b border-brand-700 flex items-center justify-between px-4 py-3">
        <Link href="/admin/schedule" className="text-lg font-bold text-accent tracking-wide">
          PeluQ'arte
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg text-gray-300 hover:bg-brand-700 transition-colors"
          aria-label="Menú"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-10 bg-black/50" onClick={() => setOpen(false)}>
          <nav
            className="absolute top-14 left-0 bottom-0 w-64 bg-brand-800 border-r border-brand-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-300 hover:bg-brand-700 hover:text-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="px-3 py-4 border-t border-brand-700">
              <Link
                href="/api/auth/sign-out"
                className="flex items-center rounded-lg px-3 py-3 text-sm text-gray-500 hover:text-red-400 transition-colors"
              >
                Salir
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-brand-900 md:pt-0 pt-14">{children}</div>
    </div>
  );
}
