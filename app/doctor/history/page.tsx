import Link from "next/link";
import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Calendar, ChevronRight, History, Clock } from "lucide-react";

export default async function DoctorHistoryPage() {
  const user = await getSessionUser();
  assertRole(user, ["doctor", "admin"]);
  const supabase = getSupabaseServerClient();
  let q = supabase
    .from("appointments")
    .select(
      `id, slot_time, status, session_notes, payment_status, amount_paid, patient:profiles!appointments_patient_id_fkey(full_name)`,
    )
    .in("status", ["completed", "cancelled"])
    .order("slot_time", { ascending: false })
    .limit(80);
  if (user!.role === "doctor") {
    q = q.eq("doctor_id", user!.id);
  }
  const { data: rows } = await q;
  const list = rows ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
            <History className="w-5 h-5 text-[#14b6a6]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
            Appointment History
          </h1>
        </div>
        <p className="text-text-secondary ml-[52px]">
          Completed and cancelled consultations
        </p>
      </div>

      {/* List */}
      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-border">
            <div className="w-16 h-16 rounded-full bg-subtle flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-primary font-medium mb-1">No history yet</p>
            <p className="text-sm text-text-secondary">Completed and cancelled appointments will appear here</p>
          </div>
        ) : (
          list.map((appt) => {
            const p = appt.patient as { full_name?: string } | null;
            const pat = p && !Array.isArray(p) ? p : null;
            const isCompleted = appt.status === "completed";
            const isCancelled = appt.status === "cancelled";
            
            return (
              <Link
                key={appt.id}
                href={`/doctor/appointments/${appt.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-[#14b6a6]/30 hover:shadow-sm transition-all"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-emerald-50" : "bg-red-50"
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    isCompleted ? "text-emerald-500" : "text-red-500"
                  }`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-primary">
                      {pat?.full_name ?? "Patient"}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isCompleted 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {isCompleted ? "Completed" : "Cancelled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary flex-wrap">
                    <span>{new Date(appt.slot_time).toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric",
                      year: "numeric"
                    })}</span>
                    <span className="text-text-tertiary">•</span>
                    <span>{new Date(appt.slot_time).toLocaleTimeString("en-US", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}</span>
                    {appt.payment_status === "paid" && (
                      <>
                        <span className="text-text-tertiary">•</span>
                        <span className="text-emerald-600 font-medium">
                          +${Number(appt.amount_paid).toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                  {appt.session_notes && (
                    <p className="mt-1 text-xs text-text-tertiary line-clamp-1">
                      {appt.session_notes}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-text-tertiary shrink-0" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
