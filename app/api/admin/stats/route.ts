import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("range") || "7d";

  const supabase = getSupabaseServiceClient();

  // Calculate date ranges
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Base stats queries
  const [
    { count: totalDoctors },
    { count: approvedDoctors },
    { count: pendingDoctors },
    { count: totalPatients },
    { count: newPatientsThisMonth },
    { count: totalAppointments },
    { count: scheduledAppointments },
    { count: completedAppointments },
    { count: cancelledAppointments },
    { count: todayAppointments },
    { count: weekAppointments },
    { count: monthAppointments },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "doctor"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "doctor").eq("doctor_approved", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "doctor").eq("doctor_approved", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "patient"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "patient").gte("created_at", monthStart),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("appointments").select("*", { count: "exact", head: true }).gte("slot_time", today).lt("slot_time", tomorrow),
    supabase.from("appointments").select("*", { count: "exact", head: true }).gte("slot_time", weekAgo),
    supabase.from("appointments").select("*", { count: "exact", head: true }).gte("slot_time", monthStart),
  ]);

  // Calculate rates
  const total = (totalAppointments ?? 0);
  const completionRate = total > 0 ? Math.round(((completedAppointments ?? 0) / total) * 100) : 0;

  // Recent activity
  const { data: recentActivity } = await supabase
    .from("system_logs")
    .select(`
      *,
      actor:actor_id(full_name, role)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  // Pending approvals with avatar
  const { data: pendingApprovals } = await supabase
    .from("profiles")
    .select("id, full_name, specialty, created_at, avatar_url")
    .eq("role", "doctor")
    .eq("doctor_approved", false)
    .order("created_at", { ascending: false })
    .limit(5);

  // Chart data - appointments by day (last 7 days)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const appointmentsByDay = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 86400000);
      const dateStr = date.toISOString().split("T")[0];
      return supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("slot_time", dateStr)
        .lt("slot_time", new Date(date.getTime() + 86400000).toISOString().split("T")[0])
        .then(({ count }) => ({
          day: days[date.getDay()],
          date: dateStr,
          count: count ?? 0,
        }));
    })
  );

  // Status distribution
  const statusDistribution = [
    { status: "scheduled", count: scheduledAppointments ?? 0, percentage: total > 0 ? Math.round(((scheduledAppointments ?? 0) / total) * 100) : 0 },
    { status: "completed", count: completedAppointments ?? 0, percentage: total > 0 ? Math.round(((completedAppointments ?? 0) / total) * 100) : 0 },
    { status: "cancelled", count: cancelledAppointments ?? 0, percentage: total > 0 ? Math.round(((cancelledAppointments ?? 0) / total) * 100) : 0 },
  ];

  // Top doctors by appointment count
  const { data: topDoctors } = await supabase
    .from("appointments")
    .select("doctor_id, profiles:doctor_id(id, full_name, avatar_url)")
    .not("doctor_id", "is", null);

  // Process top doctors
  const doctorCounts = new Map<string, { id: string; full_name: string; avatar_url?: string; count: number }>();
  topDoctors?.forEach((apt: any) => {
    if (apt.doctor_id && apt.profiles) {
      const existing = doctorCounts.get(apt.doctor_id);
      if (existing) {
        existing.count++;
      } else {
        doctorCounts.set(apt.doctor_id, {
          id: apt.doctor_id,
          full_name: apt.profiles.full_name,
          avatar_url: apt.profiles.avatar_url,
          count: 1,
        });
      }
    }
  });

  const sortedTopDoctors = Array.from(doctorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(d => ({
      doctor_id: d.id,
      full_name: d.full_name,
      avatar_url: d.avatar_url,
      appointment_count: d.count,
    }));

  // Hourly distribution
  const { data: appointmentsForHourly } = await supabase
    .from("appointments")
    .select("slot_time");

  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: appointmentsForHourly?.filter((apt: any) => {
      const aptHour = new Date(apt.slot_time).getHours();
      return aptHour === hour;
    }).length ?? 0,
  })).filter(h => h.count > 0);

  // Monthly trend (last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const appointmentsByMonth = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const start = d.toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      return supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("slot_time", start)
        .lt("slot_time", end)
        .then(({ count }) => ({
          month: monthNames[d.getMonth()],
          count: count ?? 0,
        }));
    })
  );

  return NextResponse.json({
    stats: {
      doctors: {
        total: totalDoctors ?? 0,
        approved: approvedDoctors ?? 0,
        pending: pendingDoctors ?? 0,
      },
      patients: {
        total: totalPatients ?? 0,
        new_this_month: newPatientsThisMonth ?? 0,
      },
      appointments: {
        total: totalAppointments ?? 0,
        scheduled: scheduledAppointments ?? 0,
        completed: completedAppointments ?? 0,
        cancelled: cancelledAppointments ?? 0,
        today: todayAppointments ?? 0,
        this_week: weekAppointments ?? 0,
        this_month: monthAppointments ?? 0,
        completion_rate: completionRate,
      },
    },
    chartData: {
      appointments_by_day: appointmentsByDay,
      appointments_by_month: appointmentsByMonth,
      status_distribution: statusDistribution,
      top_doctors: sortedTopDoctors,
      hourly_distribution: hourlyDistribution,
    },
    recentActivity: recentActivity ?? [],
    pendingApprovals: pendingApprovals ?? [],
  });
}
