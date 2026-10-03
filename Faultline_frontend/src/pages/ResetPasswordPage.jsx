import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Zap } from "lucide-react";
import { resetPassword } from "../api/endpoints";
import { PASSWORD_POLICY_HINT, passwordPolicyError } from "../auth/passwordPolicy";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const policyError = passwordPolicyError(password);
  const valid = token && password && !policyError && password === confirm && !busy;

  const submit = async (event) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      await resetPassword(token, password);
      setComplete(true);
    } catch (caught) {
      setError(
        caught?.isNetwork
          ? "Cannot reach the Faultline API."
          : caught?.message || "Could not reset the password.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg"><Zap size={20} className="text-white" fill="white" /></div><span className="text-2xl font-bold text-gray-900">Faultline</span></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><KeyRound size={21} /></div><h1 className="text-xl font-bold text-gray-900">Choose a new password</h1><p className="mt-1 text-sm text-gray-500">Reset links expire and can only be used once.</p></div>
          {complete ? (
            <div className="space-y-5"><div role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /><span>Your password has been reset. Existing sessions have been signed out.</span></div><Link to="/login" className={`${primaryClass} block text-center`}>Continue to sign in</Link></div>
          ) : !token ? (
            <div className="space-y-5"><div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" /><span>This reset link is missing its token. Request a new link.</span></div><Link to="/forgot-password" className={`${primaryClass} block text-center`}>Request another link</Link></div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle size={14} />{error}</div>}
              <PasswordField label="New password" value={password} onChange={setPassword} show={show} toggle={() => setShow((value) => !value)} />
              <p className={`text-xs ${policyError ? "text-red-600" : "text-gray-400"}`}>{policyError || PASSWORD_POLICY_HINT}</p>
              <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} show={show} />
              {confirm && confirm !== password && <p className="text-xs text-red-600">The passwords do not match.</p>}
              <button disabled={!valid} className={primaryClass}>{busy ? "Resetting…" : "Reset password"}</button>
            </form>
          )}
          {!complete && <div className="mt-5 border-t border-gray-100 pt-4 text-center"><Link to="/login" className="text-sm font-semibold text-blue-600 hover:underline">Back to sign in</Link></div>}
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, toggle }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<div className="relative mt-1.5"><input type={show ? "text" : "password"} autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 font-normal focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />{toggle && <button type="button" onClick={toggle} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>}</div></label>;
}

const primaryClass = "w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60";
