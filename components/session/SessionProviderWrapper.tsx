"use client";

import { SessionNotificationProvider } from "./SessionNotificationProvider";
import { SessionFloatingBubble } from "./SessionFloatingBubble";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"doctor" | "patient">("patient");

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Get role from user metadata or profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role) {
          setUserRole(profile.role as "doctor" | "patient");
        }
      }
    };
    getUser();
  }, []);

  if (!userId) {
    return (
      <SessionNotificationProvider userId="loading" userRole={userRole as "doctor" | "patient"}>
        {children}
      </SessionNotificationProvider>
    );
  }

  return (
    <SessionNotificationProvider userId={userId} userRole={userRole as "doctor" | "patient"}>
      {children}
      <SessionFloatingBubble />
    </SessionNotificationProvider>
  );
}
