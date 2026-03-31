"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signUp.email({ name, email, password });

    if (result.error) {
      setError(result.error.message ?? "Error al registrarse.");
      setLoading(false);
      return;
    }

    router.push("/client/dashboard");
  }

  return (
    <div className="bg-brand-800 rounded-2xl border border-brand-700 p-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-100">Crear cuenta</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Juan Pérez"
          />
        </div>

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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Mínimo 6 caracteres"
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
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
