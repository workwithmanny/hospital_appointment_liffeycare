import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const sendThreadMessageSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(1000),
  attachment: z
    .object({
      fileName: z.string(),
      filePath: z.string(),
      fileSize: z
        .number()
        .int()
        .positive()
        .max(20 * 1024 * 1024),
      mimeType: z.string(),
      publicUrl: z.string().url().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = sendThreadMessageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();

  // Get thread and verify user is participant
  const { data: thread, error: threadError } = await supabase
    .from("conversation_threads")
    .select(`
      *,
      patient:profiles!conversation_threads_patient_id_fkey(full_name, phone),
      doctor:profiles!conversation_threads_doctor_id_fkey(full_name, phone)
    `)
    .eq("id", parsed.data.threadId)
    .single();

  if (threadError || !thread) {
    return NextResponse.json(
      { error: "Conversation thread not found" },
      { status: 404 },
    );
  }

  // Verify user is participant
  if (thread.patient_id !== user.id && thread.doctor_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determine recipient
  const recipientId = thread.patient_id === user.id ? thread.doctor_id : thread.patient_id;

  // Create message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      thread_id: parsed.data.threadId,
      sender_id: user.id,
      recipient_id: recipientId,
      body: parsed.data.body,
      message_type: "direct",
    })
    .select(`
      id,
      thread_id,
      sender_id,
      recipient_id,
      body,
      created_at,
      read_at,
      sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
      recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url)
    `)
    .single();

  if (messageError || !message) {
    return NextResponse.json(
      { error: messageError?.message ?? "Unable to send message." },
      { status: 500 },
    );
  }

  // Handle attachment if provided
  let attachmentData = null;
  if (parsed.data.attachment) {
    const { error: attachmentError } = await supabase
      .from("message_attachments")
      .insert({
        message_id: message.id,
        file_name: parsed.data.attachment.fileName,
        file_path: parsed.data.attachment.filePath,
        file_size: parsed.data.attachment.fileSize,
        mime_type: parsed.data.attachment.mimeType,
      });
    
    if (attachmentError) {
      return NextResponse.json(
        { error: attachmentError.message },
        { status: 500 },
      );
    }
    
    attachmentData = {
      fileName: parsed.data.attachment.fileName,
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-files/${parsed.data.attachment.filePath}`,
    };
  }

  // Transform message to camelCase format expected by client
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const senderProf = message.sender as { full_name?: string; avatar_url?: string } | null;
  const recipProf = message.recipient as { full_name?: string; avatar_url?: string } | null;
  
  const recipientLabel = user.role === "patient" ? "Doctor" : "Patient";

  return NextResponse.json({ 
    success: true,
    messageId: message.id,
    message: {
      id: message.id,
      threadId: message.thread_id,
      appointmentId: null,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      senderName: senderProf?.full_name || "You",
      recipientName: recipProf?.full_name || recipientLabel,
      senderAvatarUrl: senderProf?.avatar_url || null,
      recipientAvatarUrl: recipProf?.avatar_url || null,
      body: message.body,
      createdAt: message.created_at,
      readAt: message.read_at,
      attachments: attachmentData ? [attachmentData] : [],
    }
  });
}
