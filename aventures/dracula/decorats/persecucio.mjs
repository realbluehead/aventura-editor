// Acte IV — La persecució: de Varna al castell sota la neu (10 decorats). Mateix contracte que transilvania.mjs.
import {
  sideExit, W, H, STD, Cam, newScene, scene, floorW, R, edgeL, edgeR, sky, mountains, castleSil, forestSil, snowfall, snowMat, cobbleMat, waterMat, mat,
  hall, beamsX, figure, eyes, column, archBack, vault, facade, sideFacade, wallBack, grave, deadTree, crate, coffin, candleAt,
  ship, gasLamp, mix, rng, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide, floorPoly, addLight, hb, hbBox, hbBack, hbSide, at, planks, tiles,
} from "./dcomu.mjs";
import { door, sideDoor, torch, pine } from "./persp.mjs";
import { fire } from "./comu.mjs";

const water = (c, cam, z0, moonX, x0 = -60, x1 = 60) => floorQ(c, cam, x0, x1, z0, 200, mat(waterMat("#161427", "#3b3a5c", moonX), "#1f1d36"), -0.4);
const pines = (c, cam, list, col = "#1c2a24", snow = true) => {
  for (const [X, Z, h] of list) { const [x, y] = cam.p(X, 0, Z), s = cam.s(Z); pine(c, x, y, s, h, col, Math.round(X * 7 + Z * 3)); if (snow) for (let k = 1; k < 4; k++) c.line(Math.round(x - h * s * 0.2 * (1 - k * 0.2)), Math.round(y - h * s * (0.15 + k * 0.2)), Math.round(x + h * s * 0.2 * (1 - k * 0.2)), Math.round(y - h * s * (0.15 + k * 0.2)), "#b8bccb"); }
};

/* 41. Port de Varna */
export function varna() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#161427", bottom: "#573056", moon: [280, 30, 9], seed: 41, clouds: 7 });
  water(c, cam, 11.6, 280);
  ship(c, cam, -16, -4, 26, { masts: 3, waterY: -0.4, hull: "#1f1d36" });
  floorQ(c, cam, -16, 16, 0.5, 11.6, mat(cobbleMat("#6e5638"), "#6e5638"));
  box(c, cam, -16, 16, -0.6, 0, 11.6, 11.9, { front: "#3e2e22" });
  // l'oficina del telègraf, amb el pal i els fils
  box(c, cam, 2.4, 7, 0, 3.6, 11, 13, { front: "#c9b48a", side: "#a08458", top: "#6b0f1a" });
  door(c, cam, 3.2, 4.2, 2.2, 10.99, { wood: "#3e2e22", frame: "#6e5638", arch: false });
  backQ(c, cam, 5, 6.2, 1.4, 2.4, 10.98, "#f0a040"); addLight(c, 5.6, 1.9, 10.4, [1, 0.7, 0.35], 2.2, 0.6);
  { const [x, y] = cam.p(4.7, 3.1, 10.98); c.text(Math.round(x - 18), Math.round(y), "TELEGRAF", "#3e2e22"); }
  box(c, cam, 1.6, 1.75, 0, 6, 11.6, 11.75, { front: "#3e2e22" }); seg(c, cam, [1.7, 5.8, 11.6], [-16, 5, 24], "#161427"); seg(c, cam, [1.7, 5.6, 11.6], [7, 3.6, 12], "#161427");
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 196), 196, { outdoor: true });
  sc.spots = { "ex-va-galatz": edgeR(196), "ho-va-vaixell": hbBack(cam, -16, -3, -0.4, 10, 26, 0) };
  sc.pts = { "c-telegrafista": at(cam, 3.4, 9.2) };
  return sc;
}

/* 42. Port de Galatz */
export function galatz() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#161427", bottom: "#3b3a5c", moon: [210, 36, 10], seed: 42, clouds: 8 });
  water(c, cam, 10, 210, -2, 60);
  ship(c, cam, 0.4, 10, 17, { masts: 2, waterY: -0.4, hull: "#2b1a14" });
  box(c, cam, 4.6, 5.2, 1.6, 6, 16.9, 17.3, { front: "#161427" });
  { const [x, y] = cam.p(5.2, 1.0, 16.9); c.text(Math.round(x - 30), Math.round(y), "CZARINA CATHERINE", "#c9b48a"); }
  // el moll (a l'esquerra) i el magatzem
  floorQ(c, cam, -16, -1.2, 0.5, 30, mat(cobbleMat("#4c5266"), "#4c5266"));
  floorQ(c, cam, -1.2, 16, 0.5, 10, mat(cobbleMat("#4c5266"), "#4c5266"));
  sideFacade(c, cam, -5.2, 8, 20, 5.4, { wall: "#6e5638", brick: true, seed: 42, lit: 0.3 });
  sideDoor(c, cam, -5.2, 10.6, 12.6, 3, { wood: "#3e2e22" });
  { const [x, y] = cam.p(-5.2, 3.6, 11.6); c.text(Math.round(x - 2), Math.round(y), "SKINSKY", "#e8dcc0"); }
  // la llanxa de vapor amarrada
  box(c, cam, 1, 4.6, -0.4, 0.4, 9.2, 10.2, { front: "#3e2e22", top: "#6e5638" });
  box(c, cam, 2.6, 3, 0.4, 1.8, 9.5, 9.9, { front: "#161427" });
  for (const [x, z] of [[-3.6, 9.4], [-2.8, 9.8]]) crate(c, cam, x, x + 0.7, z, z + 0.6, 0.6);
  const sc = scene(cam, c, [floorPoly(cam, -4.6, 0.6, 180).map(([x, y]) => [x, y])], 180, { outdoor: true });
  sc.spots = {
    "ex-ga-magatzem": hbSide(cam, -5.2, 10.4, 12.8, 0, 3.4, 2),
    "ex-ga-riu": hbBox(cam, 1, 4.6, -0.4, 1.8, 9.2, 10.2, 2),
    "ho-ga-vapor": hbBack(cam, 0.4, 10, -0.4, 9, 17, 0),
  };
  sc.pts = { "c-viceconsol": at(cam, -2.6, 8.8) };
  return sc;
}

/* 43. Magatzem de Skinsky */
export function magatzem() {
  const { cam, c } = newScene(), xl = -5.5, xr = 5.5, zb = 13, hgt = 5;
  hall(c, cam, { xl, xr, zb, hgt, kind: "wood", wall: "#3e2e22", joint: "#1f1d36", ceil: "#1f1d36",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.35, "#4c5266", "#2b2a48") });
  beamsX(c, cam, xl, xr, hgt, 5, zb, 2);
  // fardells i caixes, un taulell amb el llum
  for (const [x, z, s] of [[-5, 10.6, 1], [-4, 11, 0.8], [-4.6, 11.6, 0.9], [-5.2, 12, 1.1], [-3.2, 12.2, 0.8]]) box(c, cam, x, x + s, 0, s * 0.7, z, z + s * 0.8, { front: "#a08458", top: "#c9b48a" });
  for (const [x, z] of [[2.6, 12], [3.6, 12], [3.1, 11.2]]) crate(c, cam, x, x + 0.9, z, z + 0.8, 0.7);
  box(c, cam, -0.6, 1.8, 0, 1, 9.4, 10, { front: "#3e2e22", top: "#6e5638" }); candleAt(c, cam, 1.4, 1, 9.7, 0.7);
  seg(c, cam, [0, hgt, 11], [0, 3.2, 11], "#161427");
  const door1 = sideExit(c, cam, xr, { at: 7.6, w: 1.8, h: 2.8, wood: "#6e5638" });
  const sc = scene(cam, c, floorW(cam, -5, 5, 186), 186);
  sc.spots = { "ex-mg-galatz": door1, "ho-mg-caixes": hbBox(cam, -5.2, -2.4, 0, 1, 10.6, 12.8, 1) };
  sc.pts = { "o-skinsky": at(cam, 2.6, 9.2), "o-albara": at(cam, 0.2, 9.6, 1) };
  return sc;
}

/* 44. Riu Bistrița */
export function riu() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#161427", bottom: "#3b3a5c", moon: [230, 30, 10], seed: 44, clouds: 6 });
  mountains(c, 110, 50, "#2b2a48", { seed: 44, snow: "#8f97a8" });
  forestSil(c, 124, 26, "#161427", { seed: 44 });
  floorQ(c, cam, -20, 20, 0.5, 60, mat(snowMat("#8f97a8"), "#8f97a8"));
  // el riu que ve del fons, cap a la dreta
  quad(c, cam, [[0.6, -0.02, 0.5], [16, -0.02, 0.5], [16, -0.02, 60], [1.6, -0.02, 60], [-0.6, -0.02, 22], [1.2, -0.02, 12]], mat(waterMat("#161427", "#3b3a5c", 230), "#1f1d36"));
  // la barca del barquer i el pal d'amarrar
  box(c, cam, 1.8, 4.4, -0.3, 0.3, 9.4, 10.2, { front: "#3e2e22", top: "#6e5638" });
  box(c, cam, 0.8, 0.95, 0, 1.2, 9.6, 9.75, { front: "#3e2e22" });
  pines(c, cam, [[-6, 12, 7], [-7.6, 15, 8], [-4.8, 17, 6], [6.6, 20, 7]]);
  snowfall(c, 60, 44, 200);
  const sc = scene(cam, c, [floorPoly(cam, -6, 0.4, 192)], 192, { outdoor: true });
  sc.spots = {
    "ex-ri-bosc": hbBox(cam, -0.6, 2, 0, 1.6, 16, 30, 4),
    "ex-ri-galatz": edgeL(196),
    "ho-ri-aigua": R(176, 196, 144, 43),
  };
  sc.pts = { "c-barquer": at(cam, -1.8, 9) };
  return sc;
}

/* 45. Bosc nevat */
export function bosc() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#0e0c16", bottom: "#2b2a48", moon: [70, 26, 9], seed: 45, clouds: 8 });
  forestSil(c, 120, 40, "#161427", { seed: 45, gap: 5 });
  floorQ(c, cam, -20, 20, 0.5, 60, mat(snowMat("#b8bccb"), "#b8bccb"));
  floorQ(c, cam, -1, 1.4, 0.5, 60, mat(snowMat("#8f97a8"), "#8f97a8"), 0.01);
  pines(c, cam, [[-6.6, 10.6, 8], [-4.6, 13, 7], [-8, 16, 9], [-3, 18, 6], [5.4, 11, 8], [7.4, 14, 9], [4, 17, 7], [9, 19, 8], [-1.8, 24, 7], [2.4, 26, 7]]);
  eyes(c, [[262, 150], [290, 156], [36, 156]], "#f0a040");
  snowfall(c, 140, 45);
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 188), 188, { outdoor: true });
  sc.spots = { "ex-bo-riu": edgeL(188), "ex-bo-camp": edgeR(188), "ho-bo-arbres": R(0, 0, 320, 120) };
  sc.pts = { "c-quincey-bosc": at(cam, 2.6, 9.4) };
  return sc;
}

/* 46. Campament */
export function campament() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#0e0c16", bottom: "#2b2a48", moon: [250, 30, 11], seed: 46, clouds: 6 });
  mountains(c, 110, 60, "#1f1d36", { seed: 46, snow: "#6b7287" });
  castleSil(c, 230, 96, 0.4, { seed: 46 });
  forestSil(c, 124, 22, "#161427", { seed: 46 });
  floorQ(c, cam, -20, 20, 0.5, 60, mat(snowMat("#b8bccb"), "#b8bccb"));
  // el cercle d'hòsties al voltant del foc (el foc és un objecte)
  for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2, [x, y] = cam.p(1.2 + Math.cos(a) * 2.4, 0, 10.6 + Math.sin(a) * 1.4); c.px(x, y, "#e8dcc0"); c.px(x + 1, y, "#e8dcc0"); }
  // la tenda, mantes i els cavalls morts de fred (només siluetes)
  quad(c, cam, [[-6.6, 0, 14], [-3.4, 0, 14], [-5, 2.2, 14.6]], "#6e5638"); quad(c, cam, [[-5.6, 0, 13.98], [-4.4, 0, 13.98], [-5, 1.6, 13.98]], "#1f1d36");
  pines(c, cam, [[-8, 12, 8], [7.6, 15, 8], [-7, 18, 7], [6, 20, 7]]);
  eyes(c, [[150, 156], [170, 150], [200, 158]], "#f0a040");
  snowfall(c, 90, 46);
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 184), 184, { outdoor: true });
  sc.spots = { "ex-cm-bosc": edgeL(190), "ex-cm-castell": edgeR(186), "ho-cm-llop": R(140, 136, 80, 30) };
  sc.pts = { "c-mina-camp": at(cam, 2.4, 10.4), "c-vh-camp": at(cam, 4, 9.2), "o-germanes-camp": at(cam, -2.6, 9.8), "o-foc": at(cam, 1.2, 10.6) };
  return sc;
}

/* 47. El castell sota la neu */
export function castellNeu() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#07060b", bottom: "#2b2a48", moon: null, seed: 47, clouds: 12, stars: 5 });
  { const r = rng(47); for (let k = 0; k < 3; k++) { let x = 150 + r() * 160, y = 0; while (y < 70) { const nx = x + (r() - 0.5) * 12, ny = y + 4 + r() * 6; c.line(Math.round(x), Math.round(y), Math.round(nx), Math.round(ny), "#b8bccb"); x = nx; y = ny; } } }
  mountains(c, 120, 70, "#1f1d36", { seed: 47, snow: "#8f97a8" });
  floorQ(c, cam, -20, 20, 0.5, 60, mat(snowMat("#b8bccb"), "#b8bccb"));
  // el castell a prop: muralla, torre i la capella en ruïnes a l'esquerra
  stoneBack(c, cam, -4, 12, 0, 7, 18, "#3b3a5c", "#1f1d36", { h: 0.6, w: 1 });
  box(c, cam, 3, 6.4, 0, 14, 16, 18, { front: "#2b2a48", side: "#1f1d36" }); quad(c, cam, [[2.7, 14, 16], [6.7, 14, 16], [4.7, 19, 17]], "#161427");
  backQ(c, cam, 4.4, 5, 10, 11.2, 15.99, "#f0a040");
  for (let x = -4; x < 12; x += 1.3) box(c, cam, x, x + 0.7, 7, 7.7, 17.4, 18, { front: "#3b3a5c" });
  box(c, cam, -9, -4.4, 0, 4.2, 12, 15, { front: "#4c5266", side: "#3b3a5c" });
  archBack(c, cam, -7.6, -5.8, 3, 11.99, { frame: "#3b3a5c", inside: "#07060b" });
  for (const [x, h] of [[-9, 6], [-5.4, 5]]) box(c, cam, x, x + 0.5, 4.2, h, 12, 12.5, { front: "#4c5266" });
  snowfall(c, 160, 47);
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 196), 196, { outdoor: true });
  sc.spots = { "ex-cn-tombes": hbBack(cam, -7.8, -5.6, 0, 3.6, 12, 2), "ex-cn-camp": edgeL(196), "ex-cn-cami": edgeR(196), "ho-cn-cel": R(140, 0, 180, 72) };
  return sc;
}

/* 48. Tombes del castell */
export function tombes() {
  const cam = new Cam({ ...STD, f: 260 }), { c } = newScene(cam), xl = -6, xr = 6, zb = 14, hgt = 5;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#3b3a5c", joint: "#1f1d36", ceil: "#0e0c16", stone: { h: 0.6, w: 1 },
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 1.2, "#2b2a48", "#1f1d36") });
  vault(c, cam, xl, xr, hgt - 1.2, 5, zb, 2.5, "#1f1d36");
  // la neu que entra per les esquerdes de la volta
  floorQ(c, cam, -1, 2.4, 7, 9, "#8f97a8", 0.01);
  addLight(c, 0.6, 2, 8, [0.6, 0.7, 1], 4, 0.9);
  // el sarcòfag del comte, enorme, al fons, amb el nom gravat
  box(c, cam, -2.4, 2.4, 0, 1.6, 11.6, 13.4, { front: "#4c5266", top: "#6b7287" });
  box(c, cam, -2.6, 2.6, 1.6, 1.85, 11.4, 13.6, { front: "#6b7287", top: "#8f97a8" });
  { const [x, y] = cam.p(0, 1.2, 11.59); c.text(Math.round(x - 14), Math.round(y), "DRACULA", "#161427"); }
  stoneBack(c, cam, -3.4, 3.4, 1.85, 4.2, zb - 0.02, "#4c5266", "#2b2a48");
  for (const x of [-3.2, 3.2]) column(c, cam, x, 12.4, 3.6, 0.5, "#4c5266");
  for (const x of [-1.8, 1.8]) candleAt(c, cam, x, 1.85, 12.4, 0.5);
  const door1 = sideExit(c, cam, xr, { at: 7.6, w: 1.8, h: 2.8, wood: "#161427", open: true });
  const sc = scene(cam, c, floorW(cam, -5.6, 5.6, 186), 186);
  sc.spots = { "ex-tb-castell": door1, "ho-tb-sarcofag": hbBox(cam, -2.6, 2.6, 0, 1.9, 11.4, 13.6, 2) };
  sc.pts = { "o-tombes-germanes": at(cam, -3.8, 9.6) };
  return sc;
}

/* 49. Camí dels gitanos */
export function cami() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#2a1830", bottom: "#cc2a2a", moon: null, seed: 49, clouds: 6, stars: 0 });
  { const [x, y] = [160, 104]; c.circle(x, y, 18, "#f0a040"); c.circle(x, y, 14, "#ffd870"); }
  mountains(c, 112, 70, "#3f2343", { seed: 49 });
  castleSil(c, 70, 112, 0.45, { seed: 49, col: "#161427", rock: "#2a1830" });
  mountains(c, 126, 96, "#2a1830", { seed: 50 });
  floorQ(c, cam, -20, 20, 0.5, 60, mat(snowMat("#6f4a6e"), "#6f4a6e"));
  floorQ(c, cam, -1.6, 1.8, 0.5, 60, "#3e2e22", 0.01);
  pines(c, cam, [[-7, 12, 8], [-5.6, 16, 7], [7.6, 13, 8], [6, 18, 7]], "#1f1d36");
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 190), 190, { outdoor: true });
  sc.spots = { "ex-ca-castell": edgeL(190), "ho-ca-sol": R(130, 76, 60, 36) };
  sc.pts = { "c-gitano": at(cam, 1.8, 9.6), "o-carreta": at(cam, -2.2, 9.8) };
  return sc;
}

/* 50. Epíleg */
export function epileg() {
  const { cam, c } = newScene();
  sky(c, 150, { top: "#3b3a5c", bottom: "#c9b48a", moon: null, seed: 50, clouds: 5, stars: 0 });
  mountains(c, 110, 54, "#6b7287", { seed: 51, snow: "#dcdbe0" });
  mountains(c, 126, 86, "#4c5266", { seed: 52 });
  floorQ(c, cam, -20, 20, 0.5, 60, "#4d5e4a");
  // les ruïnes del castell, set anys després: murs esbotzats amb finestres buides, herba i flors
  const zw = 17;
  stoneBack(c, cam, -9, 7, 0, 5, zw, "#6b7287", "#4c5266", { h: 0.6, w: 1 });
  for (const [x0, x1, h] of [[-9, -6, 9], [-6, -3.4, 6.4], [-0.6, 2.4, 7.4], [4, 7, 3.6]]) stoneBack(c, cam, x0, x1, 5, h, zw, "#6b7287", "#4c5266", { h: 0.6, w: 1 });
  for (const x of [-7.8, -5, 0.2, 1.4]) archBack(c, cam, x, x + 0.8, 4.2, zw - 0.01, { frame: "#4c5266", inside: "#c9b48a" });
  archBack(c, cam, -2.6, -0.8, 3, zw - 0.01, { frame: "#4c5266", inside: "#4d5e4a" });
  for (const [x, z, s] of [[-4, 11, 0.8], [1.2, 12.4, 0.6], [-1.6, 13.4, 1]]) box(c, cam, x, x + s, 0, s * 0.6, z, z + s, { front: "#6b7287", top: "#8f97a8" });
  const r = rng(50); for (let k = 0; k < 80; k++) { const X = -8 + r() * 16, Z = 9 + r() * 8, [x, y] = cam.p(X, 0, Z); c.px(x, y, k % 3 ? "#e8dcc0" : "#cc2a2a"); }
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 200), 200, { outdoor: true });
  sc.spots = { "ho-ep-ruines": R(20, 40, 220, 150) };
  return sc;
}

export const ACTE4 = { varna, galatz, magatzem, riu, bosc, campament, "castell-neu": castellNeu, tombes, cami, epileg };
