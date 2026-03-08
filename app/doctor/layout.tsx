import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DoctorSidebarClient } from "./DoctorSidebarClient";
import { DoctorNotificationProvider } from "@/components/notifications/DoctorNotificationProvider";
import { DoctorMessageProvider } from "@/components/notifications/DoctorMessageProvider";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/login");
  }

  assertRole(user, ["doctor", "admin"]);

  if (user && user.role === "doctor" && !user.doctorApproved) {
    redirect("/auth/status");
  }

  const supabase = getSupabaseServerClient();

  // Get unread messages count for badge
  const { data: messages } = await supabase
    .from("messages")
    .select("id, recipient_id, read_at")
    .eq("recipient_id", user.id)
    .is("read_at", null);

  const unreadMessages = messages?.length ?? 0;

  // Get doctor profile for sidebar
  const withAvatar = await supabase
    .from("profiles")
    .select("full_name, specialty, avatar_url")
    .eq("id", user.id)
    .single();

  const withoutAvatar =
    withAvatar.error && String(withAvatar.error.message).includes("avatar_url")
      ? await supabase
          .from("profiles")
          .select("full_name, specialty")
          .eq("id", user.id)
          .single()
      : null;

  const doctorProfile = (withoutAvatar?.data ?? withAvatar.data) || null;

  return (
    <DoctorNotificationProvider doctorId={user.id}>
      <DoctorMessageProvider doctorId={user.id} initialUnreadCount={unreadMessages}>
        <div className="flex min-h-screen bg-base">
          <DoctorSidebarClient
            showWallet={user.role === "doctor"}
            doctorProfile={doctorProfile || undefined}
          />
          <main className="flex-1 lg:ml-0 pt-[60px] lg:pt-0 overflow-auto">
            {children}
          </main>
        </div>
      </DoctorMessageProvider>
    </DoctorNotificationProvider>
  );
}
