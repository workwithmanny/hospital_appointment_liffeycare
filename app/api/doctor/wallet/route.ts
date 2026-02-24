import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
const withdrawSchema = z.object({
  amount: z.number().positive().max(1_000_000),
});
export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "doctor" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseServerClient();
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .single();
  if (pErr) {
    if (String(pErr.message).includes("wallet_balance")) {
      return NextResponse.json({
        balance: 0,
        ledger: [],
        note: "Run DB migration for wallet_balance",
      });
    }
    return NextResponse.json({ error: pErr.message }, { status: 400 });
  }
  const { data: ledger, error: lErr } = await supabase
    .from("doctor_wallet_ledger")
    .select("id, appointment_id, amount, entry_type, note, created_at")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 400 });
  return NextResponse.json({
    balance: Number(profile?.wallet_balance ?? 0),
    ledger: ledger ?? [],
  });
}
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = withdrawSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const amount = parsed.data.amount;
  const supabase = getSupabaseServerClient();
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .single();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
  const balance = Number(profile?.wallet_balance ?? 0);
  if (amount > balance) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 },
    );
  }
  const { error: uErr } = await supabase
    .from("profiles")
    .update({ wallet_balance: balance - amount })
    .eq("id", user.id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });
  const { error: lErr } = await supabase.from("doctor_wallet_ledger").insert({
    doctor_id: user.id,
    appointment_id: null,
    amount,
    entry_type: "withdrawal",
    note: "Withdrawal (demo — wire in production)",
  });
  if (lErr) {
    await supabase
      .from("profiles")
      .update({ wallet_balance: balance })
      .eq("id", user.id);
    return NextResponse.json({ error: lErr.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, newBalance: balance - amount });
}
