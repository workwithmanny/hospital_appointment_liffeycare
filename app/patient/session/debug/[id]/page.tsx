"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
export default function DebugSessionPage() {
  const params = useParams();
  const appointmentId = params.id as string;
  console.log("🐛 Debug session page loaded");
  console.log("📍 Appointment ID:", appointmentId);
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (message: string) => {
    console.log(message);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };
  useEffect(() => {
    addLog("🚀 Debug useEffect started");
    const supabase = getSupabaseClient();
    addLog("📱 Supabase client created"); // Test 1: Check auth
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        addLog(`❌ Auth error: ${error.message}`);
      } else {
        addLog(`✅ Auth success: ${user?.id} (${user?.email})`);
      }
    }); // Test 2: Check appointment exists
    supabase
      .from("appointments")
      .select("id, patient_id, doctor_id")
      .eq("id", appointmentId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          addLog(`❌ Appointment error: ${error.message}`);
        } else {
          addLog(
            `✅ Appointment found: Patient ${data?.patient_id}, Doctor ${data?.doctor_id}`,
          );
        }
      }); // Test 3: Check messages
    supabase
      .from("messages")
      .select("id, body, appointment_id")
      .or(`appointment_id.eq.${appointmentId},appointment_id.is.null`)
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          addLog(`❌ Messages error: ${error.message}`);
        } else {
          addLog(`✅ Found ${data?.length} messages`);
          data?.forEach((msg, i) => {
            addLog(
              ` ${i + 1}. [${msg.appointment_id ? "APPT" : "DIRECT"}] ${msg.body}`,
            );
          });
        }
      });
  }, [appointmentId]);
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {" "}
      <h1 className="text-2xl font-bold mb-4">🐛 Session Debug Page</h1>{" "}
      <p className="mb-4">
        Appointment ID:{" "}
        <code className="bg-gray-100 px-2 py-1">{appointmentId}</code>
      </p>{" "}
      <div className="bg-gray-50 border rounded-lg p-4">
        {" "}
        <h2 className="font-semibold mb-2">Console Logs:</h2>{" "}
        <div className="space-y-1 font-mono text-sm">
          {" "}
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes("❌")
                    ? "text-red-600"
                    : log.includes("✅")
                      ? "text-green-600"
                      : "text-gray-700"
                }
              >
                {" "}
                {log}{" "}
              </div>
            ))
          )}{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-6">
        {" "}
        <a
          href={`/patient/session/${appointmentId}`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {" "}
          Go to Actual Session Page{" "}
        </a>{" "}
      </div>{" "}
    </div>
  );
}
