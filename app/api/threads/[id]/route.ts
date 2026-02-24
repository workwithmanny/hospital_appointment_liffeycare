import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  // Get thread with participant details and messages
  const selectWithAvatar = `id, thread_id, appointment_context_id, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url), attachments:message_attachments(file_name, file_path, file_size)`;
  const selectNoAvatar = `id, thread_id, appointment_context_id, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name), recipient:profiles!messages_recipient_id_fkey(full_name), attachments:message_attachments(file_name, file_path, file_size)`;

  const { data: thread, error } = await supabase
    .from("conversation_threads")
    .select(`
      *,
      patient:profiles!conversation_threads_patient_id_fkey(
        id,
        full_name,
        avatar_url,
        age,
        allergies,
        is_online,
        last_seen_at
      ),
      doctor:profiles!conversation_threads_doctor_id_fkey(
        id,
        full_name,
        avatar_url,
        specialty,
        hospital,
        is_online,
        last_seen_at
      ),
      messages:messages(${selectWithAvatar})
    `)
    .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }

  // Verify user is participant in this thread
  if (thread.patient_id !== user.id && thread.doctor_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Sort messages chronologically
  const sortedMessages = (thread.messages || [])
    .sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  // Get appointment context for messages that have it
  const appointmentIds = [...new Set(
    sortedMessages
      .filter((msg: any) => msg.appointment_context_id)
      .map((msg: any) => msg.appointment_context_id)
  )];

  let appointmentContexts: any[] = [];
  if (appointmentIds.length > 0) {
    const { data: appointments } = await supabase
      .from("appointments")
      .select(`
        id,
        slot_time,
        status,
        session_notes
      `)
      .in("id", appointmentIds);

    appointmentContexts = appointments || [];
  }

  // Enrich messages with appointment context and transform field names
  const enrichedMessages = sortedMessages.map((msg: any) => ({
    id: msg.id,
    thread_id: msg.thread_id,
    appointment_context_id: msg.appointment_context_id,
    senderId: msg.sender_id,
    recipientId: msg.recipient_id,
    senderName: msg.sender?.full_name || 'Unknown',
    recipientName: msg.recipient?.full_name || 'Unknown',
    senderAvatarUrl: msg.sender?.avatar_url || null,
    recipientAvatarUrl: msg.recipient?.avatar_url || null,
    body: msg.body,
    createdAt: msg.created_at,
    readAt: msg.read_at,
    attachments: msg.attachments.map((att: any) => ({
      fileName: att.file_name,
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-files/${att.file_path}`,
    })),
    appointmentContext: appointmentContexts.find(
      (apt: any) => apt.id === msg.appointment_context_id
    ) || null
  }));

  return NextResponse.json({
    thread: {
      ...thread,
      messages: enrichedMessages
    },
    debug: {
      threadId: params.id,
      userId: user.id,
      userRole: user.role,
      messageCount: enrichedMessages.length,
      firstMessageSenderId: enrichedMessages[0]?.senderId,
      firstMessageSenderType: typeof enrichedMessages[0]?.senderId
    }
  });
}
