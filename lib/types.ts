export type Role = "patient" | "doctor" | "admin";

export type AppointmentStatus = "scheduled" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotTime: string;
  status: AppointmentStatus;
  notes?: string;
}
