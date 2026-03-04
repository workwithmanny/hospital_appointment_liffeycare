"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  MessageSquare,
  User,
  Receipt,
  Home,
  Building2,
  RefreshCw,
  Loader2,
  Copy,
} from "lucide-react";

interface AppointmentData {
  id: string;
  slot_time: string;
  status: string;
  payment_method: string;
  payment_status: string;
  amount_paid: number;
  reason: string;
  doctor: {
    full_name: string;
    specialty: string;
    hospital: string;
    phone: string;
  } | {
    full_name: string;
    specialty: string;
    hospital: string;
    phone: string;
  }[];
}

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("id");
  
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState(0);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) {
      setError("No appointment ID provided in URL");
      setLoading(false);
      return;
    }

    console.log("Success page: Fetching appointment", appointmentId);
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const res = await fetch(`/api/appointments/${appointmentId}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      console.log("Success page: API response", res.status, data);

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch appointment (${res.status})`);
      }

      if (!data || !data.id) {
        throw new Error("Invalid appointment data received");
      }

      setAppointment(data);
    } catch (err: any) {
      console.error("Success page: Error fetching appointment:", err);
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(err.message || "Could not load appointment details");
      }
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // Track loading time for user feedback
  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-[80vh] p-6 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">Loading your appointment details...</p>
        {loadingTime > 3 && (
          <p className="mt-2 text-sm text-gray-500">
            This is taking longer than expected. Please wait...
          </p>
        )}
        {loadingTime > 10 && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Still loading? Click to refresh
          </button>
        )}
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-[80vh] p-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-4">
              <Calendar className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Appointment Not Found
            </h1>
            <p className="text-red-600">{error || "Appointment details could not be loaded"}</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={fetchAppointment}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            
            <div className="flex gap-3 justify-center">
              <Link
                href="/patient/appointments"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                View your appointments
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          {appointmentId && (
            <p className="mt-4 text-xs text-gray-500">
              Appointment ID: {appointmentId}
            </p>
          )}
        </div>
      </div>
    );
  }

  const doctor = Array.isArray(appointment.doctor) 
    ? appointment.doctor[0] 
    : appointment.doctor;
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

  const getPaymentLabel = (method: string) => {
    if (method === "stripe" || appointment.payment_status === "paid") 
      return { label: "Paid Online", color: "bg-emerald-100 text-emerald-700" };
    if (method === "pay_at_clinic") 
      return { label: "Pay at Clinic", color: "bg-amber-100 text-amber-700" };
    return { label: method, color: "bg-gray-100 text-gray-700" };
  };

  const paymentInfo = getPaymentLabel(appointment.payment_method);

  return (
    <div className="min-h-[80vh] p-6">
      <div className="mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-2">
            Booking Confirmed
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Appointment Booked Successfully
          </h1>
          <p className="text-gray-600">
            Your appointment has been scheduled. A confirmation email has been sent to your registered address.
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
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentInfo.color}`}>
                {paymentInfo.label}
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
            {appointment.amount_paid > 0 && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-0.5">Consultation Fee</p>
                  <p className="font-semibold text-gray-900">
                    ${Number(appointment.amount_paid).toFixed(2)}
                  </p>
                  {appointment.payment_method === "pay_at_clinic" && (
                    <p className="text-amber-600 text-sm">
                      Please pay at the clinic before your appointment
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reason for Visit */}
            {appointment.reason && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-0.5">Reason for Visit</p>
                  <p className="text-gray-900">{appointment.reason}</p>
                </div>
              </div>
            )}

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
                  <button
                    onClick={() => navigator.clipboard.writeText(appointment.id)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copy appointment ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
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
      </div>
    </div>
  );
}
