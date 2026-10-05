/**
 * Subscription tiers, mirroring `@faultline/billing` on the backend.
 *
 * As with roles, these decide what the UI *shows*. The API refuses a module the plan
 * does not include on every request, whatever this file says, so a mistake here is a
 * cosmetic bug rather than a way in. The ids must match the backend's exactly.
 */

export const FEATURES = {
  // Basic
  CLUSTERS: "clusters",
  CLUSTER_ONBOARDING: "cluster-onboarding",
  INCIDENTS: "incidents",
  ALERTS: "alerts",
  INCIDENT_LEDGER: "incident-ledger",
  // Pro
  TEAM_MANAGEMENT: "team-management",
  INTEGRATIONS: "integrations",
  LOG_AGGREGATOR: "log-aggregator",
  REPORTING: "reporting",
  VOICE_AGENT: "voice-call-agent",
  // Enterprise
  AUTO_REMEDIATION: "auto-remediation",
};

/**
 * Whether the account's plan includes a module.
 *
 * Unknown entitlements (not loaded, or the request failed) and an unenforced deployment
 * both answer yes: the UI then offers the page and the API has the final word, which is
 * better than hiding everything whenever the entitlements call hiccups.
 */
export function planIncludes(entitlements, feature) {
  if (!entitlements || !entitlements.enforced) return true;
  return entitlements.features.some((entry) => entry.id === feature);
}

/** The locked entry for a module - its label and the tier that unlocks it - or null. */
export function lockFor(entitlements, feature) {
  if (planIncludes(entitlements, feature)) return null;
  return entitlements.locked.find((entry) => entry.id === feature) ?? null;
}

/** The cluster allowance, or null when unlimited or unknown. */
export function clusterLimit(entitlements) {
  if (!entitlements || !entitlements.enforced) return null;
  return entitlements.limits?.clusters ?? null;
}
