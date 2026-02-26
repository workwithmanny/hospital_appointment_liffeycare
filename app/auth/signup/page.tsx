import Link from "next/link";
import { Heart, Stethoscope, Activity, ArrowRight, ChevronLeft } from "lucide-react";

const signupOptions = [
  {
    key: "patient",
    title: "Patient",
    description: "Book appointments and manage your health records",
    icon: Heart,
    color: "bg-rose-50 text-rose-600",
    borderColor: "border-rose-100 hover:border-rose-200",
  },
  {
    key: "doctor",
    title: "Doctor",
    description: "Join our network of healthcare professionals",
    icon: Stethoscope,
    color: "bg-brand-light text-brand",
    borderColor: "border-brand/20 hover:border-brand/40",
  },
];

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-base">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Join LiffeyCare today
              </p>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              {signupOptions.map((option) => (
                <Link
                  key={option.key}
                  href={`/auth/signup/${option.key}`}
                  className={`group flex items-center gap-4 p-4 rounded-xl border ${option.borderColor} bg-white hover:shadow-md transition-all duration-200`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${option.color} flex-shrink-0`}>
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-text-primary">
                      {option.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {option.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-brand group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>

            {/* Sign In Link */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-center text-sm text-text-secondary">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-brand hover:text-brand-hover transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
