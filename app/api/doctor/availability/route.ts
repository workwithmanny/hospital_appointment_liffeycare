import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirstZodErrorMessage } from "@/lib/zod-utils";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const availabilityRowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const bulkAvailabilitySchema = z.object({
  rows: z.array(availabilityRowSchema).max(7),
});

function generateTimes(startTime: string, endTime: string, stepMinutes = 30) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const out: string[] = [];
  for (let m = start; m + stepMinutes <= end; m += stepMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const supabase = getSupabaseServerClient();

  // Public booking / directory: needs doctorId + date to produce available time options.
  if (doctorId && date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay(); // 0..6

    const { data: rows, error } = await supabase
      .from("doctor_availability")
      .select("day_of_week, start_time, end_time")
      .eq("doctor_id", doctorId)
      .eq("day_of_week", dayOfWeek);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const times = (rows ?? []).flatMap((r) =>
      generateTimes(r.start_time, r.end_time, 30),
    );
    const uniqueTimes = Array.from(new Set(times)).sort();
    return NextResponse.json({ times: uniqueTimes });
  }

  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Doctor managing own schedule: no params => return their current weekly availability rows.
  if (!doctorId && !date) {
    if (user.role !== "doctor" && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("doctor_availability")
      .select("day_of_week, start_time, end_time")
      .eq("doctor_id", user.id)
      .order("day_of_week", { ascending: true });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      rows: (data ?? []).map((r) => ({
        dayOfWeek: r.day_of_week,
        startTime: r.start_time,
        endTime: r.end_time,
      })),
    });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "doctor" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = availabilityRowSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  if (parsed.data.startTime >= parsed.data.endTime) {
    return NextResponse.json(
      { error: "Start time must be before end time." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("doctor_availability").insert({
    doctor_id: user.id,
    day_of_week: parsed.data.dayOfWeek,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "doctor" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bulkAvailabilitySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  // Validate each row time ordering + unique dayOfWeek
  const seen = new Set<number>();
  for (const r of parsed.data.rows) {
    if (r.startTime >= r.endTime) {
      return NextResponse.json(
        { error: "Start time must be before end time." },
        { status: 400 },
      );
    }
    if (seen.has(r.dayOfWeek)) {
      return NextResponse.json(
        { error: "Duplicate day entries are not allowed." },
        { status: 400 },
      );
    }
    seen.add(r.dayOfWeek);
  }

  const supabase = getSupabaseServerClient();
  const del = await supabase
    .from("doctor_availability")
    .delete()
    .eq("doctor_id", user.id);
  if (del.error)
    return NextResponse.json({ error: del.error.message }, { status: 500 });

  if (parsed.data.rows.length === 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ins = await supabase.from("doctor_availability").insert(
    parsed.data.rows.map((r) => ({
      doctor_id: user.id,
      day_of_week: r.dayOfWeek,
      start_time: r.startTime,
      end_time: r.endTime,
    })),
  );

  if (ins.error)
    return NextResponse.json({ error: ins.error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 200 });
}
