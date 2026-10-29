import { test } from "node:test";
import assert from "node:assert/strict";
import * as ops from "../public/js/paint/image-ops.js";
import { PALETTES } from "../public/js/paint/palettes.js";

const RED = [255, 0, 0, 255], BLUE = [0, 0, 255, 255], CLEAR = [0, 0, 0, 0];
const fill = (w, h, c) => { const img = ops.blank(w, h); ops.fillRect(img, 0, 0, w, h, c); return img; };

test("paletes: tots els colors són hexadecimals vàlids i els noms no es repeteixen", () => {
  assert.equal(new Set(PALETTES.map((p) => p.id)).size, PALETTES.length);
  for (const p of PALETTES) for (const c of p.colors) assert.match(c, /^#[0-9a-f]{6}$/, `${p.id}: ${c}`);
  assert.equal(PALETTES.find((p) => p.id === "pico8").colors.length, 16);
  assert.equal(PALETTES.find((p) => p.id === "db32").colors.length, 32);
  assert.equal(PALETTES.find((p) => p.id === "endesga32").colors.length, 32);
});

test("pot de pintura: omple el que es toca, o tots els del mateix color", () => {
  // Una paret vertical al mig separa dues zones transparents
  const img = ops.blank(5, 3);
  for (let y = 0; y < 3; y++) ops.setPixel(img, 2, y, BLUE);
  assert.equal(ops.floodFill(img, 0, 0, RED), 6);
  assert.deepEqual(ops.getPixel(img, 1, 2), RED);
  assert.deepEqual(ops.getPixel(img, 4, 0), CLEAR);
  assert.equal(ops.floodFill(img, 0, 0, RED), 0, "ja és d'aquest color: no canvia res");
  const img2 = ops.blank(5, 3);
  for (let y = 0; y < 3; y++) ops.setPixel(img2, 2, y, BLUE);
  assert.equal(ops.floodFill(img2, 0, 0, RED, { contiguous: false }), 12);
  // Amb tolerància, també els colors semblants
  const grad = ops.blank(3, 1);
  [[100, 0, 0, 255], [110, 0, 0, 255], [200, 0, 0, 255]].forEach((c, x) => ops.setPixel(grad, x, 0, c));
  assert.equal(ops.floodFill(grad, 0, 0, BLUE, { tolerance: 20 }), 2);
});

test("línies i figures", () => {
  assert.deepEqual(ops.linePoints(0, 0, 3, 0), [[0, 0], [1, 0], [2, 0], [3, 0]]);
  assert.equal(ops.linePoints(0, 0, 4, 4).length, 5);
  assert.equal(ops.shapePoints("rect", 0, 0, 3, 2, true).length, 12);
  assert.equal(ops.shapePoints("rect", 3, 2, 0, 0, false).length, 10, "la vora d'un 4×3, i l'ordre dels extrems no importa");
  const circle = ops.shapePoints("ellipse", 0, 0, 8, 8, true);
  const ring = ops.shapePoints("ellipse", 0, 0, 8, 8, false);
  assert.ok(ring.length < circle.length && circle.length < 81);
  assert.ok(circle.some(([x, y]) => x === 4 && y === 0) && !circle.some(([x, y]) => x === 0 && y === 0), "toca les vores però no les cantonades");
});

test("canviar de mida: el mètode dominant no barreja colors i la mitjana sí", () => {
  // Un 2×2 amb tres vermells i un blau
  const img = fill(2, 2, RED);
  ops.setPixel(img, 1, 1, BLUE);
  assert.deepEqual(ops.getPixel(ops.resample(img, 1, 1, "dominant"), 0, 0), RED);
  const avg = ops.getPixel(ops.resample(img, 1, 1, "average"), 0, 0);
  assert.ok(avg[0] > 150 && avg[2] > 50, `${avg}`);
  // La transparència no enfosqueix: mig vermell i mig transparent és vermell mig transparent
  const half = ops.blank(2, 1);
  ops.setPixel(half, 0, 0, RED);
  const h = ops.getPixel(ops.resample(half, 1, 1, "average"), 0, 0);
  assert.deepEqual(h.slice(0, 3), [255, 0, 0]);
  assert.ok(Math.abs(h[3] - 128) <= 1);
  // Ampliar amb el més proper repeteix els píxels
  const big = ops.resample(img, 4, 4, "nearest");
  assert.deepEqual(ops.getPixel(big, 3, 3), BLUE);
  assert.deepEqual(ops.getPixel(big, 1, 1), RED);
});

test("llenç, retall, mirall i gir", () => {
  const img = ops.blank(3, 2);
  ops.setPixel(img, 0, 0, RED);
  const bigger = ops.resizeCanvas(img, 5, 4, 0.5, 0.5);
  assert.deepEqual([bigger.width, bigger.height], [5, 4]);
  assert.deepEqual(ops.getPixel(bigger, 1, 1), RED);
  assert.deepEqual(ops.getPixel(ops.crop(bigger, 1, 1, 2, 2), 0, 0), RED);
  assert.deepEqual(ops.getPixel(ops.flip(img, true), 2, 0), RED);
  assert.deepEqual(ops.getPixel(ops.flip(img, false), 0, 1), RED);
  const r = ops.rotate(img, true);
  assert.deepEqual([r.width, r.height], [2, 3]);
  assert.deepEqual(ops.getPixel(r, 1, 0), RED);
  assert.deepEqual(ops.getPixel(ops.rotate(r, false), 0, 0), RED, "girar i desgirar torna on era");
});

test("treure el fons i posar contorn", () => {
  const img = fill(5, 5, [255, 255, 255, 255]);
  ops.setPixel(img, 2, 2, RED);
  const cut = ops.removeBackground(img);
  assert.equal(ops.getPixel(cut, 0, 0)[3], 0);
  assert.deepEqual(ops.getPixel(cut, 2, 2), RED);
  const out = ops.outline(cut, BLUE);
  assert.deepEqual(ops.getPixel(out, 2, 1), BLUE);
  assert.equal(ops.getPixel(out, 1, 1)[3], 0, "sense diagonals");
  assert.deepEqual(ops.getPixel(ops.outline(cut, BLUE, true), 1, 1), BLUE);
});

test("paleta: tria els colors de la imatge i hi ajusta cada píxel, amb tramat o sense", () => {
  // Un degradat de negre a blanc
  const grad = ops.blank(64, 8);
  for (let x = 0; x < 64; x++) for (let y = 0; y < 8; y++) ops.setPixel(grad, x, y, [x * 4, x * 4, x * 4, 255]);
  const pal = ops.choosePalette(grad, 4);
  assert.equal(pal.length, 4);
  for (const dither of ["none", "floyd", "atkinson", "bayer2", "bayer4", "bayer8"]) {
    const img = ops.applyPalette(ops.clone(grad), pal, { dither });
    const used = ops.uniqueColors(img, 10);
    assert.ok(used && used.length <= 4, `${dither}: ${used?.length}`);
  }
  // Amb tramat, una zona de gris mitjà amb només blanc i negre queda barrejada a parts iguals
  const gray = fill(16, 16, [128, 128, 128, 255]);
  const bw = [[0, 0, 0], [255, 255, 255]];
  const flat = ops.uniqueColors(ops.applyPalette(ops.clone(gray), bw), 4);
  assert.equal(flat.length, 1, "sense tramat, tot d'un sol color");
  const dithered = ops.applyPalette(ops.clone(gray), bw, { dither: "bayer4" });
  let white = 0;
  for (let i = 0; i < dithered.data.length; i += 4) if (dithered.data[i] === 255) white++;
  assert.ok(Math.abs(white - 128) <= 16, `blancs: ${white}`);
  // Si la imatge ja té pocs colors, la paleta són exactament aquests
  assert.deepEqual(ops.choosePalette(fill(4, 4, RED), 8), [[255, 0, 0]]);
});

test("pixelar: tot el procés", () => {
  // Una «foto» de 200×100: un cercle vermell sobre fons blanc, amb vores suaus
  const src = ops.blank(200, 100);
  for (let y = 0; y < 100; y++) for (let x = 0; x < 200; x++) {
    const d = Math.hypot(x - 100, y - 50);
    const t = Math.max(0, Math.min(1, d - 30));
    ops.setPixel(src, x, y, [255, 255 * t, 255 * t, 255]);
  }
  const { image, palette } = ops.pixelate(src, { width: 40, height: 20, colors: 4, removeBg: true, outlineColor: [0, 0, 0, 255], method: "dominant" });
  assert.deepEqual([image.width, image.height], [40, 20]);
  assert.ok(palette.length <= 4);
  assert.equal(ops.getPixel(image, 0, 0)[3], 0, "el fons ha quedat transparent");
  assert.equal(ops.getPixel(image, 20, 10)[0], 255, "el centre és vermell");
  for (let i = 3; i < image.data.length; i += 4) assert.ok(image.data[i] === 0 || image.data[i] === 255, "sense mitges transparències");
  // Mantenint la mida, el resultat té la mida original però fet de blocs de 5×5
  const blocks = ops.pixelate(src, { width: 40, height: 20, keepSize: true }).image;
  assert.deepEqual([blocks.width, blocks.height], [200, 100]);
  assert.deepEqual(ops.getPixel(blocks, 0, 0), ops.getPixel(blocks, 4, 4));
});

test("enganxar barreja la transparència i «replace» la copia tal qual", () => {
  const dst = fill(2, 1, RED);
  const src = ops.blank(2, 1);
  ops.setPixel(src, 1, 0, BLUE);
  ops.paste(dst, src, 0, 0);
  assert.deepEqual(ops.getPixel(dst, 0, 0), RED);
  assert.deepEqual(ops.getPixel(dst, 1, 0), BLUE);
  ops.paste(dst, src, 0, 0, true);
  assert.deepEqual(ops.getPixel(dst, 0, 0), CLEAR);
});
