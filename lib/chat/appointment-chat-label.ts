/** One-line label for a conversation tied to an appointment (sidebar + search). */
export function appointmentChatTitle(slotTimeIso: string): string {
  const d = new Date(slotTimeIso);
  const nowY = new Date().getFullYear();
  const y = d.getFullYear();
  const dateOpts: Intl.DateTimeFormatOptions =
    y !== nowY
      ? { weekday: "short", month: "short", day: "numeric", year: "numeric" }
      : { weekday: "short", month: "short", day: "numeric" };
  const dateStr = d.toLocaleDateString(undefined, dateOpts);
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateStr} · ${timeStr}`;
}

export function appointmentChatSubtitleName(
  counterpartyDisplayName: string,
): string {
  return counterpartyDisplayName;
}
