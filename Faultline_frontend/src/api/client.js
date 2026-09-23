/**
 * HTTP client for the Faultline API (faultline-backend/apps/api).
 *
 * Every request carries the bearer token the session holds, and the API decides what it
 * may see. The status codes this layer distinguishes are the ones the API uses to say
 * different things, and callers render different things for each, so the status is kept
 * on the thrown error rather than collapsed into a message:
 *
 *   400 bad filter          401 not signed in, or the session no longer opens anything
 *   403 outside your role or your project assignments
 *   404 no such thing - or, for a resource whose existence is itself private, no such
 *       thing as far as you are concerned
 *   409 refused because of a conflict   503 a dependency behind the endpoint is down
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
const TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000);

/**
 * The token every request is signed with.
 *
 * Held in a module variable rather than read from storage per request: the auth context
 * owns the session and pushes it here, so there is one writer and no chance of a stale
 * copy being picked up mid-flight.
 */
let accessToken = null;
let onUnauthorized = null;

export function setToken(token) {
  accessToken = token || null;
}

export function clearToken() {
  accessToken = null;
}

/** Registered by the auth context, so a 401 anywhere ends the session once. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

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

  get isUnauthenticated() {
    return this.status === 401;
  }

  /** The caller is known, but this project or action is not theirs. */
  get isForbidden() {
    return this.status === 403;
  }

  get isConflict() {
    return this.status === 409;
  }

  /** A filter the API rejected, or a cluster outside the caller's scope. */
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

async function request(method, path, { params, body, signal, auth = true } = {}) {
  const url = `${BASE_URL}${path}${buildQuery(params)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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

  const payload = await readBody(response);
  if (!response.ok) {
    // A 401 means this session no longer opens anything, wherever it happened. The
    // handler ends it once, centrally, instead of every screen having to notice.
    if (response.status === 401 && auth) onUnauthorized?.();
    throw new ApiError(errorMessage(payload, response), {
      status: response.status,
      url,
      body: payload,
    });
  }
  return payload;
}

export const apiGet = (path, params, options = {}) =>
  request("GET", path, { ...options, params });

export const apiPost = (path, body, options = {}) =>
  request("POST", path, { ...options, body: body ?? {} });

export const apiPatch = (path, body, options = {}) =>
  request("PATCH", path, { ...options, body: body ?? {} });

export const apiPut = (path, body, options = {}) =>
  request("PUT", path, { ...options, body: body ?? {} });

export const apiDelete = (path, options = {}) => request("DELETE", path, options);

export const apiBaseUrl = BASE_URL;
