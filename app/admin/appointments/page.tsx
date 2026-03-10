"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreHorizontal,
  XCircle,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  CalendarDays,
  User,
  Stethoscope,
  CreditCard,
  ArrowRight,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";

interface Appointment {
  id: string;
  slot_time: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  room_number?: number;
  cancellation_reason?: string;
  patient: { id: string; full_name: string; phone?: string };
  doctor: { id: string; full_name: string; specialty?: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusOptions = ["scheduled", "in_progress", "completed", "cancelled"];

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [pagination.page, statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/admin/appointments?${params}`);
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch appointments");
      const data = await res.json();
      setAppointments(data.appointments);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/appointments?id=${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update appointment");
      setSuccess(`Appointment ${newStatus.replace("_", " ")}`);
      fetchAppointments();
      setShowModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      const res = await fetch(`/api/admin/appointments?id=${appointmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete appointment");
      setSuccess("Appointment deleted");
      fetchAppointments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      scheduled: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: Clock },
      in_progress: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", icon: PlayCircle },
      completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: CheckCircle },
      cancelled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", icon: XCircle },
    };
    const { bg, text, border, icon: Icon } = config[status] || config.scheduled;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}>
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    return status === "paid" ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
        <CheckCircle className="w-3 h-3" />
        Paid
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center shadow-lg shadow-[#14b6a6]/20 shrink-0">
          <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm">Manage all appointments across the hospital</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 sm:mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 sm:mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 sm:mb-6 overflow-hidden">
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] bg-white"
            >
              <option value="">All Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6]"
              placeholder="From"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6]"
              placeholder="To"
            />
          </div>
          <button
            onClick={fetchAppointments}
            className="px-4 py-2 bg-[#14b6a6] text-white rounded-xl text-sm font-medium hover:bg-[#0d9488] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3 mb-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#14b6a6]/20 border-t-[#14b6a6] mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No appointments found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-[#14b6a6]/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#14b6a6]/10 rounded-xl">
                    <Calendar className="w-4 h-4 text-[#14b6a6]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(apt.slot_time).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(apt.slot_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusBadge(apt.status)}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{apt.patient.full_name}</p>
                    <p className="text-xs text-gray-500">{apt.patient.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-violet-50 rounded-lg">
                    <Stethoscope className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{apt.doctor.full_name}</p>
                    <p className="text-xs text-gray-500">{apt.doctor.specialty}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {getPaymentBadge(apt.payment_status)}
                  <span className="text-sm text-gray-600 font-medium">${apt.amount_paid}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-[#14b6a6] hover:bg-[#14b6a6]/10 rounded-lg transition-colors"
                    title="Manage"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(apt.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#14b6a6]/20 border-t-[#14b6a6] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No appointments found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {new Date(apt.slot_time).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(apt.slot_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{apt.patient.full_name}</p>
                      <p className="text-sm text-gray-500">{apt.patient.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{apt.doctor.full_name}</p>
                      <p className="text-sm text-gray-500">{apt.doctor.specialty}</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPaymentBadge(apt.payment_status)}
                        <span className="text-sm text-gray-500">${apt.amount_paid}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-[#14b6a6] hover:bg-[#14b6a6]/10 rounded-lg transition-colors"
                          title="Manage"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(apt.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Pagination */}
      {!loading && appointments.length > 0 && (
        <div className="lg:hidden flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            {((pagination.page - 1) * pagination.limit) + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#14b6a6]/10 rounded-xl">
                  <Calendar className="w-5 h-5 text-[#14b6a6]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Manage Appointment</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Patient
                  </p>
                  <p className="font-medium text-sm">{selectedAppointment.patient.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedAppointment.patient.phone}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Doctor
                  </p>
                  <p className="font-medium text-sm">{selectedAppointment.doctor.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedAppointment.doctor.specialty}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Date & Time
                </p>
                <p className="font-medium text-sm">{new Date(selectedAppointment.slot_time).toLocaleString()}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Current Status</p>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Payment</p>
                  {getPaymentBadge(selectedAppointment.payment_status)}
                </div>
              </div>

              {selectedAppointment.room_number && (
                <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <p className="text-xs text-violet-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Room Number
                  </p>
                  <p className="font-medium text-violet-900">Room {selectedAppointment.room_number}</p>
                </div>
              )}

              {selectedAppointment.cancellation_reason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-xs text-rose-600 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Cancellation Reason
                  </p>
                  <p className="text-sm text-rose-900">{selectedAppointment.cancellation_reason}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedAppointment.id, status)}
                      disabled={selectedAppointment.status === status}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        selectedAppointment.status === status
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                          : "hover:bg-gray-50 border-gray-200 hover:border-[#14b6a6]/30"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
