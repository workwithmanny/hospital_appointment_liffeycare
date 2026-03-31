type ProfileMini = { full_name?: string; avatar_url?: string } | null;

function asProfile(v: unknown): ProfileMini {
  if (v == null) return null;
  if (Array.isArray(v)) {
    const first = v[0] as { full_name?: string; avatar_url?: string } | undefined;
    return first ?? null;
  }
  return v as ProfileMini;
}

function asAttachmentList(
  v: unknown,
): Array<{ file_name: string; file_path: string }> {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  return [v as { file_name: string; file_path: string }];
}

export type MessageRowFromDb = {
  id: string;
  appointment_id: string | null;
  thread_id: string | null;
  appointment_context_id: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
  sender_id: string;
  recipient_id: string;
  message_type?: string | null;
  sender?: unknown;
  recipient?: unknown;
  attachments?: unknown;
};

export type ChatMessageDto = {
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

export function mapMessageRowsForViewer(
  rows: MessageRowFromDb[],
  viewerId: string,
  peerFallbackLabel: { whenSender: string; whenRecipient: string },
): ChatMessageDto[] {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return rows.map((message) => {
    const senderProf = asProfile(message.sender);
    const recipProf = asProfile(message.recipient);
    const attachmentsRaw = asAttachmentList(message.attachments);
    return {
      id: message.id,
      appointmentId: message.appointment_id,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      senderName:
        message.sender_id === viewerId
          ? "You"
          : senderProf?.full_name ?? peerFallbackLabel.whenSender,
      recipientName:
        message.recipient_id === viewerId
          ? "You"
          : recipProf?.full_name ?? peerFallbackLabel.whenRecipient,
      senderAvatarUrl: senderProf?.avatar_url ?? null,
      recipientAvatarUrl: recipProf?.avatar_url ?? null,
      body: message.body,
      createdAt: message.created_at,
      readAt: message.read_at,
      attachments: attachmentsRaw.map((file) => ({
        fileName: file.file_name,
        publicUrl: baseUrl
          ? `${baseUrl}/storage/v1/object/public/message-files/${file.file_path}`
          : file.file_path,
      })),
    };
  });
}
