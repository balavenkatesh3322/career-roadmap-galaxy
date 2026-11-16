#!/usr/bin/env node
// Validates every roadmap in /roadmaps. Run: npm run validate  (CI runs it on every PR)
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, '..', 'roadmaps');
const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
const errors = [], warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const domainIds = new Set(index.domains.map((d) => d.id));
const skills = new Set(index.skills);
const roleIds = new Set(index.roles.map((r) => r.id));
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

for (const r of index.roles) {
  if (!ID.test(r.id)) err('index.json', `bad id "${r.id}" (use kebab-case)`);
  if (!domainIds.has(r.domain)) err('index.json', `${r.id}: unknown domain "${r.domain}"`);
  if (!fs.existsSync(path.join(dir, `${r.id}.json`))) err('index.json', `${r.id}: missing roadmaps/${r.id}.json`);
}

const topicUse = new Map();
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json');
for (const f of files) {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { err(f, `invalid JSON: ${e.message}`); continue; }
  const id = f.replace(/\.json$/, '');
  if (d.id !== id) err(f, `"id" must be "${id}"`);
  if (!roleIds.has(id)) err(f, 'not listed in roadmaps/index.json');
  for (const k of ['title', 'domain', 'status', 'summary', 'duration']) if (!d[k] || typeof d[k] !== 'string') err(f, `missing "${k}"`);
  if (d.domain && !domainIds.has(d.domain)) err(f, `unknown domain "${d.domain}"`);
  if (!['stable', 'emerging'].includes(d.status)) err(f, '"status" must be "stable" or "emerging"');
  if (!Array.isArray(d.skills) || !d.skills.length) err(f, '"skills" must be a non-empty list');
  else d.skills.forEach((s) => { if (!skills.has(s)) err(f, `skill "${s}" is not in index.json "skills" (add it there or reuse an existing name)`); });
  (d.next || []).forEach((n) => { if (!roleIds.has(n)) err(f, `"next" points to unknown career "${n}"`); });
  if (!Array.isArray(d.stages) || d.stages.length < 4 || d.stages.length > 9) err(f, '"stages" must have 4–9 stages');
  (d.stages || []).forEach((s, i) => {
    const where = `stage ${i + 1}`;
    for (const k of ['title', 'duration', 'goal', 'project']) if (!s[k] || typeof s[k] !== 'string') err(f, `${where}: missing "${k}"`);
    if (!Array.isArray(s.topics) || s.topics.length < 3 || s.topics.length > 10) err(f, `${where}: needs 3–10 topics`);
    (s.topics || []).forEach((t) => topicUse.set(t.toLowerCase(), (topicUse.get(t.toLowerCase()) || 0) + 1));
    if (!Array.isArray(s.resources)) err(f, `${where}: "resources" must be a list (can be empty)`);
    (s.resources || []).forEach((r) => {
      if (!r.title || !r.url) err(f, `${where}: each resource needs "title" and "url"`);
      else if (!/^https:\/\//.test(r.url)) err(f, `${where}: resource url must start with https:// (${r.url})`);
    });
  });
  if (d.updated && !/^\d{4}-\d{2}-\d{2}$/.test(d.updated)) err(f, '"updated" must be YYYY-MM-DD');
  if (d.status === 'emerging' && d.updated && (Date.now() - Date.parse(d.updated)) / 864e5 > 120) warn(f, 'emerging roadmap not reviewed for 4+ months');
}

warnings.forEach((w) => console.warn(`⚠ ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`✗ ${e}`));
  console.error(`\n${errors.length} problem(s) in ${files.length} roadmaps.`);
  process.exit(1);
}
console.log(`✓ ${files.length} roadmaps valid · ${index.domains.length} domains · ${skills.size} skills · ${topicUse.size} distinct topics`);
