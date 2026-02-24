import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const sendDirectChatSchema = z.object({
  recipientId: z.string().uuid(),
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

  const parsed = sendDirectChatSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();

  // Verify the recipient exists and is a valid chat partner
  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", parsed.data.recipientId)
    .single();

  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found." },
      { status: 404 },
    );
  }

  // Validate that this is a patient-doctor or doctor-patient conversation
  const validConversation = 
    (user.role === "patient" && recipient.role === "doctor") ||
    (user.role === "doctor" && recipient.role === "patient");

  if (!validConversation) {
    return NextResponse.json(
      { error: "Invalid conversation type." },
      { status: 403 },
    );
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      recipient_id: parsed.data.recipientId,
      body: parsed.data.body,
      message_type: "direct",
      // No appointment_id for direct messages
    })
    .select("id, created_at, read_at")
    .single();

  if (messageError || !message) {
    return NextResponse.json(
      { error: messageError?.message ?? "Unable to send message." },
      { status: 500 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let attachments: Array<{ fileName: string; publicUrl: string }> = [];

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

    const publicUrl =
      parsed.data.attachment.publicUrl ??
      (baseUrl
        ? `${baseUrl}/storage/v1/object/public/message-files/${parsed.data.attachment.filePath}`
        : parsed.data.attachment.filePath);

    attachments = [{ fileName: parsed.data.attachment.fileName, publicUrl }];
  }

  return NextResponse.json({
    ok: true,
    message: {
      id: message.id,
      appointmentId: null, // Direct messages have no appointment
      senderId: user.id,
      recipientId: parsed.data.recipientId,
      body: parsed.data.body,
      createdAt: message.created_at,
      readAt: message.read_at,
      attachments,
    },
  });
}
