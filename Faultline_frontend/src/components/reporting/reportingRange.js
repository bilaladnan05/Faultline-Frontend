export const REPORTING_RANGES = [
  { key: "24h", label: "Last 24 hours", durationMs: 24 * 60 * 60 * 1000, bucket: "hour" },
  { key: "7d", label: "Last 7 days", durationMs: 7 * 24 * 60 * 60 * 1000, bucket: "day" },
  { key: "30d", label: "Last 30 days", durationMs: 30 * 24 * 60 * 60 * 1000, bucket: "day" },
];

/** Creates the bounded ISO range expected by reporting APIs. */
export function createReportingRange(key, anchor = Date.now()) {
  const option = REPORTING_RANGES.find((candidate) => candidate.key === key) ?? REPORTING_RANGES[1];
  const to = new Date(anchor);
  if (!Number.isFinite(to.getTime())) throw new RangeError("Invalid reporting range anchor");
  return {
    key: option.key,
    label: option.label,
    bucket: option.bucket,
    from: new Date(to.getTime() - option.durationMs).toISOString(),
    to: to.toISOString(),
  };
}
