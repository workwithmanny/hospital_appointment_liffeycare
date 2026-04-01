"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  User,
  FileText,
  ExternalLink,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { DirectMessageComposer } from "@/components/DirectMessageComposer";
import { getSupabaseClient } from "@/lib/supabase/client";
import { appointmentChatTitle } from "@/lib/chat/appointment-chat-label";
import {
  ChatFileGalleryModal,
  type GalleryItem,
} from "@/components/chat/ChatFileGalleryModal";
import { useToast } from "@/components/ui/toast";
import { EnableNotificationsButton } from "@/components/notifications/EnableNotificationsButton";
import { useSearchParams } from "next/navigation";

export type ConversationThread = {
  id: string;
  patient_id: string;
  doctor_id: string;
  created_at: string;
  updated_at: string;
  patient: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    age?: number | null;
    allergies?: string[] | null;
    is_online: boolean;
    last_seen_at: string | null;
  };
  messages: ChatMessage[];
  unreadCount: number;
  latestMessage: ChatMessage | null;
};

type ChatMessage = {
  id: string;
  thread_id: string | null;
  appointment_context_id: string | null;
  senderId: string;
  recipientId: string;
  senderName: string;
  recipientName: string;
  senderAvatarUrl?: string | null;
  recipientAvatarUrl?: string | null;
  body: string;
  createdAt: string;
  readAt: string | null;
  attachments: Array<{ fileName: string; publicUrl: string }>;
  appointmentContext?: {
    id: string;
    slot_time: string;
    status: string;
    session_notes?: string;
  } | null;
};

// Helper to check if file is an image
function isImageFile(fileName: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

// Helper to construct public URL from file path
function getPublicUrl(filePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-files/${filePath}`;
}

type ConsolidatedDoctorChatClientProps = {
  doctorId: string;
};

function formatTime(iso: string) {
  if (!iso) return "No time";
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      // Try parsing different formats
      const parsed = new Date(iso.replace('T', ' ').replace(/\.\d+Z/, ''));
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return "Invalid date";
    }
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
}

function formatDate(iso: string) {
  if (!iso) return "No date";
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      // Try parsing different formats
      const parsed = new Date(iso.replace('T', ' ').replace(/\.\d+Z/, ''));
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
      }
      return "Invalid date";
    }
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

function formatPresenceLine(
  isOnline: boolean,
  lastSeenAt: string | null,
): string {
  if (isOnline) return "Online";
  if (!lastSeenAt) return "Offline";
  const d = new Date(lastSeenAt);
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 90_000) return "Last seen just now";
  if (diffMs < 3_600_000)
    return `Last seen ${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000)
    return `Last seen ${Math.floor(diffMs / 3_600_000)}h ago`;
  return `Last seen ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

async function fetchThreadMessages(threadId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/threads/${threadId}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { thread: { messages: ChatMessage[] } };
  return data.thread?.messages ?? [];
}

export function ConsolidatedDoctorChatClient({
  doctorId,
}: ConsolidatedDoctorChatClientProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const toast = useToast();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<ChatMessage[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [peerPresence, setPeerPresence] = useState<{
    isOnline: boolean;
    lastSeenAt: string | null;
  }>({ isOnline: false, lastSeenAt: null });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const markedReadAttemptRef = useRef<Set<string>>(new Set());
  const patientParam = searchParams.get("patient");
  const hasAutoSelected = useRef(false);

  // Load threads
  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/threads?limit=100");
      const json = (await res.json()) as {
        threads?: ConversationThread[];
        error?: string;
      };
      const loadedThreads = json.threads ?? [];
      setThreads(loadedThreads);
      
      // Auto-select thread for patient from query param
      if (patientParam && !hasAutoSelected.current && loadedThreads.length > 0) {
        const patientThread = loadedThreads.find(t => t.patient_id === patientParam);
        if (patientThread) {
          setSelectedThreadId(patientThread.id);
          hasAutoSelected.current = true;
        } else if (!selectedThreadId) {
          // If no thread exists for this patient yet, select first thread
          setSelectedThreadId(loadedThreads[0].id);
        }
      } else if (!selectedThreadId && loadedThreads.length > 0) {
        // Auto-select first thread if none selected
        setSelectedThreadId(loadedThreads[0].id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctorId, patientParam]);

  // Load messages for selected thread
  useEffect(() => {
    if (!selectedThreadId) return;
    let cancelled = false;
    (async () => {
      const messages = await fetchThreadMessages(selectedThreadId);
      if (cancelled) return;
      setSelectedMessages(messages);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedThreadId]);

  // Real-time updates
  useEffect(() => {
    if (!doctorId) return;
    const channel = supabase
      .channel(`doctor-threads-${doctorId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            thread_id: string | null;
            sender_id: string;
            recipient_id: string;
            body: string;
            created_at: string;
            read_at: string | null;
          };

          if (!msg.thread_id) return;
          
          // Only process if this user is involved
          if (msg.sender_id !== doctorId && msg.recipient_id !== doctorId) return;

          // Show toast notification for messages from others (do this first)
          if (msg.sender_id !== doctorId) {
            const thread = threads.find(t => t.id === msg.thread_id);
            toast.push({
              kind: "info",
              title: thread ? `New message from ${thread.patient.full_name}` : "New message",
              message: msg.body.length > 120 ? `${msg.body.slice(0, 120)}…` : msg.body,
              ttlMs: 5200,
            });
          }

          // If message is for current thread, add it immediately
          if (msg.thread_id === selectedThreadId) {
            // Don't add duplicate - check by id or by content+timestamp match
            setSelectedMessages((prev) => {
              // Check if message with same ID already exists
              if (prev.some(m => m.id === msg.id)) return prev;
              
              // Also check if message with same content and timestamp exists (within 2 seconds)
              const isDuplicateByContent = prev.some(m => 
                m.body === msg.body && 
                m.senderId === msg.sender_id && 
                Math.abs(new Date(m.createdAt).getTime() - new Date(msg.created_at).getTime()) < 2000
              );
              if (isDuplicateByContent) return prev;
              
              const newMessage: ChatMessage = {
                id: msg.id,
                thread_id: msg.thread_id,
                appointment_context_id: null,
                senderId: msg.sender_id,
                recipientId: msg.recipient_id,
                senderName: msg.sender_id === doctorId ? "You" : "Patient",
                recipientName: msg.recipient_id === doctorId ? "You" : "Patient",
                senderAvatarUrl: null,
                recipientAvatarUrl: null,
                body: msg.body,
                createdAt: msg.created_at,
                readAt: msg.read_at,
                attachments: [],
                appointmentContext: null,
              };
              return [...prev, newMessage];
            });
          }

          // Refresh threads list in background
          fetch("/api/threads?limit=100").then(async (res) => {
            const json = await res.json();
            if (res.ok && json.threads) {
              setThreads(json.threads);
            }
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [doctorId, selectedThreadId, supabase, threads, toast]);

  const selectedThread = useMemo(() => {
    return threads.find((thread) => thread.id === selectedThreadId) ?? threads[0];
  }, [threads, selectedThreadId]);

  const peerPatientId = selectedThread?.patient_id ?? "";

  // Presence updates
  useEffect(() => {
    if (!peerPatientId) return;
    const refreshPresence = async () => {
      try {
        const res = await fetch(
          `/api/presence?userId=${encodeURIComponent(peerPatientId)}`,
        );
        const data = (await res.json()) as {
          presence?: { is_online?: boolean; last_seen_at?: string | null };
        };
        if (!res.ok) return;
        setPeerPresence({
          isOnline: Boolean(data.presence?.is_online),
          lastSeenAt: data.presence?.last_seen_at ?? null,
        });
      } catch {
        /* ignore */
      }
    };

    refreshPresence();
    const interval = window.setInterval(refreshPresence, 55_000);
    const ch = supabase
      .channel(`presence-peer-doctor-${peerPatientId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${peerPatientId}`,
        },
        (payload) => {
          const row = payload.new as {
            is_online?: boolean;
            last_seen_at?: string | null;
          };
          setPeerPresence({
            isOnline: Boolean(row.is_online),
            lastSeenAt: row.last_seen_at ?? null,
          });
        },
      )
      .subscribe();
    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(ch);
    };
  }, [peerPatientId, supabase]);

  // Auto-scroll and mark as read
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);

  useEffect(() => {
    if (!selectedThreadId || !doctorId) return;
    const pending = selectedMessages.filter(
      (m) =>
        m.recipientId === doctorId &&
        !m.readAt &&
        !markedReadAttemptRef.current.has(m.id),
    );
    for (const m of pending) {
      markedReadAttemptRef.current.add(m.id);
      void fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: m.id }),
      })
        .then(async (res) => {
          if (!res.ok) markedReadAttemptRef.current.delete(m.id);
          else {
            const ts = new Date().toISOString();
            setSelectedMessages((prev) =>
              prev.map((x) => (x.id === m.id ? { ...x, readAt: ts } : x)),
            );
            // Broadcast to sidebar to refresh unread count
            void supabase.channel('messages-broadcast').send({
              type: "broadcast",
              event: "messages-read",
              payload: { doctorId },
            });
          }
        })
        .catch(() => markedReadAttemptRef.current.delete(m.id));
    }
  }, [selectedThreadId, doctorId, selectedMessages, supabase]);

  const galleryItems: GalleryItem[] = useMemo(() => {
    const items: GalleryItem[] = [];
    for (const m of selectedMessages) {
      const senderLabel =
        m.senderId === doctorId
          ? "You"
          : selectedThread?.patient.full_name ?? "Patient";
      for (const a of m.attachments) {
        items.push({
          fileName: a.fileName,
          publicUrl: a.publicUrl,
          sentAt: formatTime(m.createdAt),
          senderLabel,
        });
      }
    }
    return items;
  }, [selectedMessages, doctorId, selectedThread?.patient.full_name]);

  const patientName = selectedThread?.patient.full_name ?? "Select a conversation";
  const patientAvatarUrl = selectedThread?.patient.avatar_url ?? null;
  const presenceLine = formatPresenceLine(
    peerPresence.isOnline,
    peerPresence.lastSeenAt,
  );

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((thread) => {
      if (!q) return true;
      return (
        thread.patient.full_name.toLowerCase().includes(q) ||
        thread.latestMessage?.body.toLowerCase().includes(q) ||
        thread.messages.some(m => m.body.toLowerCase().includes(q))
      );
    }).sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [threads, search]);

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen min-h-0 w-full flex-col bg-base md:grid md:grid-cols-[320px_minmax(0,1fr)]">
      {/* Desktop Sidebar - Conversation List */}
      <aside className="hidden border-r border-border bg-white md:flex md:flex-col">
        <div className="border-b border-border p-4">
          <h2 className="flex items-center gap-2 text-lg font-display font-semibold text-text-primary">
            <MessageSquare className="h-5 w-5 text-[#14b6a6]" />
            Conversations
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            {threads.length} patient{threads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-4 w-4 shrink-0 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patients..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-text-tertiary"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map((thread) => {
            const last = thread.latestMessage;
            const isSelected = thread.id === selectedThreadId;
            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full border-l-4 px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-l-[#14b6a6] bg-[#14b6a6]/5"
                    : "border-l-transparent hover:bg-subtle"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {thread.patient.full_name}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {thread.patient.age ? `Age ${thread.patient.age}` : "Patient"}
                    </p>
                    <p className="truncate text-xs text-text-tertiary">
                      {last ? formatTime(last.createdAt) : "No messages"}
                    </p>
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#14b6a6] px-2 text-xs font-semibold text-white">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-text-secondary">
                  {last?.body ?? "Start a conversation"}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Chat Area - Fixed layout with scrollable messages */}
      <section className="flex h-full min-h-0 flex-col bg-white">
        {/* Mobile Conversation Selector - Fixed */}
        <div className="md:hidden flex-shrink-0 border-b border-border bg-white p-3">
          <select
            value={selectedThreadId}
            onChange={(e) => setSelectedThreadId(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
          >
            {filteredThreads.map((thread) => (
              <option key={thread.id} value={thread.id}>
                {thread.patient.full_name} {thread.unreadCount > 0 && `(${thread.unreadCount} new)`}
              </option>
            ))}
          </select>
        </div>

        {/* Chat Header - Fixed */}
        <div className="flex-shrink-0 border-b border-border bg-white px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488] text-white font-semibold">
                {patientAvatarUrl ? (
                  <img
                    src={patientAvatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  patientName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {patientName}
                  </p>
                  {selectedThread && (
                    <Link
                      href={`/doctor/patients/${selectedThread.patient.id}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#14b6a6]/10 px-2 py-0.5 text-xs font-medium text-[#14b6a6] hover:bg-[#14b6a6]/20 transition-colors"
                    >
                      Profile <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <p
                  className={`text-xs ${
                    peerPresence.isOnline ? "text-emerald-600 font-medium" : "text-text-tertiary"
                  }`}
                >
                  {presenceLine}
                </p>
                {selectedThread && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {selectedThread.patient.age && (
                      <span className="rounded-lg border border-border px-2 py-1 text-text-secondary">
                        Age {selectedThread.patient.age}
                      </span>
                    )}
                    {selectedThread.patient.allergies && selectedThread.patient.allergies.length > 0 && (
                      <span className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-red-700">
                        Allergies: {selectedThread.patient.allergies.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <EnableNotificationsButton />
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="rounded-xl border border-border p-2 transition hover:bg-subtle"
                title="All files in this chat"
              >
                <FileText className="h-4 w-4 text-text-secondary" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages - Scrollable only this section */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-subtle/30 px-4 sm:px-6 py-4">
          {selectedMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-secondary">
              No messages yet. Start a conversation with {patientName}.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedMessages.map((message, index) => {
                const isFromDoctor = message.senderId === doctorId;
                const prevDate =
                  index > 0 ? selectedMessages[index - 1].createdAt : "";
                const showDate =
                  new Date(message.createdAt).toDateString() !==
                  new Date(prevDate).toDateString();
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="my-4 flex items-center justify-center">
                        <span className="rounded-full bg-white border border-border px-3 py-1 text-xs font-medium text-text-secondary">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${isFromDoctor ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[60%] rounded-2xl px-4 py-2.5 ${
                          isFromDoctor
                            ? "bg-[#14b6a6] text-white"
                            : "bg-white border border-border text-text-primary"
                        }`}
                      >
                        <p className="text-sm">{message.body}</p>
                        {message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div
                                key={attachment.publicUrl}
                                className="rounded-xl border border-border/50 bg-white/50 p-2"
                              >
                                {isImageFile(attachment.fileName) ? (
                                  <div className="space-y-2">
                                    <img
                                      src={attachment.publicUrl}
                                      alt={attachment.fileName}
                                      className="max-w-full h-auto rounded-lg border border-border"
                                      loading="lazy"
                                    />
                                    <div className="flex items-center justify-between">
                                      <span className="truncate text-xs text-text-secondary font-medium">
                                        {attachment.fileName}
                                      </span>
                                      <div className="flex gap-1">
                                        <a
                                          href={attachment.publicUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 rounded-lg bg-[#14b6a6] px-2 py-1 text-xs text-white hover:bg-[#0d9488] transition-colors"
                                        >
                                          <FileText className="h-3 w-3" />
                                          Open
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-text-secondary" />
                                      <span className="truncate text-xs text-text-secondary font-medium">
                                        {attachment.fileName}
                                      </span>
                                    </div>
                                    <div className="mt-1">
                                      <a
                                        href={attachment.publicUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-lg bg-[#14b6a6] px-2 py-1 text-xs text-white hover:bg-[#0d9488] transition-colors"
                                      >
                                        <FileText className="h-3 w-3" />
                                        Open File
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div
                          className={`mt-1 text-right text-[11px] ${
                            isFromDoctor ? "text-white/70" : "text-text-tertiary"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} aria-hidden />
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-border bg-white p-3 md:p-4">
          {selectedThread && (
            <DirectMessageComposer
              compact
              userRole="doctor"
              recipientId={selectedThread.patient_id}
              recipientName={selectedThread.patient.full_name}
              onSent={(sent) => {
                if (sent) {
                  const newMessage = {
                    id: sent.id,
                    thread_id: selectedThread.id,
                    appointment_context_id: null,
                    senderId: sent.senderId,
                    recipientId: sent.recipientId,
                    senderName: "You",
                    recipientName: selectedThread.patient.full_name,
                    senderAvatarUrl: null,
                    recipientAvatarUrl: null,
                    body: sent.body,
                    createdAt: sent.createdAt,
                    readAt: sent.readAt,
                    attachments: sent.attachments,
                    appointmentContext: null,
                  };
                  setSelectedMessages((prev) => [...prev, newMessage as ChatMessage]);
                }
                fetch("/api/threads?limit=100").then(async (response) => {
                  const json = await response.json();
                  if (response.ok && json.threads) {
                    setThreads(json.threads);
                  }
                });
              }}
              threadId={selectedThread.id}
            />
          )}
        </div>
      </section>

      <ChatFileGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        items={galleryItems}
        title={`Files — ${patientName}`}
      />
    </div>
  );
}
