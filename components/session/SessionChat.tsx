"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

type ChatMessage = {
  id: string;
  sender: string;
  senderRole: "doctor" | "patient" | "system";
  message: string;
  timestamp: Date;
  type: "user" | "system";
  attachments?: Array<{ fileName: string; publicUrl: string }>;
};

type SessionChatProps = {
  appointmentId: string;
  currentUserId: string;
  currentUserRole: "doctor" | "patient";
  otherPartyName: string;
  otherPartyId: string;
  onNewMessage?: () => void;
};

export function SessionChat({
  appointmentId,
  currentUserId,
  currentUserRole,
  otherPartyName,
  otherPartyId,
  onNewMessage,
}: SessionChatProps) {
  const supabase = getSupabaseClient();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select(`
          id, 
          body, 
          sender_id, 
          recipient_id,
          created_at, 
          sender:profiles!messages_sender_id_fkey(full_name, role),
          attachments: message_attachments(id, file_name, file_path)
        `)
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      if (msgs) {
        const formattedMessages: ChatMessage[] = msgs.map((m: any) => {
          const senderRole = m.sender?.role || "patient";
          const isCurrentUser = m.sender_id === currentUserId;
          
          return {
            id: m.id,
            sender: isCurrentUser 
              ? "You" 
              : (m.sender?.full_name || (senderRole === "doctor" ? "Doctor" : "Patient")),
            senderRole: senderRole,
            message: m.body,
            timestamp: new Date(m.created_at),
            type: "user" as const,
            attachments: m.attachments?.map((att: any) => ({
              fileName: att.file_name,
              publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-files/${att.file_path}`,
            })),
          };
        });
        setMessages(formattedMessages);
      }
      setLoading(false);
    };

    loadMessages();
  }, [appointmentId, currentUserId, supabase]);

  // Subscribe to new messages
  useEffect(() => {
    const processedMessageIds = new Set<string>();
    
    const channel = supabase
      .channel(`session-chat-${appointmentId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "messages",
          filter: `appointment_id=eq.${appointmentId}`
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            appointment_id: string;
            body: string;
            sender_id: string;
            recipient_id: string;
            created_at: string;
          };

          // Prevent processing the same message twice
          if (processedMessageIds.has(row.id)) return;
          processedMessageIds.add(row.id);

          // Check if already in messages
          const exists = messages.some((m) => m.id === row.id);
          if (exists) return;

          // Fetch sender info
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", row.sender_id)
            .single();

          const senderRole = sender?.role || "patient";
          const isCurrentUser = row.sender_id === currentUserId;
          
          const newMsg: ChatMessage = {
            id: row.id,
            sender: isCurrentUser 
              ? "You" 
              : (sender?.full_name || (senderRole === "doctor" ? "Doctor" : "Patient")),
            senderRole: senderRole as "doctor" | "patient" | "system",
            message: row.body,
            timestamp: new Date(row.created_at),
            type: "user",
          };

          setMessages((current) => [...current, newMsg]);
          
          // Notify parent component
          onNewMessage?.();

          // Show toast notification if message is from other party
          if (!isCurrentUser) {
            toast.push({
              kind: "info",
              title: `Message from ${sender?.full_name || otherPartyName}`,
              message: row.body.length > 50 ? row.body.substring(0, 50) + "..." : row.body,
              ttlMs: 4000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [appointmentId, currentUserId, currentUserRole, otherPartyName, onNewMessage, supabase, toast, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          appointmentId, 
          body: text,
          recipientId: otherPartyId,
        }),
      });

      const data = await res.json() as { error?: string };
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setNewMessage("");
    } catch (err) {
      toast.push({
        kind: "error",
        title: "Message failed",
        message: err instanceof Error ? err.message : "Unable to send message",
        ttlMs: 4000,
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("appointmentId", appointmentId);
      form.append("recipientId", otherPartyId);

      const uploadRes = await fetch("/api/messages/upload", {
        method: "POST",
        body: form,
      });

      const uploadData = await uploadRes.json() as { 
        error?: string; 
        attachment?: { fileName: string; filePath: string } 
      };

      if (!uploadRes.ok || !uploadData.attachment) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Send message with attachment
      const sendRes = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          body: `📎 ${uploadData.attachment.fileName}`,
          recipientId: otherPartyId,
          attachment: uploadData.attachment,
        }),
      });

      if (!sendRes.ok) {
        const errorData = await sendRes.json() as { error?: string };
        throw new Error(errorData.error || "Failed to send file");
      }

      toast.push({
        kind: "success",
        title: "File sent",
        message: `${uploadData.attachment.fileName} sent successfully`,
        ttlMs: 2000,
      });
    } catch (err) {
      toast.push({
        kind: "error",
        title: "Upload failed",
        message: err instanceof Error ? err.message : "Failed to upload file",
        ttlMs: 4000,
      });
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%]">
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    msg.sender === "You"
                      ? "bg-[#14b6a6] text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}
                >
                  {msg.sender !== "You" && (
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {msg.sender}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs underline ${
                            msg.sender === "You" ? "text-white/80" : "text-[#14b6a6]"
                          }`}
                        >
                          📎 {att.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-1 ${msg.sender === "You" ? "text-right" : ""} text-gray-400`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Message ${otherPartyName}...`}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-[#14b6a6] text-white rounded-lg hover:bg-[#0d9488] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
