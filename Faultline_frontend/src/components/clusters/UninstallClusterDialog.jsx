import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

/**
 * Confirms a cluster uninstall by making the admin type the cluster's name, so a
 * misclick on the wrong card cannot remove Faultline from a cluster.
 *
 * Rendered into `document.body` so no card or scroll container can clip it. Escape,
 * the close button, Cancel and a backdrop click all dismiss it without doing anything.
 */
export default function UninstallClusterDialog({ cluster, onCancel, onConfirm }) {
  const [typed, setTyped] = useState("");
  const titleId = useId();
  const inputId = useId();
  const name = cluster.name || cluster.clusterId;
  const matches = typed.trim() === name;

  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onCancel]);

  const submit = (event) => {
    event.preventDefault();
    if (matches) onConfirm(cluster);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-sm font-bold text-gray-900">
              Uninstall Faultline from {name}?
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              This removes Faultline collectors and its cluster registration. Your application
              workloads are not changed.
            </p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 px-5 py-4">
          <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700">
            Type <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-900">{name}</span> to confirm
          </label>
          <input
            id={inputId}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder={name}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm placeholder:text-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex justify-end gap-2 rounded-b-xl border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!matches}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={13} /> Uninstall cluster
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
