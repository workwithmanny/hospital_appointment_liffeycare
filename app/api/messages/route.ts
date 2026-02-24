import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapMessageRowsForViewer,
  type MessageRowFromDb,
} from "@/lib/messages/map-rows-for-chat";

/** Get messages for user's conversation threads (unified chat model). */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 200, 1),
    500,
  );

  const supabase = getSupabaseServerClient();

  // If threadId is provided, get messages for that specific thread
  if (threadId) {
    const selectWithAvatar = `id, thread_id, appointment_context_id, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url), attachments:message_attachments(file_name, file_path, file_size)`;
    const selectNoAvatar = `id, thread_id, appointment_context_id, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name), recipient:profiles!messages_recipient_id_fkey(full_name), attachments:message_attachments(file_name, file_path, file_size)`;

    const { data: messages, error } = await supabase
      .from("messages")
      .select(selectWithAvatar)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(limit);

    const fallback =
      error && String(error.message).includes("avatar_url")
        ? await supabase
            .from("messages")
            .select(selectNoAvatar)
            .eq("thread_id", threadId)
            .order("created_at", { ascending: true })
            .limit(limit)
        : null;

    const resolved = fallback && !fallback.error 
      ? fallback 
      : { data: messages, error };
    
    if (resolved.error) {
      return NextResponse.json(
        {
          error: resolved.error.message,
          hint:
            resolved.error.message?.includes("column") &&
            resolved.error.message?.includes("does not exist")
              ? "The messages table schema has been updated for unified chat. Please check the latest API structure."
              : undefined,
        },
        { status: 500 }
      );
    }

    const mapped = mapMessageRowsForViewer(resolved.data, user.id);
    return NextResponse.json({ messages: mapped });
  }

  // Otherwise, get all messages from all threads (legacy behavior)
  let threadQuery;
  if (user.role === "patient") {
    threadQuery = supabase
      .from("conversation_threads")
      .select("id")
      .eq("patient_id", user.id);
  } else if (user.role === "doctor") {
    threadQuery = supabase
      .from("conversation_threads")
      .select("id")
      .eq("doctor_id", user.id);
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: threads, error: threadError } = await threadQuery;

  if (threadError) {
    return NextResponse.json(
      { error: threadError.message },
      { status: 500 },
    );
  }

  const threadIds = (threads ?? []).map((t) => t.id);
  if (threadIds.length === 0) {
    return NextResponse.json({ messages: [] });
  }

  const selectWithAvatar2 = `id, thread_id, appointment_context_id, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url), attachments:message_attachments(file_name, file_path, file_size)`;
  const selectNoAvatar2 = `id, thread_id, appointment_context_id, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name), recipient:profiles!messages_recipient_id_fkey(full_name), attachments:message_attachments(file_name, file_path, file_size)`;

  const primary = await supabase
    .from("messages")
    .select(selectWithAvatar2)
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true })
    .limit(limit);

  const fallback2 =
    primary.error && String(primary.error.message).includes("avatar_url")
      ? await supabase
          .from("messages")
          .select(selectNoAvatar2)
          .in("thread_id", threadIds)
          .order("created_at", { ascending: true })
          .limit(limit)
      : null;

  const resolved2 = fallback2 && !fallback2.error 
    ? fallback2 
    : primary;
  if (resolved2.error) {
    return NextResponse.json(
      {
        error: resolved2.error.message,
        hint:
          resolved2.error.message?.includes("column") &&
          resolved2.error.message?.includes("does not exist")
            ? "The messages table schema has been updated for unified chat. Please check the latest API structure."
            : undefined,
      },
      { status: 500 }
    );
  }

  const mapped2 = mapMessageRowsForViewer(resolved2.data, user.id);
  return NextResponse.json({ messages: mapped2 });
}
