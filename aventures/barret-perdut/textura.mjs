// Textures procedurals projectades en perspectiva, llum (torxes, foc, finestres), ombres als racons i boira.
// Cada material és una funció (X, Y, Z, eix, x, y) → color que rep el punt del món que es veu en aquell píxel:
// per això les textures s'encongeixen amb la distància i segueixen les parets. Hi ha quatre estils (ESTILS);
// render() dibuixa un escenari amb un estil i després l'il·lumina.
import { setTheme } from "./persp.mjs";
import { CUTS } from "./comu.mjs";
const K = await import(new URL("../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const { PALETTES, rgba } = K;

/* ---------- Soroll ---------- */
function hash(i, j, k = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const sm = (t) => t * t * (3 - 2 * t);
function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const fbm = (x, y, s = 0) => (vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 9) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 17) * 0.15);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

const C = (c) => { const v = rgba(c); return [v[0], v[1], v[2]]; };
const out = (r, g, b) => [Math.max(0, Math.min(255, r)) | 0, Math.max(0, Math.min(255, g)) | 0, Math.max(0, Math.min(255, b)) | 0, 255];
const scale = (c, k) => out(c[0] * k, c[1] * k, c[2] * k);
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// Coordenades de la superfície segons l'eix del pla: (u horitzontal, v vertical o profunditat)
const uv = (X, Y, Z, axis) => (axis === 3 ? [X, Y] : axis === 1 ? [Z, Y] : [X, Z]);
const isWood = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return r >= g && g >= b && mx > 40 && mx < 190 && (mx - mn) / mx > 0.3; };

/* ---------- Materials (paràmetres de l'estil «o») ---------- */
function materials(o) {
  const M = {};
  // Pedra en filades: blocs amb variació, juntes, bisell (llum a dalt, ombra a baix), esquerdes i molsa
  M.stone = (base, joint, { h = 0.45, w = 0.9 } = {}) => {
    const B = C(base), J = C(joint), hh = h * o.blockH, ww = w * o.blockW, m = o.mortar;
    return (X, Y, Z, axis) => {
      const [u, v] = uv(X, Y, Z, axis);
      const row = Math.floor(v / hh), off = (row & 1) * ww * 0.5 + hash(row, 7) * ww * o.irregular;
      const wi = ww * (0.8 + hash(row, 3) * 0.4 * o.irregular);
      const uu = u + off, col = Math.floor(uu / wi), fu = uu - col * wi, fv = v - row * hh;
      if (fu < m || fv < m) { const k = o.jointK * (0.85 + vnoise(u * 9, v * 9) * 0.3); return scale(J, k); }
      let k = 1 + (hash(col, row) - 0.5) * o.blockVar + (fbm(u * o.grainF, v * o.grainF, col) - 0.5) * o.grain + (hash(Math.floor(u * 60), Math.floor(v * 60)) - 0.5) * o.fine;
      if (fv > hh - o.bevel) k += o.bevelK; else if (fv < m + o.bevel) k -= o.bevelK;
      if (fu < m + o.bevel) k += o.bevelK * 0.5; else if (fu > wi - o.bevel) k -= o.bevelK * 0.6;
      if (o.cracks && hash(col, row, 5) < o.cracks) { const d = Math.abs(fu - wi * 0.3 - (fv - hh * 0.5) * (hash(col, row, 6) - 0.5) * 2 - Math.sin(fv * 40) * 0.015); if (d < 0.014) k -= 0.35; }
      let c = [B[0] * k, B[1] * k, B[2] * k];
      if (o.moss && axis !== 2 && Y < 1.4) { const t = Math.max(0, fbm(u * 1.6, v * 1.6, 3) - 0.45) * 2.2 * (1.4 - Y) / 1.4 * o.moss; if (t > 0) c = lerp3(c, [58, 82, 44], Math.min(0.7, t)); }
      if (o.damp && axis !== 2) { const t = Math.max(0, fbm(u * 0.7, v * 2.5, 11) - 0.55) * o.damp; c = lerp3(c, [c[0] * 0.6, c[1] * 0.62, c[2] * 0.66], Math.min(1, t * 3)); }
      return out(...c);
    };
  };
  // Rajoles (escaquer o d'un sol color) amb junta, variació, desgast i reflex
  M.tiles = (a, b, size, x0 = 0, z0 = 0) => {
    const A = C(a), Bc = C(b), G = scale(lerp3(A, Bc, 0.5), 0.55), g = o.grout;
    return (X, Y, Z, axis) => {
      const u = X - x0, v = Z - z0, i = Math.floor(u / size), j = Math.floor(v / size), fu = u - i * size, fv = v - j * size;
      if (fu < g || fv < g) return G;
      const base = (i + j) & 1 ? A : Bc;
      let k = 1 + (hash(i, j, 2) - 0.5) * o.tileVar + (fbm(u * 2.2, v * 2.2, 4) - 0.5) * o.grain + (hash(Math.floor(u * 50), Math.floor(v * 50), 1) - 0.5) * o.fine;
      if (fu > size - o.bevel * 0.7 || fv > size - o.bevel * 0.7) k -= o.bevelK * 0.7;
      if (o.marble) { const vein = Math.abs(Math.sin((u * 1.7 + v * 0.9 + fbm(u * 1.3, v * 1.3, i + j * 7) * 4) * 3)); if (vein < 0.06) k += 0.18; }
      if (o.cracks && hash(i, j, 9) < o.cracks * 0.7) { const d = Math.abs(fu - fv * (hash(i, j, 8) * 2 - 1) - size * 0.4); if (d < 0.015) k -= 0.3; }
      return scale(base, k);
    };
  };
  // Taulons: juntes, testes, veta i nusos
  M.planks = (col, line, w, x0 = 0) => {
    const P = C(col), L = C(line);
    return (X, Y, Z, axis) => {
      const u = X - x0, i = Math.floor(u / w), fu = u - i * w;
      const len = 1.4 + hash(i, 4) * 2.4, vv = Z + hash(i, 5) * 3, j = Math.floor(vv / len), fv = vv - j * len;
      if (fu < 0.02 || fv < 0.025) return scale(L, 0.85);
      let k = 1 + (hash(i, j, 3) - 0.5) * o.plankVar;
      k += Math.sin((fu / w) * Math.PI * 2 * 2.5 + fbm(vv * 0.6, i * 3.1, 2) * o.grainWood) * 0.06 + (hash(Math.floor(u * 70), Math.floor(Z * 20)) - 0.5) * o.fine;
      if (hash(i, j, 7) < 0.25) { const dk = Math.hypot(fu - w * 0.5, (fv - len * 0.5) * 0.5); if (dk < 0.05) k -= 0.3; else if (dk < 0.08) k -= 0.12; }
      if (fu > w - 0.03) k -= 0.1;
      return scale(P, k);
    };
  };
  // Fusta dels mobles (veta en una direcció segons la cara)
  M.wood = (col) => {
    const P = C(col);
    return (X, Y, Z, axis) => {
      const [u, v] = uv(X, Y, Z, axis);
      const along = axis === 1 ? Z : X, across = axis === 2 ? Z : Y;
      let k = 1 + Math.sin(across * 38 + fbm(along * 1.5, across * 6, 1) * o.grainWood * 1.4) * 0.07 + (fbm(u * 3, v * 3, 2) - 0.5) * o.grain * 0.8;
      return scale(P, k);
    };
  };
  // Qualsevol altra superfície: una mica de gra perquè no sigui plana
  M.generic = (col) => {
    const P = C(col);
    return (X, Y, Z, axis) => { const [u, v] = uv(X, Y, Z, axis); return scale(P, 1 + (fbm(u * 2.5, v * 2.5, 5) - 0.5) * o.grain * 0.9 + (hash(Math.floor(u * 45), Math.floor(v * 45), 2) - 0.5) * o.fine * 0.8); };
  };
  M.auto = (col, axis) => { const v = rgba(col); if (v[3] < 255) return () => v; const c = C(col); return isWood(c) ? M.wood(col) : M.generic(col); };
  // Herba: clapes, tiges (gra que es fa petit amb la distància) i, si cal, franges de camp segat
  M.grass = (near, far, z0, z1, stripes = 0, dirt = null) => {
    const N = C(near), F = C(far), D = dirt ? C(dirt) : null;
    return (X, Y, Z) => {
      const t = Math.min(1, (Z - z0) / (z1 - z0) * 1.3);
      let c = lerp3(N, F, t);
      let k = 1 + (fbm(X * 0.35, Z * 0.35, 3) - 0.5) * 0.35 + (fbm(X * 4, Z * 4, 4) - 0.5) * 0.22 * o.grassDetail + (hash(Math.floor(X * 24), Math.floor(Z * 10)) - 0.5) * 0.25 * o.grassDetail;
      if (stripes) k += (Math.floor(Z / stripes) & 1) * 0.08;
      if (D) { const d = fbm(X * 0.5, Z * 0.5, 8); if (d > 0.62) c = lerp3(c, D, Math.min(1, (d - 0.62) * 5)); }
      if (hash(Math.floor(X * 9), Math.floor(Z * 9), 6) < 0.012 * o.grassDetail) k += 0.35;
      return scale(c, k);
    };
  };
  M.dirt = (col) => { const P = C(col); return (X, Y, Z) => { let k = 1 + (fbm(X * 3, Z * 3, 6) - 0.5) * 0.3; const hx = Math.floor(X * 6), hz = Math.floor(Z * 6); if (hash(hx, hz, 2) < 0.18) { const dx = X * 6 - hx - 0.5, dz = Z * 6 - hz - 0.5; if (dx * dx + dz * dz < 0.12) k += dz < 0 ? 0.25 : -0.1; } return scale(P, k); }; };
  M.pebbles = (col) => { const P = C(col); return (X, Y, Z) => { const hx = Math.floor(X * 5), hz = Math.floor(Z * 5); const dx = X * 5 - hx - 0.5, dz = Z * 5 - hz - 0.5, r = 0.15 + hash(hx, hz) * 0.25; let k = 0.85 + (fbm(X, Z, 3) - 0.5) * 0.2; if (dx * dx + dz * dz < r * r) k = 0.9 + hash(hx, hz, 4) * 0.5 + (dz < 0 ? 0.15 : -0.1); return scale(P, k); }; };
  // Aigua: onades horitzontals i reflexos que s'esvaeixen lluny
  M.water = (near, far, moonX) => {
    const N = C(near), F = C(far);
    return (X, Y, Z, axis, x, y) => {
      const t = Math.min(1, Z / 120);
      let c = lerp3(N, F, t), k = 1 + (fbm(X * 0.5, Z * 2.2, 2) - 0.5) * 0.35;
      const wave = Math.sin(Z * 5 + fbm(X * 0.8, Z * 0.8, 3) * 6);
      if (wave > 0.92) k += 0.4 * (1 - t);
      if (Math.abs(x - moonX) < 3 + (y - 96) * 0.2 && wave > 0.5) k += 0.8;
      return scale(c, k);
    };
  };
  return M;
}

/* ---------- Els quatre estils ---------- */
const base = {
  blockH: 1, blockW: 1, mortar: 0.035, irregular: 0.2, jointK: 1, blockVar: 0.16, grain: 0.14, grainF: 3, fine: 0.08, bevel: 0.05, bevelK: 0.12,
  cracks: 0.08, moss: 0, damp: 0, grout: 0.03, tileVar: 0.14, marble: false, plankVar: 0.14, grainWood: 3, grassDetail: 1,
  light: { amb: [0.5, 0.48, 0.52], ambOut: [0.95, 0.95, 1.0], lights: 1.5, bands: 6, ao: 0.78, fog: [20, 16, 28], fogZ: [10, 30], fogAmt: 0.45, camK: 0.42, camZ: 11, camCol: [1, 0.9, 0.78], vignette: 0.18 },
};
export const ESTILS = [
  { id: "A", nom: "Pedra i torxes", desc: "Blocs de pedra grans i regulars, fusta amb veta, llum càlida de torxes en bandes tramades.",
    ...base, light: { ...base.light, amb: [0.42, 0.36, 0.36], lights: 1.9, bands: 6, fog: [26, 14, 10], camCol: [1, 0.82, 0.6] } },
  { id: "B", nom: "Lluna i molsa", desc: "Pedra irregular amb molsa, humitat i esquerdes; marbre a terra; llum blava de lluna i contrast alt.",
    ...base, blockH: 0.8, blockW: 0.7, irregular: 0.8, blockVar: 0.24, cracks: 0.22, moss: 1, damp: 1, marble: true, tileVar: 0.2,
    light: { ...base.light, amb: [0.36, 0.44, 0.66], ambOut: [0.78, 0.86, 1.08], lights: 1.8, bands: 5, ao: 0.7, fog: [10, 16, 34], fogAmt: 0.6, camCol: [0.7, 0.8, 1.0], camK: 0.38, vignette: 0.25 } },
  { id: "C", nom: "Aquarel·la", desc: "Textures suaus amb taques de pinzell, juntes discretes i llum difusa sense bandes, colors més vius.",
    ...base, mortar: 0.022, jointK: 1.25, blockVar: 0.1, grain: 0.22, grainF: 1.3, fine: 0.03, bevelK: 0.06, cracks: 0.03, grout: 0.018, tileVar: 0.1, plankVar: 0.1, grassDetail: 0.6,
    paint: true, light: { ...base.light, amb: [0.62, 0.6, 0.62], lights: 1.0, bands: 0, ao: 0.84, fogAmt: 0.3, camK: 0.4, vignette: 0.1 } },
  { id: "D", nom: "Retro 32 colors", desc: "Com els jocs de 1990: textures marcades, bisells forts i paleta de 32 colors amb tramat.",
    ...base, blockVar: 0.22, fine: 0.14, bevel: 0.07, bevelK: 0.2, grout: 0.04, tileVar: 0.18, plankVar: 0.2,
    palette: "endesga32", dither: 6, light: { ...base.light, amb: [0.56, 0.54, 0.58], lights: 1.4, bands: 4, ao: 0.72, vignette: 0 } },
];
export const themeOf = (estil) => ({ ...estil, ...materials(estil) });

/* ---------- Il·luminar ---------- */
// c.gb: posició del món de cada píxel (la deixen les superfícies texturades). Els detalls dibuixats a sobre
// (quadres, flames...) fan servir la de la superfície de sota. ref: el fons, per als objectes retallats.
export function finish(c, cam, estil, { outdoor = false, lights = c.lights ?? [], ref = null } = {}) {
  const L = estil.light, W = c.w, H = c.h, d = c.data;
  // posició de cada píxel: la pròpia o, si no en té, la del fons de sota
  let gb = c.gb ?? ref?.gb, ax = c.ax ?? ref?.ax;
  if (c.gb && ref?.gb) { gb = new Float32Array(c.gb); ax = new Uint8Array(c.ax); for (let i = 0; i < W * H; i++) if (Number.isNaN(gb[i * 3])) { gb[i * 3] = ref.gb[i * 3]; gb[i * 3 + 1] = ref.gb[i * 3 + 1]; gb[i * 3 + 2] = ref.gb[i * 3 + 2]; ax[i] = ref.ax[i]; } }
  const amb = outdoor ? L.ambOut : L.amb;
  const pal = estil.palette ? PALETTES.find((p) => p.id === estil.palette).colors.map((h) => C(h)) : null;
  const src = new Uint8ClampedArray(d);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, o = i * 4;
    if (!src[o + 3]) continue;
    let r = src[o], g = src[o + 1], b = src[o + 2];
    const X = gb && !c.emissive ? gb[i * 3] : NaN;
    if (!Number.isNaN(X)) {
      const Y = gb[i * 3 + 1], Z = gb[i * 3 + 2];
      let lr = amb[0], lg = amb[1], lb = amb[2];
      if (!outdoor) { const k = L.camK / (1 + (Z / L.camZ) ** 2 * 2); lr += L.camCol[0] * k; lg += L.camCol[1] * k; lb += L.camCol[2] * k; }
      for (const li of lights) {
        const dx = X - li.X, dy = Y - li.Y, dz = Z - li.Z, q = (dx * dx + dy * dy + dz * dz) / (li.r * li.r);
        const k = (li.k * L.lights) / (1 + q * 2.2) * (q < 6 ? 1 : 0);
        lr += li.col[0] * k; lg += li.col[1] * k; lb += li.col[2] * k;
      }
      // racons i vores: si un veí és d'una altra superfície o és més a prop, aquest píxel queda a l'ombra
      if (ax && L.ao < 1) {
        let occ = 0;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
          const xx = x + ox, yy = y + oy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = yy * W + xx, zj = gb[j * 3 + 2];
          if (Number.isNaN(zj)) continue;
          if (ax[j] !== ax[i] || zj < Z * 0.93) occ++;
        }
        const k = 1 - (1 - L.ao) * Math.min(1, occ / 3);
        lr *= k; lg *= k; lb *= k;
      }
      // compressió suau dels llums forts (que no es cremi la paret del costat de la torxa)
      const tm = (v) => (v < 0.9 ? v : 0.9 + (v - 0.9) * 0.35);
      lr = tm(lr); lg = tm(lg); lb = tm(lb);
      if (L.bands) {
        const t = bayer(x, y) - 0.5;
        lr = Math.round(lr * L.bands + t) / L.bands; lg = Math.round(lg * L.bands + t) / L.bands; lb = Math.round(lb * L.bands + t) / L.bands;
      }
      r *= lr; g *= lg; b *= lb;
      // boira de profunditat
      const f = Math.max(0, Math.min(1, (Z - L.fogZ[0]) / (L.fogZ[1] - L.fogZ[0]))) * L.fogAmt * (outdoor ? 0.5 : 1);
      if (f > 0) { r += (L.fog[0] - r) * f; g += (L.fog[1] - g) * f; b += (L.fog[2] - b) * f; }
    }
    if (L.vignette) { const vx = (x / W - 0.5) * 2, vy = (y / H - 0.5) * 2, k = 1 - L.vignette * Math.max(0, vx * vx * 0.7 + vy * vy * 0.5 - 0.25); r *= k; g *= k; b *= k; }
    if (estil.paint) {
      const n = (fbm(x / 7, y / 4, 31) - 0.5) * 0.14 + 1, m = (r + g + b) / 3;
      r = (m + (r - m) * 1.18) * n; g = (m + (g - m) * 1.18) * n; b = (m + (b - m) * 1.18) * n;
    }
    if (pal) {
      const t = (bayer(x, y) - 0.5) * (estil.dither ?? 20);
      r += t; g += t; b += t;
      let best = pal[0], bd = 1e9;
      for (const p of pal) { const dd = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (dd < bd) { bd = dd; best = p; } }
      [r, g, b] = best;
    }
    d[o] = Math.max(0, Math.min(255, r)); d[o + 1] = Math.max(0, Math.min(255, g)); d[o + 2] = Math.max(0, Math.min(255, b));
  }
}

// Dibuixa un escenari amb un estil: activa les textures, l'il·lumina i il·lumina també els objectes retallats
// fx(sc): efectes animats (fx.mjs), dibuixats amb el mateix estil i il·luminats com la resta; en tornen la llista a sc.fx
export function render(fn, estil, { outdoor = false, fx = null } = {}) {
  const th = { ...themeOf(estil), fx: !!fx };
  setTheme(th); CUTS.length = 0;
  let sc;
  try { sc = fn(); sc.fx = fx ? fx(sc) : []; } finally { setTheme(null); }
  const cuts = CUTS.splice(0);
  finish(sc.bg, sc.cam, estil, { outdoor });
  for (const o of cuts) for (const c of o.full) if (c) finish(c, sc.cam, estil, { outdoor, lights: [...(sc.bg.lights ?? []), ...(c.lights ?? [])], ref: sc.bg });
  return sc;
}
export const OUTDOOR = new Set(["astronomia", "jardins", "hivernacle", "quidditch", "bosc", "llac"]);
