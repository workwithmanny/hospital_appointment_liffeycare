"use client";
import { FormEvent, useState } from "react";
const days = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];
export function DoctorAvailabilityForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const dayOfWeek = Number(form.get("dayOfWeek"));
    const startTime = String(form.get("startTime") || "");
    const endTime = String(form.get("endTime") || "");
    const response = await fetch("/api/doctor/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, startTime, endTime }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save availability.");
      return;
    }
    setMessage("Availability saved.");
    event.currentTarget.reset();
  }
  return (
    <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
      {" "}
      <div className="grid gap-4 sm:grid-cols-2">
        {" "}
        <div>
          {" "}
          <label className="label" htmlFor="dayOfWeek">
            {" "}
            Day{" "}
          </label>{" "}
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            className="input"
            defaultValue="1"
          >
            {" "}
            {days.map((day) => (
              <option key={day.value} value={day.value}>
                {" "}
                {day.label}{" "}
              </option>
            ))}{" "}
          </select>{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid gap-4 sm:grid-cols-2">
        {" "}
        <div>
          {" "}
          <label className="label" htmlFor="startTime">
            {" "}
            Start time{" "}
          </label>{" "}
          <input
            id="startTime"
            name="startTime"
            type="time"
            className="input"
            required
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="label" htmlFor="endTime">
            {" "}
            End time{" "}
          </label>{" "}
          <input
            id="endTime"
            name="endTime"
            type="time"
            className="input"
            required
          />{" "}
        </div>{" "}
      </div>{" "}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}{" "}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}{" "}
      <button className="btn-primary" type="submit" disabled={loading}>
        {" "}
        {loading ? "Saving..." : "Save availability"}{" "}
      </button>{" "}
    </form>
  );
}
