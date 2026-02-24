import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const patientId = params.id;
  
  if (!patientId) {
    return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
  }

  try {
    const adminClient = getSupabaseAdminClient();
    
    // Get user by ID from auth.users
    const { data: userData, error } = await adminClient.auth.admin.getUserById(patientId);
    
    if (error || !userData?.user) {
      return NextResponse.json({ email: null }, { status: 404 });
    }
    
    return NextResponse.json({ email: userData.user.email });
  } catch (err) {
    console.error("Error fetching patient email:", err);
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 });
  }
}
