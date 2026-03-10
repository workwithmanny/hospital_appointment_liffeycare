"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  UserCircle, 
  Calendar, 
  CheckCircle, 
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  MoreHorizontal
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
    completion_rate: number;
  };
}

interface Activity {
  id: string;
  action: string;
  actor?: { full_name?: string };
  created_at: string;
}

interface PendingApproval {
  id: string;
  full_name: string;
  specialty?: string;
  created_at: string;
  avatar_url?: string;
}

interface ChartData {
  appointments_by_day: { day: string; count: number }[];
  status_distribution: { status: string; count: number; percentage: number }[];
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
      setChartData(data.chartData || null);
      setRecentActivity(data.recentActivity);
      setPendingApprovals(data.pendingApprovals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/admin /g, "")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    href, 
    color,
    bgColor,
    trend,
    trendUp 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    href: string; 
    color: string;
    bgColor: string;
    trend?: string;
    trendUp?: boolean;
  }) => (
    <Link href={href} className="group bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#14b6a6]/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{value.toLocaleString()}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 sm:mt-3 text-xs sm:text-sm font-medium ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
              {trendUp ? <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">{trend}</span>
              <span className="sm:hidden">{trend.split(" ")[0]}</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${bgColor} ${color} transition-transform duration-300 group-hover:scale-110 shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </Link>
  );

  const ProgressBar = ({ label, value, total, color, bgColor }: { label: string; value: number; total: number; color: string; bgColor: string }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="font-semibold text-gray-900">{value} <span className="text-gray-400">({percentage}%)</span></span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} ${bgColor} transition-all duration-700 ease-out`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };

  const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data, 1);
    return (
      <div className="flex items-end gap-1.5 h-20">
        {data.map((val, i) => (
          <div
            key={i}
            className={`flex-1 ${color} rounded-t-lg transition-all duration-700 ease-out hover:opacity-80 cursor-pointer`}
            style={{ height: `${(val / max) * 100}%`, minHeight: "8px" }}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#14b6a6]/20 border-t-[#14b6a6]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center shadow-lg shadow-[#14b6a6]/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Pending Approvals"
          value={stats?.doctors.pending ?? 0}
          icon={CheckCircle}
          href="/admin/approvals"
          bgColor="bg-amber-50"
          color="text-amber-600"
          trend="Needs attention"
          trendUp={false}
        />
        <StatCard
          title="Active Doctors"
          value={stats?.doctors.approved ?? 0}
          icon={UserCircle}
          href="/admin/doctors"
          bgColor="bg-[#14b6a6]/10"
          color="text-[#14b6a6]"
          trend="+3 this week"
          trendUp={true}
        />
        <StatCard
          title="Total Patients"
          value={stats?.patients.total ?? 0}
          icon={Users}
          href="/admin/patients"
          bgColor="bg-emerald-50"
          color="text-emerald-600"
          trend={`+${stats?.patients.new_this_month || 0} this month`}
          trendUp={true}
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.appointments.today ?? 0}
          icon={Calendar}
          href="/admin/appointments"
          bgColor="bg-violet-50"
          color="text-violet-600"
          trend={`${stats?.appointments.this_week || 0} this week`}
          trendUp={true}
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Appointments Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-[#14b6a6]/10 rounded-xl">
              <PieChart className="w-5 h-5 text-[#14b6a6]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Appointments Status</h3>
              <p className="text-xs text-gray-500">Distribution overview</p>
            </div>
          </div>
          <div className="mb-4">
            <ProgressBar 
              label="Scheduled" 
              value={stats?.appointments.scheduled || 0} 
              total={stats?.appointments.total || 1} 
              color="bg-blue-500" 
              bgColor="bg-blue-500"
            />
            <ProgressBar 
              label="Completed" 
              value={stats?.appointments.completed || 0} 
              total={stats?.appointments.total || 1} 
              color="bg-emerald-500" 
              bgColor="bg-emerald-500"
            />
            <ProgressBar 
              label="Cancelled" 
              value={stats?.appointments.cancelled || 0} 
              total={stats?.appointments.total || 1} 
              color="bg-rose-500" 
              bgColor="bg-rose-500"
            />
          </div>
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Completion Rate</span>
              <span className="text-2xl font-bold text-emerald-600">
                {stats?.appointments.completion_rate || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-[#14b6a6]/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-[#14b6a6]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Trend</h3>
              <p className="text-xs text-gray-500">Appointments last 7 days</p>
            </div>
          </div>
          {chartData?.appointments_by_day ? (
            <MiniChart 
              data={chartData.appointments_by_day.map(d => d.count)} 
              color="bg-[#14b6a6]" 
            />
          ) : (
            <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
              No data available
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/admin/analytics" className="text-sm text-[#14b6a6] hover:text-[#0d9488] font-medium hover:underline flex items-center gap-1 transition-colors">
              View detailed analytics
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Doctors Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-[#14b6a6]/10 rounded-xl">
              <Activity className="w-5 h-5 text-[#14b6a6]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Doctors Overview</h3>
              <p className="text-xs text-gray-500">Approval status</p>
            </div>
          </div>
          <div className="space-y-3">
            <ProgressBar 
              label="Approved" 
              value={stats?.doctors.approved || 0} 
              total={stats?.doctors.total || 1} 
              color="bg-emerald-500" 
              bgColor="bg-emerald-500"
            />
            <ProgressBar 
              label="Pending" 
              value={stats?.doctors.pending || 0} 
              total={stats?.doctors.total || 1} 
              color="bg-amber-500" 
              bgColor="bg-amber-500"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Approval Rate</span>
              <span className="text-2xl font-bold text-[#14b6a6]">
                {stats?.doctors.total ? Math.round((stats.doctors.approved / stats.doctors.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
            </div>
            <Link href="/admin/approvals" className="text-sm font-medium text-[#14b6a6] hover:text-[#0d9488] transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No pending approvals</p>
                <p className="text-sm text-gray-400 mt-1">All doctors have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 5).map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-[#14b6a6]/30 hover:shadow-sm transition-all duration-200 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#14b6a6]/20 to-[#0d9488]/20 flex items-center justify-center text-[#14b6a6] font-semibold shrink-0">
                        {doctor.avatar_url ? (
                          <img src={doctor.avatar_url} alt={doctor.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">
                            {doctor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{doctor.full_name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{doctor.specialty || "General Practice"}</p>
                      </div>
                    </div>
                    <Link
                      href="/admin/doctors"
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#14b6a6] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-[#0d9488] transition-colors shadow-sm text-center sm:text-left"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-xl">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <Link href="/admin/logs" className="text-sm font-medium text-[#14b6a6] hover:text-[#0d9488] transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No recent activity</p>
                <p className="text-sm text-gray-400 mt-1">Activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="w-2.5 h-2.5 bg-[#14b6a6] rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {formatAction(activity.action)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="font-medium text-gray-600">{activity.actor?.full_name || "System"}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(activity.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
