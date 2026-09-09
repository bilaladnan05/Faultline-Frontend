/**
 * Time-window helpers.
 *
 * Every telemetry read must name a bounded window — the API refuses to default one —
 * and it enforces a maximum range (24h for logs and Kubernetes events, 7d for metrics,
 * per TELEMETRY_QUERY_MAX_*_RANGE_MS). The ranges offered here stay inside those
 * defaults so a picker cannot produce a request the API will reject.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** Ranges valid for logs and Kubernetes events (max 24h). */
export const EVENT_RANGES = [
  { key: "15m", label: "15m", durationMs: 15 * MINUTE_MS },
  { key: "1h", label: "1h", durationMs: HOUR_MS },
  { key: "6h", label: "6h", durationMs: 6 * HOUR_MS },
  { key: "24h", label: "24h", durationMs: DAY_MS },
];

/** Ranges valid for metrics (max 7d). */
export const METRIC_RANGES = [
  ...EVENT_RANGES,
  { key: "7d", label: "7d", durationMs: 7 * DAY_MS },
];

export function findRange(ranges, key) {
  return ranges.find((range) => range.key === key) ?? ranges[0];
}

/**
 * A window ending now.
 *
 * `endTime` is rounded up to the next whole second so a polling view does not send a
 * different microsecond boundary on every tick.
 */
export function windowEndingNow(durationMs) {
  const end = Math.ceil(Date.now() / 1000) * 1000;
  return {
    startTime: new Date(end - durationMs).toISOString(),
    endTime: new Date(end).toISOString(),
  };
}

/** A window around a fixed instant, clamped so it never runs past `now`. */
export function windowAround(instantIso, { leadMs = 5 * MINUTE_MS, trailMs = 5 * MINUTE_MS } = {}) {
  const centre = Date.parse(instantIso);
  if (!Number.isFinite(centre)) return windowEndingNow(HOUR_MS);
  const end = Math.min(centre + trailMs, Date.now());
  return {
    startTime: new Date(centre - leadMs).toISOString(),
    endTime: new Date(Math.max(end, centre - leadMs + MINUTE_MS)).toISOString(),
  };
}

/**
 * Bucket width that keeps a range under the API's 1000-bucket ceiling while producing
 * a readable number of points. Rounded to whole seconds — the minimum the API accepts.
 */
export function bucketForRange(durationMs, targetPoints = 60) {
  const raw = Math.ceil(durationMs / targetPoints / 1000) * 1000;
  return Math.max(1000, raw);
}
