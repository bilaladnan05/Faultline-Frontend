import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, test } from "node:test";
import { verifyMfaLogin } from "../src/api/endpoints.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const originalFetch = globalThis.fetch;

afterEach(() => { globalThis.fetch = originalFetch; });

test("MFA login submits the challenge and code without an access token", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "/api/auth/mfa/verify");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), {
      challengeToken: "challenge",
      code: "123456",
      rememberDevice: true,
    });
    assert.equal(options.headers.Authorization, undefined);
    return new Response(JSON.stringify({ accessToken: "token", user: {} }), { status: 200 });
  };
  assert.equal((await verifyMfaLogin("challenge", "123456", true)).accessToken, "token");
});

test("the real MFA pages are routed and never accept arbitrary six-digit input", () => {
  const app = read("src/app/App.jsx");
  const login = read("src/pages/MFAPage.jsx");
  const security = read("src/pages/MfaSecurityPage.jsx");
  const layout = read("src/components/layout/AppLayout.jsx");
  assert.match(app, /path="\/mfa" element=\{<MFAPage \/>\}/);
  assert.match(app, /path="\/security\/mfa"/);
  assert.match(app, /path="\/security\/mfa"[\s\S]*<AppLayout>[\s\S]*<MfaSecurityPage \/>/);
  assert.match(layout, /children \?\? <Outlet \/>/);
  assert.match(security, /<TopBar breadcrumbs=\{\["Account Security", "MFA"\]\} \/>/);
  assert.match(login, /completeMfaSignIn\(challengeToken, normalized, rememberDevice\)/);
  assert.match(login, /Trust this device for \{trustedDeviceTtlDays\} days/);
  assert.doesNotMatch(login, /enter any 6 digits|setTimeout\(/i);
  assert.match(security, /startMfaEnrollment/);
  assert.match(security, /finishMfaEnrollment/);
  assert.match(security, /recoveryCodes/);
  assert.match(security, /QRCode\.toDataURL\(value/);
  assert.match(security, /alt="QR code for adding Faultline to an authenticator app"/);
  assert.match(security, /The QR code is generated locally in this browser/);
  assert.match(security, /max-w-4xl space-y-6/);
});
