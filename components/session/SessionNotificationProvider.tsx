"use client";

import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

interface ActiveSession {
  appointmentId: string;
  userRole: "doctor" | "patient";
  otherPartyName: string;
  otherPartyId: string;
  startTime: Date;
  endsAt?: Date;
  status: "waiting" | "active" | "ended";
}

interface SessionNotificationContextType {
  activeSession: ActiveSession | null;
  setActiveSession: (session: ActiveSession | null) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  hasNotificationPermission: boolean;
  requestNotificationPermission: () => Promise<void>;
}

const SessionNotificationContext = createContext<SessionNotificationContextType | undefined>(undefined);

export function useSessionNotification() {
  const context = useContext(SessionNotificationContext);
  if (!context) {
    throw new Error("useSessionNotification must be used within SessionNotificationProvider");
  }
  return context;
}

export function SessionNotificationProvider({ 
  children, 
  userId, 
  userRole 
}: { 
  children: React.ReactNode; 
  userId: string;
  userRole: "doctor" | "patient";
}) {
  const router = useRouter();
  const toast = useToast();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  
  // Track which session notifications have been sent to avoid duplicates
  const sentNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasNotificationPermission(Notification.permission === "granted");
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setHasNotificationPermission(result === "granted");
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string, tag: string, onClick?: () => void) => {
    if (!hasNotificationPermission) return;
    
    try {
      const notification = new Notification(title, {
        body,
        tag,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        onClick?.();
      };
    } catch (err) {
      console.error("Failed to show notification:", err);
    }
  }, [hasNotificationPermission]);

  // Listen for appointment updates across all pages
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    
    // Subscribe to appointments where user is either doctor or patient
    const channel = supabase
      .channel(`global-session-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
        },
        async (payload) => {
          const appt = payload.new as {
            id: string;
            doctor_id: string;
            patient_id: string;
            status: string;
            doctor_joined_at?: string;
            patient_joined_at?: string;
            session_started_at?: string;
            session_ends_at?: string;
          };

          // Only care about appointments where user is involved
          if (appt.doctor_id !== userId && appt.patient_id !== userId) return;

          const isUserDoctor = appt.doctor_id === userId;
          const otherPartyId = isUserDoctor ? appt.patient_id : appt.doctor_id;

          // Fetch other party info
          const { data: otherParty } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", otherPartyId)
            .single();

          const otherPartyName = otherParty?.full_name || (isUserDoctor ? "Patient" : "Doctor");

          // Doctor joined notification (for patient)
          if (!isUserDoctor && appt.doctor_joined_at && appt.status === "scheduled") {
            const joinPath = `/patient/session/${appt.id}`;
            toast.push({
              kind: "info",
              title: "Doctor joined",
              message: `Dr. ${otherPartyName} has joined and is waiting for you.`,
              ttlMs: 8000,
              action: {
                label: "Join Session",
                onClick: () => router.push(joinPath),
              },
            });
            showBrowserNotification(
              "Doctor Joined",
              `Dr. ${otherPartyName} is waiting for you in the consultation room`,
              `doctor-joined-${appt.id}`,
              () => router.push(joinPath)
            );
          }

          // Patient joined notification (for doctor)
          if (isUserDoctor && appt.patient_joined_at && appt.status === "scheduled") {
            const joinPath = `/doctor/session/${appt.id}`;
            toast.push({
              kind: "info",
              title: "Patient joined",
              message: `${otherPartyName} has joined and is waiting for you.`,
              ttlMs: 8000,
              action: {
                label: "Join Session",
                onClick: () => router.push(joinPath),
              },
            });
            showBrowserNotification(
              "Patient Joined",
              `${otherPartyName} is waiting for you in the consultation room`,
              `patient-joined-${appt.id}`,
              () => router.push(joinPath)
            );
          }

          const oldStatus = (payload.old as { status?: string })?.status;
          const notificationKey = `session-started-${appt.id}`;

          // Session started notification (only when status changes to in_progress and not already sent)
          if (appt.status === "in_progress" && appt.session_started_at && oldStatus !== "in_progress" && !sentNotifications.current.has(notificationKey)) {
            sentNotifications.current.add(notificationKey);
            const joinPath = isUserDoctor ? `/doctor/session/${appt.id}` : `/patient/session/${appt.id}`;
            toast.push({
              kind: "success",
              title: "Consultation started",
              message: `The session with ${otherPartyName} has begun.`,
              ttlMs: 5000,
              action: {
                label: "Join Session",
                onClick: () => router.push(joinPath),
              },
            });
            showBrowserNotification(
              "Consultation Started",
              `Your session with ${otherPartyName} has started`,
              `session-started-${appt.id}`,
              () => router.push(joinPath)
            );
          }

          // Update active session if it exists
          if (activeSession && activeSession.appointmentId === appt.id) {
            if (appt.status === "completed" || appt.status === "cancelled") {
              setActiveSession((prev) => prev ? { ...prev, status: "ended" } : null);
            } else if (appt.status === "in_progress") {
              setActiveSession((prev) => prev ? { ...prev, status: "active" } : null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, userRole, toast, showBrowserNotification, router, activeSession]);

  return (
    <SessionNotificationContext.Provider
      value={{
        activeSession,
        setActiveSession,
        isMinimized,
        setIsMinimized,
        hasNotificationPermission,
        requestNotificationPermission,
      }}
    >
      {children}
    </SessionNotificationContext.Provider>
  );
}
