"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface MessageContextType {
  unreadCount: number;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function useDoctorMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useDoctorMessages must be used within DoctorMessageProvider");
  }
  return context;
}

interface DoctorMessageProviderProps {
  doctorId: string;
  initialUnreadCount?: number;
  children: ReactNode;
}

export function DoctorMessageProvider({ doctorId, initialUnreadCount = 0, children }: DoctorMessageProviderProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const supabase = getSupabaseClient();

  // Load unread count from server
  const refreshUnreadCount = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id")
        .eq("recipient_id", doctorId)
        .is("read_at", null);
      
      if (error) throw error;
      setUnreadCount(data?.length ?? 0);
    } catch (err) {
      console.error("Failed to refresh unread message count:", err);
    }
  }, [doctorId, supabase]);

  // Mark a single message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId);
      
      if (error) throw error;
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark message as read:", err);
    }
  }, [supabase]);

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", doctorId)
        .is("read_at", null);
      
      if (error) throw error;
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all messages as read:", err);
    }
  }, [doctorId, supabase]);

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!doctorId) return;

    // Initial load
    void refreshUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel(`doctor-messages-${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${doctorId}`,
        },
        () => {
          void refreshUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newRecord = payload.new as { read_at?: string | null; recipient_id?: string };
          if (newRecord.recipient_id === doctorId) {
            void refreshUnreadCount();
          }
        }
      )
      .subscribe();

    // Refresh on window focus (when user returns to tab)
    const handleFocus = () => {
      void refreshUnreadCount();
    };
    window.addEventListener("focus", handleFocus);

    // Periodic refresh every 5 seconds
    const interval = setInterval(() => {
      void refreshUnreadCount();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [doctorId, supabase, refreshUnreadCount]);

  return (
    <MessageContext.Provider
      value={{
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshUnreadCount,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}
