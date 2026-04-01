import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAppointmentAdmin } from "@/lib/stripe/rollback-appointment";
import { getAppUrl, getStripe } from "@/lib/stripe/server";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

const appointmentSchema = z.object({
  doctorId: z.string().uuid(),
  slotTime: z.string().datetime(),
  reason: z.string().min(3).max(500).optional(),
  paymentMethod: z.enum(["stripe", "pay_at_clinic"]).default("stripe"),
  parentAppointmentId: z.string().uuid().optional(),
  consultationDurationMinutes: z.number().int().min(15).max(120).optional(),
});

function isTimeWithinRange(time: string, start: string, end: string) {
  // time/start/end are HH:MM (24h). end is exclusive for slot start.
  const [th, tm] = time.split(":").map(Number);
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const t = th * 60 + tm;
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return t >= s && t < e;
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  console.log("DELETE request - User:", user?.id, "Role:", user?.role);

  if (!user || (user.role !== "patient" && user.role !== "doctor")) {
    console.log("Unauthorized - missing or invalid role");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("id");
  console.log("Appointment ID:", appointmentId);

  if (!appointmentId) {
    console.log("Missing appointment ID");
    return NextResponse.json(
      { error: "Appointment ID is required" },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { cancellationReason } = body;
  console.log("Cancellation reason:", cancellationReason);

  if (!cancellationReason || cancellationReason.trim().length < 3) {
    console.log("Invalid cancellation reason");
    return NextResponse.json(
      { error: "Cancellation reason is required (minimum 3 characters)" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();

  // Get the appointment to verify ownership
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, patient_id, doctor_id, status, slot_time")
    .eq("id", appointmentId)
    .single();

  console.log("Found appointment:", appointment);
  console.log("Fetch error:", fetchError);

  if (fetchError || !appointment) {
    console.log("Appointment not found");
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 },
    );
  }

  // Verify the user owns this appointment (either as patient or doctor)
  if (user.role === "patient" && appointment.patient_id !== user.id) {
    console.log(
      "Patient authorization failed - user ID:",
      user.id,
      "appointment patient ID:",
      appointment.patient_id,
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "doctor" && appointment.doctor_id !== user.id) {
    console.log("Doctor authorization failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if appointment can be cancelled (not already cancelled or completed)
  if (appointment.status === "cancelled") {
    console.log("Appointment already cancelled");
    return NextResponse.json(
      { error: "Appointment is already cancelled" },
      { status: 400 },
    );
  }

  if (appointment.status === "completed") {
    console.log("Appointment already completed");
    return NextResponse.json(
      { error: "Cannot cancel completed appointments" },
      { status: 400 },
    );
  }

  // Update appointment status to cancelled with reason
  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancellation_reason: cancellationReason.trim(),
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  console.log("Update error:", updateError);

  if (updateError) {
    console.log("Database update failed:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Send cancellation email notifications
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Get full appointment details for email
  const { data: fullAppointment } = await supabase
    .from("appointments")
    .select("*, patient:patient_id(full_name, email), doctor:doctor_id(full_name, email)")
    .eq("id", appointmentId)
    .single();

  if (fullAppointment) {
    const cancelledByName = user.role === "doctor" 
      ? fullAppointment.doctor?.full_name 
      : fullAppointment.patient?.full_name;
    
    // Send to patient
    if (fullAppointment.patient?.email) {
      await dispatchNotification("appointment_cancelled", {
        email: fullAppointment.patient.email,
        patientName: fullAppointment.patient.full_name || "Patient",
        doctorName: fullAppointment.doctor?.full_name || "Doctor",
        slotTime: appointment.slot_time,
        appointmentId: appointment.id,
        cancelledBy: cancelledByName || user.role,
        cancellationReason: cancellationReason.trim(),
        appUrl,
      }).catch((err) => console.error("Failed to send patient cancellation email:", err));
    }

    // Send to doctor
    if (fullAppointment.doctor?.email && fullAppointment.doctor.email !== fullAppointment.patient?.email) {
      await dispatchNotification("appointment_cancelled", {
        email: fullAppointment.doctor.email,
        patientName: fullAppointment.patient?.full_name || "Patient",
        doctorName: fullAppointment.doctor.full_name || "Doctor",
        slotTime: appointment.slot_time,
        appointmentId: appointment.id,
        cancelledBy: cancelledByName || user.role,
        cancellationReason: cancellationReason.trim(),
        appUrl,
      }).catch((err) => console.error("Failed to send doctor cancellation email:", err));
    }
  }

  console.log("Appointment cancelled successfully");
  return NextResponse.json(
    {
      ok: true,
      message: "Appointment cancelled successfully",
      appointment: {
        id: appointment.id,
        status: "cancelled",
        cancellation_reason: cancellationReason.trim(),
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  
  // First try to get and refresh the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("[API] No valid session found:", sessionError);
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }
  
  // Get user from session
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.error("[API] Failed to get user:", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Get user profile for role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
    
  if (!profile || profile.role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const user = {
    id: userData.user.id,
    email: userData.user.email ?? "",
    role: profile.role,
  };

  const parsed = appointmentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const { data: doctor, error: doctorError } = await supabase
    .from("profiles")
    .select("id, full_name, role, doctor_approved, consultation_price")
    .eq("id", parsed.data.doctorId)
    .single();

  if (
    doctorError ||
    !doctor ||
    doctor.role !== "doctor" ||
    !doctor.doctor_approved
  ) {
    return NextResponse.json(
      { error: "Selected doctor is not available for booking." },
      { status: 400 },
    );
  }

  // Enforce doctor's weekly availability. (Times interpreted in UTC.)
  const slotDate = new Date(parsed.data.slotTime);
  if (Number.isNaN(slotDate.getTime())) {
    return NextResponse.json({ error: "Invalid slot time." }, { status: 400 });
  }

  // Prevent booking appointments in the past
  const now = new Date();
  if (slotDate.getTime() < now.getTime()) {
    return NextResponse.json(
      { error: "Cannot book appointments in the past. Please select a future date and time." },
      { status: 400 },
    );
  }

  const slotDow = slotDate.getUTCDay(); // 0..6
  const slotTime = `${String(slotDate.getUTCHours()).padStart(2, "0")}:${String(
    slotDate.getUTCMinutes(),
  ).padStart(2, "0")}`;

  const { data: availRows, error: availError } = await supabase
    .from("doctor_availability")
    .select("start_time, end_time")
    .eq("doctor_id", parsed.data.doctorId)
    .eq("day_of_week", slotDow);

  if (availError) {
    return NextResponse.json({ error: availError.message }, { status: 500 });
  }
  const allowed = (availRows ?? []).some((r) =>
    isTimeWithinRange(slotTime, r.start_time, r.end_time),
  );
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "This doctor is not available at that time. Please choose another slot.",
      },
      { status: 400 },
    );
  }

  const amount = Number(doctor.consultation_price ?? 0);

  if (parsed.data.paymentMethod === "stripe") {
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error:
            "This doctor has no consultation price set. Card payment is not available for this booking.",
        },
        { status: 400 },
      );
    }
  }

  if (parsed.data.parentAppointmentId) {
    const { data: parent } = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id")
      .eq("id", parsed.data.parentAppointmentId)
      .single();
    if (
      !parent ||
      parent.patient_id !== user.id ||
      parent.doctor_id !== parsed.data.doctorId
    ) {
      return NextResponse.json(
        { error: "Invalid follow-up appointment link." },
        { status: 400 },
      );
    }
  }

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      patient_id: user.id,
      doctor_id: parsed.data.doctorId,
      slot_time: parsed.data.slotTime,
      status: "scheduled",
      session_notes: parsed.data.reason ?? null,
      payment_method: parsed.data.paymentMethod,
      payment_status: "pending",
      amount_paid: 0,
      ...(parsed.data.parentAppointmentId
        ? { parent_appointment_id: parsed.data.parentAppointmentId }
        : {}),
      ...(parsed.data.consultationDurationMinutes != null
        ? {
            consultation_duration_minutes:
              parsed.data.consultationDurationMinutes,
          }
        : {}),
    })
    .select("id, patient_id, doctor_id, slot_time, status")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This slot has already been booked. Pick another time." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Create a conversation thread for direct messaging
  const { data: thread } = await supabase
    .from("conversation_threads")
    .insert({
      patient_id: user.id,
      doctor_id: parsed.data.doctorId,
    })
    .select("id")
    .single();

  // Insert a welcome message in the chat (linked to thread)
  await supabase.from("messages").insert({
    thread_id: thread?.id ?? null,
    appointment_id: appointment.id,
    sender_id: parsed.data.doctorId, // From doctor
    recipient_id: user.id, // To patient
    body: `Hello! Your appointment for ${new Date(parsed.data.slotTime).toLocaleString()} has been successfully booked. I look forward to seeing you.`,
    message_type: "appointment",
  });

  // Note: Notification is created by database trigger (on_appointment_booked_notification)
  // No need to manually insert here to avoid duplicates

  let stripeCheckoutUrl: string | undefined;

  if (parsed.data.paymentMethod === "stripe") {
    const stripe = getStripe();
    if (!stripe) {
      await deleteAppointmentAdmin(appointment.id);
      return NextResponse.json(
        {
          error:
            "Card payment is not configured. Add STRIPE_SECRET_KEY to the server environment.",
        },
        { status: 503 },
      );
    }

    const currency = (process.env.STRIPE_CURRENCY ?? "usd")
      .toLowerCase()
      .slice(0, 3);
    const unitAmount = Math.round(amount * 100);
    if (unitAmount < 50) {
      await deleteAppointmentAdmin(appointment.id);
      return NextResponse.json(
        {
          error:
            "Consultation price must be at least $0.50 USD (or equivalent) for card payments.",
        },
        { status: 400 },
      );
    }

    const appUrl = getAppUrl(request);
    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email || undefined,
        client_reference_id: appointment.id,
        metadata: {
          appointment_id: appointment.id,
          patient_id: user.id,
        },
        success_url: `${appUrl}/patient/booking/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/patient/booking?canceled=1`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: unitAmount,
              product_data: {
                name: `Consultation — ${doctor.full_name ?? "Doctor"}`,
                description: `Scheduled ${new Date(parsed.data.slotTime).toLocaleString(undefined, { timeZone: "UTC" })} (UTC)`,
              },
            },
          },
        ],
      });
    } catch (e) {
      await deleteAppointmentAdmin(appointment.id);
      const msg = e instanceof Error ? e.message : "Stripe error";
      return NextResponse.json(
        { error: `Could not start checkout: ${msg}` },
        { status: 502 },
      );
    }

    const url = checkoutSession.url;
    if (!url) {
      await deleteAppointmentAdmin(appointment.id);
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }
    stripeCheckoutUrl = url;
  }

  // Send email notifications to both patient and doctor
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Get patient profile for name
  const { data: patientProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  
  // Get doctor email
  const { data: doctorAuth } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", parsed.data.doctorId)
    .single();

  // Send patient confirmation email immediately
  await dispatchNotification("booking_confirmed", {
    email: user.email,
    patientName: patientProfile?.full_name || "Patient",
    doctorName: doctor.full_name || "Doctor",
    slotTime: parsed.data.slotTime,
    appointmentId: appointment.id,
    reason: parsed.data.reason,
    consultationPrice: amount || undefined,
    appUrl,
  }).catch((err) => console.error("Failed to send patient email:", err));

  // Send doctor notification email ONLY for pay_at_clinic (Stripe notifications sent after payment)
  if (parsed.data.paymentMethod === "pay_at_clinic" && doctorAuth?.email) {
    await dispatchNotification("booking_confirmed_doctor", {
      email: doctorAuth.email,
      patientName: patientProfile?.full_name || "Patient",
      doctorName: doctor.full_name || "Doctor",
      slotTime: parsed.data.slotTime,
      appointmentId: appointment.id,
      reason: parsed.data.reason,
      appUrl,
    }).catch((err) => console.error("Failed to send doctor email:", err));
  }

  return NextResponse.json(
    {
      ok: true,
      appointment: {
        id: appointment.id,
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        slotTime: appointment.slot_time,
        status: appointment.status,
      },
      ...(stripeCheckoutUrl ? { stripeCheckoutUrl } : {}),
    },
    { status: 201 },
  );
}
