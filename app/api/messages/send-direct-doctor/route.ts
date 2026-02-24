import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
const sendDirectDoctorSchema = z.object({
  patientId: z.string().uuid(),
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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "doctor")
    return NextResponse.json(
      { error: "Only doctors can send direct messages" },
      { status: 403 },
    );
  const parsed = sendDirectDoctorSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  const supabase = getSupabaseServerClient();
  const { data: doctorProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const { data: patient } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", parsed.data.patientId)
    .eq("role", "patient")
    .single();
  if (!patient)
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      recipient_id: parsed.data.patientId,
      body: parsed.data.body,
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
