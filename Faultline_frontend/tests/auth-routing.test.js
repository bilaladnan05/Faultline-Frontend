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

  assert.match(app, /path="\/" element=\{<LandingPage \/>\}/);
  assert.match(app, /path="\/subscribe" element=\{<SubscribePage \/>\}/);
  assert.match(app, /path="\/payment\/success"/);
  assert.match(app, /path="\/payment\/cancel"/);
});

test("successful authentication enters the user-scoped clusters view", () => {
  const login = read("src/pages/LoginPage.jsx");
  const deployments = read("src/pages/DeploymentsPage.jsx");
  assert.match(login, /navigate\(user\?\.mustChangePassword \? "\/change-password" : "\/clusters"/);
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

test("admins can start a confirmed cluster uninstall and follow its job", () => {
  const endpoints = read("src/api/endpoints.js");
  const deployments = read("src/pages/DeploymentsPage.jsx");

  assert.match(endpoints, /export const startClusterUninstall/);
  assert.match(endpoints, /apiDelete\([\s\S]*cluster-onboarding\/clusters/);
  assert.match(deployments, /window\.confirm/);
  assert.match(deployments, /startClusterUninstall\(cluster\.clusterId\)/);
  assert.match(deployments, /getClusterOnboarding\(uninstallJob\.id/);
  assert.match(deployments, /\{isAdmin && \(/);
});

test("cluster management exposes multi-select SRE call assignments to admins", () => {
  const deployments = read("src/pages/DeploymentsPage.jsx");
  assert.match(deployments, /isAdmin && clusters\.length > 0 && <AssignedSresModule/);
  assert.match(deployments, /<h2[^>]*>Assigned SREs<\/h2>/);
  assert.match(deployments, /<select multiple/);
  assert.match(deployments, /assignClusterSre\(clusterId, id\)/);
  assert.match(deployments, /unassignClusterSre\(clusterId, id\)/);
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
