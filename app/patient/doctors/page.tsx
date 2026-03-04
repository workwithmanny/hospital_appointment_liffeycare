import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  DoctorDirectoryClient,
  type DoctorDirectoryItem,
} from "@/components/doctor-directory/DoctorDirectoryClient";
export default async function PatientDoctorsPage() {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  const supabase = getSupabaseServerClient();
  const { data: doctors } = await supabase
    .from("profiles")
    .select(
      "id, full_name, specialty, hospital, avatar_url, consultation_price, rating, reviews_count",
    )
    .eq("role", "doctor")
    .eq("doctor_approved", true)
    .order("full_name", { ascending: true })
    .limit(200);
  const doctorIds = (doctors ?? []).map((d) => d.id);
  const { data: availability } = doctorIds.length
    ? await supabase
        .from("doctor_availability")
        .select("doctor_id, day_of_week")
        .in("doctor_id", doctorIds)
    : { data: [] as Array<{ doctor_id: string; day_of_week: number }> };
  const daysByDoctor = new Map<string, Set<number>>();
  (availability ?? []).forEach((row) => {
    if (!daysByDoctor.has(row.doctor_id))
      daysByDoctor.set(row.doctor_id, new Set());
    daysByDoctor.get(row.doctor_id)!.add(row.day_of_week);
  });
  const items: DoctorDirectoryItem[] = (doctors ?? []).map((d) => ({
    id: d.id,
    fullName: d.full_name,
    avatarUrl: (d as any).avatar_url ?? null,
    specialty: d.specialty ?? null,
    hospital: (d as any).hospital ?? null,
    consultationPrice: Number(d.consultation_price ?? 0),
    rating:
      d.rating === null || d.rating === undefined ? null : Number(d.rating),
    reviewsCount: (d as any).reviews_count ?? null,
    availableDays: Array.from(daysByDoctor.get(d.id) ?? []).sort(),
  }));
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DoctorDirectoryClient
        doctors={items}
        title="Find doctors"
        subtitle="Search, filter, and book with verified specialists."
        profileBaseHref="/doctors"
        bookBaseHref="/patient/booking?doctorId="
      />
    </div>
  );
}
