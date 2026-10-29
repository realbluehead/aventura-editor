// Un llenç de píxels en memòria per dibuixar les imatges del joc, i un codificador PNG (amb el zlib de Node).
// Tot el que es dibuixa són píxels sencers, sense suavitzar: és pixel art.
import { deflateSync, crc32 } from "node:zlib";

export function rgba(c) {
  if (Array.isArray(c)) return c.length === 4 ? c : [...c, 255];
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

// Mescla dos colors: t = 0 és «a», t = 1 és «b»
export function mix(a, b, t) {
  const [x, y] = [rgba(a), rgba(b)];
  return [0, 1, 2].map((i) => Math.round(x[i] + (y[i] - x[i]) * t)).concat(255);
}

// Generador de nombres aleatoris amb llavor: el mateix dibuix cada vegada
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

// Lletra de 3×5 píxels per als rètols (només majúscules: les accentuades es dibuixen sense accent)
const GLYPHS = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010",
  P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111", 0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110",
  4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010", 8: "111101111101111",
  9: "111101111001110", ".": "000000000000010", "-": "000000111000000", "'": "010010000000000", "!": "010010010000010",
  ":": "000010000010000", " ": "000000000000000", "·": "000000010000000",
};
const plain = (s) => s.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export class Canvas {
  constructor(w, h, fill = null) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
    if (fill) this.rect(0, 0, w, h, fill);
  }

  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = rgba(c), i = (y * this.w + x) * 4;
    if (a === 255) { this.data.set([r, g, b, 255], i); return; }
    // Transparència: es barreja amb el que hi ha a sota
    const k = a / 255, d = this.data;
    d[i] = d[i] * (1 - k) + r * k; d[i + 1] = d[i + 1] * (1 - k) + g * k; d[i + 2] = d[i + 2] * (1 - k) + b * k;
    d[i + 3] = Math.max(d[i + 3], a);
  }

  get(x, y) {
    const i = (y * this.w + x) * 4;
    return [...this.data.slice(i, i + 4)];
  }

  rect(x, y, w, h, c) {
    for (let j = Math.max(0, Math.round(y)); j < Math.min(this.h, Math.round(y + h)); j++) {
      for (let i = Math.max(0, Math.round(x)); i < Math.min(this.w, Math.round(x + w)); i++) this.px(i, j, c);
    }
  }

  // Tramat de dos colors, com les ombres dels jocs antics
  dither(x, y, w, h, a, b) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, (i + j) % 2 ? a : b);
  }

  // Degradat vertical per franges, amb una línia de tramat a cada canvi
  gradient(x, y, w, h, top, bottom, bands = 8) {
    for (let j = 0; j < h; j++) {
      const t = Math.floor((j / h) * bands) / (bands - 1);
      const next = Math.min(1, t + 1 / (bands - 1));
      const edge = (j / h) * bands % 1 > 0.85;
      for (let i = 0; i < w; i++) this.px(x + i, y + j, edge && (i + j) % 2 ? mix(top, bottom, next) : mix(top, bottom, t));
    }
  }

  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) this.px(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c);
  }

  ellipse(cx, cy, rx, ry, c) {
    for (let j = -ry; j <= ry; j++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j / ry) ** 2)));
      for (let i = -half; i <= half; i++) this.px(cx + i, cy + j, c);
    }
  }

  circle(cx, cy, r, c) { this.ellipse(cx, cy, r, r, c); }

  // Polígon ple (regla parell-senar, per franges horitzontals)
  poly(pts, c) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs = [];
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y + 0.5) !== (yj > y + 0.5)) xs.push(xi + ((y + 0.5 - yi) * (xj - xi)) / (yj - yi));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c);
    }
  }

  // Textura: cada píxel lleugerament més clar o fosc (pedra, sorra, fulles…)
  noise(x, y, w, h, base, amount = 0.15, seed = 7, density = 1) {
    const r = rng(seed);
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (r() > density) continue;
        const t = (r() - 0.5) * 2 * amount;
        this.px(i, j, t > 0 ? mix(base, "#ffffff", t) : mix(base, "#000000", -t));
      }
    }
  }

  text(x, y, str, c, scale = 1) {
    let cx = x;
    for (const ch of plain(str)) {
      const g = GLYPHS[ch] ?? GLYPHS[" "];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === "1") this.rect(cx + i * scale, y + j * scale, scale, scale, c);
      cx += 4 * scale;
    }
  }

  static textWidth(str, scale = 1) { return plain(str).length * 4 * scale - scale; }

  // Copia un altre llenç a sobre (els píxels transparents no tapen res)
  draw(other, x, y) {
    for (let j = 0; j < other.h; j++) {
      for (let i = 0; i < other.w; i++) {
        const p = other.get(i, j);
        if (p[3]) this.px(x + i, y + j, p);
      }
    }
  }

  png() {
    const row = this.w * 4 + 1;
    const raw = Buffer.alloc(row * this.h);
    for (let y = 0; y < this.h; y++) Buffer.from(this.data.buffer, y * this.w * 4, this.w * 4).copy(raw, y * row + 1);
    const chunk = (type, body) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(body.length);
      const tb = Buffer.concat([Buffer.from(type), body]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(tb));
      return Buffer.concat([len, tb, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr.set([8, 6, 0, 0, 0], 8);   // 8 bits, RGBA
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
    ]);
  }
}
