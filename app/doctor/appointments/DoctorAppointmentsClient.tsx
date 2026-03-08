"use client";
import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  MessageSquare,
  ClipboardList,
  X,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  CalendarDays,
  Activity,
} from "lucide-react";
import { CancellationDialog } from "@/components/CancellationDialog";

type AppointmentRow = {
  id: string;
  slot_time: string;
  status: "scheduled" | "completed" | "cancelled" | string;
  payment_status?: string | null;
  amount_paid?: number | null;
  session_notes?: string | null;
  patient?: { full_name?: string; avatar_url?: string | null } | null;
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
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
export function DoctorAppointmentsClient({
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

  const now = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const handleCancelAppointment = async (reason: string) => {
    if (!selectedAppointment) return;
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
      const result = await response.json();
      if (response.ok) {
        setShowCancelDialog(false);
        setSelectedAppointment(null);
        setCancellingId(null);
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
                    full_name: "You",
                    role: "doctor",
                  },
                }
              : apt,
          ),
        );
        setError(null);
      } else {
        setError(result.error || "Failed to cancel appointment");
        setShowCancelDialog(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setShowCancelDialog(false);
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelAppointmentCallback = useCallback((reason: string) => {
    handleCancelAppointment(reason);
  }, []);

  const openCancelDialog = useCallback((appointment: AppointmentRow) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
    setError(null);
  }, []);

  // Calculate counts for tabs
  const counts = useMemo(() => ({
    upcoming: appointments.filter((a) => {
      if (a.status === "cancelled") return false;
      if (a.status === "in_progress") return true;
      return a.status === "scheduled" && new Date(a.slot_time) >= now;
    }).length,
    past: appointments.filter((a) => {
      if (a.status === "cancelled") return false;
      if (a.status === "in_progress") return false;
      if (a.status === "completed") return true;
      return a.status === "scheduled" && new Date(a.slot_time) < now;
    }).length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  }), [appointments, now]);

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
      const patientName = appointment.patient?.full_name?.toLowerCase() ?? "";
      const notes = appointment.session_notes?.toLowerCase() ?? "";
      return (
        patientName.includes(normalizedSearch) ||
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
    return all;
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

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), monthIndex, 1));
    setShowMonthPicker(false);
  };

  const handleSelectYear = (year: number) => {
    setCalendarMonth(new Date(year, calendarMonth.getMonth(), 1));
    setShowYearPicker(false);
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[#14b6a6]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              Appointments
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your schedule and patient consultations
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats - Moved to top */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-text-secondary mb-1">Total</p>
          <p className="text-2xl font-semibold text-text-primary">{appointments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-[#14b6a6] mb-1">Upcoming</p>
          <p className="text-2xl font-semibold text-[#14b6a6]">{counts.upcoming}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-emerald-600 mb-1">Completed</p>
          <p className="text-2xl font-semibold text-emerald-600">{counts.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-red-600 mb-1">Cancelled</p>
          <p className="text-2xl font-semibold text-red-600">{counts.cancelled}</p>
        </div>
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
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => {
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-subtle rounded-lg transition-colors flex items-center gap-1"
              >
                {calendarMonth.toLocaleDateString("en-US", { month: "long" })}
                <MoreVertical className="w-3 h-3 rotate-90" />
              </button>
              {showMonthPicker && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-border rounded-xl shadow-lg py-1 z-10 min-w-[140px] max-h-48 overflow-y-auto">
                  {monthNames.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => handleSelectMonth(index)}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-subtle transition-colors ${
                        calendarMonth.getMonth() === index
                          ? "bg-[#14b6a6]/10 text-[#14b6a6] font-medium"
                          : "text-text-primary"
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-subtle rounded-lg transition-colors flex items-center gap-1"
              >
                {calendarMonth.getFullYear()}
                <MoreVertical className="w-3 h-3 rotate-90" />
              </button>
              {showYearPicker && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-border rounded-xl shadow-lg py-1 z-10 min-w-[100px] max-h-48 overflow-y-auto">
                  {yearOptions.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleSelectYear(year)}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-subtle transition-colors ${
                        calendarMonth.getFullYear() === year
                          ? "bg-[#14b6a6]/10 text-[#14b6a6] font-medium"
                          : "text-text-primary"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-subtle rounded-lg transition-colors ml-2"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            <button
              onClick={handleNextMonth}
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
            { key: "upcoming" as const, label: "Upcoming", count: counts.upcoming },
            { key: "past" as const, label: "Past", count: counts.past },
            { key: "cancelled" as const, label: "Cancelled", count: counts.cancelled },
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
            placeholder="Search by patient name..."
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
              const patientName = appointment.patient?.full_name || "Patient";
              const status = appointment.status ?? "scheduled";
              const canJoin = status === "scheduled" || status === "in_progress";
              const canCancel = status === "scheduled";

              return (
                <div
                  key={appointment.id}
                  className="p-4 hover:bg-subtle/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center text-white font-medium text-sm shrink-0">
                          {appointment.patient?.avatar_url ? (
                            <img
                              src={appointment.patient.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            patientName
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">
                            {patientName}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {apptDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {apptDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            statusStyles[status] ||
                            "bg-subtle text-text-secondary border-border"
                          }`}
                        >
                          {formatStatus(status)}
                        </span>
                        {appointment.payment_status === "paid" && (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            +${Number(appointment.amount_paid).toFixed(2)}
                          </span>
                        )}
                        {status === "completed" &&
                          appointment.payment_status !== "paid" && (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                              Unpaid
                            </span>
                          )}
                        {status === "cancelled" &&
                          appointment.cancelled_by_user && (
                            <span className="text-xs text-red-600">
                              Cancelled by{" "}
                              {appointment.cancelled_by_user.role === "doctor"
                                ? "you"
                                : appointment.cancelled_by_user.full_name}
                            </span>
                          )}
                      </div>
                      {appointment.cancellation_reason && (
                        <p className="text-xs text-red-500 mt-1">
                          Reason: {appointment.cancellation_reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {canJoin ? (
                        <>
                          <Link
                            href={`/doctor/session/${appointment.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#14b6a6] text-white text-xs font-medium rounded-xl hover:bg-[#0d9488] transition-colors shadow-sm"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            {status === "in_progress" ? "Continue" : "Start"}
                          </Link>
                          <Link
                            href={`/doctor/appointments/${appointment.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary text-xs font-medium rounded-xl hover:bg-subtle transition-colors"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            Details
                          </Link>
                          {canCancel && (
                            <button
                              onClick={() => openCancelDialog(appointment)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-xl hover:bg-red-50 transition-colors"
                              title="Cancel appointment"
                              type="button"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          )}
                        </>
                      ) : status === "completed" ? (
                        <Link
                          href={`/doctor/appointments/${appointment.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary text-xs font-medium rounded-xl hover:bg-subtle transition-colors"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          View Details
                        </Link>
                      ) : null}
                      <Link
                        href={`/doctor/chat?appointment=${appointment.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary text-xs font-medium rounded-xl hover:bg-subtle transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-subtle flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-text-tertiary" />
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
              <p className="text-sm text-text-tertiary">
                New appointments will appear here when patients book with you.
              </p>
            )}
          </div>
        )}
      </div>

      <CancellationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelAppointmentCallback}
        isCancelling={cancellingId === selectedAppointment?.id}
        appointmentInfo={{
          patientName: selectedAppointment?.patient?.full_name,
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
        userType="doctor"
      />
    </div>
  );
}
