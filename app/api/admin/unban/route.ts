import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

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

  const supabase = getSupabaseServiceClient();

  // Check if user exists
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, full_name, is_banned")
    .eq("id", targetUserId)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!targetUser.is_banned) {
    return NextResponse.json({ error: "User is not banned" }, { status: 409 });
  }

  // Unban the user
  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: false,
      banned_at: null,
      banned_reason: null,
      banned_by: null,
      account_status: "active",
    })
    .eq("id", targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_unbanned_user",
    metadata: {
      target_user_id: targetUserId,
      target_user_name: targetUser.full_name,
    },
  });

  return NextResponse.json({ 
    success: true, 
    message: `User ${targetUser.full_name} has been unbanned` 
  });
}
