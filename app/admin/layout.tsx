import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/login");
  }

  assertRole(user, ["admin"]);

  const supabase = getSupabaseServerClient();

  // Get admin profile for sidebar
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar adminProfile={adminProfile || undefined} />
      <main className="flex-1 lg:ml-0 pt-[60px] lg:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
