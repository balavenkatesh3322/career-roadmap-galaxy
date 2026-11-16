import '../styles/main.css';
import { $, $$, esc, ICON, REPO, mountHeader, mountFooter, toast } from '../lib/ui.js';
import { roadmaps, getRole, styleOf, roleUrl } from '../lib/data.js';
import index from '../data/library-index.json';
import content from '../data/library-content.json';

mountHeader('library', 'solid');
mountFooter();
$$('[data-icon]').forEach((el) => { el.innerHTML = ICON[el.dataset.icon] || ''; });

const SECTIONS = ['Languages', 'Web', 'Mobile', 'Infrastructure', 'Game dev', 'AI / Data', 'Security', 'Misc', 'Tools', 'Articles & books'];
const SECTION_TINT = { Languages: 't-blue', Web: 't-cyan', Mobile: 't-teal', Infrastructure: 't-orange', 'Game dev': 't-gold', 'AI / Data': 't-violet', Security: 't-pink' };
const STATUS = { imported: ['FULL ROADMAP', 'fresh'], visual: ['VISUAL MAP', 'accent'], thin: ['SHORT GUIDE', ''], 'permission-needed': ['OUR VERSION', 'accent'], article: ['OUR VERSION', 'accent'], review: ['IN REVIEW', 'new'] };
const LOCAL_KEY = 'cg-library-added';

function loadAdded() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; } }
let added = loadAdded();
const all = () => [...added.map((a) => ({ ...a, isNew: true })), ...index];

const state = { section: null, fresh: 'all', role: null, open: null, stage: 0 };
const yearClass = (y) => (y == null ? '' : y >= 2025 ? 'fresh' : y >= 2021 ? 'ok' : 'old');
const host = (u) => { try { return new URL(u).hostname.replace('www.', ''); } catch { return ''; } };
const info = (e) => (e.isNew ? { s: 'review', g: [] } : content[e.url] || { s: 'article', g: [] });

function filtered() {
  return all().filter((e) => (!state.section || e.section === state.section)
    && (state.fresh === 'all' || (state.fresh === 'fresh' ? e.year >= 2025 : !(e.year >= 2025)))
    && (!state.role || e.role === state.role));
}

function renderFilters() {
  const list = all();
  $('#lib-title').textContent = `${list.length} community roadmaps, mapped onto the galaxy`;
  $('#f-section').innerHTML = [['', 'All', list.length], ...SECTIONS.map((s) => [s, s, list.filter((e) => e.section === s).length])]
    .map(([v, l, n]) => `<button type="button" class="chip" aria-pressed="${(state.section || '') === v}" data-sec="${esc(v)}"><span class="sphere ${SECTION_TINT[l] || (v ? 't-pearl' : 't-violet')} s14"></span>${esc(l)}<span class="n">${n}</span></button>`).join('');
  $('#f-fresh').innerHTML = [['all', 'Any year'], ['fresh', '2025 – 2026'], ['older', 'Older or undated']].map(([v, l]) => `<button type="button" class="chip" aria-pressed="${state.fresh === v}" data-fresh="${v}">${l}</button>`).join('');
  const counts = {}; list.forEach((e) => { if (e.role) counts[e.role] = (counts[e.role] || 0) + 1; });
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 6);
  $('#f-role').innerHTML = top.map((id) => { const r = getRole(id); return `<button type="button" class="chip" aria-pressed="${state.role === id}" data-role="${id}"><span class="sphere ${styleOf(r.domain).tint} s14"></span>${esc(r.title)}<span class="n">${counts[id]}</span></button>`; }).join('');
  $$('[data-sec]').forEach((b) => b.addEventListener('click', () => { state.section = b.dataset.sec || null; render(); }));
  $$('[data-fresh]').forEach((b) => b.addEventListener('click', () => { state.fresh = b.dataset.fresh; render(); }));
  $$('[data-role]').forEach((b) => b.addEventListener('click', () => { state.role = state.role === b.dataset.role ? null : b.dataset.role; render(); }));
}

function renderGrid() {
  const items = filtered();
  $('#shown').textContent = `Showing ${items.length} of ${all().length}${state.role ? ` · linked to ${getRole(state.role).title}` : ''}`;
  $('#grid').innerHTML = items.map((e, i) => {
    const r = e.role ? getRole(e.role) : null;
    const st = STATUS[info(e).s] || STATUS.article;
    return `<button type="button" class="lcard" data-open="${esc(e.url)}" aria-label="Open ${esc(e.title)}">
      <div style="display:flex;align-items:center;gap:10px"><span class="sphere ${SECTION_TINT[e.section] || 't-pearl'} s28"></span><span class="cat" style="font-size:11px">${esc(e.section)}</span></div>
      <div class="t">${esc(e.title)}</div><p>${esc(e.desc)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${e.isNew ? '<span class="b new">NEW</span>' : ''}<span class="b ${yearClass(e.year)}">${e.year ?? 'UNDATED'}</span><span class="b">${esc(e.format.toUpperCase())}</span><span class="b ${st[1]}">${st[0]}</span></div>
      <span class="planetchip"><span class="sphere ${r ? styleOf(r.domain).tint : 't-pearl'} s14"></span>Helps you climb: ${esc(r ? r.title : 'any career')}</span></button>`;
  }).join('');
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => { state.open = b.dataset.open; state.stage = 0; renderDrawer(); }));
}

const NOTES = {
  imported: ['Full roadmap, inside Career Galaxy.', 'Read it here and tick topics on the matching career roadmap.'],
  visual: ['Visual roadmap.', 'The author drew this one as an image; key sections we could read are listed here. The full picture is on the original page.'],
  thin: ['Short guide.', 'This source is brief, so the matching Career Galaxy roadmap is shown with it.'],
  'permission-needed': ['Our version.', 'The author hasn’t published a licence, so we can’t copy their content. Here is our roadmap for the same career.'],
  article: ['Our version.', 'This is an article, so we show our roadmap for the same career.'],
  review: ['Waiting for review.', 'Showing our roadmap for this career until your addition is reviewed.']
};

function renderDrawer() {
  const e = all().find((x) => x.url === state.open);
  if (!e) { $('#drawer-host').innerHTML = ''; return; }
  const inf = info(e);
  const ours = e.role ? getRole(e.role) : roadmaps[0];
  const useOurs = !(inf.g && inf.g.length) || ['permission-needed', 'article', 'review'].includes(inf.s);
  const stages = useOurs ? ours.stages.map((s) => ({ t: s.title, k: s.topics, r: s.resources.map((x) => ({ t: x.title, u: x.url })) })) : inf.g;
  const i = Math.min(state.stage, stages.length - 1);
  const cur = stages[i] || { t: '', k: [], r: [] };
  const note = NOTES[inf.s] || NOTES.article;
  const isGh = /github\.com/.test(e.url);
  const credit = useOurs ? `Career Galaxy roadmap for ${ours.title} · inspired by the original` : `Credit: adapted from ${inf.a || 'the author'}${inf.l ? ` · ${inf.l} licence` : ''}`;
  $('#drawer-host').innerHTML = `
  <div class="drawer-bg" id="dbg">
    <section class="drawer" role="dialog" aria-modal="true" aria-labelledby="d-title">
      <header>
        <div style="display:flex;align-items:flex-start;gap:14px"><span class="sphere ${SECTION_TINT[e.section] || 't-pearl'} s48"></span>
          <div style="flex:1;min-width:0"><div class="cat" style="font-size:11px">${esc(e.section)}</div><h2 id="d-title" style="margin:4px 0 0;font:800 clamp(1.5rem,1.2rem + 1vw,1.9rem)/1.08 var(--font-display);letter-spacing:-.03em">${esc(e.title)}</h2></div>
          <button type="button" class="ibtn icon" id="d-close" aria-label="Close roadmap">✕</button></div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:12px;font-size:13px;color:var(--ink-2)">
          <span>${inf.a ? `By ${esc(inf.a)} · ${inf.l ? `${esc(inf.l)} licence` : 'no licence published'}` : `Original by ${esc(host(e.url))}`}</span>
          <a class="ibtn" style="min-height:34px;font-size:13px" href="${esc(e.url)}" target="_blank" rel="noopener">${isGh ? ICON.gh : ''}${isGh ? 'View on GitHub' : 'View original'} ${ICON.ext}</a>
          <span class="b ${yearClass(e.year)}">${e.year ?? 'UNDATED'}</span>${inf.st ? `<span class="b">★ ${inf.st}</span>` : ''}
        </div>
        <div class="note" style="background:${inf.s === 'imported' ? 'var(--ok-bg)' : 'var(--accent-soft)'}"><strong style="font-family:var(--font-display)">${note[0]}</strong> ${note[1]}</div>
      </header>
      <div class="body">
        <nav aria-label="Stages"><div class="cat" style="font-size:11px;padding:0 10px 6px">${useOurs ? 'CAREER GALAXY · ' : ''}${stages.length} ${stages.length === 1 ? 'STAGE' : 'STAGES'}</div>
          ${stages.map((s, k) => `<button type="button" class="dstage" data-st="${k}" ${k === i ? 'aria-current="step"' : ''}><span class="gem ${k < i ? 't-gold' : k === i ? 't-violet' : 't-pearl'}" style="width:16px;height:20px"></span>${esc(s.t)}</button>`).join('')}</nav>
        <div class="content">
          <h3 class="h3" style="font-size:24px">${esc(cur.t)}</h3>
          ${cur.k?.length ? `<div class="cat" style="font-size:11px;margin:18px 0 4px">Learn</div>${cur.k.map((t) => `<div class="ck" style="cursor:default"><span class="sphere t-pearl s14" style="margin-top:3px"></span>${esc(t)}</div>`).join('')}` : ''}
          ${cur.r?.length ? `<div class="cat" style="font-size:11px;margin:18px 0 8px">Resources</div><div style="display:flex;flex-direction:column;gap:6px">${cur.r.map((x) => `<a class="res" href="${esc(x.u)}" target="_blank" rel="noopener"><span style="flex:1;min-width:0">${esc(x.t)}<small>${esc(host(x.u))}</small></span>${ICON.ext}</a>`).join('')}</div>` : ''}
        </div>
      </div>
      <footer><span style="flex:1 1 240px;font-size:12px;line-height:1.5;color:var(--ink-3)">${esc(credit)} · <a href="${esc(e.url)}" target="_blank" rel="noopener" style="color:var(--accent-text);text-decoration:underline">${esc(e.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/blob\/.*$/, '').slice(0, 60))}</a></span>
        ${inf.s === 'permission-needed' && isGh ? `<a class="ibtn" href="${esc(e.url.replace(/\/$/, ''))}/issues/new?title=${encodeURIComponent('Could you add an open licence?')}&body=${encodeURIComponent('Hi! We would love to include this roadmap in Career Galaxy (an open-source 3D career atlas) with full credit. Would you consider adding an open licence such as MIT or CC BY 4.0? Thank you!')}" target="_blank" rel="noopener">Ask the author to share</a>` : ''}
        <a class="btn btn-p plain btn-sm" href="${roleUrl(ours.id)}">Climb ${esc(ours.title)} →</a></footer>
    </section>
  </div>`;
  const close = () => { state.open = null; $('#drawer-host').innerHTML = ''; };
  $('#d-close').addEventListener('click', close);
  $('#dbg').addEventListener('click', (ev) => { if (ev.target.id === 'dbg') close(); });
  $$('[data-st]').forEach((b) => b.addEventListener('click', () => { state.stage = +b.dataset.st; renderDrawer(); }));
  $('#d-close').focus();
}
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.open) { state.open = null; $('#drawer-host').innerHTML = ''; } });

// add a roadmap
$('#add-section').innerHTML = SECTIONS.map((s) => `<option${s === 'AI / Data' ? ' selected' : ''}>${s}</option>`).join('');
$('#add-role').innerHTML = roadmaps.map((r) => `<option value="${r.id}">${esc(r.title)}</option>`).join('');
$('#open-add').addEventListener('click', () => { $('#add-form').hidden = false; $('#add-form [name=url]').focus(); });
$('#close-add').addEventListener('click', () => { $('#add-form').hidden = true; });
$('#add-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const item = { title: f.get('title'), url: f.get('url'), section: f.get('section'), role: f.get('role'), year: new Date().getFullYear(), format: /github\.com/.test(f.get('url')) ? 'Repo' : 'Website', desc: 'Added by you · waiting for review.' };
  added = [item, ...added];
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(added)); } catch { /* ignore */ }
  ev.target.reset(); ev.target.hidden = true;
  Object.assign(state, { section: null, fresh: 'all', role: null });
  render();
  toast(`${item.title} added to your library`);
  const body = `**Link:** ${item.url}\n**Section:** ${item.section}\n**Helps you climb:** ${getRole(item.role)?.title}\n\nSubmitted from the Career Galaxy library.`;
  window.open(`${REPO}/issues/new?title=${encodeURIComponent(`Add roadmap: ${item.title}`)}&labels=library&body=${encodeURIComponent(body)}`, '_blank', 'noopener');
});

function render() { renderFilters(); renderGrid(); }
render();
