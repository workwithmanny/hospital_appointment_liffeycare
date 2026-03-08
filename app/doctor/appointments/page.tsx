import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DoctorAppointmentsClient } from "./DoctorAppointmentsClient";
export default async function DoctorAppointmentsPage() {
  const user = await getSessionUser();
  assertRole(user, ["doctor", "admin"]);
  const supabase = getSupabaseServerClient();
  const { data: appointmentData } = await supabase
    .from("appointments")
    .select(
      "id, slot_time, status, payment_status, amount_paid, session_notes, patient:profiles!appointments_patient_id_fkey(full_name, avatar_url), cancellation_reason, cancelled_by, cancelled_at",
    )
    .eq("doctor_id", user?.id ?? "")
    .order("slot_time", { ascending: true })
    .limit(100); // Get cancelled by user information
  const cancelledByIds = [
    ...new Set(
      (appointmentData ?? []).map((appt) => appt.cancelled_by).filter(Boolean),
    ),
  ];
  const { data: cancelledByUsers } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", cancelledByIds);
  const appointmentList = (appointmentData ?? []).map((appt) => ({
    id: appt.id as string,
    slot_time: appt.slot_time as string,
    status: appt.status as string,
    payment_status: appt.payment_status as string | null,
    amount_paid: appt.amount_paid as number | null,
    session_notes: appt.session_notes as string | null | undefined,
    patient: appt.patient as { full_name?: string } | null,
    cancellation_reason: appt.cancellation_reason as string | null,
    cancelled_by: appt.cancelled_by as string | null,
    cancelled_at: appt.cancelled_at as string | null,
    cancelled_by_user:
      cancelledByUsers?.find((user) => user.id === appt.cancelled_by) || null,
  }));
  return <DoctorAppointmentsClient appointments={appointmentList} />;
}
