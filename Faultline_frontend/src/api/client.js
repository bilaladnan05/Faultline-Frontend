/**
 * HTTP client for the Faultline API (faultline-backend/apps/api).
 *
 * Every backend read is a plain GET with query-string filters, so this layer only needs
 * URL building, a timeout, and error normalisation. The API distinguishes its failures
 * by status — 400 bad filter, 403 cluster outside scope, 404 missing, 503 storage
 * unavailable — and callers render different things for each, so the status is kept on
 * the thrown error rather than collapsed into a message.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
const TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000);

export class ApiError extends Error {
  constructor(message, { status = 0, url, body, cause } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.body = body;
    this.cause = cause;
  }

  /** The API is reachable but the dependency behind the endpoint is not. */
  get isUnavailable() {
    return this.status === 503;
  }

  /** No response at all: backend down, wrong proxy target, or aborted. */
  get isNetwork() {
    return this.status === 0;
  }

  get isNotFound() {
    return this.status === 404;
  }

  /** A filter the API rejected, or a cluster outside the configured query scope. */
  get isBadRequest() {
    return this.status === 400 || this.status === 403;
  }
}

/**
 * Serialises filters the way the API's validators read them.
 *
 * Arrays become comma-joined values because `optionalSeverities` and `parseMetricNames`
 * split on commas; `undefined`, `null` and `""` are dropped because the validators treat
 * an empty string as "filter not supplied".
 */
export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function readBody(response) {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Nest's exception filter puts the reason in `message`, sometimes as an array. */
function errorMessage(body, response) {
  const message = body && typeof body === "object" ? body.message : body;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message) return message;
  return `Request failed with status ${response.status}`;
}

export async function apiGet(path, params, { signal } = {}) {
  const url = `${BASE_URL}${path}${buildQuery(params)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (cause) {
    // A caller-driven abort is not a failure to report; let it propagate untouched.
    if (signal?.aborted) throw cause;
    throw new ApiError(
      controller.signal.aborted
        ? `Request to ${url} timed out after ${TIMEOUT_MS}ms`
        : `Cannot reach the Faultline API at ${url}`,
      { url, cause },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  const body = await readBody(response);
  if (!response.ok) {
    throw new ApiError(errorMessage(body, response), {
      status: response.status,
      url,
      body,
    });
  }
  return body;
}

export const apiBaseUrl = BASE_URL;
