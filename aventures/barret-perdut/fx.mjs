// Efectes animats de Hogwarts: espelmes i carbasses que suren, quadres que es mouen, fum, cuques de llum, un mussol...
// Cada efecte és un objecte decoratiu (es veu però no es pot tocar) amb un estat animat. fx(clau, sc) en torna la
// llista; es crida des de textura.render() amb l'estil actiu, perquè els fotogrames surtin il·luminats i amb la
// mateixa paleta que el decorat. Les llums (flames i halos) es fan a part, sense il·luminar (fan llum elles).
import { Canvas, mix, rng, fill, quad, sideQ, backQ, box } from "./persp.mjs";
import { cutAnim, frames, crop } from "./comu.mjs";
import { lightFrames } from "./llums.mjs";

const TAU = Math.PI * 2;
const wave = (f, N, ph = 0) => Math.sin((TAU * f) / N + ph);
const loop01 = (f, N, ph = 0) => (((f / N + ph) % 1) + 1) % 1;

// Un efecte: N fotogrames dibuixats amb draw(k, f, N); layer «back» = darrere dels personatges
// glow: fa llum (espelmes, estels...): no s'enfosqueix amb la il·luminació de l'escenari, només agafa la paleta
function anim(id, name, N, fps, draw, { layer = "back", glow = false } = {}) {
  const cut = cutAnim(frames(N, draw));
  if (glow) cut.full.forEach((c) => (c.emissive = true));
  return { id, name, fps, layer, cut };
}
const GLOW = { glow: true };

/* ---------- Peces ---------- */

// Espelma que sura: puja i baixa una mica i la flama tremola
function floatingCandles(sc) {
  const { cam } = sc, list = sc.bg.candles ?? [];
  if (!list.length) return [];
  return [anim("fx-espelmes", "espelmes", 8, 6, (k, f, N) => list.forEach(({ X, Y, Z }, i) => {
    const s = cam.s(Z), bob = wave(f, N, i * 1.9) * 0.06;
    const [x, y] = cam.p(X, Y + bob, Z).map(Math.round);
    k.rect(x, y, Math.max(1, Math.round(s * 0.05)), Math.max(2, Math.round(s * 0.22)), "#f4ecd0");
    const r = rng(i * 31 + f);
    k.px(x, y - 1, r() < 0.3 ? "#feae34" : "#fee761");
    if (r() < 0.5) k.px(x, y - 2, "#feae34");
    k.circle(x, y - 1, Math.max(1, Math.round(s * 0.1)), [255, 210, 120, 50]);
  }), GLOW)];
}
// Carbasses que suren amb la cara encesa
function floatingPumpkins(sc) {
  const list = sc.bg.pumpkins ?? [];
  if (!list.length) return [];
  return [anim("fx-carbasses", "carbasses", 8, 5, (k, f, N) => list.forEach(([px, py, rr], i) => {
    const y = Math.round(py + wave(f, N, i * 1.3) * 1.6), lit = (f + i) % 5 ? "#ffe060" : "#fff0a0";
    k.circle(px, y, rr, "#e07a1a"); k.circle(px - 1, y - 1, Math.max(1, rr - 2), "#f08a2a"); k.rect(px - 1, y - rr - 1, 2, 2, "#2a5a1a");
    k.px(px - 1, y - 1, lit); k.px(px + 1, y - 1, lit); k.rect(px - 1, y + 1, 3, 1, lit);
  }), GLOW)];
}
// Núvols del sostre encantat, que passen a poc a poc
function driftingClouds(sc) {
  const list = sc.bg.clouds ?? [];
  if (!list.length) return [];
  return [anim("fx-nuvols", "núvols", 12, 3, (k, f, N) => list.forEach(([x, y, rx, ry], i) => {
    k.ellipse(Math.round(x + wave(f, N, i) * 8), y, rx, ry, [120, 130, 170, 60]);
  }))];
}
// Un retrat viu: el personatge es mou, parpelleja, saluda o ronca. kind: wave | look | blink | snore | knit
function livingPortrait(cam, X0, X1, Y0, Y1, Z, { skin, coat, hair, kind, ph = 0 }) {
  return (k, f, N) => {
    const [a, b] = [cam.p(X0, Y1, Z - 0.01), cam.p(X1, Y0, Z - 0.01)];
    const x = Math.round(a[0]), y = Math.round(a[1]), w = Math.round(b[0] - a[0]), h = Math.round(b[1] - a[1]);
    const dx = kind === "look" ? Math.round(wave(f, N, ph) * w * 0.12) : 0;
    const blink = kind === "blink" ? f % N === 0 : kind === "snore";
    k.rect(x, y, w, h, "#3a3048");
    k.ellipse(x + w / 2 + dx, y + h * 0.95, w * 0.42, h * 0.32, coat);
    k.ellipse(x + w / 2 + dx, y + h * 0.45 + (kind === "snore" ? Math.round(wave(f, N)) : 0), Math.max(1, w * 0.22), Math.max(1, h * 0.22), skin);
    if (hair) k.rect(x + w * 0.28 + dx, y + h * 0.2, w * 0.44, Math.max(1, h * 0.1), hair);
    const eye = blink ? mix(skin, "#000", 0.4) : "#111";
    if (w > 6) { k.px(x + w * 0.42 + dx, y + h * 0.43, eye); k.px(x + w * 0.58 + dx, y + h * 0.43, eye); }
    if (kind === "wave") {   // aixeca el barret i saluda
      const up = Math.max(0, wave(f, N, ph)) * h * 0.25;
      k.rect(x + w * 0.72, y + h * 0.75 - up, Math.max(1, w * 0.1), h * 0.25, coat);
      k.rect(x + w * 0.66, y + h * 0.7 - up - 2, Math.max(2, w * 0.22), 2, "#2a1a1a");
    }
    if (kind === "knit") {   // les agulles fan punt soles
      const t = wave(f, N);
      k.line(x + w * 0.35, y + h * 0.85, x + w * (0.6 + t * 0.08), y + h * 0.62, "#c8c8d0");
      k.line(x + w * 0.65, y + h * 0.85, x + w * (0.4 - t * 0.08), y + h * 0.62, "#c8c8d0");
      k.rect(x + w * 0.4, y + h * 0.8, w * 0.2, Math.max(1, h * 0.08), "#c83a3a");
    }
    if (kind === "snore") {  // zzz que pugen
      for (let i = 0; i < 2; i++) { const t = loop01(f, N, i / 2 + ph); k.px(x + w * (0.65 + t * 0.25), y + h * (0.35 - t * 0.3), [230, 230, 255, 255 - t * 150]); k.px(x + w * (0.65 + t * 0.25) + 1, y + h * (0.35 - t * 0.3), [230, 230, 255, 255 - t * 150]); }
    }
  };
}
// Fum que puja d'un punt de la pantalla
const smoke = (x, y, s, n = 4, col = [150, 150, 160]) => (k, f, N) => {
  for (let i = 0; i < n; i++) {
    const t = loop01(f, N, i / n);
    k.circle(x + Math.sin(t * 5 + i) * s * 0.4 + t * s * 0.8, y - t * s * 3, Math.max(1, s * (0.25 + t * 0.4)), [...col, Math.round(110 * (1 - t))]);
  }
};
// Punts de llum que suren en un volum (pols, cuques de llum)
function motes(cam, n, box3, col, seed, { blink = false, size = 1 } = {}) {
  const r = rng(seed), pts = Array.from({ length: n }, () => [box3[0] + r() * (box3[1] - box3[0]), box3[2] + r() * (box3[3] - box3[2]), box3[4] + r() * (box3[5] - box3[4]), r() * TAU]);
  return (k, f, N) => pts.forEach(([X, Y, Z, ph], i) => {
    if (blink && (f + i) % 4 === 0) return;
    const [x, y] = cam.p(X + Math.sin((TAU * f) / N + ph) * 0.3, Y + Math.cos((TAU * f) / N + ph) * 0.2, Z);
    const on = blink ? ((f + i) % 4 === 1 ? 255 : 170) : 150 + Math.round(wave(f, N, ph) * 90);
    k.rect(Math.round(x), Math.round(y), size, size, [...col, on]);
    if (blink) k.circle(Math.round(x), Math.round(y), 2, [...col, 40]);
  });
}

/* ---------- Escenaris ---------- */
const FX = {
  dormitori: (sc) => [
    // la Recordadora d'en Neville, sota el coixí, s'encén i s'apaga
    anim("fx-recordadora", "Recordadora", 8, 4, (k, f, N) => { const [x, y] = sc.cam.p(-4.0, 0.72, 10.5).map(Math.round), a = 120 + wave(f, N) * 110; k.rect(x - 1, y - 2, 3, 2, [220, 40, 40, 255]); k.circle(x, y - 1, 3, [255, 60, 60, Math.round(a * 0.4)]); }, GLOW),
  ],
  comuna: () => [],
  escala: (sc) => {
    const { cam } = sc, zb = 13;
    return [
      anim("fx-retrat-cavaller", "retrat", 8, 4, livingPortrait(cam, -2.4, -1.2, 3.6, 5.0, zb, { skin: "#e8c0a0", coat: "#3a5a2a", hair: "#8a6a3a", kind: "wave" })),
      anim("fx-retrat-bruixa", "retrat", 8, 5, livingPortrait(cam, 1.2, 2.4, 3.6, 5.0, zb, { skin: "#c09070", coat: "#5a2a5a", hair: "#2a1a1a", kind: "knit" })),
      // una escala que es mou pel buit
      anim("fx-escala-mobil", "escala", 16, 4, (k, f, N) => {
        const dy = wave(f, N) * 1.2, dz = wave(f, N, 1) * 1.5;
        for (let s2 = 5; s2 >= 0; s2--) box(k, cam, 9 + s2 * 0.5, 9.5 + s2 * 0.5, 4.2 + dy + s2 * 0.3, 4.5 + dy + s2 * 0.3, 24 + dz, 25.6 + dz, { front: "#7a7280", top: "#9a92a0" });
      }),
    ];
  },
  vestibul: (sc) => [
    // les gemmes cauen als rellotges de punts
    anim("fx-rellotges", "rellotges", 8, 8, (k, f, N) => {
      const gems = ["#e43b44", "#63c74d", "#feae34", "#0099db"], fillH = [1.6, 0.9, 1.2, 1.3];
      gems.forEach((g, i) => { const x = -6.3 + i * 0.75 + 0.25; for (let n = 0; n < 2; n++) { const t = loop01(f, N, n / 2 + i * 0.13), Y = 2.0 - t * (2.0 - 0.35 - fillH[i]); const [px, py] = sc.cam.p(x + (n ? 0.06 : -0.06), Y, 16 - 0.62); k.px(px, py, g); } });
    }),
  ],
  gransalo: (sc) => [...driftingClouds(sc), ...floatingCandles(sc), ...floatingPumpkins(sc)],
  biblioteca: (sc) => [
    ...floatingCandles(sc),
    // un llibre que vola i bat les tapes per sobre de les prestatgeries
    anim("fx-llibre-volador", "llibre", 16, 8, (k, f, N) => {
      const t = f / N, X = -3 + Math.sin(t * TAU) * 2.4, Y = 3.6 + Math.sin(t * TAU * 2) * 0.3, Z = 12 + Math.cos(t * TAU) * 1.5;
      const [x, y] = sc.cam.p(X, Y, Z).map(Math.round), up = f % 2 ? -3 : 1;
      k.rect(x - 1, y - 1, 2, 3, "#5a2a6b"); fill(k, [[x - 1, y], [x - 6, y + up], [x - 5, y + up + 2]], "#e8e0c8"); fill(k, [[x + 1, y], [x + 6, y + up], [x + 5, y + up + 2]], "#e8e0c8");
    }),
  ],
  masmorra: (sc) => [
    // els pots de la prestatgeria brillen de tant en tant
    anim("fx-pots", "pots", 12, 3, (k, f, N) => { const r = rng(5); for (let n = 0; n < 6; n++) { const Y = 0.85 + Math.floor(r() * 4) * 0.65 + 0.15, Z = 7.8 + r() * 5.4, col = [[106, 168, 79], [168, 79, 106], [79, 106, 168], [200, 176, 64]][n % 4]; const a = Math.max(0, wave(f, N, n * 1.1)) * 120; if (a < 10) continue; const [x, y] = sc.cam.p(-5.5 + 0.22, Y, Z); k.circle(Math.round(x), Math.round(y), 2, [...col, Math.round(a)]); } }, GLOW),
  ],
  lavabo: (sc) => [
    // gotes que cauen del sostre i ones al bassal
    anim("fx-gotes", "gotes", 10, 8, (k, f, N) => {
      const t = f / N, [x, y0] = sc.cam.p(-0.5, 4.0 - t * 4.0, 9);
      if (t < 0.7) k.rect(Math.round(x), Math.round(y0), 1, 2, [180, 220, 240, 220]);
      for (let i = 0; i < 2; i++) { const r2 = loop01(f, N, i / 2); fill(k, Array.from({ length: 16 }, (_, j) => { const a = (j / 16) * TAU; return sc.cam.p(-0.5 + Math.cos(a) * r2 * 0.9, 0, 9 + Math.sin(a) * r2 * 0.45); }), [200, 230, 255, Math.round(70 * (1 - r2))]); }
    }),
  ],
  cuines: (sc) => {
    const [x1, y1] = sc.cam.p(-0.8, 0.9, 14.05), [x2, y2] = sc.cam.p(0.9, 0.9, 14.05), s = sc.cam.s(14);
    return [anim("fx-vapor", "vapor", 10, 6, (k, f, N) => { smoke(x1, y1, s * 0.8, 3, [220, 220, 230])(k, f, N); smoke(x2, y2, s * 0.8, 3, [220, 220, 230])(k, (f + 5) % N, N); })];
  },
  gargola: (sc) => [
    // l'armadura gira el cap per mirar qui passa
    anim("fx-armadura", "armadura", 12, 3, (k, f, N) => { const [ax, ay] = sc.cam.p(3 - 0.4, 0, 10), s = sc.cam.s(10), dx = Math.round(wave(f, N) * s * 0.06); k.rect(ax - s * 0.15, ay - s * 2.1, s * 0.3, s * 0.3, "#b8c0c8"); k.rect(ax - s * 0.1 + dx, ay - s * 2.0, s * 0.2, 1, "#2a2a32"); }),
  ],
  despatx: (sc) => {
    const { cam } = sc, zb = 13, cols = ["#5a2a2a", "#2a4a2a", "#2a2a5a", "#5a4a2a", "#4a2a4a"];
    const P = (i, j, kind, ph) => livingPortrait(cam, -4.6 + i * 1.5, -4.6 + i * 1.5 + 1.0, 2.4 + j * 1.5, 3.6 + j * 1.5, zb, { skin: "#e0c0a0", coat: cols[(i + j) % 5], hair: j ? "#8a8a8a" : "#3a2a1a", kind, ph });
    return [
      anim("fx-retrat-1", "retrat", 8, 3, P(0, 1, "snore", 0)),
      anim("fx-retrat-2", "retrat", 8, 3, P(2, 0, "look", 0.5)),
      anim("fx-retrat-3", "retrat", 8, 3, P(5, 1, "snore", 0.5)),
      anim("fx-retrat-4", "retrat", 10, 5, P(3, 1, "blink", 0)),
      // els instruments de plata fan bufarades de fum
      anim("fx-instruments", "instruments", 8, 6, (k, f, N) => { const [x, y] = cam.p(-4.5, 2.1, 10.6), s = cam.s(10.6); smoke(x, y, s * 0.4, 3, [200, 210, 230])(k, f, N); }),
    ];
  },
  astronomia: (sc) => {
    const r = rng(77), stars = Array.from({ length: 40 }, () => [Math.round(r() * 320), Math.round(r() * 80), r()]);
    return [
      anim("fx-estels", "estels", 16, 6, (k, f, N) => {
        stars.forEach(([x, y, ph], i) => { const a = wave(f, N, ph * TAU); if (a > 0.6) { k.px(x, y, "#ffffff"); k.px(x - 1, y, [255, 255, 255, 90]); k.px(x + 1, y, [255, 255, 255, 90]); k.px(x, y - 1, [255, 255, 255, 90]); k.px(x, y + 1, [255, 255, 255, 90]); } });
        if (f >= 3 && f < 8) { const t = (f - 3) / 5, x = 230 - t * 120, y = 12 + t * 30; for (let j = 0; j < 8; j++) k.px(x + j * 2, y - j * 0.5, [255, 255, 230, 255 - j * 30]); }
        const m = 30 + Math.max(0, wave(f, N)) * 50; k.circle(64, 40, 5, [255, 80, 48, Math.round(m)]);
      }, GLOW),
    ];
  },
  setena: (sc) => [
    // els trols del tapís ballen (malament)
    anim("fx-tapis", "tapís", 8, 4, (k, f, N) => {
      const { cam } = sc, xl = -3.5;
      sideQ(k, cam, xl + 0.03, 8.8, 13.0, 0.85, 3.15, "#a8402a");
      for (let t = 0; t < 3; t++) {
        const z = 9.4 + t * 1.3 + wave(f, N, t * 2) * 0.12, hop = Math.max(0, wave(f, N, t * 2)) * 0.12;
        sideQ(k, cam, xl + 0.04, z, z + 0.5, 1.2 + hop, 2.5 + hop, "#7a8a6a");
        quad(k, cam, [[xl + 0.045, 1.6 + hop, z - 0.25], [xl + 0.045, 1.6 + hop, z + 0.75], [xl + 0.045, 1.9 + hop, z + 0.25 + wave(f, N) * 0.15]], "#f0a0c0");
        sideQ(k, cam, xl + 0.045, z + 0.15, z + 0.35, 2.5 + hop, 2.75 + hop, "#8a9a7a");
      }
      const arm = wave(f, N) * 0.3;
      sideQ(k, cam, xl + 0.04, 12.4, 12.7, 1.0, 2.9, "#3a2a5a");
      quad(k, cam, [[xl + 0.045, 2.6, 12.5], [xl + 0.045, 2.6, 12.6], [xl + 0.045, 3.0 + arm, 12.1], [xl + 0.045, 2.95 + arm, 12.05]], "#3a2a5a");
    }),
  ],
  sala: (sc) => [
    anim("fx-pols", "pols", 12, 4, motes(sc.cam, 40, [-6, 6, 1, 9, 14, 28], [255, 240, 200], 3)),
  ],
  jardins: (sc) => {
    const { cam } = sc, s = cam.s(24), [hx, hy] = cam.p(-12, 0, 24), h = s * 2.6;
    return [
      anim("fx-fum-cabana", "fum", 10, 5, smoke(hx + s * 1.15, hy - h - s * 1.8, s, 5)),
      // un mussol que travessa el cel
      anim("fx-mussol", "mussol", 24, 8, (k, f, N) => {
        const t = f / N, x = Math.round(-10 + t * 340), y = Math.round(36 + Math.sin(t * TAU * 2) * 6), up = f % 2;
        k.rect(x - 1, y - 1, 3, 2, "#e8e0d0"); k.px(x + 2, y - 1, "#e8e0d0");
        fill(k, up ? [[x - 1, y - 1], [x - 5, y - 5], [x - 3, y]] : [[x - 1, y], [x - 6, y + 2], [x - 3, y + 1]], "#d8d0c0");
        fill(k, up ? [[x + 1, y - 1], [x + 4, y - 5], [x + 2, y]] : [[x + 1, y], [x + 5, y + 2], [x + 2, y + 1]], "#d8d0c0");
      }),
    ];
  },
  cabana: () => [],
  hivernacle: (sc) => {
    const [vx, vy, s2] = sc.bg.tentacula ?? [];
    if (vx == null) return [];
    return [anim("fx-tentacula", "tentàcula", 10, 5, (k, f, N) => {
      for (let i = 0; i < 5; i++) { const sw = wave(f, N, i * 1.3) * s2 * 0.25; let px = vx, py = vy; for (let j = 1; j <= 4; j++) { const nx = vx + ((i - 2) * s2 * 0.5 + sw * j / 4) * (j / 4), ny = vy - s2 * (1.2 + (i % 2) * 0.6) * (j / 4); k.line(Math.round(px), Math.round(py), Math.round(nx), Math.round(ny), j > 2 ? "#4aa05a" : "#3a8a4a"); px = nx; py = ny; } }
      k.rect(vx - s2 * 0.3, vy - s2 * 0.4, s2 * 0.6, s2 * 0.4, "#7a4a3a");
    })];
  },
  quidditch: (sc) => [
    // les teles de les graderies onegen
    anim("fx-teles", "teles", 8, 5, (k, f, N) => {
      const cols = ["#9a1c1c", "#1f6a30", "#c8a020", "#22408a"];
      for (const side of [-1, 1]) for (let i = 5; i >= 0; i--) {
        const Z = 12 + i * 6, X = side * 14, d = wave(f, N, i + side) * 0.15;
        quad(k, sc.cam, [[X - 1.2, 4.6 + d, Z - 0.02], [X + 1.2, 4.6 - d, Z - 0.02], [X + 1.2, 7, Z - 0.02], [X - 1.2, 7, Z - 0.02]], cols[(i + (side > 0 ? 2 : 0)) % 4]);
      }
    }),
  ],
  bosc: (sc) => [
    anim("fx-cuques", "cuques de llum", 8, 6, motes(sc.cam, 22, [-5, 5, 0.3, 2.2, 7, 22], [200, 255, 120], 9, { blink: true }), GLOW),
    anim("fx-unicorn", "llum de l'unicorn", 8, 3, (k, f, N) => { const [ux, uy] = sc.cam.p(-1.6, 0, 22), su = sc.cam.s(22); k.circle(ux, uy - su * 0.4, su * (1.2 + wave(f, N) * 0.25), [200, 220, 255, 30]); }, GLOW),
    anim("fx-boira", "boira", 12, 3, (k, f, N) => { const r = rng(4); for (let i = 0; i < 6; i++) k.ellipse(Math.round(r() * 320 + wave(f, N, i) * 14), Math.round(150 + r() * 40), 40 + r() * 40, 4, [140, 160, 190, 28]); }),
  ],
  llac: (sc) => [
    // espurnes al reflex de la lluna
    anim("fx-reflex", "reflex", 8, 6, (k, f, N) => { const r = rng(f * 13 + 1); for (let n = 0; n < 14; n++) { const y = 99 + Math.floor(r() * 48), w = 2 + (y - 98) * 0.25; k.rect(Math.round(96 - w / 2 + (r() - 0.5) * w), y, 1 + Math.round(r() * 2), 1, [255, 255, 230, 200]); } }, GLOW),
  ],
};

// Els efectes d'un escenari: [{ id, name, fps, layer, cut }] (cut.imgs i cut.pos, un cop il·luminats)
export const fx = (key) => (sc) => FX[key]?.(sc) ?? [];

// Les flames i els halos animats, a part: no s'il·luminen ni es retallen amb la resta (render ja ha acabat)
export function lightsFx(key, sc) {
  const fr = lightFrames(sc);
  if (!fr) return null;
  const { imgs, pos } = crop(fr);
  return { id: "fx-llums", name: "llums", fps: 7, layer: "back", imgs, pos };
}
