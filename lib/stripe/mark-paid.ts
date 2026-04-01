import type Stripe from "stripe";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

/** Idempotently mark an appointment paid from a completed Checkout Session (webhook or return URL). */
export async function markAppointmentPaidFromStripeSession(
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  console.log(
    "markAppointmentPaid: starting for session",
    session.id,
    "status:",
    session.payment_status,
  );
  if (session.payment_status !== "paid") {
    console.log("markAppointmentPaid: session not paid");
    return false;
  }
  const appointmentId = session.metadata?.appointment_id;
  if (!appointmentId) {
    console.log("markAppointmentPaid: missing metadata appointment_id");
    return false;
  }

  const amountMajor =
    session.amount_total != null ? Number(session.amount_total) / 100 : 0;

  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch (err) {
    console.error("markAppointmentPaid: admin client error", err);
    return false;
  }

  const { data: existing, error: existingErr } = await admin
    .from("appointments")
    .select("id, payment_status, doctor_id, slot_time, session_notes, patient:patient_id(full_name, email), doctor:doctor_id(full_name, email)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (existingErr || !existing) {
    console.error("markAppointmentPaid: appointment not found", existingErr);
    return false;
  }
  if (existing.payment_status === "paid") {
    console.log("markAppointmentPaid: already paid");
    return true;
  }

  // 1. Mark appointment as paid and save transaction ID
  const { error: updateError } = await admin
    .from("appointments")
    .update({
      payment_status: "paid",
      amount_paid: amountMajor,
      stripe_transaction_id: String(session.payment_intent || session.id),
    })
    .eq("id", appointmentId);

  if (updateError) {
    console.error(
      "markAppointmentPaid: Error updating appointment:",
      updateError,
    );
    return false;
  }

  // 2. Add to doctor's wallet
  const { data: profile } = await admin
    .from("profiles")
    .select("wallet_balance")
    .eq("id", existing.doctor_id)
    .maybeSingle();

  if (profile) {
    const currentBalance = Number(profile.wallet_balance || 0);
    const newBalance = currentBalance + amountMajor;

    const { error: walletError } = await admin
      .from("profiles")
      .update({ wallet_balance: newBalance })
      .eq("id", existing.doctor_id);

    if (walletError) {
      console.error(
        "markAppointmentPaid: Error updating wallet balance:",
        walletError,
      );
    }

    // 3. Record in ledger
    const { error: ledgerError } = await admin
      .from("doctor_wallet_ledger")
      .insert({
        doctor_id: existing.doctor_id,
        appointment_id: appointmentId,
        amount: amountMajor,
        entry_type: "earning",
        note: "Patient paid via Stripe",
      });

    if (ledgerError) {
      console.error(
        "markAppointmentPaid: Error inserting ledger row:",
        ledgerError,
      );
    }
  }

  // 4. Send doctor notification email (only when payment is confirmed)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const patient = (existing as any).patient;
  const doctor = (existing as any).doctor;
  
  if (doctor?.email) {
    await dispatchNotification("booking_confirmed_doctor", {
      email: doctor.email,
      patientName: patient?.full_name || "Patient",
      doctorName: doctor?.full_name || "Doctor",
      slotTime: existing.slot_time,
      appointmentId: existing.id,
      reason: existing.session_notes || undefined,
      appUrl,
    }).catch((err) => console.error("Failed to send doctor email:", err));
  }

  console.log("markAppointmentPaid: successfully marked paid");
  return true;
}
