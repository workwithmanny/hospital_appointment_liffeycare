"use client";

import { useState, FormEvent } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export function PasswordChangeForm() {
  const supabase = getSupabaseClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    // First verify current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("Unable to verify user.");
      setLoading(false);
      return;
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(false), 5000);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="label" htmlFor="currentPassword">
          Current Password
        </label>
        <div className="relative">
          <input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            className="input pr-10"
            placeholder="Enter current password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="newPassword">
          New Password
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            className="input pr-10"
            placeholder="Enter new password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-caption mt-1">Must be at least 6 characters</p>
      </div>

      <div>
        <label className="label" htmlFor="confirmPassword">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className="input pr-10"
            placeholder="Confirm new password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <p className="text-sm text-emerald-700">Password updated successfully!</p>
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}
