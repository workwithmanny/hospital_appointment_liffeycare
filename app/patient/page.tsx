import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  Calendar,
  MessageCircle,
  Plus,
  ChevronRight,
  LayoutDashboard,
  Clock,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { OnboardingBanner } from "@/components/onboarding-banner";
export default async function PatientPage() {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  const supabase = getSupabaseServerClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("id, read_at")
    .eq("recipient_id", user?.id ?? "")
    .is("read_at", null);
  const unreadMessages = messages?.length ?? 0;
  const { data: allAppointments } = await supabase
    .from("appointments")
    .select("id, slot_time, status, payment_status, amount_paid, doctor:profiles!appointments_doctor_id_fkey(full_name)")
    .eq("patient_id", user?.id ?? "");
  // Get patient profile
  const { data: patientProfile } = await supabase
    .from("profiles")
    .select("full_name, has_completed_onboarding")
    .eq("id", user?.id ?? "")
    .single();
  // Calculate stats
  const upcomingAppointments = (allAppointments ?? []).filter(
    (appt) =>
      appt.status === "scheduled" && new Date(appt.slot_time) > new Date(),
  ).length;
  
  const completedAppointments = (allAppointments ?? []).filter(
    (appt) => appt.status === "completed",
  ).length;
  
  // Filter upcoming for display
  const appointments = (allAppointments ?? [])
    .filter((appt) => new Date(appt.slot_time) >= new Date())
    .sort((a, b) => new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime())
    .slice(0, 5);
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Onboarding Banner - only show for first-time users */}
      {!patientProfile?.has_completed_onboarding && (
        <div className="mb-6">
          <OnboardingBanner 
            userId={user?.id ?? ""} 
            profilePath="/patient/profile" 
            role="patient" 
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-[#14b6a6]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
            Good morning, {patientProfile?.full_name?.split(" ")[0] || "Patient"}
          </h1>
        </div>
        <p className="text-text-secondary ml-[52px]">
          {dateString} • You have {upcomingAppointments} upcoming appointments
        </p>
      </div>

      {/* Book Button */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/patient/booking"
          className="px-6 py-3 bg-[#14b6a6] text-white rounded-xl hover:bg-[#0d9488] inline-flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#14b6a6]" />
            </div>
            <span className="text-2xl font-display font-bold text-text-primary">{upcomingAppointments}</span>
          </div>
          <p className="text-sm text-text-secondary">Upcoming appointments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-2xl font-display font-bold text-text-primary">{completedAppointments}</span>
          </div>
          <p className="text-sm text-text-secondary">Completed visits</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-2xl font-display font-bold text-text-primary">{unreadMessages}</span>
          </div>
          <p className="text-sm text-text-secondary">Unread messages</p>
        </div>
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="p-5 sm:p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#14b6a6]" />
                  <h2 className="text-lg font-semibold text-text-primary">Schedule</h2>
                </div>
                <Link
                  href="/patient/appointments"
                  className="text-[#14b6a6] hover:text-[#0d9488] text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {(() => {
                const upcomingAppointments = (appointments ?? []);
                if (upcomingAppointments.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-text-tertiary mb-3" />
                      <p className="text-text-primary font-medium">No upcoming appointments</p>
                      <p className="text-sm text-text-secondary mt-1">Book your first appointment to get started</p>
                    </div>
                  );
                }

                const getDateLabel = (date: Date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const targetDate = new Date(date);
                  targetDate.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays === 0) return { label: "Today", color: "text-emerald-600 bg-emerald-50" };
                  if (diffDays === 1) return { label: "Tomorrow", color: "text-[#14b6a6] bg-[#14b6a6]/10" };
                  if (diffDays < 7) return { label: `${diffDays} days`, color: "text-text-secondary bg-subtle" };
                  return { label: format(date, "MMM d"), color: "text-text-secondary bg-subtle" };
                };

                return (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 5).map((appointment) => {
                      const time = new Date(appointment.slot_time);
                      const doctorName = (appointment.doctor as any)?.full_name || "Doctor";
                      const status = appointment.status || "scheduled";
                      const canJoin = status === "scheduled" || status === "in_progress";
                      const dateInfo = getDateLabel(time);

                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-[#14b6a6]/30 hover:shadow-sm transition-all bg-white"
                        >
                          {/* Date Badge */}
                          <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${dateInfo.color} shrink-0`}>
                            <span className="text-lg font-bold">{format(time, "d")}</span>
                            <span className="text-xs font-medium uppercase">{format(time, "MMM")}</span>
                          </div>

                          {/* Appointment Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-text-primary truncate">
                                {doctorName}
                              </p>
                              <span className="text-xs text-text-tertiary">•</span>
                              <span className="text-sm text-text-secondary">
                                {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                status === "scheduled" ? "bg-amber-100 text-amber-700" : 
                                status === "in_progress" ? "bg-[#14b6a6]/10 text-[#14b6a6]" : 
                                "bg-subtle text-text-secondary"
                              }`}>
                                {status === "in_progress" && <span className="w-1.5 h-1.5 bg-[#14b6a6] rounded-full" />}
                                {status}
                              </span>
                              {appointment.payment_status === "paid" && (
                                <span className="text-xs font-medium text-emerald-600">
                                  Paid
                                </span>
                              )}
                              <span className="text-xs text-text-tertiary ml-1">
                                {dateInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0">
                            {canJoin ? (
                              <Link
                                href={`/patient/session/${appointment.id}`}
                                className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-2 transition-colors ${
                                  status === "in_progress" 
                                    ? "bg-[#14b6a6] text-white hover:bg-[#0d9488] shadow-sm" 
                                    : "bg-[#14b6a6]/10 text-[#14b6a6] hover:bg-[#14b6a6]/20"
                                }`}
                              >
                                <MessageCircle className="w-4 h-4" />
                                {status === "in_progress" ? "Join" : "Join"}
                              </Link>
                            ) : (
                              <Link
                                href={`/patient/appointments/${appointment.id}`}
                                className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-subtle rounded-xl transition-colors"
                              >
                                Details
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Book */}
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="p-5 sm:p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Quick Actions</h2>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <Link
                href="/patient/booking"
                className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-subtle transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#14b6a6]/10 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[#14b6a6]" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Book Appointment</p>
                    <p className="text-sm text-text-secondary">Schedule with a doctor</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </Link>
              <Link
                href="/patient/chat"
                className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-subtle transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Messages</p>
                    <p className="text-sm text-text-secondary">Chat with your care team</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </Link>
              <Link
                href="/patient/appointments"
                className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-subtle transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">My Appointments</p>
                    <p className="text-sm text-text-secondary">View all appointments</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="p-5 sm:p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
            </div>
            <div className="p-4 sm:p-5">
              <div className="space-y-4">
                {appointments?.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {(appt.doctor as { full_name?: string } | null)?.full_name ?? "Doctor"}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {new Date(appt.slot_time).toLocaleDateString()} at{" "}
                        {new Date(appt.slot_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${appt.status === "scheduled" ? "bg-amber-100 text-amber-700" : appt.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        {appt.status}
                      </span>
                      {appt.payment_status === "paid" && (
                        <span className="text-xs font-medium text-emerald-600">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(!appointments || appointments.length === 0) && (
                  <p className="text-text-secondary text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
