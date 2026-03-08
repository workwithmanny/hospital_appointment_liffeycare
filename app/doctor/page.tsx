import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Calendar,
  MessageSquare,
  Users,
  ChevronRight,
  Clock,
  Activity,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";

export default async function DoctorPage() {
  const user = await getSessionUser();
  assertRole(user, ["doctor", "admin"]);
  if (!user) {
    redirect("/auth/login");
  }
  if (user && user.role === "doctor" && !user.doctorApproved) {
    redirect("/auth/status");
  }
  const supabase = getSupabaseServerClient();
  // Get appointments using the exact same query as the working appointments page
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, slot_time, status, payment_status, amount_paid, patient:profiles!appointments_patient_id_fkey(full_name)",
    )
    .eq("doctor_id", user?.id ?? "")
    .order("slot_time", { ascending: true })
    .limit(10);
  // Get messages
  const { data: messages } = await supabase
    .from("messages")
    .select(
      ` id, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url) `,
    )
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(5);
  // Calculate stats - today's appointments from all appointments (including past ones)
  const { data: allAppointments } = await supabase
    .from("appointments")
    .select("slot_time")
    .eq("doctor_id", user.id);
  const todayAppointments = (allAppointments ?? []).filter(
    (appointment) =>
      new Date(appointment.slot_time).toDateString() ===
      new Date().toDateString(),
  ).length;
  const unreadMessages = (messages ?? []).filter(
    (message) => message.recipient_id === user.id && !message.read_at,
  ).length;
  const pendingAppointments = (allAppointments ?? []).filter(
    (appointment) =>
      new Date(appointment.slot_time) > new Date() &&
      new Date(appointment.slot_time).toDateString() !== new Date().toDateString(),
  ).length;
  const totalPatients = new Set((appointments ?? []).map(a => (a.patient as any)?.full_name)).size;
  // Get doctor profile for sidebar
  const doctorWithAvatar = await supabase
    .from("profiles")
    .select("full_name, specialty, avatar_url")
    .eq("id", user.id)
    .single();
  const doctorWithoutAvatar =
    doctorWithAvatar.error &&
    String(doctorWithAvatar.error.message).includes("avatar_url")
      ? await supabase
          .from("profiles")
          .select("full_name, specialty")
          .eq("id", user.id)
          .single()
      : null;
  const doctorProfile =
    (doctorWithoutAvatar?.data ?? doctorWithAvatar.data) || null;
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary mb-1">
              Good morning, {doctorProfile?.full_name?.split(" ")[0] || "Doctor"}
            </h1>
            <p className="text-text-secondary">
              {dateString} • {todayAppointments} appointments today
            </p>
          </div>
          <a
            href="/doctor/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#14b6a6] text-white rounded-xl text-sm font-medium hover:bg-[#0d9488] transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            View Schedule
          </a>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#14b6a6]" />
            </div>
            <span className="text-2xl font-display font-semibold text-text-primary">{todayAppointments}</span>
          </div>
          <p className="text-sm text-text-secondary">Today's Appointments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-2xl font-display font-semibold text-text-primary">{unreadMessages}</span>
          </div>
          <p className="text-sm text-text-secondary">Unread Messages</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-2xl font-display font-semibold text-text-primary">{pendingAppointments}</span>
          </div>
          <p className="text-sm text-text-secondary">Pending Appointments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-2xl font-display font-semibold text-text-primary">{totalPatients}</span>
          </div>
          <p className="text-sm text-text-secondary">Total Patients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Schedule */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#14b6a6]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-semibold text-text-primary">Upcoming Appointments</h2>
                    <p className="text-sm text-text-secondary">Your schedule for today and upcoming days</p>
                  </div>
                </div>
                <a
                  href="/doctor/appointments"
                  className="text-sm font-medium text-[#14b6a6] hover:text-[#0d9488] transition-colors inline-flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="p-4">
              {(() => {
                const upcomingAppointments = (appointments ?? []);
                if (upcomingAppointments.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-subtle flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-text-tertiary" />
                      </div>
                      <p className="text-text-primary font-medium mb-1">No upcoming appointments</p>
                      <p className="text-sm text-text-secondary">Your schedule is clear for now</p>
                    </div>
                  );
                }

                // Helper to format date display
                const getDateLabel = (date: Date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const targetDate = new Date(date);
                  targetDate.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays === 0) return { label: "Today", color: "text-[#14b6a6] bg-[#14b6a6]/10" };
                  if (diffDays === 1) return { label: "Tomorrow", color: "text-blue-600 bg-blue-50" };
                  if (diffDays < 7) return { label: `${diffDays} days`, color: "text-text-secondary bg-subtle" };
                  return { label: format(date, "MMM d"), color: "text-text-secondary bg-subtle" };
                };

                // Sort: in_progress first, then by slot_time
                const sortedAppointments = [...upcomingAppointments].sort((a, b) => {
                  if (a.status === "in_progress" && b.status !== "in_progress") return -1;
                  if (a.status !== "in_progress" && b.status === "in_progress") return 1;
                  return new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime();
                });

                return (
                  <div className="space-y-3">
                    {sortedAppointments.slice(0, 5).map((appointment) => {
                      const time = new Date(appointment.slot_time);
                      const patientName = (appointment.patient as any)?.full_name || "Patient";
                      const status = appointment.status || "scheduled";
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
                                {patientName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-text-secondary">
                                {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span className="text-text-tertiary">•</span>
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                status === "scheduled" ? "bg-amber-100 text-amber-700" : 
                                status === "in_progress" ? "bg-[#14b6a6]/10 text-[#14b6a6]" : 
                                status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                "bg-subtle text-text-secondary"
                              }`}>
                                {status === "in_progress" && <span className="w-1.5 h-1.5 bg-[#14b6a6] rounded-full animate-pulse" />}
                                {status === "scheduled" ? "Waiting" : status}
                              </span>
                              {appointment.payment_status === "paid" && (
                                <span className="text-xs font-medium text-emerald-600">
                                  ${Number(appointment.amount_paid).toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0">
                            {status === "scheduled" ? (
                              <a
                                href={`/doctor/session/${appointment.id}`}
                                className="px-4 py-2 text-sm font-medium bg-[#14b6a6] text-white rounded-xl hover:bg-[#0d9488] transition-colors inline-flex items-center gap-2 shadow-sm"
                              >
                                <Activity className="w-4 h-4" />
                                Start
                              </a>
                            ) : status === "in_progress" ? (
                              <a
                                href={`/doctor/session/${appointment.id}`}
                                className="px-4 py-2 text-sm font-medium bg-[#14b6a6] text-white rounded-xl hover:bg-[#0d9488] transition-colors inline-flex items-center gap-2 shadow-sm"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                                Continue
                              </a>
                            ) : (
                              <a
                                href={`/doctor/appointments/${appointment.id}`}
                                className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-[#14b6a6] hover:bg-[#14b6a6]/5 rounded-xl transition-colors"
                              >
                                Details
                              </a>
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Messages */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-semibold text-text-primary">Recent Messages</h2>
                  </div>
                </div>
                <a
                  href="/doctor/chat"
                  className="text-sm font-medium text-[#14b6a6] hover:text-[#0d9488] transition-colors"
                >
                  View all
                </a>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {messages && messages.length > 0 ? (
                  messages.slice(0, 4).map((message) => {
                    const isFromMe = message.sender_id === user.id;
                    const otherPerson = isFromMe
                      ? message.recipient
                      : message.sender;
                    const profilePic = (otherPerson as any)?.avatar_url;
                    const isUnread = !message.read_at && message.recipient_id === user.id;
                    return (
                      <div key={message.id} className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-subtle transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center text-white font-medium text-sm shrink-0">
                          {profilePic ? (
                            <img
                              src={profilePic}
                              alt="Profile"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            (otherPerson as any)?.full_name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "U"
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className={`text-sm truncate ${isUnread ? "font-semibold text-text-primary" : "font-medium text-text-primary"}`}>
                              {(otherPerson as any)?.full_name || "Unknown"}
                            </p>
                            <span className="text-xs text-text-tertiary">
                              {new Date(message.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${isUnread ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                            {message.body}
                          </p>
                        </div>
                        {isUnread && (
                          <span className="w-2 h-2 bg-[#14b6a6] rounded-full shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">No recent messages</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h2 className="text-lg font-display font-semibold text-text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/doctor/appointments"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-[#14b6a6]/30 hover:bg-[#14b6a6]/5 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#14b6a6]" />
                </div>
                <span className="text-sm font-medium text-text-primary">Schedule</span>
              </a>
              <a
                href="/doctor/patients"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-violet-200 hover:bg-violet-50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-500" />
                </div>
                <span className="text-sm font-medium text-text-primary">Patients</span>
              </a>
              <a
                href="/doctor/chat"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-rose-200 hover:bg-rose-50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-rose-500" />
                </div>
                <span className="text-sm font-medium text-text-primary">Messages</span>
              </a>
              <a
                href="/doctor/wallet"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-amber-200 hover:bg-amber-50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-text-primary">Earnings</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
