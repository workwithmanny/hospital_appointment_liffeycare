import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm, type ProfileData } from "@/components/profile-form";
type ProfileRow = {
  id: string;
  role: ProfileData["role"];
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  specialty: string | null;
  consultation_price: number | string | null;
  age: number | null;
  allergies: string[] | null;
};
export default async function PatientProfilePage() {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, role, full_name, phone, avatar_url, specialty, consultation_price, age, allergies",
    )
    .eq("id", user!.id)
    .single();
  const profile = (data ?? null) as ProfileRow | null;
  const initialProfile: ProfileData = {
    id: profile?.id ?? user!.id,
    role: (profile?.role as ProfileData["role"]) ?? "patient",
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? null,
    avatar_url: profile?.avatar_url ?? null,
    specialty: profile?.specialty ?? null,
    consultation_price: profile?.consultation_price
      ? Number(profile.consultation_price)
      : null,
    age: profile?.age ?? null,
    allergies: profile?.allergies ?? null,
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ProfileForm initialProfile={initialProfile} mode="patient" />
    </div>
  );
}
