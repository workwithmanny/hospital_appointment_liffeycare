"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
type PatientOption = { id: string; fullName: string };
type Attachment = {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl?: string;
};
export function DoctorDirectMessageComposer({
  patients,
}: {
  patients: PatientOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  async function upload(file: File, patientId: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("patientId", patientId);
    const res = await fetch("/api/messages/upload-direct-doctor", {
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
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData(event.currentTarget);
      const patientId = String(form.get("patientId") || "");
      if (!patientId) {
        throw new Error("Please select a patient.");
      }
      const body = String(form.get("body") || "");
      const file = form.get("file");
      let fileAttachment = attachment;
      if (file instanceof File && file.size > 0) {
        fileAttachment = await upload(file, patientId);
        setAttachment(fileAttachment);
      }
      const res = await fetch("/api/messages/send-direct-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          body,
          attachment: fileAttachment ?? undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to send message.");
      setMessage("Message sent.");
      setAttachment(null);
      event.currentTarget.reset();
      setSelectedPatientId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
      {" "}
      <div>
        {" "}
        <label className="label" htmlFor="patientId">
          {" "}
          Select Patient{" "}
        </label>{" "}
        <select
          id="patientId"
          name="patientId"
          className="input"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          required
        >
          {" "}
          <option value="">Select a patient</option>{" "}
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {" "}
              {patient.fullName}{" "}
            </option>
          ))}{" "}
        </select>{" "}
      </div>{" "}
      <div>
        {" "}
        <label className="label" htmlFor="body">
          Message
        </label>{" "}
        <textarea
          id="body"
          name="body"
          className="input min-h-[90px]"
          placeholder="Type your message here..."
          required
        />{" "}
      </div>{" "}
      <div>
        {" "}
        <label className="label" htmlFor="file">
          Attach file (max 20MB)
        </label>{" "}
        <input id="file" name="file" type="file" className="input" />{" "}
      </div>{" "}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}{" "}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}{" "}
      <button className="btn-secondary" type="submit" disabled={loading}>
        {" "}
        {loading ? "Sending..." : "Send message"}{" "}
      </button>{" "}
    </form>
  );
}
