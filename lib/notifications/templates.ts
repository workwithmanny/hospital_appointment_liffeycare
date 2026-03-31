// Email templates for appointment notifications

interface AppointmentContext {
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

const brandColor = "#16a34a"; // green-600
const brandColorHover = "#15803d"; // green-700

function formatDateTime(slotTime: string): string {
  const date = new Date(slotTime);
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function baseTemplate(title: string, content: string, appUrl = "http://localhost:3000"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: ${brandColor}; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; }
    .btn { display: inline-block; padding: 12px 24px; background: ${brandColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0; }
    .btn:hover { background: ${brandColorHover}; }
    .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; margin: 10px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
    .details-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #374151; }
    .value { color: #6b7280; }
    .highlight { background: #dcfce7; border-left: 4px solid ${brandColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .danger { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LiffeyCare</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} LiffeyCare. All rights reserved.</p>
      <p>Need help? Contact us at <a href="mailto:support@liffeycare.app">support@liffeycare.app</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function patientBookingConfirmationEmail(ctx: AppointmentContext): { subject: string; html: string } {
  const subject = "Appointment Confirmed - LiffeyCare";
  const content = `
    <h2 style="margin-top: 0; color: #111;">Hello ${ctx.patientName},</h2>
    <p>Your appointment has been successfully booked with <strong>Dr. ${ctx.doctorName}</strong>.</p>
    
    <div class="highlight">
      <strong>Appointment Confirmed</strong><br>
      Please arrive 10 minutes early for check-in.
    </div>
    
    <div class="details">
      <div class="details-row">
        <span class="label">Doctor</span>
        <span class="value">Dr. ${ctx.doctorName}</span>
      </div>
      <div class="details-row">
        <span class="label">Date & Time</span>
        <span class="value">${formatDateTime(ctx.slotTime)}</span>
      </div>
      ${ctx.reason ? `
      <div class="details-row">
        <span class="label">Reason</span>
        <span class="value">${ctx.reason}</span>
      </div>
      ` : ""}
      ${ctx.consultationPrice ? `
      <div class="details-row">
        <span class="label">Consultation Fee</span>
        <span class="value">$${ctx.consultationPrice.toFixed(2)}</span>
      </div>
      ` : ""}
      <div class="details-row">
        <span class="label">Appointment ID</span>
        <span class="value">${ctx.appointmentId}</span>
      </div>
    </div>
    
    <center>
      <a href="${ctx.appUrl || "http://localhost:3000"}/patient/appointments" class="btn">View My Appointments</a>
    </center>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      You can message your doctor anytime before the appointment through the secure chat in your account.
    </p>
  `;
  
  return { subject, html: baseTemplate(subject, content, ctx.appUrl) };
}

export function doctorNewBookingEmail(ctx: AppointmentContext): { subject: string; html: string } {
  const subject = "New Patient Appointment - LiffeyCare";
  const content = `
    <h2 style="margin-top: 0; color: #111;">Hello Dr. ${ctx.doctorName},</h2>
    <p>You have a new appointment booking from <strong>${ctx.patientName}</strong>.</p>
    
    <div class="highlight">
      <strong>New Booking Alert</strong><br>
      A patient has scheduled an appointment with you.
    </div>
    
    <div class="details">
      <div class="details-row">
        <span class="label">Patient</span>
        <span class="value">${ctx.patientName}</span>
      </div>
      <div class="details-row">
        <span class="label">Date & Time</span>
        <span class="value">${formatDateTime(ctx.slotTime)}</span>
      </div>
      ${ctx.reason ? `
      <div class="details-row">
        <span class="label">Reason</span>
        <span class="value">${ctx.reason}</span>
      </div>
      ` : ""}
      <div class="details-row">
        <span class="label">Appointment ID</span>
        <span class="value">${ctx.appointmentId}</span>
      </div>
    </div>
    
    <center>
      <a href="${ctx.appUrl || "http://localhost:3000"}/doctor/appointments" class="btn">View Appointments</a>
    </center>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      You can communicate with the patient through the secure chat before the appointment.
    </p>
  `;
  
  return { subject, html: baseTemplate(subject, content, ctx.appUrl) };
}

export function appointmentReminderEmail(ctx: AppointmentContext): { subject: string; html: string } {
  const subject = "Appointment Reminder - LiffeyCare";
  const content = `
    <h2 style="margin-top: 0; color: #111;">Hello ${ctx.patientName},</h2>
    
    <div class="warning">
      <strong>Reminder:</strong> Your appointment is coming up soon!
    </div>
    
    <div class="details">
      <div class="details-row">
        <span class="label">Doctor</span>
        <span class="value">Dr. ${ctx.doctorName}</span>
      </div>
      <div class="details-row">
        <span class="label">Date & Time</span>
        <span class="value">${formatDateTime(ctx.slotTime)}</span>
      </div>
      <div class="details-row">
        <span class="label">Appointment ID</span>
        <span class="value">${ctx.appointmentId}</span>
      </div>
    </div>
    
    <center>
      <a href="${ctx.appUrl || "http://localhost:3000"}/patient/appointments" class="btn">View Appointment</a>
    </center>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Please arrive 10 minutes early. If you need to cancel or reschedule, please do so at least 24 hours in advance.
    </p>
  `;
  
  return { subject, html: baseTemplate(subject, content, ctx.appUrl) };
}

export function appointmentStartedEmail(ctx: AppointmentContext): { subject: string; html: string } {
  const subject = "Your Appointment Has Started - LiffeyCare";
  const content = `
    <h2 style="margin-top: 0; color: #111;">Hello ${ctx.patientName},</h2>
    
    <div class="highlight">
      <strong>Appointment In Progress</strong><br>
      Your appointment with Dr. ${ctx.doctorName} has started.
    </div>
    
    <div class="details">
      <div class="details-row">
        <span class="label">Doctor</span>
        <span class="value">Dr. ${ctx.doctorName}</span>
      </div>
      <div class="details-row">
        <span class="label">Started At</span>
        <span class="value">${formatDateTime(new Date().toISOString())}</span>
      </div>
      <div class="details-row">
        <span class="label">Appointment ID</span>
        <span class="value">${ctx.appointmentId}</span>
      </div>
    </div>
    
    <center>
      <a href="${ctx.appUrl || "http://localhost:3000"}/patient/chat/${ctx.appointmentId}" class="btn">Open Chat</a>
    </center>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      You can use the secure chat to communicate with your doctor during the consultation.
    </p>
  `;
  
  return { subject, html: baseTemplate(subject, content, ctx.appUrl) };
}

export function appointmentCancelledEmail(ctx: AppointmentContext): { subject: string; html: string } {
  const subject = "Appointment Cancelled - LiffeyCare";
  const content = `
    <h2 style="margin-top: 0; color: #111;">Hello ${ctx.patientName},</h2>
    
    <div class="danger">
      <strong>Appointment Cancelled</strong><br>
      Your appointment has been cancelled.
    </div>
    
    <div class="details">
      <div class="details-row">
        <span class="label">Doctor</span>
        <span class="value">Dr. ${ctx.doctorName}</span>
      </div>
      <div class="details-row">
        <span class="label">Was Scheduled For</span>
        <span class="value">${formatDateTime(ctx.slotTime)}</span>
      </div>
      <div class="details-row">
        <span class="label">Appointment ID</span>
        <span class="value">${ctx.appointmentId}</span>
      </div>
      ${ctx.cancelledBy ? `
      <div class="details-row">
        <span class="label">Cancelled By</span>
        <span class="value">${ctx.cancelledBy}</span>
      </div>
      ` : ""}
      ${ctx.cancellationReason ? `
      <div class="details-row">
        <span class="label">Reason</span>
        <span class="value">${ctx.cancellationReason}</span>
      </div>
      ` : ""}
    </div>
    
    <center>
      <a href="${ctx.appUrl || "http://localhost:3000"}/doctors" class="btn">Book New Appointment</a>
    </center>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Need assistance? Contact our support team at <a href="mailto:support@liffeycare.app">support@liffeycare.app</a>
    </p>
  `;
  
  return { subject, html: baseTemplate(subject, content, ctx.appUrl) };
}
