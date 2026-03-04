import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PatientSettingsClient } from "./PatientSettingsClient";

export default async function PatientSettingsPage() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  assertRole(user, ["patient"]);

  const supabase = getSupabaseServerClient();
  
  // Fetch comprehensive profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email, age, allergies, created_at")
    .eq("id", user.id)
    .single();

  // Get patient stats
  const { data: appointments } = await supabase
    .from("appointments")
    .select("status, payment_status")
    .eq("patient_id", user.id);

  const stats = {
    totalAppointments: appointments?.length || 0,
    upcomingAppointments: appointments?.filter(a => a.status === "scheduled").length || 0,
    completedAppointments: appointments?.filter(a => a.status === "completed").length || 0,
  };

  return (
    <PatientSettingsClient
      profile={{
        id: user.id,
        fullName: profile?.full_name || "",
        email: profile?.email || user.email,
        phone: profile?.phone || "",
        age: profile?.age || null,
        allergies: profile?.allergies || [],
        memberSince: profile?.created_at || new Date().toISOString(),
      }}
      stats={stats}
    />
  );
}
