import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapMessageRowsForViewer,
  type MessageRowFromDb,
} from "@/lib/messages/map-rows-for-chat";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messageId = params.id?.trim();
  if (!messageId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const selectWithAvatar = `id, appointment_id, message_type, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url), attachments:message_attachments(file_name, file_path)`;
  const selectNoAvatar = `id, appointment_id, message_type, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name), recipient:profiles!messages_recipient_id_fkey(full_name), attachments:message_attachments(file_name, file_path)`;

  const primary = await supabase
    .from("messages")
    .select(selectWithAvatar)
    .eq("id", messageId)
    .maybeSingle();

  const fallback =
    primary.error && String(primary.error.message).includes("avatar_url")
      ? await supabase
          .from("messages")
          .select(selectNoAvatar)
          .eq("id", messageId)
          .maybeSingle()
      : null;

  const resolved = fallback && !fallback.error ? fallback : primary;
  if (resolved.error) {
    return NextResponse.json(
      { error: resolved.error.message },
      { status: 500 },
    );
  }

  const row = resolved.data as MessageRowFromDb | null;
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.sender_id !== user.id && row.recipient_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Handle thread-based messages (no appointment check needed)
  const isThreadMessage = row.thread_id !== null;
  const isAppointmentChat =
    Boolean(row.appointment_id) && row.message_type === "appointment";
  
  // For appointment messages, verify user is participant
  if (isAppointmentChat && !isThreadMessage) {
    const { data: appt } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", row.appointment_id as string)
      .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)
      .maybeSingle();

    if (!appt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const peerFallback =
    user.role === "patient"
      ? { whenSender: "Doctor", whenRecipient: "Doctor" }
      : { whenSender: "Patient", whenRecipient: "Patient" };

  const [message] = mapMessageRowsForViewer([row], user.id, peerFallback);
  return NextResponse.json({ message });
}
