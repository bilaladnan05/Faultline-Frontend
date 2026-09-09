import { AlertTriangle, Inbox, Loader2, RefreshCw, WifiOff } from "lucide-react";

/**
 * Loading / error / empty states shared by every API-backed view.
 *
 * The API's failure modes mean different things to an operator, so they are not
 * flattened into one "something went wrong": an unreachable API is a local setup
 * problem, a 503 means Faultline is up but its storage is not, and a 400/403 means the
 * request itself was out of bounds. Each gets its own wording and its own remedy.
 */

export function LoadingState({ label = "Loading…", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-16 text-gray-400 ${className}`}>
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint, icon: Icon = Inbox, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-gray-400 ${className}`}>
      <Icon size={36} className="mb-3 opacity-30" />
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {hint && <p className="text-xs mt-1 text-gray-400 max-w-md text-center">{hint}</p>}
    </div>
  );
}

function describe(error) {
  if (!error) return { title: "Something went wrong", detail: null, icon: AlertTriangle };
  if (error.isNetwork) {
    return {
      title: "Cannot reach the Faultline API",
      detail:
        `${error.message}. Start the API (npm run start -w @faultline/api) and check ` +
        "VITE_API_PROXY_TARGET in the frontend .env.",
      icon: WifiOff,
    };
  }
  if (error.isUnavailable) {
    return {
      title: "Storage is unavailable",
      detail: `${error.message}. The API is running but its backing store (ClickHouse or PostgreSQL) is not answering.`,
      icon: AlertTriangle,
    };
  }
  if (error.status === 403) {
    return {
      title: "Cluster outside the authorized scope",
      detail: `${error.message}. Check TELEMETRY_QUERY_CLUSTER_SCOPE on the API.`,
      icon: AlertTriangle,
    };
  }
  if (error.status === 400) {
    return { title: "The API rejected this query", detail: error.message, icon: AlertTriangle };
  }
  if (error.isNotFound) {
    return { title: "Not found", detail: error.message, icon: Inbox };
  }
  return { title: "Request failed", detail: error.message, icon: AlertTriangle };
}

export function ErrorState({ error, onRetry, className = "" }) {
  const { title, detail, icon: Icon } = describe(error);
  return (
    <div className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}>
      <Icon size={32} className="text-red-400 mb-3" />
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {detail && <p className="text-xs text-gray-500 mt-1.5 max-w-lg leading-relaxed">{detail}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

/**
 * Renders the right state for a `useApiResource` result.
 * `isEmpty` is asked only once data has arrived, so an empty first page is not
 * confused with a failed one.
 */
export function AsyncSection({
  loading,
  error,
  data,
  onRetry,
  loadingLabel,
  isEmpty,
  emptyTitle = "Nothing to show",
  emptyHint,
  emptyIcon,
  children,
}) {
  if (loading && !data) return <LoadingState label={loadingLabel} />;
  if (error && !data) return <ErrorState error={error} onRetry={onRetry} />;
  if (data && isEmpty?.(data)) {
    return <EmptyState title={emptyTitle} hint={emptyHint} icon={emptyIcon} />;
  }
  if (!data) return <LoadingState label={loadingLabel} />;
  return children;
}

/** Small inline banner for a refresh that failed while stale data is still shown. */
export function StaleBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-2 rounded-lg">
      <AlertTriangle size={13} className="flex-shrink-0" />
      <span className="flex-1">Showing the last successful response — {describe(error).title.toLowerCase()}.</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-bold hover:underline flex-shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}
