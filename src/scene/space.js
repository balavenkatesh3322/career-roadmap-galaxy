// Shared PixiJS 3D setup: transparent canvas over a CSS starfield, glossy materials, DOM labels.
import { Application, Point } from 'pixi.js';
import {
  View3D, DirectionalLight, Material3D, Mesh3D, SphereGeometry, TorusGeometry, CylinderGeometry, Container3D, Vector3
} from '@pixi/3d';
import { BloomEffect } from '@pixi/3d/extras';
import { reducedMotion } from '../lib/ui.js';

const geo = {};
export const GEO = {
  sphere: () => (geo.sphere ||= new SphereGeometry({ radius: 1, widthSegments: 48, heightSegments: 32 })),
  gem: () => (geo.gem ||= new SphereGeometry({ radius: 1, widthSegments: 4, heightSegments: 2 })), // an octahedron
  ring: () => (geo.ring ||= new TorusGeometry({ radius: 1.7, tube: 0.045, radialSegments: 12, tubularSegments: 96 })),
  rod: () => (geo.rod ||= new CylinderGeometry({ radiusTop: 1, radiusBottom: 1, height: 1, radialSegments: 8 }))
};

export function glossy(color, { emissive = 0, roughness = 0.26 } = {}) {
  return new Material3D({ baseColor: color, roughness, metallic: 0.04, clearcoat: {}, emissive: { color, strength: emissive } });
}
export function flatGlow(color, alpha = 0.6) {
  return new Material3D({ baseColor: color, roughness: 1, metallic: 0, alphaMode: 'blend', alpha, emissive: { color, strength: 1.4 } });
}

/** Creates a 3D stage inside `host` (position: relative). Returns null when WebGL is unavailable. */
export async function createSpace(host, { fov = 38, bloom = true, interactive = true } = {}) {
  const stageEl = document.createElement('div');
  stageEl.className = 'stage3d';
  host.prepend(stageEl);
  const labelLayer = document.createElement('div');
  labelLayer.className = 'labels';
  host.appendChild(labelLayer);

  const app = new Application();
  try {
    await app.init({ resizeTo: stageEl, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2) });
  } catch (err) {
    console.warn('[career-galaxy] WebGL unavailable', err);
    stageEl.remove();
    const note = document.createElement('p');
    note.className = 'no-webgl-note glass';
    note.textContent = '3D needs WebGL, which this browser has turned off. Everything else on the page still works.';
    host.appendChild(note);
    return null;
  }
  stageEl.appendChild(app.canvas);
  app.canvas.setAttribute('aria-hidden', 'true');

  const view = new View3D({
    autoResize: true,
    toneMapping: 'aces',
    environment: { skyColor: 0xd9d0ff, groundColor: 0x2a2147, intensity: 0.95 },
    passes: bloom ? [new BloomEffect({ intensity: 0.85, radius: 0.55 })] : []
  });
  if (!interactive) view.eventMode = 'none';
  app.stage.addChild(view);
  view.camera.fov = fov;

  const key = new DirectionalLight({ color: 0xffffff, intensity: 3.2 });
  key.position.set(5, 8, 7); key.lookAt({ x: 0, y: 0, z: 0 });
  const rim = new DirectionalLight({ color: 0xb9a6ff, intensity: 1.8 });
  rim.position.set(-7, 2, -6); rim.lookAt({ x: 0, y: 0, z: 0 });
  const fill = new DirectionalLight({ color: 0x7ee8ff, intensity: 0.8 });
  fill.position.set(-4, -3, 6); fill.lookAt({ x: 0, y: 0, z: 0 });
  const content = new Container3D();
  view.root.addChild(key, rim, fill, content);

  // ---- DOM labels pinned to 3D nodes ----
  const labels = new Set();
  const world = new Vector3();
  const screen = new Point();
  function addLabel({ text, node, offset = [0, 0, 0], className = '', onClick, title } = {}) {
    const el = document.createElement(onClick ? 'button' : 'span');
    if (onClick) { el.type = 'button'; el.addEventListener('click', onClick); }
    el.className = `lbl ${className} ${onClick ? '' : 'static'}`;
    el.textContent = text;
    if (title) el.title = title;
    labelLayer.appendChild(el);
    const l = { el, node, offset: new Vector3(...offset), visible: true };
    labels.add(l);
    return l;
  }
  function removeLabel(l) { l.el.remove(); labels.delete(l); }
  function clearLabels() { labels.forEach((l) => l.el.remove()); labels.clear(); }
  function project(node, offset, out = new Point()) {
    node.getGlobalPosition(world);
    if (offset) world.add(offset);
    return view.worldToScreen(world, out);
  }
  function updateLabels() {
    for (const l of labels) {
      if (!l.visible || !l.node.visible) { l.el.style.display = 'none'; continue; }
      const p = project(l.node, l.offset, screen);
      if (!p) { l.el.style.display = 'none'; continue; }
      l.el.style.display = '';
      l.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, 0)`;
    }
  }
  app.ticker.add(updateLabels);

  // ---- pause when off screen / hidden / reduced motion ----
  let paused = reducedMotion();
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) app.ticker.start(); else app.ticker.stop(); });
  io.observe(host);
  const onVis = () => (document.hidden ? app.ticker.stop() : app.ticker.start());
  document.addEventListener('visibilitychange', onVis);

  return {
    app, view, content, labelLayer, addLabel, removeLabel, clearLabels, project,
    get paused() { return paused; },
    set paused(v) { paused = v; host.classList.toggle('paused', v); },
    destroy() { io.disconnect(); document.removeEventListener('visibilitychange', onVis); clearLabels(); app.destroy(true, { children: true }); }
  };
}

/** A clickable glossy planet (+ optional ring). */
export function makePlanet(color, { radius = 1, ringed = false, emissive = 0.08, parent } = {}) {
  const holder = new Container3D();
  const mat = glossy(color, { emissive });
  const ball = new Mesh3D({ geometry: GEO.sphere(), material: mat, eventMode: 'static', cursor: 'pointer' });
  holder.addChild(ball);
  let ring = null;
  if (ringed) {
    ring = new Mesh3D({ geometry: GEO.ring(), material: flatGlow(0xe7defe, 0.75) });
    ring.rotation.set(0.35, 0, 0.25);
    holder.addChild(ring);
  }
  holder.scale.set(radius, radius, radius);
  if (parent) parent.addChild(holder);
  return { holder, ball, ring, mat };
}

/** A thin glowing rod between two points (for links / paths). */
export function makeRod(a, b, { color = 0xc4b0ff, thickness = 0.03, alpha = 0.55, parent } = {}) {
  const pivot = new Container3D();
  const rod = new Mesh3D({ geometry: GEO.rod(), material: flatGlow(color, alpha) });
  rod.rotation.set(Math.PI / 2, 0, 0);
  pivot.addChild(rod);
  setRod(pivot, rod, a, b, thickness);
  if (parent) parent.addChild(pivot);
  return { pivot, rod, set: (p, q) => setRod(pivot, rod, p, q, thickness) };
}
function setRod(pivot, rod, a, b, thickness) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const len = Math.hypot(dx, dy, dz) || 0.0001;
  pivot.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  pivot.lookAt({ x: b.x, y: b.y, z: b.z });
  rod.scale.set(thickness, len, thickness);
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export { Vector3, Mesh3D, Container3D };
