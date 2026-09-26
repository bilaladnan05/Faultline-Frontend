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

test("successful authentication enters an existing protected route", () => {
  assert.match(
    read("src/pages/LoginPage.jsx"),
    /location\.state\?\.from\?\.pathname \?\? "\/dashboard"/,
  );
});

test("the auth context's endpoint functions remain available", () => {
  const endpoints = read("src/api/endpoints.js");

  for (const name of ["login", "getCurrentUser", "logout", "changePassword"])
    assert.match(endpoints, new RegExp(`export const ${name} =`));
  assert.match(endpoints, /apiPost\("\/auth\/login"[\s\S]*auth: false/);
});

test("the public registration flow uses anonymous billing endpoints", () => {
  const endpoints = read("src/api/endpoints.js");

  for (const name of ["listPlans", "createCheckout", "getCheckoutStatus"])
    assert.match(endpoints, new RegExp(`export const ${name} =`));
  assert.match(endpoints, /"\/billing\/plans"[\s\S]*auth: false/);
  assert.match(endpoints, /"\/billing\/checkout"[\s\S]*auth: false/);
});
