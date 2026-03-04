import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PatientSidebar } from "@/components/patient-sidebar";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/login");
  }

  assertRole(user, ["patient"]);

  const supabase = getSupabaseServerClient();

  // Get unread messages count for badge
  const { data: messages } = await supabase
    .from("messages")
    .select("id, recipient_id, read_at")
    .eq("recipient_id", user.id)
    .is("read_at", null);

  const unreadMessages = messages?.length ?? 0;

  let unreadNotifications = 0;
  const notifCount = await supabase
    .from("app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (!notifCount.error && notifCount.count != null) {
    unreadNotifications = notifCount.count;
  }

  // Get patient profile for sidebar
  const withAvatar = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const withoutAvatar =
    withAvatar.error && String(withAvatar.error.message).includes("avatar_url")
      ? await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
      : null;

  const patientProfile = (withoutAvatar?.data ?? withAvatar.data) || null;

  return (
    <div className="flex h-screen bg-base">
      <PatientSidebar
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        patientProfile={patientProfile || undefined}
      />
      <div className="min-h-0 flex-1 overflow-auto lg:pt-0 pt-[57px]">{children}</div>
    </div>
  );
}
