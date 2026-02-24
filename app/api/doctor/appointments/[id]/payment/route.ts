import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
const paymentSchema = z.object({ status: z.enum(["paid", "pending"]) });
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user || user.role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const { status } = parsed.data;
  const supabase = getSupabaseServerClient();
  const { data: appt, error: aErr } = await supabase
    .from("appointments")
    .select("id, doctor_id, payment_status, payment_method, amount_paid")
    .eq("id", params.id)
    .single();
  if (aErr || !appt) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 },
    );
  }
  if (appt.doctor_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (appt.payment_method !== "pay_at_clinic") {
    return NextResponse.json(
      { error: "Only 'pay at clinic' appointments can be manually marked." },
      { status: 400 },
    );
  }
  if (appt.payment_status === status) {
    return NextResponse.json({ ok: true });
  }
  const { data: doctor, error: dErr } = await supabase
    .from("profiles")
    .select("consultation_price, wallet_balance")
    .eq("id", user.id)
    .single();
  if (dErr || !doctor) {
    return NextResponse.json(
      { error: "Doctor profile not found" },
      { status: 404 },
    );
  }
  const price = Number(doctor.consultation_price || 0);
  const currentBalance = Number(doctor.wallet_balance || 0);
  if (status === "paid") {
    const { error: uErr } = await supabase
      .from("appointments")
      .update({ payment_status: "paid", amount_paid: price })
      .eq("id", params.id);
    if (uErr)
      return NextResponse.json({ error: uErr.message }, { status: 400 });
    await supabase
      .from("profiles")
      .update({ wallet_balance: currentBalance + price })
      .eq("id", user.id);
    await supabase
      .from("doctor_wallet_ledger")
      .insert({
        doctor_id: user.id,
        appointment_id: appt.id,
        amount: price,
        entry_type: "earning",
        note: "Marked as paid in clinic",
      });
  } else {
    //
    const { error: uErr } = await supabase
      .from("appointments")
      .update({ payment_status: "pending", amount_paid: 0 })
      .eq("id", params.id);
    if (uErr)
      return NextResponse.json({ error: uErr.message }, { status: 400 });
    const amountToRevert = Number(appt.amount_paid || 0);
    await supabase
      .from("profiles")
      .update({ wallet_balance: Math.max(0, currentBalance - amountToRevert) })
      .eq("id", user.id); //
    supabase
      .from("doctor_wallet_ledger")
      .insert({
        doctor_id: user.id,
        appointment_id: appt.id,
        amount: -amountToRevert,
        entry_type: "withdrawal",
        note: "Clinic payment reversal",
      });
  }
  return NextResponse.json({ ok: true });
}
