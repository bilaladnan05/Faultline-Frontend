import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Copy, Download, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import {
  disableMfa,
  finishMfaEnrollment,
  getMfaStatus,
  regenerateMfaRecoveryCodes,
  startMfaEnrollment,
} from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";

export default function MfaSecurityPage() {
  const navigate = useNavigate();
  const { user, refreshUser, signOut } = useAuth();
  const [status, setStatus] = useState(null);
  const [setup, setSetup] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    const current = await getMfaStatus();
    setStatus(current);
    return current;
  };

  useEffect(() => {
    let cancelled = false;
    getMfaStatus()
      .then((current) => { if (!cancelled) setStatus(current); })
      .catch((caught) => {
        if (!cancelled) setError(caught?.message || "Could not load MFA settings.");
      });
    return () => { cancelled = true; };
  }, []);

  const run = async (work) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (caught) {
      setError(
        caught?.isNetwork
          ? "Cannot reach the Faultline API."
          : caught?.message || "The MFA operation failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const begin = (event) => {
    event.preventDefault();
    run(async () => {
      const enrollment = await startMfaEnrollment(password);
      setSetup(enrollment);
      setCode("");
      setPassword("");
    });
  };

  const verifyEnrollment = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await finishMfaEnrollment(setup.enrollmentToken, code);
      setRecoveryCodes(result.recoveryCodes);
      setSetup(null);
      setCode("");
      await loadStatus();
      await refreshUser();
      setMessage("MFA is now enabled. Save the recovery codes before leaving this page.");
    });
  };

  const disable = (event) => {
    event.preventDefault();
    run(async () => {
      await disableMfa(password, code);
      setPassword("");
      setCode("");
      setRecoveryCodes(null);
      await loadStatus();
      await refreshUser();
      setMessage("MFA has been disabled for your account.");
    });
  };

  const regenerate = () => {
    run(async () => {
      const result = await regenerateMfaRecoveryCodes(password, code);
      setRecoveryCodes(result.recoveryCodes);
      setPassword("");
      setCode("");
      await loadStatus();
      setMessage("Previous recovery codes are invalid. Save the new set now.");
    });
  };

  const leave = () => navigate("/clusters", { replace: true });
  const logout = async () => { await signOut(); navigate("/login", { replace: true }); };

  if (!status) {
    return <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 text-sm text-gray-500">{error || "Loading MFA settings…"}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] px-4 py-10">
      <main className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Account security</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Multi-factor authentication</h1>
            <p className="mt-1 text-sm text-gray-500">Protect {user?.email} with a time-based authenticator code.</p>
          </div>
          <ShieldCheck size={38} className={status.enabled ? "text-green-600" : "text-gray-300"} />
        </div>

        {error && <Notice error>{error}</Notice>}
        {message && <Notice>{message}</Notice>}

        {recoveryCodes && (
          <RecoveryCodes codes={recoveryCodes} />
        )}

        {!status.enabled && !setup && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-gray-900">Set up an authenticator app</h2>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-600">
              <li>Confirm your current password.</li>
              <li>Add the generated key to Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app.</li>
              <li>Verify one code and save the one-time recovery codes.</li>
            </ol>
            {status.required && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Your administrator requires MFA. Other application features remain locked until setup is complete.
              </div>
            )}
            <form onSubmit={begin} className="mt-5 space-y-3">
              <PasswordField value={password} onChange={setPassword} />
              <PrimaryButton disabled={busy || !password}>Begin setup</PrimaryButton>
            </form>
          </section>
        )}

        {setup && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-gray-900">Add Faultline to your authenticator</h2>
            <p className="mt-2 text-sm text-gray-600">Choose “enter setup key” in your app and use this secret:</p>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-white">
              <code className="flex-1 break-all text-sm font-bold tracking-wider">{setup.secret}</code>
              <CopyButton text={setup.secret} label="Copy secret" />
            </div>
            <p className="mt-3 text-xs text-gray-500">Type: time based · Algorithm: SHA-1 · Digits: 6 · Period: 30 seconds</p>
            <a href={setup.authenticatorUri} className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline">Open in an authenticator app</a>
            <form onSubmit={verifyEnrollment} className="mt-5 space-y-3">
              <CodeField value={code} onChange={setCode} label="Current 6-digit code" />
              <PrimaryButton disabled={busy || !/^\d{6}$/.test(code)}>Verify and enable MFA</PrimaryButton>
            </form>
          </section>
        )}

        {status.enabled && !recoveryCodes && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-green-50 p-2 text-green-700"><CheckCircle2 size={20} /></div>
              <div>
                <h2 className="font-bold text-gray-900">MFA is enabled</h2>
                <p className="mt-1 text-sm text-gray-500">{status.recoveryCodesRemaining} recovery codes remain.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <PasswordField value={password} onChange={setPassword} />
              <CodeField value={code} onChange={setCode} label="Authenticator or recovery code" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={regenerate} disabled={busy || !password || !code} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50">Generate new recovery codes</button>
              {!status.required && (
                <button type="button" onClick={disable} disabled={busy || !password || !code} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Disable MFA</button>
              )}
            </div>
          </section>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={logout} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900"><LogOut size={14} /> Sign out</button>
          {(status.enabled || !status.required) && <button type="button" onClick={leave} className="text-sm font-semibold text-blue-600 hover:underline">Continue to Faultline</button>}
        </div>
      </main>
    </div>
  );
}

function RecoveryCodes({ codes }) {
  const text = codes.join("\n");
  const download = () => {
    const blob = new Blob([`Faultline MFA recovery codes\n\n${text}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "faultline-mfa-recovery-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <KeyRound size={20} className="mt-0.5 text-amber-700" />
        <div><h2 className="font-bold text-amber-950">Save these recovery codes now</h2><p className="mt-1 text-sm text-amber-800">Each code works once. Faultline cannot display this set again.</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white p-4 font-mono text-sm font-bold text-gray-800">
        {codes.map((value) => <span key={value}>{value}</span>)}
      </div>
      <div className="mt-3 flex gap-3">
        <CopyButton text={text} label="Copy all" dark />
        <button type="button" onClick={download} className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900"><Download size={13} /> Download</button>
      </div>
    </section>
  );
}

function CopyButton({ text, label, dark = false }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return <button type="button" onClick={copy} className={dark ? "flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900" : "text-gray-300 hover:text-white"}><Copy size={13} /> {copied ? "Copied" : label}</button>;
}

function PasswordField({ value, onChange }) {
  return <label className="block text-sm font-semibold text-gray-700">Current password<input type="password" autoComplete="current-password" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>;
}

function CodeField({ value, onChange, label }) {
  return <label className="block text-sm font-semibold text-gray-700">{label}<input type="text" autoComplete="one-time-code" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-mono font-normal tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>;
}

function PrimaryButton({ children, disabled }) {
  return <button type="submit" disabled={disabled} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{children}</button>;
}

function Notice({ children, error = false }) {
  return <div role={error ? "alert" : "status"} className={`mb-5 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}{children}</div>;
}
