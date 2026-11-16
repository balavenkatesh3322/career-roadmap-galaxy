import '../styles/main.css';
import { Application, Graphics } from 'pixi.js';
import { $, $$, esc, ICON, mountHeader } from '../lib/ui.js';
import { roadmaps, skillList, getRole, styleOf, roleUrl, param } from '../lib/data.js';
import { rank, match, bestNextSkill, PRESETS } from '../lib/match.js';

mountHeader('skills', 'solid');

const KEY = 'cg-skills';
let have;
try { have = new Set(JSON.parse(localStorage.getItem(KEY)) || PRESETS['Backend dev']); } catch { have = new Set(PRESETS['Backend dev']); }
let selected = param('role');
const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...have])); } catch { /* ignore */ } };

// ---------- PixiJS 2D edge layer ----------
const graphEl = $('#graph');
const app = new Application();
let gfx = null;
app.init({ resizeTo: graphEl, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 2) })
  .then(() => {
    app.canvas.setAttribute('aria-hidden', 'true');
    app.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1';
    graphEl.prepend(app.canvas);
    gfx = new Graphics();
    app.stage.addChild(gfx);
    draw();
  })
  .catch(() => { /* no WebGL: nodes still work without lines */ });

let layout = { skills: [], careers: [] };
function shown() {
  const ranked = rank(have);
  const top = ranked.slice(0, 11).map((x) => x.role);
  const sel = getRole(selected);
  if (sel && !top.includes(sel)) top.push(sel);
  return { ranked, top };
}

function draw() {
  const { ranked, top } = shown();
  if (!selected || !getRole(selected)) selected = ranked.find((x) => x.pct < 100)?.role.id || ranked[0].role.id;
  const W = graphEl.clientWidth, H = graphEl.clientHeight;
  const used = new Set(top.flatMap((r) => r.skills || []));
  const skills = skillList.filter((s) => used.has(s) || have.has(s));
  const sx = Math.max(150, W * 0.24), cx = Math.min(W * 0.6, W - 280);
  const sy = (i) => 40 + (i / Math.max(1, skills.length - 1)) * (H - 90);
  const cy = (i) => 46 + (i / Math.max(1, top.length - 1)) * (H - 100);
  layout = { skills: skills.map((s, i) => ({ s, x: sx, y: sy(i) })), careers: top.map((r, i) => ({ r, x: cx + Math.sin((i / Math.max(1, top.length - 1)) * Math.PI) * W * 0.04, y: cy(i) })) };

  // edges (PixiJS)
  if (gfx) {
    gfx.clear();
    const pos = new Map(layout.skills.map((n) => [n.s, n]));
    const edges = [];
    layout.careers.forEach((c) => (c.r.skills || []).forEach((s) => {
      const a = pos.get(s); if (!a) return;
      const isSel = c.r.id === selected, ok = have.has(s);
      if (!ok && !isSel) return;
      edges.push({ a, c, isSel, ok });
    }));
    edges.sort((p, q) => p.isSel - q.isSel);
    for (const { a, c, isSel, ok } of edges) {
      const color = ok ? (isSel ? 0x4ade80 : 0xb9a6ff) : 0xfb923c;
      const alpha = isSel ? 0.95 : ok ? 0.22 : 0.8;
      const mx = (a.x + c.x) / 2;
      if (!ok) { // dashed curve for missing skills
        const N = 26;
        for (let k = 0; k < N; k += 2) {
          const p = bez(a, c, mx, k / N), q = bez(a, c, mx, (k + 1) / N);
          gfx.moveTo(p.x, p.y).lineTo(q.x, q.y);
        }
        gfx.stroke({ width: 2, color, alpha });
      } else {
        gfx.moveTo(a.x + 10, a.y).bezierCurveTo(mx, a.y, mx, c.y, c.x - 14, c.y).stroke({ width: isSel ? 3 : 1.4, color, alpha });
      }
    }
  }

  // nodes (DOM, accessible)
  $('#nodes').innerHTML = layout.skills.map((n) => `<button type="button" class="lbl sm ${have.has(n.s) ? 'done' : ''}" style="transform:translate(${n.x}px,${n.y}px) translate(-100%,-50%);padding-right:30px" data-skill="${esc(n.s)}" aria-pressed="${have.has(n.s)}">${esc(n.s)}<span class="sphere ${have.has(n.s) ? 't-green' : 't-pearl'} s14" style="position:absolute;right:8px;top:50%;translate:0 -50%"></span></button>`).join('')
    + layout.careers.map((n) => { const m = match(have, n.r); const sz = Math.round(16 + m.pct * 0.26); return `<button type="button" class="lbl sm ${n.r.id === selected ? 'on' : ''}" style="transform:translate(${n.x}px,${n.y}px) translate(0,-50%);padding-left:${sz + 16}px" data-career="${n.r.id}"><span class="sphere ${styleOf(n.r.domain).tint}" style="position:absolute;left:6px;top:50%;translate:0 -50%;width:${sz}px;height:${sz}px"></span>${esc(n.r.title)} · ${m.pct}%</button>`; }).join('');
  $$('#nodes [data-skill]').forEach((b) => b.addEventListener('click', () => toggle(b.dataset.skill)));
  $$('#nodes [data-career]').forEach((b) => b.addEventListener('click', () => { selected = b.dataset.career; render(); }));
  renderPanel(ranked);
}
function bez(a, c, mx, t) {
  const p0 = { x: a.x + 10, y: a.y }, p1 = { x: mx, y: a.y }, p2 = { x: mx, y: c.y }, p3 = { x: c.x - 14, y: c.y };
  const u = 1 - t;
  return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y };
}

function renderPanel(ranked) {
  $('#ranked').innerHTML = ranked.slice(0, 6).map(({ role, pct }) => `<button type="button" class="rbtn" style="min-height:54px" aria-pressed="${role.id === selected}" data-r="${role.id}"><span class="sphere ${styleOf(role.domain).tint} s22"></span><span style="flex:1;min-width:0"><span style="display:block">${esc(role.title)}</span><span class="progress" style="display:block;height:6px;margin-top:6px"><i style="width:${pct}%"></i></span></span><b style="font:700 16px var(--font-display)">${pct}%</b></button>`).join('');
  $$('#ranked [data-r]').forEach((b) => b.addEventListener('click', () => { selected = b.dataset.r; render(); }));
  const r = getRole(selected);
  const m = match(have, r);
  $('#selected').innerHTML = `<div style="font:800 22px/1.1 var(--font-display);letter-spacing:-.02em">${esc(r.title)} · ${m.pct}% match</div>
    <p class="lab" style="margin:12px 0 6px">You have</p><div style="display:flex;flex-wrap:wrap;gap:6px">${m.have.map((s) => `<span class="rchip" style="font-size:13px;color:var(--ok);background:var(--ok-bg)">✓ ${esc(s)}</span>`).join('') || '<span class="muted">Nothing yet</span>'}</div>
    <p class="lab" style="margin:12px 0 6px">To learn</p><div style="display:flex;flex-wrap:wrap;gap:6px">${m.miss.map((s) => `<span class="rchip" style="font-size:13px;color:var(--warn);background:var(--warn-bg)">+ ${esc(s)}</span>`).join('') || '<span class="muted">You have them all</span>'}</div>
    <a class="btn btn-p btn-sm" style="width:100%;margin-top:14px" href="${roleUrl(r.id)}">Switch to this career ${ICON.arrow}</a>`;
  const nx = bestNextSkill(have);
  $('#next-skill').innerHTML = nx ? `<strong style="font:700 15px var(--font-display);color:var(--accent-text)">Best next skill: ${esc(nx.skill)}</strong><br>Used by ${nx.careers} of ${roadmaps.length} careers, so it raises your match across the most paths.` : '<strong>You have every skill on the map.</strong>';
}

function renderChips() {
  $('#presets').innerHTML = Object.keys(PRESETS).map((p) => `<button type="button" class="chip" data-p="${esc(p)}">${esc(p)}</button>`).join('');
  $$('#presets [data-p]').forEach((b) => b.addEventListener('click', () => { have = new Set(PRESETS[b.dataset.p]); selected = null; save(); render(); }));
  $('#have-count').textContent = have.size;
  $('#skill-chips').innerHTML = skillList.map((s) => `<button type="button" class="chip" aria-pressed="${have.has(s)}" data-s="${esc(s)}" style="min-height:36px;padding:0 12px 0 8px"><span class="sphere ${have.has(s) ? 't-green' : 't-pearl'} s14"></span>${esc(s)}</button>`).join('');
  $$('#skill-chips [data-s]').forEach((b) => b.addEventListener('click', () => toggle(b.dataset.s)));
}
function toggle(s) { have.has(s) ? have.delete(s) : have.add(s); save(); render(); }
function render() { renderChips(); draw(); }
new ResizeObserver(() => draw()).observe(graphEl);
render();
