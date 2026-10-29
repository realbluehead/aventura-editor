// L'estètica de «Dràcula»: una sola paleta i un sol tractament per a totes les imatges, perquè pintures i fotos de
// fonts molt diverses semblin del mateix joc, i perquè els personatges de pixel art hi encaixin.
const KIT = "../../skills/aventura-grafica/scripts/kit.mjs";
const K = await import(new URL(KIT, import.meta.url));
const { Canvas, ops, pixelArt, characterSheet, FRAME_W, FRAME_H, song } = K;

// Paleta «Nosferatu»: negres blavosos, morats, grisos de lluna, os i llum d'espelma, sang, i verds de molsa
export const PALETTE = [
  "#07060b", "#0e0c16", "#161427", "#1f1d36", "#2b2a48", "#3b3a5c",
  "#2a1830", "#3f2343", "#573056", "#6f4a6e",
  "#4c5266", "#6b7287", "#8f97a8", "#b8bccb", "#dcdbe0",
  "#e8dcc0", "#c9b48a", "#a08458", "#6e5638", "#3e2e22",
  "#3a0a10", "#6b0f1a", "#9e1a24", "#cc2a2a",
  "#1c2a24", "#2f4237", "#4d5e4a",
];
const RGB = PALETTE.map(ops.hexToRgba);

// Rampa nocturna per a la lluminositat
const RAMP = ["#05040a", "#121022", "#221d38", "#3a3050", "#5a5470", "#858aa0", "#b9bccb", "#e6e0cf"].map(ops.hexToRgba);
function ramp(l) {
  const t = Math.max(0, Math.min(1, l)) * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(t)), f = t - i;
  return [0, 1, 2].map((c) => RAMP[i][c] + (RAMP[i + 1][c] - RAMP[i][c]) * f);
}
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// El tractament: lluminositat → rampa nocturna (amb una mica del color original), sang, vinyeta i paleta
//   keep: quant color original es conserva (0–1); dark: enfosquiment dels tons mitjans; vignette: força de la vinyeta
export function grade(img, { keep = 0.1, dark = 1.1, vignette = 0.6, light = 0, dither = 0.45, blood = true } = {}) {
  const { width: w, height: h } = img, d = new Uint8ClampedArray(img.data);
  const lum = (i) => (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
  // Exposició automàtica: el 3% més fosc va a negre i el 2% més clar a blanc, perquè totes les imatges tinguin el mateix rang
  const hist = [];
  for (let i = 0; i < d.length; i += 16) if (d[i + 3] >= 128) hist.push(lum(i));
  hist.sort((a, b) => a - b);
  const lo = hist[Math.floor(hist.length * 0.03)] ?? 0, hi = Math.max(lo + 0.1, hist[Math.floor(hist.length * 0.98)] ?? 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (d[i + 3] < 128) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const l0 = Math.max(0.02, lum(i));
    let l = Math.max(0, (l0 - lo) / (hi - lo));
    l = Math.pow(l, dark) * 0.92 + light;
    const dx = (x / w - 0.5) * 2, dy = (y / h - 0.5) * 2, dist = Math.sqrt(dx * dx * 0.8 + dy * dy) / 1.34;
    l *= 1 - vignette * smooth(0.45, 1.05, dist);
    const base = ramp(l);
    // Una mica del color original, amb la lluminositat de la rampa
    const scale = (0.299 * base[0] + 0.587 * base[1] + 0.114 * base[2]) / 255 / l0;
    let out = [r, g, b].map((v, c) => base[c] * (1 - keep) + v * scale * keep);
    // Els vermells forts es queden com a sang
    const red = (r - (g + b) / 2) / 255;
    if (blood && red > 0.22) { const s = Math.min(1, (red - 0.22) * 2.5); out = [out[0] * (1 - s) + (60 + 140 * l) * s, out[1] * (1 - s) + 10 * s, out[2] * (1 - s) + 22 * s]; }
    d[i] = out[0]; d[i + 1] = out[1]; d[i + 2] = out[2];
  }
  const res = { width: w, height: h, data: d };
  ops.applyPalette(res, RGB, { dither: "bayer4", amount: dither });
  return res;
}

// Un fons de 320×200 a partir d'una imatge: retall i encaix, i el tractament
export function fons(file, { crop, anchorX, anchorY, ...g } = {}) {
  const raw = pixelArt(file, { colors: 0, dither: "none", method: "average", crop, anchorX, anchorY });
  return K.toCanvas(grade(K.fromCanvas(raw), g));
}

/* ---------- Personatges ---------- */

// Colors de la paleta per vestir la gent
const C = {
  pell: "#c9b48a", pellPalida: "#dcdbe0", pellMorena: "#a08458", pellComte: "#b8bccb",
  negre: "#0e0c16", fosc: "#1f1d36", gris: "#4c5266", grisClar: "#8f97a8", blanc: "#dcdbe0", os: "#e8dcc0",
  sang: "#6b0f1a", sangViva: "#9e1a24", morat: "#573056", moratFosc: "#3f2343", verd: "#2f4237", verdClar: "#4d5e4a",
  marro: "#6e5638", marroFosc: "#3e2e22", or: "#a08458", blau: "#3b3a5c", blauFosc: "#2b2a48",
};
export const LOOKS = {
  jonathan: { skin: C.pell, hair: C.marro, shirt: C.os, jacket: C.blau, pants: C.fosc, shoes: C.negre },
  dracula: { skin: C.pellComte, hair: C.blanc, beard: C.blanc, shirt: C.negre, jacket: C.negre, dress: C.sang, legs: C.negre, pants: C.negre, shoes: C.negre },
  draculaJove: { skin: C.pellComte, hair: C.negre, shirt: C.os, jacket: C.negre, pants: C.negre, shoes: C.negre, hat: C.negre },
  germana: { skin: C.pellPalida, hair: C.os, long: 1, shirt: C.blanc, dress: C.blanc, legs: C.pellPalida, pants: C.blanc, shoes: C.blanc },
  germanaFosca: { skin: C.pellPalida, hair: C.negre, long: 1, shirt: C.grisClar, dress: C.grisClar, legs: C.pellPalida, pants: C.grisClar, shoes: C.grisClar },
  mina: { skin: C.pell, hair: C.marroFosc, bun: 1, shirt: C.os, jacket: C.verd, dress: C.verd, legs: C.fosc, pants: C.verd, shoes: C.negre },
  lucy: { skin: C.pellPalida, hair: C.or, long: 1, shirt: C.blanc, dress: C.blanc, legs: C.pellPalida, pants: C.blanc, shoes: C.blanc },
  vanHelsing: { skin: C.pell, hair: C.grisClar, beard: C.grisClar, glasses: C.negre, shirt: C.os, jacket: C.marroFosc, pants: C.fosc, shoes: C.negre },
  arthur: { skin: C.pell, hair: C.or, shirt: C.os, jacket: C.negre, pants: C.negre, shoes: C.negre },
  quincey: { skin: C.pellMorena, hair: C.marro, hat: C.marro, shirt: C.os, vest: C.marroFosc, pants: C.marroFosc, shoes: C.marroFosc },
  seward: { skin: C.pell, hair: C.marroFosc, shirt: C.os, jacket: C.gris, pants: C.fosc, shoes: C.negre },
  renfield: { skin: C.pellPalida, hair: null, shirt: C.grisClar, stripes: C.gris, pants: C.gris, shoes: C.fosc },
  hostaler: { skin: C.pellMorena, hair: C.negre, beard: C.negre, shirt: C.os, apron: C.grisClar, pants: C.marroFosc, shoes: C.negre },
  hostalera: { skin: C.pell, hair: C.gris, bun: 1, shirt: C.sang, apron: C.os, dress: C.moratFosc, legs: C.fosc, pants: C.moratFosc, shoes: C.negre },
  cotxer: { skin: C.pellMorena, hair: C.negre, hat: C.negre, shirt: C.sang, vest: C.negre, pants: C.marroFosc, shoes: C.negre },
  pagesa: { skin: C.pell, hair: C.marroFosc, long: 1, shirt: C.os, apron: C.sang, dress: C.marroFosc, legs: C.fosc, pants: C.marroFosc, shoes: C.negre },
  monja: { skin: C.pell, hair: C.negre, helmet: C.negre, shirt: C.negre, apron: C.blanc, dress: C.negre, legs: C.negre, pants: C.negre, shoes: C.negre },
  mariner: { skin: C.pellMorena, hair: C.grisClar, cap: C.blauFosc, beard: C.grisClar, shirt: C.blauFosc, pants: C.fosc, shoes: C.negre },
  swales: { skin: C.pell, hair: C.blanc, beard: C.blanc, hat: C.fosc, shirt: C.grisClar, jacket: C.marroFosc, pants: C.fosc, shoes: C.negre },
  senyora: { skin: C.pellPalida, hair: C.grisClar, bun: 1, shirt: C.morat, dress: C.moratFosc, legs: C.fosc, pants: C.moratFosc, shoes: C.negre },
  zelador: { skin: C.pell, hair: C.marro, cap: C.gris, shirt: C.blanc, pants: C.gris, shoes: C.negre },
  policia: { skin: C.pell, hair: C.marro, helmet: C.blauFosc, beard: C.marro, shirt: C.blauFosc, jacket: C.blauFosc, pants: C.blauFosc, shoes: C.negre },
  obrer: { skin: C.pellMorena, hair: C.marroFosc, cap: C.marroFosc, shirt: C.grisClar, vest: C.marroFosc, pants: C.marroFosc, shoes: C.negre },
  senyor: { skin: C.pell, hair: C.gris, hat: C.negre, shirt: C.os, jacket: C.fosc, pants: C.fosc, shoes: C.negre },
  gitano: { skin: C.pellMorena, hair: C.negre, hat: C.marroFosc, beard: C.negre, shirt: C.sang, vest: C.negre, pants: C.marroFosc, shoes: C.marroFosc },
  guardia: { skin: C.pellMorena, hair: C.gris, cap: C.verd, beard: C.gris, shirt: C.verd, jacket: C.verd, pants: C.verdClar, shoes: C.negre },
};

// Un fotograma d'un personatge com a imatge sola (per als que són objectes): 0 de costat, 4 de cara, 8 d'esquena
export function figura(look, frame = 4, flip = false) {
  const sheet = characterSheet(look), c = new Canvas(FRAME_W, FRAME_H);
  const sx = (frame % 4) * FRAME_W, sy = Math.floor(frame / 4) * FRAME_H;
  for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) {
    const p = sheet.get(sx + x, sy + y);
    if (p[3]) c.px(flip ? FRAME_W - 1 - x : x, y, p);
  }
  return c;
}
// Diverses figures de costat (per a grups com les germanes)
export function grup(figures, gap = 2) {
  const c = new Canvas(figures.reduce((n, f) => n + f.w + gap, -gap), Math.max(...figures.map((f) => f.h)));
  let x = 0;
  for (const f of figures) { c.draw(f, x, c.h - f.h); x += f.w + gap; }
  return c;
}
// Una figura estirada (dormint, morta)
export function estirada(look) {
  const f = figura(look, 4), c = new Canvas(FRAME_H, FRAME_W);
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const p = f.get(x, y); if (p[3]) c.px(y, FRAME_W - 1 - x, p); }
  return c;
}

/* ---------- Música ---------- */

// Totes en tonalitats menors i lentes; la persecució més ràpida
export const MUSICA = {
  dracula: () => song(66, [
    { wave: "square", vol: 0.11, decay: 0.6, notes: "D4:2 F4:1 E4:1 D4:2 C#4:2 D4:2 A3:2 Bb3:2 A3:2 G3:1 F3:1 E3:1 G3:1 A3:4 D4:2 F4:1 A4:1 Bb4:2 A4:2 G4:1 F4:1 E4:2 D4:4" },
    { wave: "triangle", vol: 0.22, decay: 0.2, notes: "D2:4 D2:4 Bb1:4 A1:4 D2:4 G1:4 A1:4 D2:4" },
    { wave: "sine", vol: 0.08, decay: 0.1, notes: "A3:8 G3:8 F3:8 A3:8" },
  ]),
  transilvania: () => song(84, [
    { wave: "pulse", vol: 0.09, decay: 1.2, notes: "A3:1 C4:1 E4:1 D#4:1 E4:2 -:1 E4:1 F4:1 E4:1 D4:1 C4:1 B3:2 -:2 A3:1 C4:1 E4:1 A4:1 G#4:2 E4:2 F4:1 E4:1 D4:1 B3:1 A3:4" },
    { wave: "triangle", vol: 0.2, decay: 0.3, notes: "A1:4 A1:4 E2:4 E2:4 A1:4 A1:4 D2:4 E2:4" },
  ]),
  whitby: () => song(76, [
    { wave: "pulse", vol: 0.1, decay: 1.4, notes: "E4:1 G4:1 B4:2 A4:1 G4:1 F#4:2 E4:1 F#4:1 G4:2 D4:2 -:1 C4:1 B3:1 C4:1 E4:2 D4:1 B3:1 E4:4" },
    { wave: "triangle", vol: 0.2, decay: 0.3, notes: "E2:2 B2:2 E2:2 D2:2 C2:2 G2:2 B1:2 B1:2 A1:2 E2:2 B1:2 E2:2" },
  ]),
  londres: () => song(96, [
    { wave: "square", vol: 0.08, decay: 2, notes: "C4:1 C4:1 Eb4:1 C4:1 G4:1 F#4:1 G4:2 C4:1 C4:1 Eb4:1 C4:1 Ab4:1 G4:1 F4:2 Eb4:1 D4:1 C4:1 B3:1 C4:4" },
    { wave: "triangle", vol: 0.22, decay: 0.3, notes: "C2:2 G1:2 C2:2 G1:2 Ab1:2 Eb2:2 G1:2 G1:2" },
  ], 2),
  persecucio: () => song(132, [
    { wave: "pulse", vol: 0.1, decay: 2.5, notes: "D4:0.5 D4:0.5 F4:0.5 D4:0.5 A4:1 G#4:1 D4:0.5 D4:0.5 F4:0.5 D4:0.5 Bb4:1 A4:1 G4:0.5 F4:0.5 E4:0.5 D4:0.5 C#4:1 E4:1 D4:2 -:2" },
    { wave: "triangle", vol: 0.24, decay: 0.5, notes: "D2:1 D2:1 D2:1 D2:1 Bb1:1 Bb1:1 Bb1:1 Bb1:1 G1:1 G1:1 A1:1 A1:1 D2:2 A1:2" },
  ], 3),
  final: () => song(60, [
    { wave: "sine", vol: 0.16, decay: 0.3, notes: "A3:2 C4:2 E4:4 D4:2 C4:2 B3:4 A3:2 B3:2 C4:2 E4:2 A4:8" },
    { wave: "triangle", vol: 0.2, decay: 0.15, notes: "A1:8 G1:8 F1:8 E1:4 A1:4" },
  ]),
  // Efectes
  udol: () => song(60, [{ wave: "sine", vol: 0.22, decay: 0.4, notes: "A4:0.5 C5:1 D5:1.5 C5:1 A4:1" }]),
  campana: () => song(60, [{ wave: "triangle", vol: 0.3, decay: 1.2, notes: "D3:2 D3:2" }]),
  ensurt: () => song(120, [{ wave: "square", vol: 0.16, decay: 3, notes: "C#5:0.25 C5:0.25 B4:0.25 Bb4:0.25 A4:1" }, { wave: "square", vol: 0.12, decay: 3, notes: "G4:0.25 F#4:0.25 F4:0.25 E4:0.25 Eb4:1" }]),
  descobert: () => song(90, [{ wave: "pulse", vol: 0.16, decay: 2, notes: "D4:0.5 F4:0.5 A4:0.5 D5:1.5" }]),
};
