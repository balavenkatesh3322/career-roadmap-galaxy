#!/usr/bin/env node
// Checks every resource URL in /roadmaps. Some sites block bots (403); open those by hand.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, '..', 'roadmaps');
const urls = new Map();
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  d.stages.forEach((s) => s.resources.forEach((r) => urls.set(r.url, f)));
}
const list = [...urls.keys()];
const bad = [];
for (let i = 0; i < list.length; i += 10) {
  await Promise.all(list.slice(i, i + 10).map(async (u) => {
    try {
      const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (career-galaxy link check)' }, signal: AbortSignal.timeout(20000) });
      if (r.status >= 400 && r.status !== 403 && r.status !== 429) bad.push(`${r.status} ${u} (${urls.get(u)})`);
    } catch (e) { bad.push(`ERR ${u} (${urls.get(u)}) ${e.cause?.code || e.name}`); }
  }));
}
console.log(`checked ${list.length} links`);
if (bad.length) { bad.forEach((b) => console.log(`✗ ${b}`)); process.exit(1); }
console.log('✓ all links ok (403/429 treated as bot blocks)');
