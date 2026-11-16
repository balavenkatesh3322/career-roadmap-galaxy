// All roadmap data is plain JSON in /roadmaps. Every *.json file except index.json is one career.
// Adding a career = adding a file (plus its entry in index.json) — Vite picks it up automatically.
import index from '../../roadmaps/index.json';

const files = import.meta.glob('../../roadmaps/*.json', { eager: true, import: 'default' });

export const domains = index.domains;
export const skillList = index.skills;
const order = new Map(index.roles.map((r, i) => [r.id, i]));

export const roadmaps = Object.values(files)
  .filter((r) => r && r.id && Array.isArray(r.stages))
  .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));

export const byId = new Map(roadmaps.map((r) => [r.id, r]));
export const domainById = new Map(domains.map((d) => [d.id, d]));

// Visual tint per domain (CSS class + 3D colour)
export const DOMAIN_STYLE = {
  ai: { tint: 't-violet', color: 0x8b5cf6, ringed: true },
  data: { tint: 't-teal', color: 0x14b8a6 },
  software: { tint: 't-blue', color: 0x3b82f6 },
  infra: { tint: 't-orange', color: 0xf59e0b },
  security: { tint: 't-pink', color: 0xf43f72 },
  product: { tint: 't-gold', color: 0xf5b301 },
  frontier: { tint: 't-cyan', color: 0x22c3e6, ringed: true }
};
export const styleOf = (domainId) => DOMAIN_STYLE[domainId] || { tint: 't-pearl', color: 0xe9e4f7 };

export function rolesIn(domainId) {
  return roadmaps.filter((r) => r.domain === domainId);
}

export function getRole(id) {
  return byId.get(id) || null;
}

export function param(name, fallback = null) {
  return new URLSearchParams(location.search).get(name) ?? fallback;
}

export const roleUrl = (id) => `roadmap.html?role=${encodeURIComponent(id)}`;
