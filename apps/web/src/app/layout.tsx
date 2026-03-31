import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeluQ'arte — Turnos online",
  description: "Reservá tu turno fácil y rápido.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-brand-900 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
