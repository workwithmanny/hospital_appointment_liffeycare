import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/notifications/providers/resend";
import {
  patientBookingConfirmationEmail,
  doctorNewBookingEmail,
  appointmentReminderEmail,
  appointmentStartedEmail,
  appointmentCancelledEmail,
} from "@/lib/notifications/templates";

export async function POST(request: Request) {
  const { to, template } = await request.json().catch(() => ({}));
  
  if (!to) {
    return NextResponse.json(
      { error: "Email 'to' address is required" },
      { status: 400 }
    );
  }

  // Debug: Check if API key is configured
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  
  if (!apiKey) {
    return NextResponse.json(
      { 
        error: "RESEND_API_KEY not configured", 
        debug: {
          apiKeyExists: !!apiKey,
          fromEmailExists: !!fromEmail,
          envKeys: Object.keys(process.env).filter(k => k.includes('RESEND') || k.includes('EMAIL')),
        }
      },
      { status: 503 }
    );
  }

  const testContext = {
    patientName: "John Doe",
    doctorName: "Dr. Jane Smith",
    slotTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    appointmentId: "test-123-456",
    reason: "General consultation",
    consultationPrice: 75.00,
    cancelledBy: "Patient",
    cancellationReason: "Schedule conflict",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };

  let result;

  switch (template) {
    case "booking_confirmed":
      result = patientBookingConfirmationEmail(testContext);
      break;
    case "booking_confirmed_doctor":
      result = doctorNewBookingEmail(testContext);
      break;
    case "appointment_reminder":
      result = appointmentReminderEmail(testContext);
      break;
    case "appointment_started":
      result = appointmentStartedEmail(testContext);
      break;
    case "appointment_cancelled":
      result = appointmentCancelledEmail(testContext);
      break;
    default:
      // Default test email
      result = patientBookingConfirmationEmail(testContext);
  }

  try {
    const emailResult = await sendEmail(to, result.subject, result.html);
    
    console.log("[Test Email] Result:", emailResult);

    if (emailResult.skipped) {
      return NextResponse.json(
        { 
          error: "Email sending skipped - RESEND_API_KEY not configured",
          details: emailResult.error 
        },
        { status: 503 }
      );
    }

    if (emailResult.error) {
      return NextResponse.json(
        { 
          error: "Failed to send email", 
          details: emailResult.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Test email sent successfully",
      template: template || "booking_confirmed",
      to,
      result: emailResult,
    });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
