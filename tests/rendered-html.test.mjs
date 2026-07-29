import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the SkillNova talent workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>SkillNova — AI Talent Intelligence<\/title>/i);
  assert.match(html, /Talent Intelligence/);
  assert.match(html, /Turn candidate evidence into a decision you can defend/);
  assert.match(html, /Scoring engine live/);
  assert.match(html, /10(?:<!-- -->)? candidates/);
  assert.match(html, /Job Matching/);
  assert.match(html, /Skill Verification/);
  assert.match(html, /Trust Center/);
  assert.match(html, /Explainable formulas/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("ships live evidence analysis and transparent calculations", async () => {
  const [page, engine, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/talent-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /api\.github\.com\/users/);
  assert.match(page, /pdfjs-dist\/legacy\/build\/pdf\.mjs/);
  assert.match(page, /new Worker/);
  assert.match(page, /new jsPDF/);
  assert.match(engine, /export function calculateTalentScore/);
  assert.match(engine, /export function calculateJobMatch/);
  assert.match(engine, /export function getAuthenticityScore/);
  assert.match(engine, /dimensions\.coding \* 0\.25/);
  assert.match(engine, /dimensions\.projectQuality \* 0\.2/);
  assert.match(engine, /dimensions\.problemSolving \* 0\.15/);
  assert.match(layout, /og\.png/);
  assert.match(packageJson, /"pdfjs-dist"/);
  assert.match(packageJson, /"jspdf"/);
});
