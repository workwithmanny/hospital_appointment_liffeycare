import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
const sendSchema = z.object({
  appointmentId: z.string().uuid(),
  body: z.string().max(1000),
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
}).refine((data) => data.body.length > 0 || data.attachment, {
  message: "Message or attachment is required",
  path: ["body"],
});
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = sendSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  const supabase = getSupabaseServerClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, doctor_id, patient_id")
    .eq("id", parsed.data.appointmentId)
    .single();
  if (!appointment)
    return NextResponse.json(
      { error: "Appointment not found." },
      { status: 404 },
    );
  if (appointment.doctor_id !== user.id && appointment.patient_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const recipientId =
    appointment.doctor_id === user.id
      ? appointment.patient_id
      : appointment.doctor_id;
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      appointment_id: appointment.id,
      sender_id: user.id,
      recipient_id: recipientId,
      body: parsed.data.body || "\u200B", // zero-width space for file-only messages
      message_type: "appointment",
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
      appointmentId: appointment.id,
      senderId: user.id,
      recipientId,
      body: parsed.data.body,
      createdAt: message.created_at,
      readAt: message.read_at,
      attachments,
    },
  });
}
