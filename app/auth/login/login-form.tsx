"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import type { Role } from "@/lib/types";

interface LoginFormProps {
  role?: Role;
}

export function LoginForm({ role = "patient" }: LoginFormProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const selectedRole = role;
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      { email, password },
    );
    if (signInError || !data.user) {
      setError(signInError?.message ?? "Unable to sign in");
      setLoading(false);
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, doctor_approved")
      .eq("id", data.user.id)
      .single();
    if (profileError || !profile) {
      const metaRole = String(
        data.user.user_metadata?.role || "patient",
      ) as Role;
      const metaFullName = String(
        data.user.user_metadata?.full_name ||
          data.user.email?.split("@")[0] ||
          "User",
      );
      const metaPhone = data.user.user_metadata?.phone
        ? String(data.user.user_metadata.phone)
        : null;
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        role: metaRole,
        full_name: metaFullName,
        phone: metaPhone,
        doctor_approved: metaRole === "doctor" ? false : true,
      });
      if (insertError) {
        setError(
          "No profile found and auto-recovery failed. Please contact support.",
        );
        setLoading(false);
        return;
      }
      if (!data.user.email_confirmed_at || metaRole === "doctor") {
        router.push(`/auth/status?email=${encodeURIComponent(email)}`);
      } else {
        router.push(`/${metaRole}`);
      }
      router.refresh();
      return;
    }
    if (profile.role !== selectedRole) {
      setError(`This account is registered as ${profile.role}.`);
      setLoading(false);
      return;
    }
    if (
      !data.user.email_confirmed_at ||
      (profile.role === "doctor" && !profile.doctor_approved)
    ) {
      router.push(`/auth/status?email=${encodeURIComponent(email)}`);
      router.refresh();
      return;
    }
    router.push(`/${profile.role}`);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-text-tertiary"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-text-tertiary"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <button
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
