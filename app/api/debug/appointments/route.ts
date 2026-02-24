import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get all appointments for this doctor
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        "id, slot_time, status, patient:profiles!appointments_patient_id_fkey(full_name, avatar_url)",
      )
      .eq("doctor_id", user.id)
      .order("slot_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user profile info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    const now = new Date();
    const upcomingAppointments = (appointments || []).filter(
      (appointment) => new Date(appointment.slot_time) >= now,
    );

    return NextResponse.json({
      user: { id: user.id, email: user.email, profile },
      currentTime: now.toISOString(),
      totalAppointments: appointments?.length || 0,
      upcomingAppointments: upcomingAppointments.length,
      appointments: appointments || [],
      upcomingAppointmentsList: upcomingAppointments,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
