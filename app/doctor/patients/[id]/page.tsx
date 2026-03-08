import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DoctorPatientProfileClient } from "./DoctorPatientProfileClient";
import { notFound } from "next/navigation";

export default async function DoctorPatientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  assertRole(user, ["doctor", "admin"]);
  
  const patientId = params.id;
  const supabase = getSupabaseServerClient();
  
  // Fetch patient profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, age, allergies, created_at")
    .eq("id", patientId)
    .single();
  
  if (profileError || !profile) {
    notFound();
  }
  
  // Fetch patient email from auth.users
  let email: string | null = null;
  try {
    const adminClient = getSupabaseAdminClient();
    const { data: userData } = await adminClient.auth.admin.getUserById(patientId);
    email = userData?.user?.email || null;
  } catch (err) {
    console.error("Error fetching patient email:", err);
  }
  
  // Fetch appointments between this doctor and patient
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, slot_time, status, session_notes, clinical_notes, consultation_duration_minutes, payment_status, amount_paid, created_at"
    )
    .eq("doctor_id", user?.id ?? "")
    .eq("patient_id", patientId)
    .order("slot_time", { ascending: false });
  
  // Calculate stats
  const totalVisits = appointments?.length || 0;
  const completedVisits = appointments?.filter(a => a.status === "completed").length || 0;
  const upcomingVisits = appointments?.filter(
    a => a.status === "scheduled" && new Date(a.slot_time) > new Date()
  ).length || 0;
  const cancelledVisits = appointments?.filter(a => a.status === "cancelled").length || 0;
  
  // Get last visit
  const lastVisit = appointments?.find(a => a.status === "completed")?.slot_time || null;
  
  const patient = {
    id: profile.id,
    full_name: profile.full_name,
    phone: profile.phone,
    email,
    avatar_url: profile.avatar_url,
    age: profile.age,
    allergies: profile.allergies,
    joinedAt: profile.created_at,
  };
  
  const appointmentsList = (appointments || []).map(appt => ({
    id: appt.id,
    slot_time: appt.slot_time,
    status: appt.status,
    session_notes: appt.session_notes,
    clinical_notes: appt.clinical_notes,
    duration: appt.consultation_duration_minutes,
    payment_status: appt.payment_status,
    amount_paid: appt.amount_paid,
  }));

  return (
    <DoctorPatientProfileClient
      patient={patient}
      appointments={appointmentsList}
      stats={{
        totalVisits,
        completedVisits,
        upcomingVisits,
        cancelledVisits,
        lastVisit,
      }}
      doctorId={user?.id ?? ""}
    />
  );
}
