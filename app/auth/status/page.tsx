import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ResendConfirmationForm } from "@/components/resend-confirmation-form";
import { 
  Mail, 
  CheckCircle, 
  Clock, 
  User, 
  Stethoscope, 
  ArrowRight, 
  Shield,
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react";

export default async function AuthStatusPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const fallbackEmail = searchParams?.email ?? "";

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm your account</h1>
            <p className="text-gray-600">
              We could not find an active session. Use your email to resend confirmation.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-4">
            <ResendConfirmationForm initialEmail={fallbackEmail} />
          </div>

          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to sign in
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, doctor_approved, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "patient";
  const doctorApproved = Boolean(profile?.doctor_approved);
  const emailConfirmed = Boolean(user.email_confirmed_at);
  const destination =
    role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/patient";

  const getRoleIcon = () => {
    switch (role) {
      case "doctor":
        return <Stethoscope className="w-6 h-6 text-blue-600" />;
      case "admin":
        return <Shield className="w-6 h-6 text-purple-600" />;
      default:
        return <User className="w-6 h-6 text-green-600" />;
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case "doctor":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-green-50 text-green-700 border-green-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20"></div>
            <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile?.full_name || "User"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md ${
                emailConfirmed ? "bg-green-500" : "bg-yellow-500"
              }`}>
                {emailConfirmed ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Clock className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-600">
            Here is your account setup progress
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Progress Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Setup Progress</span>
              <span className="text-2xl font-bold text-blue-600">
                {emailConfirmed && (role !== "doctor" || doctorApproved) ? "100%" : 
                 emailConfirmed || (role === "doctor" && !doctorApproved) ? "50%" : "25%"}
              </span>
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ 
                  width: emailConfirmed && (role !== "doctor" || doctorApproved) ? "100%" : 
                         emailConfirmed || (role === "doctor" && !doctorApproved) ? "50%" : "25%" 
                }}
              />
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Email Verification Step */}
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${
              emailConfirmed 
                ? "bg-green-50 border-green-200" 
                : "bg-yellow-50 border-yellow-200"
            }`}>
              <div className={`p-3 rounded-xl ${
                emailConfirmed ? "bg-green-100" : "bg-yellow-100"
              }`}>
                {emailConfirmed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Mail className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Email Verification</h3>
                <p className={`text-sm mt-1 ${
                  emailConfirmed ? "text-green-700" : "text-yellow-700"
                }`}>
                  {emailConfirmed 
                    ? "Your email has been verified" 
                    : "Please verify your email address"}
                </p>
                {!emailConfirmed && (
                  <div className="mt-3">
                    <ResendConfirmationForm initialEmail={user.email ?? fallbackEmail} />
                  </div>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                emailConfirmed 
                  ? "bg-green-100 text-green-700" 
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {emailConfirmed ? "Completed" : "Pending"}
              </div>
            </div>

            {/* Role Approval Step */}
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${
              role === "doctor" && !doctorApproved
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
            }`}>
              <div className={`p-3 rounded-xl ${
                role === "doctor" && !doctorApproved ? "bg-yellow-100" : "bg-green-100"
              }`}>
                {getRoleIcon()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {role === "doctor" ? "Doctor Approval" : "Account Setup"}
                </h3>
                <p className={`text-sm mt-1 ${
                  role === "doctor" && !doctorApproved ? "text-yellow-700" : "text-green-700"
                }`}>
                  {role === "doctor"
                    ? doctorApproved
                      ? "Your doctor account is approved and ready"
                      : "Your application is under admin review"
                    : "Your account is ready to use"}
                </p>
                {role === "doctor" && !doctorApproved && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-yellow-600 bg-yellow-100 px-3 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Estimated review time: 1-2 business days</span>
                  </div>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                role === "doctor" && !doctorApproved
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}>
                {role === "doctor" && !doctorApproved ? "Pending" : "Completed"}
              </div>
            </div>

            {/* Account Type Badge */}
            <div className="pt-4 border-t border-gray-100">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${getRoleColor()}`}>
                {getRoleIcon()}
                <div>
                  <p className="font-medium">{role.charAt(0).toUpperCase() + role.slice(1)} Account</p>
                  <p className="text-xs opacity-75">
                    Created {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "recently"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              {emailConfirmed && (role !== "doctor" || doctorApproved) ? (
                <Link
                  href={destination}
                  className="group flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Sparkles className="w-5 h-5" />
                  Continue to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                  Back to Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Help Link */}
        <div className="text-center mt-6">
          <a 
            href="mailto:support@liffeycare.com" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            Need help? Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
