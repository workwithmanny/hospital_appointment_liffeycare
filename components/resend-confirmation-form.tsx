"use client";
import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
export function ResendConfirmationForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (resendError) {
      setError(resendError.message);
      setLoading(false);
      return;
    }
    setSuccess("Confirmation email resent successfully.");
    setLoading(false);
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {" "}
      <div>
        {" "}
        <label className="label" htmlFor="resend-email">
          {" "}
          Email{" "}
        </label>{" "}
        <input
          id="resend-email"
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />{" "}
      </div>{" "}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}{" "}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}{" "}
      <button className="btn-secondary w-full" disabled={loading} type="submit">
        {" "}
        {loading ? "Resending..." : "Resend confirmation email"}{" "}
      </button>{" "}
    </form>
  );
}
