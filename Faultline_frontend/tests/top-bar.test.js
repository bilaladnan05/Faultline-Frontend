import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("the shared top bar exposes working navigation controls", () => {
  const topBar = read("src/components/layout/TopBar.jsx");
  assert.match(topBar, /onSubmit=\{submitSearch\}/);
  assert.match(topBar, /navigate\(term \? `\/ledger\?search=/);
  assert.match(topBar, /onClick=\{\(\) => navigate\("\/alerts"\)\}/);
  assert.match(topBar, /aria-label="Breadcrumb"/);
  assert.match(topBar, /role="dialog"/);
  assert.match(topBar, /event\.key === "Escape"/);
});

test("global search is consumed by the incident ledger", () => {
  const ledger = read("src/pages/LedgerPage.jsx");
  assert.match(ledger, /useSearchParams\(\)/);
  assert.match(ledger, /searchParams\.get\("search"\)/);
});
