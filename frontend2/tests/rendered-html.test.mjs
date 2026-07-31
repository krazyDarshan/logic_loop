import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("build output includes the SkillNova authentication gateway", async () => {
  const [worker, page, layout] = await Promise.all([
    readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(worker, /vinext/);
  assert.match(page, /Connecting your talent workspace/);
  assert.match(page, /secure login/);
  assert.match(layout, /SkillNova — AI Talent Intelligence/);
  assert.doesNotMatch(page, /Your site is taking shape|Building your site/);
});

test("ships role routing, live evidence analysis, exports, and transparent calculations", async () => {
  const [page, candidateDashboard, evidenceClient, sessionRoute, engine, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/candidate-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/evidence-client.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/talent-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /CandidateDashboard/);
  assert.match(page, /RecruiterWorkspace/);
  assert.match(page, /RegistrationScreen/);
  assert.match(evidenceClient, /api\.github\.com\/users/);
  assert.match(evidenceClient, /pdfjs-dist\/legacy\/build\/pdf\.mjs/);
  assert.match(page, /new Worker/);
  assert.match(candidateDashboard, /new jsPDF/);
  assert.match(candidateDashboard, /Ranked for You/);
  assert.match(candidateDashboard, /Skill Gaps/);
  assert.match(candidateDashboard, /Resume & Portfolio/);
  assert.match(sessionRoute, /getChatGPTUser/);
  assert.match(sessionRoute, /account_profiles/);
  assert.match(engine, /export function calculateTalentScore/);
  assert.match(engine, /export function calculateJobMatch/);
  assert.match(engine, /export function getAuthenticityScore/);
  assert.match(engine, /dimensions\.coding \* 0\.25/);
  assert.match(engine, /dimensions\.projectQuality \* 0\.2/);
  assert.match(engine, /dimensions\.problemSolving \* 0\.15/);
  assert.match(engine, /semanticRelevance \* 0\.6 \+ skillCoverage \* 0\.4/);
  assert.match(layout, /og\.png/);
  assert.match(packageJson, /"pdfjs-dist"/);
  assert.match(packageJson, /"jspdf"/);
});
