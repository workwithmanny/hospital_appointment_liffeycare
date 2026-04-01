import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "doctor")
    return NextResponse.json(
      { error: "Only doctors can upload files" },
      { status: 403 },
    );

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const patientId = formData.get("patientId") as string;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!patientId)
    return NextResponse.json({ error: "Patient ID required" }, { status: 400 });

  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize)
    return NextResponse.json({ error: "File too large" }, { status: 400 });

  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    // Documents
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Data files
    "text/csv",
    "application/json",
    "application/xml",
    "text/xml",
    // Archives
    "application/zip",
    "application/x-zip-compressed",
    // Audio/Video
    "audio/mpeg",
    "audio/wav",
    "video/mp4",
    "video/quicktime",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 },
    );
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    // Update bucket to allow all MIME types we support
    const { error: bucketError } = await supabaseAdmin.storage.updateBucket("message-files", {
      public: true,
      allowedMimeTypes: [
        "image/*",
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/json",
        "application/xml",
        "text/xml",
        "application/zip",
        "application/x-zip-compressed",
        "audio/*",
        "video/*",
      ],
    });
    if (bucketError) {
      console.log("Bucket update warning (may already exist):", bucketError.message);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `direct-messages/${user.id}/${patientId}/${fileName}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("message-files")
      .upload(filePath, file);
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("message-files").getPublicUrl(filePath);
    const attachment = {
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      publicUrl,
    };
    return NextResponse.json({ attachment });
  } catch (error: any) {
    console.error("Upload error details:", {
      message: error?.message,
      code: error?.code,
      statusCode: error?.statusCode,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
    return NextResponse.json(
      { error: `Failed to upload file: ${error?.message || "Unknown error"}` },
      { status: 500 },
    );
  }
}
