// Operacions sobre imatges de píxels per a l'editor de dibuix: emplenar, figures, canviar de mida i els filtres
// per pixelar (reduir colors, tramats, contorns…). Treballen amb objectes { width, height, data } amb els
// píxels en RGBA (com un ImageData), sense dependre del navegador, perquè es puguin provar amb Node.

export const blank = (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) });
export const clone = (img) => ({ width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) });
const clampByte = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

export function hexToRgba(hex) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
export const rgbToHex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

export function getPixel(img, x, y) {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}
export function setPixel(img, x, y, c) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  img.data.set(c, (y * img.width + x) * 4);
}

/* ---------- Figures ---------- */

export function fillRect(img, x, y, w, h, c) {
  const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(img.width, x + w), y1 = Math.min(img.height, y + h);
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) img.data.set(c, (yy * img.width + xx) * 4);
}

// Els punts d'una línia de píxels (Bresenham), extrems inclosos
export function linePoints(x0, y0, x1, y1) {
  const pts = [];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    pts.push([x0, y0]);
    if (x0 === x1 && y0 === y1) return pts;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Els punts d'un rectangle o d'una el·lipse inscrita en el requadre de (x0, y0) a (x1, y1), plena o només la vora
export function shapePoints(kind, x0, y0, x1, y1, filled) {
  const left = Math.min(x0, x1), right = Math.max(x0, x1), top = Math.min(y0, y1), bottom = Math.max(y0, y1);
  const w = right - left + 1, h = bottom - top + 1;
  const inside = kind === "rect"
    ? () => true
    : (x, y) => {
      const nx = (x - left + 0.5) / w * 2 - 1, ny = (y - top + 0.5) / h * 2 - 1;
      return nx * nx + ny * ny <= 1 + 0.5 / Math.max(w, h);
    };
  const pts = [];
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (!inside(x, y)) continue;
      // La vora: els punts de dins que toquen un punt de fora (o el límit del requadre)
      const edge = x === left || x === right || y === top || y === bottom ||
        !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      if (filled || edge) pts.push([x, y]);
    }
  }
  return pts;
}

/* ---------- Emplenar ---------- */

// Pinta amb «color» els píxels semblants al de (x, y): els que s'hi toquen o, si no és «contiguous», tots els de la imatge.
// «tolerance» (0–255) és quant pot variar cada canal. Torna quants píxels ha canviat.
export function floodFill(img, x, y, color, { tolerance = 0, contiguous = true } = {}) {
  const { width: w, height: h, data } = img;
  if (x < 0 || y < 0 || x >= w || y >= h) return 0;
  const t = data.slice((y * w + x) * 4, (y * w + x) * 4 + 4);
  const matches = (i) => {
    if (data[i + 3] === 0 && t[3] === 0) return true;   // el transparent és transparent, sigui del color que sigui
    return Math.abs(data[i] - t[0]) <= tolerance && Math.abs(data[i + 1] - t[1]) <= tolerance &&
      Math.abs(data[i + 2] - t[2]) <= tolerance && Math.abs(data[i + 3] - t[3]) <= tolerance;
  };
  let changed = 0;
  const paint = (p) => {
    const i = p * 4;
    if (data[i] === color[0] && data[i + 1] === color[1] && data[i + 2] === color[2] && data[i + 3] === color[3]) return;
    data.set(color, i);
    changed++;
  };
  if (!contiguous) {
    const hits = [];
    for (let p = 0; p < w * h; p++) if (matches(p * 4)) hits.push(p);
    hits.forEach(paint);
    return changed;
  }
  const seen = new Uint8Array(w * h);
  const stack = [y * w + x];
  seen[y * w + x] = 1;
  while (stack.length) {
    const p = stack.pop();
    paint(p);
    const px = p % w, py = (p - px) / w;
    for (const [nx, ny] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const q = ny * w + nx;
      if (seen[q] || !matches(q * 4)) continue;
      seen[q] = 1;
      stack.push(q);
    }
  }
  return changed;
}

// Fa transparent el fons: el color de les cantonades i el que s'hi toca
export function removeBackground(img, tolerance = 24) {
  const out = clone(img);
  const { width: w, height: h } = out;
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    if (getPixel(out, x, y)[3] > 0) floodFill(out, x, y, [0, 0, 0, 0], { tolerance });
  }
  return out;
}

/* ---------- Mida i orientació ---------- */

// Canvia la mida de la imatge.
//   "nearest": el píxel més proper (per ampliar sense difuminar);
//   "average": la mitjana de cada bloc (per reduir fotos: suau i fidel);
//   "dominant": el color que més surt a cada bloc (per reduir dibuixos: vores netes, sense colors barrejats).
export function resample(img, width, height, method = "average") {
  const out = blank(width, height);
  const sw = img.width, sh = img.height, src = img.data, dst = out.data;
  for (let y = 0; y < height; y++) {
    let y0 = Math.floor(y * sh / height), y1 = Math.floor((y + 1) * sh / height);
    if (method === "nearest" || y1 <= y0) { y0 = Math.min(sh - 1, Math.floor((y + 0.5) * sh / height)); y1 = y0 + 1; }
    for (let x = 0; x < width; x++) {
      let x0 = Math.floor(x * sw / width), x1 = Math.floor((x + 1) * sw / width);
      if (method === "nearest" || x1 <= x0) { x0 = Math.min(sw - 1, Math.floor((x + 0.5) * sw / width)); x1 = x0 + 1; }
      const o = (y * width + x) * 4;
      if (x1 - x0 === 1 && y1 - y0 === 1) {
        dst.set(src.subarray((y0 * sw + x0) * 4, (y0 * sw + x0) * 4 + 4), o);
        continue;
      }
      if (method === "dominant") {
        // Es compten els colors arrodonits (32 nivells per canal) i es fa la mitjana dels del grup més nombrós
        const groups = new Map();
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
          const i = (yy * sw + xx) * 4;
          const key = src[i + 3] < 128 ? -1 : ((src[i] >> 3) << 10) | ((src[i + 1] >> 3) << 5) | (src[i + 2] >> 3);
          let g = groups.get(key);
          if (!g) groups.set(key, (g = [0, 0, 0, 0, 0]));
          g[0] += src[i]; g[1] += src[i + 1]; g[2] += src[i + 2]; g[3] += src[i + 3]; g[4]++;
        }
        let best = null;
        for (const g of groups.values()) if (!best || g[4] > best[4]) best = g;
        dst[o] = best[0] / best[4]; dst[o + 1] = best[1] / best[4]; dst[o + 2] = best[2] / best[4]; dst[o + 3] = best[3] / best[4];
        continue;
      }
      // Mitjana ponderada per l'opacitat, perquè els píxels transparents no enfosqueixin les vores
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        const i = (yy * sw + xx) * 4, al = src[i + 3];
        r += src[i] * al; g += src[i + 1] * al; b += src[i + 2] * al; a += al; n++;
      }
      if (a > 0) { dst[o] = r / a; dst[o + 1] = g / a; dst[o + 2] = b / a; }
      dst[o + 3] = a / n;
    }
  }
  return out;
}

// Canvia la mida del llenç sense escalar el dibuix; «ax» i «ay» (0–1) diuen cap on queda ancorat
export function resizeCanvas(img, width, height, ax = 0.5, ay = 0.5) {
  const out = blank(width, height);
  return paste(out, img, Math.round((width - img.width) * ax), Math.round((height - img.height) * ay), true);
}

// Copia «src» a sobre de «dst» a la posició (x, y). Amb «replace», els píxels transparents també es copien.
export function paste(dst, src, x, y, replace = false) {
  for (let sy = 0; sy < src.height; sy++) {
    const dy = y + sy;
    if (dy < 0 || dy >= dst.height) continue;
    for (let sx = 0; sx < src.width; sx++) {
      const dx = x + sx;
      if (dx < 0 || dx >= dst.width) continue;
      const i = (sy * src.width + sx) * 4, o = (dy * dst.width + dx) * 4, a = src.data[i + 3];
      if (replace || a === 255) dst.data.set(src.data.subarray(i, i + 4), o);
      else if (a > 0) {
        // Barreja normal (la font per sobre)
        const da = dst.data[o + 3] / 255, sa = a / 255, oa = sa + da * (1 - sa);
        for (let c = 0; c < 3; c++) dst.data[o + c] = (src.data[i + c] * sa + dst.data[o + c] * da * (1 - sa)) / oa;
        dst.data[o + 3] = oa * 255;
      }
    }
  }
  return dst;
}

export function crop(img, x, y, width, height) {
  const out = blank(width, height);
  return paste(out, img, -x, -y, true);
}

export function flip(img, horizontal = true) {
  const out = blank(img.width, img.height);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const sx = horizontal ? img.width - 1 - x : x, sy = horizontal ? y : img.height - 1 - y;
    out.data.set(img.data.subarray((sy * img.width + sx) * 4, (sy * img.width + sx) * 4 + 4), (y * img.width + x) * 4);
  }
  return out;
}

// Gira un quart de volta: en el sentit del rellotge o al contrari
export function rotate(img, clockwise = true) {
  const out = blank(img.height, img.width);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const nx = clockwise ? img.height - 1 - y : y, ny = clockwise ? x : img.width - 1 - x;
    out.data.set(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4), (ny * out.width + nx) * 4);
  }
  return out;
}

/* ---------- Colors ---------- */

// Brillantor, contrast i saturació, de -100 a 100 (0 no canvia res)
export function adjust(img, { brightness = 0, contrast = 0, saturation = 0 } = {}) {
  if (!brightness && !contrast && !saturation) return img;
  const d = img.data, b = brightness * 2.55, c = (100 + contrast) / 100, s = 1 + saturation / 100;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], bl = d[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * bl;
    r = l + (r - l) * s; g = l + (g - l) * s; bl = l + (bl - l) * s;
    d[i] = clampByte((r - 128) * c + 128 + b);
    d[i + 1] = clampByte((g - 128) * c + 128 + b);
    d[i + 2] = clampByte((bl - 128) * c + 128 + b);
  }
  return img;
}

// Cada píxel queda o del tot opac o del tot transparent: el pixel art no té mitges transparències
export function thresholdAlpha(img, threshold = 128) {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= threshold ? 255 : 0;
  return img;
}

// Distància entre colors que s'acosta a com els veiem («redmean»): el verd pesa més que el blau
function distance(r1, g1, b1, r2, g2, b2) {
  const rm = (r1 + r2) / 2, dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

function nearestIndex(palette, r, g, b) {
  let best = 0, bestD = Infinity;
  for (let k = 0; k < palette.length; k++) {
    const p = palette[k], dd = distance(r, g, b, p[0], p[1], p[2]);
    if (dd < bestD) { bestD = dd; best = k; }
  }
  return best;
}

// Els colors opacs de la imatge (com a molt «limit» mostres repartides), per triar-ne la paleta
function samples(img, limit = 40000) {
  const d = img.data, n = img.width * img.height, step = Math.max(1, Math.floor(n / limit)), out = [];
  for (let p = 0; p < n; p += step) if (d[p * 4 + 3] >= 128) out.push([d[p * 4], d[p * 4 + 1], d[p * 4 + 2]]);
  return out;
}

// Els colors diferents (opacs) d'una imatge, els més freqüents primer; null si n'hi ha més de «max»
export function uniqueColors(img, max = 256) {
  const counts = new Map(), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (counts.size > max) return null;
  }
  return [...counts].sort((a, b) => b[1] - a[1]).map(([k]) => [(k >> 16) & 255, (k >> 8) & 255, k & 255]);
}

// Tria una paleta de «k» colors que representi bé la imatge: tall per la mediana i uns quants passos de k-mitjanes
export function choosePalette(img, k) {
  const exact = uniqueColors(img, k);
  if (exact) return exact;
  const pts = samples(img);
  if (!pts.length) return [];
  let boxes = [pts];
  while (boxes.length < k) {
    // Es parteix la caixa amb més varietat de colors, pel canal on varia més
    let bi = -1, bestRange = 0, bestCh = 0;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      for (let ch = 0; ch < 3; ch++) {
        let lo = 255, hi = 0;
        for (const p of box) { if (p[ch] < lo) lo = p[ch]; if (p[ch] > hi) hi = p[ch]; }
        const range = (hi - lo) * Math.sqrt(box.length);
        if (range > bestRange) { bestRange = range; bi = i; bestCh = ch; }
      }
    });
    if (bi < 0) break;
    const box = boxes[bi].sort((a, b) => a[bestCh] - b[bestCh]), mid = box.length >> 1;
    boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid));
  }
  let pal = boxes.map((box) => [0, 1, 2].map((ch) => box.reduce((s, p) => s + p[ch], 0) / box.length));
  for (let iter = 0; iter < 5; iter++) {
    const sums = pal.map(() => [0, 0, 0, 0]);
    for (const p of pts) {
      const s = sums[nearestIndex(pal, p[0], p[1], p[2])];
      s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    pal = pal.map((c, i) => (sums[i][3] ? [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]] : c));
  }
  return pal.map((c) => c.map(Math.round));
}

const BAYER = {
  2: [[0, 2], [3, 1]],
  4: [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]],
};
BAYER[8] = Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) =>
  4 * BAYER[4][y % 4][x % 4] + BAYER[2][Math.floor(y / 4)][Math.floor(x / 4)]));

// Errors que es reparteixen als veïns: [dx, dy, pes]
const DIFFUSION = {
  floyd: { div: 16, taps: [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]] },
  atkinson: { div: 8, taps: [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]] },
};

// Passa cada píxel opac al color més proper de la paleta, amb tramat si cal:
//   "none", "floyd" (Floyd–Steinberg), "atkinson" (més contrast, com els Mac antics) o "bayer2" / "bayer4" / "bayer8" (ordenat, en quadrícula).
// «amount» (0–1) és la força del tramat.
export function applyPalette(img, palette, { dither = "none", amount = 1 } = {}) {
  if (!palette.length) return img;
  const { width: w, height: h, data: d } = img;
  const cache = new Map();
  const nearest = (r, g, b) => {
    const key = (clampByte(Math.round(r)) << 16) | (clampByte(Math.round(g)) << 8) | clampByte(Math.round(b));
    let k = cache.get(key);
    if (k === undefined) cache.set(key, (k = nearestIndex(palette, r, g, b)));
    return palette[k];
  };
  const diffusion = DIFFUSION[dither];
  if (diffusion) {
    const err = new Float32Array(w * h * 3);
    for (let y = 0; y < h; y++) {
      // En ziga-zaga, perquè l'error no arrossegui sempre cap al mateix costat
      const rtl = dither === "floyd" && y % 2 === 1;
      for (let i = 0; i < w; i++) {
        const x = rtl ? w - 1 - i : i, p = y * w + x;
        if (d[p * 4 + 3] < 128) continue;
        const r = clampByte(d[p * 4] + err[p * 3]), g = clampByte(d[p * 4 + 1] + err[p * 3 + 1]), b = clampByte(d[p * 4 + 2] + err[p * 3 + 2]);
        const c = nearest(r, g, b);
        d[p * 4] = c[0]; d[p * 4 + 1] = c[1]; d[p * 4 + 2] = c[2];
        const er = (r - c[0]) * amount, eg = (g - c[1]) * amount, eb = (b - c[2]) * amount;
        for (const [dx, dy, wt] of diffusion.taps) {
          const nx = x + (rtl ? -dx : dx), ny = y + dy;
          if (nx < 0 || nx >= w || ny >= h) continue;
          const q = (ny * w + nx) * 3, f = wt / diffusion.div;
          err[q] += er * f; err[q + 1] += eg * f; err[q + 2] += eb * f;
        }
      }
    }
    return img;
  }
  const matrix = BAYER[dither.replace("bayer", "")] ?? null;
  // L'amplitud del tramat ordenat depèn de com de separats són els colors de la paleta
  const spread = matrix ? (255 / Math.max(1, Math.cbrt(palette.length))) * amount : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 4;
    if (d[p + 3] < 128) continue;
    const off = matrix ? ((matrix[y % matrix.length][x % matrix.length] + 0.5) / (matrix.length ** 2) - 0.5) * spread : 0;
    const c = nearest(d[p] + off, d[p + 1] + off, d[p + 2] + off);
    d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
  }
  return img;
}

// Una vora d'un píxel al voltant del dibuix (als píxels transparents que toquen un d'opac)
export function outline(img, color, diagonals = false) {
  const out = clone(img), { width: w, height: h, data: d } = img;
  const opaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] >= 128;
  const near = diagonals
    ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]
    : [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (opaque(x, y)) continue;
    if (near.some(([dx, dy]) => opaque(x + dx, y + dy))) out.data.set(color, (y * w + x) * 4);
  }
  return out;
}

/* ---------- Pixelar ---------- */

// Tot el procés per convertir una imatge (una foto, un dibuix gran) en pixel art:
//   1. treu el fons, si cal;  2. redueix a «width» × «height» amb el mètode triat;
//   3. ajusta brillantor, contrast i saturació;  4. deixa la transparència en tot o res;
//   5. redueix els colors a una paleta fixa o a «colors» triats de la imatge, amb tramat;
//   6. hi posa contorn;  7. si «keepSize», torna a la mida original fent blocs.
// Torna { image, palette }.
export function pixelate(src, opts = {}) {
  const {
    width = src.width, height = src.height, method = "average", keepSize = false,
    brightness = 0, contrast = 0, saturation = 0,
    palette = null, colors = 0, dither = "none", ditherAmount = 1,
    alphaThreshold = 128, removeBg = false, bgTolerance = 24, outlineColor = null,
  } = opts;
  let img = removeBg ? removeBackground(src, bgTolerance) : src;
  img = resample(img, Math.max(1, Math.round(width)), Math.max(1, Math.round(height)), method);
  adjust(img, { brightness, contrast, saturation });
  if (alphaThreshold != null) thresholdAlpha(img, alphaThreshold);
  const pal = palette?.length ? palette : colors > 0 ? choosePalette(img, colors) : null;
  if (pal) applyPalette(img, pal, { dither, amount: ditherAmount });
  if (outlineColor) img = outline(img, outlineColor);
  if (keepSize && (img.width !== src.width || img.height !== src.height)) img = resample(img, src.width, src.height, "nearest");
  return { image: img, palette: pal };
}
