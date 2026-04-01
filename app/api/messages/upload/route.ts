import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const BUCKET = "message-files";
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file");
  const appointmentId = String(form.get("appointmentId") || "");
  if (!(file instanceof File) || !appointmentId) {
    return NextResponse.json(
      { error: "File and appointment are required." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Max upload size is 20MB." },
      { status: 400 },
    );
  }
  const supabase = getSupabaseServerClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, doctor_id, patient_id")
    .eq("id", appointmentId)
    .single();
  if (
    !appointment ||
    (appointment.doctor_id !== user.id && appointment.patient_id !== user.id)
  ) {
    return NextResponse.json(
      { error: "Appointment not accessible." },
      { status: 403 },
    );
  }
  const admin = getSupabaseAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: [
        "image/*",
        "application/pdf",
        "text/plain",
        "application/zip",
        "text/csv",
        "application/json",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "audio/*",
        "video/*",
      ],
    });
  }
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${appointmentId}/${user.id}/${Date.now()}-${sanitized}`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    attachment: {
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`,
    },
  });
}
