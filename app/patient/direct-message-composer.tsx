"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
type DoctorOption = { id: string; fullName: string; specialty?: string };
type Attachment = {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl?: string;
};
export function DirectMessageComposer({
  doctors,
}: {
  doctors: DoctorOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  async function upload(file: File, doctorId: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("doctorId", doctorId);
    const res = await fetch("/api/messages/upload-direct", {
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
      const doctorId = String(form.get("doctorId") || "");
      if (!doctorId) {
        throw new Error("Please select a doctor.");
      }
      const body = String(form.get("body") || "").trim();
      const file = form.get("file");
      let fileAttachment = attachment;
      if (file instanceof File && file.size > 0) {
        fileAttachment = await upload(file, doctorId);
        setAttachment(fileAttachment);
      }
      if (!body && !fileAttachment) {
        throw new Error("Please enter a message or attach a file.");
      }
      const res = await fetch("/api/messages/send-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          body,
          attachment: fileAttachment ?? undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to send message.");
      setMessage("Message sent.");
      setAttachment(null);
      event.currentTarget.reset();
      setSelectedDoctorId("");
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
        <label className="label" htmlFor="doctorId">
          {" "}
          Select Doctor{" "}
        </label>{" "}
        <select
          id="doctorId"
          name="doctorId"
          className="input"
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
          required
        >
          {" "}
          <option value="">Select a doctor</option>{" "}
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {" "}
              Dr. {doctor.fullName}{" "}
              {doctor.specialty ? `• ${doctor.specialty}` : ""}{" "}
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
