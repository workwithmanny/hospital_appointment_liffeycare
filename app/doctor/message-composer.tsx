"use client";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Send } from "lucide-react";
import { useToast } from "@/components/ui/toast";
type Attachment = {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl?: string;
};
export function MessageComposer({
  appointmentId,
  onSent,
  compact = false,
}: {
  /** Appointment thread selected in the chat sidebar (empty disables send). */
  appointmentId: string;
  /** Minimal chrome for embedded chat. */ compact?: boolean;
  onSent?: (message: {
    id: string;
    appointmentId: string;
    senderId?: string;
    recipientId?: string;
    body: string;
    createdAt: string;
    readAt: string | null;
    attachments: Array<{ fileName: string; publicUrl: string }>;
  }) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [bodyText, setBodyText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const targetId = appointmentId.trim();

  async function upload(file: File, apptId: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("appointmentId", apptId);
    const res = await fetch("/api/messages/upload", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as {
      error?: string;
      attachment?: Attachment;
    };
    if (!res.ok || !data.attachment)
      throw new Error(data.error ?? "Upload failed.");
    return data.attachment;
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetId) {
      toast.push({
        kind: "info",
        title: "Select a visit",
        message: "Choose an appointment from the list to start messaging.",
        ttlMs: 3500,
      });
      return;
    }
    setLoading(true);
    try {
      const form = new FormData(event.currentTarget);
      const body = String(form.get("body") || "").trim();
      const file = form.get("file");
      if (!body && !(file instanceof File && file.size > 0) && !attachment) {
        toast.push({
          kind: "error",
          title: "Empty message",
          message: "Please type a message or attach a file.",
          ttlMs: 3000,
        });
        setLoading(false);
        return;
      }
      let fileAttachment = attachment;
      if (file instanceof File && file.size > 0) {
        fileAttachment = await upload(file, targetId);
        setAttachment(fileAttachment);
      }
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: targetId,
          body,
          attachment: fileAttachment ?? undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: {
          id: string;
          appointmentId: string;
          senderId: string;
          recipientId: string;
          body: string;
          createdAt: string;
          readAt: string | null;
          attachments: Array<{ fileName: string; publicUrl: string }>;
        };
      };
      if (!res.ok) throw new Error(data.error ?? "Unable to send message.");
      if (data.message) {
        onSent?.(data.message);
      }
      toast.push({
        kind: "success",
        title: "Sent",
        message: "Message sent.",
        ttlMs: 2200,
      });
      setAttachment(null);
      setSelectedFileName("");
      setBodyText("");
      if (!onSent) {
        router.refresh();
      }
    } catch (err) {
      toast.push({
        kind: "error",
        title: "Couldn’t send",
        message: err instanceof Error ? err.message : "Unable to send message.",
        ttlMs: 4200,
      });
    } finally {
      setLoading(false);
    }
  }
  if (!targetId) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 ${compact ? "py-4" : ""}`}
      >
        Select a visit from the list to send a message.
      </div>
    );
  }
  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      {compact ? null : (
        <div className="text-sm text-slate-500">
          Sending in the selected conversation.
        </div>
      )}{" "}
      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Attach file"
          >
            {" "}
            <Paperclip className="h-5 w-5" />{" "}
          </button>{" "}
          <input
            id="body"
            name="body"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />{" "}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            type="submit"
            disabled={loading}
            title="Send message"
          >
            {" "}
            <Send className="h-4 w-4" />{" "}
          </button>{" "}
        </div>{" "}
        <input
          ref={fileInputRef}
          id="file"
          name="file"
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setSelectedFileName(file?.name ?? "");
          }}
        />{" "}
        {selectedFileName ? (
          <div className="mt-2 text-xs text-slate-500 px-1">
            {" "}
            Attached:{" "}
            <span className="font-medium text-slate-700">
              {selectedFileName}
            </span>{" "}
          </div>
        ) : null}{" "}
      </div>{" "}
    </form>
  );
}
