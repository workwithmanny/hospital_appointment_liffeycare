import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseServerClient();
  
  let query = supabase
    .from("app_notifications")
    .select("id, kind, title, body, read_at, metadata, created_at")
    .eq("user_id", user.id);
  
  if (type) {
    query = query.eq("kind", type);
  }
  
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(100);
  
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  
  const unreadCount = data?.filter(n => !n.read_at).length ?? 0;
  return NextResponse.json({ notifications: data ?? [], unreadCount });
}
export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    ids?: string[];
    notificationId?: string;
    markAllRead?: boolean;
    markAll?: boolean;
  };
  console.log("[Notifications PATCH] user:", user.id, "body:", body);
  const supabase = getSupabaseServerClient();
  if (body.markAllRead || body.markAll) {
    console.log("[Notifications PATCH] Marking all as read for user:", user.id);
    const { data, error } = await supabase
      .from("app_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null)
      .select();
    console.log("[Notifications PATCH] Result:", { data, error });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, updated: data?.length || 0 });
  }
  if (body.notificationId) {
    console.log("[Notifications PATCH] Marking single as read:", body.notificationId);
    const { data, error } = await supabase
      .from("app_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("id", body.notificationId)
      .select();
    console.log("[Notifications PATCH] Result:", { data, error });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, updated: data?.length || 0 });
  }
  if (!body.ids?.length) {
    return NextResponse.json(
      { error: "ids or markAllRead required" },
      { status: 400 },
    );
  }
  const { error } = await supabase
    .from("app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("id", body.ids);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    ids?: string[];
    clearAll?: boolean;
  };
  const supabase = getSupabaseServerClient();
  
  if (body.clearAll) {
    const { error } = await supabase
      .from("app_notifications")
      .delete()
      .eq("user_id", user.id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  
  if (!body.ids?.length) {
    return NextResponse.json(
      { error: "ids or clearAll required" },
      { status: 400 },
    );
  }
  
  const { error } = await supabase
    .from("app_notifications")
    .delete()
    .eq("user_id", user.id)
    .in("id", body.ids);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
