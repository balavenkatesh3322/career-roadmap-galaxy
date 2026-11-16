import '../styles/main.css';
import { $, $$, esc, ICON, mountHeader, mountFooter, reducedMotion } from '../lib/ui.js';
import { domains, roadmaps, rolesIn, styleOf, getRole, roleUrl, param } from '../lib/data.js';
import { progress } from '../lib/progress.js';
import { match } from '../lib/match.js';
import { cardsFor } from '../lib/cards.js';
import { createOrbit } from '../scene/orbit.js';
import { createClimb } from '../scene/climb.js';
import { createRing } from '../scene/ring.js';
import libraryIndex from '../data/library-index.json';

mountHeader('', 'over');
mountFooter();
$$('[data-icon]').forEach((el) => { el.innerHTML = ICON[el.dataset.icon] || ''; });

// ---------- stats ----------
$('#pill-text').textContent = `${roadmaps.length} CAREERS · ${domains.length} DOMAINS · FREE`;
$('#stats').innerHTML = [
  [roadmaps.length, 'career roadmaps'], [libraryIndex.length, 'community guides'], [domains.length, 'domains, one galaxy'], ['1 file', 'to add a new field']
].map(([n, l]) => `<div class="stat"><b class="grad-l">${n}</b><span>${l}</span></div>`).join('');

// ---------- hero ----------
const hero = $('#hero');
const spotCard = $('#spot-card');
let orbit = null;
let paused = reducedMotion();

function setHero(a, b, sub) { $('#h1a').textContent = a; $('#h1b').textContent = b; $('#hero-sub').textContent = sub; }

function showSpot(domain, roles) {
  const st = styleOf(domain.id);
  const role = roles[0];
  $('#spot-tint').className = `sphere s28 ${st.tint}`;
  $('#spot-role').textContent = role ? role.title : domain.name;
  $('#spot-path').innerHTML = (role?.stages || []).slice(0, 4).map((s, i) => `<div><span class="gem ${i === 0 ? 't-gold' : 't-pearl'}"></span>${esc(s.title)}</div>`).join('');
  $("#spot-go").textContent = `Fly to ${domain.short} →`;
  $('#spot-go').onclick = () => orbit?.focus(domains.indexOf(domain));
}

function onFocus(domain, roles) {
  const focused = !!domain;
  hero.classList.toggle('focus', focused);
  $('#crumbs').hidden = !focused;
  spotCard.hidden = focused;
  $('#hero-pill').hidden = focused;
  $('#hero-actions').hidden = focused;
  $('#role-card').hidden = true;
  $('#crumb-sep2').hidden = $('#crumb-role').hidden = true;
  $('#scene-hint').textContent = focused ? 'click a moon to open a career' : 'drag to spin · click a planet';
  if (focused) { $('#crumb-domain').textContent = domain.name; setHero('Careers in', domain.name, `${roles.length} careers orbit this planet. Click one.`); }
  else setHero('Every tech career.', 'One galaxy.', 'Find your planet, then climb its roadmap step by step.');
}
function onRole(role, domain) {
  setHero('Your path to', role.title, '');
  $('#crumb-sep2').hidden = $('#crumb-role').hidden = false;
  $('#crumb-role').textContent = role.title;
  const card = $('#role-card');
  card.hidden = false;
  $('#rc-tint').className = `sphere s48 ${styleOf(domain.id).tint}`;
  $('#rc-domain').textContent = domain.name.toUpperCase();
  $('#rc-title').textContent = role.title;
  $('#rc-summary').textContent = `${role.summary} ${role.stages.length} stages · ${role.duration}.`;
  $('#rc-go').href = roleUrl(role.id);
  $('#rc-go').innerHTML = `Climb this roadmap ${ICON.arrow}`;
}
$('#back').addEventListener('click', () => orbit?.back());
$('#pause').addEventListener('click', () => {
  paused = !paused;
  $('#pause').textContent = paused ? 'Play motion' : 'Pause motion';
  document.body.classList.toggle('paused', paused);
  orbit?.setPaused(paused); climb && (climb.space.paused = paused); ring && (ring.space.paused = paused);
});
if (paused) { $('#pause').textContent = 'Play motion'; document.body.classList.add('paused'); }

// dashed line from the spotlight card to the spotlit planet
const line = $('#spot-line');
function drawSpotLine() {
  const p = orbit?.projectSpot();
  if (!p || spotCard.hidden || getComputedStyle(spotCard).display === 'none') { line.setAttribute('opacity', '0'); }
  else {
    const hr = hero.getBoundingClientRect(), cr = spotCard.getBoundingClientRect();
    line.setAttribute('x1', cr.right - hr.left); line.setAttribute('y1', cr.bottom - hr.top - 30);
    line.setAttribute('x2', p.x); line.setAttribute('y2', p.y); line.setAttribute('opacity', '1');
  }
  requestAnimationFrame(drawSpotLine);
}

createOrbit(hero, { onFocus, onRole, onSpot: showSpot }).then((o) => {
  orbit = o;
  if (!o) { spotCard.hidden = true; return; }
  o.setPaused(paused);
  requestAnimationFrame(drawSpotLine);
  // shareable deep links: /?domain=ai&role=gen-ai-engineer
  const r = getRole(param('role'));
  const di = domains.findIndex((d) => d.id === (param('domain') || r?.domain));
  if (di >= 0) {
    o.focus(di);
    if (r) { const k = rolesIn(domains[di].id).findIndex((x) => x.id === r.id); if (k >= 0) setTimeout(() => o.pickRole(k), 300); }
  }
});

// ---------- climb ----------
const demo = getRole('gen-ai-engineer') || roadmaps[0];
let climb = null;
let stageIdx = Math.min(3, demo.stages.length - 1);
function renderStage() {
  const st = demo.stages[stageIdx];
  $('#stage-card').innerHTML = `
    <div class="cat" style="display:flex;justify-content:space-between;gap:10px"><span>${esc(demo.title)} · Stage ${stageIdx + 1} of ${demo.stages.length}</span><span>${esc(st.duration)}</span></div>
    <h3 class="h3" style="margin-top:16px">${esc(st.title)}</h3>
    <p class="muted" style="margin:10px 0 18px;line-height:1.55">${esc(st.goal)}</p>
    ${st.topics.map((t) => `<label class="ck"><input type="checkbox" data-topic="${esc(t)}" ${progress.isTopicDone(demo.id, stageIdx, t) ? 'checked' : ''}>${esc(t)}</label>`).join('')}
    <div class="build"><div class="cat">Build</div><div style="font:700 18px/1.35 var(--font-display);margin-top:6px">${esc(st.project)}</div></div>
    <a class="btn btn-g btn-sm" style="margin-top:18px" href="${roleUrl(demo.id)}">Open the full roadmap</a>`;
  $$('#stage-card input[data-topic]').forEach((cb) => cb.addEventListener('change', () => { progress.setTopic(demo.id, stageIdx, cb.dataset.topic, cb.checked); climb?.refresh(); }));
}
function goStage(i) { stageIdx = Math.max(0, Math.min(demo.stages.length - 1, i)); climb?.setStage(stageIdx); renderStage(); }
$('#stage-prev').addEventListener('click', () => goStage(stageIdx - 1));
$('#stage-next').addEventListener('click', () => goStage(stageIdx + 1));
renderStage();
createClimb($('#climb-box'), demo, {
  compact: true,
  isTopicDone: (i, t) => progress.isTopicDone(demo.id, i, t),
  isStageDone: (i) => i < stageIdx || progress.stageDone(demo, i),
  onStage: goStage
}).then((c) => { climb = c; c?.setStage(stageIdx); if (c) c.space.paused = paused; });

// ---------- switch careers ring ----------
const FROM = { 'Backend dev': 'backend', 'Data analyst': 'data-analyst', 'Frontend dev': 'frontend', Student: null };
const STUDENT = ['Python', 'Git', 'HTML & CSS', 'Math'];
const ringRoles = ['gen-ai-engineer', 'data-scientist', 'devops', 'ml-engineer', 'cloud-engineer', 'data-engineer', 'penetration-tester', 'product-manager', 'ux-ui-designer'].map(getRole).filter(Boolean);
let fromName = 'Backend dev', target = ringRoles[0], ring = null;
const fromSkills = () => new Set(FROM[fromName] ? getRole(FROM[fromName]).skills : STUDENT);
function renderFrom() {
  $('#from-chips').innerHTML = '<span class="cat" style="margin-right:4px">I am a</span>' + Object.keys(FROM).map((n) => `<button type="button" class="chip" aria-pressed="${n === fromName}" data-from="${n}">${n}</button>`).join('');
  $$('#from-chips [data-from]').forEach((b) => b.addEventListener('click', () => { fromName = b.dataset.from; renderFrom(); renderPivot(); }));
}
function renderPivot() {
  const m = match(fromSkills(), target);
  $('#pv-pct').textContent = `${m.pct}%`;
  $('#pv-to').textContent = `ready for ${target.title}`;
  $('#pv-skills').innerHTML = `<span class="cat">You have</span>${m.have.map((s) => `<span class="rchip" style="color:var(--ok);background:var(--ok-bg)">✓ ${esc(s)}</span>`).join('') || '<span class="muted">—</span>'}
    <span class="cat" style="margin-left:10px">To learn</span>${m.miss.map((s) => `<span class="rchip" style="color:var(--warn);background:var(--warn-bg)">+ ${esc(s)}</span>`).join('')}`;
  $('#pv-go').href = `pivot.html?from=${FROM[fromName] || ''}&to=${target.id}`;
  $('#pv-go').textContent = `Plot my path to ${target.title}`;
}
renderFrom(); renderPivot();
createRing($('#ring-box'), ringRoles, { onPick: (r) => { target = r; renderPivot(); } }).then((r) => { ring = r; if (r) { r.space.paused = paused; r.pick(0); } });
$('#ring-prev').addEventListener('click', () => ring ? ring.prev() : null);
$('#ring-next').addEventListener('click', () => ring ? ring.next() : null);

// ---------- recall flashcard ----------
const cards = cardsFor(demo, stageIdx);
let ci = 0, flipped = false;
function renderCard() {
  const c = cards[ci];
  $('#fc-meta').textContent = `CARD ${ci + 1} OF ${cards.length} · ${flipped ? 'HINT' : c.topic.toUpperCase()}`;
  $('#fc-text').textContent = flipped ? c.hint : c.q;
  $('#fc-flip').textContent = flipped ? 'Back to question' : 'Show hint';
}
$('#fc-flip').addEventListener('click', () => { flipped = !flipped; renderCard(); });
$$('[data-rate]').forEach((b) => b.addEventListener('click', () => {
  const c = cards[ci];
  progress.rateCard(demo.id, c.key, b.dataset.rate);
  if (b.dataset.rate === 'easy') { progress.setTopic(demo.id, stageIdx, c.topic, true); renderStage(); climb?.refresh(); }
  ci = (ci + 1) % cards.length; flipped = false; renderCard();
}));
renderCard();

// ---------- constellations gallery ----------
$('#gallery').innerHTML = domains.map((d) => {
  const st = styleOf(d.id); const roles = rolesIn(d.id);
  const fresh = roles.filter((r) => r.status === 'emerging').length;
  return `<a class="gal" href="galaxy.html?domain=${d.id}"><div class="thumb space"><div class="twinkle"></div><span class="sphere ${st.tint}" style="position:relative;width:96px;height:96px;filter:drop-shadow(0 0 30px rgba(170,140,255,.5))"></span>${st.ringed ? `<span class="ring-deco ${st.tint}" style="width:150px;height:40px"></span>` : ''}</div>
    <div class="body"><div class="cat">${roles.length} roles${fresh ? ` · ${fresh} new` : ''}</div><div class="title">${esc(d.name)}</div><p>${roles.map((r) => esc(r.title)).join(', ')}.</p></div></a>`;
}).join('') + `<a class="gal" href="contribute.html" style="border-style:dashed;border-width:2px;background:transparent"><div class="thumb"><span style="width:96px;height:96px;border-radius:50%;border:2px dashed var(--accent);display:flex;align-items:center;justify-content:center;color:var(--accent-text)">${ICON.plus}</span></div><div class="body"><div class="cat">Contribute</div><div class="title">Discovered a new planet?</div><p>Add a field with one JSON file.</p></div></a>`;
