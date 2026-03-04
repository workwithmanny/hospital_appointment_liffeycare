"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
type PatientMessage = {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  senderName: string;
  attachments: Array<{ fileName: string; publicUrl: string }>;
};
type PatientMessagesListProps = { messages: PatientMessage[] };
export function PatientMessagesList({ messages }: PatientMessagesListProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  useEffect(() => {
    const channel = supabase
      .channel("patient-messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, supabase]);
  async function markRead(messageId: string) {
    setLoadingId(messageId);
    await fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    setLoadingId(null);
    router.refresh();
  }
  if (messages.length === 0) {
    return <p className="text-sm text-slate-500">No messages yet.</p>;
  }
  return (
    <div className="space-y-3">
      {" "}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-2xl border p-4 ${message.senderName.toLowerCase().includes("doctor") ? "border-slate-200 bg-white" : "border-slate-900 bg-slate-900 text-white"}`}
        >
          {" "}
          <div className="flex items-start justify-between gap-3">
            {" "}
            <div>
              {" "}
              <p
                className={`text-sm font-medium ${message.senderName.toLowerCase().includes("doctor") ? "text-slate-800" : "text-white"}`}
              >
                {" "}
                {message.senderName}{" "}
              </p>{" "}
              <p
                className={`mt-1 text-xs ${message.senderName.toLowerCase().includes("doctor") ? "text-slate-500" : "text-slate-300"}`}
              >
                {" "}
                {new Date(message.createdAt).toLocaleString()}{" "}
              </p>{" "}
            </div>{" "}
            {message.readAt ? (
              <span className="pill">Read</span>
            ) : (
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700"
                onClick={() => markRead(message.id)}
                disabled={loadingId === message.id}
              >
                {" "}
                {loadingId === message.id ? "..." : "Mark read"}{" "}
              </button>
            )}{" "}
          </div>{" "}
          <p
            className={`mt-3 text-sm ${message.senderName.toLowerCase().includes("doctor") ? "text-slate-700" : "text-slate-100"}`}
          >
            {" "}
            {message.body}{" "}
          </p>{" "}
          {message.attachments.length > 0 ? (
            <div className="mt-2 space-y-1">
              {" "}
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.publicUrl}
                  href={attachment.publicUrl}
                  target="_blank"
                  className={`text-sm underline ${message.senderName.toLowerCase().includes("doctor") ? "text-slate-900" : "text-slate-200"}`}
                >
                  {" "}
                  {attachment.fileName}{" "}
                </a>
              ))}{" "}
            </div>
          ) : null}{" "}
        </div>
      ))}{" "}
    </div>
  );
}
