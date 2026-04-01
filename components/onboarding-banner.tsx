"use client";

import { useState } from "react";
import Link from "next/link";
import { X, UserCircle, ArrowRight } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface OnboardingBannerProps {
  userId: string;
  profilePath: string;
  role: "patient" | "doctor";
}

export function OnboardingBanner({ userId, profilePath, role }: OnboardingBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  const supabase = getSupabaseClient();

  const handleDismiss = async () => {
    if (isDismissing) return;
    
    setIsDismissing(true);
    
    try {
      // Update the profile to mark onboarding as completed
      const { error } = await supabase
        .from("profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update onboarding status:", error);
        // Still hide the banner locally even if the update fails
      }
    } catch (err) {
      console.error("Error dismissing banner:", err);
    } finally {
      setIsVisible(false);
      setIsDismissing(false);
    }
  };

  const handleCompleteProfile = async () => {
    // Mark as completed when they click to go to profile
    await handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14b6a6] to-[#0d9488] p-5 shadow-lg">
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
      
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        disabled={isDismissing}
        className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        aria-label="Dismiss banner"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <UserCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              Finish setting up your account
            </h3>
            <p className="mt-1 text-sm text-white/80">
              Complete your profile to get the most out of LiffeyCare. 
              {role === "patient" 
                ? "Add your medical history and preferences." 
                : "Add your specialty, hospital, and certifications."}
            </p>
          </div>
        </div>

        <Link
          href={profilePath}
          onClick={handleCompleteProfile}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#14b6a6] shadow-sm transition-all hover:bg-white/90 hover:shadow-md active:scale-95 sm:ml-4"
        >
          Go to Profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
