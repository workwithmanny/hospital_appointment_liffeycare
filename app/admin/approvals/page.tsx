"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  CheckCircle2,
  X,
  Shield,
  AlertTriangle,
  Stethoscope,
  Building2,
  Phone,
  DollarSign,
  Mail,
  Calendar,
  Briefcase,
  UserCheck,
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
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminApprovalsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingDoctors();
  }, [pagination.page]);

  const fetchPendingDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: "pending",
      });

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

  const handleApprove = async (doctorId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/admin/doctors?id=${doctorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_approved: approved }),
      });
      if (!res.ok) throw new Error("Failed to update doctor");
      setSuccess(approved ? "Doctor approved successfully" : "Application rejected");
      fetchPendingDoctors();
      setShowModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const openDoctorModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
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
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Doctor Approvals</h1>
          <p className="text-gray-500 text-sm">Review and approve doctor applications</p>
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

      {/* Pending Count Banner */}
      {!loading && doctors.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-amber-800">
              <strong>{pagination.total}</strong> doctor{pagination.total !== 1 ? "s" : ""} waiting for approval
            </p>
          </div>
        </div>
      )}

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3 mb-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#14b6a6]/20 border-t-[#14b6a6] mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading applications...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-gray-500 font-medium">No pending approvals</p>
            <p className="text-sm text-gray-400 mt-1">All doctor applications have been reviewed</p>
          </div>
        ) : (
          doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-[#14b6a6]/20 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-amber-700">
                    {getInitials(doctor.full_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{doctor.full_name}</h3>
                  <p className="text-xs text-gray-500">{doctor.email || "No email"}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(doctor.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{doctor.specialty || "-"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{doctor.hospital || "-"}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openDoctorModal(doctor)}
                  className="px-4 py-2 bg-[#14b6a6] text-white rounded-xl text-sm font-medium hover:bg-[#0d9488] transition-colors"
                >
                  Review
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
            <p className="text-gray-500">Loading applications...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-gray-500 font-medium">No pending approvals</p>
            <p className="text-sm text-gray-400 mt-1">All doctor applications have been reviewed</p>
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
                    Applied
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
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-amber-700">
                            {getInitials(doctor.full_name)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doctor.full_name}</p>
                          <p className="text-sm text-gray-500">{doctor.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialty || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.hospital || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatTimeAgo(doctor.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openDoctorModal(doctor)}
                        className="px-4 py-2 bg-[#14b6a6] text-white rounded-xl text-sm font-medium hover:bg-[#0d9488] transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
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
          </>
        )}
      </div>

      {/* Mobile Pagination */}
      {!loading && doctors.length > 0 && pagination.totalPages > 1 && (
        <div className="lg:hidden flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
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

      {/* Review Modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#14b6a6]/10 rounded-xl">
                  <UserCheck className="w-5 h-5 text-[#14b6a6]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Review Doctor Application</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {/* Doctor Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-xl font-semibold text-amber-700">
                    {getInitials(selectedDoctor.full_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedDoctor.full_name}</h3>
                  <p className="text-gray-500 text-sm">Applied {formatTimeAgo(selectedDoctor.created_at)}</p>
                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
                    <Clock className="w-3 h-3" />
                    Pending Approval
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Specialty
                  </p>
                  <p className="font-medium text-sm">{selectedDoctor.specialty || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Hospital
                  </p>
                  <p className="font-medium text-sm">{selectedDoctor.hospital || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-medium text-sm">{selectedDoctor.phone || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Consultation Price
                  </p>
                  <p className="font-medium text-sm">${selectedDoctor.consultation_price}</p>
                </div>
              </div>

              {selectedDoctor.certification && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <div className="p-1.5 bg-[#14b6a6]/10 rounded-lg">
                      <Briefcase className="w-4 h-4 text-[#14b6a6]" />
                    </div>
                    Certification
                  </h4>
                  <p className="text-sm bg-gray-50 p-4 rounded-xl">{selectedDoctor.certification}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Review Checklist:</strong> Verify the doctor&apos;s credentials, check their certification, and confirm their hospital affiliation before approving.
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleApprove(selectedDoctor.id, true)}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Doctor
              </button>
              <button
                onClick={() => handleApprove(selectedDoctor.id, false)}
                className="flex-1 px-4 py-2.5 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
