"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
type Profile = {
  role: "patient" | "doctor" | "admin";
  full_name: string;
} | null;
export function AuthNav() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>(null);
  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", auth.user.id)
        .single();
      if (data) setProfile(data);
    }
    void load();
  }, [supabase]);
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
  if (!profile) {
    return (
      <Link
        href="/auth/login"
        className="rounded-full border border-slate-300 px-4 py-1.5 text-slate-900 transition hover:bg-slate-50"
      >
        {" "}
        Sign in{" "}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      {" "}
      <Link
        href={`/${profile.role}`}
        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700"
      >
        {" "}
        {profile.full_name}{" "}
      </Link>{" "}
      <button
        type="button"
        onClick={onLogout}
        disabled={loading}
        className="rounded-full border border-slate-300 px-4 py-1.5 text-slate-900 transition hover:bg-slate-50"
      >
        {" "}
        {loading ? "Signing out..." : "Logout"}{" "}
      </button>{" "}
    </div>
  );
}
