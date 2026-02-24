import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";

const updateDoctorSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  hospital: z.string().optional(),
  consultation_price: z.number().min(0).optional(),
  doctor_approved: z.boolean().optional(),
  certification: z.string().optional(),
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("id");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const supabase = getSupabaseServiceClient();

  if (doctorId) {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        doctor_availability(day_of_week, start_time, end_time)
      `)
      .eq("id", doctorId)
      .eq("role", "doctor")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ doctor: data });
  }

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "doctor")
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status === "pending") {
    query = query.eq("doctor_approved", false);
  } else if (status === "approved") {
    query = query.eq("doctor_approved", true);
  }

  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    doctors: data ?? [],
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
  const doctorId = searchParams.get("id");

  if (!doctorId) {
    return NextResponse.json({ error: "Doctor ID required" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateDoctorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.full_name !== undefined) updateData.full_name = parsed.data.full_name;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.specialty !== undefined) updateData.specialty = parsed.data.specialty;
  if (parsed.data.hospital !== undefined) updateData.hospital = parsed.data.hospital;
  if (parsed.data.consultation_price !== undefined) updateData.consultation_price = parsed.data.consultation_price;
  if (parsed.data.doctor_approved !== undefined) updateData.doctor_approved = parsed.data.doctor_approved;
  if (parsed.data.certification !== undefined) updateData.certification = parsed.data.certification;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", doctorId)
    .eq("role", "doctor")
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_updated_doctor",
    metadata: {
      doctor_id: doctorId,
      updates: Object.keys(updateData),
    },
  });

  return NextResponse.json({ doctor: data });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("id");

  if (!doctorId) {
    return NextResponse.json({ error: "Doctor ID required" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", doctorId)
    .eq("role", "doctor");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_deleted_doctor",
    metadata: { doctor_id: doctorId },
  });

  return NextResponse.json({ ok: true });
}
