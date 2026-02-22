import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  doctorApproved: boolean;
  emailConfirmed: boolean;
}

export function assertRole(user: SessionUser | null, roles: Role[]) {
  if (!user || !roles.includes(user.role)) {
    redirect("/auth/login");
  }
}
