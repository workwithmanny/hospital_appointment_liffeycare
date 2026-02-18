"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
type LogoutButtonProps = { className?: string };
export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  async function onLogout() {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }
  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className={className ?? "btn-secondary w-full"}
    >
      {" "}
      {loading ? "Signing out..." : "Logout"}{" "}
    </button>
  );
}
