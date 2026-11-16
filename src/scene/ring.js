// "Switch careers" ring: career planets on a spinning 3D ring. Click one (or use the arrows) to bring it to the front.
import { TorusGeometry } from '@pixi/3d';
import { createSpace, makePlanet, Mesh3D, Container3D, flatGlow, lerp } from './space.js';
import { styleOf } from '../lib/data.js';

export async function createRing(host, roles, { onPick } = {}) {
  const s = await createSpace(host, { fov: 34 });
  if (!s) return null;
  const R = 4.6;
  const ring = new Container3D();
  ring.position.set(0, -0.9, 0);
  s.content.addChild(ring);
  ring.addChild(new Mesh3D({ geometry: new TorusGeometry({ radius: R, tube: 0.014, radialSegments: 6, tubularSegments: 140 }), material: flatGlow(0xc8b8ff, 0.45) }));
  const spin = new Container3D();
  ring.addChild(spin);

  const items = roles.map((role, i) => {
    const st = styleOf(role.domain);
    const p = makePlanet(st.color, { radius: 0.55, ringed: false, parent: spin });
    const a = (i / roles.length) * Math.PI * 2;
    p.holder.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    p.base = a; p.role = role;
    p.ball.on('pointertap', (e) => { if (e.button === 0) pick(i); });
    p.label = s.addLabel({ text: role.title, node: p.holder, offset: [0, -0.95, 0], className: 'sm', onClick: () => pick(i) });
    return p;
  });

  const cam = s.view.camera;
  cam.position.set(0, 2.2, 12.5);
  cam.lookAt({ x: 0, y: -0.6, z: 0 });

  let angle = 0, target = null, selected = 0;
  // front of the ring faces the camera (+Z): planet angle a + angle should equal PI/2
  const frontAngleFor = (i) => {
    const base = Math.PI / 2 - items[i].base;
    return base + Math.round((angle - base) / (Math.PI * 2)) * Math.PI * 2;
  };
  function pick(i) {
    selected = (i + items.length) % items.length;
    target = frontAngleFor(selected);
    items.forEach((p, j) => p.label.el.classList.toggle('on', j === selected));
    onPick?.(items[selected].role, selected);
  }

  s.app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    if (target != null) { angle = lerp(angle, target, Math.min(1, dt * 5)); if (Math.abs(angle - target) < 0.001) angle = target; }
    else if (!s.paused) angle += dt * 0.12;
    spin.rotation.y = -angle;
    items.forEach((p, j) => {
      p.ball.rotation.y += dt * 0.4;
      p.mat.emissive.strength = lerp(p.mat.emissive.strength, j === selected ? 1.2 : 0.08, Math.min(1, dt * 4));
      const sc = j === selected ? 0.75 : 0.55; p.holder.scale.set(lerp(p.holder.scale.x, sc, dt * 6), lerp(p.holder.scale.y, sc, dt * 6), lerp(p.holder.scale.z, sc, dt * 6));
    });
  });

  return { space: s, pick, next: () => pick(selected + 1), prev: () => pick(selected - 1), get selected() { return selected; } };
}
