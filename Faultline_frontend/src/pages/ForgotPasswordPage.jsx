import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Mail, Zap } from "lucide-react";
import { requestPasswordReset } from "../api/endpoints";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (caught) {
      setError(
        caught?.isNetwork
          ? "Cannot reach the Faultline API."
          : caught?.message || "Could not request a password reset.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame>
      <div className="mb-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Mail size={21} /></div>
        <h1 className="text-xl font-bold text-gray-900">Forgot your password?</h1>
        <p className="mt-1 text-sm text-gray-500">Enter your account email and we’ll send a single-use reset link.</p>
      </div>

      {sent ? (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>If an active account exists for that email, a reset link has been sent. Check your inbox and spam folder.</span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle size={14} />{error}</div>}
          <label className="block text-sm font-medium text-gray-700">Email address
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="you@company.io" />
          </label>
          <button disabled={busy || !email.trim()} className={primaryClass}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
      <div className="mt-5 border-t border-gray-100 pt-4 text-center"><Link to="/login" className="text-sm font-semibold text-blue-600 hover:underline">Back to sign in</Link></div>
    </AuthFrame>
  );
}

function AuthFrame({ children }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8] p-4"><div className="w-full max-w-md"><div className="mb-8 flex items-center justify-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg"><Zap size={20} className="text-white" fill="white" /></div><span className="text-2xl font-bold text-gray-900">Faultline</span></div><div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">{children}</div></div></div>;
}

const inputClass = "mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-2.5 font-normal focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";
const primaryClass = "w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60";
