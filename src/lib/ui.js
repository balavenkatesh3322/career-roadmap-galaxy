// Small DOM helpers + the shared site header, footer and theme toggle.
import { inject } from '@vercel/analytics';

// Vercel Web Analytics (no-op outside Vercel deployments)
try { inject(); } catch { /* ignore */ }
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const REPO = 'https://github.com/balavenkatesh3322/career-roadmap-galaxy';

const ICON = {
  moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  gh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>',
  arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  left: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  ext: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
};
export { ICON };

const NAV = [
  ['galaxy', 'galaxy.html', 'Galaxy'],
  ['library', 'library.html', 'Library'],
  ['skills', 'skills.html', 'Skill match'],
  ['pivot', 'pivot.html', 'Pivot'],
  ['contribute', 'contribute.html', 'Contribute']
];

export function theme() { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; }
export function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('cg-theme', t); } catch { /* ignore */ }
  $$('[data-theme-toggle]').forEach(syncToggle);
  window.dispatchEvent(new CustomEvent('cg-theme', { detail: t }));
}
function syncToggle(btn) {
  const dark = theme() === 'dark';
  btn.innerHTML = `${dark ? ICON.sun : ICON.moon}<span class="hide-sm">${dark ? 'Light' : 'Dark'}</span>`;
  btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}

/** variant: 'over' (transparent over a hero) | 'solid' */
export function mountHeader(active, variant = 'solid') {
  const host = $('#site-header');
  if (!host) return;
  host.className = `site-header ${variant}`;
  host.innerHTML = `
    <a class="brand" href="./"><span class="logo" aria-hidden="true"><span class="sphere t-violet s28"></span><span class="ring-deco"></span></span>Career Galaxy</a>
    <span class="spacer hide-sm"></span>
    <nav class="site-nav ${variant === 'over' ? 'glass' : ''}" aria-label="Primary">
      ${NAV.map(([id, href, label]) => `<a href="${href}" ${id === active ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav>
    <span class="spacer"></span>
    <button type="button" class="ibtn" data-theme-toggle></button>
    <a class="ibtn gh" href="${REPO}" rel="noopener">${ICON.gh}<span class="hide-sm">GitHub</span></a>`;
  $$('[data-theme-toggle]', host).forEach((b) => { syncToggle(b); b.addEventListener('click', () => setTheme(theme() === 'dark' ? 'light' : 'dark')); });
}

export function mountFooter() {
  const f = $('#site-footer');
  if (!f) return;
  f.className = 'site-footer';
  f.innerHTML = `<span>Career Galaxy · open-source learning atlas · <a href="${REPO}">GitHub</a></span><span>Built with PixiJS 3D · Outfit · Roboto · Roboto Mono</span>`;
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
