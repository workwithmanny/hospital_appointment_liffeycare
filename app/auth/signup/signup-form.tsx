"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { SPECIALTIES } from "@/lib/constants/specialties";
interface SignupFormProps {
  role?: "patient" | "doctor";
}
export function SignupForm({ role = "patient" }: SignupFormProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") || "");
    const email = String(form.get("email") || "");
    const phone = String(form.get("phone") || "");
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    const licenseNumber = String(form.get("licenseNumber") || "");
    const specialty = String(form.get("specialty") || "");
    const finalRole = role;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: finalRole,
          full_name: fullName,
          phone,
          specialty,
          licenseNumber,
        },
      },
    });
    if (authError) {
      const lowered = authError.message.toLowerCase();
      if (lowered.includes("rate limit")) {
        setError(
          "Sign-up rate limit reached. Wait a few minutes, or disable email confirmations in Supabase Auth settings while testing locally.",
        );
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }
    if (!data.user) {
      setError("Unable to create account.");
      setLoading(false);
      return;
    }
    if (data.session) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        phone,
        role: finalRole,
        doctor_approved: finalRole === "doctor" ? false : true,
        specialty: finalRole === "doctor" ? specialty : undefined,
        certification: finalRole === "doctor" ? licenseNumber : undefined,
      });
    }
    setMessage(
      "Account created. Continue to account status to verify email or resend confirmation.",
    );
    setLoading(false);
    router.push(`/auth/status?email=${encodeURIComponent(email)}`);
    router.refresh();
  }
  return (
    <>
      {" "}
      <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
        {" "}
        <div className="sm:col-span-2">
          {" "}
          <label className="label" htmlFor="fullName">
            {" "}
            Full name{" "}
          </label>{" "}
          <input
            id="fullName"
            name="fullName"
            className="input"
            placeholder="John Appleseed"
            required
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="label" htmlFor="email">
            {" "}
            Email address{" "}
          </label>{" "}
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            required
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="label" htmlFor="phone">
            {" "}
            Phone number{" "}
          </label>{" "}
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
            placeholder="+353 8X XXX XXXX"
            required
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="label" htmlFor="password">
            {" "}
            Password{" "}
          </label>{" "}
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder="Create a secure password"
            required
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="label" htmlFor="confirmPassword">
            {" "}
            Confirm password{" "}
          </label>{" "}
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="input"
            placeholder="Repeat password"
            required
          />{" "}
        </div>{" "}
        {role === "doctor" ? (
          <>
            {" "}
            <div className="sm:col-span-2">
              {" "}
              <label className="label" htmlFor="licenseNumber">
                {" "}
                Medical License Number{" "}
              </label>{" "}
              <input
                id="licenseNumber"
                name="licenseNumber"
                className="input"
                placeholder="MED-12345678"
                required
              />{" "}
            </div>{" "}
            <div className="sm:col-span-2">
              {" "}
              <label className="label" htmlFor="specialty">
                {" "}
                Specialty{" "}
              </label>{" "}
              <select
                id="specialty"
                name="specialty"
                className="input"
                required
              >
                {" "}
                <option value="">Select your specialty...</option>{" "}
                {SPECIALTIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {" "}
                    {s.label}{" "}
                  </option>
                ))}{" "}
              </select>{" "}
            </div>{" "}
          </>
        ) : null}{" "}
        <div className="sm:col-span-2">
          {" "}
          <label className="label" htmlFor="notes">
            {" "}
            Additional details{" "}
          </label>{" "}
          <textarea
            id="notes"
            name="notes"
            className="input min-h-[100px]"
            placeholder="For doctors: qualifications/license ID. For patients: optional notes."
          />{" "}
        </div>{" "}
        {error ? (
          <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
        ) : null}{" "}
        {message ? (
          <p className="sm:col-span-2 text-sm text-emerald-700">{message}</p>
        ) : null}{" "}
        <div className="sm:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row">
          {" "}
          <button
            className="btn-primary flex-1"
            type="submit"
            disabled={loading}
          >
            {" "}
            {loading ? "Creating account..." : "Create account"}{" "}
          </button>{" "}
          <Link href="/auth/login" className="btn-secondary flex-1 text-center">
            {" "}
            I already have an account{" "}
          </Link>{" "}
        </div>{" "}
      </form>{" "}
    </>
  );
}
