import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
type DashboardRole = "patient" | "doctor" | "admin";
type DashboardShellProps = {
  role: DashboardRole;
  title: string;
  description: string;
  children: React.ReactNode;
};
const sidebarByRole: Record<
  DashboardRole,
  Array<{ label: string; href: string }>
> = {
  patient: [
    { label: "Overview", href: "/patient" },
    { label: "Appointments", href: "/patient/appointments" },
    { label: "Chat", href: "/patient/chat" },
    { label: "Settings", href: "/patient/settings" },
  ],
  doctor: [
    { label: "Overview", href: "/doctor" },
    { label: "Appointments", href: "/doctor/appointments" },
    { label: "Chat", href: "/doctor/chat" },
    { label: "Settings", href: "/doctor/settings" },
  ],
  admin: [
    { label: "Overview", href: "/admin" },
    { label: "Doctors", href: "/admin/doctors" },
    { label: "Patients", href: "/admin/patients" },
    { label: "Appointments", href: "/admin/appointments" },
    { label: "Approvals", href: "/admin/approvals" },
    { label: "Departments", href: "/admin/departments" },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Logs", href: "/admin/logs" },
    { label: "Settings", href: "/admin/settings" },
  ],
};
export function DashboardShell({
  role,
  title,
  description,
  children,
}: DashboardShellProps) {
  const navItems = sidebarByRole[role];
  return (
    <section className="space-y-5">
      {" "}
      <div className="glass-card p-4 md:hidden">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div>
            {" "}
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {role} workspace
            </p>{" "}
            <p className="text-sm font-semibold text-slate-800">{title}</p>{" "}
          </div>{" "}
          <LogoutButton className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700" />{" "}
        </div>{" "}
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {role} menu
        </p>{" "}
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {" "}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm"
            >
              {" "}
              {item.label}{" "}
            </Link>
          ))}{" "}
        </nav>{" "}
      </div>{" "}
      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        {" "}
        <aside className="glass-card hidden h-fit p-5 md:sticky md:top-24 md:block">
          {" "}
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            LiffeyCare
          </p>{" "}
          <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
            {role} workspace
          </p>{" "}
          <nav className="mt-5 space-y-2">
            {" "}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {" "}
                {item.label}{" "}
              </Link>
            ))}{" "}
          </nav>{" "}
          <div className="mt-5">
            {" "}
            <LogoutButton className="btn-secondary w-full" />{" "}
          </div>{" "}
        </aside>{" "}
        <div className="space-y-6">
          {" "}
          <div className="glass-card p-5 sm:p-6">
            {" "}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
              {" "}
              <div>
                {" "}
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Dashboard
                </p>{" "}
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {title}
                </h1>{" "}
                <p className="mt-2 text-sm text-slate-600">
                  {description}
                </p>{" "}
              </div>{" "}
              <div className="flex items-center gap-2">
                {" "}
                <span className="pill capitalize">{role}</span>{" "}
                <div className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                  Live
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {" "}
              <input
                className="input max-w-md"
                placeholder="Search records..."
              />{" "}
              <button type="button" className="btn-secondary">
                {" "}
                Today{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
          {children}{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
