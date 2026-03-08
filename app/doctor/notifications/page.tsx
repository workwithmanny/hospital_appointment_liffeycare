import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";
export default async function DoctorNotificationsPage() {
  const user = await getSessionUser();
  assertRole(user, ["doctor", "admin"]);
  return <NotificationsClient homeHref="/doctor" />;
}
