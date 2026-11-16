// Landing hero: domain planets orbit "YOU". Drag to spin, click a planet to fly in, click a moon to pick a career.
import { TorusGeometry } from '@pixi/3d';
import { createSpace, makePlanet, glossy, Mesh3D, Container3D, Vector3, GEO, lerp, easeInOut, flatGlow } from './space.js';
import { domains, rolesIn, styleOf } from '../lib/data.js';

const R = 8.2;          // orbit radius
const CENTER_Y = -3.1;  // orbit height

export async function createOrbit(host, { onFocus, onRole, onSpot } = {}) {
  const s = await createSpace(host, { fov: 34 });
  if (!s) return null;
  const { view, content } = s;
  const cam = view.camera;

  const system = new Container3D();
  system.position.set(0, CENTER_Y, 0);
  content.addChild(system);

  // orbit guide
  const guide = new Mesh3D({ geometry: new TorusGeometry({ radius: R, tube: 0.018, radialSegments: 6, tubularSegments: 160 }), material: flatGlow(0xc8b8ff, 0.45) });
  system.addChild(guide);
  const inner = new Mesh3D({ geometry: new TorusGeometry({ radius: R * 0.55, tube: 0.012, radialSegments: 6, tubularSegments: 120 }), material: flatGlow(0xc8b8ff, 0.3) });
  system.addChild(inner);

  // YOU core
  const core = new Mesh3D({ geometry: GEO.sphere(), material: glossy(0xf4f0ff, { emissive: 0.35, roughness: 0.2 }) });
  core.scale.set(0.95, 0.95, 0.95);
  system.addChild(core);
  s.addLabel({ text: 'YOU', node: core, offset: [0, -0.18, 0], className: 'sm static' }).el.style.cssText += ';background:transparent;border:0;color:#4c1fc0;font:500 12px var(--font-mono);letter-spacing:.18em;backdrop-filter:none';

  const spinner = new Container3D();
  system.addChild(spinner);

  const planets = domains.map((d, i) => {
    const st = styleOf(d.id);
    const roles = rolesIn(d.id);
    const radius = 0.62 + roles.length * 0.05;
    const p = makePlanet(st.color, { radius, ringed: !!st.ringed, parent: spinner });
    const a = (i / domains.length) * Math.PI * 2;
    p.holder.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    p.domain = d; p.roles = roles; p.radius = radius; p.index = i;
    p.ball.on('pointertap', (e) => { if (e.button === 0) focus(i); });
    p.ball.on('pointerover', () => { p.hover = true; });
    p.ball.on('pointerout', () => { p.hover = false; });
    p.label = s.addLabel({ text: d.name, node: p.holder, offset: [0, -(radius + 0.35), 0], onClick: () => focus(i) });
    return p;
  });

  // moons (careers) for the focused planet
  const moonGroup = new Container3D();
  content.addChild(moonGroup);
  let moons = [];

  // ---------- camera ----------
  const HOME = { pos: new Vector3(0, 3.4, 25), look: new Vector3(0, -0.4, 0) };
  const camPos = HOME.pos.clone();
  const camLook = HOME.look.clone();
  let fly = null;
  function flyTo(pos, look, ms = 1200) {
    fly = { t0: performance.now(), ms: s.paused ? 1 : ms, fromP: camPos.clone(), fromL: camLook.clone(), toP: pos.clone(), toL: look.clone() };
  }

  // ---------- state ----------
  let angle = 0, focused = -1, roleIdx = -1, dragging = null, spot = 0, spotT = 0;
  const tmp = new Vector3();

  function focus(i) {
    if (focused === i) return;
    clearMoons();
    focused = i; roleIdx = -1;
    const p = planets[i];
    p.holder.getGlobalPosition(tmp);
    const target = tmp.clone();
    const away = new Vector3(target.x, 0, target.z).normalize();
    flyTo(new Vector3(target.x + away.x * 13.5, target.y + 1.4, target.z + away.z * 13.5 + 0.01), new Vector3(target.x, target.y + 0.45, target.z));
    buildMoons(p, target, away);
    planets.forEach((q) => { q.label.visible = q === p; });
    onFocus?.(p.domain, p.roles);
  }
  function buildMoons(p, center, away) {
    const n = p.roles.length;
    const ringR = p.radius + 2.4;
    const side = new Vector3(-away.z, 0, away.x); // perpendicular to view direction, horizontal
    moons = p.roles.map((role, k) => {
      const a = -Math.PI / 2 + ((k + 0.5) / n) * Math.PI * 2;
      const m = new Mesh3D({ geometry: GEO.sphere(), material: glossy(0xf1edff, { emissive: 0.1 }), eventMode: 'static', cursor: 'pointer' });
      m.scale.set(0.24, 0.24, 0.24);
      m.position.set(center.x + side.x * Math.cos(a) * ringR, center.y + Math.sin(a) * ringR * 0.55, center.z + side.z * Math.cos(a) * ringR);
      m.role = role; m.k = k;
      m.on('pointertap', (e) => { if (e.button === 0) pickRole(k); });
      moonGroup.addChild(m);
      m.label = s.addLabel({ text: role.title, node: m, offset: [0, -0.42, 0], className: 'sm', onClick: () => pickRole(k) });
      return m;
    });
  }
  function clearMoons() { moons.forEach((m) => { s.removeLabel(m.label); m.destroy(); }); moons = []; moonGroup.removeChildren(); }
  function pickRole(k) {
    roleIdx = k;
    const p = planets[focused];
    moons.forEach((m, j) => {
      m.material = glossy(j === k ? styleOf(p.domain.id).color : 0xf1edff, { emissive: j === k ? 0.9 : 0.1 });
      const sc = j === k ? 0.34 : 0.24; m.scale.set(sc, sc, sc);
      m.label.el.classList.toggle('on', j === k);
    });
    onRole?.(p.roles[k], p.domain);
  }
  function back() {
    clearMoons(); focused = -1; roleIdx = -1;
    planets.forEach((q) => { q.label.visible = true; });
    flyTo(HOME.pos, HOME.look);
    onFocus?.(null, null);
  }

  // ---------- drag to spin ----------
  const el = host;
  el.addEventListener('pointerdown', (e) => { if (focused < 0 && e.target.tagName === 'CANVAS') dragging = { x: e.clientX }; });
  window.addEventListener('pointermove', (e) => { if (dragging) { angle += (e.clientX - dragging.x) * 0.006; dragging.x = e.clientX; } });
  window.addEventListener('pointerup', () => { dragging = null; });

  // ---------- frame ----------
  s.app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    if (!s.paused && focused < 0 && !dragging) angle += dt * 0.09;
    spinner.rotation.y = angle;
    // keep planets upright / self-rotate
    planets.forEach((p, i) => {
      p.ball.rotation.y += dt * (0.25 + i * 0.03);
      const isSpot = focused < 0 && i === spot;
      const target = p.hover || focused === i ? 0.9 : isSpot ? 1.5 : 0.08;
      p.mat.emissive.strength = lerp(p.mat.emissive.strength, target, Math.min(1, dt * 4));
      // while a planet is focused, shrink the others so they don't crowd the camera
      const want = focused >= 0 && focused !== i ? p.radius * 0.3 : p.radius;
      const sc = lerp(p.holder.scale.x, want, Math.min(1, dt * 4));
      p.holder.scale.set(sc, sc, sc);
    });
    core.material.emissive.strength = 0.3 + (s.paused ? 0 : Math.sin(performance.now() / 600) * 0.12);

    if (focused < 0 && !s.paused) {
      spotT += dt;
      if (spotT > 4) { spotT = 0; spot = (spot + 1) % planets.length; onSpot?.(planets[spot].domain, planets[spot].roles); }
    }
    moons.forEach((m) => { m.rotation.y += dt * 0.6; });

    if (fly) {
      const t = Math.min(1, (performance.now() - fly.t0) / fly.ms);
      const k = easeInOut(t);
      camPos.set(lerp(fly.fromP.x, fly.toP.x, k), lerp(fly.fromP.y, fly.toP.y, k), lerp(fly.fromP.z, fly.toP.z, k));
      camLook.set(lerp(fly.fromL.x, fly.toL.x, k), lerp(fly.fromL.y, fly.toL.y, k), lerp(fly.fromL.z, fly.toL.z, k));
      if (t >= 1) fly = null;
    }
    cam.position.set(camPos.x, camPos.y, camPos.z);
    cam.lookAt(camLook);
  });

  onSpot?.(planets[0].domain, planets[0].roles);

  return {
    space: s, focus, back, pickRole,
    spotPlanet: () => planets[spot],
    projectSpot(out) { return focused < 0 ? s.project(planets[spot].holder, null, out) : null; },
    setPaused(v) { s.paused = v; },
    get focused() { return focused >= 0 ? planets[focused].domain : null; }
  };
}
