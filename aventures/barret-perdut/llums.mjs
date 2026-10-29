// Llums animades: el joc només anima personatges, així que cada escenari amb llums té un «personatge» que és una
// capa transparent del mida del decorat, amb flames que es mouen i halos que tremolen (6 fotogrames en bucle).
//
// Com encaixa amb el reproductor:
// - Es col·loca amb els peus a la y de dalt de la zona caminable: es dibuixa darrere de tots els personatges i
//   l'alçada hi és la «far» de l'escenari, de manera que l'escala és far/32 (32 = fotograma d'en Harry).
//   El fotograma es fa a la resolució que, un cop escalat, torna a caure píxel a píxel sobre el decorat.
// - Es col·loca a x = 1 i fa 640 px d'ample: el protagonista sempre hi és a la dreta, i si s'hi gira (en
//   clicar-ne una flama) no s'emmiralla. Les animacions de costat són les mateixes que les de cara.
// - Els halos tenen opacitat ≤ 16 (el reproductor no compta aquests píxels per als clics): no tapen res.
import { Canvas, rgba } from "./persp.mjs";

const FRAMES = 6, FPS = 7;
const PAL = { red: "#e43b44", orange: "#f77622", amber: "#feae34", yellow: "#fee761", white: "#ffffff" };

function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

// Dibuixa el fotograma f (llenç de 320×200, en coordenades del decorat)
function frame(sc, f) {
  const c = new Canvas(320, 200), bg = sc.bg, gb = bg.gb;
  const visible = (x, y, Z) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= 320 || y >= 200 || !gb) return true;
    const z = gb[(y * 320 + x) * 3 + 2];
    return Number.isNaN(z) || z > Z - 0.8;
  };
  const halo = (x, y, r, k) => {
    // pols de llum: càlid quan puja, fosc quan baixa (opacitat ≤ 16)
    const col = k > 0 ? rgba(PAL.amber) : [0, 0, 0, 255];
    const a = Math.abs(k);
    for (let j = Math.floor(y - r); j <= y + r; j++) for (let i = Math.floor(x - r); i <= x + r; i++) {
      const d = Math.hypot(i - x, j - y) / r;
      if (d >= 1 || i < 0 || j < 0 || i >= 320 || j >= 200) continue;
      const al = Math.min(16, Math.round(16 * a * (1 - d) * (k > 0 ? 1 : 0.8)));
      if (al > 0) { const o = (j * 320 + i) * 4; c.data[o] = col[0]; c.data[o + 1] = col[1]; c.data[o + 2] = col[2]; c.data[o + 3] = Math.max(c.data[o + 3], al); }
    }
  };
  (bg.lights ?? []).forEach((li, n) => {
    if (!li.kind || li.kind === "moon") return;
    const r = rnd(n * 977 + f * 131 + 7);
    if (!visible(li.fx, li.fy, li.Z + 0.3)) return;
    const pulse = Math.sin((f / FRAMES) * Math.PI * 2 + n * 1.7) * 0.6 + (r() - 0.5) * 0.8;
    halo(li.sx, li.sy, li.sr, pulse);
    if (li.kind === "torch") {
      const h = li.ry * (0.85 + r() * 0.5), w = li.rx * (0.8 + r() * 0.5), dx = Math.round((r() - 0.5) * 2);
      c.ellipse(li.fx + dx, li.fy - (h - li.ry), Math.max(1, Math.round(w)), Math.max(2, Math.round(h)), PAL.orange);
      c.ellipse(li.fx + dx * 0.5, li.fy - (h - li.ry) * 0.5 + 1, Math.max(1, Math.round(w * 0.5)), Math.max(1, Math.round(h * 0.55)), PAL.yellow);
      if (r() < 0.6) c.px(li.fx + dx, li.fy - h * 2 + 1, PAL.amber);           // espurna a la punta
    } else if (li.kind === "candle") {
      const on = r();
      c.px(li.fx, li.fy, on < 0.25 ? PAL.amber : on < 0.85 ? PAL.yellow : PAL.white);
      if (on > 0.5) c.px(li.fx, li.fy - 1, PAL.amber);
    } else if (li.kind === "fire") {
      const n2 = Math.max(4, Math.round(li.fw / 3));
      for (let k = 0; k < n2; k++) {
        const fx = li.fx + (r() - 0.5) * li.fw, h = (0.2 + r() * 0.5) * li.fs;
        if (!visible(fx, li.fy - 2, li.Z)) continue;
        c.ellipse(fx, li.fy - h / 2, Math.max(1, li.fs * 0.07), Math.max(1, h / 2), k % 3 ? PAL.orange : PAL.amber);
        c.ellipse(fx, li.fy - h / 3, Math.max(1, li.fs * 0.035), Math.max(1, h / 4), PAL.yellow);
      }
      for (let k = 0; k < 3; k++) if (r() < 0.5) c.px(li.fx + (r() - 0.5) * li.fw, li.fy - li.fs * (0.6 + r() * 0.5), PAL.amber);
    }
  });
  // finestres llunyanes que fan pampallugues (una de cada quatre, cada fotograma unes altres)
  (bg.twinkles ?? []).forEach((t, n) => {
    const r = rnd(n * 389 + f * 53 + 3);
    if (t.warm) { const k = r(); c.rect(Math.round(t.x), Math.round(t.y), Math.max(1, Math.round(t.w)), Math.max(1, Math.round(t.h)), k < 0.3 ? PAL.amber : k < 0.8 ? "#ffcf6a" : PAL.yellow); return; }
    if (r() < 0.22) c.rect(Math.round(t.x), Math.round(t.y), Math.max(1, Math.round(t.w)), Math.max(1, Math.round(t.h)), r() < 0.5 ? "#a8742a" : PAL.yellow);
  });
  return c;
}

// El full de sprites i la col·locació del «personatge» de llums d'un escenari (null si no n'hi ha)
export function lightsCharacter(sc) {
  const lights = (sc.bg.lights ?? []).filter((l) => l.kind && l.kind !== "moon");
  if (!lights.length && !(sc.bg.twinkles ?? []).length) return null;
  const frames = Array.from({ length: FRAMES }, (_, f) => frame(sc, f));
  // fins on arriben les coses que es mouen (per no fer el fotograma més alt del que cal)
  let top = 200, bottom = 0;
  for (const c of frames) for (let y = 0; y < 200; y++) for (let x = 0; x < 320; x++) if (c.data[(y * 320 + x) * 4 + 3]) { if (y < top) top = y; if (y > bottom) bottom = y; }
  const ys = sc.walk.flat().map((p) => p[1]), feet = Math.min(...ys);
  if (bottom >= feet) frames.forEach((c) => c.data.fill(0, feet * 320 * 4));   // res per sota dels peus (quedaria davant dels personatges)
  const s = sc.ah.far / 32;                    // píxels del decorat per píxel del fotograma
  const FW = Math.round(640 / s), FH = Math.max(1, Math.round((feet - Math.max(0, top - 2)) / s));
  const Hd = FH * s, Wd = FW * s, left = 1 - Wd / 2, topD = feet - Hd;
  const cols = 2, sheet = new Canvas(FW * cols, FH * Math.ceil(FRAMES / cols));
  frames.forEach((c, f) => {
    const ox = (f % cols) * FW, oy = Math.floor(f / cols) * FH;
    for (let j = 0; j < FH; j++) {
      const y = Math.floor(topD + (j + 0.5) * s);
      if (y < 0 || y >= feet) continue;
      for (let i = 0; i < FW; i++) {
        const x = Math.floor(left + (i + 0.5) * s);
        if (x < 0 || x >= 320) continue;
        const o = (y * 320 + x) * 4;
        if (!c.data[o + 3]) continue;
        const d = ((oy + j) * sheet.w + ox + i) * 4;
        sheet.data[d] = c.data[o]; sheet.data[d + 1] = c.data[o + 1]; sheet.data[d + 2] = c.data[o + 2]; sheet.data[d + 3] = c.data[o + 3];
      }
    }
  });
  const loop = { frames: Array.from({ length: FRAMES }, (_, i) => i), fps: FPS };
  const animations = Object.fromEntries(["idle", "walk", "talk"].flatMap((a) => ["side", "down", "up"].map((d) => [`${a}-${d}`, loop])));
  return { sheet, frameWidth: FW, frameHeight: FH, animations, position: [1, feet] };
}
