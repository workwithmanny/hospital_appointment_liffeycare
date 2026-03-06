"use client";
import Link from "next/link";
import {
  Bell,
  Calendar,
  History,
  MessageCircle,
  Settings,
  LayoutDashboard,
  Plus,
  LogOut,
  Users,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useState } from "react";

interface PatientSidebarProps {
  unreadMessages?: number;
  unreadNotifications?: number;
  patientProfile?: { full_name?: string; avatar_url?: string };
}

export function PatientSidebar({
  unreadMessages = 0,
  unreadNotifications = 0,
  patientProfile,
}: PatientSidebarProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      href: "/patient",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/patient",
    },
    {
      href: "/patient/doctors",
      label: "Find Doctors",
      icon: Users,
      active: pathname?.startsWith("/patient/doctors"),
    },
    {
      href: "/patient/appointments",
      label: "Appointments",
      icon: Calendar,
      active: pathname?.startsWith("/patient/appointments"),
    },
    {
      href: "/patient/history",
      label: "History",
      icon: History,
      active: pathname?.startsWith("/patient/history"),
    },
    {
      href: "/patient/chat",
      label: "Chat",
      icon: MessageCircle,
      active: pathname?.startsWith("/patient/chat"),
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      href: "/patient/notifications",
      label: "Notifications",
      icon: Bell,
      active: pathname?.startsWith("/patient/notifications"),
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
  ];

  const bottomNavItems = [
    {
      href: "/patient/settings",
      label: "Settings",
      icon: Settings,
      active: pathname?.startsWith("/patient/settings"),
    },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#14b6a6] to-[#0d9488] rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-text-primary">LiffeyCare</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-subtle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-[57px] left-0 right-0 bg-white border-b border-border shadow-lg p-4" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl relative ${
                      item.active
                        ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                        : "text-text-secondary hover:bg-subtle"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-[#14b6a6] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border mt-4 pt-4 space-y-1">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl ${
                      item.active
                        ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                        : "text-text-secondary hover:bg-subtle"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={onLogout}
                disabled={loading}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:bg-subtle w-full text-left disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{loading ? "Signing out..." : "Logout"}</span>
              </button>
            </div>
            {/* Mobile User Profile */}
            <div className="border-t border-border mt-4 pt-4">
              <Link
                href="/patient/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-subtle"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#14b6a6] to-[#0d9488] rounded-full flex items-center justify-center text-white font-medium shrink-0">
                  {patientProfile?.avatar_url ? (
                    <img
                      src={patientProfile.avatar_url}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {patientProfile?.full_name?.split(" ").map((n) => n[0]).join("") || "PT"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {patientProfile?.full_name || "Patient"}
                  </p>
                  <p className="text-xs text-text-secondary truncate">View Profile</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-border flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#14b6a6] to-[#0d9488] rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-text-primary">LiffeyCare</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl relative transition-colors ${
                    item.active
                      ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                      : "text-text-secondary hover:bg-subtle"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="absolute right-3 bg-[#14b6a6] text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-border space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  item.active
                    ? "bg-[#14b6a6]/10 text-[#14b6a6]"
                    : "text-text-secondary hover:bg-subtle"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={onLogout}
            disabled={loading}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-subtle w-full text-left disabled:opacity-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{loading ? "Signing out..." : "Logout"}</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <Link
            href="/patient/profile"
            className="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-subtle transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#14b6a6] to-[#0d9488] rounded-full flex items-center justify-center text-white font-medium">
              {patientProfile?.avatar_url ? (
                <img
                  src={patientProfile.avatar_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium">
                  {patientProfile?.full_name?.split(" ").map((n) => n[0]).join("") || "PT"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {patientProfile?.full_name || "Patient"}
              </p>
              <p className="text-xs text-text-secondary truncate">Patient</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </Link>
        </div>
      </div>
    </>
  );
}
