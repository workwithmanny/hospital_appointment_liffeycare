"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  UserCircle,
  Calendar,
  TrendingUp,
  Activity,
  PieChart,
  Clock,
  ChevronDown,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  BarChart4,
  Hospital,
  Stethoscope,
  CheckCircle,
  CalendarDays,
  TrendingDown,
} from "lucide-react";

interface Stats {
  doctors: { total: number; approved: number; pending: number };
  patients: { total: number; new_this_month: number };
  appointments: { 
    total: number; 
    scheduled: number; 
    completed: number; 
    cancelled: number; 
    today: number;
    this_week: number;
    this_month: number;
    completion_rate: number;
  };
}

interface ChartData {
  appointments_by_day: { day: string; count: number; date: string }[];
  appointments_by_month: { month: string; count: number }[];
  status_distribution: { status: string; count: number; percentage: number }[];
  top_doctors: { doctor_id: string; full_name: string; avatar_url?: string; appointment_count: number }[];
  hourly_distribution: { hour: number; count: number }[];
}

const timeRanges = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 3 Months", value: "3m" },
  { label: "Last 6 Months", value: "6m" },
];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "doctors">("overview");

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${timeRange}`);
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
      setChartData(data.chartData || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    color,
    subtitle,
  }: {
    title: string;
    value: number;
    icon: any;
    trend?: string;
    trendUp?: boolean;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-[#14b6a6]/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
              {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );

  const BarChart = ({ data, labels, color }: { data: number[]; labels: string[]; color: string }) => {
    const max = Math.max(...data, 1);
    return (
      <div className="h-40 sm:h-48 flex items-end gap-1 sm:gap-2">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full ${color} rounded-t-lg transition-all duration-500 relative group`}
              style={{ height: `${(val / max) * 140}px`, minHeight: "4px" }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {val}
              </div>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 truncate w-full text-center">{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  };

  const DonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {data.map((segment, i) => {
              const angle = (segment.value / total) * 360;
              const startAngle = currentAngle;
              currentAngle += angle;

              const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 50 + 40 * Math.cos((Math.PI * currentAngle) / 180);
              const y2 = 50 + 40 * Math.sin((Math.PI * currentAngle) / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;

              return (
                <path
                  key={i}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={segment.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              );
            })}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base sm:text-lg font-bold text-gray-900">{total}</span>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 capitalize">{item.label}</span>
              </div>
              <span className="font-medium">{item.value} ({Math.round((item.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#14b6a6]/20 border-t-[#14b6a6]"></div>
        </div>
      </div>
    );
  }

  const appointmentStatusData = [
    { label: "Scheduled", value: stats?.appointments.scheduled || 0, color: "#3b82f6" },
    { label: "Completed", value: stats?.appointments.completed || 0, color: "#14b6a6" },
    { label: "Cancelled", value: stats?.appointments.cancelled || 0, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center shadow-lg shadow-[#14b6a6]/20 shrink-0">
            <BarChart4 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-sm">Comprehensive insights and performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-700 px-4 py-2 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] transition-all"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#14b6a6] text-white rounded-xl text-sm font-medium hover:bg-[#0d9488] transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 sm:mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {["overview", "appointments", "doctors"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Doctors"
              value={stats?.doctors.total ?? 0}
              icon={Stethoscope}
              trend="+5% vs last period"
              trendUp={true}
              color="bg-[#14b6a6]/10 text-[#14b6a6]"
              subtitle={`${stats?.doctors.approved} approved, ${stats?.doctors.pending} pending`}
            />
            <StatCard
              title="Total Patients"
              value={stats?.patients.total ?? 0}
              icon={Users}
              trend="+12% vs last period"
              trendUp={true}
              color="bg-emerald-100 text-emerald-600"
              subtitle={`+${stats?.patients.new_this_month || 0} new this month`}
            />
            <StatCard
              title="Appointments"
              value={stats?.appointments.total ?? 0}
              icon={CalendarDays}
              trend="+8% vs last period"
              trendUp={true}
              color="bg-blue-100 text-blue-600"
              subtitle={`${stats?.appointments.this_month || 0} this month`}
            />
            <StatCard
              title="Completion Rate"
              value={stats?.appointments.completion_rate ?? 0}
              icon={CheckCircle}
              trend="+3% vs last period"
              trendUp={true}
              color="bg-violet-100 text-violet-600"
              subtitle="Successful appointments"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Appointments Trend */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#14b6a6]/10 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-[#14b6a6]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Appointments Trend</h3>
                    <p className="text-sm text-gray-500">Daily appointment volume</p>
                  </div>
                </div>
              </div>
              {chartData?.appointments_by_day ? (
                <BarChart
                  data={chartData.appointments_by_day.map((d) => d.count)}
                  labels={chartData.appointments_by_day.map((d) => d.day)}
                  color="bg-[#14b6a6]"
                />
              ) : (
                <div className="h-40 sm:h-48 flex items-center justify-center text-gray-400">
                  No data available
                </div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <PieChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Status Distribution</h3>
                    <p className="text-sm text-gray-500">Appointment outcomes</p>
                  </div>
                </div>
              </div>
              {appointmentStatusData.length > 0 ? (
                <DonutChart data={appointmentStatusData} />
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 sm:p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Today</h3>
              </div>
              <p className="text-3xl sm:text-4xl font-bold">{stats?.appointments.today ?? 0}</p>
              <p className="text-blue-100 mt-1 text-sm">Appointments scheduled</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 sm:p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">This Week</h3>
              </div>
              <p className="text-3xl sm:text-4xl font-bold">{stats?.appointments.this_week ?? 0}</p>
              <p className="text-emerald-100 mt-1 text-sm">Total appointments</p>
            </div>
            <div className="bg-gradient-to-br from-[#14b6a6] to-[#0d9488] rounded-2xl p-5 sm:p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Success Rate</h3>
              </div>
              <p className="text-3xl sm:text-4xl font-bold">{stats?.appointments.completion_rate ?? 0}%</p>
              <p className="text-teal-100 mt-1 text-sm">Appointments completed</p>
            </div>
          </div>
        </>
      )}

      {activeTab === "appointments" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Hourly Distribution */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Peak Hours</h3>
                <p className="text-sm text-gray-500">Appointment distribution by hour</p>
              </div>
            </div>
            {chartData?.hourly_distribution ? (
              <BarChart
                data={chartData.hourly_distribution.map((h) => h.count)}
                labels={chartData.hourly_distribution.map((h) => `${h.hour}:00`)}
                color="bg-indigo-500"
              />
            ) : (
              <div className="h-40 sm:h-48 flex items-center justify-center text-gray-400">No data available</div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Monthly Trend</h3>
                <p className="text-sm text-gray-500">Appointment volume over months</p>
              </div>
            </div>
            {chartData?.appointments_by_month ? (
              <BarChart
                data={chartData.appointments_by_month.map((m) => m.count)}
                labels={chartData.appointments_by_month.map((m) => m.month)}
                color="bg-emerald-500"
              />
            ) : (
              <div className="h-40 sm:h-48 flex items-center justify-center text-gray-400">No data available</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "doctors" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#14b6a6]/10 rounded-xl">
                <Stethoscope className="w-5 h-5 text-[#14b6a6]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Top Performing Doctors</h3>
                <p className="text-sm text-gray-500">By appointment volume</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {chartData?.top_doctors && chartData.top_doctors.length > 0 ? (
              <div className="space-y-4">
                {chartData.top_doctors.map((doctor, index) => (
                  <div key={doctor.doctor_id} className="flex items-center gap-3 sm:gap-4">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 rounded-full text-xs sm:text-sm font-medium text-gray-600 shrink-0">
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#14b6a6]/10 to-[#0d9488]/10 flex items-center justify-center shrink-0">
                      {doctor.avatar_url ? (
                        <img src={doctor.avatar_url} alt={doctor.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-[#14b6a6]">
                          {doctor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{doctor.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 bg-gray-100 rounded-full flex-1 max-w-[150px] sm:max-w-[200px]">
                          <div
                            className="h-full bg-[#14b6a6] rounded-full"
                            style={{
                              width: `${(doctor.appointment_count / (chartData.top_doctors[0]?.appointment_count || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{doctor.appointment_count} appts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No data available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
