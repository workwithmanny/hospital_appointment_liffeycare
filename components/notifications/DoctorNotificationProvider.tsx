"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Bell, Calendar } from "lucide-react";

interface AppointmentNotification {
  id: string;
  appointment_id?: string;
  doctor_id?: string;
  user_id?: string;
  patient_id?: string;
  patient_name?: string;
  type: string;
  kind?: string;
  title?: string;
  body?: string;
  message?: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

interface NotificationContextType {
  notifications: AppointmentNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useDoctorNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useDoctorNotifications must be used within DoctorNotificationProvider");
  }
  return context;
}

interface DoctorNotificationProviderProps {
  doctorId: string;
  children: ReactNode;
}

export function DoctorNotificationProvider({ doctorId, children }: DoctorNotificationProviderProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();
  const supabase = getSupabaseClient();

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?type=appointment_booked");
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark as read");
      }
      // Reload from server to ensure state is correct
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      throw err;
    }
  }, [loadNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark all as read");
      }
      // Reload from server to ensure state is correct
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      throw err;
    }
  }, [loadNotifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clear all");
      }
      // Reload from server to ensure state is correct
      await loadNotifications();
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
      throw err;
    }
  }, [loadNotifications]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!doctorId) return;

    // Load initial notifications
    loadNotifications();

    // Subscribe to app_notifications table
    const channel = supabase
      .channel(`doctor-notifications-${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_notifications",
          filter: `user_id=eq.${doctorId}`,
        },
        (payload) => {
          const newNotification = payload.new as AppointmentNotification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification with action button
          const notificationBody = (newNotification as any).body || (newNotification as any).message || "A patient booked an appointment with you";
          const notificationTitle = (newNotification as any).title || "New Appointment";
          const appointmentId = (newNotification as any).appointment_id || (newNotification as any).metadata?.appointment_id;
          
          toast.push({
            kind: "info",
            title: notificationTitle,
            message: notificationBody,
            ttlMs: 10000,
            action: appointmentId ? {
              label: "View Appointment",
              onClick: () => {
                router.push(`/doctor/appointments/${appointmentId}`);
              },
            } : undefined,
          });

          // Show browser notification if permitted
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification(notificationTitle, {
                body: notificationBody,
                icon: "/favicon.ico",
                tag: newNotification.id,
              });
            } else if (Notification.permission !== "denied") {
              Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                  new Notification(notificationTitle, {
                    body: notificationBody,
                    icon: "/favicon.ico",
                    tag: newNotification.id,
                  });
                }
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_notifications",
        },
        (payload) => {
          const updatedNotification = payload.new as AppointmentNotification;
          const oldNotification = payload.old as AppointmentNotification;
          
          // Only process if it's for this doctor
          if (updatedNotification.user_id !== doctorId) return;
          
          // Update the notification in the list
          setNotifications(prev => prev.map(n => n.id === updatedNotification.id ? { 
            ...n, 
            ...updatedNotification,
            is_read: !!updatedNotification.read_at
          } : n));
          
          // If read_at was set (notification was marked as read), decrement count
          if (!oldNotification.read_at && updatedNotification.read_at) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    // Refresh on window focus
    const handleFocus = () => {
      void loadNotifications();
    };
    window.addEventListener("focus", handleFocus);

    // Periodic refresh every 10 seconds
    const interval = setInterval(() => {
      void loadNotifications();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [doctorId, supabase, toast, loadNotifications, router]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
