"use client";

import { useEffect, useState } from "react";
import { 
  Shield, 
  Mail, 
  LogOut, 
  AlertTriangle,
  Clock,
  Lock,
  MessageCircle,
  HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

interface BanInfo {
  banned_at?: string;
  banned_reason?: string;
  full_name?: string;
}

export default function AccountBannedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo>({});

  useEffect(() => {
    const fetchBanInfo = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("banned_at, banned_reason, full_name")
          .eq("id", user.id)
          .single();
        if (data) setBanInfo(data);
      }
    };
    fetchBanInfo();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Animated Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-white mb-2">Account Suspended</h1>
              <p className="text-red-100">Your account access has been restricted</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Ban Details Card */}
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Ban Details
              </h2>
              
              <div className="space-y-4">
                {banInfo.banned_reason && (
                  <div className="bg-white rounded-xl p-4 border border-red-100">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Reason</p>
                    <p className="text-gray-900 font-medium">{banInfo.banned_reason}</p>
                  </div>
                )}
                
                <div className="bg-white rounded-xl p-4 border border-red-100">
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Banned
                  </p>
                  <p className="text-gray-900 font-medium">
                    {banInfo.banned_at 
                      ? new Date(banInfo.banned_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : "Recently"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Support Section */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Need help?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    If you believe this was a mistake or need assistance, please contact our support team.
                  </p>
                  <a
                    href="mailto:contact@liffeycare.online?subject=Account Suspension Appeal"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Support
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ Hint */}
            <div className="flex items-start gap-3 text-sm text-gray-500">
              <HelpCircle className="w-5 h-5 text-gray-400 mt-0.5" />
              <p>
                For urgent matters, include your account email and a brief explanation in your message to help us assist you faster.
              </p>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 pt-6">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {loading ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-500">
            © 2026 LiffeyCare. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <a href="/terms" className="hover:text-gray-600">Terms of Service</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-gray-600">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
