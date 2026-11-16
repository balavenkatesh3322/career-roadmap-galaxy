import '../styles/main.css';
import { $, $$, esc, ICON, mountHeader } from '../lib/ui.js';
import { domains, roadmaps, rolesIn, styleOf, getRole, roleUrl, param } from '../lib/data.js';
import { progress } from '../lib/progress.js';
import { createGalaxyMap } from '../scene/galaxyMap.js';

mountHeader('galaxy', 'solid');

let map = null;
let domainId = param('domain') || (getRole(param('role'))?.domain) || 'ai';
let roleId = param('role');

function renderDomains() {
  $('#domain-list').innerHTML = domains.map((d) => `<button type="button" class="dbtn" aria-pressed="${d.id === domainId}" data-d="${d.id}"><span class="sphere ${styleOf(d.id).tint} s18"></span>${esc(d.name)}<span class="n">${rolesIn(d.id).length}</span></button>`).join('');
  $$('#domain-list [data-d]').forEach((b) => b.addEventListener('click', () => selectDomain(b.dataset.d)));
}
function renderClimbs() {
  const started = progress.started().map(getRole).filter(Boolean);
  $('#climbs').innerHTML = started.length
    ? started.map((r) => { const c = progress.counts(r); return `<a class="dbtn" href="${roleUrl(r.id)}"><span class="sphere ${styleOf(r.domain).tint} s14"></span>${esc(r.title)}<span class="n">${c.pct}%</span></a>`; }).join('')
    : '<p class="muted" style="font-size:14px;margin:0 4px">Tick a topic on any roadmap and it shows up here.</p>';
}
function renderPanel() {
  const d = domains.find((x) => x.id === domainId);
  $('#d-tint').className = `sphere s48 ${styleOf(d.id).tint}`;
  $('#d-name').textContent = d.name;
  const roles = rolesIn(d.id);
  $('#role-list').innerHTML = roles.map((r) => `<button type="button" class="rbtn" aria-pressed="${r.id === roleId}" data-r="${r.id}"><span class="sphere ${r.id === roleId ? styleOf(d.id).tint : 't-pearl'} s14"></span>${esc(r.title)}${r.status === 'emerging' ? ' <span class="badge" style="margin-left:auto">new</span>' : ''}</button>`).join('');
  $$('#role-list [data-r]').forEach((b) => b.addEventListener('click', () => { if (map) map.pickRole(b.dataset.r); else selectRole(getRole(b.dataset.r)); }));
  const r = getRole(roleId);
  if (!r) { $('#role-detail').innerHTML = ''; return; }
  const c = progress.counts(r);
  $('#role-detail').innerHTML = `
    <div style="font:800 22px/1.15 var(--font-display);letter-spacing:-.02em">${esc(r.title)}</div>
    <p class="muted" style="margin:6px 0 12px;font-size:14px;line-height:1.5">${esc(r.summary)}</p>
    <div style="display:flex;gap:18px;font-size:13px;color:var(--ink-3)"><span><b style="display:block;font:700 20px var(--font-display);color:var(--ink)">${r.stages.length}</b>stages</span><span><b style="display:block;font:700 20px var(--font-display);color:var(--ink)">${esc(r.duration.split(' ')[0])}</b>${esc(r.duration.split(' ').slice(1, 2).join(' ') || 'time')}</span><span><b style="display:block;font:700 20px var(--font-display);color:var(--ink)">${c.pct}%</b>done</span></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">${(r.skills || []).slice(0, 6).map((s) => `<span class="rchip" style="font-size:12px;padding:6px 10px">${esc(s)}</span>`).join('')}</div>
    <a class="btn btn-p btn-sm" style="margin-top:16px;width:100%" href="${roleUrl(r.id)}">Fly in and climb ${ICON.arrow}</a>`;
}
function selectDomain(id, rid = null) {
  domainId = id; roleId = rid || rolesIn(id)[0]?.id;
  renderDomains(); renderPanel();
  map?.select(id, roleId);
  history.replaceState(null, '', `?domain=${id}${roleId ? `&role=${roleId}` : ''}`);
}
function selectRole(r) {
  if (!r) return;
  roleId = r.id; renderPanel();
  history.replaceState(null, '', `?domain=${domainId}&role=${roleId}`);
}

// search
$('#search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const hits = q ? roadmaps.filter((r) => (r.title + ' ' + (r.skills || []).join(' ') + ' ' + r.summary).toLowerCase().includes(q)).slice(0, 6) : [];
  $('#search-results').innerHTML = hits.map((r) => `<button type="button" class="dbtn" data-hit="${r.id}"><span class="sphere ${styleOf(r.domain).tint} s14"></span>${esc(r.title)}</button>`).join('');
  $$('#search-results [data-hit]').forEach((b) => b.addEventListener('click', () => { const r = getRole(b.dataset.hit); selectDomain(r.domain, r.id); }));
});

renderDomains(); renderPanel(); renderClimbs();
createGalaxyMap($('#scene'), {
  onDomain: (d) => { domainId = d.id; renderDomains(); },
  onRole: (r) => selectRole(r)
}).then((m) => {
  map = m;
  m?.select(domainId, roleId);
});
