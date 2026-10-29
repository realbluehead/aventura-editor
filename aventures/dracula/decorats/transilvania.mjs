// Acte I — Transilvània: de l'hotel de Bistritz a la fugida del castell (13 decorats).
// Cada funció dibuixa el fons amb la seva càmera i torna la zona caminable, l'alçada dels actors, els punts calents
// (spots, per id del joc) i on van les coses (pts, per id de personatge o d'objecte). Tot en píxels de 320×240.
import {
  sideExit, W, H, STD, Cam, newScene, scene, floorW, R, edgeL, edgeR, sky, mountains, castleSil, forestSil, snowfall, snowMat, cobbleMat, mat,
  hall, beamsX, figure, eyes, column, archBack, vault, facade, sideFacade, wallBack, grave, deadTree, crate, coffin, chandelier, candleAt,
  candelabra, curtains, rug, chair, bars, sideFrame, mix, rng, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide, floorPoly,
  addLight, hb, hbBox, hbBack, hbSide, at, planks, tiles,
} from "./dcomu.mjs";
import { gothicWindow, sideWindow, door, sideDoor, banner, shelfBack, shelfSide, torch, pine, oak } from "./persp.mjs";
import { table, bench, bed, armchair, fireplace, fire, painting, portraitFace, stairsUp } from "./comu.mjs";

/* 1. Hotel Corona d'Or */
export function hotel() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 14, hgt = 4.2;
  hall(c, cam, { xl, xr, zb, hgt, kind: "plaster", wall: "#c9b48a", joint: "#6e5638", ceil: "#3e2e22",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.35, "#6e5638", "#3e2e22") });
  // la finestra amb una branca d'all, i la llar de foc
  backQ(c, cam, 1.1, 2.9, 1.4, 3.1, zb - 0.01, "#3e2e22"); backQ(c, cam, 1.25, 2.75, 1.55, 2.95, zb - 0.02, "#1f1d36");
  backQ(c, cam, 1.97, 2.03, 1.55, 2.95, zb - 0.03, "#3e2e22"); backQ(c, cam, 1.25, 2.75, 2.22, 2.28, zb - 0.03, "#3e2e22");
  { const [x, y] = cam.p(2.55, 2.8, zb), r = rng(3); for (let k = 0; k < 6; k++) c.circle(x + (r() - 0.5) * 3, y + k * 2, 1, "#e8dcc0"); }
  addLight(c, 2, 2.2, zb - 0.6, [0.5, 0.6, 1], 2.2, 0.4);
  fireplace(c, cam, -4.4, -2.4, zb, { stone: "#8f97a8" });
  // un rellotge i plats a la paret
  for (let k = 0; k < 4; k++) { const [x, y] = cam.p(-1.2 + k * 0.55, 2.7, zb); c.circle(x, y, 3, k % 2 ? "#e8dcc0" : "#9e1a24"); c.circle(x, y, 1, "#3e2e22"); }
  // taula de pagesos
  bench(c, cam, -2.4, 0.2, 10.4, 10.8, 0.45, "#3e2e22");
  figure(c, cam, -1.9, 10.9, { coat: "#3f2343", seated: true, hat: "#161427", seed: 1 });
  figure(c, cam, -0.4, 10.9, { coat: "#4d5e4a", seated: true, hat: null, scarf: "#9e1a24", seed: 2 });
  table(c, cam, -2.6, 0.4, 9.4, 10.4, 0.8, "#6e5638");
  for (const x of [-2, -1.1, -0.2]) box(c, cam, x, x + 0.14, 0.8, 1.0, 9.8, 9.94, { front: "#a08458" });
  candleAt(c, cam, -1.1, 0.8, 9.6);
  // la porta a la plaça (paret dreta)
  const door1 = sideExit(c, cam, xr, { at: 9.2, w: 1.4, h: 2.3, wood: "#573056" });
  const sc = scene(cam, c, floorW(cam, -4.6, 4.6, 186), 186);
  sc.spots = {
    "ex-hotel-placa": door1,
    "ho-hotel-finestra": hbBack(cam, 1.1, 2.9, 1.4, 3.1, zb, 1),
    "ho-hotel-llar": hbBox(cam, -4.5, -2.3, 0, 2.4, 13.4, 14, 1),
    "ho-hotel-pagesos": hbBox(cam, -2.6, 0.4, 0, 1.6, 9.4, 11.2, 1),
  };
  sc.pts = { "c-hostaler": at(cam, 1.6, 9.6), "c-hostalera": at(cam, 3.2, 8.8) };
  return sc;
}

/* 2. Plaça de Bistritz */
export function placa() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [60, 30, 9], seed: 2 });
  mountains(c, 120, 52, "#2b2a48", { seed: 5, snow: "#8f97a8" });
  mountains(c, 130, 86, "#1f1d36", { seed: 8 });
  floorQ(c, cam, -14, 14, 0.5, 40, mat(cobbleMat("#4c5266"), "#4c5266"));
  facade(c, cam, -9, -4.2, 4.8, 17, { wall: "#b8bccb", seed: 1, door: 1, roofH: 2.2 });
  facade(c, cam, -3.8, 0.6, 5.6, 19, { wall: "#c9b48a", seed: 2, win: 3, roofH: 2.4 });
  facade(c, cam, 1.2, 6.4, 4.6, 17.5, { wall: "#8f97a8", seed: 3, door: 0, roofH: 2 });
  sideFacade(c, cam, -7.5, 6, 16, 4.6, { wall: "#a08458", seed: 4 });
  // una creu de camí i vilatans que xiuxiuegen
  box(c, cam, -0.7, -0.6, 0, 2.2, 14, 14.1, { front: "#3e2e22" }); box(c, cam, -1.1, -0.2, 1.6, 1.7, 14, 14.1, { front: "#3e2e22" });
  figure(c, cam, -0.2, 13.4, { coat: "#3f2343", scarf: "#9e1a24", seed: 3 }); figure(c, cam, 0.5, 13.6, { coat: "#3e2e22", seed: 4 }); figure(c, cam, 1.1, 13.2, { coat: "#4d5e4a", seed: 5 });
  // la diligència de Bukovina, amb els cavalls
  const cz = 12.2;
  for (const [x, z] of [[2.3, cz - 0.2], [2.8, cz + 0.2]]) { box(c, cam, x - 1.2, x - 0.1, 0.8, 1.5, z, z + 0.4, { front: "#3e2e22" }); for (const dx of [-1.1, -0.3]) box(c, cam, x + dx, x + dx + 0.1, 0, 0.8, z, z + 0.1, { front: "#161427" }); box(c, cam, x - 1.5, x - 1.1, 1.3, 1.9, z, z + 0.3, { front: "#3e2e22" }); }
  box(c, cam, 3.4, 6.2, 0.7, 2.6, cz - 0.6, cz + 0.8, { front: "#3f2343", side: "#2a1830", top: "#1f1d36" });
  backQ(c, cam, 4.2, 5.4, 1.5, 2.3, cz - 0.61, "#f0a040"); addLight(c, 4.8, 1.8, cz - 1.2, [1, 0.7, 0.35], 2, 0.6);
  box(c, cam, 3.2, 6.4, 2.6, 2.8, cz - 0.7, cz + 0.9, { front: "#161427" });
  for (const x of [3.8, 5.8]) { const [px, py] = cam.p(x, 0.5, cz - 0.62), s = cam.s(cz); c.circle(px, py, s * 0.5, "#161427"); c.circle(px, py, s * 0.38, "#3e2e22"); c.circle(px, py, s * 0.08, "#161427"); }
  const sc = scene(cam, c, floorW(cam, -6.5, 6.5, 176), 176, { outdoor: true });
  sc.spots = {
    "ex-placa-hotel": edgeL(176),
    "ex-placa-diligencia": hbBox(cam, 3.2, 6.4, 0, 2.8, cz - 0.7, cz + 0.9, 2),
    "ho-placa-muntanyes": R(0, 50, 320, 40),
    "ho-placa-vilatans": hbBox(cam, -0.7, 1.4, 0, 1.8, 13, 13.8, 2),
  };
  sc.pts = { "c-cotxer": at(cam, 2.2, 9.4), "c-pagesa": at(cam, -2.6, 9.6) };
  return sc;
}

/* 3. Pas del Borgo */
export function borgo() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [161, 30, 14], seed: 3, clouds: 7 });
  mountains(c, 112, 40, "#2b2a48", { seed: 11, snow: "#b8bccb" });
  castleSil(c, 250, 92, 0.5, { seed: 3 });
  mountains(c, 128, 84, "#1f1d36", { seed: 12 });
  floorQ(c, cam, -20, 20, 0.5, 60, mat(snowMat("#8f97a8"), "#8f97a8"));
  // el camí que s'enfila entre els avets
  floorQ(c, cam, -1.4, 1.4, 0.5, 60, mat(snowMat("#6b7287"), "#6b7287"), 0.01);
  forestSil(c, 134, 40, "#0e0c16", { seed: 2 });
  for (const [X, Z, h] of [[-6, 15, 7], [-4.2, 12, 6], [-7.4, 10.5, 8], [5.6, 16, 6.5], [7.2, 12.5, 7.5]]) { const [x, y] = cam.p(X, 0, Z); pine(c, x, y, cam.s(Z), h, "#1c2a24", X * 7 + Z); }
  eyes(c, [[18, 176], [40, 186], [58, 172], [30, 196], [70, 190]], "#f0a040");
  eyes(c, [[48, 180], [12, 190]], "#cc2a2a");
  snowfall(c, 90, 4, 200);
  const sc = scene(cam, c, floorW(cam, -6, 6, 196), 196, { outdoor: true });
  sc.spots = {
    "ex-borgo-castell": R(184, 150, 96, 80),
    "ho-borgo-lluna": R(144, 14, 34, 32),
    "ho-borgo-llops": R(0, 160, 84, 44),
    "ho-borgo-cami": R(120, 128, 80, 52),
  };
  sc.pts = { "o-calessa": at(cam, 2.6, 9.6) };
  return sc;
}

/* 4. Pati del castell */
export function pati() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [250, 22, 10], seed: 4, clouds: 4 });
  const zb = 15;
  // muralles i torres
  stoneBack(c, cam, -14, 14, 0, 6, zb, "#4c5266", "#2b2a48", { h: 0.6, w: 1.1 });
  for (let x = -14; x < 14; x += 1.2) box(c, cam, x, x + 0.6, 6, 6.6, zb - 0.6, zb, { front: "#4c5266" });
  box(c, cam, 6, 9, 0, 12, zb + 1, zb + 4, { front: "#3b3a5c" }); quad(c, cam, [[5.7, 12, zb + 1], [9.3, 12, zb + 1], [7.5, 16, zb + 2.5]], "#161427");
  backQ(c, cam, 7.2, 7.8, 8, 9.2, zb + 0.98, "#f0a040");
  box(c, cam, -9, -4.4, 0, 17, 9, 13, { front: "#3b3a5c", side: "#2b2a48" });
  quad(c, cam, [[-9.3, 17, 9], [-4.1, 17, 9], [-6.7, 23, 11]], "#1f1d36");
  for (const y of [5, 9, 13]) { backQ(c, cam, -7.1, -6.4, y, y + 1.1, 8.98, "#07060b"); }
  backQ(c, cam, -7.1, -6.4, 13, 14.1, 8.97, "#f0a040");
  // la porta del castell, amb escales i torxes
  door(c, cam, -1.1, 1.1, 3.4, zb - 0.01, { wood: "#3e2e22", frame: "#2b2a48" });
  for (let k = 0; k < 3; k++) box(c, cam, -2 + k * 0.3, 2 - k * 0.3, k * 0.2, (k + 1) * 0.2, zb - 1.4 + k * 0.45, zb, { front: "#6b7287", top: "#8f97a8" });
  torch(c, cam, -2.2, 2.4, zb - 0.05); torch(c, cam, 2.2, 2.4, zb - 0.05);
  // ruïnes a la dreta
  for (const [x, h] of [[4.2, 3.4], [5.4, 2.2], [6.6, 4.4], [7.8, 1.6]]) box(c, cam, x, x + 1.1, 0, h, 12.4, 13.4, { front: "#4c5266", side: "#3b3a5c", top: "#6b7287" });
  floorQ(c, cam, -14, 14, 0.5, zb, mat(cobbleMat("#3b3a5c"), "#3b3a5c"));
  for (const [x, z] of [[-2.5, 10], [3, 11.2], [0.5, 12.6]]) floorQ(c, cam, x, x + 0.6, z, z + 0.3, "#4d5e4a", 0.01);
  const sc = scene(cam, c, floorW(cam, -4.5, 6.5, 182), 182, { outdoor: true });
  sc.spots = {
    "ex-pati-sala": hbBack(cam, -1.3, 1.3, 0, 3.8, zb, 2),
    "ho-pati-torre": hbBox(cam, -9, -4.4, 0, 23, 9, 13, 0),
    "ho-pati-muralles": hbBox(cam, 4.2, 8.9, 0, 4.4, 12.4, 13.4, 1),
  };
  sc.pts = { "o-comte-pati": at(cam, 0, 12.6) };
  return sc;
}

/* 5. Gran saló */
export function sala() {
  const cam = new Cam({ ...STD, f: 260 }), { c } = newScene(cam), xl = -6, xr = 6, zb = 15, hgt = 6.5;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#4c5266", joint: "#2b2a48", ceil: "#1f1d36", stone: { h: 0.6, w: 1.1 },
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 1, "#3b3a5c", "#2b2a48") });
  vault(c, cam, xl, xr, hgt - 1.4, 6, zb, 2.2, "#2b2a48");
  // escut d'armes amb el drac, entre estendards
  { const [a, b] = [cam.p(-4.6, 4.8, zb), cam.p(-2.4, 1.8, zb)]; fill(c, [[a[0], a[1]], [b[0], a[1]], [b[0], (a[1] + b[1]) / 2], [(a[0] + b[0]) / 2, b[1]], [a[0], (a[1] + b[1]) / 2]], "#6b0f1a");
    const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2; c.ellipse(cx, cy, 6, 4, "#a08458"); c.line(cx - 6, cy - 3, cx - 9, cy - 8, "#a08458"); c.line(cx + 5, cy + 2, cx + 9, cy + 6, "#a08458"); }
  banner(c, cam, -5.6, -4.9, 2.4, 5.4, zb - 0.01, "#3a0a10", "#a08458"); banner(c, cam, -2.1, -1.4, 2.4, 5.4, zb - 0.01, "#3a0a10", "#a08458");
  // porta del passadís
  door(c, cam, 2.0, 3.4, 3.0, zb - 0.01, { wood: "#3e2e22", frame: "#2b2a48" });
  gothicWindow(c, cam, -0.6, 0.6, 2.6, 5.2, zb, { moon: true, glass: "#1f1d36", frame: "#2b2a48" });
  // la porta del pati (paret esquerra) i la taula del sopar per a un sol convidat
  const door1 = sideExit(c, cam, xl, { at: 8.4, w: 1.6, h: 3, wood: "#3e2e22" });
  table(c, cam, -1.6, 2.4, 10.6, 12.2, 0.85, "#3e2e22", { cloth: "#b8bccb" });
  chair(c, cam, 0.4, 9.8, "#3f2343");
  floorQ(c, cam, 0.15, 0.65, 10.8, 11.2, "#e8dcc0", 0.86);
  candelabra(c, cam, 1.6, 11.4, 0.85);
  candleAt(c, cam, -1.0, 0.85, 11.2);
  chandelier(c, cam, 0.4, 4.0, 11.5, hgt + 1, 8, 0.9);
  for (const z of [6.6, 12.6]) { torch(c, cam, xl + 0.1, 2.4, z); torch(c, cam, xr - 0.1, 2.4, z); }
  const sc = scene(cam, c, floorW(cam, -5.5, 5.5, 182), 182);
  sc.spots = {
    "ex-sala-pati": door1,
    "ex-sala-passadis": hbBack(cam, 1.8, 3.6, 0, 3.4, zb, 2),
    "ho-sala-escut": hbBack(cam, -4.6, -2.4, 1.8, 4.8, zb, 2),
    "ho-sala-aranya": hbBox(cam, -0.6, 1.4, 3.9, 4.6, 10.9, 12.1, 2),
    "ho-sala-sostre": R(40, 0, 240, 34),
  };
  sc.pts = { "o-comte-sala": at(cam, 3.2, 9.4) };
  return sc;
}

/* 6. Biblioteca */
export function biblioteca() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 14, hgt = 4.8;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#3f2343", joint: "#2a1830", ceil: "#1f1d36",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.3, "#3e2e22", "#1f1d36") });
  shelfSide(c, cam, xl, 6.5, 13.6, 3.8, 3);
  shelfBack(c, cam, 3, 4.9, 3.6, zb, 4);
  // finestra amb reixa, i el mapa d'Anglaterra
  gothicWindow(c, cam, -2.2, -0.4, 1.2, 3.6, zb, { moon: true, glass: "#1f1d36", frame: "#2a1830" });
  bars(c, cam, -2.2, -0.4, 1.2, 3.3, zb - 0.05, 5);
  backQ(c, cam, 0.6, 2.2, 1.8, 3.2, zb - 0.01, "#a08458"); backQ(c, cam, 0.7, 2.1, 1.9, 3.1, zb - 0.02, "#e8dcc0");
  { const [a] = [cam.p(1.25, 3.0, zb)]; const s = cam.s(zb); fill(c, [[a[0], a[1]], [a[0] + s * 0.25, a[1] + s * 0.2], [a[0] + s * 0.32, a[1] + s * 0.65], [a[0] + s * 0.1, a[1] + s * 0.95], [a[0] - s * 0.05, a[1] + s * 0.6]], "#4d5e4a");
    for (const [dx, dy] of [[0.12, 0.25], [0.25, 0.7], [0.05, 0.45]]) c.px(a[0] + s * dx, a[1] + s * dy, "#9e1a24"); }
  // taula de treball amb papers, butaca i llum
  table(c, cam, -0.2, 2.8, 9.6, 10.8, 0.8, "#573056");
  for (const [x, z] of [[0.2, 9.9], [0.9, 10.1], [1.7, 9.8]]) floorQ(c, cam, x, x + 0.45, z, z + 0.32, "#e8dcc0", 0.81);
  candleAt(c, cam, 2.4, 0.8, 10.2);
  armchair(c, cam, 3.2, 4.2, 10.8, 11.8, "#6b0f1a");
  rug(c, cam, -2.6, 3, 8.2, 12.4, "#3a0a10");
  const door1 = sideExit(c, cam, xl, { at: 8.6 - 2.4, w: 1.2, h: 2.4, wood: "#3e2e22" });
  const sc = scene(cam, c, floorW(cam, -4.4, 4.6, 184), 184);
  sc.spots = {
    "ex-biblio-passadis": door1,
    "ho-biblio-mapa": hbBack(cam, 0.6, 2.2, 1.8, 3.2, zb, 1),
    "ho-biblio-prestatges": hbBox(cam, xl, xl + 0.45, 0, 3.8, 6.5, 13.6, 0),
    "ho-biblio-finestra": hbBack(cam, -2.3, -0.3, 1.2, 4.0, zb, 1),
    "ho-biblio-taula": hbBox(cam, -0.2, 2.8, 0, 0.9, 9.6, 10.8, 1),
  };
  return sc;
}

/* 7. La cambra de Jonathan */
export function cambra() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 14, hgt = 4.6;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#573056", joint: "#2a1830", ceil: "#1f1d36", stone: { h: 0.5, w: 0.8 },
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.32, "#3e2e22", "#1f1d36") });
  // llit de pals amb cortines a l'esquerra del fons
  bed(c, cam, -3.4, -1.4, 11.2, 13.8, { curtain: "#3a0a10", blanket: "#6b0f1a", gold: "#a08458" });
  // la finestra que dona a la muralla
  gothicWindow(c, cam, 1.4, 3.0, 1.2, 3.6, zb, { moon: true, glass: "#1f1d36", frame: "#2a1830" });
  curtains(c, cam, 1.4, 3.0, 1.2, 3.6, zb, "#3a0a10");
  // el mirall de la paret, tapat amb un drap negre
  sideFrame(c, cam, xl, 9.6, 11.2, 0.6, 2.8, "#a08458", "#07060b");
  quad(c, cam, [[xl + 0.02, 2.9, 9.5], [xl + 0.02, 2.9, 11.3], [xl + 0.02, 0.9, 11.4], [xl + 0.02, 1.2, 10.4], [xl + 0.02, 0.8, 9.4]], "#161427");
  // rentamans amb el mirallet d'afaitar
  box(c, cam, 3.6, 4.6, 0, 0.9, 11.6, 12.4, { front: "#3e2e22", top: "#6e5638" });
  candleAt(c, cam, 4.4, 0.9, 12.0);
  chandelier(c, cam, 0, 3.6, 10.5, hgt, 5, 0.6);
  rug(c, cam, -1.8, 2.2, 8.6, 11.4, "#2a1830");
  const door1 = sideExit(c, cam, xr, { at: 8.4, w: 1.4, h: 2.4, wood: "#3e2e22" });
  const sc = scene(cam, c, floorW(cam, -4.4, 4.6, 184), 184);
  sc.spots = {
    "ex-cambra-passadis": door1,
    "ex-cambra-finestra": hbBack(cam, 1.3, 3.1, 1.1, 4.1, zb, 1),
    "ho-cambra-mirall-paret": hbSide(cam, xl, 9.4, 11.4, 0.5, 3.0, 1),
    "ho-cambra-aranya": hbBox(cam, -0.7, 0.7, 3.4, hgt, 9.8, 11.2, 1),
  };
  sc.pts = { "o-mirall": at(cam, 3.95, 12.0, 0.9) };
  return sc;
}

/* 8. Passadís */
export function passadis() {
  const cam = new Cam({ ...STD, f: 180 }), { c } = newScene(cam), xl = -2.4, xr = 2.4, zb = 22, hgt = 4;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#4c5266", joint: "#2b2a48", ceil: "#1f1d36", stone: { h: 0.5, w: 0.8 },
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 0.8, "#3b3a5c", "#2b2a48") });
  for (let z = 6; z < zb; z += 3) { box(c, cam, xl, xl + 0.3, 0, hgt, z, z + 0.4, { front: "#3b3a5c" }); box(c, cam, xr - 0.3, xr, 0, hgt, z, z + 0.4, { front: "#3b3a5c" }); }
  vault(c, cam, xl, xr, hgt - 0.6, 6, zb, 3, "#2b2a48");
  // portes: gran saló i biblioteca (esquerra), la meva cambra (dreta), l'ala sud (al fons)
  const door1 = sideExit(c, cam, xl, { at: 6.7, w: 1.7, h: 2.6, wood: "#3e2e22" });
  const door2 = sideExit(c, cam, xl, { at: 13, w: 1.2, h: 2.4, wood: "#3e2e22" });
  const door3 = sideExit(c, cam, xr, { at: 7.4, w: 1.4, h: 2.4, wood: "#573056" });
  door(c, cam, -0.8, 0.8, 2.6, zb - 0.01, { wood: "#3e2e22", frame: "#2b2a48" });
  { const [x, y] = cam.p(0.45, 1.3, zb); c.rect(x - 2, y - 2, 4, 5, "#6e5638"); c.px(x, y, "#07060b"); }
  // el fanal que crema sense oli
  seg(c, cam, [0, hgt, 14], [0, 3.1, 14], "#161427");
  box(c, cam, -0.15, 0.15, 2.7, 3.1, 13.85, 14.15, { front: "#ffd870" });
  addLight(c, 0, 2.9, 14, [1, 0.75, 0.4], 4, 1.2, { kind: "candle", ...(() => { const [x, y] = cam.p(0, 2.9, 14); return { fx: Math.round(x), fy: Math.round(y), sx: x, sy: y, sr: 8 }; })() });
  for (const z of [10.5, 17]) torch(c, cam, xl + 0.05, 2.4, z);
  const sc = scene(cam, c, floorW(cam, -2.1, 2.1, 152), 152);
  sc.spots = {
    "ex-passadis-sala": door1,
    "ex-passadis-biblio": door2,
    "ex-passadis-cambra": door3,
    "ex-passadis-alasud": hbBack(cam, -1, 1, 0, 3, zb, 1),
    "ho-passadis-fanal": hbBox(cam, -0.2, 0.2, 2.6, 3.3, 13.8, 14.2, 2),
  };
  return sc;
}

/* 9. Ala sud */
export function alaSud() {
  const { cam, c } = newScene(), xl = -5.5, xr = 5.5, zb = 14, hgt = 5;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#6b7287", joint: "#3b3a5c", ceil: "#1f1d36", stone: { h: 0.5, w: 0.8 },
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.3, "#4c5266", "#2b2a48") });
  // la rosassa per on entra la lluna, i el raig de llum al terra
  { const [x, y] = cam.p(-0.8, 3.4, zb), s = cam.s(zb), rr = s * 0.9; c.circle(x, y, rr + 2, "#2b2a48"); c.circle(x, y, rr, "#8f97a8");
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.line(Math.round(x), Math.round(y), Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr), "#2b2a48"); }
    c.circle(x, y, rr * 0.3, "#2b2a48"); }
  addLight(c, -0.8, 1, 10, [0.55, 0.65, 1], 4.5, 1.1);
  floorQ(c, cam, -1.8, 0.4, 9, 11.4, [184, 188, 203, 40], 0.01);
  // els mobles coberts amb llençols i els retrats a la paret dreta
  for (const [x0, x1, z0, h] of [[-4.8, -3.0, 11.6, 1.1], [-3.2, -2.2, 9.6, 1.4], [2.2, 3.4, 12.2, 0.9]]) {
    box(c, cam, x0, x1, 0, h, z0, z0 + 1, { front: "#6b7287", top: "#8f97a8" });
    for (let x = x0 + 0.2; x < x1; x += 0.35) backQ(c, cam, x, x + 0.06, 0, h, z0 - 0.01, "#4c5266");
  }
  for (const [z, face] of [[7.8, ["#dcdbe0", "#3a0a10", "#161427"]], [10, ["#e8dcc0", "#2a1830", "#6e5638"]], [12.2, ["#dcdbe0", "#1f1d36", "#3e2e22"]]]) {
    sideFrame(c, cam, xr, z - 0.6, z + 0.6, 1.2, 3.2, "#a08458", "#2b2a48");
    const [a, b] = [cam.p(xr, 2.6, z), cam.p(xr, 2.0, z)]; c.ellipse(a[0], a[1], Math.max(1, cam.s(z) * 0.08), Math.max(2, cam.s(z) * 0.18), face[0]); c.rect(a[0] - 2, b[1], 4, 4, face[1]); c.px(a[0] - 1, a[1] + 1, "#9e1a24");
  }
  // tauleta amb la clau de ferro
  box(c, cam, 3.8, 4.8, 0, 0.8, 9.2, 10, { front: "#3e2e22", top: "#4c5266" });
  const door1 = sideExit(c, cam, xl, { at: 7, w: 1.4, h: 2.6, wood: "#3e2e22" });
  const sc = scene(cam, c, floorW(cam, -4.8, 5, 184), 184);
  sc.spots = {
    "ex-alasud-passadis": door1,
    "ho-alasud-rosassa": (() => { const [x, y] = cam.p(-0.8, 3.4, zb), r = cam.s(zb) * 0.9 + 2; return R(x - r, y - r, r * 2, r * 2); })(),
    "ho-alasud-retrats": hbBox(cam, xr - 0.1, xr, 1.1, 3.3, 7.1, 12.9, 1),
  };
  sc.pts = { "o-germanes": at(cam, -0.6, 10.2), "o-clau-ferro": at(cam, 4.3, 9.6, 0.8) };
  return sc;
}

/* 10. La muralla */
export function muralla() {
  const cam = new Cam({ ...STD, vy: 92, E: 3.4 }), { c } = newScene(cam);
  sky(c, 240, { moon: [70, 28, 12], seed: 10, clouds: 6, bottom: "#2b2a48" });
  mountains(c, 98, 70, "#1f1d36", { seed: 21 });
  // el buit: boscos molt avall, entre boira
  c.gradient(0, 96, W, 144, "#161427", "#07060b", 8);
  forestSil(c, 140, 20, "#0e0c16", { seed: 6, gap: 5 });
  // la paret del castell, amb torres que pugen contra el cel
  const zw = 11.5;
  stoneBack(c, cam, -9, 14, 0, 4.8, zw, "#4c5266", "#2b2a48", { h: 0.55, w: 0.9 });
  for (let x = -9; x < 14; x += 1.3) box(c, cam, x, x + 0.7, 4.8, 5.5, zw - 0.5, zw, { front: "#4c5266" });
  for (const [x0, x1, h] of [[-9, -6.4, 16], [6.5, 9, 13]]) { box(c, cam, x0, x1, 0, h, zw - 1.6, zw + 1, { front: "#3b3a5c", side: "#2b2a48" }); quad(c, cam, [[x0 - 0.3, h, zw - 1.6], [x1 + 0.3, h, zw - 1.6], [(x0 + x1) / 2, h + 4, zw]], "#161427"); backQ(c, cam, (x0 + x1) / 2 - 0.3, (x0 + x1) / 2 + 0.3, h - 3, h - 2, zw - 1.61, "#f0a040"); }
  for (const x of [-3, 0.6]) { backQ(c, cam, x, x + 0.7, 2.8, 3.8, zw - 0.01, "#07060b"); }
  backQ(c, cam, 3.3, 4.6, 0.6, 2.3, zw - 0.01, "#2a1830"); backQ(c, cam, 3.45, 4.45, 0.75, 2.15, zw - 0.02, "#f0a040");
  addLight(c, 3.9, 1.4, zw - 0.8, [1, 0.7, 0.35], 2.5, 0.8);
  // el ratpenat que hi ha enganxat a la paret (o és el comte?)
  { const [x, y] = cam.p(-1.6, 4, zw); c.ellipse(x, y, 2, 3, "#07060b"); c.line(x - 7, y - 2, x - 1, y, "#07060b"); c.line(x + 1, y, x + 7, y - 2, "#07060b"); }
  // el replà estret i la vora
  floorQ(c, cam, -9, 14, zw - 2.6, zw, "#3b3a5c");
  box(c, cam, -9, 14, -0.6, 0, zw - 2.7, zw - 2.6, { front: "#2b2a48" });
  for (let x = -6; x < 9; x += 2.2) box(c, cam, x, x + 0.5, 0, 0.5, zw - 2.6, zw - 2.3, { front: "#4c5266", top: "#6b7287" });
  const sc = scene(cam, c, floorW(cam, -6.4, 6, cam.y(zw - 0.15)).map((p) => p.map(([x, y]) => [x, Math.min(y, Math.round(cam.y(zw - 2.4)))])), cam.y(zw - 0.15), { outdoor: true });
  sc.ah = cam.actor(cam.y(zw - 0.15), cam.y(zw - 2.4));
  sc.spots = {
    "ex-muralla-cambra": R(0, cam.y(zw) - 70, 22, 80),
    "ex-muralla-comte": hbBack(cam, 3.3, 4.6, 0.4, 2.5, zw, 2),
    "ho-muralla-torres": R(0, 0, 320, 60),
    "ho-muralla-abisme": R(90, Math.round(cam.y(zw - 2.6)) + 2, 140, 239 - Math.round(cam.y(zw - 2.6)) - 2),
  };
  return sc;
}

/* 11. Cambra del comte */
export function cambraComte() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 14, hgt = 5;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#3b3a5c", joint: "#1f1d36", ceil: "#161427", stone: { h: 0.55, w: 1 },
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 0.9, "#2b2a48", "#1f1d36") });
  // la finestra per on he entrat (esquerra) i la porta de roure (dreta)
  sideWindow(c, cam, xl, 10.8, 12.2, 1.0, 2.6, { glass: "#2b2a48", frame: "#161427" });
  const door1 = sideExit(c, cam, xr, { at: 9.4, w: 2.0, h: 3.2, wood: "#6e5638", frame: "#3e2e22" });
    // pols i teranyines, sofàs vells i l'aranya
  for (const [x0, x1, z] of [[-3.6, -1.2, 11.2], [0.4, 2.6, 11.6]]) { box(c, cam, x0, x1, 0, 0.5, z, z + 0.8, { front: "#3a0a10", top: "#6b0f1a" }); box(c, cam, x0, x1, 0.5, 1.1, z + 0.6, z + 0.8, { front: "#6b0f1a" }); }
  rug(c, cam, -3, 2.4, 8.6, 11, "#2a1830", "#6e5638");
  chandelier(c, cam, -0.8, 3.8, 10.5, hgt, 6, 0.8);
  painting(c, cam, -1.6, 0.2, 2.2, 3.6, zb, portraitFace("#dcdbe0", "#161427", "#b8bccb"));
  { const [x, y] = cam.p(xl, hgt, 13.6); for (let k = 0; k < 6; k++) c.line(x, y, x + 6 + k * 3, y + 12 - k * 2, "#6b7287"); }
  const sc = scene(cam, c, floorW(cam, -4.6, 4.6, 184), 184);
  sc.spots = {
    "ex-ccomte-muralla": hbSide(cam, xl, 10.6, 12.4, 0.8, 3.2, 2),
    "ex-ccomte-capella": door1,
    "ho-ccomte-aranya": hbBox(cam, -1.6, 0, 3.6, hgt, 9.7, 11.3, 1),
    "ho-ccomte-sofas": hbBox(cam, -3.6, 2.6, 0, 1.1, 11.2, 12.4, 1),
  };
  sc.pts = { "o-cofre": at(cam, 3.4, 12.6) };
  return sc;
}

/* 12. Capella del castell */
export function capella() {
  const cam = new Cam({ ...STD, f: 260 }), { c } = newScene(cam), xl = -6, xr = 6, zb = 15, hgt = 5.5;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#3b3a5c", joint: "#1f1d36", ceil: "#0e0c16", stone: { h: 0.55, w: 0.9 },
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 1.1, "#2b2a48", "#1f1d36") });
  vault(c, cam, xl, xr, hgt - 1.2, 5, zb, 2.5, "#1f1d36");
  // l'altar abandonat i una creu tombada
  box(c, cam, -1.4, 1.4, 0, 1.1, zb - 1.2, zb - 0.2, { front: "#4c5266", top: "#6b7287" });
  archBack(c, cam, -1.0, 1.0, 3.6, zb, { frame: "#2b2a48", inside: "#0e0c16" });
  for (let k = 0; k < 3; k++) candleAt(c, cam, -0.8 + k * 0.8, 1.1, zb - 0.8, 0.25);
  for (const [x, z] of [[-4.4, 7], [-4.4, 11], [4.4, 7], [4.4, 11]]) column(c, cam, x, z, hgt - 1.2, 0.6, "#4c5266");
  // terra remenada, l'esquerda del mur i l'escala que puja
  for (const [x, z] of [[-2.4, 9], [1.2, 8.4], [3, 11]]) floorQ(c, cam, x, x + 1.4, z, z + 0.9, "#3e2e22", 0.01);
  sideQ(c, cam, xr, 11, 11.9, 0, 3, "#07060b"); quad(c, cam, [[xr, 3, 11], [xr, 3.8, 11.5], [xr, 3, 11.9]], "#07060b");
  stairsUp(c, cam, -6, -4.8, 7.5, 6, 0.3, 0.25, "#4c5266");
  const sc = scene(cam, c, floorW(cam, -5.6, 5.6, 184), 184);
  sc.spots = {
    "ex-capella-ccomte": hbBox(cam, -6, -4.8, 0, 1.6, 7.5, 9.3, 2),
    "ex-capella-esquerda": hbSide(cam, xr, 10.8, 12.1, 0, 3.9, 2),
    "ho-capella-columnes": hbBox(cam, -4.8, -4, 0, hgt - 1.2, 6.6, 11.4, 0),
    "ho-capella-volta": R(30, 0, 260, 50),
  };
  sc.pts = { "o-caixes-castell": at(cam, -2.6, 10.4), "o-comte-caixa": at(cam, 0.6, 8.8), "o-pala": at(cam, 3.6, 9.6) };
  return sc;
}

/* 13. L'espadat */
export function espadat() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#2a1830", bottom: "#9e1a24", moon: null, seed: 13, clouds: 6 });
  c.gradient(0, 90, W, 30, "#6f4a6e", "#cc2a2a", 6);
  mountains(c, 112, 60, "#2a1830", { seed: 31 });
  castleSil(c, 70, 82, 0.55, { seed: 9, col: "#161427", rock: "#161427" });
  mountains(c, 130, 96, "#1f1d36", { seed: 32 });
  floorQ(c, cam, -20, 20, 0.5, 60, "#3e2e22");
  // el camí que baixa per la dreta, entre roques
  floorQ(c, cam, 0.8, 3.4, 0.5, 30, "#6e5638", 0.01);
  for (const [x, z, s] of [[-3.6, 10, 0.9], [-2.2, 13, 1.4], [5.4, 11.6, 1], [-5, 9, 1.2]]) box(c, cam, x, x + s, 0, s * 0.7, z, z + s * 0.8, { front: "#4c5266", top: "#6b7287" });
  // abans del camí, el buit
  fill(c, [[0, 196], [60, 186], [60, 239], [0, 239]], "#07060b");
  { const [x, y] = cam.p(3.2, 0, 15); deadTree(c, x, y, cam.s(15), 4.8, "#07060b", 6); }
  const sc = scene(cam, c, [[[60, 186], ...floorPoly(cam, -4, 6.4, 186).filter(([x]) => x > 60)]], 186, { outdoor: true });
  sc.walk = [floorPoly(cam, -3.4, 6.4, 186).map(([x, y]) => [Math.max(64, x), y])];
  sc.spots = {
    "ex-espadat-baixar": edgeR(186),
    "ho-espadat-cami": hbBox(cam, 0.8, 3.4, 0, 0.1, 14, 26, 4),
    "ho-espadat-arbre": (() => { const [x, y] = cam.p(3.2, 0, 15), s = cam.s(15); return R(x - s * 1.6, y - s * 4.8, s * 3.2, s * 4.8); })(),
  };
  return sc;
}

export const ACTE1 = { hotel, placa, borgo, pati, sala, biblioteca, cambra, passadis, "ala-sud": alaSud, muralla, "cambra-comte": cambraComte, capella, espadat };
