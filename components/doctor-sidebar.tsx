"use client";
import Link from "next/link";
import {
  Bell,
  Calendar,
  History,
  MessageCircle,
  Users,
  Wallet,
  Settings,
  LayoutDashboard,
  Plus,
  LogOut,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useState } from "react";
interface DoctorSidebarProps {
  unreadMessages?: number;
  unreadNotifications?: number;
  /** Hide wallet nav for roles that cannot use the doctor wallet API (e.g. admin). */ showWallet?: boolean;
  doctorProfile?: {
    full_name?: string;
    specialty?: string;
    avatar_url?: string;
  };
}
export function DoctorSidebar({
  unreadMessages = 0,
  unreadNotifications = 0,
  showWallet = true,
  doctorProfile,
}: DoctorSidebarProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
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
      label: "Chat",
      icon: MessageCircle,
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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {" "}
      {/* Logo */}{" "}
      <div className="p-6 border-b border-gray-200">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            {" "}
            <Plus className="w-5 h-5 text-white" />{" "}
          </div>{" "}
          <span className="text-xl font-semibold text-gray-900">
            LiffeyCare
          </span>{" "}
        </div>{" "}
      </div>{" "}
      {/* Navigation */}{" "}
      <nav className="flex-1 p-4">
        {" "}
        <div className="space-y-1">
          {" "}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg relative ${item.active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {" "}
                <Icon className="w-5 h-5" />{" "}
                <span className="font-medium">{item.label}</span>{" "}
                {item.badge && (
                  <span className="absolute right-3 top-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {" "}
                    {item.badge}{" "}
                  </span>
                )}{" "}
              </Link>
            );
          })}{" "}
        </div>{" "}
      </nav>{" "}
      {/* Bottom Navigation */}{" "}
      <div className="p-4 border-t border-gray-200 space-y-1">
        {" "}
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${item.active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {" "}
              <Icon className="w-5 h-5" />{" "}
              <span className="font-medium">{item.label}</span>{" "}
            </Link>
          );
        })}{" "}
        <button
          onClick={onLogout}
          disabled={loading}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 w-full text-left disabled:opacity-50"
        >
          {" "}
          <LogOut className="w-5 h-5" />{" "}
          <span className="font-medium">
            {loading ? "Signing out..." : "Logout"}
          </span>{" "}
        </button>{" "}
      </div>{" "}
      {/* User Profile */}{" "}
      <div className="p-4 border-t border-gray-200">
        {" "}
        <Link
          href="/doctor/profile"
          className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-gray-50 transition-colors"
        >
          {" "}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {" "}
            {doctorProfile?.avatar_url ? (
              <img
                src={doctorProfile.avatar_url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {" "}
                {doctorProfile?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "DR"}{" "}
              </span>
            )}{" "}
          </div>{" "}
          <div className="flex-1 min-w-0">
            {" "}
            <p className="text-sm font-medium text-gray-900 truncate">
              {" "}
              {doctorProfile?.full_name || "Dr. Smith"}{" "}
            </p>{" "}
            <p className="text-xs text-gray-500 truncate">
              {" "}
              {doctorProfile?.specialty || "Cardiologist"}{" "}
            </p>{" "}
          </div>{" "}
        </Link>{" "}
      </div>{" "}
    </div>
  );
}
