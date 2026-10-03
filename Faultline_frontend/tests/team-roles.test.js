import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, test } from "node:test";
import {
  assignProject,
  createUser,
  listUsers,
  unassignProject,
  updateUser,
} from "../src/api/endpoints.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function respond(body) {
  globalThis.fetch = async (url, options) => {
    respond.last = { url: String(url), options };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

test("user management endpoints hit the admin users routes", async () => {
  respond({ items: [], count: 0 });
  await listUsers();
  assert.equal(respond.last.url, "/api/admin/users");
  assert.equal(respond.last.options.method, "GET");

  const engineer = {
    email: "a@b.io",
    name: "A",
    role: "onsiteengineer",
    projectIds: ["booknest"],
    phoneNumber: "+923001234567",
    smsEnabled: true,
  };
  await createUser(engineer);
  assert.equal(respond.last.url, "/api/admin/users");
  assert.equal(respond.last.options.method, "POST");
  assert.deepEqual(JSON.parse(respond.last.options.body), engineer);

  await updateUser("user/1", { status: "disabled" });
  assert.equal(respond.last.url, "/api/admin/users/user%2F1");
  assert.equal(respond.last.options.method, "PATCH");
  assert.deepEqual(JSON.parse(respond.last.options.body), { status: "disabled" });
});

test("cluster access is granted and revoked per user and project", async () => {
  respond({});
  await assignProject("user/1", "prod/eu");
  assert.equal(respond.last.url, "/api/admin/users/user%2F1/projects/prod%2Feu");
  assert.equal(respond.last.options.method, "PUT");

  await unassignProject("user/1", "prod/eu");
  assert.equal(respond.last.url, "/api/admin/users/user%2F1/projects/prod%2Feu");
  assert.equal(respond.last.options.method, "DELETE");
});

test("team & roles is an admin-only route and sidebar entry", () => {
  const app = read("src/app/App.jsx");
  const sidebar = read("src/components/layout/Sidebar.jsx");
  // Admin only, and on Pro and above: role and plan are separate checks, both required.
  assert.match(
    app,
    /path="team"[\s\S]*?<RequireRole roles=\{\[ROLES\.ADMIN\]\}>\s*<RequireFeature feature=\{FEATURES\.TEAM_MANAGEMENT\}>\s*<TeamRolesPage \/>/,
  );
  const engineerMenus = sidebar.match(/engineer: \{([\s\S]*?)\n {2}\},/)?.[1];
  assert.ok(engineerMenus, "engineer menus are declared");
  assert.doesNotMatch(engineerMenus, /NAV\.team\b/);
});

test("team & roles manages engineers instead of listing contacts, schedules or SREs", () => {
  const page = read("src/pages/TeamRolesPage.jsx");
  const deployments = read("src/pages/DeploymentsPage.jsx");
  assert.match(page, /listClusters\(\{ signal \}\)/);
  assert.match(page, /<OnsiteEngineersCard clusters=\{clusterList\} \/>/);
  assert.doesNotMatch(page, /listContacts|listOnCallSchedules|AssignedSres/);
  assert.doesNotMatch(deployments, /AssignedSres|assignClusterSre|unassignClusterSre/);
});

test("cluster access is a dropdown of every cluster the admin manages", () => {
  const card = read("src/components/team/OnsiteEngineersCard.jsx");
  // The same dropdown serves the table row (API call per tick) and the create form.
  assert.equal(card.match(/<ClusterAccessDropdown\b/g)?.length, 2);
  assert.match(card, /granted \? grant\(engineer, projectId\) : revoke\(engineer, projectId\)/);
  assert.match(card, /clusters\.map\(\(cluster\) => \([\s\S]*?type="checkbox"[\s\S]*?onChange\(cluster\.id, event\.target\.checked\)/);
  assert.doesNotMatch(card, /FolderPlus|Select a cluster…/);
});

test("engineer create, edit, access and disable go through the API", () => {
  const card = read("src/components/team/OnsiteEngineersCard.jsx");
  assert.match(card, /createUser\(\{[\s\S]*role: ROLES\.ONSITE_ENGINEER/);
  assert.doesNotMatch(
    card.match(/const create = \(values\)[\s\S]*?const update =/)?.[0] ?? "",
    /password:/,
  );
  assert.match(card, /temporary password will be generated automatically and emailed/i);
  assert.match(card, /updateUser\(engineer\.id, changes\)/);
  assert.match(card, /updateUser\(engineer\.id, \{ status: disabling \? "disabled" : "active" \}\)/);
  assert.match(card, /assignProject\(engineer\.id, projectId\)/);
  assert.match(card, /unassignProject\(engineer\.id, projectId\)/);
  // The phone number is a notification contact linked to the user, which is what the
  // SRE resolver reads to place Retell calls.
  assert.match(card, /createContact\(\{ \.\.\.fields, organizationId, userId, role: "ENGINEER" \}\)/);
  assert.match(card, /window\.confirm/);
});

test("an engineer always has a callable phone number with voice on", () => {
  const card = read("src/components/team/OnsiteEngineersCard.jsx");
  // Sent with the account so the API creates both together, or neither.
  assert.match(card, /createUser\(\{[\s\S]*?phoneNumber: values\.phone,[\s\S]*?\}\)/);
  // The form cannot be submitted without a valid E.164 number, when adding or editing.
  assert.match(card, /!passwordError &&\s*E164\.test\(phone\);/);
  // Voice is fixed on; the old "clear the number to stop calls" path is gone.
  assert.match(card, /voiceEnabled: true, smsEnabled, enabled: true/);
  assert.match(card, /<input type="checkbox" checked readOnly disabled \/>/);
  assert.doesNotMatch(card, /enabled: false|set\("voiceEnabled"\)/);
});
