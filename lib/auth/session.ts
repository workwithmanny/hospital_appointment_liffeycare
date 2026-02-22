import type { Role } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionUser(): Promise<{
  id: string;
  email: string;
  role: Role;
  doctorApproved: boolean;
  emailConfirmed: boolean;
} | null> {
  const supabase = getSupabaseServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, doctor_approved")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.role) return null;

  return {
    id: userData.user.id,
    email: userData.user.email ?? "",
    role: profile.role as Role,
    doctorApproved: Boolean(profile.doctor_approved),
    emailConfirmed: Boolean(userData.user.email_confirmed_at),
  };
}
