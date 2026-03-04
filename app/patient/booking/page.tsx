import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PatientBookingForm } from "../booking-form";
export default async function PatientBookingPage({
  searchParams,
}: {
  searchParams?: { doctorId?: string; followUpFrom?: string };
}) {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  const supabase = getSupabaseServerClient();
  const { data: doctors } = await supabase
    .from("profiles")
    .select(
      "id, full_name, consultation_price, specialty, avatar_url, hospital, rating, reviews_count",
    )
    .eq("role", "doctor")
    .eq("doctor_approved", true)
    .order("full_name", { ascending: true });
  const doctorOptions = (doctors ?? []).map((doctor) => ({
    id: doctor.id,
    fullName: doctor.full_name,
    consultationPrice: Number(doctor.consultation_price ?? 0),
    specialty: doctor.specialty,
    avatarUrl:
      (doctor as unknown as { avatar_url?: string | null }).avatar_url ?? null,
    hospital:
      (doctor as unknown as { hospital?: string | null }).hospital ?? null,
    rating: (doctor as unknown as { rating?: number | null }).rating ?? null,
    reviewsCount:
      (doctor as unknown as { reviews_count?: number | null }).reviews_count ??
      null,
  }));
  let followUp:
    | {
        parentAppointmentId: string;
        doctorId: string;
        priorVisitLabel: string;
        suggestedDurationMinutes: number | null;
      }
    | undefined;
  const followUpFrom = searchParams?.followUpFrom?.trim();
  if (followUpFrom) {
    const { data: parent } = await supabase
      .from("appointments")
      .select(
        "id, patient_id, doctor_id, slot_time, consultation_duration_minutes",
      )
      .eq("id", followUpFrom)
      .maybeSingle();
    if (parent && parent.patient_id === user?.id) {
      followUp = {
        parentAppointmentId: parent.id,
        doctorId: parent.doctor_id,
        priorVisitLabel: new Date(parent.slot_time).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        suggestedDurationMinutes: parent.consultation_duration_minutes ?? null,
      };
    }
  }
  const initialDoctorId =
    searchParams?.doctorId?.trim() || followUp?.doctorId || "";
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
          Book New Appointment
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Schedule a consultation with one of our qualified doctors
        </p>
      </div>
      <div className="max-w-5xl">
        <PatientBookingForm
          doctors={doctorOptions}
          initialDoctorId={initialDoctorId ?? ""}
          followUp={followUp}
        />
      </div>
    </div>
  );
}
