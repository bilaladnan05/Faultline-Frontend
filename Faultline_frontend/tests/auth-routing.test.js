import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("the application mounts authentication and protects its operator routes", () => {
  const app = read("src/app/App.jsx");

  assert.match(app, /<AuthProvider>/);
  assert.match(app, /path="\/login" element=\{<LoginPage \/>\}/);
  assert.match(app, /<RequireAuth>[\s\S]*<AppLayout \/>/);
  assert.doesNotMatch(app, /path="login" element=\{<Navigate/);
});

test("the landing and registration flow remain publicly routable", () => {
  const app = read("src/app/App.jsx");
  const landing = read("src/pages/LandingPage.jsx");

  assert.match(app, /path="\/" element=\{<LandingPage \/>\}/);
  assert.match(app, /path="\/subscribe" element=\{<SubscribePage \/>\}/);
  assert.match(app, /path="\/subscription" element=\{<SubscriptionPage \/>\}/);
  assert.match(landing, /<Link to="\/subscription">Plans<\/Link>/);
  assert.match(app, /path="\/payment\/success"/);
  assert.match(app, /path="\/payment\/cancel"/);
});

test("successful authentication enters the user-scoped clusters view", () => {
  const login = read("src/pages/LoginPage.jsx");
  const deployments = read("src/pages/DeploymentsPage.jsx");
  assert.match(login, /user\?\.mustChangePassword[\s\S]*"\/change-password"[\s\S]*user\?\.mfaEnrollmentRequired[\s\S]*"\/security\/mfa"[\s\S]*"\/clusters"/);
  assert.match(login, /result\?\.mfaRequired/);
  assert.doesNotMatch(login, /location\.state\?\.from/);
  assert.match(read("src/app/App.jsx"), /path="clusters\/onboarding"/);
  assert.doesNotMatch(deployments, /<ClusterOnboardingPage/);
  assert.doesNotMatch(deployments, /clusters\.length === 0 && isAdmin/);
});

test("clusters replace dashboard as the authenticated landing tab", () => {
  const app = read("src/app/App.jsx");
  const sidebar = read("src/components/layout/Sidebar.jsx");

  assert.match(app, /path="clusters" element=\{<DeploymentsPage \/>\}/);
  assert.match(app, /path="dashboard" element=\{<Navigate to="\/clusters" replace \/>\}/);
  assert.match(app, /path="\*" element=\{<Navigate to="\/clusters" replace \/>\}/);
  assert.match(sidebar, /to: "\/clusters"[\s\S]*label: "Onboarded Clusters"/);
  assert.match(sidebar, /to: "\/clusters\/onboarding"[\s\S]*label: "Cluster Onboarding"/);
  assert.doesNotMatch(sidebar, /label: "Dashboard"/);
});

/** One role's `start` or `cluster` menu from the Sidebar's MENUS, as NAV keys. */
function menu(sidebar, role, mode) {
  const block = sidebar.match(new RegExp(`${role}: \\{([\\s\\S]*?)\\n  \\},`))?.[1];
  const list = block?.match(new RegExp(`${mode}: \\[([^\\]]*)\\]`))?.[1];
  return list ? [...list.matchAll(/NAV\.(\w+)/g)].map((match) => match[1]) : null;
}

test("each role starts on its own menu and switches to a cluster menu on Manage", () => {
  const sidebar = read("src/components/layout/Sidebar.jsx");
  const deployments = read("src/pages/DeploymentsPage.jsx");

  assert.deepEqual(menu(sidebar, "owner", "start"), ["clusters", "onboarding", "team", "audit", "subscription", "integrations", "security"]);
  // No separate incidents list: the Incident Ledger is the list.
  assert.deepEqual(menu(sidebar, "owner", "cluster"), [
    "alerts", "integrations", "runtime", "ledger", "reporting", "voiceAgent", "smsAgent", "team", "audit", "subscription", "security",
  ]);
  assert.deepEqual(menu(sidebar, "engineer", "start"), ["clusters", "security"]);
  assert.deepEqual(menu(sidebar, "engineer", "cluster"), [
    "alerts", "runtime", "ledger", "reporting", "security",
  ]);
  assert.doesNotMatch(sidebar, /to: "\/incidents"/);
  assert.match(sidebar, /const menu = isAdmin \? MENUS\.owner : MENUS\.engineer/);
  assert.match(sidebar, /audit: \{ to: "\/admin\/audit"/);
  assert.match(sidebar, /subscription: \{ to: "\/admin\/subscription"[\s\S]*label: "Subscription"/);
  assert.match(read("src/app/App.jsx"), /path="admin\/audit"[\s\S]*<RequireRole roles=\{\[ROLES\.ADMIN\]\}>[\s\S]*<AdminAuditPage/);
  assert.match(read("src/app/App.jsx"), /path="admin\/subscription"[\s\S]*<RequireRole roles=\{\[ROLES\.ADMIN\]\}>[\s\S]*<SubscriptionPage/);
  assert.match(sidebar, /const inCluster = Boolean\(activeProject\)/);
  assert.match(sidebar, /inCluster \? menu\.cluster : menu\.start/);

  // Manage opens the cluster; the switcher and the registry pages close it again.
  assert.match(deployments, /setActiveProject\(\{/);
  assert.match(deployments, /onClick=\{\(\) => open\(cluster, "\/ledger"\)\}/);
  assert.match(sidebar, /clearActiveProject\(\);\s*navigate\("\/clusters"\)/);
  assert.match(sidebar, /if \(ORGANIZATION_PATHS\.has\(pathname\)\) clearActiveProject\(\)/);
});

test("the sidebar shows who is signed in and lets them sign out", () => {
  const sidebar = read("src/components/layout/Sidebar.jsx");
  assert.match(sidebar, /const \{ user, isAdmin, signOut(, \w+)* \} = useAuth\(\)/);
  assert.match(sidebar, /roleLabel\(user\?\.role\)/);
  assert.match(sidebar, /onClick=\{handleSignOut\}[\s\S]*?<LogOut/);
  assert.match(sidebar, /clearActiveProject\(\);\s*await signOut\(\);\s*navigate\("\/login", \{ replace: true \}\)/);
});

test("admins can start a confirmed cluster uninstall and follow its job", () => {
  const endpoints = read("src/api/endpoints.js");
  const deployments = read("src/pages/DeploymentsPage.jsx");
  const dialog = read("src/components/clusters/UninstallClusterDialog.jsx");

  assert.match(endpoints, /export const startClusterUninstall/);
  assert.match(endpoints, /apiDelete\([\s\S]*cluster-onboarding\/clusters/);
  // Confirmed in an in-app dialog by typing the cluster name, not a browser prompt.
  assert.doesNotMatch(deployments, /window\.confirm/);
  assert.match(deployments, /onClick=\{\(\) => setConfirmingUninstall\(cluster\)\}/);
  assert.match(deployments, /<UninstallClusterDialog[\s\S]*onConfirm=\{uninstall\}/);
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /const matches = typed\.trim\(\) === name/);
  assert.match(dialog, /disabled=\{!matches\}/);
  assert.match(dialog, /if \(matches\) onConfirm\(cluster\)/);
  assert.match(deployments, /startClusterUninstall\(cluster\.clusterId\)/);
  assert.match(deployments, /getClusterOnboarding\(uninstallJob\.id/);
  assert.match(deployments, /\{isAdmin && \(/);
});

test("the auth context's endpoint functions remain available", () => {
  const endpoints = read("src/api/endpoints.js");

  for (const name of ["login", "getCurrentUser", "logout", "changePassword"])
    assert.match(endpoints, new RegExp(`export const ${name} =`));
  assert.match(endpoints, /apiPost\("\/auth\/login"[\s\S]*auth: false/);
});

test("frontend project hints do not give admins a cross-cluster bypass", () => {
  const roles = read("src/auth/roles.js");
  assert.match(roles, /\(user\.projectIds \?\? \[\]\)\.includes\(projectId\)/);
  assert.doesNotMatch(roles, /if \(isAdmin\(user\)\) return true/);
});

test("the public registration flow uses anonymous billing endpoints", () => {
  const endpoints = read("src/api/endpoints.js");

  for (const name of ["listPlans", "createCheckout", "getCheckoutStatus"])
    assert.match(endpoints, new RegExp(`export const ${name} =`));
  assert.match(endpoints, /"\/billing\/plans"[\s\S]*auth: false/);
  assert.match(endpoints, /"\/billing\/checkout"[\s\S]*auth: false/);
});
