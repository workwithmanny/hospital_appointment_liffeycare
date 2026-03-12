"use client";
import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type ChatInitiationButtonProps = {
  recipientId: string;
  recipientName: string;
  recipientType: "doctor" | "patient";
  compact?: boolean;
  className?: string;
};

export function ChatInitiationButton({
  recipientId,
  recipientName,
  recipientType,
  compact = false,
  className = "",
}: ChatInitiationButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    setLoading(true);
    try {
      // Create or get existing thread
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start conversation");
      }

      const thread = data.thread;
      
      toast.push({
        kind: "success",
        title: "Conversation Started",
        message: `You can now message ${recipientName}.`,
        ttlMs: 3000,
      });

      // Navigate to chat
      if (recipientType === "doctor") {
        router.push("/patient/chat");
      } else {
        router.push("/doctor/chat");
      }
      
      // Refresh to ensure the new thread appears
      router.refresh();
    } catch (err) {
      toast.push({
        kind: "error",
        title: "Couldn't Start Chat",
        message: err instanceof Error ? err.message : "Failed to start conversation.",
        ttlMs: 4200,
      });
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleStartChat}
        disabled={loading}
        className={`inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50 ${className}`}
        title={`Message ${recipientName}`}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <MessageSquare className="h-3 w-3" />
        )}
        Message
      </button>
    );
  }

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className={`flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <MessageSquare className="h-4 w-4" />
          Start Conversation
        </>
      )}
    </button>
  );
}
