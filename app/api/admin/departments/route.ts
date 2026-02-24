import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";

const departmentSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ departments: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = departmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("departments")
    .insert({ name: parsed.data.name })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Department with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_created_department",
    metadata: { department_id: data.id, name: data.name },
  });

  return NextResponse.json({ department: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("id");

  if (!departmentId) {
    return NextResponse.json({ error: "Department ID required" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", departmentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_deleted_department",
    metadata: { department_id: departmentId },
  });

  return NextResponse.json({ ok: true });
}
