// Llums animades: flames de torxes, espelmes i llars de foc que es mouen, halos que tremolen i finestres llunyanes
// que fan pampallugues. Es dibuixen en coordenades del decorat (6 fotogrames en bucle) i fx.mjs en fa un objecte
// decoratiu animat (un estat amb fotogrames, que no es pot tocar).
import { Canvas, rgba } from "./persp.mjs";

const FRAMES = 6, FPS = 7;
const PAL = { red: "#e43b44", orange: "#f77622", amber: "#feae34", yellow: "#fee761", white: "#ffffff" };

function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

// Dibuixa el fotograma f (llenç de 320×240, en coordenades del decorat)
function frame(sc, f) {
  const c = new Canvas(320, 240), bg = sc.bg, gb = bg.gb;
  const visible = (x, y, Z) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= 320 || y >= 240 || !gb) return true;
    const z = gb[(y * 320 + x) * 3 + 2];
    return Number.isNaN(z) || z > Z - 0.8;
  };
  const halo = (x, y, r, k) => {
    // pols de llum: càlid quan puja, fosc quan baixa
    const col = k > 0 ? rgba(PAL.amber) : [0, 0, 0, 255];
    const a = Math.abs(k);
    for (let j = Math.floor(y - r); j <= y + r; j++) for (let i = Math.floor(x - r); i <= x + r; i++) {
      const d = Math.hypot(i - x, j - y) / r;
      if (d >= 1 || i < 0 || j < 0 || i >= 320 || j >= 240) continue;
      const al = Math.min(44, Math.round(44 * a * (1 - d) * (k > 0 ? 1 : 0.7)));
      if (al > 0) { const o = (j * 320 + i) * 4; c.data[o] = col[0]; c.data[o + 1] = col[1]; c.data[o + 2] = col[2]; c.data[o + 3] = Math.max(c.data[o + 3], al); }
    }
  };
  (bg.lights ?? []).forEach((li, n) => {
    if (!li.kind || li.kind === "moon" || (li.kind === "candle" && sc.bg.candles)) return;   // les espelmes que suren ja porten la seva llum
    const r = rnd(n * 977 + f * 131 + 7);
    if (!visible(li.fx, li.fy, li.Z + 0.3)) return;
    const pulse = Math.sin((f / FRAMES) * Math.PI * 2 + n * 1.7) * 0.6 + (r() - 0.5) * 0.8;
    halo(li.sx, li.sy, li.sr, pulse);
    if (li.kind === "torch") {
      const h = li.ry * (0.85 + r() * 0.5), w = li.rx * (0.8 + r() * 0.5), dx = Math.round((r() - 0.5) * 2);
      c.ellipse(li.fx + dx, li.fy - (h - li.ry), Math.max(1, Math.round(w)), Math.max(2, Math.round(h)), PAL.orange);
      c.ellipse(li.fx + dx * 0.5, li.fy - (h - li.ry) * 0.5 + 1, Math.max(1, Math.round(w * 0.5)), Math.max(1, Math.round(h * 0.55)), PAL.yellow);
      if (r() < 0.6) c.px(li.fx + dx, li.fy - h * 2 + 1, PAL.amber);           // espurna a la punta
    } else if (li.kind === "candle" && !sc.bg.candles) {
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

// Els fotogrames (llenços de 320×240) de les flames i els halos d'un escenari, o null si no n'hi ha
export function lightFrames(sc) {
  const lights = (sc.bg.lights ?? []).filter((l) => l.kind && l.kind !== "moon");
  if (!lights.length && !(sc.bg.twinkles ?? []).length) return null;
  const fr = Array.from({ length: FRAMES }, (_, f) => frame(sc, f));
  return fr.some((c) => c.data.some((v, i) => i % 4 === 3 && v)) ? fr : null;
}
