// Els decorats de dins del castell (14 escenaris). Cada funció dibuixa el fons amb la seva càmera i torna també
// la zona caminable, l'alçada del protagonista, els punts calents, els punts on van les coses i els retalls dels
// objectes (dibuixats amb la mateixa càmera perquè quedin a la seva escala i al seu lloc).
import {
  Canvas, mix, rng, Cam, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide, floorPoly, tiles, planks,
  torch, candle, gothicWindow, sideWindow, door, sideDoor, banner, shelfBack, shelfSide, nightSky,
  STD, hb, hbBox, hbBack, hbSide, at, cut, cutAnim, frames, room, beams, table, bench, bed, armchair, fire, fireplace, painting, portraitFace, stairsUp, stairsDown,
} from "./comu.mjs";
import { theme } from "./persp.mjs";
const wave = (f, N, ph = 0) => Math.sin((2 * Math.PI * f) / N + ph);

const W = 320;
const scene = (cam, walk, yt, yb = 197) => ({ cam, walk, ah: cam.actor(yt, yb) });

/* 1. Dormitori de Gryffindor */
export function dormitori() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -5, xr = 5, zb = 13, hgt = 4.6;
  room(c, cam, { xl, xr, zb, hgt, wall: "#6e5c5c", joint: "#56474a", ceil: "#2e2222",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.35, "#6b4a2e", "#553a22") });
  beams(c, cam, xl, xr, hgt, 4, zb - 0.5, 1.6, "#3a2618");
  gothicWindow(c, cam, -0.6, 0.6, 1.5, 3.3, zb, { moon: true });
  banner(c, cam, -3.4, -2.6, 2.4, 3.9, zb, "#8b1a1a", "#c9a227");
  banner(c, cam, 2.6, 3.4, 2.4, 3.9, zb, "#8b1a1a", "#c9a227");
  sideDoor(c, cam, xr, 9.4, 10.6, 2.3, { wood: "#5a3a20" });
  sideWindow(c, cam, xl, 10.8, 11.8, 1.6, 2.8);
  // estora vermella
  floorQ(c, cam, -1.6, 1.6, 8.2, 10.6, "#7a2020"); floorQ(c, cam, -1.4, 1.4, 8.4, 10.4, "#922828");
  // llits: dos al fons, dos a l'esquerra
  bed(c, cam, -3.2, -2.0, 11, 13);
  bed(c, cam, 1.6, 2.8, 11, 13);
  bed(c, cam, -5, -3.4, 10.0, 11.2);
  bed(c, cam, -5, -3.4, 6.6, 7.8);
  // tauleta amb espelma entre els llits del fons
  box(c, cam, -0.9, -0.5, 0, 0.7, 12.4, 12.8, { front: "#4a2e18" });
  const r = rng(2);
  return {
    ...scene(cam, [floorPoly(cam, -3.1, 4.6, 141)], 141), bg: c,
    spots: {
      porta: [[268, 82], [298, 82], [300, 152], [266, 152]],
      finestra: hbBack(cam, -0.7, 0.7, 1.4, 3.5, zb, 2),
      llitRon: hbBox(cam, -3.2, -2.0, 0, 2.3, 11, 13),
      llitHarry: hbBox(cam, 1.6, 2.8, 0, 2.3, 11, 13),
      llitNeville: hbBox(cam, -5, -3.4, 0, 2.3, 10, 11.2),
    },
    pts: { neville: at(cam, -1.4, 8.6), arribada: at(cam, 3.6, 10.0), inici: at(cam, 1.0, 8.0) },
    objs: {
      bagul: cut(
        (k) => { box(k, cam, 1.7, 2.7, 0, 0.5, 10.25, 10.8, { front: "#7a4a22", top: "#8a5a2a" }); for (const x of [1.85, 2.5]) backQ(k, cam, x, x + 0.06, 0, 0.5, 10.24, "#c9a227"); backQ(k, cam, 2.15, 2.25, 0.3, 0.42, 10.24, "#e0c050"); },
        (k) => { box(k, cam, 1.7, 2.7, 0, 0.5, 10.25, 10.8, { front: "#7a4a22", top: "#1a100a" }); backQ(k, cam, 1.7, 2.7, 0.5, 1.05, 10.8, "#8a5a2a"); for (const x of [1.85, 2.5]) backQ(k, cam, x, x + 0.06, 0, 0.5, 10.24, "#c9a227"); },
      ),
      mitjo: cut((k) => { floorQ(k, cam, -2.6, -2.3, 9.3, 9.45, "#d8d0c0"); floorQ(k, cam, -2.6, -2.45, 9.3, 9.7, "#d8d0c0"); floorQ(k, cam, -2.6, -2.3, 9.3, 9.36, "#b02a2a"); }),
      bufanda: cut((k) => { for (let i = 0; i < 6; i++) backQ(k, cam, 2.72, 2.86, 1.9 - i * 0.18, 2.08 - i * 0.18, 10.95, i % 2 ? "#c9a227" : "#9a1c1c"); }),
    },
  };
}

/* 2. Sala comuna de Gryffindor */
export function comuna() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -6, xr = 6, zb = 14, hgt = 5.2;
  room(c, cam, { xl, xr, zb, hgt, wall: "#7a4038", joint: "#5e2e28", ceil: "#2e1a18",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.4, "#6b4a2e", "#553a22") });
  beams(c, cam, xl, xr, hgt, 5, zb - 0.5, 1.8, "#3a2216");
  gothicWindow(c, cam, -4.4, -3.4, 1.6, 3.6, zb, { moon: true });
  gothicWindow(c, cam, 3.4, 4.4, 1.6, 3.6, zb);
  // estora rodona (el·lipse al terra) i llar de foc amb el lleó
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; }
  fill(c, Array.from({ length: 24 }, (_, k) => { const a = (k / 24) * Math.PI * 2; return cam.p(Math.cos(a) * 2.6, 0, 11 + Math.sin(a) * 1.6); }), "#8b1a1a");
  fill(c, Array.from({ length: 24 }, (_, k) => { const a = (k / 24) * Math.PI * 2; return cam.p(Math.cos(a) * 2.1, 0, 11 + Math.sin(a) * 1.2); }), "#a8302a");
  fireplace(c, cam, -1.4, 1.4, zb, { stone: "#8a7a70" });
  banner(c, cam, -0.7, 0.7, 2.7, 4.4, zb - 0.01, "#9a1c1c", "#d4a82a");
  armchair(c, cam, -2.9, -2.0, 12.4, 13.2, "#9a2020");
  armchair(c, cam, 2.0, 2.9, 12.4, 13.2, "#9a2020");
  // escala del dormitori (porta a l'esquerra) i forat del retrat (dreta)
  sideDoor(c, cam, xl, 10.6, 11.8, 2.4, { wood: "#5a3a20" });
  sideQ(c, cam, xr, 10.8, 12.4, 0.0, 1.6, "#120c0c");
  quad(c, cam, [[xr, 1.6, 10.8], [xr, 2.2, 11.6], [xr, 1.6, 12.4]], "#120c0c");
  seg(c, cam, [xr, 0, 10.8], [xr, 1.6, 10.8], "#c9a227"); seg(c, cam, [xr, 0, 12.4], [xr, 1.6, 12.4], "#c9a227");
  // tauler d'anuncis a la paret esquerra
  sideQ(c, cam, xl, 12.4, 13.6, 1.2, 2.3, "#9a7040");
  const r = rng(5);
  for (let k = 0; k < 6; k++) { const z = 12.5 + r() * 0.9, y = 1.3 + r() * 0.75; sideQ(c, cam, xl, z, z + 0.22, y, y + 0.22, k % 2 ? "#f0e8d0" : "#e8d8a0"); }
  // taula dels escacs (esquerra) i tauleta (dreta)
  table(c, cam, -4.6, -3.4, 8.4, 9.6, 0.75, "#5a3a20");
  table(c, cam, 3.4, 4.4, 8.6, 9.4, 0.7, "#5a3a20");
  return {
    ...scene(cam, [floorPoly(cam, -3.2, 3.2, 129)], 129), bg: c,
    spots: {
      dormitori: hbSide(cam, xl, 10.5, 11.9, 0, 2.5, 3),
      retrat: hbSide(cam, xr, 10.7, 12.5, 0, 2.3, 3),
      tauler: hbSide(cam, xl, 12.4, 13.6, 1.2, 2.3, 1),
      foc: hbBox(cam, -1.4, 1.4, 0, 2.4, 13.5, 14, 0),
      estendard: hbBack(cam, -0.7, 0.7, 2.7, 4.4, zb, 1),
      butaques: hbBox(cam, -2.9, 2.9, 0, 1.05, 12.4, 13.2, 0).map(([x, y], i) => [x, y]),
    },
    pts: { ron: at(cam, -2.7, 9.0), deDormitori: at(cam, -2.6, 11.2), deRetrat: at(cam, 2.8, 11.6), quisq: at(cam, 3.9, 9.0, 0.7), escacs: at(cam, -4.0, 9.0, 0.75) },
    objs: {
      escacs: cutAnim(frames(8, (k, f, N) => { const r2 = rng(3); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) floorQ(k, cam, -4.4 + i * 0.2, -4.2 + i * 0.2, 8.6 + j * 0.2, 8.8 + j * 0.2, (i + j) % 2 ? "#e8e0d0" : "#2a2020", 0.76); for (let n = 0; n < 6; n++) { const hop = n === f % 6 ? 2 : 0, slide = n === (f + 3) % 6 ? 0.08 : 0; const [x, y] = cam.p(-4.3 + r2() * 0.7 + slide, 0.76, 8.7 + r2() * 0.7); k.rect(x, y - 3 - hop, 1, 3, n % 2 ? "#f4f0e0" : "#1a1a1a"); } })),
      quisquiller: cut((k) => { floorQ(k, cam, 3.7, 4.1, 8.8, 9.15, "#e8c83a", 0.71); floorQ(k, cam, 3.75, 4.05, 8.85, 8.95, "#1a1a8a", 0.715); }),
    },
  };
}

/* 3. Escala Gran (replà amb escales que es mouen) */
export function escala() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -5, xr = 5, zb = 13;
  // el buit de l'escala: fosc, amb escales que suren i quadres
  c.gradient(0, 0, W, 200, "#1e1a2c", "#0e0c16", 8);
  const r = rng(11);
  for (let k = 0; k < 7; k++) {
    const x0 = 6 + r() * 5, z0 = 14 + r() * 14, y0 = -4 + r() * 12;
    for (let s = 0; s < 6; s++) box(c, cam, x0 + s * 0.35, x0 + s * 0.35 + 0.35, y0 + s * 0.22, y0 + s * 0.22 + 0.22, z0, z0 + 1.3, { front: "#5a5260", top: "#7a7280" });
  }
  for (let k = 0; k < 10; k++) { const z = 16 + r() * 16, y = r() * 10; painting(c, cam, 14, 14.8, y, y + 1, z, portraitFace("#e0b890", ["#6a2a2a", "#2a4a6a", "#4a6a2a"][k % 3], "#3a2a1a")); }
  stoneSide(c, cam, xl, 0.5, zb, 0, 9, "#5e5668", "#474052");
  stoneBack(c, cam, xl, xr, 0, 9, zb, "#665e70", "#4d4658");
  // terra del replà i la barana
  tiles(c, cam, xl, xr, 0.5, zb, 1, "#6e6672", "#5e5662", { fog: "#1e1a2c", fogAmt: 0.3 });
  for (let z = 6; z < zb; z += 0.5) box(c, cam, xr - 0.08, xr, 0, 1.0, z, z + 0.08, { front: "#8a7a5a" });
  box(c, cam, xr - 0.12, xr + 0.04, 1.0, 1.1, 5.5, zb, { front: "#a08a5a", top: "#b89a6a" });
  // tres arcades al fons: biblioteca, passadís de la gàrgola, lavabo
  door(c, cam, -4.2, -2.8, 2.6, zb, { open: true });
  door(c, cam, -0.7, 0.7, 2.6, zb, { open: true });
  door(c, cam, 2.8, 4.2, 2.6, zb, { open: true });
  for (const [x, t] of [[-3.5, "BIBLIOTECA"], [3.5, "LAVABOS"]]) { const [px, py] = cam.p(x, 3.0, zb); c.text(Math.round(px - Canvas.textWidth(t) / 2), Math.round(py), t, "#c8b88a"); }
  torch(c, cam, -1.7, 2.2, zb - 0.05); torch(c, cam, 1.7, 2.2, zb - 0.05);
  // quadres del replà
  painting(c, cam, -2.4, -1.2, 3.6, 5.0, zb, portraitFace("#e8c0a0", "#3a5a2a", "#8a6a3a"));
  painting(c, cam, 1.2, 2.4, 3.6, 5.0, zb, portraitFace("#c09070", "#5a2a5a", "#2a1a1a"));
  // escala que puja (dreta, cap al setè pis) i escala que baixa (davant a l'esquerra, cap al vestíbul)
  stairsUp(c, cam, 5.0, 6.6, 7.5, 9, 0.5, 0.3, "#6a6272");
  stairsDown(c, cam, -4.9, -2.9, 6.2, 8.0, "#6e6672");
  for (let z = 6.2; z <= 8; z += 0.45) box(c, cam, -2.9, -2.82, 0, 0.9, z, z + 0.08, { front: "#8a7a5a" });
  box(c, cam, -2.94, -2.78, 0.9, 1.0, 6.2, 8.1, { front: "#a08a5a", top: "#b89a6a" });
  return {
    ...scene(cam, [floorPoly(cam, -4.6, 4.6, 127)], 127), bg: c,
    spots: {
      biblioteca: hbBack(cam, -4.2, -2.8, 0, 3.0, zb, 1),
      gargola: hbBack(cam, -0.7, 0.7, 0, 3.0, zb, 1),
      lavabo: hbBack(cam, 2.8, 4.2, 0, 3.0, zb, 1),
      amunt: [[262, 40], [318, 40], [318, 168], [262, 168]],
      avall: hbBox(cam, -4.9, -2.9, -0.5, 0.2, 6.2, 8.0, 2),
      escales: [[180, 0], [318, 0], [318, 38], [180, 38]],
      quadre1: hbBack(cam, -2.4, -1.2, 3.6, 5.0, zb, 1),
      quadre2: hbBack(cam, 1.2, 2.4, 3.6, 5.0, zb, 1),
    },
    pts: { deComuna: at(cam, -3.8, 10.6), deBiblioteca: at(cam, -3.4, 12.2), deGargola: at(cam, 0, 12.2), deLavabo: at(cam, 3.4, 12.2), deSetena: at(cam, 3.9, 9.6), deVestibul: at(cam, -2.4, 8.6) },
    objs: {
      // la Dama Grassa, a la paret esquerra
      grassa: cutAnim(frames(8, (k, f, N) => {
        const d = wave(f, N) * 0.08, fan = wave(f, N / 2) * 0.12;
        sideQ(k, cam, xl + 0.02, 9.6, 11.2, 0.4, 2.8, "#b08a2a"); sideQ(k, cam, xl + 0.03, 9.7, 11.1, 0.5, 2.7, "#3a2a3a");
        sideQ(k, cam, xl + 0.04, 9.95 + d * 0.5, 10.85 + d * 0.5, 0.5, 1.7, "#e07ab0");
        quad(k, cam, [[xl + 0.04, 1.6, 10.15 + d], [xl + 0.04, 1.6, 10.65 + d], [xl + 0.04, 2.3, 10.6 + d], [xl + 0.04, 2.3, 10.2 + d]], "#f0c8a8");
        sideQ(k, cam, xl + 0.045, 10.15 + d, 10.65 + d, 2.25, 2.5, "#e8d070");
        quad(k, cam, [[xl + 0.05, 1.55, 10.72], [xl + 0.05, 1.55 + fan + 0.3, 10.95], [xl + 0.05, 1.85 + fan, 11.0]], "#f4e8f0");   // ventall
      })),
    },
  };
}

/* 4. Vestíbul */
export function vestibul() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -7, xr = 7, zb = 16;
  room(c, cam, { xl, xr, zb, hgt: null, wall: "#6a6470", joint: "#524c58", stone: { h: 0.6, w: 1.2 },
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 1.2, "#7a7280", "#665e6c", { fog: "#222030", fogAmt: 0.3 }) });
  // rellotges de punts de les cases (esquerra del fons)
  const houses = [["#b02a2a", "#e8c040"], ["#2a8a3a", "#c0c0c0"], ["#d8b020", "#2a2a2a"], ["#2a4aa0", "#b08a50"]];
  houses.forEach(([gem, trim], i) => {
    const x = -6.3 + i * 0.75;
    box(c, cam, x, x + 0.5, 0, 0.3, zb - 0.6, zb - 0.1, { front: trim });
    backQ(c, cam, x + 0.05, x + 0.45, 0.3, 2.9, zb - 0.6, "#a8c0d8");
    const fillH = [1.6, 0.9, 1.2, 1.3][i];
    backQ(c, cam, x + 0.08, x + 0.42, 0.32, 0.32 + fillH, zb - 0.61, gem);
    for (let k = 0; k < 8; k++) { const [px, py] = cam.p(x + 0.1 + (k % 3) * 0.12, 2.0 + Math.floor(k / 3) * 0.25, zb - 0.62); c.px(px, py, gem); }
    box(c, cam, x, x + 0.5, 2.9, 3.15, zb - 0.6, zb - 0.1, { front: trim });
  });
  // escalinata de marbre a la dreta (cap amunt)
  stairsUp(c, cam, 3.8, 6.9, 10, 12, 0.5, 0.28, "#9a929e");
  box(c, cam, 3.6, 3.8, 0, 4.2, 10, 16, { front: "#7a7280", top: "#8a8290" });
  torch(c, cam, -3.0, 2.6, zb - 0.05); torch(c, cam, 3.0, 2.6, zb - 0.05);
  // portes del Gran Saló a la paret esquerra
  sideDoor(c, cam, xl, 11.6, 13.6, 3.4, { wood: "#6b4423" });
  // quadre de la fruita a la dreta? (és a la paret del fons, a l'esquerra de l'escala)
  // escala de les masmorres: forat al terra davant a l'esquerra
  stairsDown(c, cam, -5.0, -3.0, 6.3, 8.0, "#665e6c");
  for (let z = 6.3; z <= 8; z += 0.45) box(c, cam, -3.0, -2.92, 0, 0.9, z, z + 0.08, { front: "#8a7a5a" });
  box(c, cam, -3.04, -2.88, 0.9, 1.0, 6.3, 8.1, { front: "#a08a5a", top: "#b89a6a" });
  backQ(c, cam, -1.9, 1.9, 0, 4.6, zb - 0.02, "#3a2a1a");
  backQ(c, cam, -1.7, 1.7, 0, 4.4, zb - 0.03, "#141a30");
  for (let i = 0; i < 12; i++) { const r2 = rng(i + 3); const [px, py] = cam.p(-1.6 + r2() * 3.2, 2 + r2() * 2.3, zb - 0.04); c.px(px, py, "#dfe6ff"); }
  backQ(c, cam, -1.7, 1.7, 0, 1.2, zb - 0.04, "#1e3a22");
  backQ(c, cam, -2.75, -1.85, 0.3, 1.4, zb - 0.02, "#0c0a10");
  const doorMain = (open) => (k) => {
    if (!open) k.ellipse(...cam.p(0, 4.6, zb - 0.02), Math.round(cam.s(zb) * 1.9), Math.round(cam.s(zb) * 1.0), "#3a2a1a");
    if (open) {
      sideQ(k, cam, -1.7, zb - 1.6, zb - 0.03, 0, 4.2, "#6b4423"); sideQ(k, cam, 1.7, zb - 1.6, zb - 0.03, 0, 4.2, "#5a3a1e");
    } else {
      backQ(k, cam, -1.7, -0.02, 0, 4.4, zb - 0.03, "#6b4423"); backQ(k, cam, 0.02, 1.7, 0, 4.4, zb - 0.03, "#634020");
      for (let x = -1.5; x < 1.7; x += 0.4) seg(k, cam, [x, 0, zb - 0.04], [x, 4.3, zb - 0.04], "#4a2e18");
      for (const y of [1.0, 3.0]) backQ(k, cam, -1.7, 1.7, y, y + 0.12, zb - 0.04, "#2a2a2a");
      k.rect(...cam.p(-0.25, 2.0, zb - 0.05), 2, 2, "#c9a227"); k.rect(...cam.p(0.15, 2.0, zb - 0.05), 2, 2, "#c9a227");
    }
  };
  const pear = (tickled, f = 0) => tickled ? (k) => { sideQ(k, cam, -2.8, zb - 0.9, zb - 0.03, 0.3, 1.4, "#b08a2a"); sideQ(k, cam, -2.79, zb - 0.85, zb - 0.06, 0.35, 1.35, "#2a1e2a"); } : (k) => {
    painting(k, cam, -2.8, -1.8, 0.3, 1.4, zb - 0.02, (cc, x, y, w, h) => {
      cc.rect(x, y, w, h, "#2a1e2a");
      cc.ellipse(x + w / 2, y + h * 0.8, w * 0.42, h * 0.16, "#c0c0c8");
      cc.circle(x + w * 0.3, y + h * 0.58, Math.max(1, w * 0.13), "#b02a3a");
      cc.circle(x + w * 0.7, y + h * 0.6, Math.max(1, w * 0.12), "#6a2a8a");
      cc.ellipse(x + w * 0.5 + (f % 4 === 1 ? 1 : f % 4 === 3 ? -1 : 0), y + h * 0.45, Math.max(1, w * 0.12), Math.max(2, h * 0.22), tickled ? "#e8f060" : "#9ac040");
      cc.px(x + w * 0.5, y + h * 0.2, "#4a2a10");
      if (tickled) { cc.px(x + w * 0.45, y + h * 0.45, "#111"); cc.px(x + w * 0.56, y + h * 0.45, "#111"); }
    });
  };
  return {
    ...scene(cam, [floorPoly(cam, -6.4, 3.4, 124)], 124), bg: c,
    spots: {
      porta: hbBack(cam, -1.9, 1.9, 0, 5.4, zb, 1),
      gransalo: hbSide(cam, xl, 11.5, 13.7, 0, 3.5, 3),
      escala: [[226, 60], [318, 60], [318, 160], [226, 160]],
      masmorres: hbBox(cam, -5.0, -3.0, -0.5, 0.2, 6.3, 8.0, 2),
      rellotges: hbBox(cam, -6.3, -3.4, 0, 3.15, zb - 0.6, zb - 0.1, 1),
      cuines: hbBack(cam, -2.75, -1.85, 0, 1.4, zb, 0),
    },
    pts: { filch: at(cam, 0.4, 13.6), dePorta: at(cam, 0, 14.6), deGransalo: at(cam, -5.6, 12.6), deEscala: at(cam, 3.0, 11.0), deMasmorra: at(cam, -2.2, 8.8), deCuines: at(cam, -2.3, 14.8) },
    objs: { porta: cut(doorMain(false), doorMain(true)), pera: cutAnim([0, 1, 2, 3, 0, 0, 0, 0].map((f) => pear(false, f)), pear(true)) },
  };
}

/* 5. Gran Saló */
export function gransalo() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -7.5, xr = 7.5, zb = 30;
  // sostre encantat: cel de nit amb núvols
  nightSky(c, 120, { top: "#0a0e2a", bottom: "#28305a", moon: [70, 22, 7], seed: 21 });
  const r = rng(4);
  c.clouds = Array.from({ length: 6 }, () => [20 + r() * 280, 20 + r() * 40, 18 + r() * 20, 3 + r() * 2]);
  if (!theme()?.fx) for (const [x, y, rx, ry] of c.clouds) c.ellipse(x, y, rx, ry, [120, 130, 170, 60]);
  stoneSide(c, cam, xl, 0.5, zb, 0, 8, "#5e5668", "#474052", { h: 0.6, w: 1.2 });
  stoneSide(c, cam, xr, 0.5, zb, 0, 8, "#585062", "#474052", { h: 0.6, w: 1.2 });
  stoneBack(c, cam, xl, xr, 0, 8, zb, "#665e70", "#4d4658", { h: 0.6, w: 1.2 });
  // vora de dalt de les parets (on comença el cel)
  seg(c, cam, [xl, 8, 0.5], [xl, 8, zb], "#3a3444"); seg(c, cam, [xr, 8, 0.5], [xr, 8, zb], "#3a3444"); seg(c, cam, [xl, 8, zb], [xr, 8, zb], "#3a3444");
  tiles(c, cam, xl, xr, 0.5, zb, 1.5, "#6e6672", "#5e5662", { fog: "#1e1a2c", fogAmt: 0.5, zFog: 30 });
  // finestrals i estendards de les cases
  for (const z of [12, 18, 24]) { sideWindow(c, cam, xl, z, z + 1.6, 2.2, 5.5); sideWindow(c, cam, xr, z, z + 1.6, 2.2, 5.5); }
  const houses = ["#9a1c1c", "#1f6a30", "#c8a020", "#22408a"];
  houses.forEach((col, i) => { const x = -6 + i * 4; banner(c, cam, x - 0.5, x + 0.5, 3.6, 6.6, zb - 0.02, col, "#e8d8a0"); });
  // tarima i taula dels professors
  box(c, cam, xl, xr, 0, 0.5, 26.5, zb, { front: "#4a3a2a", top: "#5a4636" });
  table(c, cam, -5.5, 5.5, 27.5, 28.4, 1.25, "#5a3a20", { cloth: "#c8b890" });
  for (let x = -5; x <= 5; x += 1.25) box(c, cam, x, x + 0.5, 0.5, 2.0, 28.8, 29.1, { front: "#6a4a2a" });
  box(c, cam, -0.5, 0.5, 0.5, 2.6, 28.8, 29.1, { front: "#c9a227" });
  // quatre taules llargues de les cases amb bancs
  for (const x of [-5, -2, 2, 5]) {
    bench(c, cam, x - 0.95, x - 0.6, 9, 25.5, 0.45, "#4a3020");
    table(c, cam, x - 0.5, x + 0.5, 9, 25.5, 0.75, "#5a3a20", { cloth: "#5a3a20" });
    for (let z = 10; z < 25; z += 1.6) { const [px, py] = cam.p(x, 0.76, z); c.rect(px - 1, py - 1, 2, 1, "#c9a227"); }
    bench(c, cam, x + 0.6, x + 0.95, 9, 25.5, 0.45, "#4a3020");
  }
  // espelmes i carbasses que suren
  for (let z = 10; z < 28; z += 2.2) for (const x of [-6, -3.5, -1, 1, 3.5, 6]) candle(c, cam, x + (r() - 0.5), 4.6 + r() * 1.2, z + r());
  for (let k = 0; k < 9; k++) {
    const [px, py] = cam.p(-6 + r() * 12, 3.6 + r() * 1.6, 11 + r() * 15), s = cam.s(11 + k);
    const rr = Math.max(2, Math.round(s * 0.28));
    (c.pumpkins ??= []).push([px, py, rr]);
    if (theme()?.fx) continue;
    c.circle(px, py, rr, "#e07a1a"); c.rect(px - 1, py - rr - 1, 2, 2, "#2a5a1a");
    c.px(px - 1, py - 1, "#ffe060"); c.px(px + 1, py - 1, "#ffe060"); c.rect(px - 1, py + 1, 3, 1, "#ffe060");
  }
  const band = floorPoly(cam, -7.2, 7.2, 158), aisle = floorPoly(cam, -0.95, 0.95, 92, 162);
  return {
    cam, walk: [band, aisle], ah: cam.actor(92, 197), bg: c,
    spots: {
      vestibul: [[296, 150], [319, 150], [319, 199], [296, 199]],
      sostre: [[0, 0], [319, 0], [319, 34], [0, 34]],
      professors: hbBox(cam, -5.5, 5.5, 0.5, 2.6, 27.5, 29.1, 1),
      taules: hbBox(cam, -5.5, -1.5, 0, 0.8, 9, 25.5, 0),
      taules2: hbBox(cam, 1.5, 5.5, 0, 0.8, 9, 25.5, 0),
      estendards: hbBack(cam, -6.5, 6.5, 3.6, 6.6, zb, 1),
    },
    pts: { nick: at(cam, 2.6, 7.6), deVestibul: at(cam, 6.0, 7.4), xiulet: at(cam, 0.35, 23.5), xiuletWalk: at(cam, 0, 22.8) },
    objs: {
      xiulet: cut((k) => { const [x, y] = cam.p(0.35, 0, 23.5); k.rect(x - 2, y - 2, 4, 2, "#c0c0c8"); k.px(x + 2, y - 2, "#e0e0e8"); k.px(x - 3, y - 3, "#d8b020"); }),
    },
  };
}

/* 6. Biblioteca */
export function biblioteca() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -5, xr = 5, zb = 16, hgt = 5.5;
  room(c, cam, { xl, xr, zb, hgt, wall: "#5a4a48", joint: "#463a38", ceil: "#22181a",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.45, "#5e4028", "#4a3220") });
  beams(c, cam, xl, xr, hgt, 6, zb - 0.5, 2, "#2e2018");
  for (let x = -4.6; x < 4.5; x += 1.5) shelfBack(c, cam, x, x + 1.4, 4.4, zb, Math.round(x * 10 + 50));
  shelfSide(c, cam, xl, 7, 15.4, 4.4, 7);
  shelfSide(c, cam, xr, 7, 15.4, 4.4, 8);
  // Secció Prohibida (al fons a la dreta): llibres foscos amb cadenes, rètol
  backQ(c, cam, 1.4, 4.9, 0, 4.4, zb - 0.45, [20, 10, 20, 150]);
  for (let y = 0.4; y < 4; y += 0.55) seg(c, cam, [1.4, y, zb - 0.46], [4.9, y + 0.2, zb - 0.46], "#8a8a8a");
  box(c, cam, 1.4, 1.5, 0, 2.4, 13.6, zb - 0.4, { front: "#3a2412" });
  const [sx, sy] = cam.p(3.2, 3.0, 13.5);
  c.rect(sx - 26, sy - 2, 52, 9, "#2a1010"); c.text(Math.round(sx - Canvas.textWidth("PROHIBIDA") / 2), Math.round(sy), "PROHIBIDA", "#e04040");
  // faristol amb el llibre (fons dret, darrere el cordó)
  box(c, cam, 3.0, 3.4, 0, 1.0, 14.2, 14.6, { front: "#3a2412", top: "#4a2e18" });
  // taula de lectura (esquerra) i taulell de Madame Pince (dreta)
  table(c, cam, -4.4, -3.4, 8.8, 10.8, 0.75, "#5a3a20");
  const [lx, ly] = cam.p(-3.9, 0.76, 9.6); c.rect(lx - 1, ly - 6, 2, 6, "#3a3a3a"); c.circle(lx, ly - 7, 3, "#ffd27a"); c.circle(lx, ly - 7, 8, [255, 210, 120, 30]);
  box(c, cam, -4.2, -3.7, 0.76, 0.86, 10.0, 10.4, { front: "#2a4a8b" }); box(c, cam, -4.15, -3.75, 0.86, 0.94, 10.05, 10.35, { front: "#8b2a2a" });
  box(c, cam, 3.2, 4.5, 0, 1.1, 8.2, 9.8, { front: "#4a2e18", top: "#5a3a20" });
  const [bx, by] = cam.p(3.8, 1.1, 8.8); c.rect(bx - 3, by - 3, 6, 3, "#6b2a2a");
  // espelmes
  for (const z of [8, 11, 14]) { candle(c, cam, -2, 3.8, z); candle(c, cam, 2, 3.8, z); }
  const book = (k) => { const [x, y] = cam.p(3.2, 1.0, 14.4); k.rect(x - 4, y - 3, 8, 3, "#1a1a1a"); k.rect(x - 3, y - 3, 6, 1, "#5a0a0a"); k.px(x, y - 2, "#e8c040"); k.line(x - 5, y - 1, x + 6, y - 6, "#909090"); };
  const rope = (k) => { for (const x of [1.6, 3.2, 4.8]) box(k, cam, x - 0.06, x + 0.06, 0, 0.95, 13.2, 13.32, { front: "#c9a227" }); for (let x = 1.6; x < 4.8; x += 0.1) { const t = ((x - 1.6) % 1.6) / 1.6; const y = 0.85 - Math.sin(t * Math.PI) * 0.2; seg(k, cam, [x, y, 13.26], [x + 0.1, y, 13.26], "#a01818"); } };
  return {
    ...scene(cam, [floorPoly(cam, -3.2, 3.0, 125)], 125), bg: c,
    spots: {
      sortida: [[0, 176], [60, 176], [60, 199], [0, 199]],
      prestatges: hbSide(cam, xl, 7, 15.4, 0, 4.4, 0),
      prestatges2: hbSide(cam, xr, 7, 12.8, 0, 4.4, 0),
      prohibida: hbBack(cam, 1.4, 4.9, 1.2, 4.4, zb - 0.4, 0),
      taula: hbBox(cam, -4.4, -3.4, 0, 1.0, 8.8, 10.8, 1),
      taulell: hbBox(cam, 3.2, 4.5, 0, 1.2, 8.2, 9.8, 1),
    },
    pts: { hermione: at(cam, -2.6, 10.2), pince: at(cam, 2.5, 10.6), arribada: at(cam, -2.4, 7.4), llibreWalk: at(cam, 2.8, 13.0), cordaWalk: at(cam, 2.2, 12.8) },
    objs: { llibre: cut(book), corda: cut(rope) },
  };
}

/* 7. Masmorra de Pocions */
export function masmorra() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -5.5, xr = 5.5, zb = 14, hgt = 4.2;
  room(c, cam, { xl, xr, zb, hgt, wall: "#4a5450", joint: "#38403e", ceil: "#1a201e",
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 1, "#525c58", "#46504c", { fog: "#101614", fogAmt: 0.4, zFog: 14 }) });
  // voltes
  for (let z = 5; z < zb; z += 2.5) for (let k = 0; k < 10; k++) { const a0 = (k / 10) * Math.PI, a1 = ((k + 1) / 10) * Math.PI; seg(c, cam, [xl + (1 - Math.cos(a0)) * (xr - xl) / 2, hgt - 0.6 + Math.sin(a0) * 0.6, z], [xl + (1 - Math.cos(a1)) * (xr - xl) / 2, hgt - 0.6 + Math.sin(a1) * 0.6, z], "#2a3230"); }
  // pissarra amb la recepta d'avui
  backQ(c, cam, -2.2, 2.2, 1.2, 3.0, zb - 0.02, "#4a3a2a"); backQ(c, cam, -2.05, 2.05, 1.3, 2.9, zb - 0.03, "#1e2a24");
  const [tx, ty] = cam.p(-1.9, 2.75, zb); c.text(Math.round(tx), Math.round(ty), "FILTRE DE", "#d8e0d8"); c.text(Math.round(tx), Math.round(ty) + 7, "LA PAU", "#d8e0d8");
  // prestatges de pots a l'esquerra (pla X)
  const r = rng(13);
  for (let y = 0.8; y < 3.4; y += 0.65) {
    box(c, cam, xl, xl + 0.4, y - 0.06, y, 7.5, 13.5, { front: "#3a2a1a", top: "#4a3a2a", side: "#4a3a2a" });
    for (let z = 7.7; z < 13.3; z += 0.32) { const jar = ["#6aa84f", "#a84f6a", "#4f6aa8", "#c8b040", "#8a5ac8"][Math.floor(r() * 5)]; box(c, cam, xl + 0.1, xl + 0.32, y, y + 0.3 + r() * 0.15, z, z + 0.2, { front: jar, top: mix(jar, "#fff", 0.3) }); }
  }
  // armari d'ingredients (dreta) i pupitres al fons
  box(c, cam, xr - 0.5, xr, 0, 2.6, 10.5, 12.8, { front: "#3a2a1a", side: "#4a3424" });
  for (const x of [-3.6, 2.0]) { table(c, cam, x, x + 1.6, 12.6, 13.4, 0.8, "#4a3424"); const [px, py] = cam.p(x + 0.8, 0.8, 13.0); c.ellipse(px, py - 2, 4, 3, "#2a2a2a"); }
  torch(c, cam, -4, 2.3, zb - 0.05); torch(c, cam, 4, 2.3, zb - 0.05);
  // escala de pujada al vestíbul (davant a l'esquerra)
  stairsUp(c, cam, -5.4, -4.0, 6.4, 5, 0.4, 0.3, "#525c58");
  const cauldron = (st, f = 0, N = 1) => (k) => {
    const X = 2.9, Z = 8.8, [x, y] = cam.p(X, 0, Z), s = cam.s(Z);
    // foc a sota
    if (st === "bull" || st === "llest") fire(k, cam, X, Z - 0.1, 0.8, 6); else { k.rect(x - s * 0.35, y - 2, s * 0.7, 2, "#3a2a1a"); }
    k.ellipse(x, y - s * 0.42, s * 0.45, s * 0.38, "#2a2a2e");
    k.ellipse(x - s * 0.12, y - s * 0.52, s * 0.12, s * 0.1, "#4a4a50");
    k.ellipse(x, y - s * 0.78, s * 0.47, s * 0.1, "#1a1a1e");
    const liquid = { buit: null, aigua: "#4a7ab8", ingredients: "#7a6ab0", bull: "#8a5ac8", llest: "#e8c84a" }[st];
    if (liquid) k.ellipse(x, y - s * 0.78, s * 0.38, s * 0.07, liquid);
    // bombolles que pugen i rebenten (més com més calent)
    const n = { aigua: 2, ingredients: 4, llest: 7 }[st] ?? 0;
    for (let i = 0; i < n; i++) { const rr = rng(i * 7 + 1), ph = (f / N + rr()) % 1; k.circle(x + (rr() - 0.5) * s * 0.6, y - s * (0.82 + ph * (st === "llest" ? 0.7 : 0.25)), ph > 0.8 ? 2 : 1, mix(liquid, "#fff", 0.4)); }
    if (st === "llest") for (let i = 0; i < 3; i++) { const ph = (f / N + i / 3) % 1; k.circle(x + Math.sin(ph * 6 + i) * s * 0.15, y - s * (1.0 + ph * 0.9), Math.max(1, s * 0.08 * (1 - ph)), [230, 220, 160, 110]); }
  };
  return {
    ...scene(cam, [floorPoly(cam, -3.8, 4.6, 130)], 130), bg: c,
    spots: {
      escala: hbBox(cam, -5.4, -4.0, 0, 1.6, 6.4, 8.4, 2),
      pots: hbSide(cam, xl, 7.5, 13.5, 0.7, 3.5, 0),
      pissarra: hbBack(cam, -2.2, 2.2, 1.2, 3.0, zb, 0),
      armari: hbBox(cam, xr - 0.5, xr, 0, 2.6, 10.5, 12.8, 0),
    },
    pts: { snape: at(cam, -0.4, 12.0), arribada: at(cam, -3.2, 8.2), calderWalk: at(cam, 2.0, 8.2) },
    objs: { calder: cutAnim(cauldron("buit"), ...["aigua", "ingredients", "llest"].map((st) => frames(8, (k, f, N) => cauldron(st, f, N)(k)))) },
  };
}

/* 8. Lavabo de la Myrtle */
export function lavabo() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -4.5, xr = 4.5, zb = 12, hgt = 4.2;
  room(c, cam, { xl, xr, zb, hgt, wall: "#9aa89a", joint: "#7a887a", ceil: "#3a443a", stone: { h: 0.3, w: 0.3 },
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 0.6, "#c8d0c0", "#3a5a4a") });
  // miralls i piques al fons
  for (let x = -3.6; x < 1.6; x += 1.3) {
    backQ(c, cam, x, x + 0.9, 1.3, 2.4, zb - 0.02, "#6a7a80"); backQ(c, cam, x + 0.05, x + 0.85, 1.35, 2.35, zb - 0.03, "#a8c0c8");
    seg(c, cam, [x + 0.2, 2.2, zb - 0.04], [x + 0.5, 1.6, zb - 0.04], "#e0f0f0");
    box(c, cam, x + 0.05, x + 0.85, 0.75, 0.9, zb - 0.55, zb, { front: "#e8ece4", top: "#d0d8d0" });
    box(c, cam, x + 0.35, x + 0.55, 0, 0.75, zb - 0.35, zb - 0.15, { front: "#d0d8d0" });
  }
  // cabines a la dreta
  for (let z = 8; z < 11.8; z += 1.3) box(c, cam, xr - 1.3, xr - 1.25, 0, 2.2, z, z + 1.25, { front: "#5a7a6a", side: "#4a6a5a" });
  for (let z = 8; z < 11.8; z += 1.3) { sideQ(c, cam, xr - 1.3, z + 0.08, z + 1.15, 0.2, 2.0, "#6a8a7a"); }
  // bassal al terra
  fill(c, Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return cam.p(-0.5 + Math.cos(a) * 1.2, 0, 9 + Math.sin(a) * 0.6); }), [120, 160, 200, 120]);
  gothicWindow(c, cam, 2.2, 3.0, 1.8, 3.4, zb, { moon: true });
  const trevor = (k, f) => { const [x, y] = cam.p(-0.85, 0.9, zb - 0.3); k.ellipse(x, y - 2, 4, 2, "#6a7a2a"); if (f === 2 || f === 3) k.ellipse(x, y - 1, 2, 1, "#c8c870"); k.rect(x - 3, y - 4, 2, 1, "#8a9a3a"); k.rect(x + 1, y - 4, 2, 1, "#8a9a3a"); if (f !== 5) { k.px(x - 2, y - 4, "#111"); k.px(x + 2, y - 4, "#111"); } k.rect(x - 4, y - 1, 2, 1, "#5a6a1a"); k.rect(x + 2, y - 1, 2, 1, "#5a6a1a"); };
  return {
    ...scene(cam, [floorPoly(cam, -4.1, 2.9, 136)], 136), bg: c,
    spots: {
      sortida: [[0, 176], [70, 176], [70, 199], [0, 199]],
      piques: hbBox(cam, -3.6, 1.0, 0, 2.4, zb - 0.55, zb, 0),
      cabines: hbBox(cam, xr - 1.3, xr - 1.25, 0, 2.2, 8, 11.9, 2),
      bassal: hbBox(cam, -1.7, 0.7, 0, 0.05, 8.4, 9.6, 1),
    },
    pts: { myrtle: at(cam, 2.3, 9.6), arribada: at(cam, -3.0, 7.6), trevorWalk: at(cam, -0.9, 11.0) },
    objs: { trevor: cutAnim(frames(6, (k, f) => trevor(k, f))) },
  };
}

/* 9. Cuines */
export function cuines() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -6, xr = 6, zb = 15, hgt = 4.8;
  room(c, cam, { xl, xr, zb, hgt, wall: "#7a6050", joint: "#5e4838", ceil: "#2a1e18",
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 1, "#8a6a50", "#7a5a40") });
  beams(c, cam, xl, xr, hgt, 5, zb - 0.5, 2, "#3a2818");
  // gran llar de foc amb olles
  box(c, cam, -2.6, 2.6, 0, 2.8, zb - 0.8, zb, { front: "#6a5a50", top: "#7a6a60" });
  backQ(c, cam, -2.0, 2.0, 0, 1.8, zb - 0.81, "#1a0e0a");
  fire(c, cam, -0.8, zb - 0.9, 1.0, 9); fire(c, cam, 0.9, zb - 0.9, 1.0, 10);
  for (const x of [-0.8, 0.9]) { const [px, py] = cam.p(x, 0.5, zb - 0.95), s = cam.s(zb - 0.95); c.ellipse(px, py - s * 0.3, s * 0.45, s * 0.38, "#2a2a2e"); }
  // paelles de coure a la paret
  const r = rng(8);
  for (let x = -5.4; x < 5.5; x += 0.9) { if (Math.abs(x) < 2.8) continue; const [px, py] = cam.p(x, 2.6 + r() * 0.5, zb - 0.02), s = cam.s(zb); c.circle(px, py, Math.max(2, s * (0.2 + r() * 0.12)), "#c87a3a"); c.circle(px - 1, py - 1, 1, "#f0a860"); c.rect(px, py - s * 0.5, 1, s * 0.3, "#5a3a1a"); }
  // taules llargues
  for (const x of [-4.4, 3.2]) table(c, cam, x, x + 1.2, 8.0, 13.6, 0.85, "#6a4a2a");
  // menjar a les taules
  for (let z = 8.4; z < 13.4; z += 0.7) for (const x of [-3.8, 3.8]) { const [px, py] = cam.p(x, 0.86, z); c.ellipse(px, py - 1, 3, 1, ["#c8c8c0", "#d89a3a", "#a04020"][Math.floor(r() * 3)]); }
  const granota = (k) => { box(k, cam, 3.5, 3.8, 0.86, 0.98, 8.3, 8.5, { front: "#6a2a8a", top: "#8a4aaa" }); const [x, y] = cam.p(3.65, 0.98, 8.4); k.px(x, y - 1, "#e8c040"); };
  return {
    ...scene(cam, [floorPoly(cam, -3.0, 3.0, 130)], 130), bg: c,
    spots: {
      sortida: [[260, 176], [319, 176], [319, 199], [260, 199]],
      foc: hbBox(cam, -2.6, 2.6, 0, 2.8, zb - 0.8, zb, 0),
      paelles: hbBack(cam, -5.6, -2.8, 2.0, 3.4, zb, 1),
      taula: hbBox(cam, -4.4, -3.2, 0, 1.0, 8.0, 13.6, 0),
    },
    pts: { dobby: at(cam, 0.9, 10.0), arribada: at(cam, 2.4, 7.4), granotaWalk: at(cam, 2.8, 8.6) },
    objs: { granota: cut(granota) },
  };
}

/* 10. Passadís de la gàrgola */
export function gargola() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -3, xr = 3, zb = 18, hgt = 4.6;
  room(c, cam, { xl, xr, zb, hgt, wall: "#5e5668", joint: "#474052", ceil: "#1e1a26",
    floor: () => { tiles(c, cam, xl, xr, 0.5, zb, 0.75, "#6a6272", "#5a5262", { fog: "#14121c", fogAmt: 0.4 }); floorQ(c, cam, -1.2, 1.2, 0.5, zb, [140, 30, 30, 110]); } });
  for (let z = 7; z < zb; z += 3) { torch(c, cam, xl + 0.05, 2.2, z); torch(c, cam, xr - 0.05, 2.2, z + 1.5); }
  for (const z of [9, 14]) { sideWindow(c, cam, xl, z, z + 1, 1.8, 3.2); }
  // armadura a la dreta
  const [ax, ay] = cam.p(xr - 0.4, 0, 10), s = cam.s(10);
  c.rect(ax - s * 0.2, ay - s * 1.8, s * 0.4, s * 1.8, "#9aa0a8"); c.rect(ax - s * 0.15, ay - s * 2.1, s * 0.3, s * 0.3, "#b8c0c8"); c.rect(ax + s * 0.25, ay - s * 2.4, 1, s * 2.4, "#c0c0c8");
  // fornícula del fons
  backQ(c, cam, -1.3, 1.3, 0, 3.6, zb - 0.02, "#2a2632");
  backQ(c, cam, -1.0, 1.0, 0, 3.2, zb - 0.35, "#0e0c14");
  for (let i = 0; i < 6; i++) box(c, cam, -0.8 + (i % 2) * 0.3, 0.5 + (i % 2) * 0.3, i * 0.45, i * 0.45 + 0.12, zb - 0.4, zb - 0.35, { front: "#8a8292" });
  const garg = (open, f = 0) => (k) => {
    const Z = zb - 0.3, [x, y] = cam.p(0, 0, Z), s2 = cam.s(Z);
    if (open) {
      // la gàrgola s'ha apartat
      const gx = x + s2 * 1.1; k.rect(gx - s2 * 0.3, y - s2 * 0.4, s2 * 0.6, s2 * 0.4, "#6a6272");
      k.ellipse(gx, y - s2 * 0.9, s2 * 0.3, s2 * 0.45, "#7a7282"); k.circle(gx, y - s2 * 1.45, s2 * 0.22, "#7a7282");
    } else {
      k.rect(x - s2 * 0.45, y - s2 * 0.5, s2 * 0.9, s2 * 0.5, "#6a6272");
      k.ellipse(x, y - s2 * 1.05, s2 * 0.38, s2 * 0.55, "#7a7282");
      fill(k, [[x - s2 * 0.35, y - s2 * 1.3], [x - s2 * 1.0, y - s2 * 1.9], [x - s2 * 0.2, y - s2 * 1.6]], "#6a6272");
      fill(k, [[x + s2 * 0.35, y - s2 * 1.3], [x + s2 * 1.0, y - s2 * 1.9], [x + s2 * 0.2, y - s2 * 1.6]], "#6a6272");
      k.circle(x, y - s2 * 1.75, s2 * 0.25, "#7a7282");
      const eye = ["#ffcc33", "#ffe680", "#ffcc33", "#c89020"][f % 4];
      k.px(x - 1, y - s2 * 1.8, eye); k.px(x + 1, y - s2 * 1.8, eye);
    }
  };
  return {
    ...scene(cam, [floorPoly(cam, -2.6, 2.6, 109)], 109), bg: c,
    spots: {
      sortida: [[0, 172], [80, 172], [80, 199], [0, 199]],
      armadura: hbBox(cam, xr - 0.6, xr - 0.2, 0, 2.4, 10, 10.2, 1),
      escala: hbBack(cam, -0.9, 0.9, 0, 3.0, zb - 0.35, 0),
      finestres: hbSide(cam, xl, 9, 10, 1.8, 3.4, 1),
    },
    pts: { mcgonagall: at(cam, -1.0, 11.5), arribada: at(cam, -1.4, 7.0), gargolaWalk: at(cam, 0, 16.6) },
    objs: { gargola: cutAnim([0, 1, 2, 3].map((f) => garg(false, f)), garg(true)) },
  };
}

/* 11. Despatx de Dumbledore */
export function despatx() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -5, xr = 5, zb = 13, hgt = 5.6;
  room(c, cam, { xl, xr, zb, hgt, wall: "#6a5478", joint: "#54406a", ceil: "#241a30",
    floor: () => { planks(c, cam, xl, xr, 0.5, zb, 0.4, "#5a3a2a", "#4a2e20"); fill(c, Array.from({ length: 28 }, (_, k) => { const a = (k / 28) * Math.PI * 2; return cam.p(Math.cos(a) * 3.2, 0, 9.8 + Math.sin(a) * 2.2); }), "#5a2a6a"); } });
  // retrats dels antics directors (dormint) a la paret del fons i a les laterals
  const cols = ["#5a2a2a", "#2a4a2a", "#2a2a5a", "#5a4a2a", "#4a2a4a"];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const x = -4.6 + i * 1.5; if (i === 4 && j === 0) continue; painting(c, cam, x, x + 1.0, 2.4 + j * 1.5, 3.6 + j * 1.5, zb, portraitFace("#e0c0a0", cols[(i + j) % 5], j ? "#8a8a8a" : "#3a2a1a", true)); }
  shelfSide(c, cam, xl, 8.5, 12.8, 2.0, 31);
  shelfSide(c, cam, xr, 10.2, 12.8, 2.0, 32);
  // instruments platejats
  const r = rng(3);
  for (let k = 0; k < 5; k++) { const [px, py] = cam.p(-4.6 + r() * 0.3, 2.0, 9 + k * 0.8); c.rect(px, py - 4, 3, 4, "#c0c8d0"); c.px(px + 1, py - 5, k % 2 ? "#60c0ff" : "#ff6060"); }
  const desk = (k) => {
    box(k, cam, -1.6, 1.6, 0, 0.85, 10.4, 11.3, { front: "#5a3018", top: "#6a3a20" });
    for (const x of [-1.0, 0.6]) backQ(k, cam, x, x + 0.4, 0.2, 0.6, 10.39, "#4a2610");
    const [px, py] = cam.p(-0.8, 0.86, 10.8); k.rect(px - 2, py - 4, 4, 4, "#c0c8d0"); k.circle(px, py - 5, 2, "#a0e0ff");
    const [qx, qy] = cam.p(0.9, 0.86, 10.7); k.rect(qx - 3, qy - 2, 6, 2, "#e8e0c8"); k.line(qx + 2, qy - 2, qx + 4, qy - 7, "#e8e0e8");
  };
  const fawkes = (st, f = 0, N = 1) => (k) => {
    const [x, y] = cam.p(-3.6, 0, 10.6), s = cam.s(10.6);
    k.rect(x - s * 0.25, y - 2, s * 0.5, 2, "#c9a227"); k.rect(x - 1, y - s * 1.6, 2, s * 1.6, "#c9a227"); k.rect(x - s * 0.35, y - s * 1.6, s * 0.7, 2, "#c9a227");
    const bx = x, by = y - s * 1.6, sw = wave(f, N) * s * 0.06, hb = f % 4 === 1 ? 1 : 0;
    k.rect(bx - s * 0.08 + sw, by - s * 0.05, Math.max(1, s * 0.08), s * 0.45, "#e8a020");
    k.ellipse(bx, by - s * 0.25, s * 0.16, s * 0.25, "#c8301a"); k.circle(bx + s * 0.06, by - s * 0.55 - hb, s * 0.1, "#d8401a");
    k.px(bx + s * 0.13, by - s * 0.56 - hb, "#e8c040");
    fill(k, [[bx - s * 0.1, by - s * 0.4], [bx - s * 0.4, by - s * 0.15], [bx - s * 0.1, by - s * 0.05]], st === "canta" ? "#f0c030" : "#a82a10");
    if (st === "canta") for (let i = 0; i < 3; i++) { const ph = (f / N + i / 3) % 1; k.rect(bx + s * (0.3 + ph * 0.5), by - s * (0.6 + ph * 0.6), 2, 2, "#ffe080"); k.px(bx + s * (0.3 + ph * 0.5) + 2, by - s * (0.6 + ph * 0.6) - 2, "#ffe080"); }
  };
  const shelf = (hat) => (k) => {
    box(k, cam, 2.5, 3.7, 1.55, 1.65, zb - 0.35, zb - 0.02, { front: "#4a2e18", top: "#5a3a20" });
    if (hat) {
      const [x, y] = cam.p(3.1, 1.65, zb - 0.18), s = cam.s(zb);
      k.ellipse(x, y - 1, s * 0.4, s * 0.08, "#6a5030");
      fill(k, [[x - s * 0.28, y - 2], [x + s * 0.28, y - 2], [x + s * 0.05, y - s * 0.75], [x + s * 0.25, y - s * 0.6]], "#7a5a38");
      k.rect(x - 3, y - s * 0.3, 2, 1, "#2a1a10"); k.rect(x + 1, y - s * 0.3, 2, 1, "#2a1a10"); k.rect(x - 2, y - s * 0.18, 4, 1, "#2a1a10");
    }
  };
  const pensieve = (k, f, N) => { const [x, y] = cam.p(3.7, 0, 9.0), s = cam.s(9.0); k.rect(x - s * 0.15, y - s * 0.8, s * 0.3, s * 0.8, "#8a8296"); k.ellipse(x, y - s * 0.85, s * 0.42, s * 0.14, "#9a92a6"); k.ellipse(x, y - s * 0.86, s * 0.34, s * 0.09, "#c8e8ff");
    for (let i = 0; i < 3; i++) { const a = (f / N + i / 3) * Math.PI * 2; k.px(x + Math.cos(a) * s * 0.25, y - s * 0.86 + Math.sin(a) * s * 0.06, "#ffffff"); }
    for (let i = 0; i < 2; i++) { const ph = (f / N + i / 2) % 1; k.px(x + (i ? 2 : -3), y - s * (0.95 + ph * 0.5), [220, 240, 255, 200 - ph * 160]); }
    k.circle(x, y - s * 0.86, s * 0.7, [180, 220, 255, 22 + wave(f, N) * 10]); };
  const U = [...floorPoly(cam, -4.4, 4.4, 141)];
  const armL = floorPoly(cam, -4.4, -2.0, 128, 145), armR = floorPoly(cam, 2.0, 4.4, 128, 145), back = floorPoly(cam, -4.4, 4.4, 128, 134);
  return {
    cam, walk: [U, armL, armR, back], ah: cam.actor(128, 197), bg: c,
    spots: {
      sortida: [[0, 176], [70, 176], [70, 199], [0, 199]],
      retrats: hbBack(cam, -4.6, 3.0, 2.4, 5.1, zb, 0),
      instruments: hbSide(cam, xl, 8.5, 12.8, 0, 2.6, 0),
      finestra: hbBack(cam, -0.6, 0.6, 2.5, 5.2, zb, 1),
    },
    pts: { dumbledore: at(cam, 0, 11.8), arribada: at(cam, -2.6, 7.6), fawkesWalk: at(cam, -2.8, 9.8), shelfWalk: at(cam, 3.0, 12.2), pensWalk: at(cam, 2.8, 8.6), deskWalk: at(cam, 0, 9.8) },
    objs: { escriptori: cut(desk), fawkes: cutAnim(frames(8, (k, f, N) => fawkes("quiet", f, N)(k)), frames(8, (k, f, N) => fawkes("canta", f, N)(k))), prestatge: cut(shelf(false), shelf(true)), pensadora: cutAnim(frames(8, pensieve)) },
  };
}

/* 12. Torre d'Astronomia */
export function astronomia() {
  const cam = new Cam({ vx: 160, vy: 96, f: 250, E: 2.4 }), c = new Canvas(W, 200);
  nightSky(c, 120, { top: "#060a22", bottom: "#2a2a58", moon: [258, 26, 9], seed: 33 });
  const r = rng(7);
  // muntanyes llunyanes i el llac a sota
  fill(c, [[0, 100], [40, 84], [80, 94], [130, 80], [180, 92], [230, 78], [280, 90], [320, 84], [320, 120], [0, 120]], "#1a1c34");
  c.rect(0, 100, W, 20, "#141a36");
  for (let k = 0; k < 40; k++) c.px(r() * W, 101 + r() * 18, "#3a4a7a");
  // Mart, vermell i brillant (el que diuen els centaures)
  c.circle(64, 40, 2, "#ff5030"); c.circle(64, 40, 4, [255, 80, 48, 50]);
  // terra de la torre i ampit
  tiles(c, cam, -8, 8, 0.5, 11.2, 1, "#5a5262", "#4e4656");
  box(c, cam, -8, 8, 0, 1.0, 11.2, 11.6, { front: "#6a6272", top: "#7a7282" });
  for (let x = -7.5; x < 8; x += 1.2) box(c, cam, x, x + 0.6, 1.0, 1.4, 11.2, 11.6, { front: "#6a6272", top: "#8a8292" });
  // torreta de l'escala, a l'esquerra
  box(c, cam, -6.6, -4.2, 0, 3.4, 7.0, 10.0, { front: "#5e5668", side: "#6a6272", top: "#3a3444" });
  fill(c, [cam.p(-6.8, 3.4, 7.0), cam.p(-4.0, 3.4, 7.0), cam.p(-5.4, 5.6, 8.5)], "#3a2a4a");
  sideQ(c, cam, -4.2, 8.0, 9.2, 0, 2.2, "#140e18");
  const tele = (k) => {
    const [x, y] = cam.p(2.4, 0, 9.4), s = cam.s(9.4);
    k.line(x, y - s * 0.9, x - s * 0.4, y, "#4a3a2a"); k.line(x, y - s * 0.9, x + s * 0.4, y, "#4a3a2a"); k.line(x, y - s * 0.9, x, y, "#3a2a1a");
    fill(k, [[x - s * 0.5, y - s * 0.75], [x - s * 0.42, y - s * 0.62], [x + s * 0.75, y - s * 1.35], [x + s * 0.68, y - s * 1.48]], "#c9a227");
    k.rect(x + s * 0.66, y - s * 1.52, 3, 3, "#e8c84a");
  };
  return {
    ...scene(cam, [floorPoly(cam, -3.9, 6.6, 152)], 152), bg: c,
    spots: {
      porta: [[56, 118], [80, 118], [86, 160], [52, 160]],
      cel: [[0, 0], [319, 0], [319, 80], [0, 80]],
      mart: [[56, 32], [72, 32], [72, 48], [56, 48]],
      llac: [[100, 100], [319, 100], [319, 120], [100, 120]],
    },
    pts: { peeves: at(cam, -1.6, 8.6), arribada: at(cam, -2.6, 9.2), teleWalk: at(cam, 1.6, 8.8) },
    objs: { telescopi: cut(tele) },
  };
}

/* 13. Passadís del setè pis */
export function setena() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -3.5, xr = 3.5, zb = 20, hgt = 4.6;
  room(c, cam, { xl, xr, zb, hgt, wall: "#5a5468", joint: "#45405a", ceil: "#1c1a26",
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 0.7, "#6a6474", "#5c5666", { fog: "#14121c", fogAmt: 0.5 }) });
  for (let z = 7; z < zb; z += 4) { torch(c, cam, xl + 0.05, 2.3, z + 2); torch(c, cam, xr - 0.05, 2.3, z + 3.4); }
  // tapís de Barnabas el Barrut ensenyant ballet als trols
  sideQ(c, cam, xl + 0.02, 8.6, 13.2, 0.7, 3.3, "#8a6a3a"); sideQ(c, cam, xl + 0.03, 8.8, 13.0, 0.85, 3.15, "#a8402a");
  for (let k = 0; k < 3; k++) {
    const z = 9.4 + k * 1.3;
    sideQ(c, cam, xl + 0.04, z, z + 0.5, 1.2, 2.5, "#7a8a6a");            // trol
    quad(c, cam, [[xl + 0.045, 1.6, z - 0.25], [xl + 0.045, 1.6, z + 0.75], [xl + 0.045, 1.9, z + 0.25]], "#f0a0c0");   // tutú
    sideQ(c, cam, xl + 0.045, z + 0.15, z + 0.35, 2.5, 2.75, "#8a9a7a");
  }
  sideQ(c, cam, xl + 0.04, 12.4, 12.7, 1.0, 2.9, "#3a2a5a");                // Barnabas
  // escala al fons cap a la torre
  door(c, cam, -0.8, 0.8, 2.6, zb, { open: true });
  stairsUp(c, cam, -0.7, 0.7, zb - 1.0, 3, 0.3, 0.25, "#6a6474");
  const [tx, ty] = cam.p(0, 3.1, zb); c.text(Math.round(tx - Canvas.textWidth("TORRE") / 2), Math.round(ty), "TORRE", "#c8b88a");
  const doorRoom = (show) => show ? (k) => { sideQ(k, cam, xr - 0.02, 9.8, 11.4, 0, 2.6, "#3a2a1a"); sideQ(k, cam, xr - 0.03, 9.95, 11.25, 0, 2.45, "#7a4a22"); for (let z = 10.2; z < 11.2; z += 0.3) seg(k, cam, [xr - 0.04, 0, z], [xr - 0.04, 2.4, z], "#5a3418"); const [hx, hy] = cam.p(xr - 0.05, 1.1, 10.2); k.rect(hx - 1, hy, 2, 2, "#d8b24a"); } : null;
  return {
    ...scene(cam, [floorPoly(cam, -3.0, 3.0, 114)], 114), bg: c,
    spots: {
      sortida: [[0, 172], [80, 172], [80, 199], [0, 199]],
      torre: hbBack(cam, -0.8, 0.8, 0, 3.0, zb, 1),
      tapis: hbSide(cam, xl, 8.6, 13.2, 0.7, 3.3, 0),
      paret: hbSide(cam, xr, 9.8, 11.4, 0, 2.6, 2),
    },
    pts: { baro: at(cam, 0.6, 14.0), arribada: at(cam, -1.2, 7.4), deTorre: at(cam, 0, 18.4), paretWalk: at(cam, 2.4, 10.6), deSala: at(cam, 2.2, 10.8) },
    objs: { portasala: cut(doorRoom(true)) },
  };
}

/* 14. Sala dels Menesters (la de les coses amagades) */
export function sala() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -8, xr = 8, zb = 30;
  c.gradient(0, 0, W, 200, "#2a2236", "#14101c", 8);
  stoneBack(c, cam, xl, xr, 0, 14, zb, "#4a4258", "#3a3448", { h: 0.8, w: 1.6 });
  // llum que entra per finestres altíssimes
  for (const x of [-5, 0, 5]) { gothicWindow(c, cam, x - 0.6, x + 0.6, 6, 11, zb - 0.01); }
  floorQ(c, cam, xl, xr, 0.5, zb, "#3a3240");
  // muntanyes de trastos a banda i banda
  const r = rng(77), cols = ["#6a4a2a", "#4a3a5a", "#7a6a4a", "#3a4a3a", "#8a3a2a", "#5a5a6a", "#9a8a5a"];
  const piles = [];
  for (let z = 28; z > 7; z -= 1.4) for (const side of [-1, 1]) {
    let y = 0; const x0 = side < 0 ? xl : 2.0 + r() * 0.6, x1 = side < 0 ? -2.0 - r() * 0.6 : xr;
    const n = 2 + Math.floor(r() * 5);
    for (let k = 0; k < n; k++) {
      const w = 0.6 + r() * 1.6, h = 0.3 + r() * 0.9, xa = side < 0 ? x1 - w - r() * (x1 - x0 - w) : x0 + r() * (x1 - x0 - w);
      piles.push([xa, xa + w, y, y + h, z, z + 0.6 + r() * 0.7, cols[Math.floor(r() * cols.length)]]);
      y += h * 0.9;
    }
  }
  piles.sort((a, b) => b[4] - a[4]);
  for (const [x0, x1, y0, y1, z0, z1, col] of piles) box(c, cam, x0, x1, y0, y1, z0, z1, { front: col });
  // armari, gàbies, una cadira penjada... (detalls)
  for (let k = 0; k < 12; k++) { const [px, py] = cam.p(-6 + r() * 12, 4 + r() * 5, 14 + r() * 14); c.rect(px, py, 2, 2, cols[k % cols.length]); }
  // la gran torre de trastos del mig, al fons
  let y = 0;
  for (let k = 0; k < 9; k++) { const w = 1.6 - k * 0.13 + r() * 0.2, h = 0.45 + r() * 0.25; box(c, cam, -w / 2 + (r() - 0.5) * 0.3, w / 2 + (r() - 0.5) * 0.3, y, y + h, 16, 16 + w * 0.8, { front: cols[k % cols.length] }); y += h; }
  const topY = y;
  const hat = (k, f) => {
    const [x, yy] = cam.p(0, topY, 16.3), s = cam.s(16.3), m = f % 3 === 1 ? 1 : 0;
    k.ellipse(x, yy - 1, s * 0.45, s * 0.1, "#6a5030");
    fill(k, [[x - s * 0.3, yy - 2], [x + s * 0.3, yy - 2], [x + s * 0.06, yy - s * 0.85], [x + s * 0.3, yy - s * 0.7]], "#7a5a38");
    k.rect(x - 3, yy - s * 0.35, 2, 1, "#2a1a10"); k.rect(x + 1, yy - s * 0.35, 2, 1, "#2a1a10"); k.rect(x - 2, yy - s * 0.2 - m, 4, 1 + m, "#2a1a10");
  };
  return {
    ...scene(cam, [floorPoly(cam, -1.5, 1.5, 112, 160), floorPoly(cam, -5, 5, 156)], 112), bg: c,
    spots: {
      sortida: [[250, 176], [319, 176], [319, 199], [250, 199]],
      trastos: [[0, 60], [96, 60], [96, 150], [0, 150]],
      trastos2: [[224, 60], [319, 60], [319, 150], [224, 150]],
      torre: hbBox(cam, -1.0, 1.0, 0, topY - 0.1, 16, 17.3, 0),
    },
    pts: { arribada: at(cam, 3.4, 7.2), torreWalk: at(cam, 0, 15.2) },
    objs: { barret: cutAnim(frames(6, hat)) },
  };
}
