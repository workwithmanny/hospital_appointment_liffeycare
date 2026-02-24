import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "patient")
    return NextResponse.json(
      { error: "Only patients can upload files" },
      { status: 403 },
    );
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const doctorId = formData.get("doctorId") as string;
  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!doctorId)
    return NextResponse.json({ error: "Doctor ID required" }, { status: 400 });
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize)
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 },
    );
  }
  try {
    const supabase = getSupabaseServerClient();
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `direct-messages/${user.id}/${doctorId}/${fileName}`;
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
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
