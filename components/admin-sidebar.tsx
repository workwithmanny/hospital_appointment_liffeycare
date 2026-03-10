"use client";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Calendar,
  CheckCircle,
  Building2,
  BarChart3,
  ScrollText,
  Settings,
  Plus,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useState } from "react";

interface AdminSidebarProps {
  adminProfile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export function AdminSidebar({ adminProfile }: AdminSidebarProps) {
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
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      href: "/admin/doctors",
      label: "Doctors",
      icon: UserCircle,
      active: pathname?.startsWith("/admin/doctors"),
    },
    {
      href: "/admin/patients",
      label: "Patients",
      icon: Users,
      active: pathname?.startsWith("/admin/patients"),
    },
    {
      href: "/admin/appointments",
      label: "Appointments",
      icon: Calendar,
      active: pathname?.startsWith("/admin/appointments"),
    },
    {
      href: "/admin/approvals",
      label: "Approvals",
      icon: CheckCircle,
      active: pathname?.startsWith("/admin/approvals"),
    },
    {
      href: "/admin/departments",
      label: "Departments",
      icon: Building2,
      active: pathname?.startsWith("/admin/departments"),
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon: BarChart3,
      active: pathname?.startsWith("/admin/analytics"),
    },
    {
      href: "/admin/logs",
      label: "System Logs",
      icon: ScrollText,
      active: pathname?.startsWith("/admin/logs"),
    },
  ];

  const bottomNavItems = [
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      active: pathname?.startsWith("/admin/settings"),
    },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center shadow-sm">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">LiffeyCare</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="w-3.5 h-3.5 text-[#14b6a6]" />
                <span className="text-[10px] font-semibold text-[#14b6a6] uppercase tracking-wider">Admin Portal</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${item.active ? "bg-[#14b6a6]/10 text-[#14b6a6] font-medium shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
              >
                <div className={`p-1.5 rounded-lg ${item.active ? "bg-[#14b6a6]/20" : "bg-gray-100"}`}>
                  <Icon className={`w-4 h-4 ${item.active ? "text-[#14b6a6]" : "text-gray-500"}`} />
                </div>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${item.active ? "bg-[#14b6a6]/10 text-[#14b6a6] font-medium" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
            >
              <div className={`p-1.5 rounded-lg ${item.active ? "bg-[#14b6a6]/20" : "bg-gray-100"}`}>
                <Icon className={`w-4 h-4 ${item.active ? "text-[#14b6a6]" : "text-gray-500"}`} />
              </div>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onLogout}
          disabled={loading}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-rose-50 hover:text-rose-600 w-full text-left disabled:opacity-50 transition-all duration-200"
        >
          <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-rose-100">
            <LogOut className="w-4 h-4 text-gray-500" />
          </div>
          <span className="text-sm">{loading ? "Signing out..." : "Logout"}</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 rounded-xl p-3 bg-gradient-to-r from-[#14b6a6]/5 to-transparent">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#14b6a6]/20 to-[#0d9488]/20 flex items-center justify-center ring-2 ring-[#14b6a6]/20">
            {adminProfile?.avatar_url ? (
              <img
                src={adminProfile.avatar_url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-[#14b6a6]">
                {adminProfile?.full_name?.split(" ").map((n) => n[0]).join("") || "AD"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {adminProfile?.full_name || "Admin"}
            </p>
            <p className="text-xs text-gray-500 truncate">Administrator</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#14b6a6] to-[#0d9488] flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">LiffeyCare</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
