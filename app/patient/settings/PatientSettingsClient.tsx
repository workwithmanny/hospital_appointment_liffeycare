"use client";

import { useState } from "react";
import { Bell, Moon, Mail, Shield, Lock, Settings, Save } from "lucide-react";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";

export function PatientSettingsClient() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    appointmentReminders: true,
    darkMode: false,
    marketingEmails: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#14b6a6]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage your preferences and account</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Appointment Reminders */}
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#14b6a6]" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Appointment Reminders</p>
                <p className="text-sm text-text-secondary">Get notified before appointments</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('appointmentReminders')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.appointmentReminders ? 'bg-[#14b6a6]' : 'bg-border'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.appointmentReminders ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Email Alerts</p>
                <p className="text-sm text-text-secondary">Receive booking confirmations</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('emailNotifications')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-emerald-500' : 'bg-border'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Moon className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Dark Mode</p>
                <p className="text-sm text-text-secondary">Switch to dark theme</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('darkMode')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? 'bg-violet-500' : 'bg-border'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-subtle flex items-center justify-center">
              <Shield className="w-5 h-5 text-text-secondary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Privacy</p>
              <p className="text-sm text-text-secondary">Your health data is secure and encrypted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mt-6">
        <div className="p-4 sm:p-5 border-b border-border bg-subtle/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Security</p>
              <p className="text-sm text-text-secondary">Change your account password</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <PasswordChangeForm />
        </div>
      </div>

      {/* Save Button */}
      <button className="mt-6 w-full bg-[#14b6a6] text-white py-3 rounded-xl font-medium hover:bg-[#0d9488] transition-colors shadow-sm flex items-center justify-center gap-2">
        <Save className="w-4 h-4" />
        Save Changes
      </button>
    </div>
  );
}
