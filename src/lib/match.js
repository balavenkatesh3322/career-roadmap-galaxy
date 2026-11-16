// Skill matching between what a learner has and what a career needs (roadmap.skills).
import { roadmaps } from './data.js';

export function match(have, role) {
  const need = role.skills || [];
  const got = need.filter((s) => have.has(s));
  return { pct: need.length ? Math.round((got.length / need.length) * 100) : 0, have: got, miss: need.filter((s) => !have.has(s)) };
}

export function rank(have, roles = roadmaps) {
  return roles.map((r) => ({ role: r, ...match(have, r) })).sort((a, b) => b.pct - a.pct || a.miss.length - b.miss.length);
}

/** The missing skill that raises match across the most careers (weighted by how much of each career it covers). */
export function bestNextSkill(have, roles = roadmaps) {
  const score = new Map();
  for (const r of roles) {
    const need = r.skills || [];
    for (const s of need) if (!have.has(s)) score.set(s, (score.get(s) || 0) + 1 / need.length);
  }
  let best = null, bestScore = 0;
  for (const [s, v] of score) if (v > bestScore) { best = s; bestScore = v; }
  if (!best) return null;
  return { skill: best, careers: roles.filter((r) => (r.skills || []).includes(best)).length };
}

export const PRESETS = {
  'Backend dev': ['Python', 'SQL', 'Git', 'APIs', 'Docker', 'Testing', 'Linux'],
  'Data analyst': ['SQL', 'Python', 'Statistics', 'Excel', 'Data Visualization', 'Communication'],
  'Frontend dev': ['JavaScript', 'TypeScript', 'HTML & CSS', 'React', 'Git', 'Testing'],
  Student: ['Python', 'Git', 'HTML & CSS', 'Math']
};
