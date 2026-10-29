// Els fons dels 10 escenaris de Barcelona, dibuixats píxel a píxel a 320×200.
// Cada funció torna un Canvas. El terra on es camina és sempre a baix (de y≈150 cap avall).
import { Canvas, mix, rng } from "./pixels.mjs";

const W = 320, H = 200;

/* ---------- Peces que es repeteixen ---------- */

function sky(c, top = "#3d7cc9", bottom = "#bfe3f7", h = 150) {
  c.gradient(0, 0, W, h, top, bottom, 10);
}

function clouds(c, seed = 3, count = 5) {
  const r = rng(seed);
  for (let k = 0; k < count; k++) {
    const x = r() * W, y = 8 + r() * 40, s = 6 + r() * 8;
    for (let b = 0; b < 4; b++) c.ellipse(x + b * s * 0.8, y + (b % 2 ? -2 : 1), s, s * 0.55, b % 2 ? "#ffffff" : "#eef6fb");
  }
}

// Façana de l'Eixample: finestres altes amb balcons de ferro
function building(c, x, y, w, h, { wall = "#d9c3a0", trim = "#b49a72", win = "#3b4b5e", rail = "#2b2b2b", seed = 1, shutters = "#5f7f4f" } = {}) {
  c.rect(x, y, w, h, wall);
  c.noise(x, y, w, h, wall, 0.06, seed, 0.5);
  c.rect(x, y, w, 3, trim);
  c.rect(x, y + h - 4, w, 4, mix(trim, "#000", 0.2));
  const cols = Math.max(1, Math.floor((w - 6) / 14));
  const gap = (w - cols * 8) / (cols + 1);
  for (let row = 0; y + 10 + row * 22 < y + h - 18; row++) {
    for (let k = 0; k < cols; k++) {
      const wx = Math.round(x + gap + k * (8 + gap)), wy = y + 9 + row * 22;
      c.rect(wx - 2, wy - 1, 12, 15, trim);
      c.rect(wx, wy, 8, 13, win);
      c.rect(wx, wy, 8, 2, mix(win, "#fff", 0.3));
      c.rect(wx - 3, wy + 1, 2, 12, shutters);
      c.rect(wx + 9, wy + 1, 2, 12, shutters);
      // balcó de ferro
      c.rect(wx - 3, wy + 13, 14, 1, rail);
      for (let b = wx - 3; b < wx + 11; b += 2) c.px(b, wy + 12, rail);
    }
  }
}

function planeTree(c, x, groundY, h = 70, seed = 5) {
  const r = rng(seed);
  c.rect(x - 2, groundY - h * 0.55, 4, h * 0.55, "#8a7d62");
  c.dither(x - 2, groundY - h * 0.55, 2, h * 0.55, "#a89b7d", "#8a7d62");
  for (let k = 0; k < 9; k++) {
    const bx = x + (r() - 0.5) * h * 0.55, by = groundY - h * 0.6 - r() * h * 0.35, s = 8 + r() * 9;
    c.ellipse(bx, by, s, s * 0.8, k % 3 ? "#4e8a3a" : "#3c7230");
  }
  c.noise(x - h * 0.4, groundY - h, h * 0.8, h * 0.6, "#4e8a3a", 0.12, seed, 0.25);
}

function palm(c, x, groundY, h = 60) {
  for (let k = 0; k < h; k++) c.rect(x + Math.sin(k / 12) * 2, groundY - k, 3, 1, k % 4 ? "#8c6b3f" : "#6d5230");
  const tx = x + Math.sin(h / 12) * 2, ty = groundY - h;
  for (const [dx, dy] of [[-16, 4], [16, 4], [-12, -6], [12, -6], [0, -10], [-18, 10], [18, 10]]) {
    c.line(tx, ty, tx + dx, ty + dy, "#2f7d32");
    c.line(tx, ty + 1, tx + dx, ty + dy + 1, "#3e9a41");
  }
}

function streetLamp(c, x, groundY, h = 46) {
  c.rect(x, groundY - h, 2, h, "#2d3a33");
  c.rect(x - 3, groundY - h - 6, 8, 6, "#2d3a33");
  c.rect(x - 2, groundY - h - 5, 6, 4, "#f7e3a1");
}

// Gent de fons: siluetes petites de colors
function crowd(c, x0, x1, y, seed = 9, n = 10) {
  const r = rng(seed);
  const tops = ["#c0392b", "#2e86c1", "#f1c40f", "#27ae60", "#8e44ad", "#e67e22", "#ecf0f1"];
  for (let k = 0; k < n; k++) {
    const x = x0 + r() * (x1 - x0), t = tops[Math.floor(r() * tops.length)];
    c.rect(x, y - 12, 4, 6, t);
    c.rect(x, y - 6, 4, 6, "#34495e");
    c.rect(x + 1, y - 15, 2, 3, "#e0b48a");
  }
}

function sea(c, y, h, seed = 4, color = "#2a7fb8") {
  c.gradient(0, y, W, h, mix(color, "#fff", 0.15), mix(color, "#001830", 0.4), 6);
  const r = rng(seed);
  for (let k = 0; k < 70; k++) {
    const x = r() * W, yy = y + 2 + r() * (h - 4);
    c.rect(x, yy, 3 + r() * 6, 1, mix(color, "#ffffff", 0.5));
  }
}

// Paviment de rajoles, amb línies de perspectiva
function tiles(c, y, h, a = "#cfc2a8", b = "#bdae92") {
  c.rect(0, y, W, h, a);
  for (let j = y; j < y + h; j += 6) c.rect(0, j, W, 1, b);
  for (let k = -8; k < 30; k++) c.line(160 + (k - 11) * 12, y, 160 + (k - 11) * 30, y + h, b);
}

function sign(c, x, y, text, bg = "#7a1f1f", fg = "#f5e6c8", scale = 1) {
  const w = Canvas.textWidth(text, scale) + 6 * scale;
  c.rect(x, y, w, 9 * scale, mix(bg, "#000", 0.3));
  c.rect(x + 1, y + 1, w - 2, 9 * scale - 2, bg);
  c.text(x + 3 * scale, y + 2 * scale, text, fg, scale);
  return w;
}

/* ---------- Els escenaris ---------- */

// 1. Plaça de Catalunya: la gran font, arbres, edificis i coloms
export function placaCatalunya() {
  const c = new Canvas(W, H);
  sky(c);
  clouds(c, 11, 6);
  building(c, 0, 52, 80, 98, { wall: "#e2d3b6", seed: 2 });
  building(c, 80, 40, 70, 110, { wall: "#cbb594", trim: "#a38a63", seed: 3 });
  // L'edifici gran de la plaça, blanc i modern
  c.rect(150, 36, 110, 114, "#ece9e2");
  for (let y = 44; y < 140; y += 10) c.rect(150, y, 110, 2, "#c9c4b8");
  c.rect(150, 36, 110, 4, "#b8b2a4");
  building(c, 260, 48, 60, 102, { wall: "#d8b98f", seed: 4, shutters: "#7a4a2a" });
  planeTree(c, 30, 150, 80, 21);
  planeTree(c, 292, 150, 76, 22);
  // terra de la plaça
  c.rect(0, 140, W, 60, "#d8cdb6");
  c.noise(0, 140, W, 60, "#d8cdb6", 0.07, 31, 0.6);
  // rosa dels vents al terra
  c.ellipse(160, 178, 40, 12, "#c2b292");
  c.poly([[160, 168], [166, 178], [160, 188], [154, 178]], "#8c7a5a");
  c.poly([[124, 178], [160, 174], [196, 178], [160, 182]], "#a8977a");
  // la font
  c.ellipse(160, 140, 52, 12, "#9aa3a8");
  c.ellipse(160, 138, 48, 9, "#4a90c2");
  c.noise(112, 130, 96, 16, "#4a90c2", 0.2, 33, 0.3);
  for (const [x, hh] of [[140, 22], [152, 34], [160, 42], [168, 34], [180, 22]]) {
    for (let k = 0; k < hh; k++) c.px(x + Math.sin(k) * 0.5, 136 - k, k % 3 ? "#d9f0ff" : "#ffffff");
  }
  // entrada del metro (vermella, amb la M)
  c.rect(52, 128, 30, 22, "#b22222");
  c.rect(54, 130, 26, 18, "#2a2a2a");
  c.poly([[67, 113], [76, 122], [67, 131], [58, 122]], "#d0312d");
  c.text(65, 119, "M", "#ffffff");
  c.text(56, 140, "METRO", "#f2f2f2");
  // banc
  c.rect(220, 150, 40, 3, "#6b4b2a");
  c.rect(220, 145, 40, 2, "#6b4b2a");
  c.rect(222, 153, 2, 6, "#333");
  c.rect(256, 153, 2, 6, "#333");
  // coloms
  const r = rng(77);
  for (let k = 0; k < 14; k++) {
    const x = 100 + r() * 130, y = 158 + r() * 30;
    c.rect(x, y, 4, 2, "#8a8f99");
    c.px(x + 4, y - 1, "#6b7079");
  }
  sign(c, 6, 156, "LA RAMBLA ←", "#2a4d6e");
  sign(c, 252, 186, "PG DE GRACIA →", "#2a4d6e");
  return c;
}

// 2. La Rambla: arbres, quioscos de flors, el mosaic de Miró i els edificis
export function rambla() {
  const c = new Canvas(W, H);
  sky(c, "#4a86cf", "#cfe8f5");
  building(c, 0, 30, 90, 120, { wall: "#e6d2ad", seed: 11 });
  building(c, 230, 26, 90, 124, { wall: "#d4b58a", trim: "#a68558", seed: 12 });
  // façana del mercat, a l'esquerra, amb l'arc de ferro
  c.rect(26, 74, 66, 76, "#3c4a3a");
  c.ellipse(59, 86, 33, 20, "#5a7a4f");
  c.ellipse(59, 86, 28, 15, "#b9473c");
  c.ellipse(59, 86, 22, 10, "#e3b04b");
  c.rect(34, 90, 50, 60, "#2b2018");
  c.rect(26, 96, 66, 6, "#3c4a3a");
  sign(c, 34, 78, "MERCAT", "#7d2a1f", "#f7e4b5");
  c.text(37, 104, "BOQUERIA", "#f7e4b5");
  // carrer cap al Barri Gòtic, a la dreta
  c.rect(246, 92, 30, 58, "#6f6457");
  c.gradient(250, 96, 22, 54, "#3a3229", "#7d705f", 5);
  sign(c, 240, 82, "BARRI GOTIC", "#5a3e2b");
  // passeig central amb arbres
  for (const x of [110, 150, 190, 226]) planeTree(c, x, 140, 78, x);
  c.rect(0, 140, W, 60, "#d9c8a2");
  // les ones del paviment de la Rambla
  for (let y = 142; y < 200; y += 5) for (let x = 0; x < W; x++) c.px(x, y + Math.round(Math.sin(x / 6) * 1.5), "#c0ab7f");
  // mosaic de Miró al terra
  c.circle(170, 182, 13, "#e9e0c7");
  c.circle(170, 182, 10, "#1e5aa8");
  c.circle(166, 179, 4, "#d7262e");
  c.circle(174, 186, 3, "#f2c52b");
  c.rect(163, 183, 6, 2, "#222");
  // quiosc de flors (la parada de la florista)
  c.rect(92, 112, 52, 6, "#2f5d3a");
  c.rect(94, 118, 48, 26, "#3f7a4b");
  for (let k = 0; k < 28; k++) {
    const r = rng(k + 40);
    c.circle(96 + r() * 44, 120 + r() * 8, 2, ["#d7262e", "#f6c8d2", "#f2c52b", "#e46b9a", "#ffffff"][k % 5]);
  }
  c.text(100, 113, "FLORS", "#f7f1e0");
  crowd(c, 120, 300, 152, 15, 9);
  sign(c, 2, 186, "← PL CATALUNYA", "#2a4d6e");
  sign(c, 254, 186, "AL PORT →", "#2a4d6e");
  return c;
}

// 3. Mercat de la Boqueria: parades de fruita i peix sota la volta de ferro
export function boqueria() {
  const c = new Canvas(W, H);
  c.gradient(0, 0, W, 150, "#3a3a3f", "#6b6255", 6);
  // la volta de ferro i vidre
  for (let x = 0; x < W; x += 32) {
    c.line(x, 0, x + 16, 40, "#22262b");
    c.line(x + 32, 0, x + 16, 40, "#22262b");
  }
  c.rect(0, 40, W, 3, "#22262b");
  c.dither(0, 0, W, 40, "#8fa6b0", "#6b7f88");
  // pernils penjats
  for (let x = 20; x < W; x += 46) {
    c.line(x, 43, x, 50, "#2a2a2a");
    c.ellipse(x, 60, 6, 11, "#8b2c1f");
    c.ellipse(x - 1, 57, 3, 5, "#b0473a");
  }
  // parades de fruita: piràmides de colors
  const fruit = [["#d7262e", "#b81d24"], ["#f28c28", "#d9731a"], ["#f2c52b", "#d9ab12"], ["#6aa84f", "#4f8a3a"], ["#7b3fa0", "#5c2b7a"]];
  for (let s = 0; s < 3; s++) {
    const x0 = 6 + s * 70;
    c.rect(x0, 112, 64, 40, "#6b4a2b");
    c.rect(x0, 112, 64, 3, "#8a6238");
    for (let k = 0; k < 4; k++) {
      const [a, b] = fruit[(s * 2 + k) % fruit.length];
      for (let row = 0; row < 4; row++) for (let i = 0; i < 4 - row; i++) c.circle(x0 + 6 + k * 15 + i * 3 + row * 1.5, 108 - row * 3, 2, (i + row) % 2 ? a : b);
    }
    c.rect(x0 + 4, 86, 56, 10, "#f4ecd8");
    c.text(x0 + 8, 89, ["FRUITES", "VERDURES", "SUCS"][s], "#7d2a1f");
  }
  // parada del peix: gel i peixos platejats
  c.rect(222, 108, 92, 44, "#5a6b78");
  c.rect(222, 104, 92, 8, "#e7f2f7");
  c.noise(222, 104, 92, 8, "#e7f2f7", 0.1, 5, 0.8);
  for (let k = 0; k < 9; k++) {
    const x = 228 + (k % 5) * 17, y = 100 + Math.floor(k / 5) * 5;
    c.ellipse(x, y, 7, 2, "#b8c4cc");
    c.poly([[x + 6, y], [x + 10, y - 3], [x + 10, y + 3]], "#9aa8b1");
    c.px(x - 4, y - 1, "#111");
  }
  sign(c, 236, 86, "PEIX FRESC", "#1f4f7a");
  c.rect(0, 150, W, 50, "#7c766a");
  c.noise(0, 150, W, 50, "#7c766a", 0.1, 8, 0.7);
  for (let x = 0; x < W; x += 20) c.rect(x, 150, 1, 50, "#6a6458");
  crowd(c, 10, 200, 150, 31, 6);
  sign(c, 278, 186, "SORTIDA →", "#2a4d6e");
  return c;
}

// 4. Barri Gòtic: la façana de la catedral, pedra i arcs apuntats, i la parada de llibres
export function barriGotic() {
  const c = new Canvas(W, H);
  sky(c, "#5a8fd0", "#d9ecf6");
  const stone = "#b8ad97";
  // catedral
  c.rect(70, 50, 180, 100, stone);
  c.noise(70, 50, 180, 100, stone, 0.12, 41, 0.8);
  for (const [x, w, h] of [[70, 26, 120], [224, 26, 120], [146, 28, 140]]) {
    c.rect(x, 150 - h, w, h, mix(stone, "#000", 0.08));
    c.poly([[x - 2, 150 - h], [x + w / 2, 150 - h - 34], [x + w + 2, 150 - h]], mix(stone, "#000", 0.15));
    for (let k = 0; k < 6; k++) c.px(x + w / 2, 150 - h - 34 - k, "#6d6555");
    for (let y = 150 - h + 6; y < 150; y += 18) {
      c.rect(x + 6, y, w - 12, 10, "#3b3a40");
      c.poly([[x + 6, y], [x + w / 2, y - 6], [x + w - 6, y]], "#3b3a40");
    }
  }
  // rosassa i porta
  c.circle(160, 76, 13, "#5e5a63");
  c.circle(160, 76, 10, "#8a2b4a");
  for (let k = 0; k < 8; k++) c.line(160, 76, 160 + Math.cos(k * 0.785) * 10, 76 + Math.sin(k * 0.785) * 10, "#d6b45a");
  c.rect(146, 108, 28, 42, "#4a3424");
  c.poly([[146, 108], [160, 92], [174, 108]], "#4a3424");
  c.rect(159, 100, 2, 50, "#2e2017");
  // cases estretes als costats
  building(c, 0, 40, 70, 110, { wall: "#c9b48e", trim: "#9c8662", seed: 42, shutters: "#3f5a6b" });
  building(c, 250, 44, 70, 106, { wall: "#bfa27a", trim: "#8f744f", seed: 43, shutters: "#6b3f2b" });
  // terra de llambordes
  c.rect(0, 150, W, 50, "#9b927f");
  for (let y = 150; y < 200; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) c.rect(x, y, 7, 3, "#aaa08c");
  // la parada de Sant Jordi: llibres i senyera
  c.rect(190, 132, 70, 22, "#6b4a2b");
  c.rect(188, 130, 74, 4, "#8a6238");
  for (let k = 0; k < 10; k++) c.rect(192 + k * 7, 124, 6, 7, ["#c0392b", "#2e86c1", "#27ae60", "#f1c40f", "#8e44ad"][k % 5]);
  for (let s = 0; s < 9; s++) c.rect(262, 100 + s * 3, 18, 3, s % 2 ? "#d7262e" : "#f2c52b");
  c.rect(261, 100, 1, 54, "#5a4a3a");
  c.text(196, 141, "LLIBRES", "#f7e4b5");
  sign(c, 2, 186, "← LA RAMBLA", "#2a4d6e");
  return c;
}

// 5. Port Vell: el monument a Colom, el mar, velers i el telefèric
export function portVell() {
  const c = new Canvas(W, H);
  sky(c, "#3577c4", "#c6e6f7");
  clouds(c, 51, 4);
  // Montjuïc al fons i el cable del telefèric
  c.ellipse(40, 120, 90, 50, "#5f8a4a");
  c.noise(0, 70, 130, 60, "#5f8a4a", 0.12, 52, 0.4);
  c.line(0, 40, 140, 90, "#2a2a2a");
  c.rect(60, 62, 10, 8, "#c0392b");
  c.rect(61, 63, 8, 3, "#8fd3f5");
  c.line(65, 58, 65, 62, "#2a2a2a");
  sea(c, 110, 40, 53);
  // velers
  for (const x of [170, 205, 300]) {
    c.poly([[x - 12, 128], [x + 12, 128], [x + 8, 134], [x - 8, 134]], "#f2f2f2");
    c.line(x, 96, x, 128, "#555");
    c.poly([[x, 98], [x, 126], [x + 12, 126]], "#ffffff");
  }
  // la columna de Colom
  c.rect(108, 128, 30, 22, "#8c8577");
  c.rect(112, 120, 22, 8, "#9e9787");
  c.rect(119, 30, 8, 92, "#a8a294");
  c.dither(119, 30, 2, 92, "#c4bfb3", "#a8a294");
  c.rect(116, 28, 14, 4, "#c9a227");
  c.rect(121, 14, 4, 14, "#4d4a3f");
  c.circle(123, 12, 2, "#4d4a3f");
  c.line(125, 16, 132, 8, "#4d4a3f");
  palm(c, 170, 150, 52);
  palm(c, 290, 150, 60);
  // estació del telefèric
  c.rect(6, 112, 40, 38, "#7a6a55");
  c.rect(10, 120, 32, 30, "#3a3a3a");
  sign(c, 6, 104, "TELEFERIC", "#b22222");
  // passeig
  c.rect(0, 150, W, 50, "#cdbf9f");
  c.noise(0, 150, W, 50, "#cdbf9f", 0.06, 54, 0.5);
  for (let x = 0; x < W; x += 12) c.rect(x, 150, 6, 2, "#8c8577");
  sign(c, 54, 186, "← LA RAMBLA", "#2a4d6e");
  sign(c, 246, 186, "BARCELONETA →", "#2a4d6e");
  return c;
}

// 6. La Barceloneta: platja, para-sols, l'hotel en forma de vela i el peix daurat
export function barceloneta() {
  const c = new Canvas(W, H);
  sky(c, "#2f74c6", "#d6eefa");
  clouds(c, 61, 3);
  // l'hotel vela al fons
  c.poly([[268, 30], [300, 124], [244, 124]], "#9fb7c9");
  c.poly([[268, 30], [300, 124], [282, 124]], "#7f9db3");
  for (let y = 40; y < 124; y += 6) c.line(268 - (y - 30) * 0.25, y, 268 + (y - 30) * 0.34, y, "#b9cfdd");
  // el peix daurat de Gehry
  c.ellipse(54, 102, 28, 10, "#c9a227");
  c.poly([[80, 102], [96, 92], [96, 112]], "#b8901c");
  for (let x = 30; x < 82; x += 4) c.line(x, 93, x, 111, "#e0bf55");
  c.rect(52, 112, 3, 12, "#7a6a55");
  sea(c, 106, 34, 62, "#1f86c7");
  // platja de sorra
  c.rect(0, 140, W, 60, "#e8d29a");
  c.noise(0, 140, W, 60, "#e8d29a", 0.12, 63, 0.7);
  for (let x = 0; x < W; x++) c.px(x, 140 + Math.round(Math.sin(x / 9) * 1.5), "#ffffff");
  // para-sols i tovalloles
  for (const [x, col] of [[110, "#d7262e"], [200, "#f2c52b"], [300, "#2e86c1"]]) {
    c.rect(x, 128, 2, 30, "#555");
    c.ellipse(x + 1, 128, 14, 5, col);
    c.ellipse(x + 1, 129, 14, 3, mix(col, "#000", 0.2));
    c.rect(x - 14, 162, 22, 7, mix(col, "#fff", 0.4));
  }
  crowd(c, 140, 250, 160, 64, 4);
  sign(c, 2, 186, "← PORT VELL", "#2a4d6e");
  return c;
}

// 7. Passeig de Gràcia: la Casa Batlló (teulat de drac, balcons de màscara), el fanal i la parada del bus
export function passeigGracia() {
  const c = new Canvas(W, H);
  sky(c, "#4a86cf", "#d2e9f6");
  building(c, 0, 30, 92, 120, { wall: "#e0cba5", seed: 71 });
  building(c, 228, 34, 92, 116, { wall: "#d6bfa0", trim: "#a98f6a", seed: 72 });
  // Casa Batlló
  const x0 = 92, w = 136;
  c.rect(x0, 40, w, 110, "#cfd8d6");
  const r = rng(73);
  for (let k = 0; k < 900; k++) c.px(x0 + r() * w, 40 + r() * 80, ["#7fb7c9", "#4a8fb0", "#9fd0a5", "#e2a3c7", "#f3e7b1"][k % 5]);
  // el teulat: l'esquena del drac, amb escates
  for (let x = 0; x < w; x++) {
    const top = 22 + Math.sin(x / 14) * 6;
    for (let y = top; y < 40; y++) c.px(x0 + x, y, (Math.floor(x / 4) + Math.floor(y / 3)) % 2 ? "#3f8f6a" : "#d46a8a");
  }
  // la torre amb la creu
  c.rect(x0 + 18, 10, 8, 24, "#e9dcc0");
  c.circle(x0 + 22, 9, 4, "#c9a227");
  // finestres ondulades i balcons de màscara
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 4; k++) {
      const wx = x0 + 10 + k * 32, wy = 52 + row * 24;
      c.ellipse(wx + 9, wy + 8, 10, 9, "#2f3b47");
      c.ellipse(wx + 9, wy + 3, 9, 4, "#9ecbd9");
      c.ellipse(wx + 9, wy + 16, 8, 3, "#e8e4d8");
      c.px(wx + 6, wy + 15, "#333");
      c.px(wx + 12, wy + 15, "#333");
    }
  }
  // planta baixa d'ossos
  c.rect(x0, 122, w, 28, "#bdb39b");
  for (let k = 0; k < 6; k++) {
    const bx = x0 + 8 + k * 22;
    c.rect(bx, 124, 5, 26, "#e4dac2");
    c.ellipse(bx + 2, 124, 4, 3, "#e4dac2");
    c.rect(bx + 6, 128, 14, 22, "#3d4a52");
  }
  // vorera i calçada
  c.rect(0, 150, W, 50, "#c7c1b2");
  // les rajoles hexagonals de Gaudí
  for (let y = 152; y < 200; y += 8) for (let x = (y / 8) % 2 ? 0 : 6; x < W; x += 12) c.circle(x, y, 2, "#a9a293");
  // fanal i parada del bus
  streetLamp(c, 86, 152, 50);
  c.rect(250, 106, 2, 46, "#333");
  c.rect(240, 98, 22, 12, "#c0392b");
  c.text(243, 101, "BUS", "#fff");
  c.rect(252, 112, 50, 28, "#9fb7c9");
  c.rect(252, 110, 52, 3, "#5d6d7a");
  c.text(258, 128, "24", "#c0392b", 2);
  c.text(276, 119, "PARK", "#1f3b57");
  c.text(276, 126, "GUELL", "#1f3b57");
  sign(c, 2, 186, "← PL CATALUNYA", "#2a4d6e");
  sign(c, 226, 186, "SAGRADA FAMILIA →", "#2a4d6e");
  return c;
}

// 8. La Sagrada Família: les torres plenes de forats, les grues i el llac
export function sagradaFamilia() {
  const c = new Canvas(W, H);
  sky(c, "#3e7fcc", "#dcefff");
  clouds(c, 81, 4);
  const stone = "#c7b28a";
  // grues
  for (const [x, h] of [[48, 140], [282, 120]]) {
    c.rect(x, 150 - h, 4, h, "#e0a526");
    for (let y = 150 - h; y < 150; y += 6) c.line(x, y, x + 4, y + 6, "#b07f12");
    c.rect(x - 30, 150 - h, 60, 3, "#e0a526");
    c.line(x + 26, 150 - h + 3, x + 26, 150 - h + 26, "#333");
  }
  // les torres (cons allargats amb forats i un pinacle de colors)
  const towers = [[96, 92, 10], [118, 110, 11], [140, 126, 12], [164, 138, 13], [188, 126, 12], [210, 110, 11], [232, 92, 10]];
  for (const [x, h, w] of towers) {
    c.poly([[x - w, 150], [x - w * 0.6, 150 - h], [x, 150 - h - 20], [x + w * 0.6, 150 - h], [x + w, 150]], stone);
    c.noise(x - w, 150 - h - 20, w * 2, h + 20, stone, 0.12, x, 0.6);
    for (let y = 150 - h + 6; y < 140; y += 7) c.rect(x - 1, y, 2, 3, "#5d4f3a");
    c.circle(x, 150 - h - 22, 3, ["#d7262e", "#f2c52b", "#2e86c1"][x % 3]);
  }
  // façana del Naixement, plena de figures
  c.rect(80, 116, 168, 34, mix(stone, "#000", 0.1));
  c.noise(80, 116, 168, 34, stone, 0.25, 84, 0.9);
  for (const x of [118, 164, 210]) {
    c.rect(x - 9, 126, 18, 24, "#4a3a2a");
    c.poly([[x - 9, 126], [x, 112], [x + 9, 126]], "#4a3a2a");
  }
  // el parc i el llac davant
  c.rect(0, 150, W, 50, "#b9b29f");
  c.ellipse(60, 176, 50, 10, "#3f8fb5");
  c.ellipse(60, 175, 46, 7, "#5aa9cc");
  planeTree(c, 14, 158, 46, 85);
  // entrada del metro
  c.rect(270, 160, 30, 20, "#b22222");
  c.rect(272, 162, 26, 16, "#2a2a2a");
  c.text(281, 166, "M", "#fff");
  sign(c, 2, 186, "← PG DE GRACIA", "#2a4d6e");
  return c;
}

// 9. Montjuïc: el Palau Nacional al capdamunt, les escalinates i la Font Màgica (la seva aigua és un objecte a part)
export function montjuic() {
  const c = new Canvas(W, H);
  c.gradient(0, 0, W, 150, "#1c2a5a", "#e2955b", 10);   // capvespre
  for (let k = 0; k < 20; k++) c.px(rng(91 + k)() * W, rng(191 + k)() * 40, "#fff7d6");
  // la muntanya i el palau
  c.ellipse(160, 120, 200, 70, "#3f5f3a");
  c.rect(100, 34, 120, 44, "#d9c39c");
  c.noise(100, 34, 120, 44, "#d9c39c", 0.08, 92, 0.5);
  c.ellipse(160, 34, 20, 16, "#8fa7a0");
  c.rect(156, 12, 8, 8, "#d9c39c");
  for (const x of [104, 208]) {
    c.rect(x, 22, 8, 56, "#cdb48a");
    c.poly([[x, 22], [x + 4, 14], [x + 8, 22]], "#9a845e");
  }
  for (let x = 110; x < 210; x += 10) c.rect(x, 50, 5, 20, "#5a4c3a");
  // les cascades i escalinates
  for (let k = 0; k < 6; k++) c.rect(130 - k * 6, 80 + k * 8, 60 + k * 12, 8, k % 2 ? "#cbb48c" : "#bca57d");
  c.rect(152, 80, 16, 48, "#5aa9cc");
  c.dither(152, 80, 16, 48, "#8fd3f5", "#5aa9cc");
  // les torres venecianes al costat
  for (const x of [20, 290]) {
    c.rect(x, 60, 14, 90, "#b5583a");
    c.poly([[x - 2, 60], [x + 7, 40], [x + 16, 60]], "#8a3f28");
  }
  // la bassa de la font (l'aigua de colors és un objecte que s'apaga)
  c.rect(0, 150, W, 50, "#bfae8c");
  c.ellipse(160, 150, 76, 14, "#8c7d62");
  c.ellipse(160, 148, 70, 10, "#1f5f86");
  c.noise(90, 138, 140, 20, "#1f5f86", 0.25, 93, 0.3);
  // el panell de control de la font
  c.rect(260, 132, 16, 20, "#5a5f66");
  c.rect(262, 135, 12, 6, "#2f3438");
  c.circle(268, 146, 2, "#d7262e");
  c.text(256, 124, "FONT", "#f7e4b5");
  // estació del telefèric
  c.rect(4, 120, 44, 30, "#7a6a55");
  c.rect(8, 128, 36, 22, "#3a3a3a");
  sign(c, 4, 112, "TELEFERIC", "#b22222");
  return c;
}

// L'aigua de la Font Màgica, en un llenç a part (és un objecte que es pot apagar)
export function magicFountainWater() {
  const c = new Canvas(140, 70);
  const colors = ["#ff5fa2", "#ffd34d", "#5fd3ff", "#9b6bff", "#5fff9b"];
  for (let k = 0; k < 13; k++) {
    const x = 6 + k * 10.5, h = 30 + Math.sin(k * 1.3) * 18 + (k === 6 ? 16 : 0);
    for (let y = 0; y < h; y++) {
      const w = 2 + (y < 6 ? 1 : 0);
      c.rect(x - w / 2 + Math.sin(y / 5 + k) * 0.6, 69 - y, w, 1, mix(colors[k % 5], "#ffffff", y / h * 0.6));
    }
    c.ellipse(x, 69 - h, 3, 2, "#ffffff");
  }
  return c;
}

// 10. Park Güell: el drac de mosaic a l'escalinata, els pavellons de pa de pessic i el banc ondulat
export function parkGuell({ sign: withSign = true } = {}) {
  const c = new Canvas(W, H);
  sky(c, "#3a7fd0", "#d9f0ff");
  clouds(c, 101, 4);
  // la ciutat i el mar al fons
  c.rect(0, 92, W, 12, "#9fb5c9");
  for (let x = 0; x < W; x += 7) c.rect(x, 86 + (x * 7) % 9, 5, 12, "#b7c7d6");
  c.rect(0, 100, W, 6, "#4f8fbf");
  // el banc ondulat de trencadís
  for (let x = 0; x < W; x++) {
    const y = 108 + Math.sin(x / 12) * 4;
    for (let k = 0; k < 7; k++) c.px(x, y + k, ["#f2f2f2", "#2e86c1", "#f2c52b", "#27ae60", "#d7262e"][(x * 3 + k * 7) % 5]);
  }
  c.rect(0, 115, W, 3, "#c9b48e");
  // els dos pavellons (pa de pessic amb teulats de bolet)
  for (const [x, cap] of [[22, "#8e44ad"], [258, "#d35400"]]) {
    c.rect(x, 96, 42, 56, "#c8955e");
    c.noise(x, 96, 42, 56, "#c8955e", 0.1, x, 0.6);
    c.ellipse(x + 21, 96, 26, 10, "#f3efe4");
    for (let k = 0; k < 40; k++) c.px(x + 2 + (k * 13) % 40, 90 + (k * 7) % 12, cap);
    c.rect(x + 18, 76, 6, 14, "#f3efe4");
    c.ellipse(x + 21, 74, 7, 4, cap);
    c.rect(x + 14, 128, 14, 24, "#4a3424");
    c.rect(x + 6, 110, 8, 10, "#3b4b5e");
    c.rect(x + 28, 110, 8, 10, "#3b4b5e");
  }
  // l'escalinata
  c.rect(0, 150, W, 50, "#d2bf98");
  for (let k = 0; k < 5; k++) c.rect(100 - k * 8, 118 + k * 7, 120 + k * 16, 7, k % 2 ? "#c4b087" : "#b5a078");
  // el drac de trencadís (la salamandra)
  const dx = 150, dy = 140;
  c.ellipse(dx, dy, 22, 8, "#3fa34d");
  c.poly([[dx + 18, dy - 4], [dx + 34, dy - 10], [dx + 36, dy - 2], [dx + 20, dy + 4]], "#3fa34d");
  c.poly([[dx - 20, dy], [dx - 36, dy + 6], [dx - 22, dy + 6]], "#3fa34d");
  const rr = rng(104);
  for (let k = 0; k < 120; k++) c.px(dx - 34 + rr() * 70, dy - 10 + rr() * 16, ["#f2c52b", "#2e86c1", "#d7262e", "#f28c28", "#ffffff"][k % 5]);
  c.px(dx + 32, dy - 7, "#111");
  for (const [lx, ly] of [[-12, 7], [10, 7], [-14, -6], [12, -7]]) c.rect(dx + lx, dy + ly, 3, 4, "#2f7d3a");
  palm(c, 300, 152, 56);
  if (withSign) sign(c, 2, 186, "← BUS 24", "#2a4d6e");
  return c;
}

export const SCENES = [
  ["pc", "Plaça de Catalunya", placaCatalunya],
  ["rambla", "La Rambla", rambla],
  ["boqueria", "Mercat de la Boqueria", boqueria],
  ["gotic", "Barri Gòtic", barriGotic],
  ["port", "Port Vell", portVell],
  ["platja", "La Barceloneta", barceloneta],
  ["pg", "Passeig de Gràcia", passeigGracia],
  ["sf", "Sagrada Família", sagradaFamilia],
  ["mj", "Montjuïc", montjuic],
  ["park", "Park Güell", parkGuell],
];
