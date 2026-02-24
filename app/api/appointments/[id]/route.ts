import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id: appointmentId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    console.log("API: Fetching appointment", appointmentId, "for user", user.id);

    // First, fetch the appointment without the doctor join to verify it exists and belongs to user
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .select("id, slot_time, status, payment_method, payment_status, amount_paid, doctor_id, patient_id")
      .eq("id", appointmentId)
      .single();

    if (apptError || !appointment) {
      console.log("API: Appointment not found or error:", apptError?.message);
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Verify the appointment belongs to the logged-in user
    if (appointment.patient_id !== user.id) {
      console.log("API: Patient ID mismatch", appointment.patient_id, "vs", user.id);
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Now fetch doctor details separately
    const { data: doctor, error: doctorError } = await supabase
      .from("profiles")
      .select("full_name, specialty, hospital, phone")
      .eq("id", appointment.doctor_id)
      .single();

    if (doctorError) {
      console.log("API: Doctor fetch error:", doctorError.message);
    }

    const result = {
      ...appointment,
      doctor: doctor || {
        full_name: "Unknown Doctor",
        specialty: "",
        hospital: "",
        phone: ""
      }
    };

    console.log("API: Successfully returning appointment");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}
