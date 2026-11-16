// A roadmap as a rising 3D helix: stage gems on a glowing path, topic satellites around the current stage,
// and a climber standing on it. Used on the landing page and the roadmap page.
import { OrbitCamera } from '@pixi/3d/extras';
import { createSpace, glossy, flatGlow, Mesh3D, Container3D, Vector3, GEO, lerp } from './space.js';
import { Point } from 'pixi.js';

const GOLD = 0xf5b301, VIOLET = 0x8b5cf6, MUTE = 0x8d86a6, GREEN = 0x22c55e, PEARL = 0xf1edff;

export const CLIMBER_SVG = `<svg width="64" height="116" viewBox="0 0 60 110" aria-hidden="true">
<defs><radialGradient id="cg-skin" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffe3cc"/><stop offset=".55" stop-color="#f0b38e"/><stop offset="1" stop-color="#b8714c"/></radialGradient>
<linearGradient id="cg-hood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4adff"/><stop offset=".5" stop-color="#7c4dff"/><stop offset="1" stop-color="#3d1ca6"/></linearGradient>
<linearGradient id="cg-pant" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a6a8f"/><stop offset="1" stop-color="#1f2840"/></linearGradient>
<linearGradient id="cg-pack" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd18a"/><stop offset="1" stop-color="#c26a05"/></linearGradient></defs>
<ellipse cx="30" cy="106" rx="16" ry="3.2" fill="rgba(0,0,0,.35)"/><line x1="49" y1="4" x2="47" y2="44" stroke="#e5e1f0" stroke-width="1.6" stroke-linecap="round"/><path d="M49 4 L60 8 L48.6 13 Z" fill="#ffd166"/>
<rect x="12" y="38" width="12" height="24" rx="5" fill="url(#cg-pack)"/><rect x="21" y="66" width="8" height="36" rx="4" fill="url(#cg-pant)"/><rect x="31" y="66" width="8" height="36" rx="4" fill="url(#cg-pant)"/>
<ellipse cx="24" cy="103" rx="7" ry="3.6" fill="#f4f1ff"/><ellipse cx="37" cy="103" rx="7" ry="3.6" fill="#f4f1ff"/><rect x="17" y="35" width="26" height="35" rx="11" fill="url(#cg-hood)"/>
<rect x="11" y="40" width="7" height="26" rx="3.5" fill="url(#cg-hood)" transform="rotate(10 14 40)"/><rect x="40" y="22" width="7" height="24" rx="3.5" fill="url(#cg-hood)" transform="rotate(12 43 46)"/>
<circle cx="47" cy="23" r="3.6" fill="url(#cg-skin)"/><circle cx="30" cy="22" r="12" fill="url(#cg-skin)"/><path d="M18 21 a12 12 0 0 1 24 0 q-5 -5 -12 -4 q-7 1 -12 4z" fill="#2b1d16"/>
<circle cx="26" cy="24" r="1.3" fill="#2b1d16"/><circle cx="34" cy="24" r="1.3" fill="#2b1d16"/><path d="M26.5 28.5 q3.5 2.6 7 0" stroke="#7a3b22" stroke-width="1.2" fill="none" stroke-linecap="round"/>
<ellipse cx="25" cy="16" rx="4" ry="2.2" fill="rgba(255,255,255,.35)"/><ellipse cx="24" cy="44" rx="3" ry="6" fill="rgba(255,255,255,.22)"/></svg>`;

export async function createClimb(host, role, { orbitControls = false, isTopicDone = () => false, isStageDone = () => false, onStage, compact = false } = {}) {
  const s = await createSpace(host, { fov: 36 });
  if (!s) return null;
  const { view, content } = s;
  const n = role.stages.length;
  const RAD = compact ? 3.3 : 3.6, STEP = compact ? 1.25 : 1.45;
  const y0 = -((n - 1) * STEP) / 2;
  const at = (t) => { const a = t * 1.05 - 0.6; return new Vector3(Math.cos(a) * RAD, y0 + t * STEP, Math.sin(a) * RAD); };

  const world = new Container3D();
  content.addChild(world);

  // path dots
  const dotDone = flatGlow(0xc4b5fd, 0.95), dotTodo = flatGlow(0x9d94c4, 0.35);
  const dots = [];
  for (let t = -0.35; t <= n - 0.65; t += 0.085) {
    const d = new Mesh3D({ geometry: GEO.sphere(), material: dotTodo });
    const p = at(t); d.position.set(p.x, p.y, p.z); d.scale.set(0.055, 0.055, 0.055); d.t = t;
    world.addChild(d); dots.push(d);
  }

  // stage gems
  const gems = role.stages.map((st, i) => {
    const g = new Mesh3D({ geometry: GEO.gem(), material: glossy(MUTE, { emissive: 0 }), eventMode: 'static', cursor: 'pointer' });
    const p = at(i); g.position.set(p.x, p.y, p.z); g.i = i;
    g.on('pointertap', (e) => { if (e.button === 0) onStage?.(i); });
    world.addChild(g);
    g.label = s.addLabel({ text: `${i + 1} · ${st.title}`, node: g, offset: [0, -0.75, 0], className: 'sm', onClick: () => onStage?.(i) });
    return g;
  });

  // satellites
  const sats = new Container3D();
  world.addChild(sats);
  let satMeshes = [];

  // climber (DOM)
  const climber = document.createElement('div');
  climber.className = 'climber';
  climber.innerHTML = CLIMBER_SVG;
  s.labelLayer.appendChild(climber);

  let current = 0;
  function refresh() {
    gems.forEach((g, i) => {
      const done = isStageDone(i), cur = i === current;
      g.material = glossy(done ? GOLD : cur ? VIOLET : MUTE, { emissive: cur ? 0.9 : done ? 0.35 : 0 });
      const sc = cur ? 0.5 : 0.32; g.scale.set(sc, sc * 1.35, sc);
      g.label.el.classList.toggle('on', cur);
      g.label.el.classList.toggle('done', done && !cur);
      g.label.offset.set(0, cur ? -1.05 : -0.75, 0);
    });
    dots.forEach((d) => { d.material = d.t <= current ? dotDone : dotTodo; });
    // satellites for the current stage
    satMeshes.forEach((m) => s.removeLabel(m.label));
    sats.removeChildren(); satMeshes = [];
    const st = role.stages[current];
    const c = at(current);
    sats.position.set(c.x, c.y, c.z);
    satMeshes = st.topics.map((topic, k) => {
      const a = ((k + 0.5) / st.topics.length) * Math.PI * 2;
      const done = isTopicDone(current, topic);
      const m = new Mesh3D({ geometry: GEO.sphere(), material: glossy(done ? GREEN : PEARL, { emissive: done ? 0.6 : 0.05 }) });
      const r = compact ? 1.25 : 1.55;
      m.position.set(Math.cos(a) * r, Math.sin(a * 2) * 0.12, Math.sin(a) * r);
      m.scale.set(0.15, 0.15, 0.15);
      sats.addChild(m);
      m.label = compact ? null : s.addLabel({ text: topic, node: m, offset: [0, -0.32, 0], className: `sm static ${done ? 'done' : ''}` });
      return m;
    });
    satMeshes = satMeshes.map((m) => { if (!m.label) m.label = { el: document.createElement('i'), node: m, offset: new Vector3(), visible: false }; return m; });
  }

  // camera
  const cam = view.camera;
  const target = new Vector3(0, 0, 0);
  let orbit = null;
  if (orbitControls) {
    cam.position.set(0, 2.2, 12.5);
    orbit = new OrbitCamera({ view, target: { x: 0, y: 0, z: 0 }, enableDamping: true, minDistance: 6, maxDistance: 24 });
  } else {
    cam.position.set(0, 1.4, compact ? 13 : 14.5);
    cam.lookAt(target);
  }

  const pt = new Point();
  s.app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    if (!s.paused) {
      sats.rotation.y += dt * 0.35;
      gems.forEach((g) => { g.rotation.y += dt * 0.6; });
      if (!orbitControls) { const t = performance.now() / 4000; cam.position.set(Math.sin(t) * 1.6, 1.4, compact ? 13 : 14.5); cam.lookAt(target); }
    }
    if (orbit) {
      const want = at(current);
      const k = Math.min(1, dt * 3);
      orbit.target.set(lerp(orbit.target.x, want.x * 0.35, k), lerp(orbit.target.y, want.y + 0.9, k), lerp(orbit.target.z, want.z * 0.35, k));
    }
    const g = gems[current];
    const p = s.project(g, new Vector3(0, 0.62, 0), pt);
    if (p) climber.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -100%)`;
  });

  function setStage(i) { current = Math.max(0, Math.min(n - 1, i)); refresh(); }
  setStage(0);
  return { space: s, setStage, refresh, get current() { return current; }, orbit };
}
