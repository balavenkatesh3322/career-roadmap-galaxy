import '../styles/main.css';
import { $, $$, esc, ICON, mountHeader } from '../lib/ui.js';
import { roadmaps, getRole, styleOf, domainById, param, roleUrl } from '../lib/data.js';
import { progress } from '../lib/progress.js';
import { createClimb } from '../scene/climb.js';

mountHeader('galaxy', 'solid');
$$('[data-icon]').forEach((el) => { el.innerHTML = ICON[el.dataset.icon] || ''; });

const role = getRole(param('role')) || getRole('gen-ai-engineer') || roadmaps[0];
document.title = `${role.title} roadmap — Career Galaxy`;
$('#back-link').href = `galaxy.html?domain=${role.domain}&role=${role.id}`;
$('#back-link').innerHTML = `${ICON.back}${esc(domainById.get(role.domain)?.name || 'Galaxy')}`;
$('#r-tint').className = `sphere s28 ${styleOf(role.domain).tint}`;
$('#r-title').textContent = role.title;

let stage = Math.min(progress.current(role.id), role.stages.length - 1);
let climb = null;

function host(u) { try { return new URL(u).hostname.replace('www.', ''); } catch { return ''; } }

function renderHeader() {
  const c = progress.counts(role);
  $('#r-bar').style.width = `${c.pct}%`;
  $('#r-pct').textContent = `${c.pct}%`;
  $('#r-count').textContent = `${c.done} / ${c.total}`;
}
function renderStepper() {
  $('#stepper').innerHTML = role.stages.map((s, i) => {
    const cls = progress.stageDone(role, i) ? 'done' : i === stage ? 'cur' : '';
    return `<button type="button" class="step ${i === stage ? 'cur' : cls}" data-s="${i}" aria-label="Stage ${i + 1}: ${esc(s.title)}" ${i === stage ? 'aria-current="step"' : ''}>${i + 1}</button>`;
  }).join('');
  $$('#stepper [data-s]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.s)));
}
function renderStage() {
  const st = role.stages[stage];
  const projectDone = progress.isProjectDone(role.id, stage);
  $('#stage').innerHTML = `
    <div class="cat" style="display:flex;justify-content:space-between"><span>Stage ${stage + 1} of ${role.stages.length}</span><span>${esc(st.duration)}</span></div>
    <h2 class="h3" style="margin-top:10px">${esc(st.title)}</h2>
    <p class="muted" style="margin:8px 0 14px;line-height:1.55">${esc(st.goal)}</p>
    <div class="cat" style="margin-bottom:4px">Learn · tick to light up</div>
    ${st.topics.map((t) => `<label class="ck"><input type="checkbox" data-topic="${esc(t)}" ${progress.isTopicDone(role.id, stage, t) ? 'checked' : ''}>${esc(t)}</label>`).join('')}
    ${st.resources.length ? `<div class="cat" style="margin:18px 0 8px">Resources</div><div style="display:flex;flex-direction:column;gap:6px">${st.resources.map((r) => `<a class="res" href="${esc(r.url)}" target="_blank" rel="noopener"><span style="flex:1;min-width:0">${esc(r.title)}<small>${esc(host(r.url))}</small></span>${ICON.ext}</a>`).join('')}</div>` : ''}
    <div class="build"><div class="cat">Build</div><div style="font:700 17px/1.35 var(--font-display);margin-top:6px">${esc(st.project)}</div>
      <label class="ck" style="border:0;padding-bottom:0"><input type="checkbox" id="proj" ${projectDone ? 'checked' : ''} style="accent-color:#f5b301">Project shipped — the stage turns gold</label></div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <a class="btn btn-g btn-sm" style="flex:1" href="pivot.html?to=${role.id}&stage=${stage}#recall">Self-check</a>
      <button type="button" class="btn btn-p btn-sm" style="flex:1" id="next" ${stage >= role.stages.length - 1 ? 'disabled' : ''}>Next stage →</button>
    </div>
    ${role.next?.length ? `<div class="cat" style="margin:22px 0 8px">Where this can lead</div><div style="display:flex;flex-wrap:wrap;gap:6px">${role.next.map(getRole).filter(Boolean).map((r) => `<a class="rchip" href="${roleUrl(r.id)}">${esc(r.title)}</a>`).join('')}</div>` : ''}`;
  $$('#stage input[data-topic]').forEach((cb) => cb.addEventListener('change', () => { progress.setTopic(role.id, stage, cb.dataset.topic, cb.checked); update(); }));
  $('#proj').addEventListener('change', (e) => { progress.setProject(role.id, stage, e.target.checked); update(); });
  $('#next').addEventListener('click', () => go(stage + 1));
}
function update() { renderHeader(); renderStepper(); climb?.refresh(); }
function go(i) {
  stage = Math.max(0, Math.min(role.stages.length - 1, i));
  progress.setCurrent(role.id, stage);
  climb?.setStage(stage);
  renderStage(); renderStepper();
}
window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select')) return;
  if (e.key === 'ArrowRight') go(stage + 1);
  if (e.key === 'ArrowLeft') go(stage - 1);
});

renderHeader(); renderStepper(); renderStage();
createClimb($('#scene'), role, {
  orbitControls: true,
  isTopicDone: (i, t) => progress.isTopicDone(role.id, i, t),
  isStageDone: (i) => progress.stageDone(role, i),
  onStage: go
}).then((c) => { climb = c; c?.setStage(stage); });
