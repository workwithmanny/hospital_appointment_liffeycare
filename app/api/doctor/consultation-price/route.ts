import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
const priceSchema = z.object({
  consultationPrice: z.number().min(0).max(100000),
});
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "doctor" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = priceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ consultation_price: parsed.data.consultationPrice })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
