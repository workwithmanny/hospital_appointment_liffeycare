import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProfileUpdatePayload = {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  specialty?: string | null;
  consultation_price?: number | null;
  age?: number | null;
  allergies?: string[] | null;
  hospital?: string | null;
  certification?: string | null;
  gender?: "male" | "female" | "other" | "prefer_not_say" | null;
  has_completed_onboarding?: boolean;
};

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, role, full_name, phone, avatar_url, specialty, consultation_price, age, allergies, hospital, certification, gender, doctor_approved, has_completed_onboarding",
    )
    .eq("id", userData.user.id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: Request) {
  const supabase = getSupabaseServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as ProfileUpdatePayload;

  // Basic validation + normalization
  const update: ProfileUpdatePayload = {};
  if (typeof payload.full_name === "string")
    update.full_name = payload.full_name.trim();
  if (payload.phone === null || typeof payload.phone === "string")
    update.phone = payload.phone;
  if (payload.avatar_url === null || typeof payload.avatar_url === "string")
    update.avatar_url = payload.avatar_url;
  if (payload.specialty === null || typeof payload.specialty === "string")
    update.specialty = payload.specialty;
  if (
    payload.consultation_price === null ||
    typeof payload.consultation_price === "number"
  ) {
    update.consultation_price = payload.consultation_price;
  }
  if (payload.age === null || typeof payload.age === "number")
    update.age = payload.age;
  if (
    payload.allergies === null ||
    (Array.isArray(payload.allergies) &&
      payload.allergies.every((a) => typeof a === "string"))
  ) {
    update.allergies =
      payload.allergies === null
        ? null
        : payload.allergies
            .map((a) => a.trim())
            .filter(Boolean)
            .slice(0, 50);
  }
  if (payload.hospital === null || typeof payload.hospital === "string")
    update.hospital = payload.hospital;
  if (
    payload.certification === null ||
    typeof payload.certification === "string"
  )
    update.certification = payload.certification;
  if (payload.gender === null ||
    payload.gender === "male" ||
    payload.gender === "female" ||
    payload.gender === "other" ||
    payload.gender === "prefer_not_say"
  ) {
    update.gender = payload.gender;
  }
  if (typeof payload.has_completed_onboarding === "boolean") {
    update.has_completed_onboarding = payload.has_completed_onboarding;
  }

  // Prevent empty updates
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userData.user.id)
    .select(
      "id, role, full_name, phone, avatar_url, specialty, consultation_price, age, allergies, hospital, certification, gender, doctor_approved, has_completed_onboarding",
    )
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
