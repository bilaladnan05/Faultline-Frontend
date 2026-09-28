import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("the onboarding route renders the reusable cluster form", () => {
  const app = read("src/app/App.jsx");
  const page = read("src/pages/ClusterOnboardingPage.jsx");

  assert.match(app, /path="clusters\/onboarding"/);
  assert.match(page, /import ClusterOnboardingForm/);
  // Re-reads the cluster count on success, so a plan's allowance is shown as soon as
  // the last permitted cluster is connected.
  assert.match(page, /<ClusterOnboardingForm onSuccess=\{clusters\.refetch\} \/>/);
  assert.doesNotMatch(page, /startClusterOnboarding|setClusterName|<form/);
});

test("successful onboarding resets the reusable form and reports success", () => {
  const form = read("src/components/clusters/ClusterOnboardingForm.jsx");

  assert.match(form, /next\.status === "succeeded"/);
  assert.match(form, /setClusterName\(""\)/);
  assert.match(form, /setControlPlaneIp\(""\)/);
  assert.match(form, /setJob\(null\)/);
  assert.match(form, /showToast\(message\)/);
  assert.match(form, /role="status"/);
  assert.match(form, /onSuccess\?\.\(next\)/);
  assert.doesNotMatch(form, /useNavigate|navigate\(/);
});
