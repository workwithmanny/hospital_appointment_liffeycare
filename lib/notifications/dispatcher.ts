import { sendEmail } from "@/lib/notifications/providers/resend";
import {
  patientBookingConfirmationEmail,
  doctorNewBookingEmail,
  appointmentReminderEmail,
  appointmentStartedEmail,
  appointmentCancelledEmail,
} from "@/lib/notifications/templates";

type NotificationEvent =
  | "booking_confirmed"
  | "booking_confirmed_doctor"
  | "appointment_24h_reminder"
  | "appointment_started"
  | "appointment_cancelled";

interface NotificationPayload {
  email: string;
  phone?: string;
  patientName: string;
  doctorName: string;
  slotTime: string;
  appointmentId: string;
  reason?: string;
  consultationPrice?: number;
  cancelledBy?: string;
  cancellationReason?: string;
  appUrl?: string;
}

export async function dispatchNotification(
  event: NotificationEvent,
  payload: NotificationPayload,
) {
  const appUrl = payload.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const context = {
    patientName: payload.patientName,
    doctorName: payload.doctorName,
    slotTime: payload.slotTime,
    appointmentId: payload.appointmentId,
    reason: payload.reason,
    consultationPrice: payload.consultationPrice,
    cancelledBy: payload.cancelledBy,
    cancellationReason: payload.cancellationReason,
    appUrl,
  };

  let emailResult: { subject: string; html: string } | null = null;

  switch (event) {
    case "booking_confirmed":
      emailResult = patientBookingConfirmationEmail(context);
      break;
    case "booking_confirmed_doctor":
      emailResult = doctorNewBookingEmail(context);
      break;
    case "appointment_24h_reminder":
      emailResult = appointmentReminderEmail(context);
      break;
    case "appointment_started":
      emailResult = appointmentStartedEmail(context);
      break;
    case "appointment_cancelled":
      emailResult = appointmentCancelledEmail(context);
      break;
  }

  if (emailResult) {
    await sendEmail(payload.email, emailResult.subject, emailResult.html);
  }
}

// Backward compatibility
export async function dispatchReminder(
  event: "booking_confirmed" | "appointment_24h_reminder" | "appointment_cancelled" | "doctor_emergency_cancel",
  payload: { email: string; phone?: string; name: string; slotTime: string },
) {
  // Legacy fallback - creates a simple notification
  const msg = `Hi ${payload.name}, your appointment update: ${event.replace(/_/g, " ")} for ${new Date(payload.slotTime).toLocaleString()}.`;
  const { sendEmailReminder } = await import("@/lib/notifications/providers/resend");
  await sendEmailReminder(payload.email, "LiffeyCare Update", `<p>${msg}</p>`);
}
