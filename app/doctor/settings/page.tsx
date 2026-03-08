import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DoctorSettingsClient } from "./DoctorSettingsClient";

export default async function DoctorSettingsPage() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  assertRole(user, ["doctor", "admin"]);

  const supabase = getSupabaseServerClient();
  
  // Fetch comprehensive profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email, specialty, hospital, consultation_price, doctor_approved, created_at")
    .eq("id", user.id)
    .single();

  // Get doctor stats
  const { data: appointments } = await supabase
    .from("appointments")
    .select("status, payment_status, amount_paid")
    .eq("doctor_id", user.id);

  const stats = {
    totalAppointments: appointments?.length || 0,
    completedAppointments: appointments?.filter(a => a.status === "completed").length || 0,
    totalEarnings: appointments?.reduce((sum, a) => sum + (a.amount_paid || 0), 0) || 0,
  };

  return (
    <DoctorSettingsClient
      profile={{
        id: user.id,
        fullName: profile?.full_name || "",
        email: profile?.email || user.email,
        phone: profile?.phone || "",
        specialty: profile?.specialty || "",
        hospital: profile?.hospital || "",
        consultationPrice: Number(profile?.consultation_price || 0),
        isApproved: profile?.doctor_approved || false,
        memberSince: profile?.created_at || new Date().toISOString(),
      }}
      stats={stats}
    />
  );
}
