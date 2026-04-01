"use client";

import { useState } from "react";
import { 
  Settings,
  Shield,
  Lock,
  Bell,
  Mail,
  Database,
  Server,
  Key
} from "lucide-react";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure admin workspace preferences and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <nav className="p-2">
              {[
                { id: "general", label: "General", icon: Settings },
                { id: "security", label: "Security", icon: Shield },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "system", label: "System", icon: Server },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "general" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
                  <input
                    type="text"
                    defaultValue="LiffeyCare Hospital"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    defaultValue="contact@liffeycare.online"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>UTC-08:00 Pacific Time</option>
                    <option>UTC-05:00 Eastern Time</option>
                    <option>UTC+00:00 GMT</option>
                    <option>UTC+01:00 Central European</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Password
                </h2>
                <PasswordChangeForm />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Role-Based Access Control</p>
                      <p className="text-sm text-gray-500">Enabled and active</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Supabase RLS</p>
                      <p className="text-sm text-gray-500">Row Level Security active on core tables</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Session Protection</p>
                      <p className="text-sm text-gray-500">Protected admin routes with auth guards</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Email notifications for new doctor registrations", defaultChecked: true },
                  { label: "Email notifications for appointment cancellations", defaultChecked: true },
                  { label: "Push notifications for system alerts", defaultChecked: false },
                  { label: "Daily summary email", defaultChecked: true },
                ].map((item, i) => (
                  <label key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <input type="checkbox" defaultChecked={item.defaultChecked} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  </label>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Information
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">System Mode</p>
                  <p className="font-medium text-gray-900">In-Person Appointments Only</p>
                  <p className="text-sm text-gray-500 mt-1">Video and voice consultation workflows are disabled</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Database</p>
                  <p className="font-medium text-gray-900">Supabase PostgreSQL</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Framework</p>
                  <p className="font-medium text-gray-900">Next.js 14 with App Router</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Authentication</p>
                  <p className="font-medium text-gray-900">Supabase Auth</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
