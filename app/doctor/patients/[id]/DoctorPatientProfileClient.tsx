"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  User,
  Stethoscope,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  FileText,
  X,
  CheckCircle,
  Clock3,
} from "lucide-react";

type Patient = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  age: number | null;
  allergies: string[] | null;
  joinedAt: string;
};

type Appointment = {
  id: string;
  slot_time: string;
  status: string;
  session_notes: string | null;
  clinical_notes: Record<string, string> | null;
  duration: number | null;
  payment_status: string | null;
  amount_paid: number | null;
};

type Stats = {
  totalVisits: number;
  completedVisits: number;
  upcomingVisits: number;
  cancelledVisits: number;
  lastVisit: string | null;
};

const statusStyles: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function formatStatus(status: string) {
  if (status === "scheduled") return "Upcoming";
  if (status === "in_progress") return "In Session";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return status.replace(/_/g, " ");
}

function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DoctorPatientProfileClient({
  patient,
  appointments,
  stats,
  doctorId,
}: {
  patient: Patient;
  appointments: Appointment[];
  stats: Stats;
  doctorId: string;
}) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const hasAllergies = patient.allergies && patient.allergies.length > 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/doctor/patients"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Patients
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-3xl shrink-0">
            {patient.avatar_url ? (
              <img
                src={patient.avatar_url}
                alt={patient.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(patient.full_name)
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
                <p className="text-gray-500 mt-1">
                  Patient since {new Date(patient.joinedAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/doctor/chat?patient=${patient.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Link>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 mt-4">
              {patient.email && (
                <a
                  href={`mailto:${patient.email}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                >
                  <Mail className="w-4 h-4 text-gray-400" />
                  {patient.email}
                </a>
              )}
              {patient.phone && (
                <a
                  href={`tel:${patient.phone}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                >
                  <Phone className="w-4 h-4 text-gray-400" />
                  {formatPhone(patient.phone)}
                </a>
              )}
              {patient.age && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  Age {patient.age}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Allergies Alert */}
      {hasAllergies && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-2">Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {patient.allergies?.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-sm font-medium"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
              <p className="text-xs text-gray-500">Total Visits</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completedVisits}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingVisits}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.lastVisit 
                  ? new Date(stats.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'}
              </p>
              <p className="text-xs text-gray-500">Last Visit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Appointment History</h2>
        </div>
        
        {appointments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments yet</h3>
            <p className="text-gray-500">You haven't had any appointments with this patient.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {appointments.map((appointment) => {
              const apptDate = new Date(appointment.slot_time);
              const status = appointment.status;
              
              return (
                <div
                  key={appointment.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {apptDate.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {apptDate.getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                            {formatStatus(status)}
                          </span>
                          {appointment.payment_status === "paid" && (
                            <span className="text-xs text-emerald-600 font-medium">
                              Paid ${appointment.amount_paid?.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {appointment.duration && (
                            <span>• {appointment.duration} min</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {new Date(selectedAppointment.slot_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedAppointment.slot_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {selectedAppointment.duration && ` • ${selectedAppointment.duration} minutes`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Payment */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[selectedAppointment.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                  {formatStatus(selectedAppointment.status)}
                </span>
                {selectedAppointment.payment_status === "paid" && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Paid ${selectedAppointment.amount_paid?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Session Notes */}
              {selectedAppointment.session_notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Session Notes
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                    {selectedAppointment.session_notes}
                  </div>
                </div>
              )}

              {/* Clinical Notes */}
              {selectedAppointment.clinical_notes && Object.keys(selectedAppointment.clinical_notes).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Clinical Notes</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedAppointment.clinical_notes).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-700">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Link
                  href={`/doctor/appointments/${selectedAppointment.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <FileText className="w-4 h-4" />
                  View Full Details
                </Link>
                {(selectedAppointment.status === "scheduled" || selectedAppointment.status === "in_progress") && (
                  <Link
                    href={`/doctor/session/${selectedAppointment.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                  >
                    <Stethoscope className="w-4 h-4" />
                    {selectedAppointment.status === "in_progress" ? "Continue Session" : "Start Session"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
