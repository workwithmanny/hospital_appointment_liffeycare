"use client";
import { FormEvent, useState } from "react";
type AppointmentOption = { id: string; label: string };
type DoctorMessageFormProps = { appointments: AppointmentOption[] };
export function DoctorMessageForm({ appointments }: DoctorMessageFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const appointmentId = String(form.get("appointmentId") || "");
    const text = String(form.get("message") || "");
    const response = await fetch("/api/doctor/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, message: text }),
    });
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to send message.");
      return;
    }
    setMessage(data.message ?? "Message sent.");
    event.currentTarget.reset();
  }
  return (
    <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
      {" "}
      <div>
        {" "}
        <label className="label" htmlFor="appointmentId">
          {" "}
          Appointment{" "}
        </label>{" "}
        <select
          id="appointmentId"
          name="appointmentId"
          className="input"
          defaultValue=""
          required
        >
          {" "}
          <option value="">Select appointment</option>{" "}
          {appointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {" "}
              {appointment.label}{" "}
            </option>
          ))}{" "}
        </select>{" "}
      </div>{" "}
      <div>
        {" "}
        <label className="label" htmlFor="message">
          {" "}
          Message to patient{" "}
        </label>{" "}
        <textarea
          id="message"
          name="message"
          className="input min-h-[90px]"
          placeholder="Type message for your patient"
          required
        />{" "}
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
