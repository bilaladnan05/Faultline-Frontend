import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, KeyRound, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function MFAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeMfaSignIn } = useAuth();
  const challengeToken = location.state?.challengeToken;
  const email = location.state?.email || "your account";
  const trustedDeviceTtlDays = location.state?.trustedDeviceTtlDays || 30;
  const [code, setCode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const input = useRef(null);

  useEffect(() => { input.current?.focus(); }, [recoveryMode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!challengeToken) {
      setError("This MFA challenge is no longer available. Sign in again.");
      return;
    }
    const normalized = code.trim();
    if ((!recoveryMode && !/^\d{6}$/.test(normalized)) || (recoveryMode && normalized.length < 16)) {
      setError(recoveryMode ? "Enter a complete recovery code." : "Enter the 6-digit authenticator code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await completeMfaSignIn(challengeToken, normalized, rememberDevice);
      navigate(user?.mustChangePassword ? "/change-password" : "/clusters", { replace: true });
    } catch (caught) {
      setError(
        caught?.status === 401
          ? caught.message
          : caught?.isNetwork
            ? "Cannot reach the Faultline API."
            : caught?.message || "MFA verification failed.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Faultline</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              {recoveryMode ? <KeyRound size={27} className="text-blue-600" /> : <ShieldCheck size={28} className="text-blue-600" />}
            </div>
            <h1 className="text-xl font-bold text-gray-900">Two-factor authentication</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {recoveryMode ? "Use one of the recovery codes saved during enrollment." : "Enter the current code from your authenticator app."}
              <br /><span className="font-semibold text-gray-700">{email}</span>
            </p>
          </div>
          {error && (
            <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={input}
              type="text"
              inputMode={recoveryMode ? "text" : "numeric"}
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(recoveryMode ? event.target.value.toUpperCase() : event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={recoveryMode ? "XXXX-XXXX-XXXX-XXXX" : "000000"}
              aria-label={recoveryMode ? "Recovery code" : "Authenticator code"}
              className="w-full h-14 text-center text-xl tracking-[0.3em] font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            <label className="flex items-start gap-2.5 cursor-pointer text-left">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600"
              />
              <span>
                <span className="block text-sm font-medium text-gray-700">Trust this device for {trustedDeviceTtlDays} days</span>
                <span className="block text-xs text-gray-500 mt-0.5">Skip the MFA code after entering your password on this browser.</span>
              </span>
            </label>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-60">
              {loading ? "Verifying…" : "Verify and sign in"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => { setRecoveryMode((value) => !value); setCode(""); setError(""); }}
            className="w-full mt-3 text-sm text-blue-600 hover:underline font-medium"
          >
            {recoveryMode ? "Use an authenticator code" : "Use a recovery code"}
          </button>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button type="button" onClick={() => navigate("/login", { replace: true })} className="text-sm text-gray-500 hover:text-gray-900 font-medium">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
