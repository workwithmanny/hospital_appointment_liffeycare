import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";

const messageSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  message_type: z.enum(["email", "sms", "in_app"]).default("email"),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get("id");

  if (!recipientId) {
    return NextResponse.json({ error: "Recipient ID required" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();

  // Check if recipient exists
  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", recipientId)
    .single();

  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  // Store the message
  const { data: message, error } = await supabase
    .from("admin_messages")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      subject: parsed.data.subject,
      message: parsed.data.message,
      message_type: parsed.data.message_type,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await supabase.from("system_logs").insert({
    actor_id: user.id,
    action: "admin_sent_message",
    metadata: {
      recipient_id: recipientId,
      recipient_name: recipient.full_name,
      recipient_role: recipient.role,
      message_type: parsed.data.message_type,
      subject: parsed.data.subject,
      message_id: message.id,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Message sent to ${recipient.full_name}`,
    data: message,
  });
}

// GET messages for a user (admin can view all, users can view their own)
export async function GET(request: Request) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get("recipient_id");
  const unreadOnly = searchParams.get("unread") === "true";

  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from("admin_messages")
    .select(`
      *,
      sender:sender_id(id, full_name, role),
      recipient:recipient_id(id, full_name, role)
    `)
    .order("sent_at", { ascending: false });

  // Admin can view all messages or filter by recipient
  if (currentUser.role === "admin" && recipientId) {
    query = query.eq("recipient_id", recipientId);
  } else if (currentUser.role !== "admin") {
    // Non-admin users can only view their own messages
    query = query.eq("recipient_id", currentUser.id);
  }

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: messages ?? [] });
}

// Mark message as read
export async function PATCH(request: Request) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("id");

  if (!messageId) {
    return NextResponse.json({ error: "Message ID required" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // Verify the message belongs to the current user (or admin can mark any)
  const { data: message } = await supabase
    .from("admin_messages")
    .select("recipient_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (currentUser.role !== "admin" && message.recipient_id !== currentUser.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error } = await supabase
    .from("admin_messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
