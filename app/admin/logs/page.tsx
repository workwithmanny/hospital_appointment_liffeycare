"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Search,
  Download,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Ban,
  Mail,
  Shield,
  RefreshCw,
  FileText,
  Terminal,
  History,
  Eye,
} from "lucide-react";

interface SystemLog {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: { full_name?: string; role?: string; id?: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionOptions = [
  { value: "", label: "All Actions" },
  { value: "admin_created_department", label: "Created Department" },
  { value: "admin_deleted_department", label: "Deleted Department" },
  { value: "admin_updated_doctor", label: "Updated Doctor" },
  { value: "admin_deleted_doctor", label: "Deleted Doctor" },
  { value: "admin_deleted_patient", label: "Deleted Patient" },
  { value: "admin_updated_appointment", label: "Updated Appointment" },
  { value: "admin_deleted_appointment", label: "Deleted Appointment" },
  { value: "admin_banned_user", label: "Banned User" },
  { value: "admin_unbanned_user", label: "Unbanned User" },
  { value: "admin_sent_message", label: "Sent Message" },
];

const getActionIcon = (action: string) => {
  if (action.includes("ban")) return <Ban className="w-4 h-4" />;
  if (action.includes("delete")) return <XCircle className="w-4 h-4" />;
  if (action.includes("create") || action.includes("add")) return <CheckCircle className="w-4 h-4" />;
  if (action.includes("update")) return <RefreshCw className="w-4 h-4" />;
  if (action.includes("message") || action.includes("mail")) return <Mail className="w-4 h-4" />;
  if (action.includes("approve")) return <Shield className="w-4 h-4" />;
  return <AlertCircle className="w-4 h-4" />;
};

const getActionColor = (action: string) => {
  if (action.includes("ban") || action.includes("delete")) return "bg-rose-50 text-rose-700 border-rose-100";
  if (action.includes("create") || action.includes("add")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (action.includes("update")) return "bg-blue-50 text-blue-700 border-blue-100";
  if (action.includes("message") || action.includes("mail")) return "bg-violet-50 text-violet-700 border-violet-100";
  if (action.includes("approve")) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-gray-50 text-gray-700 border-gray-100";
};

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (actionFilter) params.append("action", actionFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchLogs();
  };

  const handleExport = () => {
    const csvContent = [
      ["Timestamp", "Action", "Actor", "Details"].join(","),
      ...logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.action,
        log.actor?.full_name || "System",
        JSON.stringify(log.metadata).replace(/,/g, ";").replace(/\n/g, " ")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
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
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.actor?.full_name?.toLowerCase().includes(query) ||
      JSON.stringify(log.metadata).toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center shadow-lg shadow-[#14b6a6]/20 shrink-0">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">System Logs</h1>
            <p className="text-gray-500 text-sm">Audit trail of all administrative actions</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#14b6a6] text-white rounded-xl text-sm font-medium hover:bg-[#0d9488] transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 sm:mb-6 overflow-hidden">
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] w-full sm:w-48 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6] bg-white flex-1"
            >
              {actionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6]"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6]"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-[#14b6a6] text-white rounded-xl text-sm font-medium hover:bg-[#0d9488] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3 mb-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#14b6a6]/20 border-t-[#14b6a6] mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <ScrollText className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No logs found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => { setSelectedLog(log); setShowDetailModal(true); }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-[#14b6a6]/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg border ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                    {formatAction(log.action)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimeAgo(log.created_at)}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">
                    {log.actor ? log.actor.full_name : "System"}
                  </span>
                  {log.actor?.role && (
                    <span className="text-xs text-gray-400 capitalize">({log.actor.role})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 truncate">
                  {JSON.stringify(log.metadata).slice(0, 60)}...
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#14b6a6]/20 border-t-[#14b6a6] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ScrollText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No logs found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    onClick={() => { setSelectedLog(log); setShowDetailModal(true); }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatTimeAgo(log.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg border ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.actor ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{log.actor.full_name}</p>
                            <p className="text-xs text-gray-400 capitalize">{log.actor.role}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {JSON.stringify(log.metadata).slice(0, 50)}...
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Pagination */}
      {!loading && filteredLogs.length > 0 && (
        <div className="lg:hidden flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${getActionColor(selectedLog.action)}`}>
                  {getActionIcon(selectedLog.action)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{formatAction(selectedLog.action)}</h2>
                  <p className="text-sm text-gray-500">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Actor
                </p>
                {selectedLog.actor ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#14b6a6]/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#14b6a6]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedLog.actor.full_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{selectedLog.actor.role}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">System</span>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Metadata
                </p>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
