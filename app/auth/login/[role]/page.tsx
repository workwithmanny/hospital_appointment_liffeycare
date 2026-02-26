import Link from "next/link";
import { LoginForm } from "@/app/auth/login/login-form";
import type { Role } from "@/lib/types";
import { Heart, Stethoscope, Shield, ChevronLeft, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface LoginPageProps {
  params: { role: Role };
}

const roleConfig: Record<
  Role,
  { name: string; description: string; icon: LucideIcon; color: string; bgColor: string }
> = {
  patient: {
    name: "Patient",
    description: "Sign in to book appointments and manage your health",
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  doctor: {
    name: "Doctor",
    description: "Sign in to manage patients and appointments",
    icon: Stethoscope,
    color: "text-brand",
    bgColor: "bg-brand-light",
  },
  admin: {
    name: "Administrator",
    description: "Sign in to manage the platform",
    icon: Shield,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
};

export default function LoginRolePage({ params }: LoginPageProps) {
  const { role } = params;
  const config = roleConfig[role] || roleConfig.patient;
  const Icon = config.icon;

  return (
    <main className="min-h-screen bg-base">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/auth/login"
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
                Sign in as {config.name}
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                {config.description}
              </p>
            </div>

            {/* Role Badge */}
            <div className="flex justify-center mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>{config.name} Portal</span>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
              <LoginForm role={role} />

              {/* Bottom Links */}
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                {role !== "admin" && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <Link
                      href={`/auth/signup/${role}`}
                      className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                    >
                      Create {role} account
                    </Link>
                  </div>
                )}
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
