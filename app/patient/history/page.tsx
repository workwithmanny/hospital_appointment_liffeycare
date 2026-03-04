import Link from "next/link";
import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Calendar, ChevronRight, Clock, History, CheckCircle, XCircle } from "lucide-react";
import { specialtyLabel } from "@/lib/constants/specialties";

export default async function PatientHistoryPage() {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  const supabase = getSupabaseServerClient();
  const { data: rows } = await supabase
    .from("appointments")
    .select(
      `id, slot_time, status, session_notes, payment_status, amount_paid, doctor:profiles!appointments_doctor_id_fkey(full_name, specialty)`,
    )
    .eq("patient_id", user!.id)
    .in("status", ["completed", "cancelled"])
    .order("slot_time", { ascending: false })
    .limit(80);
  const list = rows ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
          <History className="w-5 h-5 text-[#14b6a6]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
            History
          </h1>
          <p className="text-sm text-text-secondary">
            Completed and cancelled visits
          </p>
        </div>
      </div>

      {/* List */}
      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className="rounded-2xl border border-border bg-white p-8 text-center">
            <History className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-text-secondary">No past appointments yet.</p>
          </li>
        ) : (
          list.map((appt) => {
            const d = appt.doctor as {
              full_name?: string;
              specialty?: string | null;
            } | null;
            const doc = d && !Array.isArray(d) ? d : null;
            const isPaid = appt.payment_status === "paid";
            const isCompleted = appt.status === "completed";

            return (
              <li key={appt.id}>
                <Link
                  href={`/patient/appointments/${appt.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 transition hover:border-[#14b6a6]/30 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-[#14b6a6]/10 p-2">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-[#14b6a6]" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary">
                        {doc?.full_name ? `Dr. ${doc.full_name}` : "Doctor"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(appt.slot_time).toLocaleDateString()}
                        </span>
                        <span>·</span>
                        <span className={`capitalize font-medium ${
                          isCompleted ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {appt.status}
                        </span>
                        {isPaid && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 font-medium text-xs flex items-center gap-1">
                              Paid ${Number(appt.amount_paid).toFixed(2)}
                            </span>
                          </>
                        )}
                        {!isPaid && isCompleted && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 font-medium text-xs">
                              Unpaid
                            </span>
                          </>
                        )}
                      </div>
                      {appt.session_notes ? (
                        <p className="mt-1 line-clamp-2 text-xs text-text-tertiary italic">
                          &ldquo;{appt.session_notes}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-tertiary" />
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
