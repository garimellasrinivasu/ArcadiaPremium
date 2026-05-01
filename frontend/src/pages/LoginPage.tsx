import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import PasswordInput from "../components/PasswordInput";
import api from "../services/api";

type View = "login" | "forgot" | "force-change";

export default function LoginPage() {
  const navigate = useNavigate();

  // Current view
  const [view, setView] = useState<View>("login");

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Force change password
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState("");

  /* ─── LOGIN ─── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.mustChangePassword) {
        // User logged in with temp password — force change
        setTempPassword(password);
        setView("force-change");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(
          "Unable to connect to the server. This could be a network issue or a temporary server problem."
        );
        console.error("Login error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ─── FORGOT PASSWORD ─── */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message);
    } catch (err: any) {
      setForgotError(
        err.response?.data?.error ||
          "Something went wrong. Please try again later."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  /* ─── FORCE CHANGE PASSWORD ─── */
  const handleForceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");

    if (newPassword.length < 8) {
      setChangeError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError("Passwords do not match.");
      return;
    }

    setChangeLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: tempPassword,
        newPassword,
      });
      authService.clearMustChangePassword();
      navigate("/");
    } catch (err: any) {
      setChangeError(
        err.response?.data?.error || "Failed to change password. Please try again."
      );
    } finally {
      setChangeLoading(false);
    }
  };

  /* ═══ RENDER ═══ */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-arcadia-900 to-arcadia-700">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* ── HEADER ── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-arcadia-900">ArcadiaPremium</h1>
          <p className="text-gray-500 mt-2">
            {view === "login" && "Sign in to your account"}
            {view === "forgot" && "Reset your password"}
            {view === "force-change" && "Set a new password"}
          </p>
        </div>

        {/* ━━━ LOGIN VIEW ━━━ */}
        {view === "login" && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm transition"
                  placeholder="you@arcadia.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-arcadia-600 hover:bg-arcadia-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError("");
                  setForgotSuccess("");
                  setView("forgot");
                }}
                className="text-sm text-arcadia-600 hover:text-arcadia-800 hover:underline transition"
              >
                Forgot Password?
              </button>
            </div>
          </>
        )}

        {/* ━━━ FORGOT PASSWORD VIEW ━━━ */}
        {view === "forgot" && (
          <>
            {forgotError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {forgotSuccess}
              </div>
            )}

            {!forgotSuccess ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm transition"
                    placeholder="Enter your registered email"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    A temporary password will be sent to this email.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-arcadia-600 hover:bg-arcadia-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {forgotLoading ? "Sending..." : "Send Temporary Password"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-600 text-center">
                Please check your email and use the temporary password to log in.
              </p>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setError("");
                }}
                className="text-sm text-arcadia-600 hover:text-arcadia-800 hover:underline transition"
              >
                Back to Sign In
              </button>
            </div>
          </>
        )}

        {/* ━━━ FORCE CHANGE PASSWORD VIEW ━━━ */}
        {view === "force-change" && (
          <>
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
              You are logged in with a temporary password. Please set a new password to continue.
            </div>

            {changeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {changeError}
              </div>
            )}

            <form onSubmit={handleForceChange} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                />
              </div>
              <button
                type="submit"
                disabled={changeLoading}
                className="w-full py-2.5 bg-arcadia-600 hover:bg-arcadia-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {changeLoading ? "Updating..." : "Set New Password & Continue"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
