"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  User,
  FileText,
  ExternalLink,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { DirectMessageComposer } from "@/components/DirectMessageComposer";
import { getSupabaseClient } from "@/lib/supabase/client";
import { appointmentChatTitle } from "@/lib/chat/appointment-chat-label";
import { specialtyLabel } from "@/lib/constants/specialties";
import {
  ChatFileGalleryModal,
  type GalleryItem,
} from "@/components/chat/ChatFileGalleryModal";
import { useToast } from "@/components/ui/toast";
export type PatientChatAppointment = {
  id: string;
  slot_time: string;
  status?: string | null;
  sessionNotes?: string | null;
  doctorId: string;
  doctorName: string;
  doctorAvatarUrl?: string | null;
  doctorSpecialty?: string | null;
  doctorHospital?: string | null;
  doctorAge?: number | null;
  doctorPhone?: string | null;
  doctorEmail?: string | null;
};
type ChatMessage = {
  id: string;
  appointmentId: string | null;
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
};
type PatientChatClientProps = {
  patientId: string;
  appointments: PatientChatAppointment[];
  messages: ChatMessage[];
};
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
async function fetchOneMessageFromApi(
  messageId: string,
): Promise<ChatMessage | null> {
  const res = await fetch(`/api/messages/${messageId}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { message?: ChatMessage };
  return data.message ?? null;
}
export function PatientChatClient({
  patientId,
  appointments,
  messages,
}: PatientChatClientProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    appointments[0]?.id ?? "",
  );
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>(messages);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [peerPresence, setPeerPresence] = useState<{
    isOnline: boolean;
    lastSeenAt: string | null;
  }>({ isOnline: false, lastSeenAt: null });
  const seenMessageIdsRef = useRef<Set<string>>(
    new Set(messages.map((m) => m.id)),
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const markedReadAttemptRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    messages.forEach((m) => seenMessageIdsRef.current.add(m.id));
    setLiveMessages((prev) => {
      const byId = new Map<string, ChatMessage>();
      prev.forEach((m) => byId.set(m.id, m));
      messages.forEach((m) => byId.set(m.id, m));
      return Array.from(byId.values());
    });
  }, [messages]);
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/messages?limit=200");
      const json = (await res.json()) as {
        messages?: ChatMessage[];
        error?: string;
      };
      if (cancelled) return;
      if (!res.ok) {
        toast.push({
          kind: "error",
          title: "Messages",
          message: json.error ?? "Could not load messages.",
          ttlMs: 5000,
        });
        return;
      }
      const list = json.messages ?? [];
      list.forEach((m) => seenMessageIdsRef.current.add(m.id));
      setLiveMessages((prev) => {
        const byId = new Map<string, ChatMessage>();
        prev.forEach((m) => byId.set(m.id, m));
        list.forEach((m) => byId.set(m.id, m));
        return Array.from(byId.values());
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, toast]);
  const refreshPresence = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(
        `/api/presence?userId=${encodeURIComponent(userId)}`,
      );
      const data = (await res.json()) as {
        presence?: { is_online?: boolean; last_seen_at?: string | null };
        error?: string;
      };
      if (!res.ok) return;
      setPeerPresence({
        isOnline: Boolean(data.presence?.is_online),
        lastSeenAt: data.presence?.last_seen_at ?? null,
      });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    const beat = () => {
      void fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          online: document.visibilityState === "visible",
        }),
      });
    };
    beat();
    const interval = window.setInterval(beat, 45_000);
    const onVis = () => beat();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
      void fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: false }),
      });
    };
  }, []);
  useEffect(() => {
    const channel = supabase
      .channel(`patient-chat-${patientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            appointment_id: string | null;
            sender_id: string;
            recipient_id: string;
            body: string;
            created_at: string;
            read_at: string | null;
            message_type?: string | null;
          };
          if (msg.appointment_id && msg.message_type === "appointment") return; // Only handle appointment messages in real-time
          if (msg.sender_id !== patientId && msg.recipient_id !== patientId)
            return;
          const fromOther = msg.sender_id !== patientId;
          if (!seenMessageIdsRef.current.has(msg.id)) {
            seenMessageIdsRef.current.add(msg.id);
            if (fromOther) {
              const apt = appointments.find((a) => a.id === msg.appointment_id);
              toast.push({
                kind: "info",
                title: apt
                  ? `New message · ${appointmentChatTitle(apt.slot_time)}`
                  : "New message",
                message:
                  msg.body.length > 120
                    ? `${msg.body.slice(0, 120)}…`
                    : msg.body,
                ttlMs: 5200,
              });
            }
          }
          const enriched = await fetchOneMessageFromApi(msg.id);
          const row = enriched ?? {
            id: msg.id,
            appointmentId: msg.appointment_id,
            senderId: msg.sender_id,
            recipientId: msg.recipient_id,
            senderName: msg.sender_id === patientId ? "You" : "Doctor",
            recipientName: msg.recipient_id === patientId ? "You" : "Doctor",
            body: msg.body,
            createdAt: msg.created_at,
            readAt: msg.read_at,
            attachments: [],
          };
          setLiveMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) {
              return prev.map((m) => (m.id === row.id ? { ...m, ...row } : m));
            }
            return [...prev, row];
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [patientId, supabase, appointments, toast]);
  const conversationThreads = useMemo(() => {
    const byAppointment = new Map<string, ChatMessage[]>();
    const directMessages: ChatMessage[] = [];
    
    liveMessages.forEach((message) => {
      if (message.appointmentId) {
        // Handle appointment messages
        if (!byAppointment.has(message.appointmentId))
          byAppointment.set(message.appointmentId, []);
        byAppointment.get(message.appointmentId)!.push(message);
      } else {
        // Handle direct messages
        directMessages.push(message);
      }
    });
    
    const q = search.trim().toLowerCase();
    return [
      // Add direct messages thread if there are any
      ...(directMessages.length > 0 ? [{
        appointment: {
          id: "direct-chat",
          slot_time: new Date().toISOString(),
          status: "active",
          sessionNotes: "",
          doctorId: directMessages[0].senderId === patientId ? directMessages[0].recipientId : directMessages[0].senderId,
          doctorName: directMessages[0].senderId === patientId 
            ? directMessages[0].recipientName || "Doctor"
            : directMessages[0].senderName || "Doctor",
          doctorAvatarUrl: null,
          doctorSpecialty: null,
          doctorHospital: null,
          doctorAge: null,
          doctorPhone: null,
          doctorEmail: null,
        },
        chatTitle: "Direct Messages",
        latestMessage: directMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
        unread: directMessages.filter(msg => msg.recipientId === patientId && !msg.readAt).length,
        bodiesLower: directMessages.map(m => m.body).join(" ").toLowerCase(),
      }] : []),
      // Add appointment threads
      ...appointments
        .map((appointment) => {
          const chatTitle = appointmentChatTitle(appointment.slot_time);
          const spec = specialtyLabel(appointment.doctorSpecialty ?? null);
          const messagesForAppointment = byAppointment.get(appointment.id) ?? [];
          const sorted = [...messagesForAppointment].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          const latest = sorted[0];
          const unread = messagesForAppointment.filter(
            (msg) => msg.recipientId === patientId && !msg.readAt,
          ).length;
          const bodies = messagesForAppointment.map((m) => m.body).join(" ");
          return {
            appointment,
            chatTitle,
            latestMessage: latest,
            unread,
            bodiesLower: bodies.toLowerCase(),
          };
        })
    ].filter((thread) => {
      if (!q) return true;
      const { appointment, latestMessage, bodiesLower } = thread;
      const idShort = appointment.id.slice(0, 8).toLowerCase();
      const slotFmt = new Date(appointment.slot_time)
        .toLocaleString()
        .toLowerCase();
      return (
        appointment.doctorName.toLowerCase().includes(q) ||
        (thread.chatTitle || (appointment.id === "direct-chat" ? "Direct Messages" : appointmentChatTitle(appointment.slot_time))).toLowerCase().includes(q) ||
        appointment.id.toLowerCase().includes(q) ||
        idShort.includes(q) ||
        slotFmt.includes(q) ||
        (appointment.status ?? "").toLowerCase().includes(q) ||
        (latestMessage?.body.toLowerCase().includes(q) ?? false) ||
        bodiesLower.includes(q)
      );
    })
    .sort((a, b) => {
      const aTime = a.latestMessage
        ? new Date(a.latestMessage.createdAt).getTime()
        : 0;
      const bTime = b.latestMessage
        ? new Date(b.latestMessage.createdAt).getTime()
        : 0;
      return bTime - aTime;
    });
  }, [appointments, liveMessages, patientId, search]);
  const selectedThread = useMemo(() => {
    return (
      conversationThreads.find(
        (thread) => thread.appointment.id === selectedAppointmentId,
      ) ?? conversationThreads.find(
        (thread) => thread.appointment.id === "direct-chat" && selectedAppointmentId === "direct-chat",
      ) ?? conversationThreads[0]
    );
  }, [conversationThreads, selectedAppointmentId]);
  const peerDoctorId = selectedThread?.appointment.doctorId ?? "";
  useEffect(() => {
    if (!peerDoctorId) return;
    void refreshPresence(peerDoctorId);
    const interval = window.setInterval(
      () => void refreshPresence(peerDoctorId),
      55_000,
    );
    const ch = supabase
      .channel(`presence-peer-patient-${peerDoctorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${peerDoctorId}`,
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
  }, [peerDoctorId, refreshPresence, supabase]);
  const selectedMessages = useMemo(() => {
    if (!selectedThread) return [];
    const all = liveMessages.filter(
      (message) => {
        // Handle both direct messages (appointmentId = null) and appointment messages
        if (selectedThread.appointment.id === "direct-chat") {
          return message.appointmentId === null;
        } else {
          return message.appointmentId === selectedThread.appointment.id;
        }
      },
    );
    return [...all].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [liveMessages, selectedThread]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);
  useEffect(() => {
    if (!selectedAppointmentId || !patientId) return;
    const pending = liveMessages.filter(
      (m) => {
        // Handle both direct messages and appointment messages
        const isCorrectThread = selectedThread.appointment.id === "direct-chat" 
          ? m.appointmentId === null
          : m.appointmentId === selectedThread.appointment.id;
        return isCorrectThread &&
          m.recipientId === patientId &&
          !m.readAt &&
          !markedReadAttemptRef.current.has(m.id);
      },
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
            setLiveMessages((prev) =>
              prev.map((x) => (x.id === m.id ? { ...x, readAt: ts } : x)),
            );
          }
        })
        .catch(() => markedReadAttemptRef.current.delete(m.id));
    }
  }, [selectedAppointmentId, patientId, liveMessages]);
  const galleryItems: GalleryItem[] = useMemo(() => {
    const items: GalleryItem[] = [];
    for (const m of selectedMessages) {
      const senderLabel =
        m.senderId === patientId
          ? "You"
          : `Dr. ${selectedThread?.appointment.doctorName ?? "Doctor"}`;
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
  }, [selectedMessages, patientId, selectedThread?.appointment.doctorName]);
  const doctorName =
    selectedThread?.appointment.doctorName ?? "Select a conversation";
  const doctorAvatarUrl = selectedThread?.appointment.doctorAvatarUrl ?? null;
  const presenceLine = formatPresenceLine(
    peerPresence.isOnline,
    peerPresence.lastSeenAt,
  );
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-slate-50 md:grid md:grid-cols-[350px_minmax(0,1fr)]">
      {" "}
      <aside className="hidden border-r border-slate-200 bg-white md:flex md:flex-col">
        {" "}
        <div className="border-b border-slate-200 p-4">
          {" "}
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            {" "}
            <User className="h-5 w-5 text-blue-600" /> Messages{" "}
          </h2>{" "}
          <p className="mt-1 text-xs text-slate-500">
            Search by doctor, date, appointment, or message text
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-2 border-b border-slate-200 p-3">
          {" "}
          <Search className="h-4 w-4 shrink-0 text-slate-400" />{" "}
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search doctors, dates, messages..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />{" "}
        </div>{" "}
        <div className="flex-1 overflow-y-auto">
          {" "}
          {conversationThreads.map((thread) => {
            const last = thread.latestMessage;
            const isSelected =
              thread.appointment.id === selectedThread?.appointment.id;
            return (
              <button
                key={thread.appointment.id}
                onClick={() => setSelectedAppointmentId(thread.appointment.id)}
                className={`w-full border-l-4 px-4 py-3 text-left transition ${isSelected ? "border-l-blue-600 bg-blue-50" : "border-l-transparent hover:bg-slate-50"}`}
              >
                {" "}
                <div className="flex items-start justify-between gap-2">
                  {" "}
                  <div className="min-w-0 flex-1">
                    {" "}
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {thread.chatTitle || (thread.appointment.id === "direct-chat" ? "Direct Messages" : appointmentChatTitle(thread.appointment.slot_time))}
                    </p>{" "}
                    <p className="truncate text-xs text-slate-600">
                      Dr. {thread.appointment.doctorName}
                    </p>{" "}
                    <p className="truncate text-xs text-slate-400">
                      {last ? formatTime(last.createdAt) : "No messages"}
                    </p>{" "}
                  </div>{" "}
                  {thread.unread > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                      {" "}
                      {thread.unread}{" "}
                    </span>
                  )}{" "}
                </div>{" "}
                <p className="mt-1 truncate text-xs text-slate-500">
                  {last?.body ?? "Send your first message"}
                </p>{" "}
              </button>
            );
          })}{" "}
        </div>{" "}
      </aside>{" "}
      <section className="flex min-h-0 flex-1 flex-col">
        {" "}
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          {" "}
          <div className="flex items-start justify-between gap-3">
            {" "}
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {" "}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {" "}
                {doctorAvatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */ <img
                    src={doctorAvatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-emerald-500" />
                )}{" "}
              </div>{" "}
              <div className="min-w-0 flex-1">
                {" "}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {" "}
                  <p className="truncate text-sm font-semibold text-slate-900">
                    Dr. {doctorName}
                  </p>{" "}
                  {selectedThread && (
                    <>
                      {" "}
                      <Link
                        href={`/doctors/${selectedThread.appointment.doctorId}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-slate-200"
                      >
                        {" "}
                        Profile <ExternalLink className="h-3 w-3" />{" "}
                      </Link>{" "}
                      <Link
                        href={`/patient/appointments/${selectedThread.appointment.id}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-slate-200"
                      >
                        {" "}
                        Visit details <ClipboardList className="h-3 w-3" />{" "}
                      </Link>{" "}
                    </>
                  )}{" "}
                </div>{" "}
                <p
                  className={`text-xs ${peerPresence.isOnline ? "text-emerald-600" : "text-slate-500"}`}
                >
                  {" "}
                  {presenceLine}{" "}
                </p>{" "}
                {selectedThread && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    {" "}
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
                      {" "}
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />{" "}
                      {appointmentChatTitle(
                        selectedThread.appointment.slot_time,
                      )}{" "}
                    </span>{" "}
                    {selectedThread.appointment.status ? (
                      <span className="rounded-md border border-slate-200 px-2 py-1 capitalize">
                        {" "}
                        {selectedThread.appointment.status}{" "}
                      </span>
                    ) : null}{" "}
                    {specialtyLabel(
                      selectedThread.appointment.doctorSpecialty ?? null,
                    ) ? (
                      <span className="rounded-md border border-blue-100 bg-blue-50/80 px-2 py-1 text-blue-800">
                        {" "}
                        {specialtyLabel(
                          selectedThread.appointment.doctorSpecialty ?? null,
                        )}{" "}
                      </span>
                    ) : null}{" "}
                  </div>
                )}{" "}
                {selectedThread?.appointment.sessionNotes ? (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                    {" "}
                    Notes: {selectedThread.appointment.sessionNotes}{" "}
                  </p>
                ) : null}{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex shrink-0 items-center gap-2">
              {" "}
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-100"
                title="All files in this chat"
              >
                {" "}
                <FileText className="h-4 w-4 text-slate-600" />{" "}
              </button>{" "}
              <a
                href={selectedThread?.appointment.doctorEmail ? `mailto:${selectedThread.appointment.doctorEmail}` : "#"}
                className={`flex items-center justify-center rounded-lg border border-slate-200 p-2 transition hover:bg-slate-100 ${!selectedThread?.appointment.doctorEmail ? "opacity-30 pointer-events-none" : ""}`}
                title={selectedThread?.appointment.doctorEmail ? `Email Dr. ${doctorName}` : "No email available"}
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-mail text-slate-600"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>{" "}
              </a>{" "}
              {selectedThread?.appointment.doctorPhone && (
                <a
                  href={`tel:${selectedThread.appointment.doctorPhone}`}
                  className="flex items-center justify-center rounded-lg border border-slate-200 p-2 transition hover:bg-slate-100"
                  title={`Call Dr. ${doctorName}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-phone text-slate-600"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
              )}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-4">
          {" "}
          {selectedMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              {" "}
              No messages yet. Start a conversation.{" "}
            </div>
          ) : (
            <div className="space-y-4">
              {" "}
              {selectedMessages.map((message, index) => {
                const isFromPatient = message.senderId === patientId;
                const prevDate =
                  index > 0 ? selectedMessages[index - 1].createdAt : "";
                const showDate =
                  new Date(message.createdAt).toDateString() !==
                  new Date(prevDate).toDateString();
                return (
                  <div key={message.id}>
                    {" "}
                    {showDate && (
                      <div className="my-4 flex items-center justify-center">
                        {" "}
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                          {" "}
                          {formatDate(message.createdAt)}{" "}
                        </span>{" "}
                      </div>
                    )}{" "}
                    <div
                      className={`flex ${isFromPatient ? "justify-end" : "justify-start"} gap-2`}
                    >
                      {" "}
                      {!isFromPatient && (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                          {" "}
                          {message.senderAvatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */ <img
                              src={message.senderAvatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-emerald-500" />
                          )}{" "}
                        </div>
                      )}{" "}
                      <div
                        className={`max-w-[60%] rounded-2xl px-4 py-2 ${isFromPatient ? "bg-blue-600 text-white" : "bg-white text-slate-800 "}`}
                      >
                        {" "}
                        <p className="text-sm">{message.body}</p>{" "}
                        {message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {" "}
                            {message.attachments.map((attachment) => (
                              <a
                                key={attachment.publicUrl}
                                href={attachment.publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${isFromPatient ? "border-blue-300 bg-blue-50/40 text-blue-100 hover:bg-blue-50/60" : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                              >
                                {" "}
                                <FileText className="h-4 w-4" />{" "}
                                <span className="truncate">
                                  {attachment.fileName}
                                </span>{" "}
                              </a>
                            ))}{" "}
                          </div>
                        )}{" "}
                        <div
                          className={`mt-1 text-right text-[11px] ${isFromPatient ? "text-blue-100" : "text-slate-500"}`}
                        >
                          {" "}
                          {formatTime(message.createdAt)}{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                );
              })}{" "}
              <div ref={messagesEndRef} aria-hidden />
            </div>
          )}{" "}
        </div>{" "}
        <div className="border-t border-slate-200 bg-white p-3 md:p-4">
          {" "}
          <DirectMessageComposer
            compact
            recipientId={selectedThread?.appointment.doctorId ?? ""}
            recipientName={`Dr. ${selectedThread?.appointment.doctorName ?? "Doctor"}`}
            appointmentId={selectedThread?.appointment.id === "direct-chat" ? undefined : selectedThread?.appointment.id}
            onSent={(sent) => {
              setLiveMessages((prev) => {
                if (prev.some((m) => m.id === sent.id)) {
                  return prev.map((m) =>
                    m.id === sent.id
                      ? {
                          ...m,
                          appointmentId: sent.appointmentId,
                          senderId: sent.senderId ?? patientId,
                          recipientId: sent.recipientId ?? m.recipientId,
                          body: sent.body,
                          createdAt: sent.createdAt,
                          readAt: sent.readAt,
                          attachments: sent.attachments,
                        }
                      : m,
                  );
                }
                seenMessageIdsRef.current.add(sent.id);
                const next: ChatMessage = {
                  id: sent.id,
                  appointmentId: sent.appointmentId,
                  senderId: sent.senderId ?? patientId,
                  recipientId: sent.recipientId ?? "",
                  senderName: "You",
                  recipientName: "",
                  body: sent.body,
                  createdAt: sent.createdAt,
                  readAt: sent.readAt,
                  attachments: sent.attachments,
                };
                return [...prev, next];
              });
            }}
          />{" "}
        </div>{" "}
      </section>{" "}
      <ChatFileGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        items={galleryItems}
        title={
          selectedThread
            ? `Files — ${appointmentChatTitle(selectedThread.appointment.slot_time)}`
            : "Files"
        }
      />{" "}
    </div>
  );
}
