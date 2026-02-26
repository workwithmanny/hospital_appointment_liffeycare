"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
export default function SetupAdminPage() {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const response = await fetch("/api/setup-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, secret }),
    });
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to grant admin role.");
      return;
    }
    setMessage(data.message ?? "Admin role granted.");
  }
  return (
    <section className="mx-auto max-w-xl">
      {" "}
      <div className="glass-card space-y-5 p-8">
        {" "}
        <h1 className="text-2xl font-semibold">Bootstrap first admin</h1>{" "}
        <p className="text-sm text-slate-600">
          {" "}
          Enter the existing account email and your bootstrap secret to grant
          admin access.{" "}
        </p>{" "}
        <form className="space-y-4" onSubmit={onSubmit}>
          {" "}
          <div>
            {" "}
            <label className="label" htmlFor="email">
              {" "}
              Account email{" "}
            </label>{" "}
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="label" htmlFor="secret">
              {" "}
              Bootstrap secret{" "}
            </label>{" "}
            <input
              id="secret"
              type="password"
              className="input"
              placeholder="ADMIN_BOOTSTRAP_SECRET"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              required
            />{" "}
          </div>{" "}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}{" "}
          {message ? (
            <p className="text-sm text-emerald-700">{message}</p>
          ) : null}{" "}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {" "}
            {loading ? "Granting admin..." : "Grant admin role"}{" "}
          </button>{" "}
        </form>{" "}
        <p className="text-xs text-slate-500">
          {" "}
          For safety, remove this page/route or rotate the secret after initial
          setup.{" "}
        </p>{" "}
        <Link
          href="/auth/login"
          className="text-sm font-medium text-slate-900 underline"
        >
          {" "}
          Back to sign in{" "}
        </Link>{" "}
      </div>{" "}
    </section>
  );
}
