"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-base">
      <div className="min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-full">
          {/* Left Side - Image */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-brand-light" />
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80"
              alt="Healthcare professionals"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-white">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-[26px] font-bold text-white">
                    Reset Password
                  </h2>
                  <p className="text-[14px] text-white/90">
                    Secure password recovery for all accounts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              {/* Mobile Header */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-brand text-white mx-auto mb-4">
                  <Mail className="w-8 h-8" />
                </div>
                <h1 className="text-[32px] font-bold text-text-primary mb-2">
                  Forgot Password?
                </h1>
                <p className="text-[14px] text-text-secondary">
                  Enter your email to receive a password reset link
                </p>
              </div>

              <div className="bg-surface rounded-lg border border-border p-8">
                {success ? (
                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-[22px] font-bold text-text-primary mb-2">
                      Check Your Email
                    </h2>
                    <p className="text-[14px] text-text-secondary mb-6">
                      We&apos;ve sent a password reset link to <strong>{email}</strong>. 
                      Please check your inbox and follow the instructions to reset your password.
                    </p>
                    <div className="space-y-3">
                      <Link
                        href="/auth/login"
                        className="btn-primary w-full inline-flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:block text-center mb-8">
                      <h1 className="text-[28px] font-bold text-text-primary mb-2">
                        Forgot Password?
                      </h1>
                      <p className="text-[14px] text-text-secondary">
                        Enter your email to receive a password reset link
                      </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5">
                      <div>
                        <label className="label" htmlFor="email">
                          Email Address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="input"
                          placeholder="you@example.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>

                      {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border">
                      <div className="flex flex-col gap-4">
                        <Link
                          href="/auth/login"
                          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-brand transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Login
                        </Link>
                        <p className="text-center text-sm text-text-secondary">
                          Remember your password?{" "}
                          <Link
                            href="/auth/login"
                            className="font-medium text-brand hover:text-brand-hover transition-colors"
                          >
                            Sign in
                          </Link>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
