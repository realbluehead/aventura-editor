// Peces comunes dels decorats: retalls d'objectes, punts calents a partir de coses en 3D, mobles i habitacions.
import { Canvas, mix, rng, Cam, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide, floorPoly, addLight } from "./persp.mjs";
export * from "./persp.mjs";

export const STD = { vx: 160, vy: 62, f: 250, E: 3.3 };

// Polígon rectangular que envolta uns punts 3D projectats (per als punts calents)
export function hb(cam, pts, pad = 1) {
  const s = pts.map((p) => cam.p(...p));
  const xs = s.map((p) => p[0]), ys = s.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - pad), x1 = Math.min(320, Math.ceil(Math.max(...xs)) + pad);
  const y0 = Math.max(0, Math.floor(Math.min(...ys)) - pad), y1 = Math.min(199, Math.ceil(Math.max(...ys)) + pad);
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}
export const hbBox = (cam, x0, x1, y0, y1, z0, z1, pad) => hb(cam, [[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0], [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]], pad);
export const hbBack = (cam, x0, x1, y0, y1, z, pad) => hb(cam, [[x0, y0, z], [x1, y1, z]], pad);
export const hbSide = (cam, x, z0, z1, y0, y1, pad) => hb(cam, [[x, y0, z0], [x, y1, z0], [x, y0, z1], [x, y1, z1]], pad);
// Un punt del terra en pantalla
export const at = (cam, X, Z, Y = 0) => cam.p(X, Y, Z).map(Math.round);

// Retalla un o més dibuixos (fets amb la càmera de l'escenari sobre un llenç buit) a la mateixa capsa:
// en surten les imatges dels estats d'un objecte i la posició (base, al mig) on s'ha de col·locar.
export const CUTS = [];
export function cut(...fns) {
  const full = fns.map((fn) => { if (!fn) return null; const c = new Canvas(320, 200); fn(c); return c; });
  let done = null;
  const o = { full, get imgs() { return (done ??= crop(full)).imgs; }, get pos() { return (done ??= crop(full)).pos; } };
  CUTS.push(o);
  return o;
}
// Com cut(), però cada estat pot ser una llista de dibuixos (els fotogrames d'una animació). imgs torna, per estat,
// un Canvas o una llista de Canvas, tots retallats a la mateixa capsa.
export function cutAnim(...states) {
  const flat = [], groups = states.map((st) => (Array.isArray(st) ? st.map((f) => flat.push(f) - 1) : flat.push(st) - 1));
  const o = cut(...flat);
  return { full: o.full, get imgs() { const im = o.imgs; return groups.map((g) => (Array.isArray(g) ? g.map((i) => im[i]) : im[g])); }, get pos() { return o.pos; } };
}
// N fotogrames d'un mateix dibuix: fn(llenç, f, N)
export const frames = (N, fn) => Array.from({ length: N }, (_, f) => (k) => fn(k, f, N));
export function crop(full) {
  let x0 = 320, y0 = 200, x1 = -1, y1 = -1;
  for (const c of full) if (c) for (let y = 0; y < 200; y++) for (let x = 0; x < 320; x++) if (c.data[(y * 320 + x) * 4 + 3]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) throw new Error("Retall buit");
  let w = x1 - x0 + 1, h = y1 - y0 + 1;
  if (w % 2) { w++; }                     // amplada parella: la posició queda en un píxel sencer
  const imgs = full.map((c) => {
    if (!c) return null;
    const o = new Canvas(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x0 + x, Y = y0 + y; if (X < 320) { const p = c.get(X, Y); if (p[3]) o.px(x, y, p); } }
    return o;
  });
  return { imgs, pos: [x0 + w / 2, y0 + h] };
}

/* ---------- Habitació ---------- */

// Dibuixa una habitació rectangular: sostre, parets laterals, paret del fons i terra (callback).
export function room(c, cam, { xl, xr, zb, hgt, wall = "#5b5468", joint = "#463f52", ceil = "#2c2633", floor, back = true, sides = true, stone = { h: 0.45, w: 0.9 } }) {
  c.rect(0, 0, c.w, c.h, mix(wall, "#000", 0.5));
  if (hgt) quad(c, cam, [[xl, hgt, 0.5], [xr, hgt, 0.5], [xr, hgt, zb], [xl, hgt, zb]], ceil);
  if (sides) {
    stoneSide(c, cam, xl, 0.5, zb, 0, hgt ?? 12, mix(wall, "#000", 0.12), joint, stone);
    stoneSide(c, cam, xr, 0.5, zb, 0, hgt ?? 12, mix(wall, "#000", 0.18), joint, stone);
  }
  if (back) stoneBack(c, cam, xl, xr, 0, hgt ?? 12, zb, wall, joint, stone);
  if (floor) floor();
  // sòcol fosc on la paret toca a terra
  seg(c, cam, [xl, 0, 0.5], [xl, 0, zb], mix(joint, "#000", 0.3));
  seg(c, cam, [xr, 0, 0.5], [xr, 0, zb], mix(joint, "#000", 0.3));
  seg(c, cam, [xl, 0, zb], [xr, 0, zb], mix(joint, "#000", 0.3));
}
// Bigues del sostre
export function beams(c, cam, xl, xr, hgt, z0, z1, step, col) {
  for (let z = z0; z <= z1; z += step) box(c, cam, xl, xr, hgt - 0.25, hgt, z, z + 0.25, { front: col, bottom: mix(col, "#000", 0.2) });
}

/* ---------- Mobles ---------- */

export function table(c, cam, x0, x1, z0, z1, h, col, { cloth = null } = {}) {
  const leg = mix(col, "#000", 0.3), t = 0.08;
  for (const [x, z] of [[x0 + 0.05, z1 - 0.15], [x1 - 0.15, z1 - 0.15]]) box(c, cam, x, x + t, 0, h, z, z + t, { front: leg });
  floorQ(c, cam, x0 + 0.1, x1 - 0.1, z0 + 0.1, z1 - 0.1, [0, 0, 0, 60]);
  for (const [x, z] of [[x0 + 0.05, z0 + 0.05], [x1 - 0.15, z0 + 0.05]]) box(c, cam, x, x + t, 0, h, z, z + t, { front: leg });
  box(c, cam, x0, x1, h - 0.07, h, z0, z1, { front: mix(col, "#000", 0.15), top: cloth ?? col });
}
export function bench(c, cam, x0, x1, z0, z1, h, col) { box(c, cam, x0, x1, h - 0.06, h, z0, z1, { front: mix(col, "#000", 0.2), top: col }); box(c, cam, x0 + 0.05, x1 - 0.05, 0, h - 0.06, z0 + 0.1, z0 + 0.16, { front: mix(col, "#000", 0.4) }); }

// Llit de pals amb cortines (de la casa de Gryffindor). Capçal a z1 (o a x0 si «side»).
export function bed(c, cam, x0, x1, z0, z1, { curtain = "#8b1a1a", blanket = "#a3252a", gold = "#c9a227" } = {}) {
  const post = "#3a2414", ph = 2.15;
  const posts = [[x0, z1 - 0.1], [x1 - 0.1, z1 - 0.1], [x0, z0], [x1 - 0.1, z0]];
  for (const [x, z] of posts.slice(0, 2)) box(c, cam, x, x + 0.1, 0, ph, z, z + 0.1, { front: post });
  // cortina del capçal i laterals recollides
  backQ(c, cam, x0 + 0.1, x1 - 0.1, 0.5, ph, z1 - 0.05, mix(curtain, "#000", 0.3));
  box(c, cam, x0, x1, 0, 0.45, z0, z1, { front: "#4a2e18", top: "#4a2e18" });
  box(c, cam, x0 + 0.02, x1 - 0.02, 0.45, 0.62, z0 + 0.02, z1 - 0.02, { front: blanket, top: mix(blanket, "#fff", 0.1) });
  box(c, cam, x0 + 0.15, x1 - 0.15, 0.62, 0.75, z1 - 0.55, z1 - 0.15, { front: "#e8e0d0", top: "#f4ecdc" });
  floorQ(c, cam, x0 + 0.02, x1 - 0.02, z0 + 0.6, z0 + 0.8, gold, 0.625);
  for (const [x, z] of posts.slice(2)) box(c, cam, x, x + 0.1, 0, ph, z, z + 0.1, { front: post });
  sideQ(c, cam, x0 + 0.05, z0 + 0.1, z0 + 0.5, 0.7, ph, curtain);
  sideQ(c, cam, x1 - 0.05, z0 + 0.1, z0 + 0.5, 0.7, ph, mix(curtain, "#000", 0.15));
  box(c, cam, x0 - 0.05, x1 + 0.05, ph, ph + 0.2, z0 - 0.05, z1 + 0.05, { front: curtain, bottom: mix(curtain, "#000", 0.4), top: curtain });
  backQ(c, cam, x0 - 0.05, x1 + 0.05, ph + 0.05, ph + 0.1, z0 - 0.06, gold);
}
// Butaca
export function armchair(c, cam, x0, x1, z0, z1, col) {
  box(c, cam, x0, x1, 0, 1.05, z1 - 0.2, z1, { front: mix(col, "#000", 0.1) });
  box(c, cam, x0, x1, 0, 0.45, z0, z1, { front: mix(col, "#000", 0.25), top: col });
  box(c, cam, x0, x0 + 0.18, 0, 0.7, z0, z1, { front: mix(col, "#000", 0.15), top: col });
  box(c, cam, x1 - 0.18, x1, 0, 0.7, z0, z1, { front: mix(col, "#000", 0.15), top: col });
}
// Foc (flames a la mida)
export function fire(c, cam, X, Z, w, seed = 4) {
  const [x, y] = cam.p(X, 0, Z), s = cam.s(Z), r = rng(seed);
  addLight(c, X, 0.5, Z - 0.4, [1.0, 0.55, 0.25], 2.5 + w * 2, 1.3, { kind: "fire", fx: x, fy: y, fw: w * s, fs: s, sx: x, sy: y - s * 0.3, sr: s * (0.8 + w) });
  for (let k = 0; k < 9; k++) {
    const fx = x + (r() - 0.5) * w * s, h = (0.25 + r() * 0.45) * s;
    c.ellipse(fx, y - h / 2, Math.max(1, s * 0.08), h / 2, k % 3 ? "#ff7a1a" : "#ffb02e");
    c.ellipse(fx, y - h / 3, Math.max(1, s * 0.04), h / 4, "#ffe27a");
  }
  c.rect(x - (w * s) / 2, y - 2, w * s, 2, "#3a1a0a");
}
// Llar de foc a la paret del fons (de x0 a x1)
export function fireplace(c, cam, x0, x1, z, { stone = "#7a6e6a", h = 2.2 } = {}) {
  box(c, cam, x0, x1, 0, h, z - 0.5, z, { front: stone, top: mix(stone, "#fff", 0.1) });
  box(c, cam, x0 - 0.15, x1 + 0.15, h, h + 0.15, z - 0.65, z, { front: mix(stone, "#000", 0.2), top: mix(stone, "#fff", 0.2) });
  const w = x1 - x0;
  backQ(c, cam, x0 + w * 0.2, x1 - w * 0.2, 0, h * 0.5, z - 0.51, "#1a0e0a");
  fire(c, cam, (x0 + x1) / 2, z - 0.6, w * 0.45);
}
// Un quadre penjat al fons. fn(c, x, y, w, h) hi pinta el que hi surt.
export function painting(c, cam, X0, X1, Y0, Y1, Z, fn, frame = "#b08a2a") {
  const [a, b] = [cam.p(X0, Y1, Z), cam.p(X1, Y0, Z)];
  c.rect(a[0] - 1, a[1] - 1, b[0] - a[0] + 2, b[1] - a[1] + 2, frame);
  c.rect(a[0], a[1], b[0] - a[0], b[1] - a[1], "#2a2030");
  fn?.(c, Math.round(a[0]), Math.round(a[1]), Math.round(b[0] - a[0]), Math.round(b[1] - a[1]));
}
// Un retrat petit (cara i espatlles) dins d'un quadre
export function portraitFace(skin, coat, hair, sleep = false) {
  return (c, x, y, w, h) => {
    c.rect(x, y, w, h, "#3a3048");
    c.ellipse(x + w / 2, y + h * 0.95, w * 0.42, h * 0.32, coat);
    c.ellipse(x + w / 2, y + h * 0.45, Math.max(1, w * 0.22), Math.max(1, h * 0.22), skin);
    if (hair) c.rect(x + w * 0.28, y + h * 0.2, w * 0.44, Math.max(1, h * 0.1), hair);
    if (w > 6) { c.px(x + w * 0.42, y + h * 0.43, sleep ? mix(skin, "#000", 0.4) : "#111"); c.px(x + w * 0.58, y + h * 0.43, sleep ? mix(skin, "#000", 0.4) : "#111"); }
  };
}
// Escala que puja cap al fons (graons de «rise» per «run»)
export function stairsUp(c, cam, x0, x1, z0, n, run, rise, col) {
  for (let k = n - 1; k >= 0; k--) {
    const z = z0 + k * run;
    box(c, cam, x0, x1, 0, (k + 1) * rise, z, z + run, { front: mix(col, "#000", 0.15 + (k % 2) * 0.05), top: mix(col, "#fff", 0.08) });
  }
}
// Forat amb escala que baixa (al terra, de z0 a z1)
export function stairsDown(c, cam, x0, x1, z0, z1, col) {
  floorQ(c, cam, x0, x1, z0, z1, "#0c0a10");
  const n = 6, run = (z1 - z0) / n;
  for (let k = 0; k < n; k++) {
    const z = z0 + k * run, y = -(k + 1) * 0.25;
    floorQ(c, cam, x0 + 0.05, x1 - 0.05, z, z + run, mix(col, "#000", 0.2 + k * 0.12), y);
  }
  seg(c, cam, [x0, 0, z1], [x1, 0, z1], mix(col, "#fff", 0.2));
}
