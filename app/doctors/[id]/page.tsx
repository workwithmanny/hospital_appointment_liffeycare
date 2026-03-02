import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Star, MapPin, CalendarDays, Mail, Phone } from "lucide-react";
import { SPECIALTIES } from "@/lib/constants/specialties";
function specialtyLabel(value: string | null) {
  if (!value) return null;
  return SPECIALTIES.find((s) => s.value === value)?.label ?? value;
}
const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export default async function PublicDoctorProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { book?: string };
}) {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(auth.user);
  const { data: doctor } = await supabase
    .from("profiles")
    .select(
      "id, full_name, specialty, hospital, avatar_url, consultation_price, rating, reviews_count, phone",
    )
    .eq("id", params.id)
    .eq("role", "doctor")
    .eq("doctor_approved", true)
    .single();
  if (!doctor) return notFound();
  const { data: availability } = await supabase
    .from("doctor_availability")
    .select("day_of_week, start_time, end_time")
    .eq("doctor_id", doctor.id)
    .order("day_of_week", { ascending: true });
  const bookIntent = searchParams?.book === "1";
  const profilePath = `/doctors/${doctor.id}`;
  const bookHref = isLoggedIn
    ? `/patient/booking?doctorId=${encodeURIComponent(doctor.id)}`
    : `/auth/signup/patient?next=${encodeURIComponent(profilePath + "?book=1")}`;
  return (
    <main className="min-h-screen bg-base">
      {" "}
      <div className="max-w-6xl mx-auto px-8 py-10">
        {" "}
        <div className="flex items-center justify-between gap-4">
          {" "}
          <Link
            href="/doctors"
            className="text-sm font-semibold text-text-secondary hover:text-text-primary"
          >
            {" "}
            ← Back to doctors{" "}
          </Link>{" "}
          {bookIntent ? (
            <div className="text-xs font-semibold text-brand bg-brand-light border border-border rounded-full px-3 py-1">
              {" "}
              Ready to book{" "}
            </div>
          ) : null}{" "}
        </div>{" "}
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
          {" "}
          <div className="h-28 bg-brand-light" />{" "}
          <div className="p-6 -mt-10">
            {" "}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              {" "}
              <div className="flex items-end gap-4">
                {" "}
                <div className="h-24 w-24 rounded-2xl bg-gray-200 overflow-hidden border border-border">
                  {" "}
                  {doctor.avatar_url ? ( // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(doctor as any).avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h1 className="text-2xl font-bold text-text-primary">
                    Dr. {doctor.full_name}
                  </h1>{" "}
                  <div className="mt-1 text-sm text-text-secondary">
                    {" "}
                    {specialtyLabel(doctor.specialty ?? null) ??
                      "Specialist"}{" "}
                  </div>{" "}
                  {doctor.hospital ? (
                    <div className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                      {" "}
                      <MapPin className="h-4 w-4 text-text-tertiary" />{" "}
                      <span>{(doctor as any).hospital}</span>{" "}
                    </div>
                  ) : null}{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {" "}
                <div className="rounded-xl border border-border bg-white px-4 py-3">
                  {" "}
                  <div className="text-xs font-semibold text-text-tertiary">
                    Consultation fee
                  </div>{" "}
                  <div className="text-lg font-bold text-text-primary">
                    ${Number(doctor.consultation_price ?? 0).toFixed(2)}
                  </div>{" "}
                </div>{" "}
                <Link
                  href={bookHref}
                  className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
                >
                  {" "}
                  Book appointment{" "}
                </Link>{" "}
                <a
                  href={`mailto:${doctor.full_name.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-text-primary hover:bg-subtle transition-colors"
                >
                  <Mail className="h-4 w-4" /> Email
                </a>
                {doctor.phone && (
                  <a
                    href={`tel:${doctor.phone}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-text-primary hover:bg-subtle transition-colors"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                )}
              </div>{" "}
            </div>{" "}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {" "}
              <div className="rounded-xl border border-border bg-white p-4">
                {" "}
                <div className="text-xs font-semibold text-text-tertiary">
                  Rating
                </div>{" "}
                {doctor.rating !== null && doctor.rating !== undefined ? (
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
                    {" "}
                    <Star className="h-4 w-4 text-amber-500" />{" "}
                    {Number(doctor.rating).toFixed(1)}{" "}
                    <span className="text-text-tertiary font-medium">
                      ({(doctor as any).reviews_count ?? 0} reviews)
                    </span>{" "}
                  </div>
                ) : (
                  <div className="mt-1 text-sm font-semibold text-text-tertiary">
                    New
                  </div>
                )}{" "}
              </div>{" "}
              <div className="rounded-xl border border-border bg-white p-4 md:col-span-2">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <CalendarDays className="h-4 w-4 text-emerald-600" />{" "}
                  <div className="text-xs font-semibold text-text-tertiary">
                    Availability
                  </div>{" "}
                </div>{" "}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {" "}
                  {(availability ?? []).length ? (
                    (availability ?? []).map((row) => (
                      <div
                        key={`${row.day_of_week}-${row.start_time}`}
                        className="rounded-lg border border-border bg-subtle px-3 py-2"
                      >
                        {" "}
                        <div className="text-xs font-semibold text-text-primary">
                          {dayNames[row.day_of_week]}
                        </div>{" "}
                        <div className="text-xs text-text-secondary">
                          {" "}
                          {row.start_time} – {row.end_time}{" "}
                        </div>{" "}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-text-secondary">
                      No schedule published yet.
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {!isLoggedIn ? (
              <div className="mt-6 rounded-xl border border-border bg-brand-light p-4 text-sm text-text-secondary">
                {" "}
                To book, you’ll need a patient account. Clicking{" "}
                <span className="font-semibold text-text-primary">
                  Book appointment
                </span>{" "}
                will take you to signup.{" "}
              </div>
            ) : null}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </main>
  );
}
