import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function deleteAppointmentAdmin(
  appointmentId: string,
): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    await admin.from("appointments").delete().eq("id", appointmentId);
  } catch {
    // Missing service role or DB error — leave row; ops can clean up.
  }
}
