import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";

const banSchema = z.object({
  reason: z.string().min(1, "Ban reason is required"),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("id");

  if (!targetUserId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = banSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();

  // Check if user exists
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, role, full_name, is_banned")
    .eq("id", targetUserId)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.is_banned) {
    return NextResponse.json({ error: "User is already banned" }, { status: 409 });
  }

  // Cannot ban admins
  if (targetUser.role === "admin") {
    return NextResponse.json({ error: "Cannot ban admin users" }, { status: 403 });
  }

  // Ban the user
  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      banned_reason: parsed.data.reason,
      banned_by: user.id,
      account_status: "banned",
    })
    .eq("id", targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_banned_user",
    metadata: {
      target_user_id: targetUserId,
      target_user_name: targetUser.full_name,
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json({ 
    success: true, 
    message: `User ${targetUser.full_name} has been banned` 
  });
}
