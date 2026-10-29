// Personatges (aspectes, fantasmes translúcids, en Hagrid gegant, en Dobby i en Firenze dibuixats a part) i les
// imatges dels objectes que només són a l'inventari.
import { Canvas, mix, fill } from "./persp.mjs";
const K = await import(new URL("../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const { characterSheet } = K;

const robe = { jacket: "#1e1e24", pants: "#2a2a30", shoes: "#141414" };
export const LOOKS = {
  harry: { skin: "#f0c8a0", hair: "#141414", glasses: "#1a1a1a", shirt: "#a01c1c", ...robe },
  ron: { skin: "#f6d2b4", hair: "#d8601a", shirt: "#a01c1c", ...robe },
  hermione: { skin: "#f0c8a0", hair: "#7a4a26", long: 1, shirt: "#a01c1c", jacket: "#1e1e24", dress: "#2a2a30", legs: "#6a6a70", shoes: "#3a2a1a" },
  neville: { skin: "#f6d2b4", hair: "#5a3a1e", shirt: "#7a9ad0", stripes: "#e8eef8", pants: "#7a9ad0", shoes: "#8a5a3a" },
  mcgonagall: { skin: "#ecd0b4", hair: "#3a3a3a", bun: 1, glasses: "#5a5a5a", hat: "#1e4a2a", shirt: "#1e4a2a", jacket: "#163a20", dress: "#1e4a2a", legs: "#1e4a2a", shoes: "#141414" },
  dumbledore: { skin: "#ecd0b4", hair: "#e4e4e4", long: 1, beard: "#f0f0f0", glasses: "#c8c8c8", hat: "#5a2a8a", shirt: "#7a4aaa", jacket: "#5a2a8a", dress: "#5a2a8a", legs: "#5a2a8a", shoes: "#3a1a5a" },
  snape: { skin: "#e4d8c8", hair: "#0e0e10", long: 1, shirt: "#141418", jacket: "#08080a", dress: "#0e0e10", legs: "#0e0e10", shoes: "#08080a" },
  hagrid: { skin: "#e0b090", hair: "#3a2614", long: 1, beard: "#3a2614", shirt: "#6a5440", jacket: "#4a3a28", pants: "#3a3020", shoes: "#2a1a10" },
  pince: { skin: "#ead2b6", hair: "#6a6a6a", bun: 1, shirt: "#3a2a4a", dress: "#2a2a3a", legs: "#2a2a3a", shoes: "#141414" },
  filch: { skin: "#d8c0a0", hair: "#6a6a5a", shirt: "#5a4a3a", jacket: "#3a3a2a", pants: "#3a3020", shoes: "#2a1a10" },
  peeves: { skin: "#f4d8e8", hat: "#e0402a", shirt: "#f0801a", stripes: "#8a2a9a", pants: "#2a9a4a", shoes: "#e0402a" },
  nick: { skin: "#e8eef8", hair: "#d0d8e8", beard: "#d0d8e8", shirt: "#e8eef8", jacket: "#a8b8d8", pants: "#a8b8d8", shoes: "#8898b8" },
  myrtle: { skin: "#e0eaf0", hair: "#9aaabb", ponytail: 1, glasses: "#f0f4f8", shirt: "#c0d0e0", jacket: "#9aaac0", dress: "#a8b8cc", legs: "#c0d0e0", shoes: "#8898b0" },
  baro: { skin: "#dde4ee", hair: "#a8b0c0", beard: "#a8b0c0", shirt: "#c8d0e0", stripes: "#d8a0b0", jacket: "#8898b0", pants: "#8898b0", shoes: "#6878a0" },
  draco: { skin: "#f6e2d2", hair: "#ece4b0", shirt: "#1f6a30", ...robe },
  sprout: { skin: "#ecc8a0", hair: "#9a9a8a", hat: "#6a5432", shirt: "#6a8a4a", apron: "#8a6a3a", dress: "#4a6a3a", legs: "#4a6a3a", shoes: "#3a2a1a" },
  hooch: { skin: "#e8c8a0", hair: "#d0d0d0", glasses: "#e8c040", shirt: "#3a3a3a", jacket: "#1a1a1a", pants: "#2a2a2a", shoes: "#141414" },
  luna: { skin: "#f6e2d2", hair: "#f0e8a8", long: 1, shirt: "#2a4aa0", jacket: "#1e1e24", dress: "#2a2a30", legs: "#e0d8f0", shoes: "#c070c0" },
};

// Full de sprites translúcid i clarejat (els fantasmes)
export function ghostSheet(look, alpha = 165) {
  const s = characterSheet(look);
  for (let i = 0; i < s.data.length; i += 4) if (s.data[i + 3]) {
    s.data[i] = Math.min(255, s.data[i] * 0.8 + 50); s.data[i + 1] = Math.min(255, s.data[i + 1] * 0.8 + 55); s.data[i + 2] = Math.min(255, s.data[i + 2] * 0.8 + 70);
    s.data[i + 3] = alpha;
  }
  return s;
}
// Amplia un llenç ×k (píxels sencers)
export function scale(img, k) {
  const c = new Canvas(img.w * k, img.h * k);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const p = img.get(x, y); if (p[3]) c.rect(x * k, y * k, k, k, p); }
  return c;
}
// Redueix/amplia un llenç a una alçada qualsevol (veí més proper)
export function resize(img, h) {
  const k = h / img.h, w = Math.max(1, Math.round(img.w * k)), c = new Canvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = img.get(Math.min(img.w - 1, Math.floor(x / k)), Math.min(img.h - 1, Math.floor(y / k))); if (p[3]) c.px(x, y, p); }
  return c;
}
// Un fotograma d'un full de 16×32 (per fer objectes amb figura, com en Filch)
export function frame(sheet, i, fw = 16, fh = 32) {
  const c = new Canvas(fw, fh);
  const ox = (i % 4) * fw, oy = Math.floor(i / 4) * fh;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const p = sheet.get(ox + x, oy + y); if (p[3]) c.px(x, y, p); }
  return c;
}

/* ---------- En Dobby: elf domèstic petit, orelles grosses, coixinera ---------- */
const DW = 16, DH = 20;
function elf(c, ox, oy, view, step, talk) {
  const P = (x, y, w, h, col) => c.rect(ox + x, oy + y, w, h, col);
  const skin = "#c8b8a0", dark = "#9a8a72", cloth = "#e8e0cc";
  // cames
  const legs = view === "side" ? [[6 + step, 0], [8 - step, 1]] : [[6, step > 0 ? 1 : 0], [9, step < 0 ? 1 : 0]];
  for (const [x, lift] of legs) { P(x, 15, 2, 4 - lift, skin); P(x, 19 - lift, 2, 1, dark); }
  // coixinera
  P(4, 10, 8, 6, cloth); P(4, 15, 8, 1, "#c8c0a8"); P(5, 11, 1, 1, "#c8c0a8");
  // braços
  if (view === "side") P(7 + step, 11, 2, 4, skin); else { P(3, 11, 1, 4, skin); P(12, 11, 1, 4, skin); }
  // cap gros i orelles
  P(4, 3, 8, 7, skin); P(4, 9, 8, 1, dark);
  if (view !== "up") {
    if (view === "side") { P(10, 5, 2, 2, "#2a7a3a"); P(11, 5, 1, 1, "#e8f8e8"); P(12, 6, 2, 1, skin); P(9, 8, 2, talk ? 2 : 1, talk ? "#6b1f1f" : dark); P(1, 2, 4, 3, skin); P(0, 1, 2, 2, skin); }
    else { P(5, 5, 2, 2, "#2a7a3a"); P(9, 5, 2, 2, "#2a7a3a"); P(5, 5, 1, 1, "#e8f8e8"); P(9, 5, 1, 1, "#e8f8e8"); P(7, 8, 2, talk ? 2 : 1, talk ? "#6b1f1f" : dark); P(0, 3, 4, 2, skin); P(12, 3, 4, 2, skin); P(0, 2, 1, 1, skin); P(15, 2, 1, 1, skin); }
  } else { P(0, 3, 4, 2, skin); P(12, 3, 4, 2, skin); }
  // mitjó (el que li dona en Harry: un de cada color)
  P(view === "side" ? 6 : 5, 18, 2, 1, "#a01c1c");
}
export function dobbySheet() {
  const c = new Canvas(DW * 4, DH * 4);
  const frames = [["side", 0, 0], ["side", 1, 0], ["side", 0, 0], ["side", -1, 0], ["down", 0, 0], ["down", 1, 0], ["down", 0, 0], ["down", -1, 0], ["up", 0, 0], ["up", 1, 0], ["up", 0, 0], ["up", -1, 0], ["side", 0, 1], ["down", 0, 1]];
  frames.forEach(([v, st, t], i) => elf(c, (i % 4) * DW, Math.floor(i / 4) * DH, v, st, t));
  return { sheet: c, frameWidth: DW, frameHeight: DH };
}

/* ---------- En Firenze: centaure (cos de cavall pàl·lid, cabells rossos) ---------- */
const FW = 32, FH = 46;
function centaur(c, ox, oy, step, talk) {
  const P = (x, y, w, h, col) => c.rect(ox + x, oy + y, w, h, col);
  const coat = "#d8c088", dark = "#b09860", skin = "#e8c8a0", hair = "#f0e0a0";
  // cames de cavall
  const lift = [step === 1 ? 1 : 0, step === -1 ? 1 : 0];
  P(5, 34, 3, 11 - lift[0], dark); P(9, 34, 3, 11, coat); P(21, 34, 3, 11, dark); P(25, 34, 3, 11 - lift[1], coat);
  for (const x of [5, 9, 21, 25]) P(x, 44, 3, 2, "#5a4a3a");
  // cos de cavall i cua
  P(4, 24, 24, 11, coat); P(4, 33, 24, 2, dark); P(1, 24, 4, 3, hair); P(0, 26, 3, 9, hair);
  // tors humà
  P(20, 11, 9, 14, skin); P(20, 11, 9, 1, mix(skin, "#000", 0.15));
  P(19, 13, 2, 8, skin); P(28, 12, 2, talk ? 6 : 9, skin);
  // cap i cabells llargs
  P(21, 2, 7, 9, skin); P(20, 1, 8, 3, hair); P(20, 1, 3, 12, hair);
  P(26, 5, 1, 1, "#2a4a8a"); P(28, 6, 1, 2, skin); P(25, 9, 2, talk ? 2 : 1, talk ? "#6b1f1f" : mix(skin, "#000", 0.35));
}
export function firenzeSheet() {
  const c = new Canvas(FW * 4, FH);
  [[0, 0], [1, 0], [-1, 0], [0, 1]].forEach(([st, t], i) => centaur(c, i * FW, 0, st, t));
  const anim = { "idle-side": { frames: [0], fps: 4 }, "walk-side": { frames: [0, 1, 0, 2], fps: 6 }, "talk-side": { frames: [0, 3], fps: 5 },
    "idle-down": { frames: [0], fps: 4 }, "talk-down": { frames: [0, 3], fps: 5 }, "walk-down": { frames: [0, 1, 0, 2], fps: 6 }, "idle-up": { frames: [0], fps: 4 }, "walk-up": { frames: [0, 1, 0, 2], fps: 6 }, "talk-up": { frames: [0], fps: 4 } };
  return { sheet: c, frameWidth: FW, frameHeight: FH, animations: anim };
}
export const DOBBY_ANIM = {
  "idle-side": { frames: [0], fps: 4 }, "walk-side": { frames: [1, 2, 3, 2], fps: 8 }, "idle-down": { frames: [4], fps: 4 }, "walk-down": { frames: [5, 6, 7, 6], fps: 8 },
  "idle-up": { frames: [8], fps: 4 }, "walk-up": { frames: [9, 10, 11, 10], fps: 8 }, "talk-side": { frames: [0, 12], fps: 6 }, "talk-down": { frames: [4, 13], fps: 6 }, "talk-up": { frames: [8], fps: 4 },
};

/* ---------- Objectes de l'inventari ---------- */
const C = (w, h, fn) => { const c = new Canvas(w, h); fn(c); return c; };
export const ICONS = {
  varita: () => C(16, 16, (c) => { c.line(2, 14, 13, 3, "#5a3a1e"); c.line(3, 14, 14, 3, "#6b4423"); c.rect(2, 13, 2, 2, "#3a2414"); c.px(14, 2, "#fff6c0"); c.px(15, 1, "#ffe080"); }),
  capa: () => C(18, 16, (c) => { fill(c, [[4, 1], [14, 1], [17, 15], [1, 15]], "#6a7a9a"); fill(c, [[5, 2], [13, 2], [15, 14], [3, 14]], [140, 160, 200, 160]); for (let i = 0; i < 8; i++) c.px(4 + i * 1.5, 4 + (i % 3) * 4, "#e8f0ff"); c.line(9, 2, 9, 14, "#5a6a8a"); }),
  flauta: () => C(18, 6, (c) => { c.rect(1, 2, 16, 3, "#8a5a2a"); c.rect(1, 2, 16, 1, "#a8723a"); for (const x of [6, 9, 12, 15]) c.px(x, 3, "#2a1a0a"); c.rect(1, 1, 3, 5, "#6a4420"); }),
  nota: () => C(14, 10, (c) => { c.rect(0, 0, 14, 10, "#f4ecd8"); c.rect(0, 9, 14, 1, "#c8bc9c"); c.rect(2, 2, 9, 1, "#3a3a8a"); c.rect(2, 4, 7, 1, "#3a3a8a"); c.rect(2, 6, 10, 1, "#3a3a8a"); }),
  orelleres: () => C(16, 14, (c) => { c.line(3, 8, 3, 4, "#8a2a8a"); c.line(3, 4, 6, 1, "#8a2a8a"); c.line(6, 1, 10, 1, "#8a2a8a"); c.line(10, 1, 13, 4, "#8a2a8a"); c.line(13, 4, 13, 8, "#8a2a8a"); c.circle(3, 10, 3, "#e080c0"); c.circle(13, 10, 3, "#e080c0"); c.px(2, 9, "#ffd0f0"); c.px(12, 9, "#ffd0f0"); }),
  bomba: () => C(12, 12, (c) => { c.circle(6, 7, 4, "#5a6a2a"); c.circle(5, 6, 1, "#8a9a4a"); c.rect(5, 1, 2, 2, "#3a3a2a"); for (const [x, y] of [[2, 1], [9, 2], [10, 0]]) c.px(x, y, "#a8c040"); }),
  invitacio: () => C(16, 11, (c) => { c.rect(0, 0, 16, 11, "#1a1a1a"); c.rect(1, 1, 14, 9, "#2a2a2a"); c.rect(3, 3, 10, 1, "#c0c0c0"); c.rect(4, 5, 8, 1, "#c0c0c0"); c.circle(8, 8, 1, "#c0c0c0"); }),
  permis: () => C(13, 15, (c) => { c.rect(0, 0, 13, 15, "#f0e4c4"); for (let y = 2; y < 10; y += 2) c.rect(2, y, 9, 1, "#5a4a3a"); c.line(2, 12, 7, 11, "#1e4a2a"); c.circle(10, 12, 2, "#a01c1c"); }),
  "flasco-buit": () => C(9, 15, (c) => { c.rect(3, 0, 3, 2, "#8a6a3a"); c.rect(3, 2, 3, 3, "#c8e0e8"); c.ellipse(4, 10, 4, 4, "#c8e0e8"); c.ellipse(4, 10, 3, 3, "#e8f4f8"); c.px(2, 8, "#ffffff"); }),
  "flasco-aigua": () => C(9, 15, (c) => { c.rect(3, 0, 3, 2, "#8a6a3a"); c.rect(3, 2, 3, 3, "#c8e0e8"); c.ellipse(4, 10, 4, 4, "#c8e0e8"); c.ellipse(4, 11, 3, 2, "#2a4a8a"); c.px(2, 8, "#ffffff"); }),
  pocio: () => C(9, 15, (c) => { c.rect(3, 0, 3, 2, "#8a6a3a"); c.rect(3, 2, 3, 3, "#c8e0e8"); c.ellipse(4, 10, 4, 4, "#e8c84a"); c.ellipse(4, 10, 3, 3, "#fff080"); c.px(2, 8, "#ffffff"); c.circle(4, 10, 4, [255, 240, 120, 60]); }),
  fulla: () => C(14, 14, (c) => { fill(c, [[1, 13], [5, 4], [12, 1], [9, 9]], "#4a8a3a"); c.line(1, 13, 11, 2, "#2a5a1a"); c.px(6, 7, "#8ac05a"); }),
  pel: () => C(16, 10, (c) => { for (let x = 1; x < 15; x++) c.px(x, Math.round(5 + Math.sin(x * 0.6) * 3), x % 2 ? "#f0f4ff" : "#c8d4f0"); c.circle(8, 5, 5, [220, 230, 255, 40]); }),
  ploma: () => C(16, 16, (c) => { c.line(2, 14, 13, 2, "#e8c040"); fill(c, [[4, 12], [8, 4], [13, 1], [11, 8], [6, 13]], "#d8401a"); fill(c, [[7, 9], [10, 4], [12, 3], [10, 8]], "#f0a020"); }),
  cadena: () => C(19, 8, (c) => { for (let i = 0; i < 5; i++) { const x = i * 3.6, y = 2 + (i % 2); c.rect(x, y, 4, 1, "#9aa0aa"); c.rect(x, y + 3, 4, 1, "#7a808a"); c.rect(x, y, 1, 4, "#8a909a"); c.rect(x + 3, y, 1, 4, "#8a909a"); } }),
  pastis: () => C(16, 11, (c) => { fill(c, [[1, 10], [15, 10], [13, 3], [3, 3]], "#c86a1a"); c.rect(1, 9, 14, 2, "#a8501a"); c.rect(3, 3, 10, 2, "#e8a050"); for (const x of [5, 8, 11]) c.px(x, 6, "#f0c070"); }),
  escombra: () => C(24, 10, (c) => { c.line(1, 2, 16, 5, "#6b4423"); c.line(1, 3, 16, 6, "#5a3a1e"); fill(c, [[15, 4], [23, 1], [23, 9], [15, 7]], "#c8a050"); for (let y = 2; y < 9; y += 2) c.line(16, 5, 23, y, "#a88030"); }),
  paraigua: () => C(10, 20, (c) => { fill(c, [[5, 1], [9, 13], [1, 13]], "#f080b0"); c.line(5, 1, 5, 13, "#d06090"); c.rect(4, 13, 2, 5, "#5a3a1e"); c.rect(2, 17, 3, 2, "#5a3a1e"); }),
  llanterna: () => C(10, 16, (c) => { c.rect(4, 0, 2, 2, "#3a3a3a"); c.rect(2, 2, 6, 2, "#3a3a3a"); c.rect(1, 4, 8, 9, "#3a3a3a"); c.rect(2, 5, 6, 7, "#ffd27a"); c.rect(4, 6, 2, 4, "#fff4c0"); c.rect(1, 13, 8, 2, "#3a3a3a"); }),
  recepta: () => C(13, 16, (c) => { c.rect(0, 0, 13, 16, "#e8dcb8"); c.rect(0, 0, 13, 2, "#8a5a2a"); for (let y = 4; y < 14; y += 2) c.rect(2, y, 6 + (y % 4), 1, "#3a2a1a"); c.px(10, 6, "#4a7ab8"); c.px(10, 8, "#4a8a3a"); c.px(10, 10, "#e0e0f0"); c.px(10, 12, "#d8401a"); }),
  cromo: () => C(11, 15, (c) => { c.rect(0, 0, 11, 15, "#c9a227"); c.rect(1, 1, 9, 13, "#3a2a5a"); c.circle(5, 5, 2, "#ecd0b4"); c.rect(3, 7, 5, 4, "#f0f0f0"); c.rect(2, 3, 7, 1, "#e4e4e4"); }),
};

/* ---------- Fantasmes que suren ---------- */
// Duplica el full (4×4 fotogrames) amb una còpia «dy» píxels més amunt: les animacions de quiet i de parlar
// alternen les dues alçades, i el personatge sura amunt i avall.
export function floatSheet(sheet, dy = 1, fw = 16, fh = 32) {
  const c = new Canvas(sheet.w, sheet.h * 2);
  c.draw(sheet, 0, 0); c.draw(sheet, 0, sheet.h - dy);
  for (let y = sheet.h - dy; y < sheet.h; y++) for (let x = 0; x < sheet.w; x++) { const p = sheet.get(x, y); if (p[3]) c.px(x, y, p); }
  // la còpia de baix no ha de trepitjar l'última fila de la de dalt: es torna a pintar la de dalt
  for (let y = 0; y < sheet.h; y++) for (let x = 0; x < sheet.w; x++) { const i = (y * c.w + x) * 4; const p = sheet.get(x, y); c.data.set(p, i); }
  const up = 16;
  const animations = {
    "idle-side": { frames: [0, 0, up, up], fps: 3 }, "walk-side": { frames: [1, 2, 3, 2], fps: 8 },
    "idle-down": { frames: [4, 4, 4 + up, 4 + up], fps: 3 }, "walk-down": { frames: [5, 6, 7, 6], fps: 8 },
    "idle-up": { frames: [8, 8, 8 + up, 8 + up], fps: 3 }, "walk-up": { frames: [9, 10, 11, 10], fps: 8 },
    "talk-side": { frames: [0, 12, up, 12 + up], fps: 6 }, "talk-down": { frames: [4, 13, 4 + up, 13 + up], fps: 6 }, "talk-up": { frames: [8, 8 + up], fps: 4 },
  };
  return { sheet: c, frameWidth: fw, frameHeight: fh, animations };
}
