"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  XCircle,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Shield,
  ShieldCheck,
  Mail,
  Ban,
  CheckCircle,
  Heart,
  Phone,
  Mail as MailIcon,
  User,
  AlertCircle,
  Activity,
  Clock,
  Stethoscope,
} from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  allergies?: string[];
  created_at: string;
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

interface MedicalHistory {
  id: string;
  condition: string;
  diagnosis_date: string;
  treatment?: string;
}

interface Appointment {
  id: string;
  slot_time: string;
  status: string;
  doctor: { full_name: string; specialty?: string };
}

interface PatientDetails extends Patient {
  medical_history?: MedicalHistory[];
  appointments?: Appointment[];
}

interface BanFormData {
  reason: string;
}

interface MessageFormData {
  subject: string;
  message: string;
  message_type: "email" | "sms" | "in_app";
}

export default function AdminPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [banForm, setBanForm] = useState<BanFormData>({ reason: "" });
  const [messageForm, setMessageForm] = useState<MessageFormData>({ 
    subject: "", 
    message: "", 
    message_type: "email" 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [pagination.page]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/patients?${params}`);
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data = await res.json();
      setPatients(data.patients);
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
    fetchPatients();
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/patients?id=${patientId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete patient");
      setSuccess("Patient deleted successfully");
      fetchPatients();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleBan = async () => {
    if (!selectedPatient || !banForm.reason.trim()) return;
    try {
      const res = await fetch(`/api/admin/ban?id=${selectedPatient.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banForm.reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to ban user");
      }
      setSuccess(`Patient ${selectedPatient.full_name} has been banned`);
      setShowBanModal(false);
      setBanForm({ reason: "" });
      fetchPatients();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleUnban = async (patientId: string, patientName: string) => {
    try {
      const res = await fetch(`/api/admin/unban?id=${patientId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unban user");
      }
      setSuccess(`Patient ${patientName} has been unbanned`);
      fetchPatients();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedPatient || !messageForm.subject.trim() || !messageForm.message.trim()) return;
    try {
      const res = await fetch(`/api/admin/messages?id=${selectedPatient.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }
      setSuccess(`Message sent to ${selectedPatient.full_name}`);
      setShowMessageModal(false);
      setMessageForm({ subject: "", message: "", message_type: "email" });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const openBanModal = (patient: Patient) => {
    setSelectedPatient(patient as PatientDetails);
    setShowBanModal(true);
  };

  const openMessageModal = (patient: Patient) => {
    setSelectedPatient(patient as PatientDetails);
    setShowMessageModal(true);
  };

  const openPatientModal = async (patient: Patient) => {
    try {
      const res = await fetch(`/api/admin/patients?id=${patient.id}`);
      if (!res.ok) throw new Error("Failed to fetch patient details");
      const data = await res.json();
      setSelectedPatient(data.patient);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const getGenderBadge = (gender?: string) => {
    if (!gender) return <span className="text-gray-400">-</span>;
    const colors: Record<string, string> = {
      male: "bg-blue-50 text-blue-700 border-blue-100",
      female: "bg-pink-50 text-pink-700 border-pink-100",
      other: "bg-violet-50 text-violet-700 border-violet-100",
      prefer_not_say: "bg-gray-50 text-gray-700 border-gray-100",
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[gender] || "bg-gray-50 text-gray-700 border-gray-100"}`}>{gender.replace(/_/g, " ")}</span>;
  };

  const getStatusBadge = (patient: Patient) => {
    if (patient.is_banned || patient.account_status === "banned") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-100">
          <Ban className="w-3 h-3" />
          Banned
        </span>
      );
    }
    if (patient.account_status === "suspended") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
          <AlertCircle className="w-3 h-3" />
          Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
        <CheckCircle className="w-3 h-3" />
        Active
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
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 text-sm">Manage all patient accounts and view their medical records</p>
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
                placeholder="Search patients..."
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

          <p className="text-sm text-gray-500">Total: {pagination.total} patients</p>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3 mb-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#14b6a6]/20 border-t-[#14b6a6] mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No patients found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-[#14b6a6]/20 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#14b6a6]/10 to-[#0d9488]/10 flex items-center justify-center shrink-0">
                  {patient.avatar_url ? (
                    <img
                      src={patient.avatar_url}
                      alt={patient.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#14b6a6]">
                      {getInitials(patient.full_name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{patient.full_name}</h3>
                  <p className="text-xs text-gray-500">{patient.email || "No email"}</p>
                  <div className="mt-2">{getStatusBadge(patient)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>{patient.age || "-"} yrs</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-gray-400">Gender:</span>
                  <span>{getGenderBadge(patient.gender)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{patient.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{new Date(patient.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openPatientModal(patient)}
                  className="p-2 text-gray-400 hover:text-[#14b6a6] hover:bg-[#14b6a6]/10 rounded-lg transition-colors"
                  title="View details"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openMessageModal(patient)}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Send message"
                >
                  <Mail className="w-4 h-4" />
                </button>
                {patient.is_banned ? (
                  <button
                    onClick={() => handleUnban(patient.id, patient.full_name)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Unban user"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => openBanModal(patient)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Ban user"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(patient.id)}
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
            <p className="text-gray-500">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No patients found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Phone
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
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#14b6a6]/10 to-[#0d9488]/10 flex items-center justify-center shrink-0">
                          {patient.avatar_url ? (
                            <img
                              src={patient.avatar_url}
                              alt={patient.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-[#14b6a6]">
                              {getInitials(patient.full_name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.full_name}</p>
                          <p className="text-sm text-gray-500">{patient.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(patient)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{patient.age || "-"}</td>
                    <td className="px-6 py-4">{getGenderBadge(patient.gender)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{patient.phone || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openPatientModal(patient)}
                          className="p-2 text-gray-400 hover:text-[#14b6a6] hover:bg-[#14b6a6]/10 rounded-lg transition-colors"
                          title="View details"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openMessageModal(patient)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Send message"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        {patient.is_banned ? (
                          <button
                            onClick={() => handleUnban(patient.id, patient.full_name)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Unban user"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openBanModal(patient)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Ban user"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(patient.id)}
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} patients
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
      {!loading && patients.length > 0 && (
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
      {showModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#14b6a6]/10 rounded-xl">
                  <User className="w-5 h-5 text-[#14b6a6]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Patient Details</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-[#14b6a6]/10 to-[#0d9488]/10 flex items-center justify-center shrink-0">
                  {selectedPatient.avatar_url ? (
                    <img
                      src={selectedPatient.avatar_url}
                      alt={selectedPatient.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-[#14b6a6]">
                      {getInitials(selectedPatient.full_name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedPatient.full_name}</h3>
                  <p className="text-gray-500">{selectedPatient.email || "No email"}</p>
                  <div className="mt-2">{getStatusBadge(selectedPatient)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Age
                  </p>
                  <p className="font-medium text-sm">{selectedPatient.age || "-"} years</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Gender</p>
                  <p className="font-medium text-sm capitalize">{getGenderBadge(selectedPatient.gender)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-medium text-sm">{selectedPatient.phone || "-"}</p>
                </div>
              </div>

              {/* Allergies */}
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-rose-100 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.map((allergy, i) => (
                      <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-sm border border-rose-100">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical History */}
              {selectedPatient.medical_history && selectedPatient.medical_history.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-[#14b6a6]/10 rounded-lg">
                      <FileText className="w-4 h-4 text-[#14b6a6]" />
                    </div>
                    Medical History
                  </h4>
                  <div className="space-y-3">
                    {selectedPatient.medical_history.map((history) => (
                      <div key={history.id} className="p-4 bg-gray-50 rounded-xl">
                        <p className="font-medium text-gray-900">{history.condition}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Diagnosed: {new Date(history.diagnosis_date).toLocaleDateString()}
                        </p>
                        {history.treatment && (
                          <p className="text-sm text-gray-600 mt-2 flex items-start gap-1">
                            <Stethoscope className="w-3.5 h-3.5 mt-0.5 text-gray-400" />
                            {history.treatment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Appointments */}
              {selectedPatient.appointments && selectedPatient.appointments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-violet-100 rounded-lg">
                      <Clock className="w-4 h-4 text-violet-600" />
                    </div>
                    Recent Appointments
                  </h4>
                  <div className="space-y-3">
                    {selectedPatient.appointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{apt.doctor.full_name}</p>
                            <p className="text-sm text-gray-500">{apt.doctor.specialty}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{new Date(apt.slot_time).toLocaleDateString()}</p>
                            <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              apt.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              apt.status === "cancelled" ? "bg-rose-50 text-rose-700 border-rose-100" :
                              "bg-blue-50 text-blue-700 border-blue-100"
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* Ban Modal */}
      {showBanModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Ban className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Ban Patient</h2>
                <p className="text-sm text-gray-500">{selectedPatient.full_name}</p>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ban Reason *</label>
                <textarea
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ reason: e.target.value })}
                  placeholder="Enter reason for banning this user..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> This will immediately prevent the user from accessing the platform. They will see a ban message when they try to log in.
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
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Send Message</h2>
                <p className="text-sm text-gray-500">To: {selectedPatient.full_name}</p>
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
