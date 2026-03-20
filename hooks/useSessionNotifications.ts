"use client";
import { useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";

export type SessionNotificationType = 
  | "doctor_joined" 
  | "patient_joined" 
  | "patient_waiting" 
  | "session_started" 
  | "session_ended";

type UseSessionNotificationsProps = {
  appointmentId: string;
  userRole: "doctor" | "patient";
  otherPartyName: string;
  onDoctorJoined?: () => void;
  onPatientJoined?: () => void;
  onSessionStarted?: () => void;
};

export function useSessionNotifications({
  appointmentId,
  userRole,
  otherPartyName,
  onDoctorJoined,
  onPatientJoined,
  onSessionStarted,
}: UseSessionNotificationsProps) {
  const toast = useToast();
  const notifiedEvents = useRef<Set<string>>(new Set());
  const hasNotificationPermission = useRef(false);

  // Check notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      hasNotificationPermission.current = Notification.permission === "granted";
    }
  }, []);

  const showBrowserNotification = useCallback((
    title: string, 
    body: string, 
    tag: string,
    onClick?: () => void
  ) => {
    if (!hasNotificationPermission.current) return;

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
  }, []);

  const notify = useCallback((
    type: SessionNotificationType,
    data?: { doctorJoined?: boolean; patientJoined?: boolean; sessionStarted?: boolean }
  ) => {
    const eventKey = `${appointmentId}-${type}`;
    
    // Prevent duplicate notifications
    if (notifiedEvents.current.has(eventKey)) {
      return;
    }

    let toastConfig: { kind: "info" | "success"; title: string; message: string } | null = null;
    let browserConfig: { title: string; body: string } | null = null;

    switch (type) {
      case "doctor_joined":
        if (userRole === "patient" && data?.doctorJoined) {
          toastConfig = {
            kind: "info",
            title: "Doctor joined",
            message: "Your doctor is here. They will start the consultation shortly.",
          };
          browserConfig = {
            title: "Doctor Joined",
            body: `${otherPartyName} has joined your consultation`,
          };
          notifiedEvents.current.add(eventKey);
          onDoctorJoined?.();
        }
        break;

      case "patient_joined":
        if (userRole === "doctor" && data?.patientJoined) {
          toastConfig = {
            kind: "info",
            title: "Patient joined",
            message: "Your patient is in the consultation room.",
          };
          browserConfig = {
            title: "Patient Joined",
            body: `${otherPartyName} has joined the consultation`,
          };
          notifiedEvents.current.add(eventKey);
          onPatientJoined?.();
        }
        break;

      case "patient_waiting":
        if (userRole === "doctor" && data?.patientJoined && !data?.doctorJoined) {
          toastConfig = {
            kind: "info",
            title: "Patient waiting",
            message: `${otherPartyName} is waiting for you to join.`,
          };
          browserConfig = {
            title: "Patient Waiting",
            body: `${otherPartyName} is waiting for you to join the consultation`,
          };
          notifiedEvents.current.add(eventKey);
        }
        break;

      case "session_started":
        if (data?.sessionStarted) {
          const isMyStart = userRole === "doctor";
          toastConfig = {
            kind: "success",
            title: "Consultation started",
            message: isMyStart 
              ? "You started the consultation. Timer is running."
              : "The consultation has started. Timer is running.",
          };
          browserConfig = {
            title: "Consultation Started",
            body: isMyStart 
              ? "You started the consultation with " + otherPartyName
              : "The consultation with " + otherPartyName + " has started",
          };
          notifiedEvents.current.add(eventKey);
          onSessionStarted?.();
        }
        break;

      case "session_ended":
        toastConfig = {
          kind: "info",
          title: "Session ended",
          message: "The consultation has ended.",
        };
        browserConfig = {
          title: "Consultation Ended",
          body: "Your consultation with " + otherPartyName + " has ended",
        };
        notifiedEvents.current.add(eventKey);
        break;
    }

    // Show toast notification
    if (toastConfig) {
      toast.push({
        kind: toastConfig.kind,
        title: toastConfig.title,
        message: toastConfig.message,
        ttlMs: 5000,
      });
    }

    // Show browser notification
    if (browserConfig) {
      showBrowserNotification(
        browserConfig.title,
        browserConfig.body,
        eventKey
      );
    }
  }, [appointmentId, userRole, otherPartyName, onDoctorJoined, onPatientJoined, onSessionStarted, showBrowserNotification, toast]);

  const clearNotifications = useCallback(() => {
    notifiedEvents.current.clear();
  }, []);

  const hasNotified = useCallback((type: SessionNotificationType) => {
    const eventKey = `${appointmentId}-${type}`;
    return notifiedEvents.current.has(eventKey);
  }, [appointmentId]);

  return {
    notify,
    clearNotifications,
    hasNotified,
    showBrowserNotification,
  };
}
