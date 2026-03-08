import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DoctorPatientsClient } from "./DoctorPatientsClient";

export default async function DoctorPatientsPage() {
  const user = await getSessionUser();
  assertRole(user, ["doctor", "admin"]);
  
  console.log("[Server] Doctor ID:", user?.id);
  console.log("[Server] User role:", user?.role);
  
  const supabase = getSupabaseServerClient();
  
  // Fetch appointments with patient data including allergies and age
  const { data: appointmentData, error } = await supabase
    .from("appointments")
    .select(
      `id, slot_time, status, patient_id, doctor_id, patient:profiles!appointments_patient_id_fkey(id, full_name, phone, avatar_url, age, allergies)`,
    )
    .eq("doctor_id", user?.id ?? "")
    .order("slot_time", { ascending: false });

  // Fetch emails from auth.users for each patient using admin client
  const patientIds = [...new Set((appointmentData ?? []).map(a => a.patient_id).filter(Boolean))];
  const patientEmails: Record<string, string> = {};
  
  if (patientIds.length > 0) {
    try {
      const adminClient = getSupabaseAdminClient();
      const { data: authUsers } = await adminClient.auth.admin.listUsers();
      
      // Map users by their profile id (user id in auth.users matches profile id)
      if (authUsers?.users) {
        for (const user of authUsers.users) {
          if (user.email && patientIds.includes(user.id)) {
            patientEmails[user.id] = user.email;
          }
        }
      }
    } catch (err) {
      console.error("[Server] Error fetching auth emails:", err);
    }
  }

  console.log("[Server] appointmentData:", appointmentData);
  console.log("[Server] error:", error);

  if (error) {
    console.error("[Server] Error fetching appointments:", error);
  }

  // Supabase returns joined data as an array, need to extract first element
  const appointments = (appointmentData ?? []).map((appt) => {
    const rawPatient = appt.patient;
    // Handle both array and object formats
    const patientData = Array.isArray(rawPatient) ? rawPatient[0] : rawPatient;
    
    return {
      id: appt.id as string,
      slot_time: appt.slot_time as string,
      status: appt.status as string,
      patient: patientData ? {
        id: patientData.id as string,
        full_name: patientData.full_name as string,
        phone: patientData.phone as string | null,
        avatar_url: patientData.avatar_url as string | null,
        email: patientEmails[patientData.id as string] || null,
        age: patientData.age as number | null,
        allergies: patientData.allergies as string[] | null,
      } : null,
    };
  });

  return <DoctorPatientsClient appointments={appointments} doctorId={user?.id ?? ""} />;
}
