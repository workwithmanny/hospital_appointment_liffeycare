import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { ConsolidatedPatientChatClient } from "./ConsolidatedPatientChatClient";

export default async function PatientChatPage() {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  
  return (
    <ConsolidatedPatientChatClient
      patientId={user?.id ?? ""}
    />
  );
}
