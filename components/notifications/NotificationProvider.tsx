"use client";

import React, { createContext, useContext, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

type NotificationContextType = {
  requestPermission: () => Promise<void>;
  permission: NotificationPermission;
  lastMessage: MessageNotification | null;
};

type MessageNotification = {
  id: string;
  senderName: string;
  body: string;
  threadId: string;
  senderId: string;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

export function NotificationProvider({ children, userId, userRole }: { 
  children: React.ReactNode; 
  userId: string;
  userRole: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [lastMessage, setLastMessage] = useState<MessageNotification | null>(null);
  const [processedMessageIds] = useState(() => new Set<string>());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const showNotification = useCallback((title: string, body: string, tag: string, threadId?: string, senderRole?: string) => {
    if (permission !== "granted") return;

    const notification = new Notification(title, {
      body,
      tag,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navigate to chat page
      if (threadId) {
        const chatPath = senderRole === "doctor" ? "/patient/chat" : "/doctor/chat";
        router.push(chatPath);
      }
    };
  }, [permission, router]);

  // Subscribe to new messages
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`global-messages-${userId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "messages",
          filter: `recipient_id=eq.${userId}`
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            sender_id: string;
            body: string;
            thread_id: string;
          };

          // Skip if already processed this message
          if (processedMessageIds.has(msg.id)) return;
          processedMessageIds.add(msg.id);

          // Get sender info
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", msg.sender_id)
            .single();

          const senderName = sender?.role === "doctor" 
            ? `Dr. ${sender.full_name}` 
            : sender?.full_name || "Unknown";

          const notificationData: MessageNotification = {
            id: msg.id,
            senderName,
            body: msg.body,
            threadId: msg.thread_id,
            senderId: msg.sender_id,
          };

          setLastMessage(notificationData);

          const isChatPage = window.location.pathname.includes("/chat");

          // Show in-app toast notification on all pages EXCEPT chat
          if (!isChatPage) {
            const chatPath = sender?.role === "doctor" ? "/patient/chat" : "/doctor/chat";
            toast.push({
              kind: "info",
              title: `New message from ${senderName}`,
              message: msg.body.length > 100 ? `${msg.body.slice(0, 100)}...` : msg.body,
              ttlMs: 8000,
              action: {
                label: "Open Chat",
                onClick: () => router.push(chatPath),
              },
            });
          }

          // Show browser notification when tab is hidden or on other pages
          if (!isChatPage || document.hidden) {
            showNotification(
              `New message from ${senderName}`,
              msg.body.length > 100 ? `${msg.body.slice(0, 100)}...` : msg.body,
              msg.id,
              msg.thread_id,
              sender?.role
            );
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, showNotification, toast, processedMessageIds]);

  return (
    <NotificationContext.Provider value={{ requestPermission, permission, lastMessage }}>
      {children}
    </NotificationContext.Provider>
  );
}
