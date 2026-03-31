"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/client/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Credenciales incorrectas.");
      setLoading(false);
      return;
    }

    // Redirect based on role stored in session
    const role = (result.data?.user as any)?.role;
    if (role === "ADMIN" || role === "STAFF") {
      router.push("/admin/schedule");
    } else {
      router.push(next);
    }
  }

  return (
    <div className="bg-brand-800 rounded-2xl border border-brand-700 p-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-100">Ingresar</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-white font-semibold text-sm hover:bg-brand-600 disabled:opacity-60 transition-colors"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="text-accent font-medium hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
