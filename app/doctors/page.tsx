import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  DoctorDirectoryClient,
  type DoctorDirectoryItem,
} from "@/components/doctor-directory/DoctorDirectoryClient";

export default async function PublicDoctorsPage() {
  try {
    const supabase = getSupabaseServiceClient();
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
      <main className="min-h-screen bg-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <DoctorDirectoryClient
            doctors={items}
            title="Find doctors"
            subtitle="Search, filter, and book with verified specialists."
            profileBaseHref="/doctors"
            bookBaseHref="/doctors/"
          />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error loading doctors:", error);
    return (
      <main className="min-h-screen bg-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Unable to load doctors</h2>
            <p className="text-sm text-text-secondary">Please try again later.</p>
          </div>
        </div>
      </main>
    );
  }
}
