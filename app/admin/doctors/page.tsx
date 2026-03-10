"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  Mail,
  Ban,
  Stethoscope,
  ArrowRight,
  Phone,
  Building2,
  DollarSign,
  Calendar,
  MapPin,
  Briefcase,
} from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  hospital?: string;
  doctor_approved: boolean;
  consultation_price: number;
  certification?: string;
  created_at: string;
  is_online?: boolean;
  wallet_balance?: number;
  avatar_url?: string;
  is_banned?: boolean;
  account_status?: string;
  banned_reason?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Doctor>>({});
  const [showBanModal, setShowBanModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [banForm, setBanForm] = useState<{ reason: string }>({ reason: "" });
  const [messageForm, setMessageForm] = useState({ 
    subject: "", 
    message: "", 
    message_type: "email" as "email" | "sms" | "in_app"
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, [pagination.page, statusFilter]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/doctors?${params}`);
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch doctors");
      const data = await res.json();
      setDoctors(data.doctors);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchDoctors();
  };

  const handleApprove = async (doctorId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/admin/doctors?id=${doctorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_approved: approved }),
      });
      if (!res.ok) throw new Error("Failed to update doctor");
      setSuccess(approved ? "Doctor approved successfully" : "Approval revoked");
      fetchDoctors();
      setShowViewModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleUpdate = async () => {
    if (!selectedDoctor) return;
    try {
      const res = await fetch(`/api/admin/doctors?id=${selectedDoctor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update doctor");
      setSuccess("Doctor updated successfully");
      fetchDoctors();
      setShowEditModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDelete = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/doctors?id=${doctorId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete doctor");
      setSuccess("Doctor deleted successfully");
      fetchDoctors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleBan = async () => {
    if (!selectedDoctor || !banForm.reason.trim()) return;
    try {
      const res = await fetch(`/api/admin/ban?id=${selectedDoctor.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banForm.reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to ban doctor");
      }
      setSuccess(`Doctor ${selectedDoctor.full_name} has been banned`);
      setShowBanModal(false);
      setBanForm({ reason: "" });
      fetchDoctors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleUnban = async (doctorId: string, doctorName: string) => {
    try {
      const res = await fetch(`/api/admin/unban?id=${doctorId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unban doctor");
      }
      setSuccess(`Doctor ${doctorName} has been unbanned`);
      fetchDoctors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDoctor || !messageForm.subject.trim() || !messageForm.message.trim()) return;
    try {
      const res = await fetch(`/api/admin/messages?id=${selectedDoctor.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }
      setSuccess(`Message sent to ${selectedDoctor.full_name}`);
      setShowMessageModal(false);
      setMessageForm({ subject: "", message: "", message_type: "email" });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const openBanModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBanModal(true);
  };

  const openMessageModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowMessageModal(true);
  };

  const openViewModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  };

  const openEditModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setEditForm({
      full_name: doctor.full_name,
      phone: doctor.phone,
      specialty: doctor.specialty,
      hospital: doctor.hospital,
      consultation_price: doctor.consultation_price,
      certification: doctor.certification,
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (doctor: Doctor) => {
    if (doctor.is_banned || doctor.account_status === "banned") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-100">
          <Ban className="w-3 h-3" />
          Banned
        </span>
      );
    }
    return doctor.doctor_approved ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
        <CheckCircle className="w-3 h-3" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
        <Shield className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center shadow-lg shadow-[#14b6a6]/20 shrink-0">
          <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-500 text-sm">Manage all doctors and their approval status</p>
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
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] w-full sm:w-64 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#14b6a6] text-white rounded-xl text-sm font-medium hover:bg-[#0d9488] transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3 mb-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#14b6a6]/20 border-t-[#14b6a6] mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCircle className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No doctors found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-[#14b6a6]/20 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#14b6a6]/10 to-[#0d9488]/10 flex items-center justify-center shrink-0">
                  {doctor.avatar_url ? (
                    <img
                      src={doctor.avatar_url}
                      alt={doctor.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#14b6a6]">
                      {getInitials(doctor.full_name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{doctor.full_name}</h3>
                  <p className="text-xs text-gray-500">{doctor.specialty || "No specialty"}</p>
                  <div className="mt-2">{getStatusBadge(doctor)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{doctor.hospital || "-"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  <span>${doctor.consultation_price}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{doctor.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{new Date(doctor.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openViewModal(doctor)}
                  className="p-2 text-gray-400 hover:text-[#14b6a6] hover:bg-[#14b6a6]/10 rounded-lg transition-colors"
                  title="View details"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openMessageModal(doctor)}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Send message"
                >
                  <Mail className="w-4 h-4" />
                </button>
                {doctor.is_banned ? (
                  <button
                    onClick={() => handleUnban(doctor.id, doctor.full_name)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Unban doctor"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => openBanModal(doctor)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Ban doctor"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => openEditModal(doctor)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(doctor.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
            <p className="text-gray-500">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No doctors found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#14b6a6]/10 to-[#0d9488]/10 flex items-center justify-center shrink-0">
                          {doctor.avatar_url ? (
                            <img
                              src={doctor.avatar_url}
                              alt={doctor.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-[#14b6a6]">
                              {getInitials(doctor.full_name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doctor.full_name}</p>
                          <p className="text-sm text-gray-500">{doctor.phone || "No phone"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialty || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.hospital || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">${doctor.consultation_price}</td>
                    <td className="px-6 py-4">{getStatusBadge(doctor)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(doctor.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(doctor)}
                          className="p-2 text-gray-400 hover:text-[#14b6a6] hover:bg-[#14b6a6]/10 rounded-lg transition-colors"
                          title="View details"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openMessageModal(doctor)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Send message"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        {doctor.is_banned ? (
                          <button
                            onClick={() => handleUnban(doctor.id, doctor.full_name)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Unban doctor"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openBanModal(doctor)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Ban doctor"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(doctor)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} doctors
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
      {!loading && doctors.length > 0 && (
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

      {/* View Modal */}
      {showViewModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#14b6a6]/10 rounded-xl">
                  <UserCircle className="w-5 h-5 text-[#14b6a6]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Doctor Details</h2>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-[#14b6a6]/10 to-[#0d9488]/10 flex items-center justify-center shrink-0">
                  {selectedDoctor.avatar_url ? (
                    <img
                      src={selectedDoctor.avatar_url}
                      alt={selectedDoctor.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-[#14b6a6]">
                      {getInitials(selectedDoctor.full_name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedDoctor.full_name}</h3>
                  <p className="text-gray-500">{selectedDoctor.specialty || "No specialty"}</p>
                  <div className="mt-2">{getStatusBadge(selectedDoctor)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-medium text-sm">{selectedDoctor.phone || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Hospital
                  </p>
                  <p className="font-medium text-sm">{selectedDoctor.hospital || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Consultation Price
                  </p>
                  <p className="font-medium text-sm">${selectedDoctor.consultation_price}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Joined
                  </p>
                  <p className="font-medium text-sm">
                    {new Date(selectedDoctor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedDoctor.certification && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Certification
                  </p>
                  <p className="text-sm">{selectedDoctor.certification}</p>
                </div>
              )}
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              {!selectedDoctor.doctor_approved ? (
                <button
                  onClick={() => handleApprove(selectedDoctor.id, true)}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Doctor
                </button>
              ) : (
                <button
                  onClick={() => handleApprove(selectedDoctor.id, false)}
                  className="flex-1 px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-colors"
                >
                  Revoke Approval
                </button>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Doctor</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="text"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialty</label>
                <input
                  type="text"
                  value={editForm.specialty || ""}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital</label>
                <input
                  type="text"
                  value={editForm.hospital || ""}
                  onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Consultation Price ($)</label>
                <input
                  type="number"
                  value={editForm.consultation_price || 0}
                  onChange={(e) =>
                    setEditForm({ ...editForm, consultation_price: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Certification</label>
                <textarea
                  value={editForm.certification || ""}
                  onChange={(e) => setEditForm({ ...editForm, certification: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] transition-all resize-none"
                />
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2.5 bg-[#14b6a6] text-white rounded-xl font-medium hover:bg-[#0d9488] transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Ban className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Ban Doctor</h2>
                <p className="text-sm text-gray-500">{selectedDoctor.full_name}</p>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ban Reason *</label>
                <textarea
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ reason: e.target.value })}
                  placeholder="Enter reason for banning this doctor..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> This will immediately prevent the doctor from accessing the platform.
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={!banForm.reason.trim()}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                Ban Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Send Message</h2>
                <p className="text-sm text-gray-500">To: {selectedDoctor.full_name}</p>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Type</label>
                <select
                  value={messageForm.message_type}
                  onChange={(e) => setMessageForm({ ...messageForm, message_type: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="in_app">In-App Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  placeholder="Enter message subject..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  placeholder="Enter your message..."
                  rows={5}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageForm.subject.trim() || !messageForm.message.trim()}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
