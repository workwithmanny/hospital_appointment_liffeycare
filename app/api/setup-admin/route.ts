import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
export async function POST(request: Request) {
  try {
    const { email, secret } = (await request.json()) as {
      email?: string;
      secret?: string;
    };
    const normalizedEmail = (email ?? "").trim().toLowerCase();
    const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: "ADMIN_BOOTSTRAP_SECRET is not configured." },
        { status: 500 },
      );
    }
    if (!normalizedEmail || !secret) {
      return NextResponse.json(
        { error: "Email and bootstrap secret are required." },
        { status: 400 },
      );
    }
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid bootstrap secret." },
        { status: 401 },
      );
    }
    const supabaseAdmin = getSupabaseAdminClient();
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    const matchedUser = usersData.users.find(
      (user) => (user.email ?? "").toLowerCase() === normalizedEmail,
    );
    if (!matchedUser) {
      return NextResponse.json(
        {
          error:
            "No user found with that email. Create/sign in that account first.",
        },
        { status: 404 },
      );
    }
    const fallbackName = matchedUser.user_metadata?.full_name
      ? String(matchedUser.user_metadata.full_name)
      : normalizedEmail.split("@")[0];
    const phone = matchedUser.user_metadata?.phone
      ? String(matchedUser.user_metadata.phone)
      : null;
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: matchedUser.id,
        role: "admin",
        full_name: fallbackName,
        phone,
        doctor_approved: true,
      });
    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
    }
    return NextResponse.json({
      message:
        "Admin role granted successfully. Sign out and sign in as Administrator.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
