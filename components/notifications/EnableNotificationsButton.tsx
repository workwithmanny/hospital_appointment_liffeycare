"use client";

import { Bell, BellOff } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "liffery_notifications_enabled";

export function EnableNotificationsButton() {
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setBrowserPermission(Notification.permission);
      }
      // Load saved preference (default to true)
      const saved = localStorage.getItem(STORAGE_KEY);
      setEnabled(saved === null ? true : saved === "true");
    }
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (typeof window === "undefined") return;

    const newState = !enabled;
    setEnabled(newState);
    localStorage.setItem(STORAGE_KEY, String(newState));

    // If enabling and browser permission not granted, request it
    if (newState && "Notification" in window && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
    }
  }, [enabled]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <button
        type="button"
        className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-100"
        disabled
      >
        <Bell className="h-4 w-4 text-slate-400" />
      </button>
    );
  }

  const isActive = enabled && (browserPermission === "granted" || browserPermission === "default");

  return (
    <button
      type="button"
      onClick={toggleNotifications}
      className={`rounded-lg border p-2 transition hover:bg-slate-100 ${
        isActive ? "border-emerald-200 bg-emerald-50" : "border-slate-200 opacity-60"
      }`}
      title={isActive ? "Notifications enabled - click to disable" : "Notifications disabled - click to enable"}
    >
      {isActive ? (
        <Bell className="h-4 w-4 text-emerald-600" />
      ) : (
        <BellOff className="h-4 w-4 text-slate-400" />
      )}
    </button>
  );
}

// Helper to check if notifications are enabled
export function areNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === "true";
}
