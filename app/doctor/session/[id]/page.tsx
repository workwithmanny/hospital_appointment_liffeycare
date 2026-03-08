"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MessageCircle,
  FileText,
  Clock,
  Users,
  Stethoscope,
  ClipboardList,
  PlusCircle,
  Mail,
  Phone,
  X,
  CheckCircle,
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
  patient?: { full_name: string | null; phone?: string | null } | null;
};
export default function DoctorSessionPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const appointmentId = params.id as string;
  const supabase = getSupabaseClient();
  const [appt, setAppt] = useState<ApptRow | null>(null);
  const [visitSummary, setVisitSummary] = useState("");
  const [clinical, setClinical] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [patientEmail, setPatientEmail] = useState<string | null>(null);
  const joinedSent = useRef(false);
  const endSent = useRef(false);
  
  const patientName = appt?.patient?.full_name || "Patient";
  const patientPhone = appt?.patient?.phone || null;

  // Global session notification context
  const { setActiveSession, setIsMinimized } = useSessionNotification();

  // Register active session for floating bubble
  useEffect(() => {
    if (!appt) return;
    
    const status = appt.status === "in_progress" ? "active" : 
                   appt.status === "scheduled" ? "waiting" : "ended";
    
    setActiveSession({
      appointmentId,
      userRole: "doctor",
      otherPartyName: patientName,
      otherPartyId: appt.patient_id,
      startTime: appt.session_started_at ? new Date(appt.session_started_at) : new Date(),
      endsAt: appt.session_ends_at ? new Date(appt.session_ends_at) : undefined,
      status,
    });
    setIsMinimized(false);

    return () => {
      // Keep session active when leaving page (bubble will show)
    };
  }, [appt, appointmentId, patientName, setActiveSession, setIsMinimized]);
  const refreshAppt = useCallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `id, patient_id, doctor_id, slot_time, status, session_notes, clinical_notes, consultation_duration_minutes, session_started_at, session_ends_at, doctor_joined_at, patient_joined_at, patient:profiles!appointments_patient_id_fkey(full_name, phone)`,
      )
      .eq("id", appointmentId)
      .single();
    if (error || !data) return null;
    const row = data as unknown as ApptRow;
    const p = row.patient;
    row.patient = Array.isArray(p) ? p[0] : p;
    const cn = parseClinicalNotes(row.clinical_notes);
    if (Object.keys(cn).length > 0) {
      setClinical((prev) => ({ ...prev, ...cn }));
    }
    setVisitSummary(row.session_notes ?? "");
    setAppt(row);
    return row;
  }, [appointmentId, supabase]);
  useEffect(() => {
    if (!appointmentId) return;
    
    (async () => {
      const row = await refreshAppt();
      if (!row) {
        router.push("/doctor/appointments");
        return;
      }

      // Send doctor_join action
      if (!joinedSent.current) {
        joinedSent.current = true;
        await fetch(`/api/appointments/${appointmentId}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "doctor_join" }),
        });
      }

      setLoading(false);
    })();

    // Subscribe to appointment changes for notifications
    const ch = supabase
      .channel(`doc-session-${appointmentId}`)
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
  const preparing = appt && appt.status === "scheduled";
  const sessionEnded =
    appt?.status === "completed" || appt?.status === "cancelled";
  useEffect(() => {
    if (!appt?.patient_id) return;
    
    // Fetch patient email from API
    const fetchPatientEmail = async () => {
      try {
        const res = await fetch(`/api/patients/${appt.patient_id}/email`);
        if (res.ok) {
          const data = await res.json();
          setPatientEmail(data.email || null);
        }
      } catch (err) {
        console.error("Failed to fetch patient email:", err);
      }
    };
    
    fetchPatientEmail();
  }, [appt?.patient_id]);

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
            title: "Time’s up",
            message: "Session ended automatically.",
            ttlMs: 5000,
          });
          void refreshAppt();
          setTimeout(() => router.push("/doctor/appointments"), 2500);
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
  const startSession = async () => {
    const res = await fetch(`/api/appointments/${appointmentId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.push({
        kind: "error",
        title: "Could not start",
        message: data.error ?? "",
        ttlMs: 4000,
      });
      return;
    }
    toast.push({
      kind: "success",
      title: "Started",
      message: "Consultation timer is running.",
      ttlMs: 3000,
    });
    void refreshAppt();
  };
  const extendSession = async () => {
    const res = await fetch(`/api/appointments/${appointmentId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend", extraMinutes: 15 }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.push({
        kind: "error",
        title: "Extend failed",
        message: data.error ?? "",
        ttlMs: 4000,
      });
      return;
    }
    toast.push({
      kind: "success",
      title: "+15 minutes",
      message: "Session extended.",
      ttlMs: 3000,
    });
    void refreshAppt();
  };
  const saveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_notes",
          sessionNotes: visitSummary,
          clinicalNotes: clinical,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      toast.push({
        kind: "success",
        title: "Saved",
        message: "Notes saved to this appointment.",
        ttlMs: 2500,
      });
    } catch (e) {
      toast.push({
        kind: "error",
        title: "Save failed",
        message: e instanceof Error ? e.message : "Try again",
        ttlMs: 4000,
      });
    } finally {
      setSaving(false);
    }
  };
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const endSession = async () => {
    if (!showEndConfirm) {
      setShowEndConfirm(true);
      return;
    }
    setShowEndConfirm(false);
    await saveNotes();
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
      message: "Consultation completed.",
      ttlMs: 3000,
    });
    void refreshAppt();
    setTimeout(() => router.push("/doctor/appointments"), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen flex-col bg-base overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-border bg-white px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488]">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-text-primary text-sm md:text-base truncate">
                {patientName}
              </h2>
              <p className="text-xs text-text-secondary truncate">Consultation</p>
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
            {patientEmail && (
              <a
                href={`mailto:${patientEmail}`}
                className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-subtle transition-colors"
                title={`Email ${patientName}`}
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            {patientPhone && (
              <a
                href={`tel:${patientPhone}`}
                className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-subtle transition-colors"
                title={`Call ${patientName}`}
              >
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
            <Link
              href={`/doctor/appointments/${appointmentId}`}
              className="hidden md:inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-subtle transition-colors"
            >
              <ClipboardList className="h-4 w-4" /> Details
            </Link>
            <button
              type="button"
              onClick={() => setShowChat((s) => !s)}
              className="rounded-xl border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-subtle transition-colors"
            >
              {showChat ? "Hide" : "Chat"}
            </button>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${preparing ? "bg-amber-100 text-amber-800" : sessionActive ? "bg-[#14b6a6]/10 text-[#14b6a6]" : "bg-gray-100 text-gray-600"}`}
            >
              {preparing ? "Ready" : sessionActive ? "Live" : sessionEnded ? "Ended" : appt?.status}
            </span>
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

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Clinical Notes Panel */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          {/* Notes Header - Fixed */}
          <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#14b6a6]/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#14b6a6]" />
              </div>
              <h3 className="font-semibold text-text-primary text-sm md:text-base">
                Clinical notes
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {preparing && (
                <button
                  type="button"
                  onClick={startSession}
                  className="rounded-xl bg-[#14b6a6] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d9488] transition-colors shadow-sm"
                >
                  Start
                </button>
              )}
              {sessionActive && (
                <>
                  <button
                    type="button"
                    onClick={extendSession}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#14b6a6]/30 bg-[#14b6a6]/10 px-3 py-2 text-sm font-medium text-[#14b6a6] hover:bg-[#14b6a6]/20 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" /> +15m
                  </button>
                  <button
                    type="button"
                    onClick={saveNotes}
                    disabled={saving}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  {showEndConfirm ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-red-600 font-medium">End?</span>
                      <button
                        type="button"
                        onClick={endSession}
                        className="rounded-xl bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Yes
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
                      className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      End
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Notes Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full text-text-secondary">
                <div className="animate-pulse">Loading…</div>
              </div>
            ) : preparing ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-[#14b6a6]/10 flex items-center justify-center mb-4">
                  <Stethoscope className="h-8 w-8 text-[#14b6a6]" />
                </div>
                <p className="text-text-secondary text-sm max-w-sm mb-4">
                  When you start, the patient is notified and the timer begins.
                </p>
                <button
                  type="button"
                  onClick={startSession}
                  className="rounded-xl bg-[#14b6a6] px-6 py-3 text-white font-medium hover:bg-[#0d9488] transition-colors shadow-sm"
                >
                  Start consultation
                </button>
              </div>
            ) : sessionEnded ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-text-secondary">
                  This session has ended.
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">
                    Visit summary (visible in appointment details)
                  </label>
                  <textarea
                    value={visitSummary}
                    onChange={(e) => setVisitSummary(e.target.value)}
                    className="min-h-[100px] w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] resize-y"
                    placeholder="Summary for the patient chart…"
                  />
                </div>
                {CLINICAL_NOTE_FIELDS.map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      {label}
                    </label>
                    <textarea
                      value={clinical[key] ?? ""}
                      onChange={(e) =>
                        setClinical((c) => ({ ...c, [key]: e.target.value }))
                      }
                      className="min-h-[80px] w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] resize-y"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel - Collapsible on mobile */}
        {showChat && !sessionEnded && appt && (
          <div className={`${showChat ? 'flex' : 'hidden'} w-full md:w-80 lg:w-96 flex-col border-l border-border bg-white absolute md:relative inset-0 md:inset-auto z-10`}>
            {/* Chat Header - Fixed */}
            <div className="flex-shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#14b6a6]/10 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-[#14b6a6]" />
                </div>
                <h3 className="font-semibold text-text-primary text-sm">Chat with {patientName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="md:hidden p-2 rounded-lg hover:bg-subtle transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Chat Content - Takes remaining space */}
            <div className="flex-1 min-h-0">
              <SessionChat
                appointmentId={appointmentId}
                currentUserId={appt.doctor_id}
                currentUserRole="doctor"
                otherPartyName={patientName}
                otherPartyId={appt.patient_id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
