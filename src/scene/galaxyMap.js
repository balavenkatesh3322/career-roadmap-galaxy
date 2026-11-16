// Galaxy explorer: the selected domain sits at the centre with its careers as moons;
// other domains ring around it; glowing links join domains that share the most skills.
import { OrbitCamera } from '@pixi/3d/extras';
import { createSpace, makePlanet, makeRod, glossy, Mesh3D, Container3D, Vector3, GEO, lerp } from './space.js';
import { domains, rolesIn, styleOf } from '../lib/data.js';

/** Domains ranked by how many skills their careers share with `id`. */
export function relatedDomains(id, k = 3) {
  const skillsOf = (d) => new Set(rolesIn(d).flatMap((r) => r.skills || []));
  const mine = skillsOf(id);
  return domains.filter((d) => d.id !== id)
    .map((d) => ({ d, shared: [...skillsOf(d.id)].filter((s) => mine.has(s)).length }))
    .sort((a, b) => b.shared - a.shared).slice(0, k).map((x) => x.d.id);
}

export async function createGalaxyMap(host, { onDomain, onRole } = {}) {
  const s = await createSpace(host, { fov: 40 });
  if (!s) return null;
  const { view, content } = s;
  const world = new Container3D();
  content.addChild(world);

  const planets = domains.map((d) => {
    const st = styleOf(d.id);
    const roles = rolesIn(d.id);
    const p = makePlanet(st.color, { radius: 0.5 + roles.length * 0.05, ringed: !!st.ringed, parent: world });
    p.domain = d; p.roles = roles; p.pos = new Vector3(); p.to = new Vector3(); p.size = 1;
    p.ball.on('pointertap', (e) => { if (e.button === 0) select(d.id); });
    p.label = s.addLabel({ text: d.name, node: p.holder, offset: [0, -1.2, 0], onClick: () => select(d.id) });
    return p;
  });

  const moonsGroup = new Container3D();
  world.addChild(moonsGroup);
  const linkGroup = new Container3D();
  world.addChild(linkGroup);
  let moons = [], links = [], selected = null, roleSel = null;

  let firstLayout = true;
  function layout(selId) {
    const others = planets.filter((p) => p.domain.id !== selId);
    // fit the outer ring inside the visible area at the camera distance
    const dist = view.camera.position.z || 22;
    const half = Math.tan((view.camera.fov * Math.PI) / 360) * dist;
    const aspect = s.app.screen.width / Math.max(1, s.app.screen.height);
    const rx = Math.min(9.6, half * aspect * 0.74), ry = Math.min(5.6, half * 0.66);
    planets.forEach((p) => {
      if (p.domain.id === selId) { p.to.set(0, 0, 0); p.size = 1.3; }
      else {
        const k = others.indexOf(p);
        const a = -Math.PI / 2 + (k / others.length) * Math.PI * 2;
        p.to.set(Math.cos(a) * rx, Math.sin(a) * ry, -3); p.size = 0.85;
      }
    });
    if (firstLayout) { planets.forEach((p) => p.pos.copyFrom(p.to)); firstLayout = false; }
  }

  function select(id, roleId = null) {
    selected = id; roleSel = null;
    layout(id);
    // moons
    moons.forEach((m) => s.removeLabel(m.label)); moonsGroup.removeChildren(); moons = [];
    const p = planets.find((q) => q.domain.id === id);
    const n = p.roles.length;
    moons = p.roles.map((role, k) => {
      const a = -Math.PI / 2 + ((k + 0.5) / n) * Math.PI * 2;
      const m = new Mesh3D({ geometry: GEO.sphere(), material: glossy(0xf1edff, { emissive: 0.1 }), eventMode: 'static', cursor: 'pointer' });
      m.position.set(Math.cos(a) * 3.1, Math.sin(a) * 2.5, 1.4);
      m.scale.set(0.2, 0.2, 0.2); m.role = role;
      m.on('pointertap', (e) => { if (e.button === 0) pickRole(role.id); });
      moonsGroup.addChild(m);
      const left = Math.cos(a) < -0.2;
      m.label = s.addLabel({ text: role.title, node: m, offset: [left ? -0.3 : 0.3, -0.1, 0], className: 'sm', onClick: () => pickRole(role.id) });
      m.label.el.style.translate = left ? '-50% 0' : '50% 0';
      return m;
    });
    // links to related domains
    linkGroup.removeChildren(); links = []; // rods share one cached geometry, so just detach them
    relatedDomains(id).forEach((rid) => {
      const q = planets.find((x) => x.domain.id === rid);
      links.push({ rod: makeRod(new Vector3(0, 0, 0), q.to, { parent: linkGroup, color: 0xc4b0ff, thickness: 0.025, alpha: 0.5 }), q });
    });
    planets.forEach((q) => q.label.el.classList.toggle('on', q.domain.id === id));
    onDomain?.(p.domain, p.roles);
    if (roleId) pickRole(roleId); else if (p.roles[0]) pickRole(p.roles[0].id);
  }

  function pickRole(roleId) {
    roleSel = roleId;
    const p = planets.find((q) => q.domain.id === selected);
    moons.forEach((m) => {
      const on = m.role.id === roleId;
      m.material = glossy(on ? styleOf(p.domain.id).color : 0xf1edff, { emissive: on ? 1 : 0.1 });
      const sc = on ? 0.3 : 0.2; m.scale.set(sc, sc, sc);
      m.label.el.classList.toggle('on', on);
    });
    onRole?.(moons.find((m) => m.role.id === roleId)?.role);
  }

  // camera + orbit
  view.camera.position.set(0, 1.5, 22);
  const orbit = new OrbitCamera({ view, target: { x: 0, y: 0, z: 0 }, enableDamping: true, minDistance: 10, maxDistance: 34 });

  planets.forEach((p) => { p.pos.set(0, 0, 0); });
  s.app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    const k = Math.min(1, dt * 3.2);
    planets.forEach((p) => {
      p.pos.set(lerp(p.pos.x, p.to.x, k), lerp(p.pos.y, p.to.y, k), lerp(p.pos.z, p.to.z, k));
      p.holder.position.set(p.pos.x, p.pos.y, p.pos.z);
      const r = (0.5 + p.roles.length * 0.05) * p.size;
      const cur = p.holder.scale.x; const nx = lerp(cur, r, k); p.holder.scale.set(nx, nx, nx);
      p.label.offset.set(0, -(nx + 0.4), 0);
      if (!s.paused) p.ball.rotation.y += dt * 0.3;
      p.mat.emissive.strength = lerp(p.mat.emissive.strength, p.domain.id === selected ? 0.5 : 0.08, k);
    });
    links.forEach((l) => l.rod.set(new Vector3(0, 0, 0), l.q.pos));
    if (!s.paused) moonsGroup.rotation.z += dt * 0.03;
  });

  return { space: s, select, pickRole, orbit, zoom: (f) => { view.camera.position.set(view.camera.position.x * f, view.camera.position.y * f, view.camera.position.z * f); }, reset: () => { view.camera.position.set(0, 1.5, 22); } };
}
