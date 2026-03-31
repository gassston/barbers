"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Props {
  appointmentId: string;
  serviceName: string;
  staffName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({
  appointmentId,
  serviceName,
  staffName,
  onClose,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setError(null);
    setLoading(true);
    try {
      await api.reviews.create({ appointmentId, rating, comment: comment.trim() || undefined });
      onSubmitted();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dejar reseña</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500">
          {serviceName} con <strong>{staffName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  <span
                    className={
                      star <= (hovered || rating) ? "text-yellow-400" : "text-gray-200"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="¿Cómo estuvo el servicio?"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!rating || loading}
              className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Enviando..." : "Enviar reseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
