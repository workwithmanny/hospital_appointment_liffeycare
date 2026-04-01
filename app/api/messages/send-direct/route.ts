import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
const sendDirectSchema = z.object({
  doctorId: z.string().uuid(),
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
  if (user.role !== "patient")
    return NextResponse.json(
      { error: "Only patients can send direct messages" },
      { status: 403 },
    );
  const parsed = sendDirectSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  const supabase = getSupabaseServerClient();
  const { data: doctor } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", parsed.data.doctorId)
    .eq("role", "doctor")
    .eq("doctor_approved", true)
    .single();
  if (!doctor)
    return NextResponse.json(
      { error: "Doctor not found or not approved." },
      { status: 404 },
    );
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      recipient_id: parsed.data.doctorId,
      body: parsed.data.body || "\u200B", // zero-width space for file-only messages
      message_type: "direct",
    })
    .select("id")
    .single();
  if (messageError || !message) {
    return NextResponse.json(
      { error: messageError?.message ?? "Unable to send message." },
      { status: 500 },
    );
  }
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
  }
  return NextResponse.json({ ok: true });
}
