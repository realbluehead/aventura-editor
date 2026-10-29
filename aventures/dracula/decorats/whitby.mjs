// Acte II — Budapest, Whitby i la Lucy (10 decorats). Mateix contracte que transilvania.mjs.
import {
  sideExit, W, H, STD, Cam, newScene, scene, floorW, R, edgeL, edgeR, sky, mountains, forestSil, cobbleMat, waterMat, wallpaper, mat,
  hall, beamsX, figure, column, archBack, vault, facade, sideFacade, wallBack, grave, deadTree, crate, chandelier, candleAt,
  candelabra, curtains, rug, chair, bars, sideFrame, ship, gasLamp, mix, rng, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide,
  floorPoly, addLight, hb, hbBox, hbBack, hbSide, at, planks, tiles,
} from "./dcomu.mjs";
import { gothicWindow, sideWindow, door, sideDoor, shelfBack, torch } from "./persp.mjs";
import { table, bench, bed, armchair, fireplace, painting, portraitFace, stairsUp } from "./comu.mjs";

// Silueta de les ruïnes de l'abadia de Whitby (2D): base a (x, yb), s píxels per unitat
export function abbeySil(c, x, yb, s, col = "#161427", sky = "#3b3a5c") {
  c.rect(x, yb - s * 22, s * 30, s * 22, col);
  for (let k = 0; k < 5; k++) { const wx = x + s * (2 + k * 5.6), wy = yb - s * 18; fill(c, [[wx, yb - s * 6], [wx, wy + s * 2], [wx + s * 1.6, wy], [wx + s * 3.2, wy + s * 2], [wx + s * 3.2, yb - s * 6]], sky); }
  c.rect(x + s * 26, yb - s * 32, s * 4, s * 32, col);
  fill(c, [[x + s * 26, yb - s * 32], [x + s * 30, yb - s * 32], [x + s * 30, yb - s * 34], [x + s * 28, yb - s * 30]], col);
  for (let k = 0; k < 8; k++) c.rect(x + s * k * 3.6, yb - s * 23.5, s * 1.6, s * 1.6, col);
}
// Mar fins a l'horitzó, amb la columna de reflex de la lluna
function sea(c, cam, z0, moonX) { floorQ(c, cam, -60, 60, z0, 200, mat(waterMat("#161427", "#3b3a5c", moonX), "#1f1d36"), -0.4); }

/* 14. Hospital de Budapest */
export function budapest() {
  const { cam, c } = newScene(), xl = -5.5, xr = 5.5, zb = 14, hgt = 4.6;
  hall(c, cam, { xl, xr, zb, hgt, kind: "plaster", wall: "#b8bccb", joint: "#6b7287", ceil: "#4c5266",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.3, "#6e5638", "#3e2e22") });
  // llits de malalts a l'esquerra, amb llençols blancs
  for (const z of [7.4, 9.6, 11.8]) { box(c, cam, xl, xl + 2, 0, 0.6, z, z + 0.95, { front: "#4c5266", top: "#dcdbe0" }); box(c, cam, xl, xl + 0.1, 0.6, 1.3, z, z + 0.95, { front: "#4c5266" }); box(c, cam, xl + 0.2, xl + 0.7, 0.6, 0.75, z + 0.1, z + 0.85, { front: "#e8dcc0" }); }
  // creu a la paret, finestres altes i l'estufa de ferro amb el tub
  box(c, cam, -0.08, 0.08, 2.4, 3.6, zb - 0.02, zb, { front: "#3e2e22" }); box(c, cam, -0.4, 0.4, 3.1, 3.25, zb - 0.02, zb, { front: "#3e2e22" });
  for (const x of [-3, 3]) { backQ(c, cam, x - 0.7, x + 0.7, 1.6, 3.4, zb - 0.01, "#4c5266"); backQ(c, cam, x - 0.6, x + 0.6, 1.7, 3.3, zb - 0.02, "#2b2a48"); backQ(c, cam, x - 0.03, x + 0.03, 1.7, 3.3, zb - 0.03, "#4c5266"); }
  box(c, cam, 0.5, 1.3, 0, 1.1, 11.2, 11.9, { front: "#1f1d36", top: "#2b2a48" });
  backQ(c, cam, 0.7, 1.1, 0.3, 0.6, 11.18, "#f0a040"); addLight(c, 0.9, 0.5, 10.6, [1, 0.6, 0.3], 2.5, 0.9);
  box(c, cam, 0.8, 1.0, 1.1, hgt, 11.45, 11.65, { front: "#161427" });
  // una monja que passa, al fons
  figure(c, cam, 3.6, 12.6, { coat: "#161427", skin: "#c9b48a", scarf: "#dcdbe0", seed: 3 });
  const door1 = sideExit(c, cam, xr, { at: 8.2, w: 1.4, h: 2.4, wood: "#6e5638" });
  const sc = scene(cam, c, floorW(cam, -3.3, 5, 184), 184);
  sc.spots = {
    "ex-bp-estacio": door1,
    "ho-bp-estufa": hbBox(cam, 0.5, 1.3, 0, 1.6, 11.2, 11.9, 2),
    "ho-bp-llits": hbBox(cam, xl, xl + 2, 0, 1.3, 7.4, 12.8, 0),
  };
  sc.pts = { "c-agata": at(cam, 2.4, 9.4), "c-mina-bp": at(cam, -2.4, 8.8) };
  return sc;
}

/* 15. Port de Whitby */
export function whitbyPort() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [120, 30, 10], seed: 15, clouds: 6 });
  sea(c, cam, 12, 120);
  // l'East Cliff amb l'abadia, al fons
  fill(c, [[110, 108], [130, 86], [210, 82], [250, 92], [280, 108]], "#1f1d36");
  abbeySil(c, 168, 88, 2.2, "#161427", "#3b3a5c");
  // el moll de pedra en primer terme
  floorQ(c, cam, -14, 14, 0.5, 11.2, mat(cobbleMat("#4c5266"), "#4c5266"));
  box(c, cam, -14, 14, -0.8, 0, 11.2, 11.5, { front: "#2b2a48", top: "#4c5266" });
  for (let x = -6; x <= 6; x += 3) box(c, cam, x, x + 0.3, 0, 0.6, 10.9, 11.2, { front: "#161427" });
  // el Demeter amarrat a l'esquerra
  ship(c, cam, -10, -4, 12.6, { masts: 2, sails: false, waterY: -0.4 });
  // l'estació i les cases de la dreta
  facade(c, cam, 3.6, 9.4, 4.4, 14, { wall: "#6b0f1a", brick: true, seed: 6, door: 1, win: 3, roofH: 1.4, lit: 0.7 });
  { const [x, y] = cam.p(6.5, 3.7, 13.9); c.text(Math.round(x - 14), Math.round(y), "STATION", "#e8dcc0"); }
  gasLamp(c, cam, 2.6, 10.2); gasLamp(c, cam, -3, 10.4);
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 202), 202, { outdoor: true });
  sc.spots = {
    "ex-wp-demeter": hbBox(cam, -10, -4, -0.4, 6, 12.4, 12.8, 0),
    "ex-wp-escales": edgeR(202), "ex-wp-crescent": edgeL(202),
    "ex-wp-estacio": hbBack(cam, 3.6, 9.4, 0, 5, 14, 1),
    "ho-wp-abadia": R(160, 40, 80, 50),
  };
  sc.pts = { "c-guardacostes": at(cam, 3.2, 9.4) };
  return sc;
}

/* 16. Coberta del Demeter */
export function demeter() {
  const { cam, c } = newScene();
  sky(c, 240, { moon: null, top: "#07060b", bottom: "#2b2a48", seed: 16, clouds: 9, stars: 10 });
  sea(c, cam, 14, null);
  // la coberta i les bordes
  planks(c, cam, -7, 7, 0.5, 14, 0.3, "#6e5638", "#3e2e22");
  for (const x of [-6.6, 6.2]) box(c, cam, x, x + 0.4, 0, 1.1, 0.5, 14, { front: "#3e2e22", top: "#6e5638" });
  box(c, cam, -7, 7, 0, 1.1, 14, 14.4, { front: "#3e2e22", top: "#6e5638" });
  // el pal major amb les veles plegades, i el cordam
  box(c, cam, -0.18, 0.18, 0, 16, 11.8, 12.2, { front: "#3e2e22" });
  for (const y of [6, 10]) { box(c, cam, -4, 4, y, y + 0.2, 11.9, 12.1, { front: "#3e2e22" }); box(c, cam, -3.8, 3.8, y - 0.5, y, 11.85, 12.05, { front: "#6b7287" }); }
  for (const [x, z] of [[6.4, 6], [6.4, 9], [6.4, 12], [-6.4, 8], [-6.4, 11]]) seg(c, cam, [x, 1.1, z], [0, 14, 12], "#161427");
  for (let k = 0; k < 6; k++) seg(c, cam, [6.4, 1.1, 6 + k], [6.4, 8 - k * 0.6, 12], "#2b2a48");
  // escotilla, barrils i un fanal
  box(c, cam, -3, -1.2, 0, 0.4, 9.2, 10.6, { front: "#3e2e22", top: "#573056" });
  for (const [x, z] of [[3.4, 11], [4.2, 11.4], [3.8, 12.2]]) box(c, cam, x, x + 0.6, 0, 0.9, z, z + 0.6, { front: "#6e5638", top: "#3e2e22" });
  candleAt(c, cam, -0.2, 2.4, 11.6, 0.7);
  const sc = scene(cam, c, floorW(cam, -5.8, 5.8, 180), 180, { outdoor: true });
  sc.spots = {
    "ex-dm-port": edgeL(190),
    "ho-dm-cordam": R(240, 20, 80, 170),
    "ho-dm-veles": R(60, 0, 200, 68),
  };
  sc.pts = { "o-capita": at(cam, -1.8, 11.6), "o-quadern": at(cam, 1.8, 9.6) };
  return sc;
}

/* 17. Les 199 escales */
export function escales() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [250, 26, 9], seed: 17, clouds: 5 });
  // l'església de Santa Maria i l'abadia dalt de tot
  abbeySil(c, 210, 64, 1.4, "#161427", "#2b2a48");
  // l'escala que puja cap al fons, a la dreta, amb barana
  floorQ(c, cam, -14, 14, 0.5, 30, mat(cobbleMat("#3b3a5c"), "#3b3a5c"));
  for (let k = 0; k < 26; k++) box(c, cam, 1.4, 4.6, k * 0.3, (k + 1) * 0.3, 11 + k * 0.45, 11.45 + k * 0.45, { front: mix("#4c5266", "#000", (k % 2) * 0.12), top: "#6b7287" });
  for (let k = 0; k < 26; k += 2) box(c, cam, 4.6, 4.7, k * 0.3, k * 0.3 + 1, 11 + k * 0.45, 11.1 + k * 0.45, { front: "#161427" });
  // les cases de pescadors, a l'esquerra
  sideFacade(c, cam, -3.6, 3, 9, 4.6, { wall: "#8f97a8", seed: 2, win: 3, lit: 0.6 });
  sideFacade(c, cam, -3.6, 9.4, 15, 5.2, { wall: "#a08458", seed: 3, win: 3, lit: 0.5 });
  quad(c, cam, [[-3.6, 4.6, 3], [-3.6, 4.6, 9], [-5.4, 6.6, 9], [-5.4, 6.6, 3]], "#3f2343");
  quad(c, cam, [[-3.6, 5.2, 9.4], [-3.6, 5.2, 15], [-5.4, 7.2, 15], [-5.4, 7.2, 9.4]], "#2a1830");
  facade(c, cam, -3.6, 1.2, 5.6, 16, { wall: "#6b7287", seed: 4, roofH: 1.8 });
  gasLamp(c, cam, 0.8, 10.6);
  const sc = scene(cam, c, [floorPoly(cam, -2.8, 4.4, 192).map(([x, y]) => [Math.max(64, x), y])], 192, { outdoor: true });
  sc.spots = {
    "ex-es-port": R(62, 192, 22, 47),
    "ex-es-cementiri": hbBox(cam, 1.4, 4.6, 0, 6, 11, 22, 0),
    "ho-es-cases": R(0, 0, 62, 239),
  };
  sc.pts = { "c-swales": at(cam, 0.4, 9.6) };
  return sc;
}

/* 18. Cementiri de l'East Cliff */
export function cementiriWhitby() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [70, 34, 11], seed: 18, clouds: 6 });
  sea(c, cam, 30, 70);
  floorQ(c, cam, -14, 14, 0.5, 24, mat(cobbleMat("#2f4237"), "#2f4237"));
  floorQ(c, cam, -14, 14, 0.5, 24, "#2f4237", 0.005);
  // les ruïnes al fons i el camí que hi porta
  abbeySil(c, 150, 104, 1.6, "#161427", "#2b2a48");
  floorQ(c, cam, -0.6, 0.8, 9, 30, "#4c5266", 0.01);
  // l'església a la dreta
  sideFacade(c, cam, 5.4, 9, 18, 4.4, { wall: "#6b7287", seed: 9, win: 2, floors: 1, lit: 0.6 });
  box(c, cam, 5.4, 8, 0, 9, 9, 11.4, { front: "#4c5266", side: "#3b3a5c" });
  for (let x = 5.4; x < 8; x += 0.6) box(c, cam, x, x + 0.3, 9, 9.4, 9, 9.3, { front: "#4c5266" });
  // làpides tortes i el banc de la Lucy
  for (const [x, z, k, t] of [[-5.2, 12, 0, 0], [-3.6, 13.2, 1, 0], [-4.4, 10.6, 0, 0.2], [-2, 12.6, 0, -0.1], [-6.2, 14.6, 2, 0], [-1.4, 15.4, 0, 0], [3, 14, 1, 0], [-3, 16.4, 0, 0.1]]) grave(c, cam, x, z, k, "#6b7287", t);
  box(c, cam, -3.6, -1.6, 0.42, 0.5, 9.6, 10.1, { front: "#3e2e22", top: "#6e5638" });
  box(c, cam, -3.6, -1.6, 0.5, 0.95, 10.0, 10.1, { front: "#3e2e22" });
  const sc = scene(cam, c, floorW(cam, -6, 5, 192), 192, { outdoor: true });
  sc.spots = {
    "ex-cw-escales": edgeL(192),
    "ex-cw-abadia": hbBox(cam, -0.6, 0.8, 0, 2.4, 14, 26, 6),
    "ho-cw-lapides": hbBox(cam, -6.4, -1.2, 0, 2, 12, 16.6, 1),
    "ho-cw-esglesia": hbBox(cam, 5.4, 8, 0, 9.4, 9, 18, 0),
  };
  sc.pts = { "o-lucy-banc": at(cam, -2.6, 9.9) };
  return sc;
}

/* 19. Ruïnes de l'abadia */
export function abadia() {
  const cam = new Cam({ ...STD, f: 260 }), { c } = newScene(cam);
  sky(c, 240, { moon: [262, 40, 12], seed: 19, clouds: 7 });
  floorQ(c, cam, -16, 16, 0.5, 40, "#2f4237");
  // la nau sense sostre: arcs apuntats, columnes i la rosassa buida
  const zw = 15;
  stoneBack(c, cam, -7, 7, 0, 11, zw, "#4c5266", "#2b2a48", { h: 0.6, w: 1 });
  for (const x of [-5.4, -2.4, 0.6, 3.6]) archBack(c, cam, x, x + 1.8, 7.2, zw - 0.01, { frame: "#3b3a5c", inside: "#2b2a48" });
  { const [x, y] = cam.p(0, 9.4, zw), r = cam.s(zw) * 1.1; c.circle(x, y, r + 2, "#3b3a5c"); c.circle(x, y, r, "#2b2a48"); }
  quad(c, cam, [[-7, 11, zw], [-3, 11, zw], [-5, 13, zw]], "#4c5266");
  for (const z of [9, 12]) { column(c, cam, -6, z, 6.5, 0.7, "#4c5266"); column(c, cam, 6, z, 4 + z * 0.1, 0.7, "#4c5266"); }
  // pedres caigudes i herba
  for (const [x, z, s] of [[-3.4, 10, 0.8], [2.6, 11.4, 0.6], [4.4, 9.4, 1], [-1, 13, 0.7]]) box(c, cam, x, x + s, 0, s * 0.6, z, z + s, { front: "#4c5266", top: "#6b7287" });
  const sc = scene(cam, c, floorW(cam, -5.4, 5.4, 190), 190, { outdoor: true });
  sc.spots = {
    "ex-ab-cementiri": edgeL(190),
    "ho-ab-ruines": hbBack(cam, -7, 7, 0, 13, zw, 0),
  };
  sc.pts = { "o-xal": at(cam, 2.4, 9.6), "o-gos": at(cam, 4.4, 10.4) };
  return sc;
}

/* 20. Casa dels Westenra (Whitby) */
export function crescent() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 13, hgt = 4.6;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#2f4237", joint: "#1c2a24", ceil: "#3b3a5c",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.25, "#6e5638", "#3e2e22") });
  rug(c, cam, -3.4, 2.6, 8, 12, "#3a0a10", "#a08458");
  fireplace(c, cam, -4.4, -2.4, zb, { stone: "#dcdbe0", h: 1.6 });
  painting(c, cam, -4, -2.8, 2.4, 3.4, zb, portraitFace("#e8dcc0", "#2a1830", "#6e5638"));
  // l'escala de les habitacions, al fons
  stairsUp(c, cam, -0.6, 1.0, 10.6, 8, 0.3, 0.3, "#6e5638");
  for (let k = 0; k < 8; k += 2) box(c, cam, 1.0, 1.06, k * 0.3, k * 0.3 + 1, 10.6 + k * 0.3, 10.66 + k * 0.3, { front: "#3e2e22" });
  // el llum de peu, la taula de la dreta, una butaca
  box(c, cam, 2.6, 2.7, 0, 1.9, 11.6, 11.7, { front: "#a08458" }); quad(c, cam, [[2.25, 1.8, 11.65], [3.05, 1.8, 11.65], [2.85, 2.3, 11.65], [2.45, 2.3, 11.65]], "#f0a040");
  addLight(c, 2.65, 2, 11.2, [1, 0.7, 0.4], 3.5, 1, { kind: "candle", ...(() => { const [x, y] = cam.p(2.65, 2.05, 11.65); return { fx: Math.round(x), fy: Math.round(y), sx: x, sy: y, sr: 10 }; })() });
  table(c, cam, 1.4, 4.6, 7.4, 9.2, 0.8, "#3e2e22", { cloth: "#8f97a8" });
  candleAt(c, cam, 3.2, 0.8, 8.4);
  armchair(c, cam, -1.8, -0.8, 11.4, 12.2, "#3a0a10");
  const sc = scene(cam, c, [floorPoly(cam, -4.6, 1.2, 186), ...[]], 186);
  sc.walk = [[...floorPoly(cam, -4.6, 0.8, 186), ...[]]];
  sc.spots = {
    "ex-cr-port": edgeL(192),
    "ex-cr-lucy": hbBox(cam, -0.6, 1.0, 0, 2.6, 10.6, 13, 2),
    "ho-cr-lampada": hbBox(cam, 2.2, 3.1, 1.7, 2.4, 11.6, 11.7, 2),
    "ho-cr-llar": hbBox(cam, -4.5, -2.3, 0, 3.5, 12.4, 13, 1),
    "ho-cr-taula": hbBox(cam, 1.4, 4.6, 0, 1.1, 7.4, 9.2, 1),
  };
  sc.pts = { "c-westenra-wh": at(cam, -1.4, 8.8) };
  return sc;
}

/* 21. Dormitori de la Lucy (Whitby) */
export function lucyWhitby() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 13, hgt = 4.4;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#573056", joint: "#3f2343", ceil: "#3b3a5c",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.25, "#6e5638", "#3e2e22") });
  // l'armari a l'esquerra
  box(c, cam, xl, xl + 0.7, 0, 2.6, 8.4, 10.6, { front: "#3e2e22", side: "#6e5638", top: "#3e2e22" });
  sideQ(c, cam, xl + 0.71, 9.5, 9.52, 0.2, 2.4, "#161427");
  // el quadre (un vaixell), la finestra alta, el llit
  painting(c, cam, -1.6, 0.4, 2.6, 3.8, zb, (k, x, y, w, h) => { k.rect(x, y, w, h, "#3b3a5c"); k.rect(x, y + h * 0.7, w, h * 0.3, "#1f1d36"); k.rect(x + w * 0.3, y + h * 0.35, w * 0.4, h * 0.35, "#dcdbe0"); k.rect(x + w * 0.48, y + h * 0.1, 1, h * 0.6, "#3e2e22"); });
  gothicWindow(c, cam, 2.4, 3.8, 2.4, 4.0, zb, { moon: true, glass: "#1f1d36", frame: "#3f2343" });
  curtains(c, cam, 2.4, 3.8, 2.4, 3.8, zb, "#dcdbe0");
  bed(c, cam, 1.2, 3.4, 9.6, 12.6, { curtain: "#dcdbe0", blanket: "#b8bccb", gold: "#a08458" });
  candleAt(c, cam, 4.2, 0.7, 12.2); box(c, cam, 3.9, 4.5, 0, 0.7, 12, 12.6, { front: "#3e2e22" });
  const door1 = sideExit(c, cam, xl, { at: 11, w: 1.4, h: 2.4, wood: "#6e5638" });
  const sc = scene(cam, c, floorW(cam, -4.2, 4.4, 184), 184);
  sc.spots = {
    "ex-lw-crescent": edgeL(196),
    "ho-lw-armari": hbBox(cam, xl, xl + 0.7, 0, 2.6, 8.4, 10.6, 1),
    "ho-lw-quadre": hbBack(cam, -1.6, 0.4, 2.6, 3.8, zb, 1),
    "ho-lw-finestra": hbBack(cam, 2.3, 3.9, 2.3, 4.4, zb, 1),
  };
  sc.pts = { "o-lucy-wh": at(cam, 2.3, 11.4, 0.6) };
  return sc;
}

/* 22. Hillingham (Londres) */
export function hillingham() {
  const { cam, c } = newScene(), xl = -5.5, xr = 5.5, zb = 14, hgt = 4.8;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#3f2343", joint: "#2a1830", ceil: "#4c5266",
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 0.6, "#6b7287", "#2b2a48") });
  fireplace(c, cam, -4.4, -2.2, zb, { stone: "#8f97a8", h: 1.7 });
  painting(c, cam, -4, -2.6, 2.4, 3.6, zb, portraitFace("#e8dcc0", "#6b0f1a", "#a08458"));
  // l'escala que puja al dormitori
  stairsUp(c, cam, 2, 3.6, 10, 9, 0.35, 0.32, "#6e5638");
  for (let k = 0; k < 9; k += 2) box(c, cam, 1.9, 1.96, k * 0.32, k * 0.32 + 1, 10 + k * 0.35, 10.06 + k * 0.35, { front: "#3e2e22" });
  // el llum de gas, una tauleta amb flors, la porta del carrer
  seg(c, cam, [0, hgt, 11.1], [0, 2.8, 11.1], "#161427"); quad(c, cam, [[-0.2, 2.8, 11.1], [0.2, 2.8, 11.1], [0.4, 2.45, 11.1], [-0.4, 2.45, 11.1]], "#f0a040");
  addLight(c, 0, 2.6, 10.6, [1, 0.8, 0.5], 4.5, 1.1, { kind: "candle", ...(() => { const [x, y] = cam.p(0, 2.65, 10.8); return { fx: Math.round(x), fy: Math.round(y), sx: x, sy: y, sr: 10 }; })() });
  table(c, cam, -1.4, -0.4, 12.4, 13.2, 0.8, "#3e2e22");
  for (let k = 0; k < 5; k++) { const [x, y] = cam.p(-0.9 + (k - 2) * 0.12, 1.1 + (k % 2) * 0.1, 12.8); c.circle(x, y, 1, k % 2 ? "#dcdbe0" : "#9e1a24"); }
  const door1 = sideExit(c, cam, xl, { at: 8.2, w: 1.6, h: 2.6, wood: "#3e2e22" });
  armchair(c, cam, -3.2, -2.2, 10.2, 11, "#2f4237");
  const sc = scene(cam, c, floorW(cam, -5, 5, 184), 184);
  sc.spots = {
    "ex-hl-dormitori": hbBox(cam, 2, 3.6, 0, 3.2, 10, 13.2, 2),
    "ex-hl-carrer": door1,
    "ho-hl-llar": hbBox(cam, -4.5, -2.1, 0, 3.6, 13.4, 14, 1),
    "ho-hl-llum": hbBox(cam, -0.4, 0.4, 2.4, 3, 10.8, 11.4, 2),
  };
  sc.pts = { "c-vh-hill": at(cam, 1.2, 9.4), "c-arthur-hill": at(cam, -2.4, 9.2) };
  return sc;
}

/* 23. Dormitori de la Lucy (Londres) */
export function hillinghamDormitori() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 13, hgt = 4.6;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#4c5266", joint: "#3b3a5c", ceil: "#3b3a5c",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.25, "#6e5638", "#3e2e22") });
  // la finestra de la paret esquerra (per on entra el llop), amb flors d'all a l'ampit
  sideWindow(c, cam, xl, 10.6, 12.2, 1.0, 2.8, { glass: "#1f1d36", frame: "#dcdbe0" });
  // el llit al mig, amb dosser blanc
  bed(c, cam, -1.1, 1.1, 9.8, 12.8, { curtain: "#dcdbe0", blanket: "#b8bccb", gold: "#8f97a8" });
  chandelier(c, cam, 0, 3.6, 9.2, hgt, 6, 0.6);
  box(c, cam, 2.4, 3.4, 0, 0.8, 11.6, 12.4, { front: "#3e2e22", top: "#6e5638" }); candleAt(c, cam, 2.9, 0.8, 12);
  chair(c, cam, 3.2, 9.4, "#6b0f1a");
  painting(c, cam, 2.2, 3.6, 2.2, 3.4, zb, portraitFace("#e8dcc0", "#dcdbe0", "#c9b48a"));
  const door1 = sideExit(c, cam, xr, { at: 7.6, w: 1.4, h: 2.4, wood: "#6e5638" });
  const sc = scene(cam, c, floorW(cam, -4.4, 4.6, 190), 190);
  sc.spots = {
    "ex-hd-baixar": door1,
    "ho-hd-finestra": hbSide(cam, xl, 10.4, 12.4, 0.8, 3.4, 1),
    "ho-hd-aranya": hbBox(cam, -0.7, 0.7, 3.4, hgt, 8.6, 9.8, 1),
  };
  sc.pts = { "o-lucy-hill": at(cam, 0, 11.4, 0.6), "o-westenra-hill": at(cam, 3, 9.2) };
  return sc;
}

export const ACTE2 = { budapest, "whitby-port": whitbyPort, demeter, escales, "cementiri-whitby": cementiriWhitby, abadia, crescent, "lucy-whitby": lucyWhitby, hillingham, "hillingham-dormitori": hillinghamDormitori };
