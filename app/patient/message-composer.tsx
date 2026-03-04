"use client";
import { MessageComposer } from "@/app/doctor/message-composer";

export function PatientMessageComposer({
  appointmentId,
  onSent,
}: {
  appointmentId: string;
  onSent?: Parameters<typeof MessageComposer>[0]["onSent"];
}) {
  return (
    <MessageComposer
      appointmentId={appointmentId}
      onSent={onSent}
      compact
    />
  );
}
