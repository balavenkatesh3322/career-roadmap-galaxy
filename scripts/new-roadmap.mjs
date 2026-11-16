#!/usr/bin/env node
// Scaffold a new career:  npm run new -- context-engineer "Context Engineer" ai [--emerging]
import fs from 'node:fs';
import path from 'node:path';

const [id, title, domain, ...flags] = process.argv.slice(2);
const dir = path.resolve(import.meta.dirname, '..', 'roadmaps');
const indexPath = path.join(dir, 'index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const usage = 'Usage: npm run new -- <id> "<Title>" <domain> [--emerging]\nDomains: ' + index.domains.map((d) => d.id).join(', ');

if (!id || !title || !domain) { console.error(usage); process.exit(1); }
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) { console.error('id must be kebab-case, e.g. context-engineer'); process.exit(1); }
if (!index.domains.some((d) => d.id === domain)) { console.error(`Unknown domain "${domain}".\n${usage}`); process.exit(1); }
const file = path.join(dir, `${id}.json`);
if (fs.existsSync(file)) { console.error(`${file} already exists`); process.exit(1); }

const status = flags.includes('--emerging') ? 'emerging' : 'stable';
const stage = (t, goal) => ({ title: t, duration: '3–4 weeks', goal, topics: ['TODO topic', 'TODO topic', 'TODO topic'], resources: [{ title: 'TODO resource', url: 'https://example.com' }], project: 'TODO: a small project that proves this stage' });
const roadmap = {
  id, title, domain, status,
  summary: 'TODO: one sentence on what this person does.',
  duration: '6–9 months',
  whatYouDo: ['TODO', 'TODO', 'TODO'],
  skills: ['Python'],
  next: [],
  updated: new Date().toISOString().slice(0, 10),
  stages: [
    stage('Foundations', 'TODO: the basics everyone in this role needs.'),
    stage('Core craft', 'TODO: the 2–3 skills that define the role.'),
    stage('Applied', 'TODO: real data, users or systems.'),
    stage('Scale & quality', 'TODO: testing, performance, reliability, security.'),
    stage('Specialise', 'TODO: pick a sub-track.'),
    stage('Professional', 'TODO: portfolio, communication, interviews.')
  ]
};
fs.writeFileSync(file, JSON.stringify(roadmap, null, 2) + '\n');
index.roles.push({ id, title, domain, status, summary: roadmap.summary });
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
console.log(`✓ created roadmaps/${id}.json and registered it in roadmaps/index.json`);
console.log('Next: replace the TODOs, reuse skill names from index.json "skills", then run npm run validate');
