"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
type DoctorMessage = {
  id: string;
  body: string;
  createdAt: string;
  recipientName: string;
  readAt: string | null;
  senderName: string;
  attachments: Array<{ fileName: string; publicUrl: string }>;
};
type DoctorMessagesListProps = { messages: DoctorMessage[] };
export function DoctorMessagesList({ messages }: DoctorMessagesListProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  useEffect(() => {
    const channel = supabase
      .channel("doctor-messages-realtime")
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
  if (messages.length === 0) {
    return <p className="text-sm text-slate-500">No sent messages yet.</p>;
  }
  return (
    <div className="space-y-3">
      {" "}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-2xl border p-4 ${message.senderName === "You" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}
        >
          {" "}
          <div className="flex items-start justify-between gap-3">
            {" "}
            <div>
              {" "}
              <p
                className={`text-sm font-medium ${message.senderName === "You" ? "text-white" : "text-slate-800"}`}
              >
                {" "}
                {message.senderName === "You"
                  ? `To: ${message.recipientName}`
                  : `From: ${message.senderName}`}{" "}
              </p>{" "}
              <p
                className={`mt-1 text-xs ${message.senderName === "You" ? "text-slate-300" : "text-slate-500"}`}
              >
                {" "}
                {new Date(message.createdAt).toLocaleString()}{" "}
              </p>{" "}
            </div>{" "}
            <span className="pill">
              {message.readAt ? "Read" : "Unread"}
            </span>{" "}
          </div>{" "}
          <p
            className={`mt-3 text-sm ${message.senderName === "You" ? "text-slate-100" : "text-slate-700"}`}
          >
            {message.body}
          </p>{" "}
          {message.attachments.length > 0 ? (
            <div className="mt-2 space-y-1">
              {" "}
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.publicUrl}
                  href={attachment.publicUrl}
                  target="_blank"
                  className={`text-sm underline ${message.senderName === "You" ? "text-slate-200" : "text-slate-900"}`}
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
