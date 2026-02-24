import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("id");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const supabase = getSupabaseServiceClient();

  if (patientId) {
    const { data: patient, error } = await supabase
      .from("profiles")
      .select(`
        *,
        medical_history(*),
        appointments:appointments!appointments_patient_id_fkey(
          id,
          slot_time,
          status,
          doctor:doctor_id(full_name, specialty)
        )
      `)
      .eq("id", patientId)
      .eq("role", "patient")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  }

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "patient")
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    patients: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("id");

  if (!patientId) {
    return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", patientId)
    .eq("role", "patient");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_deleted_patient",
    metadata: { patient_id: patientId },
  });

  return NextResponse.json({ ok: true });
}
