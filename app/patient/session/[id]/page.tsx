"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MessageCircle,
  Clock,
  UserCircle,
  CheckCircle,
  FileText,
  Calendar,
  ClipboardList,
  Stethoscope,
  NotebookPen,
  ArrowLeft,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  CLINICAL_NOTE_FIELDS,
  parseClinicalNotes,
} from "@/lib/appointments/clinical-notes";
import { SessionChat } from "@/components/session/SessionChat";
import { useSessionNotification } from "@/components/session/SessionNotificationProvider";

type ApptRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_time: string;
  status: string;
  session_notes: string | null;
  clinical_notes: Record<string, string> | null;
  consultation_duration_minutes: number | null;
  session_started_at: string | null;
  session_ends_at: string | null;
  doctor_joined_at: string | null;
  patient_joined_at: string | null;
  doctor?: { full_name: string | null; specialty: string | null } | null;
};

export default function PatientSessionPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const appointmentId = params.id as string;
  const supabase = getSupabaseClient();
  const [appt, setAppt] = useState<ApptRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [showClinicalNotes, setShowClinicalNotes] = useState(false);
  const joinedSent = useRef(false);
  const endSent = useRef(false);
  
  const doctorName = appt?.doctor?.full_name || "Doctor";
  const specialty = appt?.doctor?.specialty || "General";

  const { setActiveSession, setIsMinimized } = useSessionNotification();

  const clinicalNotes = appt?.clinical_notes ? parseClinicalNotes(appt.clinical_notes) : {};

  useEffect(() => {
    if (!appt) return;
    
    const status = appt.status === "in_progress" ? "active" : 
                   appt.status === "scheduled" ? "waiting" : "ended";
    
    setActiveSession({
      appointmentId,
      userRole: "patient",
      otherPartyName: `Dr. ${doctorName}`,
      otherPartyId: appt.doctor_id,
      startTime: appt.session_started_at ? new Date(appt.session_started_at) : new Date(),
      endsAt: appt.session_ends_at ? new Date(appt.session_ends_at) : undefined,
      status,
    });
    setIsMinimized(false);
  }, [appt, appointmentId, doctorName, setActiveSession, setIsMinimized]);

  const refreshAppt = useCallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `id, patient_id, doctor_id, slot_time, status, session_notes, clinical_notes, consultation_duration_minutes, session_started_at, session_ends_at, doctor_joined_at, patient_joined_at, doctor:profiles!appointments_doctor_id_fkey(full_name, specialty)`,
      )
      .eq("id", appointmentId)
      .single();
    if (error || !data) return null;
    const row = data as unknown as ApptRow;
    const doc = row.doctor;
    row.doctor = Array.isArray(doc) ? doc[0] : doc;
    setAppt(row);
    return row;
  }, [appointmentId, supabase]);

  useEffect(() => {
    if (!appointmentId) return;
    
    (async () => {
      const row = await refreshAppt();
      if (!row) {
        router.push("/patient/appointments");
        return;
      }

      if (!joinedSent.current) {
        joinedSent.current = true;
        await fetch(`/api/appointments/${appointmentId}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "patient_join" }),
        });
      }

      setLoading(false);
    })();

    const ch = supabase
      .channel(`patient-session-${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${appointmentId}`,
        },
        (payload) => {
          const n = payload.new as Record<string, unknown>;
          setAppt((prev) => (prev ? { ...prev, ...n } : prev));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [appointmentId, refreshAppt, router, supabase]);

  const sessionActive = appt?.status === "in_progress";
  const sessionEnded =
    appt?.status === "completed" || appt?.status === "cancelled";
  const waiting = appt && !sessionActive && !sessionEnded;

  useEffect(() => {
    if (!sessionActive || !appt?.session_ends_at) {
      setRemainingSec(null);
      return;
    }
    const tick = () => {
      const sec = Math.max(
        0,
        Math.floor(
          (new Date(appt.session_ends_at!).getTime() - Date.now()) / 1000,
        ),
      );
      setRemainingSec(sec);
      if (sec === 0 && !endSent.current) {
        endSent.current = true;
        void fetch(`/api/appointments/${appointmentId}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end" }),
        }).then(() => {
          toast.push({
            kind: "info",
            title: "Time's up",
            message: "This consultation has ended.",
            ttlMs: 5000,
          });
          void refreshAppt();
          setTimeout(() => router.push("/patient/appointments"), 2500);
        });
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [
    sessionActive,
    appt?.session_ends_at,
    appointmentId,
    router,
    toast,
    refreshAppt,
  ]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const endSession = async () => {
    if (!showEndConfirm) {
      setShowEndConfirm(true);
      return;
    }
    setShowEndConfirm(false);
    const res = await fetch(`/api/appointments/${appointmentId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    if (!res.ok) {
      toast.push({
        kind: "error",
        title: "Could not end",
        message: "Try again.",
        ttlMs: 4000,
      });
      return;
    }
    toast.push({
      kind: "success",
      title: "Ended",
      message: "Consultation ended.",
      ttlMs: 3000,
    });
    void refreshAppt();
    setTimeout(() => router.push("/patient/appointments"), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen flex-col bg-base overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-border bg-white px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link 
              href="/patient/appointments" 
              className="flex-shrink-0 p-2 -ml-2 rounded-xl hover:bg-subtle transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488]">
              <UserCircle className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-text-primary text-sm md:text-base truncate">
                Dr. {doctorName}
              </h2>
              <p className="text-xs text-text-secondary truncate">{specialty}</p>
            </div>
            {sessionActive && remainingSec !== null && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#14b6a6]/10 text-[#14b6a6]">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold tabular-nums">
                  {formatCountdown(remainingSec)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/patient/appointments/${appointmentId}`}
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-subtle transition-colors"
            >
              <ClipboardList className="h-4 w-4" /> Details
            </Link>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${waiting ? "bg-amber-100 text-amber-800" : sessionActive ? "bg-[#14b6a6]/10 text-[#14b6a6]" : "bg-gray-100 text-gray-600"}`}
            >
              {waiting ? "Waiting" : sessionActive ? "Live" : sessionEnded ? "Ended" : "—"}
            </span>
            {sessionActive && (
              <>
                {showEndConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={endSession}
                      className="rounded-xl bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      End?
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEndConfirm(false)}
                      className="rounded-xl border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:bg-subtle"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={endSession}
                    className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    End
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Timer Banner */}
      {sessionActive && remainingSec !== null && (
        <div className="sm:hidden flex-shrink-0 bg-[#14b6a6]/10 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#14b6a6]">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-semibold tabular-nums">
              {formatCountdown(remainingSec)} remaining
            </span>
          </div>
        </div>
      )}

      {/* Appointment Info Bar */}
      <div className="flex-shrink-0 border-b border-border bg-subtle/50 px-4 py-2.5 md:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {appt ? new Date(appt.slot_time).toLocaleString() : "—"}
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate">{appt?.session_notes || "Consultation"}</span>
          </span>
        </div>
      </div>

      {/* Chat Section - Takes remaining space */}
      <div className="flex-1 min-h-0 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full text-text-secondary">
            <div className="animate-pulse">Loading…</div>
          </div>
        ) : waiting ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-6">
            <div className="w-16 h-16 rounded-2xl bg-[#14b6a6]/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-[#14b6a6]" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Waiting for your doctor
            </h3>
            <p className="text-text-secondary text-sm max-w-sm mb-4">
              You'll be notified when they join. You can send a message below anytime.
            </p>
            {appt && (
              <div className="w-full max-w-md h-80 md:h-96 border border-border rounded-2xl overflow-hidden shadow-sm">
                <SessionChat
                  appointmentId={appointmentId}
                  currentUserId={appt.patient_id}
                  currentUserRole="patient"
                  otherPartyName={`Dr. ${doctorName}`}
                  otherPartyId={appt.doctor_id}
                />
              </div>
            )}
          </div>
        ) : sessionEnded ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              Consultation completed
            </h3>
            <p className="mt-2 text-text-secondary text-sm">
              Redirecting to your appointments…
            </p>
          </div>
        ) : appt ? (
          <SessionChat
            appointmentId={appointmentId}
            currentUserId={appt.patient_id}
            currentUserRole="patient"
            otherPartyName={`Dr. ${doctorName}`}
            otherPartyId={appt.doctor_id}
          />
        ) : null}
      </div>
    </div>
  );
}
