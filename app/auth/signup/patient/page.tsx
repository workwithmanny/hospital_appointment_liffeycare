import Link from "next/link";
import { SignupForm } from "@/app/auth/signup/signup-form";
import { Heart, Activity, ChevronLeft } from "lucide-react";

export default function SignupPatientPage() {
  return (
    <main className="min-h-screen bg-base">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 text-rose-600 mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
                Sign up as Patient
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Create your account to book appointments
              </p>
            </div>

            {/* Role Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50">
                <Heart className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-medium text-rose-600">Patient Portal</span>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
              <SignupForm role="patient" />

              {/* Bottom Links */}
              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <p className="text-center text-sm text-text-secondary">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-brand hover:text-brand-hover transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
                <Link
                  href="/"
                  className="block text-center text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
