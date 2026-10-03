import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown, LoaderCircle, MessageSquareText, Pencil, PhoneCall, PhoneOff, Plus,
  RefreshCw, UserCheck, UserX, Users, X,
} from "lucide-react";
import {
  assignProject,
  createContact,
  createUser,
  listContacts,
  listUsers,
  unassignProject,
  updateContact,
  updateUser,
} from "../../api/endpoints";
import { useAuth } from "../../auth/AuthContext";
import { ROLES } from "../../auth/roles";
import { useApiResource } from "../../hooks/useApiResource";
import { AsyncSection } from "../ui/AsyncState";
import { PASSWORD_POLICY_HINT, passwordPolicyError } from "../../auth/passwordPolicy";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mirrors `normalizePhoneNumber` in @faultline/notifications, so a bad number is caught
// before the account exists rather than after.
const E164 = /^\+[1-9]\d{7,14}$/;
const normalizePhone = (value) => value.trim().replace(/[\s()-]/g, "");

/**
 * Onsite engineer accounts: create, list, edit, disable.
 *
 * The backend keeps an engineer as three records, and this card edits them together:
 *   - the user account (`/admin/users`), which signs in;
 *   - project assignments, which decide which clusters that account can see;
 *   - a notification contact linked by `userId`, which is the phone Retell calls.
 *
 * The phone number is compulsory and voice is always on: the API creates the account and
 * its contact in one request and refuses an engineer Retell could not call.
 *
 * There is no delete: the API disables accounts instead, which keeps the audit trail
 * pointing at a real user. Disabling also drops the engineer from every cluster's SRE
 * list (a database trigger does that), which the confirmation says.
 *
 * `clusters` is the signed-in admin's own list, so cluster access can only ever offer
 * clusters that admin manages.
 */
export default function OnsiteEngineersCard({ clusters }) {
  const { user: currentUser } = useAuth();
  const organizationId = currentUser?.organizationId;
  const users = useApiResource(({ signal }) => listUsers({ signal }), []);
  const contacts = useApiResource(({ signal }) => listContacts({ signal }), []);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  const engineers = useMemo(
    () =>
      (users.data?.items ?? [])
        .filter((entry) => entry.role === ROLES.ONSITE_ENGINEER)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users.data],
  );

  // One contact per engineer; an enabled one wins if several were ever linked.
  const contactFor = useMemo(() => {
    const byUser = new Map();
    for (const contact of contacts.data ?? []) {
      if (!contact.userId || contact.organizationId !== organizationId) continue;
      const current = byUser.get(contact.userId);
      if (!current || (!current.enabled && contact.enabled)) byUser.set(contact.userId, contact);
    }
    return (userId) => byUser.get(userId) ?? null;
  }, [contacts.data, organizationId]);

  const clusterName = useMemo(() => {
    const names = new Map(clusters.map((cluster) => [cluster.id, cluster.name ?? cluster.id]));
    return (id) => names.get(id) ?? id;
  }, [clusters]);

  /** Runs one change, reports the API's own answer, and re-reads what it touched. */
  const run = async (key, work, success) => {
    setBusy(key);
    setMessage(null);
    try {
      await work();
      setMessage({ type: "success", text: success });
      return true;
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.isForbidden
          ? "The API refused this: only administrators can manage engineers."
          : error?.message || "That change could not be saved.",
      });
      return false;
    } finally {
      // Refreshed on failure too: a create can succeed before its phone number fails.
      await Promise.all([users.refetch(), contacts.refetch()]);
      setBusy(null);
    }
  };

  /**
   * Saves the engineer's linked notification contact, creating it for an engineer added
   * before phone numbers were required. Voice is always on so Retell can call them.
   */
  const savePhone = async (userId, name, contact, { phone, smsEnabled }) => {
    const fields = { name, phoneNumber: phone, voiceEnabled: true, smsEnabled, enabled: true };
    if (contact) await updateContact(contact.id, fields);
    else await createContact({ ...fields, organizationId, userId, role: "ENGINEER" });
  };

  const create = (values) =>
    run(
      "create",
      () =>
        createUser({
          email: values.email,
          name: values.name,
          role: ROLES.ONSITE_ENGINEER,
          projectIds: values.projectIds,
          phoneNumber: values.phone,
          smsEnabled: values.smsEnabled,
        }),
      `${values.email} was added and first-time sign-in credentials were emailed.`,
    );

  const update = (engineer, contact, values) =>
    run(
      engineer.id,
      async () => {
        const changes = {
          ...(values.name !== engineer.name ? { name: values.name } : {}),
          ...(values.password ? { password: values.password } : {}),
        };
        if (Object.keys(changes).length) await updateUser(engineer.id, changes);
        await savePhone(engineer.id, values.name, contact, values);
      },
      `${engineer.email} was updated.`,
    );

  const toggleStatus = (engineer) => {
    const disabling = engineer.status === "active";
    if (
      disabling &&
      !window.confirm(
        `Disable ${engineer.name}?\n\nThey will no longer be able to sign in, and they are removed as an assigned SRE from every cluster. Enabling them again does not restore those SRE assignments.`,
      )
    )
      return;
    run(
      engineer.id,
      () => updateUser(engineer.id, { status: disabling ? "disabled" : "active" }),
      `${engineer.email} is now ${disabling ? "disabled" : "active"}.`,
    );
  };

  const grant = (engineer, projectId) =>
    run(
      engineer.id,
      () => assignProject(engineer.id, projectId),
      `${engineer.name} can now see ${clusterName(projectId)}.`,
    );

  const revoke = (engineer, projectId) =>
    run(
      engineer.id,
      () => unassignProject(engineer.id, projectId),
      `${engineer.name} can no longer see ${clusterName(projectId)}.`,
    );

  const editingEngineer =
    editing && editing !== "new" ? engineers.find((entry) => entry.id === editing) ?? null : null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users size={20} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Onsite Engineers</h2>
            <p className="mt-1 text-xs text-gray-500">
              Accounts that sign in to Faultline. Cluster access decides what each engineer can see; the
              phone number is where incident calls and SMS go.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              users.refetch();
              contacts.refetch();
            }}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={14} className={users.refreshing ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing("new");
              setMessage(null);
            }}
            disabled={editing === "new"}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={14} /> Add engineer
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`rounded-lg border px-3 py-2 text-sm ${
              message.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </p>
        )}

        {editing === "new" && (
          <EngineerForm
            key="new"
            clusters={clusters}
            busy={busy === "create"}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              if (await create(values)) setEditing(null);
            }}
          />
        )}

        {editingEngineer && (
          <EngineerForm
            key={editingEngineer.id}
            engineer={editingEngineer}
            contact={contactFor(editingEngineer.id)}
            clusters={clusters}
            busy={busy === editingEngineer.id}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              if (await update(editingEngineer, contactFor(editingEngineer.id), values)) setEditing(null);
            }}
          />
        )}

        <AsyncSection
          loading={users.loading}
          error={users.error}
          data={users.data}
          onRetry={users.refetch}
          loadingLabel="Loading engineers…"
          isEmpty={() => engineers.length === 0}
          emptyIcon={Users}
          emptyTitle="No onsite engineers yet"
          emptyHint="Add one with the button above. An engineer needs cluster access to see a cluster, and a phone number to be called about it."
        >
          {/* No overflow clipping here: the cluster access dropdown opens below its row. */}
          <div className="rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  {["Engineer", "Phone", "Cluster access", "Status", ""].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {engineers.map((engineer) => (
                  <EngineerRow
                    key={engineer.id}
                    engineer={engineer}
                    contact={contactFor(engineer.id)}
                    clusters={clusters}
                    busy={busy === engineer.id}
                    locked={Boolean(busy)}
                    onEdit={() => {
                      setEditing(engineer.id);
                      setMessage(null);
                    }}
                    onToggle={() => toggleStatus(engineer)}
                    onAccessChange={(projectId, granted) =>
                      granted ? grant(engineer, projectId) : revoke(engineer, projectId)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </AsyncSection>
      </div>
    </section>
  );
}

function EngineerRow({ engineer, contact, clusters, busy, locked, onEdit, onToggle, onAccessChange }) {
  const active = engineer.status === "active";
  const phone = contact?.enabled ? contact : null;

  return (
    <tr className="border-t border-gray-100 align-top">
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900">{engineer.name}</p>
        <p className="text-xs text-gray-500">{engineer.email}</p>
      </td>

      <td className="px-4 py-3">
        {phone ? (
          <>
            <p className="font-mono text-xs text-gray-700">{phone.phoneNumber}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {phone.voiceEnabled ? (
                <Channel icon={PhoneCall} label="Voice" />
              ) : (
                <span className="text-[10px] font-semibold text-amber-700">Voice off, cannot be called</span>
              )}
              {phone.smsEnabled && <Channel icon={MessageSquareText} label="SMS" />}
            </div>
          </>
        ) : (
          // Only engineers added before the phone number was required end up here.
          <span className="inline-flex items-center gap-1 text-xs text-amber-700">
            <PhoneOff size={12} /> No phone, cannot be called. Edit to add one.
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        <ClusterAccessDropdown
          label={`Cluster access for ${engineer.name}`}
          clusters={clusters}
          selected={engineer.projectIds ?? []}
          disabled={locked}
          onChange={onAccessChange}
        />
      </td>

      <td className="px-4 py-3">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
            active ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-100 text-gray-500"
          }`}
        >
          {engineer.status}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
          {busy && <LoaderCircle size={13} className="animate-spin text-gray-400" />}
          <button
            type="button"
            disabled={locked}
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={onToggle}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40 ${
              active ? "text-red-600 hover:text-red-700" : "text-green-700 hover:text-green-800"
            }`}
          >
            {active ? <><UserX size={13} /> Disable</> : <><UserCheck size={13} /> Enable</>}
          </button>
        </div>
      </td>
    </tr>
  );
}

/** One form for both create and edit; `engineer` present means edit. */
function EngineerForm({ engineer, contact, clusters, busy, onCancel, onSubmit }) {
  const editing = Boolean(engineer);
  const [form, setForm] = useState(() => ({
    name: engineer?.name ?? "",
    email: engineer?.email ?? "",
    password: "",
    phone: contact?.phoneNumber ?? "",
    smsEnabled: contact ? contact.smsEnabled : true,
    projectIds: [],
  }));
  const set = (key) => (event) => {
    const { type, checked, value } = event.target;
    setForm((prev) => ({ ...prev, [key]: type === "checkbox" ? checked : value }));
  };
  const setCluster = (id, granted) =>
    setForm((prev) => ({
      ...prev,
      projectIds: granted
        ? [...new Set([...prev.projectIds, id])]
        : prev.projectIds.filter((value) => value !== id),
    }));

  const phone = normalizePhone(form.phone);
  const emailError =
    !editing && form.email.trim() && !EMAIL.test(form.email.trim()) ? "Enter a valid email address." : null;
  const passwordError = editing ? passwordPolicyError(form.password) : null;
  const phoneError =
    phone && !E164.test(phone) ? "Use international format with the country code, e.g. +923001234567." : null;
  const valid =
    Boolean(form.name.trim()) &&
    (editing || EMAIL.test(form.email.trim())) &&
    !passwordError &&
    E164.test(phone);

  const submit = (event) => {
    event.preventDefault();
    if (!valid || busy) return;
    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone,
      smsEnabled: form.smsEnabled,
      projectIds: form.projectIds,
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">
          {editing ? `Edit ${engineer.name}` : "New onsite engineer"}
        </h3>
        <button type="button" onClick={onCancel} aria-label="Close" className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input value={form.name} onChange={set("name")} placeholder="Ahmed Khan" className={inputClass} />
        </Field>

        {editing ? (
          <Field label="Email address" hint="Email cannot be changed.">
            <p className="py-2 text-sm text-gray-700">{engineer.email}</p>
          </Field>
        ) : (
          <Field label="Email address" error={emailError} hint="They sign in with this address.">
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="ahmed@company.io"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
        )}

        {editing && (
          <Field
            label="New password"
            error={passwordError}
            hint={`Leave blank to keep the current password. ${PASSWORD_POLICY_HINT}`}
          >
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
        )}

        {!editing && (
          <div className="rounded-lg border border-blue-100 bg-white/70 px-4 py-3 text-sm text-blue-900">
            A secure temporary password will be generated automatically and emailed to the engineer.
            They must replace it when they first sign in.
          </div>
        )}

        <Field
          label="Phone number"
          error={phoneError}
          hint="Required. Retell calls this number about incidents, so include the country code."
        >
          <input
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+923001234567"
            autoComplete="off"
            required
            className={inputClass}
          />
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-xs text-gray-500" title="Required so Retell can call them">
              <input type="checkbox" checked readOnly disabled />
              Voice calls (always on)
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" checked={form.smsEnabled} onChange={set("smsEnabled")} disabled={!phone} />
              SMS
            </label>
          </div>
        </Field>
      </div>

      {!editing && (
        <Field
          label="Cluster access"
          hint="An engineer with no clusters can sign in but sees nothing. You can change this later in the table."
        >
          <div className="max-w-sm">
            <ClusterAccessDropdown
              label="Cluster access for the new engineer"
              clusters={clusters}
              selected={form.projectIds}
              onChange={setCluster}
            />
          </div>
        </Field>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!valid || busy}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy && <LoaderCircle size={14} className="animate-spin" />}
          {busy ? "Saving…" : editing ? "Save changes" : "Create engineer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Every cluster the signed-in admin manages, each with a checkbox. A tick or untick is
 * reported as `onChange(clusterId, granted)`; the caller decides whether that is an API
 * call (a table row) or form state (a new engineer).
 */
function ClusterAccessDropdown({ label, clusters, selected, disabled = false, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      const outside = event.type === "mousedown" && !rootRef.current?.contains(event.target);
      if (outside || (event.type === "keydown" && event.key === "Escape")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const names = new Map(clusters.map((cluster) => [cluster.id, cluster.name ?? cluster.id]));
  const chosen = selected.map((id) => names.get(id) ?? id);
  const summary =
    chosen.length === 0
      ? "No clusters, sees nothing"
      : chosen.length <= 2
        ? chosen.join(", ")
        : `${chosen[0]} +${chosen.length - 1} more`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full min-w-48 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-left text-xs hover:bg-gray-50"
      >
        <span className={`truncate ${chosen.length ? "font-medium text-gray-800" : "text-gray-400"}`}>{summary}</span>
        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1 w-full min-w-60 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {clusters.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">You have no onboarded clusters yet.</p>
          ) : (
            clusters.map((cluster) => (
              <label
                key={cluster.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(cluster.id)}
                  disabled={disabled}
                  onChange={(event) => onChange(cluster.id, event.target.checked)}
                  className="h-3.5 w-3.5"
                />
                <span className="truncate">{cluster.name ?? cluster.id}</span>
                {cluster.name && cluster.name !== cluster.id && (
                  <span className="ml-auto font-mono text-[10px] text-gray-400">{cluster.id}</span>
                )}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

function Channel({ icon: Icon, label }) {
  return (
    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
      <Icon size={10} className="mr-1 inline" />
      {label}
    </span>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";
