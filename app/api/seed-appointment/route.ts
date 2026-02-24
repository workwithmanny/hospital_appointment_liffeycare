import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  void request;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get a random approved doctor for testing
    const { data: doctors } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "doctor")
      .eq("doctor_approved", true)
      .limit(1);

    if (!doctors || doctors.length === 0) {
      return NextResponse.json(
        { error: "No approved doctors found" },
        { status: 404 },
      );
    }

    // Create a sample appointment for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: user.id,
        doctor_id: doctors[0].id,
        slot_time: tomorrow.toISOString(),
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Sample appointment created successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error in seed appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
