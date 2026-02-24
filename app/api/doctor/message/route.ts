import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmailReminder } from "@/lib/notifications/providers/resend";

const messageSchema = z.object({
  appointmentId: z.string().uuid(),
  message: z.string().min(5).max(500),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "doctor" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(parsed.error) },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("id, doctor_id, patient_id")
      .eq("id", parsed.data.appointmentId)
      .single();

    if (apptError || !appt || appt.doctor_id !== user.id) {
      return NextResponse.json(
        { error: "Appointment not found." },
        { status: 404 },
      );
    }

    const { data: patient, error: patientError } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", appt.patient_id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        {
          error:
            "Unable to access patient contact. Apply latest DB migrations and retry.",
        },
        { status: 400 },
      );
    }

    const body = `Message from your doctor: ${parsed.data.message}`;
    const tasks: Promise<unknown>[] = [];
    if (user.email) {
      tasks.push(
        sendEmailReminder(
          user.email,
          "Patient message delivered",
          `<p>Sent to ${patient.full_name}</p>`,
        ),
      );
    }
    await Promise.all(tasks);

    const { error: messageError } = await supabase.from("messages").insert({
      appointment_id: appt.id,
      sender_id: user.id,
      recipient_id: appt.patient_id,
      body: parsed.data.message,
      message_type: "appointment",
    });

    if (messageError) {
      return NextResponse.json(
        { error: messageError.message },
        { status: 500 },
      );
    }

    await supabase.from("system_logs").insert({
      actor_id: user.id,
      action: "doctor_patient_message",
      metadata: { appointment_id: appt.id, patient_id: appt.patient_id },
    });

    return NextResponse.json({
      ok: true,
      message: tasks.length
        ? "Message sent successfully."
        : "No patient contact channel available.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send message.",
      },
      { status: 500 },
    );
  }
}
