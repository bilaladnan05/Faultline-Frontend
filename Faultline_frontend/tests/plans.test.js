import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, test } from "node:test";
import { getEntitlements } from "../src/api/endpoints.js";
import { FEATURES, clusterLimit, lockFor, planIncludes } from "../src/auth/plans.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

/** What `/billing/entitlements` answers for a Basic organization. */
const basic = {
  plan: "basic",
  planName: "Basic",
  enforced: true,
  limits: { clusters: 1 },
  features: ["clusters", "cluster-onboarding", "incidents", "alerts", "incident-ledger"].map((id) => ({ id })),
  locked: [
    { id: "team-management", label: "Team & Roles", requiredPlan: "pro", requiredPlanName: "Pro" },
    { id: "log-aggregator", label: "Runtime", requiredPlan: "pro", requiredPlanName: "Pro" },
    { id: "auto-remediation", label: "Remediation", requiredPlan: "enterprise", requiredPlanName: "Enterprise" },
  ],
};

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("the frontend's module ids match the backend's tiers", () => {
  // Basic, Pro and Enterprise modules, in the ids @faultline/billing enforces.
  assert.deepEqual(Object.values(FEATURES), [
    "clusters", "cluster-onboarding", "incidents", "alerts", "incident-ledger",
    "team-management", "integrations", "log-aggregator", "reporting", "voice-call-agent",
    "auto-remediation",
  ]);
});

test("a plan includes its own modules and locks the rest with the tier that unlocks them", () => {
  assert.ok(planIncludes(basic, FEATURES.INCIDENTS));
  assert.ok(!planIncludes(basic, FEATURES.LOG_AGGREGATOR));
  assert.equal(lockFor(basic, FEATURES.INCIDENTS), null);
  assert.equal(lockFor(basic, FEATURES.LOG_AGGREGATOR).requiredPlanName, "Pro");
  assert.equal(lockFor(basic, FEATURES.AUTO_REMEDIATION).requiredPlanName, "Enterprise");
  assert.equal(clusterLimit(basic), 1);
});

test("unknown or unenforced entitlements lock nothing, leaving the API to decide", () => {
  assert.ok(planIncludes(null, FEATURES.REPORTING));
  assert.ok(planIncludes({ ...basic, enforced: false }, FEATURES.REPORTING));
  assert.equal(lockFor(null, FEATURES.REPORTING), null);
  assert.equal(clusterLimit(null), null);
  assert.equal(clusterLimit({ ...basic, enforced: false }), null);
});

test("entitlements are read from the billing endpoint", async () => {
  globalThis.fetch = async (url, options) => {
    getEntitlements.last = { url: String(url), options };
    return new Response(JSON.stringify(basic), { status: 200, headers: { "content-type": "application/json" } });
  };
  assert.deepEqual(await getEntitlements(), basic);
  assert.equal(getEntitlements.last.url, "/api/billing/entitlements");
  assert.equal(getEntitlements.last.options.method, "GET");
});

test("the session loads the tier with the identity and exposes hasFeature", () => {
  const auth = read("src/auth/AuthContext.jsx");
  assert.match(auth, /if \(fresh\.mustChangePassword\) return;\s*const granted = await readEntitlements/);
  assert.match(auth, /session\.user\?\.mustChangePassword \? null : await readEntitlements\(\)/);
  assert.match(auth, /hasFeature: \(feature\) => planIncludes\(entitlements, feature\)/);
  assert.match(auth, /setEntitlements\(null\);/);
});

test("every Pro and Enterprise page is gated on its route", () => {
  const app = read("src/app/App.jsx");
  for (const [feature, page] of [
    ["AUTO_REMEDIATION", "PRIssuancePage"],
    ["INTEGRATIONS", "IntegrationsPage"],
    ["LOG_AGGREGATOR", "RuntimeMonitoringPage"],
    ["REPORTING", "ReportingPage"],
    ["VOICE_AGENT", "VoiceAgentPage"],
    ["TEAM_MANAGEMENT", "TeamRolesPage"],
  ])
    assert.match(
      app,
      new RegExp(`<RequireFeature feature=\\{FEATURES\\.${feature}\\}>\\s*<${page} />`),
      `${page} is gated by ${feature}`,
    );
  // Basic pages are on every plan and stay ungated.
  for (const page of ["AlertsPage", "LedgerPage", "IncidentDetailPage"])
    assert.match(app, new RegExp(`element=\\{<${page} />\\}`));
});

test("the Incident Ledger is the incidents list, and incident details remain", () => {
  const app = read("src/app/App.jsx");
  const detail = read("src/pages/IncidentDetailPage.jsx");
  assert.match(app, /path="incidents" element=\{<Navigate to="\/ledger" replace \/>\}/);
  assert.match(app, /path="incidents\/:id" element=\{<IncidentDetailPage \/>\}/);
  assert.doesNotMatch(app, /IncidentsListPage/);
  assert.match(detail, /navigate\('\/ledger'\)/);
});

test("the ledger carries the list's search, filters and live refresh", () => {
  const ledger = read("src/pages/LedgerPage.jsx");
  // Status and severity go to the API; the search narrows what is loaded.
  assert.match(ledger, /listIncidents\(\{ severity, status \}, \{ signal \}\),\s*\[severity, status\],\s*\{ pollMs: livePollMs \}/);
  assert.match(ledger, /aria-label="Filter by status"/);
  assert.match(ledger, /aria-label="Filter by severity"/);
  assert.match(ledger, /aria-label="Search incidents"/);
  assert.match(ledger, /<StaleBanner error=\{query\.data \? query\.error : null\}/);
  // Newest first, and every row still opens the incident's details page.
  assert.match(ledger, /Date\.parse\(b\.firstSeen\) - Date\.parse\(a\.firstSeen\)/);
  assert.match(ledger, /navigate\(`\/incidents\/\$\{encodeURIComponent\(entry\.id\)\}`\)/);
});

test("a locked module explains itself instead of rendering", () => {
  const guards = read("src/auth/guards.jsx");
  const locked = read("src/pages/PlanLockedPage.jsx");
  assert.match(guards, /hasFeature\(feature\) \? children : <PlanLockedPage feature=\{feature\} \/>/);
  assert.match(locked, /lockFor\(entitlements, feature\)/);
  assert.match(locked, /Ask your organization's administrator to upgrade/);
});

test("the sidebar marks every page with its module and locks what the plan lacks", () => {
  const sidebar = read("src/components/layout/Sidebar.jsx");
  const nav = sidebar.match(/const NAV = \{([\s\S]*?)\n\};/)?.[1];
  assert.ok(nav, "NAV is declared");
  const items = nav.split("\n").filter((line) => /^\s+\w+: \{ to:/.test(line));
  assert.equal(items.length, 12);
  for (
    const item of items.filter(
      (item) => !item.includes("security:") && !item.includes("audit:"),
    )
  )
    assert.match(item, /feature: FEATURES\.\w+ \}/);
  assert.match(nav, /security: \{ to: "\/security\/mfa"/);
  assert.match(nav, /audit: \{ to: "\/admin\/audit"/);
  assert.match(sidebar, /const lock = lockFor\(entitlements, feature\)/);
  assert.match(sidebar, /<Lock size=\{9\} \/> \{lock\.requiredPlanName\}/);
});

test("the Basic cluster allowance is shown before the form, and the API's refusal is shown as-is", () => {
  const page = read("src/pages/ClusterOnboardingPage.jsx");
  const form = read("src/components/clusters/ClusterOnboardingForm.jsx");
  const states = read("src/components/ui/AsyncState.jsx");
  assert.match(page, /const atLimit = limit !== null && Boolean\(clusters\.data\) && used >= limit/);
  assert.match(page, /atLimit \? \(\s*<ClusterLimitNotice/);
  assert.match(form, /caught\?\.status === 403 && !caught\?\.body\?\.requiredPlan/);
  assert.match(states, /error\.status === 403 && error\.body\?\.requiredPlanName/);
});
