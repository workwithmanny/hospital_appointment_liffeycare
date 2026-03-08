"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export function ConsultationPriceForm({
  initialPrice,
}: {
  initialPrice: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const consultationPrice = Number(form.get("consultationPrice") || 0);
    const response = await fetch("/api/doctor/consultation-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultationPrice }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save consultation price.");
      return;
    }
    setMessage("Consultation price updated.");
    router.refresh();
  }
  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
      onSubmit={onSubmit}
    >
      {" "}
      <input
        name="consultationPrice"
        type="number"
        step="0.01"
        min="0"
        defaultValue={initialPrice}
        className="input"
        placeholder="0.00"
        required
      />{" "}
      <button type="submit" className="btn-primary" disabled={loading}>
        {" "}
        {loading ? "Saving..." : "Save price"}{" "}
      </button>{" "}
      {error ? (
        <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
      ) : null}{" "}
      {message ? (
        <p className="sm:col-span-2 text-sm text-emerald-700">{message}</p>
      ) : null}{" "}
    </form>
  );
}
