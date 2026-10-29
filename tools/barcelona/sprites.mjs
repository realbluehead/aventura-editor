// Fulls de sprites dels personatges (fotogrames de 16×32 en una graella de 4×4) i les imatges dels objectes.
// Files del full: 0 de costat (quiet + 3 de caminar), 1 de cara, 2 d'esquena, 3 parlant (costat, cara).
import { Canvas, mix } from "./pixels.mjs";

export const FRAME_W = 16, FRAME_H = 32;

export const ANIMATIONS = {
  "idle-side": { frames: [0], fps: 4 },
  "walk-side": { frames: [1, 2, 3, 2], fps: 8 },
  "idle-down": { frames: [4], fps: 4 },
  "walk-down": { frames: [5, 6, 7, 6], fps: 8 },
  "idle-up": { frames: [8], fps: 4 },
  "walk-up": { frames: [9, 10, 11, 10], fps: 8 },
  "talk-side": { frames: [0, 12], fps: 6 },
  "talk-down": { frames: [4, 13], fps: 6 },
  "talk-up": { frames: [8], fps: 4 },
};

// Una figura en un fotograma. «view»: side | down | up. «step»: -1, 0 o 1 (cames). «talk»: boca oberta.
function figure(c, ox, oy, p, view, step, talk) {
  const dark = (col, t = 0.25) => mix(col, "#000", t);
  const P = (x, y, w, h, col) => c.rect(ox + x, oy + y, w, h, col);
  const skirt = p.dress;
  // cames i sabates
  const legs = view === "side"
    ? [[6 + step * 2, 0], [7 - step * 2, 1]]
    : [[5, step > 0 ? 1 : 0], [9, step < 0 ? 1 : 0]];
  for (const [x, lift] of legs) {
    P(x, 21, 3, 8 - lift, p.legs ?? p.pants);
    P(x - (view === "side" ? 0 : 0), 29 - lift, view === "side" ? 4 : 3, 2, p.shoes);
  }
  // tronc
  P(4, 11, 9, 10, p.shirt);
  P(4, 11, 9, 1, dark(p.shirt, 0.15));
  if (p.stripes) for (let y = 13; y < 21; y += 2) P(4, y, 9, 1, p.stripes);
  if (p.vest) { P(4, 11, 2, 10, p.vest); P(11, 11, 2, 10, p.vest); P(4, 17, 9, 1, "#e8e8e8"); }
  if (p.apron && view !== "up") P(5, 14, 7, 9, p.apron);
  if (p.jacket) { P(4, 11, 3, 10, p.jacket); P(10, 11, 3, 10, p.jacket); }
  if (skirt) { P(3, 18, 11, 7, skirt); P(3, 24, 11, 1, dark(skirt)); }
  // braços
  if (view === "side") {
    const swing = step * 2;
    P(7 + swing, 12, 3, 7, dark(p.jacket ?? p.shirt, 0.1));
    P(7 + swing, 19, 3, 2, p.skin);
  } else {
    P(2, 12, 2, 7, dark(p.jacket ?? p.shirt, 0.1));
    P(13, 12, 2, 7, dark(p.jacket ?? p.shirt, 0.1));
    P(2, 19, 2, 2, p.skin);
    P(13, 19, 2, 2, p.skin);
  }
  // cap
  P(5, 3, 7, 8, p.skin);
  P(7, 10, 3, 1, dark(p.skin, 0.15));   // coll
  const hair = p.hair;
  if (view === "up") {
    if (hair) P(5, 2, 7, 8, hair);
  } else {
    if (view === "side") {
      P(12, 6, 1, 2, p.skin);                         // nas
      P(10, 5, 1, 1, "#1a1a1a");                      // ull
      P(9, 8, 2, talk ? 2 : 1, talk ? "#6b1f1f" : dark(p.skin, 0.35));
      if (hair) { P(5, 2, 7, 3, hair); P(5, 2, 3, 6, hair); }
    } else {
      P(6, 5, 1, 1, "#1a1a1a");
      P(10, 5, 1, 1, "#1a1a1a");
      P(7, 8, 3, talk ? 2 : 1, talk ? "#6b1f1f" : dark(p.skin, 0.35));
      if (hair) { P(5, 2, 7, 3, hair); P(5, 3, 1, 3, hair); P(11, 3, 1, 3, hair); }
    }
  }
  // pentinats i barrets
  if (hair && p.long) {
    if (view === "side") P(4, 3, 3, 10, hair);
    else if (view === "down") { P(4, 3, 2, 10, hair); P(11, 3, 2, 10, hair); }
    else P(4, 2, 9, 11, hair);
  }
  if (hair && p.bun) P(view === "side" ? 4 : 7, 0, 3, 3, hair);
  if (p.ponytail && hair) P(view === "side" ? 3 : 7, 4, 2, 7, hair);
  if (p.beard && view !== "up") P(view === "side" ? 8 : 5, 8, view === "side" ? 4 : 7, 3, p.beard);
  if (p.glasses && view !== "up") {
    if (view === "side") P(9, 5, 3, 1, p.glasses);
    else { P(5, 5, 3, 1, p.glasses); P(9, 5, 3, 1, p.glasses); }
  }
  if (p.cap) { P(5, 1, 7, 3, p.cap); if (view !== "up") P(view === "side" ? 11 : 5, 3, view === "side" ? 3 : 7, 1, dark(p.cap)); }
  if (p.hat) { P(3, 2, 11, 1, p.hat); P(5, 0, 7, 3, p.hat); P(5, 2, 7, 1, dark(p.hat, 0.3)); }
  if (p.helmet) { P(4, 1, 9, 3, p.helmet); P(4, 3, 9, 1, dark(p.helmet, 0.2)); }
}

export function characterSheet(p) {
  const c = new Canvas(FRAME_W * 4, FRAME_H * 4);
  const at = (i) => [(i % 4) * FRAME_W, Math.floor(i / 4) * FRAME_H];
  const frames = [
    ["side", 0, false], ["side", 1, false], ["side", 0, false], ["side", -1, false],
    ["down", 0, false], ["down", 1, false], ["down", 0, false], ["down", -1, false],
    ["up", 0, false], ["up", 1, false], ["up", 0, false], ["up", -1, false],
    ["side", 0, true], ["down", 0, true],
  ];
  frames.forEach(([view, step, talk], i) => {
    const [x, y] = at(i);
    // al pas del mig el cos puja un píxel
    figure(c, x, y + (step === 0 && [2, 6, 10].includes(i) ? -1 : 0), p, view, step, talk);
  });
  return c;
}

/* ---------- Objectes ---------- */

export function mapa() {
  const c = new Canvas(14, 9);
  c.poly([[0, 2], [14, 0], [14, 7], [0, 9]], "#f1e6c4");
  c.rect(4, 1, 1, 7, "#c9b98f");
  c.rect(9, 1, 1, 7, "#c9b98f");
  c.line(1, 6, 12, 2, "#d7262e");
  c.rect(2, 3, 2, 2, "#6aa84f");
  c.rect(11, 4, 2, 2, "#2e86c1");
  return c;
}

export function moneda() {
  const c = new Canvas(9, 9);
  c.circle(4, 4, 4, "#b8901c");
  c.circle(4, 4, 3, "#f2c52b");
  c.rect(3, 2, 1, 4, "#b8901c");
  c.px(2, 2, "#fff6c2");
  return c;
}

export function rosa() {
  const c = new Canvas(9, 16);
  c.line(4, 6, 4, 15, "#2f7d32");
  c.rect(5, 10, 3, 2, "#3e9a41");
  c.rect(1, 12, 3, 2, "#3e9a41");
  c.circle(4, 4, 3, "#d7262e");
  c.rect(3, 2, 3, 2, "#a8141c");
  c.px(4, 3, "#ff6b6b");
  // la cinta amb la senyera
  for (let k = 0; k < 4; k++) c.px(3 + (k % 2), 8 + k, k % 2 ? "#f2c52b" : "#d7262e");
  return c;
}

export function peix() {
  const c = new Canvas(16, 7);
  c.ellipse(6, 3, 6, 3, "#9aa8b1");
  c.ellipse(6, 2, 5, 1, "#c8d3da");
  c.poly([[11, 3], [15, 0], [15, 6]], "#7f8d96");
  c.px(2, 2, "#111");
  return c;
}

export function pa() {
  const c = new Canvas(16, 7);
  c.ellipse(8, 3, 7, 3, "#c98b3c");
  c.ellipse(8, 2, 6, 1, "#e0a85a");
  for (const x of [4, 8, 12]) c.line(x - 1, 1, x + 1, 4, "#8f5a20");
  return c;
}

export function ulleres() {
  const c = new Canvas(13, 6);
  c.rect(0, 1, 5, 4, "#222");
  c.rect(8, 1, 5, 4, "#222");
  c.rect(1, 2, 3, 2, "#8fd3f5");
  c.rect(9, 2, 3, 2, "#8fd3f5");
  c.rect(5, 2, 3, 1, "#222");
  c.px(1, 2, "#ffffff");
  c.px(9, 2, "#ffffff");
  return c;
}

export function llibre() {
  const c = new Canvas(12, 14);
  c.rect(0, 0, 11, 14, "#1f4f7a");
  c.rect(10, 1, 2, 13, "#f4ecd8");
  c.rect(0, 0, 2, 14, "#163a5a");
  c.rect(3, 3, 6, 1, "#f2c52b");
  c.rect(3, 5, 6, 1, "#f2c52b");
  c.circle(6, 10, 2, "#d7262e");
  return c;
}

export function bitllet() {
  const c = new Canvas(14, 8);
  c.rect(0, 0, 14, 8, "#f4ecd8");
  c.rect(0, 0, 14, 2, "#c0392b");
  c.rect(1, 3, 8, 1, "#555");
  c.rect(1, 5, 5, 1, "#555");
  c.rect(10, 3, 3, 3, "#2e86c1");
  return c;
}

// Un llum de colors que fa de reclam a la Font Màgica (punt per clicar quan l'aigua s'apaga): s'importa de scenes.mjs
export function fontApagada() {
  const c = new Canvas(140, 8);
  for (let k = 0; k < 13; k++) c.rect(5 + k * 10.5, 4, 3, 3, "#9fb7c9");
  return c;
}

// Icones de 24×24 per a l'inventari: l'objecte centrat i ampliat
export function icon(img) {
  const s = Math.max(1, Math.floor(20 / Math.max(img.w, img.h)));
  const c = new Canvas(24, 24);
  const ox = Math.floor((24 - img.w * s) / 2), oy = Math.floor((24 - img.h * s) / 2);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y);
    if (p[3]) c.rect(ox + x * s, oy + y * s, s, s, p);
  }
  return c;
}
