import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";
export default async function PatientNotificationsPage() {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  return <NotificationsClient homeHref="/patient" />;
}
