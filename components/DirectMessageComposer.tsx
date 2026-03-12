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

type DirectMessageComposerProps = {
  recipientId: string;
  recipientName: string;
  appointmentId?: string; // Optional - for appointment messages
  threadId?: string; // Optional - for thread-based messages
  onSent?: (message: {
    id: string;
    appointmentId: string | null;
    senderId: string;
    recipientId: string;
    body: string;
    createdAt: string;
    readAt: string | null;
    attachments: Array<{ fileName: string; publicUrl: string }>;
  }) => void;
  compact?: boolean;
};

export function DirectMessageComposer({
  recipientId,
  recipientName,
  appointmentId,
  threadId,
  onSent,
  compact = false,
}: DirectMessageComposerProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [bodyText, setBodyText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    
    // Use appropriate upload endpoint based on whether this is an appointment or direct message
    const uploadEndpoint = appointmentId ? "/api/messages/upload" : "/api/messages/upload-direct";
    if (appointmentId) {
      form.append("appointmentId", appointmentId);
    } else {
      form.append("recipientId", recipientId);
    }
    
    const res = await fetch(uploadEndpoint, {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as {
      error?: string;
      attachment?: Attachment;
    };
    if (!res.ok || !data.attachment) {
      throw new Error(data.error ?? "Upload failed.");
    }
    return data.attachment;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    if (!recipientId) {
      toast.push({
        kind: "info",
        title: "No recipient",
        message: "Cannot send message - no recipient selected.",
        ttlMs: 3500,
      });
      return;
    }

    setLoading(true);
    try {
      const form = new FormData(event.currentTarget);
      const body = String(form.get("body") || "").trim();
      if (!body) throw new Error("Type a message.");

      const file = form.get("file");
      let fileAttachment = attachment;
      if (file instanceof File && file.size > 0) {
        fileAttachment = await upload(file);
        setAttachment(fileAttachment);
      }

      // Use appropriate send endpoint based on whether this is a thread, appointment, or direct message
      let sendEndpoint: string;
      let requestBody: any;

      if (threadId) {
        sendEndpoint = "/api/messages/send-thread";
        requestBody = {
          threadId,
          body,
          attachment: fileAttachment ?? undefined,
        };
      } else if (appointmentId) {
        sendEndpoint = "/api/messages/send";
        requestBody = {
          appointmentId,
          body,
          attachment: fileAttachment ?? undefined,
        };
      } else {
        sendEndpoint = "/api/messages/send-direct-chat";
        requestBody = {
          recipientId,
          body,
          attachment: fileAttachment ?? undefined,
        };
      }

      const res = await fetch(sendEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = (await res.json()) as {
        error?: string;
        success?: boolean;
        messageId?: string;
        message?: {
          id: string;
          appointmentId: string | null;
          senderId: string;
          recipientId: string;
          body: string;
          createdAt: string;
          readAt: string | null;
          attachments: Array<{ fileName: string; publicUrl: string }>;
        };
      };

      if (!res.ok) throw new Error(data.error ?? "Unable to send message.");

      // Handle successful send - immediately show message in UI
      if (data.message) {
        onSent?.(data.message);
      } else if (data.success && data.messageId) {
        // Fallback: fetch message details if only ID returned
        const messageRes = await fetch(`/api/messages/${data.messageId}`);
        if (messageRes.ok) {
          const messageData = await messageRes.json() as { message?: any };
          if (messageData.message) {
            onSent?.(messageData.message);
          }
        }
      }

      toast.push({
        kind: "success",
        title: "Sent",
        message: `Message sent to ${recipientName}.`,
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
        title: "Couldn't send",
        message: err instanceof Error ? err.message : "Unable to send message.",
        ttlMs: 4200,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      {compact ? null : (
        <div className="text-sm text-slate-500">
          Sending message to {recipientName}.
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            id="body"
            name="body"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6]"
            placeholder={`Type a message to ${recipientName}...`}
          />
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#14b6a6] text-white hover:bg-[#0d9488] disabled:opacity-50"
            type="submit"
            disabled={loading}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
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
        />
        {selectedFileName ? (
          <div className="mt-2 text-xs text-slate-500 px-1">
            Attached:{" "}
            <span className="font-medium text-slate-700">
              {selectedFileName}
            </span>
          </div>
        ) : null}
      </div>
    </form>
  );
}
