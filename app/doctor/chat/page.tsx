import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { ConsolidatedDoctorChatClient } from "./ConsolidatedDoctorChatClient";

export default async function DoctorChatPage() {
  const user = await getSessionUser();
  assertRole(user, ["doctor", "admin"]);
  
  return (
    <ConsolidatedDoctorChatClient
      doctorId={user?.id ?? ""}
    />
  );
}
