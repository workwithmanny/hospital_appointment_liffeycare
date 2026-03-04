import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
export default async function PatientChatDebugPage() {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  const supabase = getSupabaseServerClient();
  console.log("🔍 Debug: Patient ID:", user?.id);
  console.log("🔍 Debug: Patient Email:", user?.email);
  const { data: doctors } = await supabase
    .from("profiles")
    .select("id, full_name, specialty")
    .eq("role", "doctor")
    .eq("doctor_approved", true)
    .order("full_name", { ascending: true });
  console.log("🔍 Debug: Doctors found:", doctors?.length || 0);
  const { data: rawMessages, error: messageError } = await supabase
    .from("messages")
    .select(
      ` id, body, created_at, read_at, sender_id, recipient_id, message_type, sender:profiles!messages_sender_id_fkey(full_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url) `,
    )
    .eq("message_type", "direct");
  const messages = rawMessages as any[];
  console.log("🔍 Debug: Message query error:", messageError);
  console.log("🔍 Debug: Messages found:", messages?.length || 0);
  if (messages && messages.length > 0) {
    console.log("🔍 Debug: First message:", messages[0]);
  }
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {" "}
      <h1 className="text-2xl font-bold mb-6">🐛 Patient Chat Debug</h1>{" "}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        {" "}
        <h2 className="font-semibold mb-2">User Info:</h2>{" "}
        <div className="space-y-1 text-sm font-mono">
          {" "}
          <div>ID: {user?.id}</div> <div>Email: {user?.email}</div>{" "}
          <div>Role: {user?.role}</div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        {" "}
        <h2 className="font-semibold mb-2">
          Doctors Found: {doctors?.length || 0}
        </h2>{" "}
        <div className="space-y-1 text-sm">
          {" "}
          {doctors?.map((doctor, i) => (
            <div key={i} className="font-mono">
              {" "}
              {doctor.id} - {doctor.full_name} ({doctor.specialty}){" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        {" "}
        <h2 className="font-semibold mb-2">
          Messages Found: {messages?.length || 0}
        </h2>{" "}
        {messageError && (
          <div className="text-red-600 text-sm mb-2">
            Error: {messageError.message}
          </div>
        )}{" "}
        <div className="space-y-2 text-sm">
          {" "}
          {messages?.map((message, i) => (
            <div key={i} className="border-b pb-2 font-mono text-xs">
              {" "}
              <div>ID: {message.id}</div>{" "}
              <div>Type: {message.message_type}</div>{" "}
              <div>
                Sender: {message.sender?.full_name} ({message.sender_id})
              </div>{" "}
              <div>
                Recipient: {message.recipient?.full_name} (
                {message.recipient_id})
              </div>{" "}
              <div>Body: "{message.body}"</div>{" "}
              <div>
                Created: {new Date(message.created_at).toLocaleString()}
              </div>{" "}
              <div>
                Read:{" "}
                {message.read_at
                  ? new Date(message.read_at).toLocaleString()
                  : "Unread"}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-blue-50 border rounded-lg p-4">
        {" "}
        <h2 className="font-semibold mb-2">📋 What This Shows:</h2>{" "}
        <ul className="text-sm space-y-1">
          {" "}
          <li>✅ User authentication status</li>{" "}
          <li>✅ Available doctors for messaging</li>{" "}
          <li>✅ Direct messages (filtered by message_type='direct')</li>{" "}
          <li>✅ Message details and relationships</li>{" "}
        </ul>{" "}
      </div>{" "}
      <div className="mt-6">
        {" "}
        <a
          href="/patient/chat"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {" "}
          Go to Actual Chat Page{" "}
        </a>{" "}
      </div>{" "}
    </div>
  );
}
