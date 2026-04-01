"use client";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Send, X, FileText, Image as ImageIcon } from "lucide-react";
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
  userRole?: "patient" | "doctor";
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
  userRole = "patient",
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    
    // Use appropriate upload endpoint based on whether this is an appointment or direct message
    let uploadEndpoint: string;
    if (appointmentId) {
      uploadEndpoint = "/api/messages/upload";
      form.append("appointmentId", appointmentId);
    } else {
      // For direct messages, use different endpoint based on user role
      if (userRole === "doctor") {
        uploadEndpoint = "/api/messages/upload-direct-doctor";
        form.append("patientId", recipientId);
      } else {
        uploadEndpoint = "/api/messages/upload-direct";
        form.append("doctorId", recipientId);
      }
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

  function clearAttachment() {
    setAttachment(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
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
      const file = form.get("file");
      
      if (!body && !(file instanceof File && file.size > 0) && !attachment) {
        throw new Error("Please type a message or attach a file.");
      }

      const fileAttachment = attachment;
      
      let sendEndpoint: string;
      let requestBody: any;

      if (file instanceof File && file.size > 0) {
        const uploaded = await upload(file);
        setAttachment(uploaded);
        // Update fileAttachment for this send
        var uploadedAttachment = uploaded;
      }

      if (threadId) {
        sendEndpoint = "/api/messages/send-thread";
        requestBody = {
          threadId,
          body,
          attachment: uploadedAttachment ?? fileAttachment ?? undefined,
        };
      } else if (appointmentId) {
        sendEndpoint = "/api/messages/send";
        requestBody = {
          appointmentId,
          body,
          attachment: uploadedAttachment ?? fileAttachment ?? undefined,
        };
      } else {
        sendEndpoint = "/api/messages/send-direct-chat";
        requestBody = {
          recipientId,
          body,
          attachment: uploadedAttachment ?? fileAttachment ?? undefined,
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

      // Clear all state including file input
      setAttachment(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setBodyText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

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
          onChange={handleFileSelect}
        />
        {(selectedFile || previewUrl) && (
          <div className="mt-2 px-1">
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={clearAttachment}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    title="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-10 w-10 bg-slate-200 rounded-lg flex items-center justify-center">
                    {selectedFile?.type.startsWith("image/") ? (
                      <ImageIcon className="h-5 w-5 text-slate-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile?.size ?? 0) > 1024 * 1024
                        ? `${((selectedFile?.size ?? 0) / (1024 * 1024)).toFixed(1)} MB`
                        : `${((selectedFile?.size ?? 0) / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAttachment}
                    className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove attachment"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
