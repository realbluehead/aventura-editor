// Una càmera en perspectiva per dibuixar els decorats en 3D (pixel art pla) i que els personatges hi encaixin.
// Coordenades del món en metres: X cap a la dreta, Y cap amunt (0 = terra), Z cap al fons. La càmera és a
// (0, E, 0) i mira cap a +Z; l'horitzó és a la y «vy» de la pantalla i el punt de fuga a (vx, vy).
// Un objecte d'alçada h a la profunditat Z fa f·h/Z píxels; un punt del terra a la y de pantalla sy és a
// Z = f·E/(sy − vy). Per això l'alçada del protagonista és lineal en y, igual que la interpolació del joc.
const K = await import(new URL("../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
export const { Canvas, mix, rng, rgba } = K;

export const HARRY = 1.55;

// Estil de textures actiu (textura.mjs el posa mentre es dibuixa un escenari; null = colors plans)
let THEME = null;
export const setTheme = (t) => { THEME = t; };
export const theme = () => THEME;
// Llums de l'escenari (torxes, foc, finestres): textura.mjs les fa servir per il·luminar
export const addLight = (c, X, Y, Z, col, r, k = 1, info = {}) => { (c.lights ??= []).push({ X, Y, Z, col, r, k, ...info }); };
// Punts de llum petits (finestres llunyanes) que poden fer pampallugues
export const addTwinkle = (c, x, y, w, h, col) => { (c.twinkles ??= []).push({ x, y, w, h, col }); };   // alçada del fotograma del protagonista, en metres (la figura en fa ~1,45)

export class Cam {
  constructor({ vx = 160, vy = 60, f = 260, E = 3.4 } = {}) { Object.assign(this, { vx, vy, f, E }); }
  p(X, Y, Z) { return [this.vx + (this.f * X) / Z, this.vy + (this.f * (this.E - Y)) / Z]; }
  z(sy) { return (this.f * this.E) / (sy - this.vy); }               // profunditat del terra a la y de pantalla
  X(sx, sy) { return ((sx - this.vx) * this.z(sy)) / this.f; }       // X del terra sota un punt de pantalla
  y(Z) { return this.vy + (this.f * this.E) / Z; }                    // y de pantalla del terra a la profunditat Z
  s(Z) { return this.f / Z; }                                         // píxels per metre a la profunditat Z
  h(sy, m = HARRY) { return Math.round((m * (sy - this.vy)) / this.E); }
  // actorHeight per a una zona caminable que va de yTop a yBot
  actor(yTop, yBot) { return { near: this.h(yBot), far: this.h(yTop) }; }
}

/* ---------- Polígons amb retall ---------- */

// Omple un polígon de pantalla (retallat al llenç, perquè els punts poden quedar molt lluny)
export function fill(c, pts, col) {
  if (pts.length < 3) return;
  const ys = pts.map((p) => p[1]);
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(c.h - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y + 0.5) !== (yj > y + 0.5)) xs.push(xi + ((y + 0.5 - yi) * (xj - xi)) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.round(xs[k])), b = Math.min(c.w, Math.round(xs[k + 1]));
      if (typeof col === "function") { for (let x = a; x < b; x++) { const v = col(x, y); if (v) c.px(x, y, v); } }
      else for (let x = a; x < b; x++) c.px(x, y, col);
    }
  }
}

// Retalla un polígon 3D pel pla Z = zn (el que queda darrere de la càmera no es pot projectar)
function clipNear(pts, zn = 0.4) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ain = a[2] >= zn, bin = b[2] >= zn;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (zn - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, zn]);
    }
  }
  return out;
}

export function quad(c, cam, pts, col) {
  const cl = clipNear(pts);
  if (cl.length < 3) return;
  const scr = cl.map(([X, Y, Z]) => cam.p(X, Y, Z));
  if (!THEME) return fill(c, scr, typeof col === "function" ? "#ff00ff" : col);
  // Normal del pla (mètode de Newell) i eix dominant: x = paret lateral, y = terra/sostre, z = paret del fons
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
  const axis = ax >= ay && ax >= az ? 1 : ay >= az ? 2 : 3;
  const mat = typeof col === "function" ? col : THEME.auto(col, axis);
  const [px, py, pz] = pts[0], { vx, vy, f, E } = cam, W = c.w;
  c.gb ??= new Float32Array(c.w * c.h * 3).fill(NaN);
  c.ax ??= new Uint8Array(c.w * c.h);
  const num = nx * px + ny * (py - E) + nz * pz;
  fill(c, scr, (x, y) => {
    const dx = (x + 0.5 - vx) / f, dy = -(y + 0.5 - vy) / f, den = nx * dx + ny * dy + nz;
    let X, Y, Z;
    if (Math.abs(den) < 1e-9) { X = px; Y = py; Z = pz; } else { const t = num / den; X = t * dx; Y = E + t * dy; Z = t; }
    const i = y * W + x;
    c.gb[i * 3] = X; c.gb[i * 3 + 1] = Y; c.gb[i * 3 + 2] = Z; c.ax[i] = axis;
    return mat(X, Y, Z, axis, x, y);
  });
}
export function seg(c, cam, a, b, col) { const [p, q] = [cam.p(...a), cam.p(...b)]; c.line(Math.round(p[0]), Math.round(p[1]), Math.round(q[0]), Math.round(q[1]), col); }

// Plans habituals
export const floorQ = (c, cam, x0, x1, z0, z1, col, y = 0) => quad(c, cam, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], col);
export const backQ = (c, cam, x0, x1, y0, y1, z, col) => quad(c, cam, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], col);
export const sideQ = (c, cam, x, z0, z1, y0, y1, col) => quad(c, cam, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], col);

// Una capsa: es dibuixen les cares que veu la càmera. cols: { front, top, side, bottom }
export function box(c, cam, x0, x1, y0, y1, z0, z1, cols) {
  const side = cols.side ?? mix(cols.front, "#000", 0.25), top = cols.top ?? mix(cols.front, "#fff", 0.15);
  if (x0 > 0) sideQ(c, cam, x0, z0, z1, y0, y1, side);
  if (x1 < 0) sideQ(c, cam, x1, z0, z1, y0, y1, side);
  if (y1 < cam.E) floorQ(c, cam, x0, x1, z0, z1, top, y1);
  if (y0 > cam.E) floorQ(c, cam, x0, x1, z0, z1, cols.bottom ?? side, y0);
  backQ(c, cam, x0, x1, y0, y1, z0, cols.front);
}

// Terra enrajolat (escaquer) o amb taulons. Les rajoles llunyanes s'enfosqueixen una mica (boira).
export function tiles(c, cam, x0, x1, z0, z1, size, a, b, { fog = null, fogAmt = 0.4, zFog = 20 } = {}) {
  if (THEME) return floorQ(c, cam, x0, x1, z0, z1, THEME.tiles(a, b, size, x0, z0));
  for (let z = z0; z < z1; z += size) for (let x = x0; x < x1; x += size) {
    const k = (Math.round((x - x0) / size) + Math.round((z - z0) / size)) % 2;
    let col = k ? a : b;
    if (fog) col = mix(col, fog, Math.min(1, (z / zFog) * fogAmt));
    floorQ(c, cam, x, Math.min(x + size, x1), z, Math.min(z + size, z1), col);
  }
}
export function planks(c, cam, x0, x1, z0, z1, w, col, line) {
  if (THEME) return floorQ(c, cam, x0, x1, z0, z1, THEME.planks(col, line, w, x0));
  floorQ(c, cam, x0, x1, z0, z1, col);
  for (let x = x0; x <= x1 + 1e-6; x += w) seg(c, cam, [x, 0, z0], [x, 0, z1], line);
  const r = rng(Math.round(x0 * 7 + z1));
  for (let x = x0; x < x1; x += w) for (let z = z0 + r() * 2; z < z1; z += 1.5 + r() * 2.5) seg(c, cam, [x, 0, z], [x + w, 0, z], line);
}

// Una paret del fons amb pedres. Dibuixa el pla i les juntes en files.
export function stoneBack(c, cam, x0, x1, y0, y1, z, col, joint, { h = 0.45, w = 0.9, seed = 3 } = {}) {
  if (THEME) return backQ(c, cam, x0, x1, y0, y1, z, THEME.stone(col, joint, { h, w }));
  backQ(c, cam, x0, x1, y0, y1, z, col);
  const r = rng(seed);
  for (let y = y0, row = 0; y < y1; y += h, row++) {
    seg(c, cam, [x0, y, z], [x1, y, z], joint);
    for (let x = x0 + (row % 2) * w / 2; x < x1; x += w) seg(c, cam, [x, y, z], [x, Math.min(y + h, y1), z], joint);
    // algunes pedres més clares o més fosques
    for (let x = x0 + (row % 2) * w / 2; x < x1 - w; x += w) if (r() < 0.25) backQ(c, cam, x + 0.05, x + w - 0.05, y + 0.04, Math.min(y + h, y1) - 0.04, z, mix(col, r() < 0.5 ? "#000" : "#fff", 0.08));
  }
}
export function stoneSide(c, cam, x, z0, z1, y0, y1, col, joint, { h = 0.45, w = 0.9 } = {}) {
  if (THEME) return sideQ(c, cam, x, z0, z1, y0, y1, THEME.stone(col, joint, { h, w }));
  sideQ(c, cam, x, z0, z1, y0, y1, col);
  for (let y = y0, row = 0; y < y1; y += h, row++) {
    seg(c, cam, [x, y, z0], [x, y, z1], joint);
    for (let z = z0 + (row % 2) * w / 2; z < z1; z += w) seg(c, cam, [x, y, z], [x, Math.min(y + h, y1), z], joint);
  }
}

/* ---------- Peces que es repeteixen ---------- */

// Una torxa a la paret (de fons, a z), amb halo de llum
export function torch(c, cam, X, Y, Z) {
  const [x, y] = cam.p(X, Y, Z), s = cam.s(Z);
  addLight(c, X, Y + 0.2, Z - 0.3, [1.0, 0.62, 0.3], 4.2, 1.2, { kind: "torch", fx: x, fy: y - s * 0.12, rx: Math.max(1, s * 0.09), ry: Math.max(2, s * 0.18), sx: x, sy: y - s * 0.3, sr: s * 1.3 });
  for (let r = Math.round(s * 1.2); r > 0; r -= Math.max(1, Math.round(s * 0.3))) c.circle(x, y - s * 0.3, r, [255, 190, 90, THEME ? 7 : 18]);
  c.rect(x - s * 0.04, y, Math.max(1, s * 0.08), s * 0.35, "#4a3020");
  c.ellipse(x, y - s * 0.12, Math.max(1, s * 0.09), Math.max(2, s * 0.18), "#ff8a1f");
  c.ellipse(x, y - s * 0.08, Math.max(1, s * 0.05), Math.max(1, s * 0.1), "#ffe27a");
}
// Una espelma que sura (Gran Saló)
export function candle(c, cam, X, Y, Z) {
  const [x, y] = cam.p(X, Y, Z), s = cam.s(Z);
  addLight(c, X, Y, Z, [1.0, 0.75, 0.45], 1.6, 0.35, { kind: "candle", fx: x, fy: y - 1, sx: x, sy: y - 1, sr: Math.max(3, s * 0.35) });
  (c.candles ??= []).push({ X, Y, Z });
  if (THEME?.fx) return;   // les espelmes que suren les dibuixa fx.mjs, animades
  c.rect(x, y, Math.max(1, s * 0.05), Math.max(2, s * 0.22), "#f4ecd0");
  c.px(x, y - 1, "#ffd23f");
  c.circle(x, y - 1, Math.max(1, s * 0.08), [255, 210, 120, 40]);
}
// Finestra gòtica al pla del fons (z): arc apuntat amb vidres i un tros de cel nocturn
export function gothicWindow(c, cam, X0, X1, Y0, Y1, Z, { glass = "#2a3a6a", frame = "#3a3340", moon = false } = {}) {
  addLight(c, (X0 + X1) / 2, (Y0 + Y1) / 2, Z - 0.6, [0.45, 0.6, 1.0], 2.6 + (X1 - X0), moon ? 0.7 : 0.5);
  const [a, b] = [cam.p(X0, Y0, Z), cam.p(X1, Y1, Z)];
  const x0 = a[0], x1 = b[0], yb = a[1], yt = b[1], w = x1 - x0, arcH = w * 0.6;
  const outline = [[x0 - 2, yb + 1], [x0 - 2, yt + arcH], [(x0 + x1) / 2, yt - 2], [x1 + 2, yt + arcH], [x1 + 2, yb + 1]];
  fill(c, outline, frame);
  const pts = [[x0, yb], [x0, yt + arcH], [(x0 + x1) / 2, yt], [x1, yt + arcH], [x1, yb]];
  fill(c, pts, glass);
  for (let k = 0; k < 18; k++) { const r = rng(Math.round(x0 * 13 + k)); c.px(x0 + r() * w, yt + arcH + r() * (yb - yt - arcH), "#dfe6ff"); }
  if (moon) c.circle(x0 + w * 0.65, yt + arcH * 1.3, Math.max(2, w * 0.15), "#f2efd2");
  c.line(Math.round((x0 + x1) / 2), Math.round(yt), Math.round((x0 + x1) / 2), Math.round(yb), frame);
  for (let y = yt + arcH; y < yb; y += Math.max(4, w * 0.5)) c.line(Math.round(x0), Math.round(y), Math.round(x1), Math.round(y), frame);
}
// Finestra en una paret lateral (pla X), entre z0 i z1
export function sideWindow(c, cam, X, z0, z1, y0, y1, { glass = "#2a3a6a", frame = "#3a3340" } = {}) {
  addLight(c, X + (X < 0 ? 0.6 : -0.6), (y0 + y1) / 2, (z0 + z1) / 2, [0.45, 0.6, 1.0], 2.4, 0.5);
  const zm = (z0 + z1) / 2;
  sideQ(c, cam, X, z0 - 0.08, z1 + 0.08, y0 - 0.08, y1, frame);
  quad(c, cam, [[X, y0, z0], [X, y0, z1], [X, y1, z1], [X, y1 + 0.5, zm], [X, y1, z0]], frame);
  quad(c, cam, [[X, y0, z0], [X, y0, z1], [X, y1, z1], [X, y1 + 0.45, zm], [X, y1, z0]], glass);
  seg(c, cam, [X, y0, zm], [X, y1 + 0.45, zm], frame);
  seg(c, cam, [X, (y0 + y1) / 2, z0], [X, (y0 + y1) / 2, z1], frame);
}
// Una porta al pla del fons
export function door(c, cam, X0, X1, Y1, Z, { wood = "#6b4423", frame = "#3a2a1a", arch = true, open = false } = {}) {
  backQ(c, cam, X0 - 0.12, X1 + 0.12, 0, Y1 + 0.12, Z, frame);
  if (arch) { const [l, r] = [cam.p(X0 - 0.12, Y1, Z), cam.p(X1 + 0.12, Y1, Z)]; c.ellipse((l[0] + r[0]) / 2, l[1], (r[0] - l[0]) / 2, Math.max(2, (r[0] - l[0]) / 3), frame); }
  backQ(c, cam, X0, X1, 0, Y1, Z, open ? "#120d10" : wood);
  if (arch) { const [l, r] = [cam.p(X0, Y1, Z), cam.p(X1, Y1, Z)]; c.ellipse((l[0] + r[0]) / 2, l[1], (r[0] - l[0]) / 2, Math.max(2, (r[0] - l[0]) / 3 - 1), open ? "#120d10" : wood); }
  if (!open) {
    for (let x = X0 + 0.25; x < X1; x += 0.25) seg(c, cam, [x, 0, Z], [x, Y1, Z], mix(wood, "#000", 0.3));
    const [hx, hy] = cam.p(X1 - 0.18, 1.0, Z); c.rect(hx, hy, 2, 2, "#d8b24a");
  }
}
// Una porta en una paret lateral
export function sideDoor(c, cam, X, z0, z1, Y1, { wood = "#6b4423", frame = "#3a2a1a", open = false } = {}) {
  sideQ(c, cam, X, z0 - 0.12, z1 + 0.12, 0, Y1 + 0.12, frame);
  sideQ(c, cam, X, z0, z1, 0, Y1, open ? "#120d10" : wood);
  if (!open) for (let z = z0 + 0.3; z < z1; z += 0.3) seg(c, cam, [X, 0, z], [X, Y1, z], mix(wood, "#000", 0.3));
}
// Un estendard penjat (de fons)
export function banner(c, cam, X0, X1, Y0, Y1, Z, col, emblem) {
  const [a, b] = [cam.p(X0, Y1, Z), cam.p(X1, Y0, Z)];
  const w = b[0] - a[0], h = b[1] - a[1];
  c.rect(a[0] - 1, a[1] - 1, w + 2, 2, "#5a4020");
  fill(c, [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [(a[0] + b[0]) / 2, b[1] - h * 0.12], [a[0], b[1]]], col);
  c.rect(a[0] + 1, a[1] + 1, Math.max(1, w * 0.1), h * 0.8, mix(col, "#000", 0.2));
  if (emblem) c.circle((a[0] + b[0]) / 2, a[1] + h * 0.4, Math.max(2, w * 0.25), emblem);
}
// Prestatgeria de llibres al pla del fons
export function shelfBack(c, cam, X0, X1, Y1, Z, seed = 1, depth = 0.4) {
  box(c, cam, X0, X1, 0, Y1, Z - depth, Z, { front: "#4a2e18", top: "#5a3a20" });
  const r = rng(seed), cols = ["#8b2a2a", "#2a4a8b", "#2a6b3a", "#8b6a2a", "#5a2a6b", "#a0522d", "#3a3a3a", "#6b6b2a"];
  for (let y = 0.15; y < Y1 - 0.3; y += 0.55) {
    backQ(c, cam, X0 + 0.06, X1 - 0.06, y, y + 0.48, Z - depth + 0.02, "#22140a");
    for (let x = X0 + 0.08; x < X1 - 0.12;) {
      const w = 0.06 + r() * 0.08, h = 0.3 + r() * 0.15;
      backQ(c, cam, x, Math.min(x + w, X1 - 0.08), y, y + h, Z - depth + 0.03, cols[Math.floor(r() * cols.length)]);
      x += w + (r() < 0.1 ? 0.1 : 0.01);
    }
  }
}
// Prestatgeria en una paret lateral (pla X): els llibres es veuen de cantell
export function shelfSide(c, cam, X, z0, z1, Y1, seed = 1, depth = 0.45) {
  const inner = X < 0 ? X + depth : X - depth;
  if (X < 0) box(c, cam, X, inner, 0, Y1, z0, z1, { front: "#3a2412", side: "#4a2e18", top: "#5a3a20" });
  else box(c, cam, inner, X, 0, Y1, z0, z1, { front: "#3a2412", side: "#4a2e18", top: "#5a3a20" });
  const r = rng(seed), cols = ["#8b2a2a", "#2a4a8b", "#2a6b3a", "#8b6a2a", "#5a2a6b", "#a0522d", "#6b6b2a"];
  for (let y = 0.15; y < Y1 - 0.3; y += 0.55) {
    sideQ(c, cam, inner, z0 + 0.05, z1 - 0.05, y, y + 0.48, "#1a0f08");
    for (let z = z0 + 0.06; z < z1 - 0.08;) {
      const w = 0.05 + r() * 0.07, h = 0.3 + r() * 0.15;
      sideQ(c, cam, inner, z, Math.min(z + w, z1 - 0.06), y, y + h, cols[Math.floor(r() * cols.length)]);
      z += w + 0.012;
    }
  }
}
// Una cosa plana dreta (arbre, estàtua, figura llunyana) dibuixada a escala: fn(c, x, yBase, pxPerMetre)
export function standee(c, cam, X, Z, fn) { const [x, y] = cam.p(X, 0, Z); fn(c, x, y, cam.s(Z)); }

// Arbre (avet) a escala: alçada en metres
export function pine(c, x, y, s, hm, col = "#1f3b2c", seed = 1) {
  const h = hm * s, w = h * 0.42, r = rng(seed);
  c.rect(x - s * 0.15, y - h * 0.2, Math.max(1, s * 0.3), h * 0.2, "#3a2a1a");
  for (let k = 0; k < 4; k++) {
    const yb = y - h * 0.15 - k * h * 0.2, ww = w * (1 - k * 0.22);
    fill(c, [[x - ww / 2, yb], [x + ww / 2, yb], [x, yb - h * 0.38]], mix(col, k % 2 ? "#000" : "#2a5a3a", 0.15 + r() * 0.1));
  }
}
// Arbre de capçada rodona
export function oak(c, x, y, s, hm, col = "#2a4a2a", seed = 2) {
  const h = hm * s, r = rng(seed);
  c.rect(x - s * 0.18, y - h * 0.45, Math.max(1, s * 0.36), h * 0.45, "#3a2a1a");
  for (let k = 0; k < 7; k++) c.circle(x + (r() - 0.5) * h * 0.5, y - h * 0.62 + (r() - 0.5) * h * 0.35, Math.max(2, h * (0.18 + r() * 0.1)), mix(col, r() < 0.5 ? "#000" : "#6a8a4a", r() * 0.25));
}

// Cel nocturn amb estrelles i lluna
export function nightSky(c, h, { top = "#0b1030", bottom = "#2a2f5a", seed = 9, moon = [250, 30, 10] } = {}) {
  c.gradient(0, 0, c.w, h, top, bottom, 8);
  const r = rng(seed);
  for (let k = 0; k < 90; k++) c.px(r() * c.w, r() * h * 0.9, r() < 0.2 ? "#ffffff" : "#9aa4d0");
  if (moon) { const [mx, my, mr] = moon; c.circle(mx, my, mr + 3, [240, 240, 210, 30]); c.circle(mx, my, mr, "#f2efd2"); c.circle(mx + 3, my - 2, mr * 0.3, "#dcd8b8"); }
}

// Silueta del castell de Hogwarts a l'horitzó (en píxels de pantalla), amb finestres enceses
export function castle(c, x0, yb, scale = 1, col = "#272640", lit = "#ffcf6a", seed = 5) {
  const r = rng(seed), S = (v) => v * scale;
  const towers = [[0, 40, 10], [14, 62, 12], [30, 48, 16], [50, 80, 10], [64, 54, 20], [88, 70, 12], [104, 44, 14], [122, 58, 9]];
  c.rect(x0, yb - S(30), S(132), S(30), col);
  for (const [tx, th, tw] of towers) {
    c.rect(x0 + S(tx), yb - S(th), S(tw), S(th), col);
    fill(c, [[x0 + S(tx) - S(2), yb - S(th)], [x0 + S(tx + tw) + S(2), yb - S(th)], [x0 + S(tx + tw / 2), yb - S(th + tw * 1.3)]], col);
    c.rect(x0 + S(tx) , yb - S(th), Math.max(1, S(1.2)), S(th), "#3e3c5c");   // vora il·luminada per la lluna
    for (let k = 0; k < 3; k++) if (r() < 0.8) { const wx = x0 + S(tx + 2 + r() * (tw - 4)), wy = yb - S(th * (0.2 + r() * 0.7)), ww = Math.max(1, S(1.5)), wh = Math.max(1, S(2.5)); c.rect(wx, wy, ww, wh, lit); addTwinkle(c, wx, wy, ww, wh, lit); }
  }
  for (let k = 0; k < 14; k++) c.rect(x0 + S(r() * 130), yb - S(5 + r() * 22), Math.max(1, S(1.5)), Math.max(1, S(2)), lit);
}

// Polígon caminable d'un terra entre X = xl i X = xr (metres), de la y de pantalla yt a yb, retallat a la pantalla
export function floorPoly(cam, xl, xr, yt, yb = 197, W = 320) {
  const L = [], R = [];
  const steps = 8;
  for (let k = 0; k <= steps; k++) {
    const y = yt + ((yb - yt) * k) / steps, Z = cam.z(y);
    L.push([Math.max(2, Math.round(cam.p(xl, 0, Z)[0])), Math.round(y)]);
    R.push([Math.min(W - 2, Math.round(cam.p(xr, 0, Z)[0])), Math.round(y)]);
  }
  const pts = [...L, ...R.reverse()];
  // treu punts repetits seguits (quan el retall fa columnes rectes)
  return pts.filter((p, i) => { const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length]; return !(a[0] === p[0] && b[0] === p[0]); });
}
