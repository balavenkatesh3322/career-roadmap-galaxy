import '../styles/main.css';
import { $, $$, esc, mountHeader, mountFooter, toast } from '../lib/ui.js';
import { roadmaps, getRole, styleOf, param, roleUrl } from '../lib/data.js';
import { progress } from '../lib/progress.js';
import { match } from '../lib/match.js';
import { cardsFor } from '../lib/cards.js';

mountHeader('pivot', 'solid');
mountFooter();

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9+#]/g, '');
let from = getRole(param('from')) || null;
let to = getRole(param('to')) || getRole('ml-engineer') || roadmaps[0];

const opts = (sel, includeNone) => (includeNone ? '<option value="">A student / starting out</option>' : '') + roadmaps.map((r) => `<option value="${r.id}">${esc(r.title)}</option>`).join('');
$('#from').innerHTML = opts(null, true);
$('#to').innerHTML = opts(null, false);
$('#from').value = from?.id || '';
$('#to').value = to.id;
$('#from').addEventListener('change', (e) => { from = getRole(e.target.value); renderPivot(); sync(); });
$('#to').addEventListener('change', (e) => { to = getRole(e.target.value); renderPivot(); setupRecall(0); sync(); });
function sync() { history.replaceState(null, '', `?from=${from?.id || ''}&to=${to.id}${location.hash}`); }

/** Topics of `to` that also appear in `from` (by normalised name). */
function knownTopics() {
  if (!from) return new Map();
  const mine = new Set(from.stages.flatMap((s) => s.topics).map(norm));
  const known = new Map();
  to.stages.forEach((s, i) => s.topics.forEach((t) => { if (mine.has(norm(t))) known.set(`${i}::${t}`, { stage: i, topic: t }); }));
  return known;
}

function renderPivot() {
  const have = new Set(from ? from.skills : ['Python', 'Git', 'HTML & CSS', 'Math']);
  const m = match(have, to);
  const known = knownTopics();
  const total = to.stages.reduce((n, s) => n + s.topics.length, 0);
  const startAt = to.stages.findIndex((s, i) => s.topics.filter((t) => known.has(`${i}::${t}`)).length / s.topics.length < 0.5);
  const fromSt = from ? styleOf(from.domain) : { tint: 't-pearl' };
  const toSt = styleOf(to.domain);
  // moons along the arc for shared skills
  const bez = (t) => [Math.pow(1 - t, 3) * 14 + 3 * Math.pow(1 - t, 2) * t * 30 + 3 * (1 - t) * t * t * 70 + t * t * t * 86, Math.pow(1 - t, 3) * 66 + 3 * Math.pow(1 - t, 2) * t * 8 + 3 * (1 - t) * t * t * 8 + t * t * t * 66];
  const moons = m.have.slice(0, 6).map((s, k, a) => { const [x, y] = bez((k + 1) / (a.length + 1)); return `<span style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%);text-align:center"><span class="sphere t-green s22" style="filter:drop-shadow(0 0 12px rgba(34,197,94,.6))"></span><span class="lbl sm static" style="position:absolute;left:50%;top:28px">${esc(s)}</span></span>`; }).join('');
  $('#transfer-items').innerHTML = `
    <div style="position:absolute;left:14%;top:66%;transform:translate(-50%,-50%);text-align:center"><span class="sphere ${fromSt.tint}" style="width:110px;height:110px;filter:drop-shadow(0 0 30px rgba(170,150,255,.35))"></span><div style="margin-top:10px;font:700 16px var(--font-display)">${esc(from ? from.title : 'Starting out')}</div><div class="mono" style="font-size:11px;letter-spacing:.14em;color:#a9b0c0">YOU ARE HERE</div></div>
    <div style="position:absolute;left:86%;top:66%;transform:translate(-50%,-50%);text-align:center"><span class="sphere ${toSt.tint}" style="width:120px;height:120px;filter:drop-shadow(0 0 30px rgba(170,150,255,.35))"></span><div style="margin-top:10px;font:700 16px var(--font-display)">${esc(to.title)}</div><div class="mono" style="font-size:11px;letter-spacing:.14em;color:#a9b0c0">DESTINATION</div></div>
    ${moons}
    <div style="position:absolute;left:50%;top:62%;transform:translate(-50%,-50%);text-align:center"><b class="grad" style="display:block;font:900 64px/1 var(--font-display);letter-spacing:-.03em">${m.pct}%</b><span style="font:500 14px var(--font-display);color:#d5d9e6">of the skills already</span></div>`;
  $('#pv-summary').innerHTML = `
    <div style="flex:1 1 280px;line-height:1.55;color:var(--ink-2)"><strong style="color:var(--ink)">${known.size} of ${total} topics</strong> carry over${from ? '' : ' (pick your current role to see more)'}.
      Start at <strong style="color:var(--ink)">Stage ${(startAt < 0 ? 0 : startAt) + 1}: ${esc(to.stages[startAt < 0 ? 0 : startAt].title)}</strong>.
      ${m.miss.length ? `<br>New skills to learn: ${m.miss.map((s) => `<span class="rchip" style="font-size:12px;padding:5px 9px;color:var(--warn);background:var(--warn-bg)">+ ${esc(s)}</span>`).join(' ')}` : ''}</div>
    <button type="button" class="btn btn-p btn-sm" id="apply">Mark what I know & start →</button>`;
  $('#apply').addEventListener('click', () => {
    known.forEach(({ stage, topic }) => progress.setTopic(to.id, stage, topic, true));
    progress.setCurrent(to.id, startAt < 0 ? 0 : startAt);
    toast(`${known.size} topics marked as known`);
    setTimeout(() => { location.href = roleUrl(to.id); }, 500);
  });
}

// ---------- recall ----------
let cards = [], ci = 0, flipped = false, stageI = 0;
function setupRecall(i) {
  stageI = i;
  $('#sc-stage').innerHTML = to.stages.map((s, k) => `<option value="${k}">${k + 1} · ${esc(s.title)}</option>`).join('');
  $('#sc-stage').value = String(i);
  $('#sc-eyebrow').textContent = `Self-check · ${to.title}`;
  cards = cardsFor(to, i); ci = 0; flipped = false;
  renderCard();
}
$('#sc-stage').addEventListener('change', (e) => setupRecall(+e.target.value));
function renderCard() {
  const c = cards[ci];
  $('#fc-meta').textContent = `CARD ${ci + 1} OF ${cards.length} · ${flipped ? 'HINT' : c.topic.toUpperCase()}`;
  $('#fc-text').textContent = flipped ? c.hint : c.q;
  $('#fc-flip').textContent = flipped ? 'Back to question' : 'Show hint';
  $('#dots').innerHTML = cards.map((k, j) => { const r = progress.cardRating(to.id, k.key); return `<span style="flex:1;height:6px;border-radius:3px;background:${j === ci ? '#7a52ff' : r === 'easy' ? '#22c55e' : r ? '#f5b301' : 'var(--line)'}"></span>`; }).join('');
  const rs = cards.map((k) => progress.cardRating(to.id, k.key));
  $('#tally').textContent = `${rs.filter((r) => r === 'easy').length} easy · ${rs.filter((r) => r === 'good').length} good · ${rs.filter((r) => r === 'again').length} again`;
}
$('#fc-flip').addEventListener('click', () => { flipped = !flipped; renderCard(); });
$$('[data-rate]').forEach((b) => b.addEventListener('click', () => {
  const c = cards[ci];
  progress.rateCard(to.id, c.key, b.dataset.rate);
  if (b.dataset.rate === 'easy') progress.setTopic(to.id, stageI, c.topic, true);
  ci = (ci + 1) % cards.length; flipped = false; renderCard();
}));
window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea')) return;
  const map = { 1: 'again', 2: 'good', 3: 'easy' };
  if (map[e.key]) $(`[data-rate="${map[e.key]}"]`).click();
  if (e.key === ' ') { e.preventDefault(); $('#fc-flip').click(); }
});

renderPivot();
setupRecall(Math.min(+(param('stage') || progress.current(to.id)) || 0, to.stages.length - 1));
