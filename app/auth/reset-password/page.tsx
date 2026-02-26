"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);

  // Check for access token in URL (Supabase sends it as hash fragment or query param)
  useEffect(() => {
    const checkSession = async () => {
      // Supabase sends recovery token as hash fragment, browser doesn't send it to server
      // We need to check if we have a session from the recovery flow
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Check if there's a hash in the URL (access_token)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          // Supabase will automatically set the session from the hash
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.getSession();
          if (refreshError || !newSession) {
            setError("Invalid or expired reset link. Please request a new one.");
          }
        } else {
          setError("No reset token found. Please request a new password reset link.");
        }
      }
      setValidating(false);
    };

    checkSession();
  }, [supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/auth/login");
    }, 3000);
  }

  if (validating) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-light mb-4">
          <Lock className="w-6 h-6 text-brand animate-pulse" />
        </div>
        <p className="text-text-secondary">Validating your reset link...</p>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-[22px] font-bold text-text-primary mb-2">
          Invalid Link
        </h2>
        <p className="text-[14px] text-text-secondary mb-6">
          {error}
        </p>
        <Link
          href="/auth/forgot-password"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-[22px] font-bold text-text-primary mb-2">
          Password Updated!
        </h2>
        <p className="text-[14px] text-text-secondary mb-6">
          Your password has been successfully reset. You will be redirected to the login page shortly.
        </p>
        <Link
          href="/auth/login"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block text-center mb-8">
        <h1 className="text-[28px] font-bold text-text-primary mb-2">
          Create New Password
        </h1>
        <p className="text-[14px] text-text-secondary">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="password">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className="input pr-10"
              placeholder="Enter new password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-caption mt-1">Must be at least 6 characters</p>
        </div>

        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className="input pr-10"
              placeholder="Confirm new password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="text-center py-8">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-light mb-4">
        <Lock className="w-6 h-6 text-brand animate-pulse" />
      </div>
      <p className="text-text-secondary">Loading...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
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
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-[26px] font-bold text-white">
                    Secure Reset
                  </h2>
                  <p className="text-[14px] text-white/90">
                    Create a strong new password for your account
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
                  <Lock className="w-8 h-8" />
                </div>
                <h1 className="text-[32px] font-bold text-text-primary mb-2">
                  Reset Password
                </h1>
                <p className="text-[14px] text-text-secondary">
                  Create a new password for your account
                </p>
              </div>

              <div className="bg-surface rounded-lg border border-border p-8">
                <Suspense fallback={<ResetPasswordLoading />}>
                  <ResetPasswordForm />
                </Suspense>

                <div className="mt-8 pt-6 border-t border-border">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-brand transition-colors w-full"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
