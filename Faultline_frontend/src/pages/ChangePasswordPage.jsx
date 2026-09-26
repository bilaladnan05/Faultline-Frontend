import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ShieldAlert, AlertCircle, Eye, EyeOff, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

/** The API applies the same floor; checking here just avoids a wasted round trip. */
const MINIMUM_LENGTH = 12;

/**
 * Where a newly provisioned admin lands, and the only screen they can reach.
 *
 * The password they signed in with was generated for them and sent by email, which
 * means it has sat in at least one mailbox and possibly a mail server's logs. Until it
 * is replaced the account is confined — by the API on every request, not merely by this
 * redirect — so this page explains that rather than presenting an unexplained wall.
 *
 * It doubles as the ordinary "change my password" screen for admins who are not
 * confined, which is why the wording adapts instead of assuming.
 */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, mustChangePassword, changePassword, signOut } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const tooShort = form.next.length > 0 && form.next.length < MINIMUM_LENGTH;
  const mismatch = form.confirm.length > 0 && form.next !== form.confirm;
  const sameAsCurrent = form.next.length > 0 && form.next === form.current;
  const canSubmit =
    form.current.length > 0 &&
    form.next.length >= MINIMUM_LENGTH &&
    form.next === form.confirm &&
    !sameAsCurrent &&
    !busy;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!canSubmit) return;
    setBusy(true);
    try {
      await changePassword(form.current, form.next);
      // The context has already adopted the refreshed session, so the guards have
      // released by the time this navigation happens.
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(
        caught?.status === 401
          ? "That current password is not correct."
          : caught?.isNetwork
            ? "Cannot reach the service. Please try again."
            : caught?.message || "Could not change the password.",
      );
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
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
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Change password</h1>
            <p className="text-sm text-gray-500 mt-1">
              {mustChangePassword
                ? "For security, you must replace your temporary password before continuing."
                : "Choose a new password for your account."}
            </p>
          </div>

          {mustChangePassword && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2.5 rounded-lg mb-4">
              <ShieldAlert size={15} className="flex-shrink-0 mt-0.5" />
              <span>
                Your temporary password was sent by email, so it is not private. The
                rest of the application stays locked until you replace it.
              </span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field
              id="current-password"
              label={mustChangePassword ? "Temporary password" : "Current password"}
            >
              <input
                id="current-password"
                type={show ? "text" : "password"}
                value={form.current}
                onChange={set("current")}
                autoComplete="current-password"
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>

            <Field
              id="new-password"
              label="New password"
              error={
                tooShort
                  ? `At least ${MINIMUM_LENGTH} characters.`
                  : sameAsCurrent
                    ? "Must be different from your current password."
                    : null
              }
              hint={`At least ${MINIMUM_LENGTH} characters. A memorable phrase beats a short, complicated one.`}
            >
              <div className="relative">
                <input
                  id="new-password"
                  type={show ? "text" : "password"}
                  value={form.next}
                  onChange={set("next")}
                  autoComplete="new-password"
                  aria-invalid={tooShort || sameAsCurrent}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  aria-label={show ? "Hide passwords" : "Show passwords"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <Field
              id="confirm-password"
              label="Confirm new password"
              error={mismatch ? "The two passwords do not match." : null}
            >
              <input
                id="confirm-password"
                type={show ? "text" : "password"}
                value={form.confirm}
                onChange={set("confirm")}
                autoComplete="new-password"
                aria-invalid={mismatch}
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Change password"
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 truncate">
              {user?.username ? `Signed in as ${user.username}` : user?.email}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400";

function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}
