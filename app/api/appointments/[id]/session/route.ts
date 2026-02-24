import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("patient_join") }),
  z.object({ action: z.literal("doctor_join") }),
  z.object({ action: z.literal("start") }),
  z.object({
    action: z.literal("extend"),
    extraMinutes: z.number().int().min(5).max(120),
  }),
  z.object({ action: z.literal("end") }),
  z.object({
    action: z.literal("save_notes"),
    sessionNotes: z.string().max(8000).optional(),
    clinicalNotes: z.record(z.string()).optional(),
  }),
]);
function addMinutes(iso: string | null, mins: number): string {
  const d = iso ? new Date(iso) : new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}
async function insertNotification(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  kind: string,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase
    .from("app_notifications")
    .insert({ user_id: userId, kind, title, body, metadata });
  if (error) console.error("app_notifications insert:", error.message);
}
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (
    !user ||
    (user.role !== "patient" && user.role !== "doctor" && user.role !== "admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const appointmentId = params.id;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const supabase = getSupabaseServerClient();
  const { data: appt, error: fetchErr } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, doctor_id, status, slot_time, session_notes, clinical_notes, consultation_duration_minutes, session_started_at, session_ends_at, doctor_joined_at, patient_joined_at",
    )
    .eq("id", appointmentId)
    .single();
  if (fetchErr || !appt) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 },
    );
  }
  const isPatient = user.id === appt.patient_id;
  const isDoctor = user.id === appt.doctor_id;
  if (!isPatient && !isDoctor && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { action } = parsed.data;
  if (action === "patient_join") {
    if (!isPatient)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (appt.patient_joined_at) {
      return NextResponse.json({ ok: true, appointment: appt });
    }
    const { error: upErr } = await supabase
      .from("appointments")
      .update({ patient_joined_at: new Date().toISOString() })
      .eq("id", appointmentId);
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    const { data: pat } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", appt.patient_id)
      .single();
    await insertNotification(
      supabase,
      appt.doctor_id,
      "session_patient_joined",
      "Patient joined",
      `${pat?.full_name ?? "Your patient"} is in the consultation waiting room.`,
      { appointmentId },
    );
    return NextResponse.json({ ok: true });
  }
  if (action === "doctor_join") {
    if (!isDoctor && user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (appt.doctor_joined_at) {
      return NextResponse.json({ ok: true });
    }
    const { error: upErr } = await supabase
      .from("appointments")
      .update({ doctor_joined_at: new Date().toISOString() })
      .eq("id", appointmentId);
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    const { data: doc } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", appt.doctor_id)
      .single();
    await insertNotification(
      supabase,
      appt.patient_id,
      "session_doctor_joined",
      "Doctor joined",
      `Dr. ${doc?.full_name ?? "Your doctor"} has joined. You can start when they begin the consultation.`,
      { appointmentId },
    );
    return NextResponse.json({ ok: true });
  }
  if (action === "start") {
    if (!isDoctor && user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (appt.status === "completed" || appt.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot start this appointment" },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const mins = Number(appt.consultation_duration_minutes ?? 30);
    const ends = addMinutes(now, mins);
    const { error: upErr } = await supabase
      .from("appointments")
      .update({
        status: "in_progress",
        session_started_at: now,
        session_ends_at: ends,
      })
      .eq("id", appointmentId);
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    await insertNotification(
      supabase,
      appt.patient_id,
      "session_started",
      "Consultation started",
      "Your consultation has started. The session timer is running.",
      { appointmentId },
    );
    return NextResponse.json({
      ok: true,
      sessionStartedAt: now,
      sessionEndsAt: ends,
    });
  }
  if (action === "extend") {
    if (!isDoctor && user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (appt.status !== "in_progress" || !appt.session_ends_at) {
      return NextResponse.json(
        { error: "Session is not active" },
        { status: 400 },
      );
    }
    const newEnd = addMinutes(appt.session_ends_at, parsed.data.extraMinutes);
    const { error: upErr } = await supabase
      .from("appointments")
      .update({ session_ends_at: newEnd })
      .eq("id", appointmentId);
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    await insertNotification(
      supabase,
      appt.patient_id,
      "session_extended",
      "Time extended",
      `Your doctor added ${parsed.data.extraMinutes} minutes to this consultation.`,
      { appointmentId },
    );
    return NextResponse.json({ ok: true, sessionEndsAt: newEnd });
  }
  if (action === "end") {
    if (appt.status === "completed") {
      return NextResponse.json({ ok: true, alreadyEnded: true });
    }
    if (appt.status === "cancelled") {
      return NextResponse.json(
        { error: "Appointment was cancelled" },
        { status: 400 },
      );
    }
    const { error: upErr } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", appointmentId);
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    const { data: rpcResult, error: rpcErr } = await supabase.rpc(
      "apply_consultation_payout",
      { p_appointment_id: appointmentId },
    );
    if (rpcErr) console.error("apply_consultation_payout", rpcErr.message);
    await insertNotification(
      supabase,
      appt.patient_id,
      "session_ended",
      "Consultation ended",
      "Your consultation has ended. Thank you for using LiffeyCare.",
      { appointmentId },
    );
    await insertNotification(
      supabase,
      appt.doctor_id,
      "session_ended",
      "Consultation ended",
      "The consultation has ended.",
      { appointmentId },
    );
    return NextResponse.json({ ok: true, payout: rpcResult ?? null });
  }
  if (action === "save_notes") {
    const updates: Record<string, unknown> = {};
    if (parsed.data.sessionNotes !== undefined && (isDoctor || isPatient)) {
      updates.session_notes = parsed.data.sessionNotes;
    }
    if (parsed.data.clinicalNotes !== undefined) {
      if (!isDoctor && user.role !== "admin") {
        return NextResponse.json(
          { error: "Only the doctor can save clinical notes" },
          { status: 403 },
        );
      }
      const { data: row } = await supabase
        .from("appointments")
        .select("clinical_notes")
        .eq("id", appointmentId)
        .single();
      const prev =
        (row?.clinical_notes as Record<string, unknown> | null) ?? {};
      updates.clinical_notes = { ...prev, ...parsed.data.clinicalNotes };
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
    }
    const { error: upErr } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", appointmentId);
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unsupported" }, { status: 400 });
}
