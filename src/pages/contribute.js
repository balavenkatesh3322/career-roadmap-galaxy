import '../styles/main.css';
import { $, esc, REPO, mountHeader, mountFooter } from '../lib/ui.js';
import { domains, roadmaps, skillList, styleOf } from '../lib/data.js';

mountHeader('contribute', 'solid');
mountFooter();
$('#guide').href = `${REPO}/blob/main/CONTRIBUTING.md`;
$('#domain').innerHTML = domains.map((d) => `<option value="${d.id}"${d.id === 'ai' ? ' selected' : ''}>${esc(d.name)}</option>`).join('');

const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const form = $('#propose');

function update() {
  const f = new FormData(form);
  const title = (f.get('title') || '').trim();
  const id = slug(title);
  const domain = f.get('domain');
  const emerging = f.get('emerging') === 'on';
  $('#cmd').innerHTML = `<span class="c">$</span> npm run new -- ${esc(id || 'your-role')} \\\n  "${esc(title || 'Your Role')}" ${esc(domain)}${emerging ? ' --emerging' : ''}`;
  $('#json').innerHTML = `{
  <span class="k">"id"</span>: <span class="s">"${esc(id)}"</span>,
  <span class="k">"title"</span>: <span class="s">"${esc(title)}"</span>,
  <span class="k">"domain"</span>: <span class="s">"${esc(domain)}"</span>,
  <span class="k">"status"</span>: <span class="s">"${emerging ? 'emerging' : 'stable'}"</span>,
  <span class="k">"skills"</span>: [<span class="s">"Python"</span>, <span class="s">"LLMs"</span>],
  <span class="k">"stages"</span>: [
    { <span class="k">"title"</span>: <span class="s">"Foundations"</span>,
      <span class="k">"topics"</span>: [<span class="s">"…"</span>],
      <span class="k">"resources"</span>: [{ <span class="k">"title"</span>: <span class="s">"…"</span>, <span class="k">"url"</span>: <span class="s">"https://…"</span> }],
      <span class="k">"project"</span>: <span class="s">"…"</span> }
    <span class="c">// + 5 more: Core craft · Applied · Scale · Specialise · Professional</span>
  ]
}`;
  const exists = roadmaps.some((r) => r.id === id);
  const checks = [
    [!!id, id ? `File name: roadmaps/${id}.json` : 'Add a role title'],
    [!exists, exists ? 'A career with this id already exists' : 'Id is unique'],
    [!!(f.get('summary') || '').trim(), 'Has a one-line description'],
    [((f.get('evidence') || '').match(/https?:\/\//g) || []).length >= 3, 'At least 3 job-posting links']
  ];
  $('#checks').innerHTML = checks.map(([ok, t]) => `<div class="ck" style="cursor:default;font-size:14px"><span style="color:${ok ? 'var(--ok)' : 'var(--warn)'};font-weight:700">${ok ? '✓' : '!'}</span>${esc(t)}</div>`).join('');
  const st = styleOf(domain);
  const near = roadmaps.filter((r) => r.domain === domain).slice(0, 2);
  $('#preview').innerHTML = `<div class="twinkle"></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><ellipse cx="50" cy="50" rx="40" ry="20" fill="none" stroke="rgba(200,185,255,.5)" stroke-width="1" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/><line x1="50" y1="50" x2="18" y2="38" stroke="#c4b0ff" stroke-width="1.5" vector-effect="non-scaling-stroke"/><line x1="50" y1="50" x2="84" y2="60" stroke="#c4b0ff" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>
    ${near.map((r, i) => `<span style="position:absolute;left:${i ? 84 : 18}%;top:${i ? 60 : 38}%;transform:translate(-50%,-50%);text-align:center"><span class="sphere ${st.tint} s28"></span><span class="lbl sm static" style="position:absolute;left:50%;top:34px">${esc(r.title)}</span></span>`).join('')}
    <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)"><span class="sphere ${st.tint}" style="width:76px;height:76px;filter:drop-shadow(0 0 30px rgba(170,150,255,.5))"></span></span>
    <span class="lbl static" style="position:absolute;left:50%;top:calc(50% + 50px)">${esc(title || 'Your role')} <span class="badge" style="margin-left:6px">${emerging ? 'new' : 'stable'}</span></span>`;
}
form.addEventListener('input', update);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(form);
  const body = `### Role\n${f.get('title')}\n\n### Domain\n${f.get('domain')}\n\n### What do they do?\n${f.get('summary')}\n\n### Evidence (job postings)\n${f.get('evidence') || '_add links_'}\n\n### Status\n${f.get('emerging') === 'on' ? 'emerging' : 'stable'}\n\n_Known skills you can reuse:_ ${skillList.join(', ')}`;
  window.open(`${REPO}/issues/new?labels=new-field&title=${encodeURIComponent(`New field: ${f.get('title')}`)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener');
});
update();
