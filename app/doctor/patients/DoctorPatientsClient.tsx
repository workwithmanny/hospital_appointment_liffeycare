"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Mail,
  Phone,
  User,
  Calendar,
  Search,
  AlertCircle,
  Clock,
  Stethoscope,
  X,
  Users,
} from "lucide-react";
import { MessageComposer } from "../message-composer";

type Appointment = {
  id: string;
  slot_time: string;
  status: string;
  patient: {
    id: string;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    age?: number | null;
    allergies?: string[] | null;
  } | null;
};

type Patient = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  age?: number | null;
  allergies?: string[] | null;
  appointments: Appointment[];
};

export function DoctorPatientsClient({
  appointments,
  doctorId,
}: {
  appointments: Appointment[];
  doctorId: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  const patients = useMemo(() => {
    const patientMap = new Map<string, Patient>();
    appointments.forEach((appt) => {
      if (appt.patient) {
        const patient = patientMap.get(appt.patient.id) || {
          id: appt.patient.id,
          full_name: appt.patient.full_name,
          phone: appt.patient.phone,
          email: appt.patient.email,
          avatar_url: appt.patient.avatar_url,
          age: appt.patient.age,
          allergies: appt.patient.allergies,
          appointments: [],
        };
        patient.appointments.push(appt);
        patientMap.set(appt.patient.id, patient);
      }
    });
    return Array.from(patientMap.values());
  }, [appointments]);

  // Filter patients by search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    
    const query = searchQuery.toLowerCase();
    return patients.filter((patient) => {
      const matchesName = patient.full_name.toLowerCase().includes(query);
      const matchesEmail = patient.email?.toLowerCase().includes(query);
      const matchesPhone = patient.phone?.includes(query);
      const matchesAge = patient.age?.toString().includes(query);
      return matchesName || matchesEmail || matchesPhone || matchesAge;
    });
  }, [patients, searchQuery]);

  const selectedPatient = selectedPatientId
    ? patients.find((p) => p.id === selectedPatientId)
    : null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastVisit = (appointments: Appointment[]) => {
    const completed = appointments
      .filter((a) => a.status === "completed")
      .sort((a, b) => new Date(b.slot_time).getTime() - new Date(a.slot_time).getTime());
    return completed[0]?.slot_time;
  };

  const getUpcomingAppointments = (appointments: Appointment[]) => {
    return appointments.filter(
      (a) => new Date(a.slot_time) > new Date() && a.status === "scheduled"
    ).length;
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (patients.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#14b6a6]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
            My Patients
          </h1>
        </div>
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <div className="w-20 h-20 rounded-full bg-subtle flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No patients yet</h3>
          <p className="text-text-secondary max-w-sm mx-auto mb-6">
            You haven't had any appointments with patients yet. Patients will appear here once you've had consultations with them.
          </p>
          <Link
            href="/doctor/appointments"
            className="inline-flex items-center gap-2 bg-[#14b6a6] text-white px-5 py-2.5 rounded-xl hover:bg-[#0d9488] transition-colors font-medium shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            View Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#14b6a6]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
                My Patients
              </h1>
              <p className="text-text-secondary mt-1">
                {patients.length} patient{patients.length !== 1 ? 's' : ''} in your care
              </p>
            </div>
          </div>
          <Link
            href="/doctor/appointments"
            className="inline-flex items-center gap-2 bg-[#14b6a6] text-white px-4 py-2 rounded-xl hover:bg-[#0d9488] transition-colors font-medium text-sm shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            View Appointments
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-5 h-5" />
          <input
            type="text"
            placeholder="Search patients by name, email, phone, or age..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {searchQuery && (
          <p className="text-sm text-text-secondary mt-2">
            Showing {filteredPatients.length} of {patients.length} patients
          </p>
        )}
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => {
          const lastVisit = getLastVisit(patient.appointments);
          const upcomingCount = getUpcomingAppointments(patient.appointments);
          const hasAllergies = patient.allergies && patient.allergies.length > 0;

          return (
            <div
              key={patient.id}
              className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center text-white font-semibold text-xl shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-lg truncate">
                      {patient.full_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {patient.age && (
                        <span className="text-sm text-text-secondary">
                          Age {patient.age}
                        </span>
                      )}
                      {hasAllergies && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {patient.allergies?.length} Allergies
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="px-5 py-4 bg-subtle/50 border-b border-border">
                <div className="space-y-2">
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
                      <a 
                        href={`mailto:${patient.email}`}
                        className="text-text-secondary hover:text-[#14b6a6] truncate transition-colors"
                        title={patient.email}
                      >
                        {patient.email}
                      </a>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-text-tertiary shrink-0" />
                      <a 
                        href={`tel:${patient.phone}`}
                        className="text-text-secondary hover:text-[#14b6a6] transition-colors"
                      >
                        {formatPhone(patient.phone)}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Allergies Section */}
              {hasAllergies && (
                <div className="px-5 py-3 bg-red-50/50 border-b border-red-100">
                  <p className="text-xs font-medium text-red-700 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Allergies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies?.map((allergy, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Visit Stats */}
              <div className="px-5 py-4 border-b border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#14b6a6]/10 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-[#14b6a6]" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-text-primary">{patient.appointments.length}</p>
                      <p className="text-xs text-text-secondary">Total visits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-text-primary">{upcomingCount}</p>
                      <p className="text-xs text-text-secondary">Upcoming</p>
                    </div>
                  </div>
                </div>
                {lastVisit && (
                  <p className="text-xs text-text-secondary mt-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Last visit: {new Date(lastVisit).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 flex gap-2">
                <Link
                  href={`/doctor/chat?patient=${patient.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-[#14b6a6] text-white hover:bg-[#0d9488] transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Link>
                <button
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setSelectedAppointmentId(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-subtle text-text-primary hover:bg-border transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Message
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State for Search */}
      {filteredPatients.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-subtle rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No patients found</h3>
          <p className="text-text-secondary">Try adjusting your search terms</p>
        </div>
      )}

      {/* Message Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center text-white font-semibold">
                  {getInitials(selectedPatient.full_name)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Message {selectedPatient.full_name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Select an appointment context for your message
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-2 mb-6">
                {selectedPatient.appointments.slice(0, 5).map((appt) => (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => setSelectedAppointmentId(appt.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all ${
                      selectedAppointmentId === appt.id
                        ? "border-[#14b6a6] bg-[#14b6a6]/5 ring-2 ring-[#14b6a6]/20"
                        : "border-border hover:bg-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">
                        {new Date(appt.slot_time).toLocaleDateString()} at{" "}
                        {new Date(appt.slot_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          appt.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : appt.status === "scheduled"
                            ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                            : "bg-subtle text-text-secondary"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <MessageComposer compact appointmentId={selectedAppointmentId ?? ""} />

              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  setSelectedAppointmentId(null);
                }}
                className="mt-4 w-full bg-subtle text-text-primary px-4 py-2.5 rounded-xl hover:bg-border transition-colors font-medium"
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
