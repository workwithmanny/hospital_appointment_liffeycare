"use client";

import { useState } from "react";
import { Loader2, Mail, Send, CheckCircle, XCircle } from "lucide-react";

const templates = [
  { id: "booking_confirmed", label: "Patient Booking Confirmation", description: "Sent to patient when they book an appointment" },
  { id: "booking_confirmed_doctor", label: "Doctor New Booking Alert", description: "Sent to doctor when a patient books with them" },
  { id: "appointment_reminder", label: "24h Appointment Reminder", description: "Reminder sent 24 hours before appointment" },
  { id: "appointment_started", label: "Appointment Started", description: "Alert when appointment session begins" },
  { id: "appointment_cancelled", label: "Appointment Cancelled", description: "Notification when appointment is cancelled" },
];

export default function EmailTestPage() {
  const [email, setEmail] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("booking_confirmed");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [history, setHistory] = useState<{ template: string; email: string; time: string; status: "success" | "error" }[]>([]);

  async function sendTestEmail(templateId: string) {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setResult({ success: false, message: "Please enter an email address" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: targetEmail, template: templateId }),
      });

      const data = await response.json();

      const newEntry = {
        template: templateId,
        email: targetEmail,
        time: new Date().toLocaleTimeString(),
        status: response.ok ? ("success" as const) : ("error" as const),
      };

      setHistory((prev) => [newEntry, ...prev].slice(0, 10));

      if (response.ok) {
        setResult({ success: true, message: `Email sent! Check ${targetEmail}` });
      } else {
        setResult({ success: false, message: data.error || "Failed to send email" });
      }
    } catch (error) {
      setResult({ success: false, message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function sendAll() {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setResult({ success: false, message: "Please enter an email address" });
      return;
    }

    setLoading(true);
    setResult({ success: true, message: "Sending all templates..." });

    for (const template of templates) {
      await sendTestEmail(template.id);
      await new Promise((r) => setTimeout(r, 800));
    }

    setLoading(false);
    setResult({ success: true, message: `All ${templates.length} emails sent to ${targetEmail}` });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Email Test Center</h1>
          <p className="mt-2 text-gray-600">Test your LiffeyCare email notifications</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Recipient Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <p className="mt-1 text-sm text-gray-500">
              Use a verified email address (Resend free tier restriction)
            </p>
          </div>

          {result && (
            <div
              className={`mb-6 flex items-center gap-3 rounded-lg p-4 ${
                result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <span className="font-medium">{result.message}</span>
            </div>
          )}

          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
              <button
                onClick={sendAll}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send All
              </button>
            </div>

            <div className="grid gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                    selectedTemplate === template.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{template.label}</h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendTestEmail(template.id);
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Sends</h2>
              <div className="rounded-lg border border-gray-200">
                {history.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-4 py-3 ${
                      idx !== history.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          entry.status === "success" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="font-medium text-gray-900">
                        {templates.find((t) => t.id === entry.template)?.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {entry.email} • {entry.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          <p className="font-medium">Configuration</p>
          <p className="mt-1">API Key: {process.env.NEXT_PUBLIC_RESEND_API_KEY ? "✅ Set" : "❌ Not configured"}</p>
          <p>From Email: onboarding@resend.dev</p>
          <p className="mt-2 text-xs">
            Note: With Resend free tier, you can only send to verified email addresses.
          </p>
        </div>
      </div>
    </div>
  );
}
