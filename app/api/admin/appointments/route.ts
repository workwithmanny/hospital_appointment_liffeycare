import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";

const updateAppointmentSchema = z.object({
  status: z.enum(["scheduled", "cancelled", "completed", "in_progress"]).optional(),
  slot_time: z.string().datetime().optional(),
  doctor_id: z.string().uuid().optional(),
  cancellation_reason: z.string().optional(),
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const doctorId = searchParams.get("doctorId");
  const patientId = searchParams.get("patientId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from("appointments")
    .select(`
      *,
      patient:patient_id(id, full_name, phone),
      doctor:doctor_id(id, full_name, specialty)
    `, { count: "exact" })
    .order("slot_time", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) {
    query = query.eq("status", status);
  }
  if (dateFrom) {
    query = query.gte("slot_time", dateFrom);
  }
  if (dateTo) {
    query = query.lte("slot_time", dateTo);
  }
  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }
  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    appointments: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("id");

  if (!appointmentId) {
    return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.slot_time !== undefined) updateData.slot_time = parsed.data.slot_time;
  if (parsed.data.doctor_id !== undefined) updateData.doctor_id = parsed.data.doctor_id;
  if (parsed.data.cancellation_reason !== undefined) updateData.cancellation_reason = parsed.data.cancellation_reason;

  const { data, error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", appointmentId)
    .select(`
      *,
      patient:patient_id(id, full_name),
      doctor:doctor_id(id, full_name)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_updated_appointment",
    metadata: {
      appointment_id: appointmentId,
      updates: Object.keys(updateData),
    },
  });

  return NextResponse.json({ appointment: data });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("id");

  if (!appointmentId) {
    return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_deleted_appointment",
    metadata: { appointment_id: appointmentId },
  });

  return NextResponse.json({ ok: true });
}
