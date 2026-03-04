"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildSlotTimeIso } from "@/lib/booking/service";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { useToast } from "@/components/ui/toast";
import { Search, Star } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

type DoctorOption = {
  id: string;
  fullName: string;
  consultationPrice: number;
  specialty?: string | null;
  avatarUrl?: string | null;
  hospital?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
};

export type BookingFollowUp = {
  parentAppointmentId: string;
  priorVisitLabel: string;
  suggestedDurationMinutes: number | null;
};

type PatientBookingFormProps = {
  doctors: DoctorOption[];
  initialDoctorId?: string;
  followUp?: BookingFollowUp;
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export function PatientBookingForm({
  doctors,
  initialDoctorId = "",
  followUp,
}: PatientBookingFormProps) {
  const toast = useToast();
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(() => {
    const s = followUp?.suggestedDurationMinutes;
    if (
      s != null &&
      DURATION_OPTIONS.includes(s as (typeof DURATION_OPTIONS)[number])
    )
      return s;
    if (s != null) return Math.min(120, Math.max(15, Math.round(s / 15) * 15));
    return 30;
  });

  useEffect(() => {
    const s = followUp?.suggestedDurationMinutes;
    if (s == null) return;
    const snapped = DURATION_OPTIONS.includes(
      s as (typeof DURATION_OPTIONS)[number],
    )
      ? s
      : Math.min(120, Math.max(15, Math.round(s / 15) * 15));
    setDurationMinutes(snapped);
  }, [followUp?.parentAppointmentId, followUp?.suggestedDurationMinutes]);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (q) {
        const hay = `${d.fullName} ${d.hospital ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedSpecialties.length) {
        if (!d.specialty || !selectedSpecialties.includes(d.specialty))
          return false;
      }
      return true;
    });
  }, [doctors, query, selectedSpecialties]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
  );

  const [showAllDoctors, setShowAllDoctors] = useState(false);

  const displayedDoctors = useMemo(() => {
    if (showAllDoctors) return filteredDoctors;
    return filteredDoctors.slice(0, 10);
  }, [filteredDoctors, showAllDoctors]);

  const specialtyLabel = useMemo(() => {
    const map = new Map(SPECIALTIES.map((s) => [s.value, s.label]));
    return (v?: string | null) => (v ? (map.get(v as any) ?? v) : "");
  }, []);

  useEffect(() => {
    async function loadTimes() {
      setAvailableTimes([]);
      if (!selectedDoctorId || !selectedDate) return;
      setLoadingTimes(true);
      try {
        const res = await fetch(
          `/api/doctor/availability?doctorId=${encodeURIComponent(
            selectedDoctorId,
          )}&date=${encodeURIComponent(selectedDate)}`,
        );
        const json = (await res.json()) as { times?: string[]; error?: string };
        if (!res.ok)
          throw new Error(json.error || "Failed to load availability");
        setAvailableTimes(json.times ?? []);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load availability",
        );
        toast.push({
          kind: "error",
          title: "Availability",
          message:
            e instanceof Error ? e.message : "Failed to load availability",
          ttlMs: 4500,
        });
      } finally {
        setLoadingTimes(false);
      }
    }
    void loadTimes();
  }, [selectedDate, selectedDoctorId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const doctorId = String(form.get("doctorId") || "");
    const date = String(form.get("date") || "");
    const time = String(form.get("time") || "");
    const reason = String(form.get("reason") || "");
    const paymentMethod = String(form.get("paymentMethod") || "stripe");

    if (!doctorId || !date || !time) {
      setError("Please select doctor, date, and time.");
      toast.push({
        kind: "info",
        title: "Missing details",
        message: "Please select doctor, date, and time.",
        ttlMs: 3000,
      });
      setLoading(false);
      return;
    }

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctorId,
        slotTime: buildSlotTimeIso(date, time),
        reason,
        paymentMethod,
        consultationDurationMinutes: durationMinutes,
        ...(followUp
          ? { parentAppointmentId: followUp.parentAppointmentId }
          : {}),
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      stripeCheckoutUrl?: string;
      appointment?: { id: string };
    };

    if (!response.ok) {
      setLoading(false);
      const errorMsg =
        typeof data.error === "string"
          ? data.error
          : data.error
            ? JSON.stringify(data.error)
            : "Unable to book appointment.";
      setError(errorMsg);
      toast.push({
        kind: "error",
        title: "Booking failed",
        message: errorMsg,
        ttlMs: 4500,
      });
      return;
    }

    if (data.stripeCheckoutUrl) {
      // Save appointment ID for after payment return
      sessionStorage.setItem("pendingAppointmentId", data.appointment?.id || "");
      toast.push({
        kind: "success",
        title: "Appointment reserved",
        message:
          "Your appointment is booked — continue to pay securely. You'll see full confirmation after payment.",
        ttlMs: 4500,
      });
      window.location.assign(data.stripeCheckoutUrl);
      return;
    }

    // For non-stripe bookings, redirect to success page with appointment ID
    const appointmentId = data.appointment?.id;
    
    setLoading(false);
    window.location.href = `/patient/booking/success?id=${appointmentId}`;
  }

  return (
    <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
      {followUp ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-semibold">Follow-up visit</p>
          <p className="mt-1 text-blue-900/90">
            Linked to your prior appointment on {followUp.priorVisitLabel}. The
            same doctor is pre-selected when you opened this flow from your
            visit summary.
          </p>
          <Link
            href={`/patient/appointments/${followUp.parentAppointmentId}`}
            className="mt-2 inline-block text-xs font-semibold text-blue-700 underline hover:text-blue-900"
          >
            View prior visit
          </Link>
        </div>
      ) : null}

      {message ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          <p className="font-semibold">Appointment booked</p>
          <p className="mt-1 text-emerald-900/90">{message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search doctors or hospitals…"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedSpecialties([]);
            }}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Reset filters
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-gray-500 mr-1 hidden sm:block">
            Specialty
          </div>
          <div className="w-full sm:hidden text-xs font-semibold text-gray-500 mb-1">
            Specialty
          </div>
          {SPECIALTIES.slice(0, 10).map((s) => {
            const active = selectedSpecialties.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setSelectedSpecialties((prev) =>
                    active
                      ? prev.filter((x) => x !== s.value)
                      : [...prev, s.value],
                  );
                  setSelectedDoctorId("");
                  setSelectedDate("");
                  setAvailableTimes([]);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="label">Doctor</label>
          {filteredDoctors.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
              No doctors match this specialty.
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayedDoctors.map((doctor) => {
                const isSelected = doctor.id === selectedDoctorId;
                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoctorId(doctor.id);
                      setSelectedDate("");
                      setAvailableTimes([]);
                    }}
                    className={`text-left rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        {doctor.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={doctor.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-600">
                            {doctor.fullName
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              Dr. {doctor.fullName}
                            </div>
                            <div className="truncate text-xs text-gray-600">
                              {specialtyLabel(doctor.specialty) || "Specialist"}
                              {doctor.hospital ? ` • ${doctor.hospital}` : ""}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            ${doctor.consultationPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          {doctor.rating ? (
                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                              <Star className="h-4 w-4 text-amber-500" />
                              {doctor.rating.toFixed(1)}
                              <span className="text-gray-400 font-medium">
                                ({doctor.reviewsCount ?? 0})
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-gray-400">
                              New
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {isSelected ? "Selected" : "Click to select"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredDoctors.length > 10 && (
                <div className="flex justify-center mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAllDoctors(!showAllDoctors)}
                    className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    {showAllDoctors
                      ? `Show less (${filteredDoctors.length} doctors)`
                      : `Show more (${filteredDoctors.length - 10} more)`}
                  </button>
                </div>
              )}
            </div>
          )}
          <input type="hidden" name="doctorId" value={selectedDoctorId} />
        </div>

        {selectedDoctor ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  Booking with Dr. {selectedDoctor.fullName}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {specialtyLabel(selectedDoctor.specialty) || "Specialist"} • $
                  {selectedDoctor.consultationPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Pick a date to see available times.
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="consultationDuration">
          Consultation length (minutes)
        </label>
        <select
          id="consultationDuration"
          className="input"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
        >
          {DURATION_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} minutes
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="date">
            Appointment date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
            disabled={!selectedDoctorId}
          />
        </div>
        <div>
          <label className="label" htmlFor="time">
            Time slot
          </label>
          <select
            id="time"
            name="time"
            className="input"
            defaultValue=""
            required
            disabled={!selectedDate || loadingTimes}
          >
            <option value="">
              {loadingTimes
                ? "Loading slots..."
                : availableTimes.length
                  ? "Select slot"
                  : "No slots available"}
            </option>
            {availableTimes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="paymentMethod">
          Payment option
        </label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          className="input"
          defaultValue="stripe"
        >
          <option value="stripe">Pay with card (Stripe test mode)</option>
          <option value="pay_at_clinic">Pay at clinic</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="reason">
          Reason for visit
        </label>
        <textarea
          id="reason"
          name="reason"
          className="input min-h-[90px]"
          placeholder="Describe symptoms or consultation reason"
        />
      </div>
      {/* Messages are shown via toasts */}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Booking..." : "Confirm booking"}
      </button>
    </form>
  );
}
