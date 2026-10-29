// Peces dels decorats de «Dràcula» (a sobre del motor en perspectiva de comu.mjs / persp.mjs, el del Barret
// Desaparegut): cel de nit, muntanyes, el castell, cases, làpides, vaixells, mobles de la casa victoriana...
// Tot es dibuixa en un llenç de 320×240 (el fons de 640×480 amb píxels de 2×2).
import { Canvas, mix, rng, rgba, Cam, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide, floorPoly, addLight, addTwinkle, theme, planks, tiles } from "./persp.mjs";
import { hb, hbBox, hbBack, hbSide, at } from "./comu.mjs";
import { sideDoor } from "./persp.mjs";
export * from "./comu.mjs";

export const W = 320, H = 240;
// Càmera estàndard: horitzó a y = 104; un adult fa ~68 px a primer terme i ~40 px a la paret del fons (z = 14)
export const STD = { vx: 160, vy: 104, f: 300, E: 3.6 };
export const newScene = (cam = STD) => ({ cam: cam instanceof Cam ? cam : new Cam(cam), c: new Canvas(W, H) });
// El que torna cada escenari: zona caminable, alçada dels actors i, amb spots/pts/objs, on és cada cosa
export const scene = (cam, c, walk, yt, extra = {}) => ({ cam, bg: c, walk, ah: cam.actor(yt, 237), spots: {}, pts: {}, ...extra });
export const floorW = (cam, xl, xr, yt) => [floorPoly(cam, xl, xr, yt)];
// Un rectangle de pantalla
export const R = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// Sortides per les vores, a l'alçada del terra
export const edgeL = (yt) => R(0, yt, 16, 239 - yt);
export const edgeR = (yt) => R(304, yt, 16, 239 - yt);

/* ---------- Cel i paisatge (2D, darrere de tot) ---------- */

// Cel de nit: degradat, estrelles, lluna amb halo i núvols esfilagarsats que la tapen una mica
export function sky(c, h, { top = "#0e0c16", bottom = "#3b3a5c", moon = [250, 40, 13], stars = 70, clouds = 5, seed = 7, red = false } = {}) {
  c.gradient(0, 0, W, h, top, bottom, 10);
  const r = rng(seed);
  for (let k = 0; k < stars; k++) c.px(r() * W, r() * h * 0.8, r() < 0.25 ? "#dcdbe0" : "#8f97a8");
  if (moon) {
    const [mx, my, mr] = moon;
    for (let k = 4; k > 0; k--) c.circle(mx, my, mr + k * 4, [220, 220, 235, 10]);
    c.circle(mx, my, mr, red ? "#cc8a7a" : "#e8e6d6");
    c.circle(mx - mr * 0.3, my - mr * 0.25, mr * 0.28, red ? "#b0705e" : "#cfcbbd");
    c.circle(mx + mr * 0.35, my + mr * 0.3, mr * 0.18, red ? "#b0705e" : "#cfcbbd");
  }
  for (let k = 0; k < clouds; k++) {
    const cx = r() * W, cy = h * (0.1 + r() * 0.55), len = 40 + r() * 90;
    for (let j = 0; j < 6; j++) c.ellipse(cx + (j - 3) * len / 7, cy + (r() - 0.5) * 4, len / 5, 2 + r() * 3, mix(bottom, "#07060b", 0.35 + r() * 0.2));
    c.ellipse(cx, cy - 2, len / 2.4, 1.5, mix(bottom, "#b8bccb", 0.25));
  }
}
// Carena de muntanyes: silueta irregular entre y0 (cims) i yb (base); amb neu als cims si snow
export function mountains(c, yb, y0, col, { seed = 3, snow = null, step = 6, rough = 0.5 } = {}) {
  const r = rng(seed), pts = [[0, yb]];
  let y = y0 + (yb - y0) * r();
  for (let x = 0; x <= W + step; x += step) { y += (r() - 0.5) * step * 2.4 * rough + (y0 + (yb - y0) * 0.5 - y) * 0.08; y = Math.max(y0, Math.min(yb - 4, y)); pts.push([x, y]); }
  pts.push([W, yb]);
  fill(c, pts, col);
  if (snow) for (let i = 1; i < pts.length - 2; i++) { const [x, yy] = pts[i]; if (yy < y0 + (yb - y0) * 0.35) c.line(x, yy, pts[i + 1][0], pts[i + 1][1], snow); }
  return pts;
}
// Silueta del castell de Dràcula sobre un penya-segat (en píxels de pantalla): base a (x, yb), escala s
export function castleSil(c, x, yb, s = 1, { col = "#161427", rock = "#0e0c16", lit = "#f0a040", seed = 5 } = {}) {
  const r = rng(seed), S = (v) => v * s;
  // penya-segat
  fill(c, [[x - S(70), yb], [x - S(40), yb - S(40)], [x - S(28), yb - S(52)], [x + S(30), yb - S(56)], [x + S(52), yb - S(36)], [x + S(80), yb]], rock);
  const towers = [[-34, 52, 9], [-22, 78, 11], [-8, 60, 18], [10, 96, 10], [22, 66, 14], [38, 50, 9]];
  c.rect(x - S(36), yb - S(52) - S(26), S(80), S(28), col);
  for (const [tx, th, tw] of towers) {
    const x0 = x + S(tx), y0 = yb - S(50) - S(th);
    c.rect(x0, y0, S(tw), S(th), col);
    fill(c, [[x0 - S(1.5), y0], [x0 + S(tw) + S(1.5), y0], [x0 + S(tw / 2), y0 - S(tw * 1.5)]], col);
    for (let k = 0; k < 2; k++) if (r() < 0.55) { const wx = x0 + S(2 + r() * (tw - 4)), wy = y0 + S(th * (0.15 + r() * 0.5)); c.rect(wx, wy, Math.max(1, S(1.4)), Math.max(1, S(2.4)), lit); addTwinkle(c, wx, wy, Math.max(1, S(1.4)), Math.max(1, S(2.4)), lit); }
  }
  // merlets
  for (let k = -36; k < 44; k += 4) c.rect(x + S(k), yb - S(80), S(2), S(2), col);
}
// Pins en silueta (bosc llunyà): una filera de triangles entre yb i yb - h
export function forestSil(c, yb, h, col, { seed = 4, gap = 7 } = {}) {
  const r = rng(seed);
  c.rect(0, yb - h * 0.25, W, h * 0.25 + 1, col);
  for (let x = -4; x < W + 8; x += gap * (0.6 + r() * 0.8)) { const hh = h * (0.5 + r() * 0.5), w = hh * 0.38; fill(c, [[x - w, yb - h * 0.2], [x + w, yb - h * 0.2], [x, yb - hh]], col); }
}
// Neu que cau (flocs fixos)
export function snowfall(c, n = 120, seed = 9, y1 = H) { const r = rng(seed); for (let k = 0; k < n; k++) c.px(r() * W, r() * y1, r() < 0.5 ? "#dcdbe0" : "#8f97a8"); }

/* ---------- Materials propis ---------- */
const C3 = (h) => rgba(h).slice(0, 3);
const hash = (i, j, k = 0) => { let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const out = (r, g, b) => [Math.max(0, Math.min(255, r)) | 0, Math.max(0, Math.min(255, g)) | 0, Math.max(0, Math.min(255, b)) | 0, 255];
// Neu: blanca blavosa amb ondulacions i petjades
export const snowMat = (col = "#b8bccb") => { const P = C3(col); return (X, Y, Z) => { let k = 1 + Math.sin(X * 1.3 + Math.sin(Z * 0.7) * 2) * 0.05 + (hash(Math.floor(X * 6), Math.floor(Z * 6)) - 0.5) * 0.12; if (hash(Math.floor(X * 2), Math.floor(Z * 2), 3) < 0.04) k -= 0.18; return out(P[0] * k, P[1] * k, P[2] * k); }; };
// Llambordes
export const cobbleMat = (col = "#4c5266") => { const P = C3(col); return (X, Y, Z) => { const row = Math.floor(Z / 0.32), u = X + (row & 1) * 0.17, i = Math.floor(u / 0.34), fu = u - i * 0.34, fv = Z - row * 0.32; if (fu < 0.04 || fv < 0.04) return out(P[0] * 0.55, P[1] * 0.55, P[2] * 0.6); const k = 0.85 + hash(i, row) * 0.35 + (fv > 0.24 ? -0.12 : fv < 0.1 ? 0.1 : 0); return out(P[0] * k, P[1] * k, P[2] * k); }; };
// Maó (parets de Londres)
export const brickMat = (col = "#6b0f1a", joint = "#3e2e22") => { const P = C3(col), J = C3(joint); return (X, Y, Z, axis) => { const u = axis === 1 ? Z : X, v = Y, row = Math.floor(v / 0.16), uu = u + (row & 1) * 0.12, i = Math.floor(uu / 0.24), fu = uu - i * 0.24, fv = v - row * 0.16; if (fu < 0.025 || fv < 0.025) return out(...J); const k = 0.8 + hash(i, row, 4) * 0.4; return out(P[0] * k, P[1] * k * 0.95, P[2] * k); }; };
// Aigua fosca amb reflexos de lluna a la columna moonX
export const waterMat = (near = "#1f1d36", far = "#3b3a5c", moonX = null) => { const N = C3(near), F = C3(far); return (X, Y, Z, axis, x, y) => { const t = Math.min(1, Z / 60); const c = N.map((v, i) => v + (F[i] - v) * t); let k = 1 + Math.sin(Z * 4 + Math.sin(X * 0.9) * 2) * 0.12; if (Math.sin(Z * 9 + X * 0.4) > 0.9) k += 0.35 * (1 - t); if (moonX != null && Math.abs(x - moonX) < 4 + (y - 100) * 0.15 && Math.sin(Z * 6 + X) > 0.3) k += 0.9; return out(c[0] * k, c[1] * k, c[2] * k); }; };
// Paper pintat (cases victorianes): franges verticals amb un motiu
export const wallpaper = (a = "#3f2343", b = "#573056") => { const A = C3(a), B = C3(b); return (X, Y, Z, axis) => { const u = axis === 1 ? Z : X, s = Math.floor(u / 0.18); let c = s & 1 ? A : B; const fu = u - s * 0.18, fv = (Y * 3) % 1; if (Math.abs(fu - 0.09) < 0.03 && Math.abs(fv - 0.5) < 0.12) c = c.map((v) => v * 1.25); return out(...c); }; };
// Aplica un material si hi ha tema (si no, color pla)
export const mat = (m, col) => (theme() ? m : col);

/* ---------- Arquitectura ---------- */

// Columna (capsa prima) amb capitell
export function column(c, cam, X, Z, h, w = 0.5, col = "#6b7287") {
  box(c, cam, X - w / 2, X + w / 2, 0, h, Z - w / 2, Z + w / 2, { front: col });
  box(c, cam, X - w * 0.7, X + w * 0.7, h - 0.25, h, Z - w * 0.7, Z + w * 0.7, { front: mix(col, "#fff", 0.1) });
  box(c, cam, X - w * 0.7, X + w * 0.7, 0, 0.25, Z - w * 0.7, Z + w * 0.7, { front: mix(col, "#000", 0.1) });
}
// Arc apuntat obert en una paret del fons (forat fosc amb vora de pedra)
export function archBack(c, cam, X0, X1, Y1, Z, { frame = "#4c5266", inside = "#07060b" } = {}) {
  const [a, b] = [cam.p(X0, 0, Z), cam.p(X1, Y1, Z)], x0 = a[0], x1 = b[0], yb = a[1], yt = b[1], w = x1 - x0, ah = w * 0.55;
  fill(c, [[x0 - 3, yb], [x0 - 3, yt + ah], [(x0 + x1) / 2, yt - 4], [x1 + 3, yt + ah], [x1 + 3, yb]], frame);
  fill(c, [[x0, yb], [x0, yt + ah], [(x0 + x1) / 2, yt], [x1, yt + ah], [x1, yb]], inside);
}
// Volta de creueria aproximada: arcs del sostre en profunditat
export function vault(c, cam, xl, xr, h, z0, z1, step, col) {
  for (let z = z0; z <= z1; z += step) {
    const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12, X = xl + (xr - xl) * t, Y = h + Math.sin(t * Math.PI) * 1.4; pts.push(cam.p(X, Y, z)); }
    for (let k = 0; k < 12; k++) c.line(Math.round(pts[k][0]), Math.round(pts[k][1]), Math.round(pts[k + 1][0]), Math.round(pts[k + 1][1]), col);
  }
}
// Façana d'una casa al pla z (de X0 a X1, alçada h), amb teulada, finestres (enceses o no) i porta opcional
export function facade(c, cam, X0, X1, h, Z, { wall = "#8f97a8", timber = "#3e2e22", roof = "#3f2343", roofH = 1.6, lit = 0.4, door = null, floors = 2, seed = 1, brick = false, win = 2 } = {}) {
  const r = rng(seed);
  if (brick && theme()) backQ(c, cam, X0, X1, 0, h, Z, brickMat(wall, timber)); else backQ(c, cam, X0, X1, 0, h, Z, wall);
  quad(c, cam, [[X0 - 0.3, h, Z], [X1 + 0.3, h, Z], [(X0 + X1) / 2, h + roofH, Z]], roof);
  if (!brick) {   // entramat de fusta
    for (let y = h / floors; y < h; y += h / floors) backQ(c, cam, X0, X1, y - 0.06, y + 0.06, Z - 0.01, timber);
    backQ(c, cam, X0, X0 + 0.14, 0, h, Z - 0.01, timber); backQ(c, cam, X1 - 0.14, X1, 0, h, Z - 0.01, timber);
  }
  const fl = h / floors;
  for (let f = 0; f < floors; f++) for (let k = 0; k < win; k++) {
    const wx = X0 + (X1 - X0) * (k + 0.5) / win, y0 = f * fl + fl * 0.35;
    if (door != null && f === 0 && k === door) continue;
    const on = r() < lit;
    backQ(c, cam, wx - 0.35, wx + 0.35, y0, y0 + fl * 0.45, Z - 0.02, timber);
    backQ(c, cam, wx - 0.27, wx + 0.27, y0 + 0.08, y0 + fl * 0.45 - 0.08, Z - 0.03, on ? "#f0a040" : "#1f1d36");
    if (on) addLight(c, wx, y0 + 0.4, Z - 0.8, [1, 0.7, 0.35], 1.8, 0.6);
    backQ(c, cam, wx - 0.02, wx + 0.02, y0 + 0.08, y0 + fl * 0.45 - 0.08, Z - 0.04, timber);
  }
  if (door != null) { const dx = X0 + (X1 - X0) * (door + 0.5) / win; backQ(c, cam, dx - 0.5, dx + 0.5, 0, 2.2, Z - 0.02, timber); backQ(c, cam, dx - 0.4, dx + 0.4, 0, 2.1, Z - 0.03, "#3e2e22"); }
}
// Façana lateral (pla X), de z0 a z1
export function sideFacade(c, cam, X, z0, z1, h, { wall = "#6b7287", timber = "#3e2e22", lit = 0.4, seed = 2, brick = false, win = 3, floors = 2 } = {}) {
  const r = rng(seed);
  if (brick && theme()) sideQ(c, cam, X, z0, z1, 0, h, brickMat(wall, timber)); else sideQ(c, cam, X, z0, z1, 0, h, wall);
  const fl = h / floors;
  for (let f = 0; f < floors; f++) for (let k = 0; k < win; k++) {
    const z = z0 + (z1 - z0) * (k + 0.5) / win, y0 = f * fl + fl * 0.35, on = r() < lit;
    sideQ(c, cam, X, z - 0.35, z + 0.35, y0, y0 + fl * 0.45, timber);
    sideQ(c, cam, X, z - 0.27, z + 0.27, y0 + 0.08, y0 + fl * 0.45 - 0.08, on ? "#f0a040" : "#1f1d36");
    if (on) addLight(c, X + (X < 0 ? 0.8 : -0.8), y0 + 0.4, z, [1, 0.7, 0.35], 1.8, 0.6);
  }
}
// Mur de pedra baix (paret del fons o lateral)
export const wallBack = (c, cam, X0, X1, h, Z, col = "#4c5266", joint = "#2b2a48") => { stoneBack(c, cam, X0, X1, 0, h, Z, col, joint); box(c, cam, X0, X1, h, h + 0.12, Z - 0.3, Z, { front: mix(col, "#fff", 0.1), top: mix(col, "#fff", 0.2) }); };

// Una sala: sostre, parets laterals i del fons (de pedra, arrebossat, paper pintat, maó o fusta) i el terra (callback)
export function hall(c, cam, { xl, xr, zb, hgt = null, wall = "#6b7287", joint = "#3b3a5c", ceil = "#161427", kind = "stone", floor, back = true, sides = true, stone = { h: 0.45, w: 0.9 }, z0 = 0.5, beams = kind === "paper" || kind === "plaster" }) {
  const surf = (col) => kind === "paper" ? mat(wallpaper(col, mix(col, "#000", 0.18)), col) : kind === "brick" ? mat(brickMat(col, joint), col) : col;
  c.rect(0, 0, W, H, mix(wall, "#000", 0.6));
  const top = hgt ?? 14;
  if (hgt) quad(c, cam, [[xl, hgt, z0], [xr, hgt, z0], [xr, hgt, zb], [xl, hgt, zb]], ceil);
  if (hgt && beams) beamsX(c, cam, xl, xr, hgt, 6, zb - 0.6, 1.8, mix(ceil, "#000", 0.35));
  if (kind === "stone") {
    if (sides) { stoneSide(c, cam, xl, z0, zb, 0, top, mix(wall, "#000", 0.1), joint, stone); stoneSide(c, cam, xr, z0, zb, 0, top, mix(wall, "#000", 0.16), joint, stone); }
    if (back) stoneBack(c, cam, xl, xr, 0, top, zb, wall, joint, stone);
  } else {
    if (sides) { sideQ(c, cam, xl, z0, zb, 0, top, surf(mix(wall, "#000", 0.1))); sideQ(c, cam, xr, z0, zb, 0, top, surf(mix(wall, "#000", 0.16))); }
    if (back) backQ(c, cam, xl, xr, 0, top, zb, surf(wall));
    if (kind === "plaster" || kind === "paper") {   // sòcol de fusta
      if (sides) { sideQ(c, cam, xl, z0, zb, 0, 0.9, "#3e2e22"); sideQ(c, cam, xr, z0, zb, 0, 0.9, "#3e2e22"); }
      if (back) backQ(c, cam, xl, xr, 0, 0.9, zb - 0.01, "#3e2e22");
    }
  }
  if (floor) floor();
  const j = mix(joint, "#000", 0.4);
  seg(c, cam, [xl, 0, z0], [xl, 0, zb], j); seg(c, cam, [xr, 0, z0], [xr, 0, zb], j); seg(c, cam, [xl, 0, zb], [xr, 0, zb], j);
}
// Bigues del sostre (de costat a costat)
export function beamsX(c, cam, xl, xr, hgt, z0, z1, step, col = "#3e2e22") { for (let z = z0; z <= z1; z += step) box(c, cam, xl, xr, hgt - 0.25, hgt, z, z + 0.25, { front: col, bottom: mix(col, "#000", 0.2) }); }
// Una figura humana senzilla (gent de fons: pagesos, vilatans, mariners), dreta o asseguda, a (X, Z)
export function figure(c, cam, X, Z, { coat = "#3e2e22", skin = "#c9b48a", hat = "#161427", scarf = null, seated = false, h = 1.7, seed = 1 } = {}) {
  const [x, y] = cam.p(X, 0, Z), s = cam.s(Z), r = rng(seed), hh = (seated ? h * 0.72 : h) * s, w = 0.42 * s;
  if (!seated) { c.rect(x - w * 0.35, y - hh * 0.45, w * 0.28, hh * 0.45, "#1f1d36"); c.rect(x + w * 0.07, y - hh * 0.45, w * 0.28, hh * 0.45, "#1f1d36"); }
  c.rect(x - w / 2, y - hh * (seated ? 0.95 : 0.82), w, hh * (seated ? 0.62 : 0.42), coat);
  c.rect(x - w / 2, y - hh * (seated ? 0.95 : 0.82), Math.max(1, w * 0.18), hh * (seated ? 0.62 : 0.42), mix(coat, "#fff", 0.1));
  const hy = y - hh * (seated ? 1.0 : 0.88), hr = Math.max(1, s * 0.12);
  c.circle(x, hy - hr, hr, skin);
  if (scarf) c.ellipse(x, hy - hr * 1.4, hr * 1.25, hr * 0.9, scarf);
  else if (hat) { c.rect(x - hr * 1.6, hy - hr * 1.8, hr * 3.2, Math.max(1, hr * 0.5), hat); c.rect(x - hr, hy - hr * 2.8, hr * 2, hr * 1.1, hat); }
  if (r() < 0.5 && s > 14) c.px(x + (r() < 0.5 ? -1 : 1), hy - hr, "#07060b");
}
// Ulls que brillen a la foscor (llops)
export function eyes(c, pts, col = "#f0a040") { for (const [x, y] of pts) { c.px(x, y, col); c.px(x + 3, y, col); } }

// Una porta en una paret lateral (pla X), prou endins perquè es vegi sencera a la pantalla: la vora de la pantalla
// talla la paret a z = f·|X|/160, i la porta comença com a mínim una mica més enllà. Torna el punt calent.
export function sideExit(c, cam, X, { at = 0, w = 1.5, h = 2.5, ...o } = {}) {
  const z0 = Math.max(at, (cam.f * Math.abs(X)) / 150 + 0.4);
  sideDoor(c, cam, X, z0, z0 + w, h, o);
  return hbSide(cam, X, z0 - 0.15, z0 + w + 0.15, 0, h + 0.2, 2);
}

/* ---------- Coses de fora ---------- */

// Làpida (de cara a la càmera) a (X, Z): kind 0 arrodonida, 1 creu, 2 obelisc
export function grave(c, cam, X, Z, kind = 0, col = "#6b7287", tilt = 0) {
  if (kind === 1) { box(c, cam, X - 0.06, X + 0.06, 0, 1.3, Z, Z + 0.12, { front: col }); box(c, cam, X - 0.3, X + 0.3, 0.8, 0.95, Z, Z + 0.12, { front: col }); return; }
  if (kind === 2) { box(c, cam, X - 0.25, X + 0.25, 0, 0.3, Z, Z + 0.5, { front: col }); quad(c, cam, [[X - 0.16, 0.3, Z + 0.1], [X + 0.16, 0.3, Z + 0.1], [X + 0.05, 2.0, Z + 0.1], [X - 0.05, 2.0, Z + 0.1]], col); return; }
  const h = 0.8 + tilt;
  box(c, cam, X - 0.32, X + 0.32, 0, h, Z, Z + 0.12, { front: col });
  const pts = []; for (let k = 0; k <= 8; k++) { const a = Math.PI * k / 8; pts.push([X + Math.cos(a) * 0.32, h + Math.sin(a) * 0.22, Z]); }
  quad(c, cam, pts, col);
}
// Arbre sec de branques retorçades (silueta, en píxels: base a x, y; s píxels per metre; h metres)
export function deadTree(c, x, y, s, h, col = "#07060b", seed = 3) {
  const r = rng(seed);
  const branch = (x0, y0, a, len, w, d) => {
    const x1 = x0 + Math.cos(a) * len, y1 = y0 - Math.sin(a) * len;
    for (let k = -Math.floor(w / 2); k <= Math.floor(w / 2); k++) c.line(Math.round(x0 + k), Math.round(y0), Math.round(x1 + k * 0.5), Math.round(y1), col);
    if (d > 0) for (let n = 0; n < 2 + (r() < 0.4 ? 1 : 0); n++) branch(x1, y1, a + (r() - 0.5) * 1.6, len * (0.55 + r() * 0.2), Math.max(1, w * 0.6), d - 1);
  };
  branch(x, y, Math.PI / 2 + (r() - 0.5) * 0.2, h * s * 0.42, Math.max(1, s * 0.3), 4);
}
// Fanal de gas (Londres): pal i llum a (X, Z)
export function gasLamp(c, cam, X, Z) {
  box(c, cam, X - 0.06, X + 0.06, 0, 3.2, Z, Z + 0.12, { front: "#161427" });
  box(c, cam, X - 0.2, X + 0.2, 3.2, 3.65, Z - 0.08, Z + 0.2, { front: "#ffd870" });
  quad(c, cam, [[X - 0.26, 3.65, Z], [X + 0.26, 3.65, Z], [X, 3.9, Z]], "#161427");
  const [x, y] = cam.p(X, 3.42, Z), s = cam.s(Z);
  addLight(c, X, 3.3, Z - 0.3, [1, 0.8, 0.45], 5, 1.1, { kind: "candle", fx: x, fy: y, sx: x, sy: y, sr: s * 0.8 });
}
// Vaixell (de costat, pla z): casc de x0 a x1, pals amb cordam i veles plegades
export function ship(c, cam, X0, X1, Z, { hull = "#2b1a14", masts = 2, sails = false, waterY = 0 } = {}) {
  const L = X1 - X0;
  quad(c, cam, [[X0, waterY + 1.6, Z], [X1 + 0.6, waterY + 2.0, Z], [X1 - 0.4, waterY - 0.4, Z], [X0 + 0.6, waterY - 0.4, Z]], hull);
  backQ(c, cam, X0 + 0.2, X1, waterY + 1.3, waterY + 1.45, Z - 0.01, "#a08458");
  for (let m = 0; m < masts; m++) {
    const mx = X0 + L * (m + 1) / (masts + 1), mh = waterY + 1.6 + L * 0.75;
    backQ(c, cam, mx - 0.08, mx + 0.08, waterY + 1.6, mh, Z - 0.02, "#3e2e22");
    for (const yy of [0.45, 0.75]) backQ(c, cam, mx - L * 0.18, mx + L * 0.18, waterY + 1.6 + (mh - 1.6) * yy, waterY + 1.6 + (mh - 1.6) * yy + 0.1, Z - 0.03, "#3e2e22");
    if (sails) for (const yy of [0.5, 0.8]) quad(c, cam, [[mx - L * 0.16, waterY + 1.6 + (mh - 1.6) * (yy - 0.04), Z - 0.04], [mx + L * 0.16, waterY + 1.6 + (mh - 1.6) * (yy - 0.04), Z - 0.04], [mx + L * 0.14, waterY + 1.6 + (mh - 1.6) * (yy - 0.25), Z - 0.04], [mx - L * 0.14, waterY + 1.6 + (mh - 1.6) * (yy - 0.25), Z - 0.04]], "#b8bccb");
    seg(c, cam, [mx, mh, Z - 0.02], [X0, waterY + 1.6, Z - 0.02], "#161427");
    seg(c, cam, [mx, mh, Z - 0.02], [X1 + 0.5, waterY + 2.0, Z - 0.02], "#161427");
  }
}
// Caixa de fusta (caixa de terra del comte)
export function crate(c, cam, x0, x1, z0, z1, h = 0.6, col = "#6e5638") {
  box(c, cam, x0, x1, 0, h, z0, z1, { front: col, top: mix(col, "#fff", 0.1) });
  for (const y of [0.08, h - 0.12]) backQ(c, cam, x0, x1, y, y + 0.05, z0 - 0.01, mix(col, "#000", 0.35));
  backQ(c, cam, x0, x0 + 0.06, 0, h, z0 - 0.01, mix(col, "#000", 0.35)); backQ(c, cam, x1 - 0.06, x1, 0, h, z0 - 0.01, mix(col, "#000", 0.35));
}
// Taüt (de costat, pla z)
export function coffin(c, cam, x0, x1, z0, z1, { col = "#3e2e22", lid = true } = {}) {
  box(c, cam, x0, x1, 0, 0.55, z0, z1, { front: col, top: lid ? mix(col, "#fff", 0.12) : "#07060b" });
  if (lid) { const xm = (x0 + x1) / 2; floorQ(c, cam, xm - 0.04, xm + 0.04, z0 + 0.1, z1 - 0.1, "#a08458", 0.56); floorQ(c, cam, xm - 0.2, xm + 0.2, z0 + (z1 - z0) * 0.3, z0 + (z1 - z0) * 0.3 + 0.07, "#a08458", 0.56); }
}

/* ---------- Mobles i llums ---------- */

// Aranya de llums que penja del sostre (centre X, alçada Y, profunditat Z)
export function chandelier(c, cam, X, Y, Z, top = 6, n = 6, r0 = 0.7) {
  seg(c, cam, [X, top, Z], [X, Y + 0.3, Z], "#161427");
  const ring = []; for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2; ring.push(cam.p(X + Math.cos(a) * r0, Y, Z + Math.sin(a) * r0 * 0.6)); }
  for (let k = 0; k < 16; k++) c.line(Math.round(ring[k][0]), Math.round(ring[k][1]), Math.round(ring[k + 1][0]), Math.round(ring[k + 1][1]), "#a08458");
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; candleAt(c, cam, X + Math.cos(a) * r0, Y, Z + Math.sin(a) * r0 * 0.6); }
}
// Una espelma dreta a (X, Y, Z) amb llum (flama animada per llums.mjs)
export function candleAt(c, cam, X, Y, Z, k = 0.4) {
  const [x, y] = cam.p(X, Y, Z), s = cam.s(Z);
  c.rect(Math.round(x), Math.round(y - s * 0.18), Math.max(1, Math.round(s * 0.05)), Math.max(2, Math.round(s * 0.18)), "#e8dcc0");
  c.px(Math.round(x), Math.round(y - s * 0.18) - 1, "#ffd870");
  addLight(c, X, Y + 0.25, Z, [1, 0.72, 0.4], 2.2, k, { kind: "candle", fx: Math.round(x), fy: Math.round(y - s * 0.18) - 1, sx: x, sy: y - s * 0.2, sr: Math.max(3, s * 0.4) });
}
// Canelobre de peu (tres espelmes)
export function candelabra(c, cam, X, Z, h = 1.6) {
  box(c, cam, X - 0.04, X + 0.04, 0, h, Z, Z + 0.08, { front: "#6e5638" });
  box(c, cam, X - 0.25, X + 0.25, h - 0.05, h, Z, Z + 0.08, { front: "#a08458" });
  for (const dx of [-0.22, 0, 0.22]) candleAt(c, cam, X + dx, h, Z, 0.35);
}
// Cortines a banda i banda d'una finestra del fons
export function curtains(c, cam, X0, X1, Y0, Y1, Z, col = "#6b0f1a") {
  for (const [a, b] of [[X0 - 0.5, X0 + 0.1], [X1 - 0.1, X1 + 0.5]]) {
    backQ(c, cam, a, b, Y0 - 0.3, Y1 + 0.3, Z - 0.05, col);
    for (let x = a + 0.12; x < b; x += 0.15) backQ(c, cam, x, x + 0.04, Y0 - 0.3, Y1 + 0.3, Z - 0.06, mix(col, "#000", 0.3));
  }
  backQ(c, cam, X0 - 0.6, X1 + 0.6, Y1 + 0.25, Y1 + 0.45, Z - 0.07, mix(col, "#000", 0.2));
}
// Catifa (rectangle al terra amb vora)
export function rug(c, cam, x0, x1, z0, z1, col = "#6b0f1a", border = "#a08458") { floorQ(c, cam, x0, x1, z0, z1, border, 0.01); floorQ(c, cam, x0 + 0.15, x1 - 0.15, z0 + 0.15, z1 - 0.15, col, 0.012); }
// Cadira (de cara a la càmera o d'esquena)
export function chair(c, cam, X, Z, col = "#3e2e22") {
  box(c, cam, X - 0.25, X + 0.25, 0.45, 1.1, Z + 0.4, Z + 0.48, { front: col });
  box(c, cam, X - 0.25, X + 0.25, 0.4, 0.48, Z, Z + 0.48, { front: mix(col, "#000", 0.2), top: col });
  for (const dx of [-0.22, 0.17]) box(c, cam, X + dx, X + dx + 0.05, 0, 0.4, Z, Z + 0.05, { front: mix(col, "#000", 0.3) });
}
// Reixa (barrots verticals al pla Z)
export function bars(c, cam, X0, X1, Y0, Y1, Z, n = 6, col = "#161427") {
  for (let k = 0; k <= n; k++) { const x = X0 + (X1 - X0) * k / n; backQ(c, cam, x - 0.025, x + 0.025, Y0, Y1, Z, col); }
  backQ(c, cam, X0, X1, Y1 - 0.05, Y1, Z, col); backQ(c, cam, X0, X1, Y0, Y0 + 0.05, Z, col);
}
// Mirall o quadre cobert amb un drap (al pla X d'una paret lateral)
export function sideFrame(c, cam, X, z0, z1, y0, y1, frame = "#a08458", inside = "#161427") { sideQ(c, cam, X, z0 - 0.06, z1 + 0.06, y0 - 0.06, y1 + 0.06, frame); sideQ(c, cam, X, z0, z1, y0, y1, inside); }

export { hb, hbBox, hbBack, hbSide, at, mix, rng, rgba, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide, floorPoly, addLight, addTwinkle, Cam, Canvas, theme, planks, tiles };
