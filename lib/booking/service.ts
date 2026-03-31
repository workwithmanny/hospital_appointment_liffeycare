import type { Appointment } from "@/lib/types";

export function canBookSlot(
  existing: Appointment[],
  doctorId: string,
  slotTime: string,
) {
  return !existing.some(
    (appt) =>
      appt.doctorId === doctorId &&
      appt.slotTime === slotTime &&
      appt.status === "scheduled",
  );
}

export function cancelAppointment(existing: Appointment[], id: string) {
  return existing.map((appt) =>
    appt.id === id ? { ...appt, status: "cancelled" as const } : appt,
  );
}

export function buildSlotTimeIso(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`).toISOString();
}
