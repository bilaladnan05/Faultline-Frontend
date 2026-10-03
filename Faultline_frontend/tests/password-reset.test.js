import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, test } from "node:test";
import { requestPasswordReset, resetPassword } from "../src/api/endpoints.js";
import { passwordPolicyError } from "../src/auth/passwordPolicy.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const originalFetch = globalThis.fetch;

afterEach(() => { globalThis.fetch = originalFetch; });

test("password recovery endpoints are anonymous and send the expected payloads", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response(JSON.stringify({ message: "ok" }), { status: 200 });
  };
  await requestPasswordReset("owner@example.com");
  await resetPassword("opaque-token", "a new secure password phrase");
  assert.deepEqual(calls.map((call) => call.url), [
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ]);
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: "owner@example.com" });
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    token: "opaque-token",
    newPassword: "a new secure password phrase",
  });
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[1].options.headers.Authorization, undefined);
});

test("forgot and reset pages are public routes connected from sign in", () => {
  const app = read("src/app/App.jsx");
  const login = read("src/pages/LoginPage.jsx");
  const forgot = read("src/pages/ForgotPasswordPage.jsx");
  const reset = read("src/pages/ResetPasswordPage.jsx");
  assert.match(app, /path="\/forgot-password" element=\{<ForgotPasswordPage \/>\}/);
  assert.match(app, /path="\/reset-password" element=\{<ResetPasswordPage \/>\}/);
  assert.match(login, /navigate\("\/forgot-password"\)/);
  assert.match(forgot, /requestPasswordReset\(email\.trim\(\)\)/);
  assert.match(forgot, /If an active account exists/);
  assert.match(reset, /resetPassword\(token, password\)/);
  assert.match(reset, /passwordPolicyError\(password\)/);
});

test("new passwords require length, uppercase, lowercase, number, and symbol", () => {
  assert.equal(passwordPolicyError("Strong-password1!"), null);
  assert.match(passwordPolicyError("Short1!"), /12/);
  assert.match(passwordPolicyError("all-lowercase1!"), /uppercase/i);
  assert.match(passwordPolicyError("ALL-UPPERCASE1!"), /lowercase/i);
  assert.match(passwordPolicyError("Missing-number!"), /number/i);
  assert.match(passwordPolicyError("MissingSymbol1"), /symbol/i);
});
