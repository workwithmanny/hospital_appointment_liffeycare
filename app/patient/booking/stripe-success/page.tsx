import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  MessageSquare,
  User,
  Receipt,
  Home,
  Building2,
  CreditCard,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CopyButton } from "@/components/ui/copy-button";
import { markAppointmentPaidFromStripeSession } from "@/lib/stripe/mark-paid";
import { getStripe } from "@/lib/stripe/server";

export default async function StripeBookingSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id?.trim();
  if (!sessionId) {
    return (
      <div className="min-h-[80vh] p-6 flex items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-red-600 rotate-45" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Missing</h1>
          <p className="text-gray-600">We couldn't verify your payment session.</p>
          <Link href="/patient/booking" className="btn-primary mt-6 inline-block">
            Go back to booking
          </Link>
        </div>
      </div>
    );
  }

  const user = await getSessionUser();
  if (!user || user.role !== "patient") {
    return (
      <div className="min-h-[80vh] p-6 flex items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Unauthorized</h1>
          <p className="mt-2 text-gray-600">Please log in to view this page.</p>
          <Link href="/auth/login" className="btn-primary mt-6 inline-block">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return (
      <div className="min-h-[80vh] p-6 flex items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Configuration Error</h1>
          <p className="mt-2 text-gray-600">Stripe is not configured correctly on this server.</p>
        </div>
      </div>
    );
  }

  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return (
      <div className="min-h-[80vh] p-6 flex items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Session</h1>
          <p className="mt-2 text-gray-600">The provided payment session is invalid.</p>
        </div>
      </div>
    );
  }

  const appointmentId = checkoutSession.metadata?.appointment_id;
  if (!appointmentId) {
    return (
      <div className="min-h-[80vh] p-6 flex items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Appointment Not Found</h1>
          <p className="mt-2 text-gray-600">This payment is not linked to any appointment.</p>
        </div>
      </div>
    );
  }

  const supabase = getSupabaseServerClient();

  // Fetch full appointment details with doctor info
  const { data: appointment, error: apptError } = await supabase
    .from("appointments")
    .select("id, slot_time, status, payment_method, payment_status, amount_paid, doctor_id, patient_id")
    .eq("id", appointmentId)
    .single();

  if (apptError || !appointment || appointment.patient_id !== user.id) {
    return (
      <div className="min-h-[80vh] p-6 flex items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to view this appointment.</p>
        </div>
      </div>
    );
  }

  // Fetch doctor details
  const { data: doctor } = await supabase
    .from("profiles")
    .select("full_name, specialty, hospital, phone")
    .eq("id", appointment.doctor_id)
    .single();

  // Mark as paid if not already
  if (checkoutSession.payment_status === "paid") {
    await markAppointmentPaidFromStripeSession(checkoutSession);
  }

  const transactionId = (checkoutSession.payment_intent as string) || checkoutSession.id;
  const amountPaid = Number(checkoutSession.amount_total || 0) / 100;

  const slotTime = new Date(appointment.slot_time);
  const formattedDate = slotTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = slotTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-[80vh] p-6">
      <div className="mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-2">
            Payment Confirmed
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Appointment Booked Successfully
          </h1>
          <p className="text-gray-600">
            Your appointment has been scheduled and payment received. A confirmation email has been sent.
          </p>
        </div>

        {/* Appointment Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    Dr. {doctor?.full_name || "Your Doctor"}
                  </p>
                  <p className="text-blue-100 text-sm">
                    {doctor?.specialty || "Specialist"}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                Paid Online
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-4">
            {/* Hospital Location */}
            {doctor?.hospital && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-0.5">Hospital/Clinic</p>
                  <p className="font-semibold text-gray-900">{doctor.hospital}</p>
                  {doctor?.phone && (
                    <p className="text-sm text-gray-600 mt-0.5">
                      Contact: {doctor.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-0.5">Date & Time</p>
                <p className="font-semibold text-gray-900">{formattedDate}</p>
                <p className="text-gray-600">{formattedTime}</p>
              </div>
            </div>

            {/* Consultation Fee */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-0.5">Consultation Fee</p>
                <p className="font-semibold text-gray-900">${amountPaid.toFixed(2)}</p>
                <p className="text-emerald-600 text-sm">✓ Payment completed via Stripe</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-0.5">Payment Method</p>
                <p className="font-semibold text-gray-900">Online Card Payment (Stripe)</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded truncate max-w-[200px]">
                    {transactionId}
                  </span>
                  <CopyButton text={transactionId} />
                </div>
              </div>
            </div>

            {/* Appointment ID */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-0.5">Appointment ID</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-900 truncate">
                    {appointment.id}
                  </span>
                  <CopyButton text={appointment.id} />
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Please arrive 10 minutes early</p>
                <p className="text-sm text-gray-500">
                  You can message your doctor anytime before the appointment from the chat section.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <Link
            href={`/patient/appointments/${appointment.id}`}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            View Full Appointment Details
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/patient/chat"
              className="flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Message Doctor
            </Link>
            <Link
              href="/patient"
              className="flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Need to make changes? You can reschedule or cancel from your appointments page up to 24 hours before your scheduled time.
        </p>

        {/* Email Confirmation */}
        <p className="mt-4 text-center text-xs text-gray-400">
          A confirmation email has been sent to {checkoutSession.customer_details?.email ?? user.email}.
        </p>
      </div>
    </div>
  );
}
