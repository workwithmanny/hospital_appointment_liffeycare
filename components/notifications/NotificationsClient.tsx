"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, ArrowLeft, Clock, Calendar, Info, AlertCircle, CheckCircle2, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useDoctorNotifications } from "./DoctorNotificationProvider";
import { formatDistanceToNow } from "date-fns";

export function NotificationsClient({ homeHref }: { homeHref: string }) {
  const toast = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useDoctorNotifications();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Simulate loading on initial mount
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (e) {
      toast.push({
        kind: "error",
        title: "Error",
        message: "Failed to mark notification as read",
        ttlMs: 3000,
      });
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      toast.push({
        kind: "success",
        title: "Success",
        message: "All notifications marked as read",
        ttlMs: 3000,
      });
    } catch (e) {
      toast.push({
        kind: "error",
        title: "Error",
        message: "Failed to mark all as read",
        ttlMs: 3000,
      });
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await clearAll();
      toast.push({
        kind: "success",
        title: "Success",
        message: "All notifications cleared",
        ttlMs: 3000,
      });
    } catch (e) {
      toast.push({
        kind: "error",
        title: "Error",
        message: "Failed to clear notifications",
        ttlMs: 3000,
      });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const getIcon = (kind: string) => {
    switch (kind) {
      case "appointment_booked":
      case "appointment_reminder":
        return <Calendar className="w-5 h-5 text-[#14b6a6]" />;
      case "appointment_cancelled":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "message":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-violet-500" />;
    }
  };

  const getBackgroundColor = (kind: string, read: boolean) => {
    if (read) return "bg-white border-border";
    switch (kind) {
      case "appointment_booked":
        return "bg-[#14b6a6]/5 border-[#14b6a6]/20";
      case "appointment_cancelled":
        return "bg-red-50/50 border-red-200";
      default:
        return "bg-violet-50/50 border-violet-200";
    }
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a
                href={homeHref}
                className="p-2 -ml-2 rounded-xl hover:bg-subtle transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </a>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#14b6a6]" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-semibold text-text-primary">
                    Notifications
                  </h1>
                  <p className="text-sm text-text-secondary">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                  </p>
                </div>
              </div>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Refresh page"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarkAll()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#14b6a6]/10 px-3 py-2 text-sm font-medium text-[#14b6a6] hover:bg-[#14b6a6]/20 transition-colors"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Mark all read</span>
                    <span className="sm:hidden">Mark all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleClearAll()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear all</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b6a6]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#14b6a6]/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-[#14b6a6]" />
            </div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
              All caught up!
            </h3>
            <p className="text-text-secondary max-w-sm mx-auto">
              You have no notifications right now. We will let you know when something important happens.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isUnread = !n.is_read;
              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${getBackgroundColor(n.kind, !isUnread)} ${
                    isUnread ? "shadow-sm" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shrink-0">
                      {getIcon(n.kind)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-semibold ${isUnread ? "text-text-primary" : "text-text-secondary"}`}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className={`mt-1 text-sm ${isUnread ? "text-text-secondary" : "text-text-tertiary"}`}>
                              {n.body}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-text-tertiary">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                        </div>

                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => void handleMarkRead(n.id)}
                            className="text-xs font-medium text-[#14b6a6] hover:text-[#0d9488] transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
