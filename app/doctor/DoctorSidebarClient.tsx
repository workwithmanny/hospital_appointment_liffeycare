"use client";
import Link from "next/link";
import {
  Bell,
  Calendar,
  History,
  MessageSquare,
  Users,
  Wallet,
  Settings,
  LayoutDashboard,
  Activity,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useDoctorNotifications } from "@/components/notifications/DoctorNotificationProvider";
import { useDoctorMessages } from "@/components/notifications/DoctorMessageProvider";

interface DoctorSidebarProps {
  showWallet?: boolean;
  doctorProfile?: {
    full_name?: string;
    specialty?: string;
    avatar_url?: string;
  };
}

export function DoctorSidebarClient({
  showWallet = true,
  doctorProfile,
}: DoctorSidebarProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount: unreadNotifications } = useDoctorNotifications();
  const { unreadCount: unreadMessages } = useDoctorMessages();

  async function onLogout() {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const pathname = usePathname();

  const mainNavItems = [
    {
      href: "/doctor",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/doctor",
    },
    {
      href: "/doctor/appointments",
      label: "Appointments",
      icon: Calendar,
      active: pathname?.startsWith("/doctor/appointments"),
    },
    {
      href: "/doctor/history",
      label: "History",
      icon: History,
      active: pathname?.startsWith("/doctor/history"),
    },
    {
      href: "/doctor/patients",
      label: "Patients",
      icon: Users,
      active: pathname?.startsWith("/doctor/patients"),
    },
    {
      href: "/doctor/chat",
      label: "Messages",
      icon: MessageSquare,
      active: pathname?.startsWith("/doctor/chat"),
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      href: "/doctor/notifications",
      label: "Notifications",
      icon: Bell,
      active: pathname?.startsWith("/doctor/notifications"),
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    ...(showWallet
      ? [
          {
            href: "/doctor/wallet",
            label: "Wallet",
            icon: Wallet,
            active: pathname?.startsWith("/doctor/wallet"),
          } as const,
        ]
      : []),
  ];

  const bottomNavItems = [
    {
      href: "/doctor/settings",
      label: "Settings",
      icon: Settings,
      active: pathname?.startsWith("/doctor/settings"),
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-border h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/doctor" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14b6a6] flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-display font-semibold text-text-primary">LiffeyCare</span>
              <p className="text-xs text-text-tertiary">Doctor Portal</p>
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                    : "text-text-secondary hover:bg-subtle hover:text-text-primary"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#14b6a6]" : ""}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                    : "text-text-secondary hover:bg-subtle hover:text-text-primary"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#14b6a6]" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={onLogout}
            disabled={loading}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full text-left disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span>{loading ? "Signing out..." : "Logout"}</span>
          </button>
        </div>

        {/* Profile */}
        <Link
          href="/doctor/profile"
          className="p-4 border-t border-border hover:bg-subtle transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center text-white font-medium text-sm">
              {doctorProfile?.avatar_url ? (
                <img
                  src={doctorProfile.avatar_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                doctorProfile?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "DR"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {doctorProfile?.full_name || "Dr. Smith"}
              </p>
              <p className="text-xs text-text-tertiary truncate">
                {doctorProfile?.specialty || "Healthcare Provider"}
              </p>
            </div>
          </div>
        </Link>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/doctor" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#14b6a6] flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold text-text-primary">LiffeyCare</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-subtle transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-text-primary" />
            ) : (
              <Menu className="w-5 h-5 text-text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-white">
            <nav className="p-4 space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                        : "text-text-secondary hover:bg-subtle hover:text-text-primary"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-[#14b6a6]" : ""}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-border mt-2 space-y-1">
                {bottomNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.active;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                          : "text-text-secondary hover:bg-subtle hover:text-text-primary"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-[#14b6a6]" : ""}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={onLogout}
                  disabled={loading}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full text-left disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{loading ? "Signing out..." : "Logout"}</span>
                </button>
              </div>
            </nav>
            {/* Mobile Profile */}
            <Link
              href="/doctor/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="p-4 border-t border-border bg-subtle"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center text-white font-medium text-sm">
                  {doctorProfile?.avatar_url ? (
                    <img
                      src={doctorProfile.avatar_url}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    doctorProfile?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "DR"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {doctorProfile?.full_name || "Dr. Smith"}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">
                    {doctorProfile?.specialty || "Healthcare Provider"}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
