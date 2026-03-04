"use client";
import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  MessageCircle,
  ClipboardList,
  Clock,
  User,
  CheckCircle,
  X,
  AlertCircle,
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { CancellationDialog } from "@/components/CancellationDialog";

type AppointmentRow = {
  id: string;
  slot_time: string;
  status: "scheduled" | "completed" | "cancelled" | string;
  payment_status?: string | null;
  amount_paid?: number | null;
  session_notes?: string | null;
  doctor?: {
    full_name?: string;
    specialty?: string;
    avatar_url?: string | null;
  } | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  cancelled_by_user?: { full_name?: string; role?: string } | null;
};

const statusStyles: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-[#14b6a6]/10 text-[#14b6a6] border-[#14b6a6]/20",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  while (days.length % 7 !== 0) {
    const nextDate = new Date(
      year,
      month,
      daysInMonth + (days.length - startDay + 1),
    );
    days.push({ date: nextDate, isCurrentMonth: false });
  }
  return days;
}

function formatStatus(status: string) {
  if (status === "scheduled") return "Upcoming";
  if (status === "in_progress") return "In session";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Canceled";
  return status.replace(/_/g, " ");
}
export function PatientScheduleClient({
  appointments: initialAppointments,
}: {
  appointments: AppointmentRow[];
}) {
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentRow | null>(null);
  const [appointments, setAppointments] =
    useState<AppointmentRow[]>(initialAppointments);
  const handleCancelAppointment = async (reason: string) => {
    if (!selectedAppointment) return;
    console.log(
      "Cancelling appointment:",
      selectedAppointment.id,
      "Reason:",
      reason,
    );
    setCancellingId(selectedAppointment.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/appointments?id=${selectedAppointment.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cancellationReason: reason }),
        },
      );
      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response result:", result);
      if (response.ok) {
        setShowCancelDialog(false);
        setSelectedAppointment(null);
        setCancellingId(null); // Update the local state to show the cancelled appointment immediately // using the actual API response data
        setAppointments((prevAppointments: AppointmentRow[]) =>
          prevAppointments.map((apt: AppointmentRow) =>
            apt.id === selectedAppointment.id
              ? {
                  ...apt,
                  status: result.appointment.status,
                  cancellation_reason: result.appointment.cancellation_reason,
                  cancelled_by: result.appointment.cancelled_by,
                  cancelled_at: result.appointment.cancelled_at,
                  cancelled_by_user: {
                    full_name: "You", // For patient side, show "You"
                    role: "patient",
                  },
                }
              : apt,
          ),
        ); // Show success message
        setError(null);
      } else {
        console.error("Cancellation failed:", result.error);
        setError(result.error || "Failed to cancel appointment");
        setShowCancelDialog(false);
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error. Please try again.");
      setShowCancelDialog(false);
    } finally {
      setCancellingId(null);
    }
  };
  const handleCancelAppointmentCallback = (reason: string) => {
    handleCancelAppointment(reason);
  };
  const openCancelDialog = (appointment: AppointmentRow) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
    setError(null);
  };
  const now = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const all = appointments.filter((appointment: AppointmentRow) => {
      const apptDate = new Date(appointment.slot_time);
      const st = appointment.status;
      if (tab === "upcoming") {
        if (st === "cancelled") return false;
        if (st === "in_progress") return true;
        if (st === "scheduled" && apptDate >= now) return true;
        return false;
      }
      if (tab === "past") {
        if (st === "cancelled") return false;
        if (st === "in_progress") return false;
        if (st === "completed") return true;
        if (st === "scheduled" && apptDate < now) return true;
        return false;
      }
      if (tab === "cancelled" && st !== "cancelled") return false;
      if (!normalizedSearch) return true;
      const doctorName = appointment.doctor?.full_name?.toLowerCase() ?? "";
      const specialty = appointment.doctor?.specialty?.toLowerCase() ?? "";
      const notes = appointment.session_notes?.toLowerCase() ?? "";
      return (
        doctorName.includes(normalizedSearch) ||
        specialty.includes(normalizedSearch) ||
        notes.includes(normalizedSearch)
      );
    });
    if (selectedDate) {
      return all.filter(
        (appointment) =>
          new Date(appointment.slot_time).toDateString() ===
          selectedDate.toDateString(),
      );
    }
    // Sort: in_progress first, then by slot_time
    return all.sort((a, b) => {
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (a.status !== "in_progress" && b.status === "in_progress") return 1;
      return new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime();
    });
  }, [appointments, tab, search, selectedDate, now]);
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((appt: AppointmentRow) => {
      const dateKey = new Date(appt.slot_time).toDateString();
      map.set(dateKey, (map.get(dateKey) ?? 0) + 1);
    });
    return map;
  }, [appointments]);
  const monthDates = useMemo(
    () =>
      buildMonthDates(calendarMonth.getFullYear(), calendarMonth.getMonth()),
    [calendarMonth],
  );
  const todayKey = now.toDateString();
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8 pt-4">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[#14b6a6]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              My Appointments
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your appointments and join sessions with doctors.
            </p>
          </div>
        </div>
        <Link
          href="/patient/booking"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#14b6a6] text-white rounded-xl hover:bg-[#0d9488] transition-colors font-medium shadow-sm"
        >
          <CalendarIcon className="w-4 h-4" /> Book New
        </Link>
      </div>

      {/* Calendar Section - Moved to top */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#14b6a6]" />
            <h2 className="font-semibold text-text-primary">Calendar</h2>
            {selectedDate && (
              <span className="text-sm text-text-secondary">
                - {selectedDate.toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              className="p-1.5 hover:bg-subtle rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-text-primary">
              {calendarMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              className="p-1.5 hover:bg-subtle rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdayLabels.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-text-tertiary py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {monthDates.map(({ date, isCurrentMonth }, idx) => {
            const dateKey = date.toDateString();
            const hasAppointments = appointmentsByDay.has(dateKey);
            const isToday = dateKey === todayKey;
            const isSelected = selectedDate?.toDateString() === dateKey;
            return (
              <button
                key={idx}
                onClick={() =>
                  setSelectedDate(isCurrentMonth ? date : null)
                }
                disabled={!isCurrentMonth}
                className={`relative p-2 text-sm rounded-lg transition-colors ${
                  !isCurrentMonth
                    ? "text-text-tertiary/50 cursor-not-allowed"
                    : "text-text-primary hover:bg-subtle"
                } ${
                  isToday
                    ? "bg-[#14b6a6]/10 text-[#14b6a6] font-medium"
                    : ""
                } ${
                  isSelected
                    ? "bg-[#14b6a6] text-white hover:bg-[#0d9488]"
                    : ""
                }`}
              >
                {date.getDate()}
                {hasAppointments && (
                  <div
                    className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                      isSelected ? "bg-white" : "bg-[#14b6a6]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            className="mt-3 w-full text-sm text-[#14b6a6] hover:text-[#0d9488] font-medium py-2 rounded-lg hover:bg-[#14b6a6]/5 transition-colors"
          >
            Clear date selection
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <nav className="flex gap-1 sm:gap-6 overflow-x-auto">
          {[
            {
              key: "upcoming" as const,
              label: "Upcoming",
              count: appointments.filter((a) => {
                if (a.status === "cancelled") return false;
                if (a.status === "in_progress") return true;
                return a.status === "scheduled" && new Date(a.slot_time) >= now;
              }).length,
            },
            {
              key: "past" as const,
              label: "Past",
              count: appointments.filter((a) => {
                if (a.status === "cancelled") return false;
                if (a.status === "in_progress") return false;
                if (a.status === "completed") return true;
                return a.status === "scheduled" && new Date(a.slot_time) < now;
              }).length,
            },
            {
              key: "cancelled" as const,
              label: "Cancelled",
              count: appointments.filter((a) => a.status === "cancelled").length,
            },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setSelectedDate(null);
              }}
              className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                tab === key
                  ? "border-[#14b6a6] text-[#14b6a6]"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {label} <span className="text-xs opacity-70">({count})</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search and List */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
          <input
            type="text"
            placeholder="Search by doctor name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] text-sm"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-border">
            {filtered.map((appointment) => {
              const apptDate = new Date(appointment.slot_time);
              const doctorName = appointment.doctor?.full_name || "Doctor";
              const specialty =
                appointment.doctor?.specialty || "General Practice";
              const canJoinSession =
                appointment.status === "scheduled" ||
                appointment.status === "in_progress";
              const canCancelAppointment =
                appointment.status === "scheduled";
              return (
                <div
                  key={appointment.id}
                  className="p-4 hover:bg-subtle/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#14b6a6] to-[#0d9488] rounded-full overflow-hidden flex items-center justify-center text-white font-medium">
                          {appointment.doctor?.avatar_url ? (
                            <img
                              src={appointment.doctor.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {doctorName}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {specialty}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {apptDate.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {apptDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            statusStyles[appointment.status] ||
                            "bg-subtle text-text-secondary border-border"
                          }`}
                        >
                          {formatStatus(appointment.status)}
                        </span>
                        {appointment.payment_status === "paid" && (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle className="w-3 h-3" /> Paid ${Number(appointment.amount_paid).toFixed(2)}
                          </span>
                        )}
                        {appointment.status === "completed" &&
                          appointment.payment_status !== "paid" && (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                              <AlertCircle className="w-3 h-3" /> Unpaid
                            </span>
                          )}
                        {appointment.status === "cancelled" &&
                          appointment.cancelled_by_user && (
                            <div className="text-xs text-red-600">
                              <p>
                                Cancelled by{" "}
                                {appointment.cancelled_by_user.role ===
                                "patient"
                                  ? "you"
                                  : appointment.cancelled_by_user.full_name}
                              </p>
                              {appointment.cancellation_reason && (
                                <p className="text-red-500 italic">
                                  Reason: {appointment.cancellation_reason}
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {canJoinSession ? (
                        <>
                          <Link
                            href={`/patient/session/${appointment.id}`}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                              appointment.status === "in_progress"
                                ? "bg-[#14b6a6] text-white hover:bg-[#0d9488] shadow-sm"
                                : "bg-[#14b6a6]/10 text-[#14b6a6] hover:bg-[#14b6a6]/20"
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            {appointment.status === "in_progress"
                              ? "Join"
                              : "Open"}
                          </Link>
                          <Link
                            href={`/patient/appointments/${appointment.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary text-sm font-medium rounded-xl hover:bg-subtle transition-colors"
                          >
                            <ClipboardList className="w-4 h-4" />
                            Details
                          </Link>
                          {canCancelAppointment ? (
                            <button
                              onClick={() => openCancelDialog(appointment)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
                              title="Cancel appointment"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : null}
                        </>
                      ) : appointment.status === "completed" ? (
                        <Link
                          href={`/patient/appointments/${appointment.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary text-sm font-medium rounded-xl hover:bg-subtle transition-colors"
                        >
                          <ClipboardList className="w-4 h-4" /> View
                        </Link>
                      ) : appointment.status === "cancelled" ? (
                        <div className="text-center text-xs text-text-tertiary">
                          <p>Cancelled</p>
                        </div>
                      ) : (
                        <Link
                          href={`/patient/appointments/${appointment.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary text-sm font-medium rounded-xl hover:bg-subtle transition-colors"
                        >
                          <ClipboardList className="w-4 h-4" /> Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-subtle rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-6 h-6 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">
              No appointments found
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {search || selectedDate
                ? "Try adjusting your search or date selection"
                : "You don't have any appointments in this category"}
            </p>
            {!search && !selectedDate && tab === "upcoming" && (
              <Link
                href="/patient/booking"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#14b6a6] text-white text-sm font-medium rounded-xl hover:bg-[#0d9488] transition-colors shadow-sm"
              >
                <CalendarIcon className="w-4 h-4" /> Book First Appointment
              </Link>
            )}
          </div>
        )}
      </div>{" "}
      <CancellationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelAppointmentCallback}
        isCancelling={cancellingId === selectedAppointment?.id}
        appointmentInfo={{
          doctorName: selectedAppointment?.doctor?.full_name,
          date: selectedAppointment
            ? new Date(selectedAppointment.slot_time).toLocaleDateString()
            : "",
          time: selectedAppointment
            ? new Date(selectedAppointment.slot_time).toLocaleTimeString(
                "en-US",
                { hour: "2-digit", minute: "2-digit" },
              )
            : "",
        }}
        userType="patient"
      />{" "}
    </div>
  );
}
