// Acte III — Londres (17 decorats). Mateix contracte que transilvania.mjs.
import {
  sideExit, W, H, STD, Cam, newScene, scene, floorW, R, edgeL, edgeR, sky, mountains, forestSil, cobbleMat, waterMat, brickMat, mat,
  hall, beamsX, figure, eyes, column, archBack, vault, facade, sideFacade, wallBack, grave, deadTree, crate, coffin, chandelier, candleAt,
  candelabra, curtains, rug, chair, bars, sideFrame, ship, gasLamp, mix, rng, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide,
  floorPoly, addLight, hb, hbBox, hbBack, hbSide, at, planks, tiles, theme,
} from "./dcomu.mjs";
import { gothicWindow, sideWindow, door, sideDoor, shelfBack, shelfSide, torch, oak, pine } from "./persp.mjs";
import { table, bench, bed, armchair, fireplace, painting, portraitFace, stairsUp } from "./comu.mjs";

// Boira de Londres: franges translúcides
function fog(c, y0, y1, col = [143, 151, 168], a = 40, seed = 1) { const r = rng(seed); for (let y = y0; y < y1; y += 3) c.rect(0, y, W, 2, [...col.slice(0, 3), Math.round(a * (0.4 + r() * 0.6))]); }
// Llum fixa (sense flama animada) en un punt de pantalla
const glowAt = (cam, X, Y, Z) => { const [x, y] = cam.p(X, Y, Z); return { fx: Math.round(x), fy: Math.round(y), sx: x, sy: y, sr: 10 }; };
// Carrer de Londres: llambordes, voreres i façanes de maó a banda i banda del fons
function street(c, cam, { zb = 18, seed = 1, lit = 0.5, cols = ["#6b0f1a", "#3e2e22", "#573056"] } = {}) {
  floorQ(c, cam, -16, 16, 0.5, zb, mat(cobbleMat("#3b3a5c"), "#3b3a5c"));
  let x = -16, k = 0;
  while (x < 16) { const w = 3.2 + rng(seed + k)() * 2, h = 5 + rng(seed + k + 9)() * 3; facade(c, cam, x, x + w, h, zb, { wall: cols[k % cols.length], brick: true, seed: seed + k, lit, win: 2, roofH: 0.5, door: k % 2 ? 0 : null }); x += w + 0.1; k++; }
}

/* 24. Hampstead Heath */
export function hampstead() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [200, 50, 9], seed: 24, clouds: 9, bottom: "#2b2a48" });
  forestSil(c, 120, 18, "#161427", { seed: 24, gap: 9 });
  floorQ(c, cam, -20, 20, 0.5, 60, "#2f4237");
  floorQ(c, cam, -0.8, 1.2, 0.5, 60, "#4c5266", 0.01);
  floorQ(c, cam, 1.2, 9, 15, 16.4, "#4c5266", 0.01);
  // bruguerar i un roure, el camí del zoo a la dreta
  const r = rng(5);
  for (let k = 0; k < 40; k++) { const X = -9 + r() * 8, Z = 9 + r() * 10, [x, y] = cam.p(X, 0, Z), s = cam.s(Z); c.ellipse(x, y - s * 0.2, s * (0.35 + r() * 0.3), s * 0.25, mix("#1c2a24", "#573056", r() * 0.4)); }
  { const [x, y] = cam.p(-6.4, 0, 16); oak(c, x, y, cam.s(16), 6, "#1c2a24", 7); }
  box(c, cam, 6.6, 6.75, 0, 1.8, 15.2, 15.35, { front: "#3e2e22" }); box(c, cam, 6.2, 7.6, 1.4, 1.75, 15.2, 15.3, { front: "#6e5638" });
  { const [x, y] = cam.p(6.9, 1.5, 15.2); c.text(Math.round(x - 6), Math.round(y - 1), "ZOO", "#161427"); }
  gasLamp(c, cam, 3, 11);
  fog(c, 110, 170, [143, 151, 168], 30, 24);
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 188), 188, { outdoor: true });
  sc.spots = {
    "ex-hs-picc": edgeL(188), "ex-hs-king": edgeR(188),
    "ex-hs-zoo": hbBox(cam, 4, 9, 0, 2, 15, 16.4, 6),
    "ho-hs-nuvols": R(40, 8, 260, 70),
    "ho-hs-bruguerar": R(0, 150, 150, 40),
  };
  sc.pts = { "c-policia": at(cam, 2.2, 9.4) };
  return sc;
}

/* 25. Cementiri de Kingstead */
export function kingstead() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [60, 40, 11], seed: 25, clouds: 7 });
  forestSil(c, 116, 26, "#0e0c16", { seed: 25 });
  floorQ(c, cam, -20, 20, 0.5, 60, "#2f4237");
  floorQ(c, cam, -0.8, 0.8, 0.5, 17, "#4c5266", 0.01);
  // el panteó dels Westenra, al fons
  box(c, cam, -2.4, 2.4, 0, 3.6, 17, 21, { front: "#6b7287", side: "#4c5266", top: "#8f97a8" });
  quad(c, cam, [[-2.7, 3.6, 17], [2.7, 3.6, 17], [0, 5, 17]], "#8f97a8");
  for (const x of [-1.9, 1.5]) column(c, cam, x + 0.2, 16.8, 3.4, 0.35, "#8f97a8");
  door(c, cam, -0.8, 0.8, 2.4, 16.98, { wood: "#161427", frame: "#4c5266", arch: false });
  { const [x, y] = cam.p(0, 3.1, 16.95); c.text(Math.round(x - 18), Math.round(y), "WESTENRA", "#161427"); }
  // la creu gran i les tombes
  box(c, cam, 3.5, 3.8, 0, 4.4, 15, 15.3, { front: "#8f97a8" }); box(c, cam, 2.8, 4.5, 3.2, 3.5, 15, 15.3, { front: "#8f97a8" });
  for (const [x, z, k] of [[-5.6, 10, 0], [-4.2, 12, 2], [-6, 13.6, 1], [-3.6, 14.6, 0], [-5, 16.4, 0], [4.4, 11.6, 0], [5.6, 13.6, 1], [-7, 11, 0]]) grave(c, cam, x, z, k, "#6b7287");
  { const [x, y] = cam.p(6.6, 0, 18); deadTree(c, x, y, cam.s(18), 6, "#07060b", 25); }
  fog(c, 150, 200, [143, 151, 168], 26, 25);
  const sc = scene(cam, c, [floorPoly(cam, -3, 3, 172).map(([x, y]) => [Math.max(60, Math.min(262, x)), y])], 172, { outdoor: true });
  sc.spots = {
    "ex-kg-hs": R(60, 200, 20, 39),
    "ex-kg-cripta": hbBack(cam, -1, 1, 0, 2.6, 17, 2),
    "ho-kg-creu": hbBox(cam, 2.8, 4.5, 0, 4.4, 15, 15.3, 1),
    "ho-kg-tombes": R(0, 120, 72, 100),
  };
  sc.pts = { "c-vh-king": at(cam, 1.6, 9.2), "c-arthur-king": at(cam, -1.6, 9.2) };
  return sc;
}

/* 26. Panteó dels Westenra */
export function cripta() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 12, hgt = 4.4;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#4c5266", joint: "#2b2a48", ceil: "#1f1d36", stone: { h: 0.6, w: 1.2 },
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 1, "#3b3a5c", "#2b2a48") });
  // els nínxols de la paret del fons
  for (let row = 0; row < 3; row++) for (let k = 0; k < 5; k++) { const x = -4.2 + k * 1.75, y = 1.1 + row * 0.95; backQ(c, cam, x, x + 1.4, y, y + 0.7, zb - 0.01, "#2b2a48"); backQ(c, cam, x + 0.1, x + 1.3, y + 0.1, y + 0.6, zb - 0.02, (row + k) % 3 ? "#8f97a8" : "#6b7287"); }
  // la porta de ferro (esquerra), espelmes i flors marcides
  sideQ(c, cam, xl, 10, 11.8, 0, 2.8, "#161427");
  for (let z = 10.2; z < 11.8; z += 0.3) seg(c, cam, [xl, 0, z], [xl, 2.6, z], "#4c5266");
  for (const x of [-2.4, 2.4]) { box(c, cam, x - 0.15, x + 0.15, 0, 1, 10.8, 11.1, { front: "#6b7287" }); candleAt(c, cam, x, 1, 10.9, 0.6); }
  const sc = scene(cam, c, floorW(cam, -4.4, 4.6, 196), 196);
  sc.spots = {
    "ex-cr-sortir": edgeR(196),
    "ho-cr-porta": hbSide(cam, xl, 9.8, 12, 0, 3, 1),
    "ho-cr-nínxols": hbBack(cam, -4.2, 4.6, 1.1, 3.9, zb, 1),
  };
  sc.pts = { "c-arthur-cripta": at(cam, -3, 8.6), "o-taut": at(cam, 0, 9.6), "o-lucy-vampira": at(cam, 3, 9) };
  return sc;
}

/* 27. Asil de Purfleet (entrada) */
export function asil() {
  const { cam, c } = newScene(), xl = -6, xr = 6, zb = 13, hgt = 5;
  hall(c, cam, { xl, xr, zb, hgt, kind: "plaster", wall: "#8f97a8", joint: "#4c5266", ceil: "#4c5266",
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 0.8, "#4c5266", "#3b3a5c") });
  // quatre portes al fons, amb rètols
  const doors = [[-4.8, -3.6, "PACIENTS"], [-1.2, 0.2, "DR. SEWARD"], [1.8, 3.0, "SALO"], [3.8, 5.0, "MRS HARKER"]];
  for (const [x0, x1, t] of doors) { door(c, cam, x0, x1, 2.5, zb - 0.01, { wood: "#3e2e22", frame: "#4c5266", arch: false }); const [px, py] = cam.p((x0 + x1) / 2, 2.85, zb); c.text(Math.round(px - (t.length * 4) / 2), Math.round(py), t, "#161427"); }
  // el taulell del zelador, un banc i un llum de gas
  box(c, cam, -1.6, 0.6, 0, 1.1, 9.4, 10.2, { front: "#3e2e22", top: "#6e5638" });
  bench(c, cam, -5.6, -3.6, 9, 9.6, 0.45, "#3e2e22");
  for (const x of [-2.4, 2.6]) { seg(c, cam, [x, hgt, 10], [x, 3.2, 10], "#161427"); box(c, cam, x - 0.15, x + 0.15, 2.9, 3.2, 9.9, 10.1, { front: "#ffd870" }); addLight(c, x, 3, 9.6, [1, 0.8, 0.5], 4, 0.9, { kind: "candle", ...glowAt(cam, x, 3.05, 10) }); }
  const door1 = sideExit(c, cam, xl, { at: 7.6, w: 1.6, h: 2.6, wood: "#3e2e22" }); const door2 = sideExit(c, cam, xr, { at: 7.6, w: 1.6, h: 2.6, wood: "#2f4237" });
  const sc = scene(cam, c, floorW(cam, -5.4, 5.4, 186), 186);
  sc.spots = {
    "ex-as-picc": door1, "ex-as-jardi": door2,
    "ex-as-cella": hbBack(cam, -4.8, -3.6, 0, 3, zb, 1), "ex-as-despatx": hbBack(cam, -1.2, 0.2, 0, 3, zb, 1),
    "ex-as-sala": hbBack(cam, 1.8, 3.0, 0, 3, zb, 1), "ex-as-mina": hbBack(cam, 3.8, 5.0, 0, 3, zb, 1),
  };
  sc.pts = { "c-zelador": at(cam, -0.6, 9.0) };
  return sc;
}

/* 28. Despatx del Dr. Seward */
export function despatx() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 12.5, hgt = 4.6;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#2f4237", joint: "#1c2a24", ceil: "#3b3a5c",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.25, "#6e5638", "#3e2e22") });
  shelfBack(c, cam, -4.8, -1.8, 3.6, zb, 28);
  // la xemeneia amb estatuetes, el fonògraf damunt d'un moble, l'escriptori
  fireplace(c, cam, -1.2, 0.8, zb, { stone: "#6b7287", h: 1.4 });
  for (const x of [-1.0, -0.5, 0.3]) { const [px, py] = cam.p(x, 1.4, zb - 0.3); c.rect(px, py - 5, 2, 5, "#dcdbe0"); c.circle(px + 1, py - 6, 1, "#dcdbe0"); }
  box(c, cam, 1.6, 2.6, 0, 1.1, zb - 0.6, zb, { front: "#3e2e22", top: "#6e5638" });
  box(c, cam, 1.85, 2.35, 1.1, 1.35, zb - 0.45, zb - 0.15, { front: "#3e2e22" });
  quad(c, cam, [[2.1, 1.35, zb - 0.3], [2.2, 1.5, zb - 0.3], [2.6, 2.0, zb - 0.3], [2.0, 2.0, zb - 0.3]], "#a08458");
  table(c, cam, -2.4, 0.4, 8.4, 9.6, 0.8, "#3e2e22");
  for (const [x, z] of [[-1.8, 8.7], [-1.0, 8.9]]) floorQ(c, cam, x, x + 0.4, z, z + 0.3, "#e8dcc0", 0.81);
  candleAt(c, cam, 0, 0.8, 9.2);
  chair(c, cam, -1, 10, "#3a0a10");
  gothicWindow(c, cam, 3.2, 4.4, 1.4, 3.4, zb, { glass: "#1f1d36", frame: "#1c2a24" });
  const door1 = sideExit(c, cam, xl, { at: 7.6, w: 1.4, h: 2.4, wood: "#3e2e22" });
  const sc = scene(cam, c, floorW(cam, -4.4, 4.4, 188), 188);
  sc.spots = {
    "ex-dp-asil": door1,
    "ho-dp-fonograf": hbBox(cam, 1.8, 2.7, 1.1, 2.1, zb - 0.6, zb, 1),
    "ho-dp-estatuetes": hbBox(cam, -1.3, 0.9, 1.3, 1.9, zb - 0.5, zb, 1),
    "ho-dp-prestatges": hbBack(cam, -4.8, -1.8, 0, 3.6, zb - 0.4, 1),
  };
  sc.pts = { "c-seward-desp": at(cam, 2.4, 9.2), "o-sucre": at(cam, -0.6, 8.9, 0.8), "o-pot": at(cam, -2.0, 9.2, 0.8) };
  return sc;
}

/* 29. Cel·la de Renfield */
export function cella() {
  const { cam, c } = newScene(), xl = -4.5, xr = 4.5, zb = 11.5, hgt = 4.4;
  hall(c, cam, { xl, xr, zb, hgt, kind: "plaster", wall: "#6b7287", joint: "#4c5266", ceil: "#3b3a5c",
    floor: () => tiles(c, cam, xl, xr, 0.5, zb, 1.1, "#4c5266", "#3b3a5c") });
  // la finestreta amb reixa, ben amunt, i el raig de lluna
  backQ(c, cam, -0.6, 0.6, 2.8, 3.8, zb - 0.01, "#2b2a48"); bars(c, cam, -0.6, 0.6, 2.8, 3.8, zb - 0.02, 5);
  addLight(c, 0, 1, 8.8, [0.55, 0.65, 1], 3.5, 0.8);
  floorQ(c, cam, -0.8, 0.8, 8.4, 10, [184, 188, 203, 40], 0.01);
  // el llit de ferro, un tamboret i les mosques
  box(c, cam, 1.6, 4.2, 0, 0.55, 9, 10.2, { front: "#3b3a5c", top: "#8f97a8" }); box(c, cam, 4.1, 4.2, 0.55, 1.2, 9, 10.2, { front: "#161427" });
  box(c, cam, -3, -2.6, 0, 0.5, 9.4, 9.8, { front: "#3e2e22" });
  const r = rng(29); for (let k = 0; k < 14; k++) c.px(140 + r() * 60, 60 + r() * 60, "#07060b");
  // taques i ratlles a la paret (en Renfield compta)
  for (let k = 0; k < 9; k++) { const [x, y] = cam.p(-4 + k * 0.12, 1.4, zb); c.line(x, y, x, y + 6, "#2b2a48"); }
  const door1 = sideExit(c, cam, xl, { at: 7.2, w: 1.4, h: 2.4, wood: "#3b3a5c", frame: "#2b2a48" });
  const sc = scene(cam, c, floorW(cam, -4, 4, 186), 186);
  sc.spots = {
    "ex-ce-asil": door1,
    "ho-ce-finestra": hbBack(cam, -0.7, 0.7, 2.7, 3.9, zb, 1),
    "ho-ce-llit": hbBox(cam, 1.6, 4.2, 0, 1.2, 9, 10.2, 1),
  };
  sc.pts = { "c-renfield": at(cam, 1, 8.6) };
  return sc;
}

/* 30. Jardí de l'asil */
export function jardi() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [90, 34, 10], seed: 30, clouds: 6 });
  forestSil(c, 120, 20, "#161427", { seed: 30 });
  floorQ(c, cam, -20, 20, 0.5, 60, "#2f4237");
  floorQ(c, cam, -14, 3, 0.5, 30, mat(cobbleMat("#4c5266"), "#4c5266"), 0.01);
  // el mur de Carfax, a la dreta, amb heura
  box(c, cam, 4.2, 4.8, 0, 3, 6, 20, { front: "#4c5266", side: "#6b7287", top: "#8f97a8" });
  const r = rng(30); for (let k = 0; k < 30; k++) { const z = 6 + r() * 14, y = r() * 2.6, [x, py] = cam.p(4.2, y, z); c.circle(x, py, 1 + r() * 2, "#1c2a24"); }
  // la façana de l'asil, la font i els rosers
  facade(c, cam, -12, 2, 6, 18, { wall: "#8f97a8", seed: 31, win: 6, lit: 0.4, roofH: 1.2, door: 2 });
  box(c, cam, -2.4, -0.6, 0, 0.6, 11.2, 12.6, { front: "#6b7287", top: "#1f1d36" });
  box(c, cam, -1.6, -1.4, 0.6, 1.6, 11.8, 12, { front: "#6b7287" });
  for (const z of [9, 10.4, 11.8, 13.2]) { const [x, y] = cam.p(3.4, 0, z), s = cam.s(z); c.ellipse(x, y - s * 0.3, s * 0.35, s * 0.3, "#1c2a24"); c.px(x - 1, y - s * 0.4, "#9e1a24"); c.px(x + 2, y - s * 0.3, "#9e1a24"); }
  const sc = scene(cam, c, floorW(cam, -6.6, 3.8, 188), 188, { outdoor: true });
  sc.spots = {
    "ex-jd-asil": edgeL(188),
    "ex-jd-mur": hbBox(cam, 4.2, 4.8, 0, 3.2, 6, 20, 0),
    "ho-jd-font": hbBox(cam, -2.4, -0.6, 0, 1.7, 11.2, 12.6, 2),
    "ho-jd-roses": hbBox(cam, 3, 3.8, 0, 0.8, 8.8, 13.6, 2),
  };
  return sc;
}

/* 31. Saló de l'asil */
export function salaReunio() {
  const { cam, c } = newScene(), xl = -5.5, xr = 5.5, zb = 13, hgt = 4.8;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#3a0a10", joint: "#2a1830", ceil: "#3b3a5c",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.25, "#6e5638", "#3e2e22") });
  fireplace(c, cam, -1.2, 1.2, zb, { stone: "#8f97a8", h: 1.6 });
  painting(c, cam, 3, 4.4, 2.2, 3.6, zb, portraitFace("#e8dcc0", "#161427", "#dcdbe0"));
  shelfBack(c, cam, -5.2, -2.8, 3.4, zb, 31);
  // la taula gran del consell de guerra, amb mapes i espelmes
  table(c, cam, -4, 0.4, 7.6, 9.6, 0.8, "#3e2e22", { cloth: "#2f4237" });
  floorQ(c, cam, -3.2, -1.4, 8, 9, "#c9b48a", 0.81);
  for (const x of [-3.6, 0]) candleAt(c, cam, x, 0.8, 8.6);
  for (const [x, z] of [[-3.4, 10], [-1.6, 10], [0.2, 10]]) chair(c, cam, x, z, "#3e2e22");
  const door1 = sideExit(c, cam, xr, { at: 7.6, w: 1.6, h: 2.6, wood: "#3e2e22" });
  const sc = scene(cam, c, floorW(cam, -5, 5, 186), 186);
  sc.walk = [floorPoly(cam, -5, 5, 186)];
  sc.spots = {
    "ex-sr-asil": door1,
    "ho-sr-taula": hbBox(cam, -4, 0.4, 0, 1.1, 7.6, 9.6, 1),
    "ho-sr-quadre": hbBack(cam, 3, 4.4, 2.2, 3.6, zb, 1),
  };
  sc.pts = { "c-vh-sala": at(cam, 2, 9.4), "c-quincey-sala": at(cam, 3.6, 8.8) };
  return sc;
}

/* 32. Habitació de la Mina */
export function habitacioMina() {
  const { cam, c } = newScene(), xl = -5, xr = 5, zb = 12.5, hgt = 4.4;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#4c5266", joint: "#3b3a5c", ceil: "#3b3a5c",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.25, "#6e5638", "#3e2e22") });
  bed(c, cam, 1, 3.8, 8.6, 12.2, { curtain: "#2f4237", blanket: "#dcdbe0", gold: "#a08458" });
  gothicWindow(c, cam, -1.6, -0.2, 1.4, 3.4, zb, { moon: true, glass: "#1f1d36", frame: "#3b3a5c" });
  curtains(c, cam, -1.6, -0.2, 1.4, 3.4, zb, "#2f4237");
  box(c, cam, -4.4, -3.2, 0, 0.8, 11, 11.8, { front: "#3e2e22", top: "#6e5638" }); candleAt(c, cam, -3.8, 0.8, 11.4);
  chair(c, cam, -3, 9.6, "#3e2e22");
  const door1 = sideExit(c, cam, xl, { at: 7.6, w: 1.4, h: 2.4, wood: "#3e2e22" });
  const sc = scene(cam, c, floorW(cam, -4.4, 4.4, 188), 188);
  sc.spots = { "ex-hm-asil": door1, "ho-hm-llit": hbBox(cam, 1, 3.8, 0, 2.4, 8.6, 12.2, 1) };
  sc.pts = { "c-mina-asil": at(cam, -2.4, 9) };
  return sc;
}

/* 33. Carfax (exterior) */
export function carfax() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [175, 52, 12], seed: 33, clouds: 6 });
  forestSil(c, 118, 22, "#0e0c16", { seed: 33 });
  floorQ(c, cam, -20, 20, 0.5, 60, "#1c2a24");
  // l'estany fosc
  const pond = []; for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; pond.push([1.4 + Math.cos(a) * 4.2, -0.02, 14 + Math.sin(a) * 2.4]); }
  quad(c, cam, pond, mat(waterMat("#161427", "#2b2a48", 175), "#161427"));
  // la casa en ruïnes i la capella vella a l'esquerra
  facade(c, cam, -12, -4, 7, 24, { wall: "#4c5266", seed: 33, win: 4, lit: 0, roofH: 3, roof: "#161427" });
  box(c, cam, -7, -4, 0, 4.4, 10, 15, { front: "#4c5266", side: "#3b3a5c" });
  quad(c, cam, [[-7.2, 4.4, 10], [-3.8, 4.4, 10], [-5.5, 6.4, 10]], "#2b2a48");
  door(c, cam, -6.2, -4.8, 2.4, 9.99, { wood: "#3e2e22", frame: "#2b2a48" });
  box(c, cam, -5.6, -5.4, 6.4, 7.6, 10, 10.2, { front: "#4c5266" }); box(c, cam, -5.9, -5.1, 7, 7.2, 10, 10.2, { front: "#4c5266" });
  { const [x, y] = cam.p(5, 0, 12); deadTree(c, x, y, cam.s(12), 5, "#07060b", 33); }
  const sc = scene(cam, c, floorW(cam, -6, 6.4, 196), 196, { outdoor: true });
  sc.spots = {
    "ex-cx-jardi": edgeR(196),
    "ex-cx-capella": hbBack(cam, -6.4, -4.6, 0, 2.8, 10, 2),
    "ho-cx-lluna": R(160, 36, 32, 32),
    "ho-cx-llac": hbBox(cam, -2.8, 5.6, 0, 0.1, 11.6, 16.4, 2),
  };
  return sc;
}

/* 34. Capella de Carfax */
export function carfaxCapella() {
  const cam = new Cam({ ...STD, f: 260 }), { c } = newScene(cam), xl = -5.5, xr = 5.5, zb = 13, hgt = 5;
  hall(c, cam, { xl, xr, zb, hgt, wall: "#3b3a5c", joint: "#1f1d36", ceil: "#0e0c16", stone: { h: 0.5, w: 0.9 },
    floor: () => floorQ(c, cam, xl, xr, 0.5, zb, "#3e2e22") });
  vault(c, cam, xl, xr, hgt - 1.2, 5, zb, 2, "#1f1d36");
  gothicWindow(c, cam, -0.8, 0.8, 1.8, 4, zb, { glass: "#2b2a48", frame: "#1f1d36", moon: true });
  addLight(c, 0, 1.5, 9.5, [0.55, 0.65, 1], 5, 1);
  // teranyines, pols i taques de terra a terra
  for (const [x, z] of [[-3, 9], [1.2, 10.4], [-0.6, 8], [3, 11.6]]) floorQ(c, cam, x, x + 1.2, z, z + 0.7, "#161427", 0.01);
  { const [x, y] = cam.p(xl, hgt, 6); for (let k = 0; k < 7; k++) c.line(x, y, x + 8 + k * 4, y + 16 - k * 2.4, "#6b7287"); }
  { const [x, y] = cam.p(xr, hgt, 7); for (let k = 0; k < 6; k++) c.line(x, y, x - 8 - k * 4, y + 14 - k * 2.4, "#6b7287"); }
  const sc = scene(cam, c, floorW(cam, -5, 5, 176), 176);
  sc.spots = { "ex-cc-sortir": edgeL(196), "ho-cc-murs": hbSide(cam, xl, 3, zb, 0, hgt, 0) };
  sc.pts = { "o-rates": at(cam, 0.4, 9.4), "o-caixes-carfax": at(cam, 3.2, 10.4), "o-llista": at(cam, -2.6, 8.6) };
  return sc;
}

/* 35. Piccadilly */
export function piccadilly() {
  const { cam, c } = newScene();
  sky(c, 140, { moon: null, top: "#161427", bottom: "#3b3a5c", seed: 35, clouds: 8, stars: 0 });
  street(c, cam, { zb: 19, seed: 35 });
  // la casa del comte (esquerra, en primer terme), la parada de cotxes i el carrer cap a l'est
  facade(c, cam, -9, -3.6, 6.6, 13, { wall: "#4c5266", seed: 351, win: 2, lit: 0, roofH: 0.6, door: 1, brick: true });
  box(c, cam, -7.2, -5.4, 0, 0.4, 12.2, 13, { front: "#6b7287", top: "#8f97a8" });
  box(c, cam, -0.8, 1.2, 0.6, 2.4, 16.4, 17.8, { front: "#161427", side: "#1f1d36" });
  for (const x of [-0.6, 1]) { const [px, py] = cam.p(x, 0.5, 16.3), s = cam.s(16.4); c.circle(px, py, s * 0.45, "#07060b"); }
  box(c, cam, -2.6, -1.2, 0.9, 1.6, 16.6, 17.2, { front: "#2a1830" });
  for (const x of [-2.4, -1.4]) box(c, cam, x, x + 0.08, 0, 0.9, 16.8, 16.9, { front: "#07060b" });
  box(c, cam, 5, 9, 0, 6, 15, 17, { front: "#3e2e22", side: "#2b2a48" });
  for (const x of [-4.4, 3.6]) gasLamp(c, cam, x, 11);
  figure(c, cam, 6.6, 16, { coat: "#161427", seed: 6 }); figure(c, cam, -3, 17, { coat: "#3f2343", hat: "#161427", seed: 7 });
  fog(c, 120, 190, [143, 151, 168], 32, 35);
  const sc = scene(cam, c, floorW(cam, -6.8, 6.8, 190), 190, { outdoor: true });
  sc.spots = {
    "ex-pc-hill": edgeL(190), "ex-pc-asil": edgeR(190),
    "ex-pc-hs": hbBox(cam, -2.6, 1.2, 0, 2.4, 16.4, 17.8, 2),
    "ex-pc-casa": hbBox(cam, -7.2, -5.4, 0, 2.6, 12.2, 13, 2),
    "ex-pc-east": hbBox(cam, 3.6, 5, 0, 5, 15, 19, 2),
  };
  sc.pts = { "c-serraller": at(cam, -4.2, 9.4), "o-comte-picc": at(cam, 4, 10.2) };
  return sc;
}

/* 36. Casa del comte a Piccadilly */
export function casaPiccadilly() {
  const { cam, c } = newScene(), xl = -5.5, xr = 5.5, zb = 13, hgt = 4.8;
  hall(c, cam, { xl, xr, zb, hgt, kind: "paper", wall: "#2a1830", joint: "#161427", ceil: "#1f1d36",
    floor: () => planks(c, cam, xl, xr, 0.5, zb, 0.25, "#3e2e22", "#1f1d36") });
  painting(c, cam, -4.6, -3.6, 2.2, 3.6, zb, portraitFace("#dcdbe0", "#161427", "#b8bccb"));
  fireplace(c, cam, -2.8, -0.8, zb, { stone: "#6b7287", h: 1.6 });
  for (const x of [1.6, 3.6]) { backQ(c, cam, x - 0.6, x + 0.6, 1.2, 3.4, zb - 0.01, "#3e2e22"); backQ(c, cam, x - 0.5, x + 0.5, 1.3, 3.3, zb - 0.02, "#2b2a48"); curtains(c, cam, x - 0.5, x + 0.5, 1.3, 3.3, zb, "#3a0a10"); }
  // llençols sobre els mobles, pols, una catifa enrotllada
  box(c, cam, -4.6, -2.6, 0, 1, 9, 10, { front: "#6b7287", top: "#8f97a8" });
  box(c, cam, 1.4, 3, 0, 0.3, 8.6, 9, { front: "#3a0a10", top: "#6b0f1a" });
  const door1 = sideExit(c, cam, xr, { at: 7.6, w: 1.6, h: 2.6, wood: "#3e2e22" });
  const sc = scene(cam, c, floorW(cam, -5, 5, 186), 186);
  sc.spots = {
    "ex-cp-sortir": door1,
    "ho-cp-llar": hbBox(cam, -2.9, -0.7, 0, 2, 12.4, 13, 1),
    "ho-cp-finestres": hbBack(cam, 0.9, 4.3, 1.2, 3.6, zb, 1),
    "ho-cp-retrat": hbBack(cam, -4.6, -3.6, 2.2, 3.6, zb, 1),
  };
  sc.pts = { "o-caixes-picc": at(cam, 3, 10.6), "o-rebut": at(cam, -1.6, 9.4) };
  return sc;
}

/* 37. Mile End */
export function mileEnd() {
  const { cam, c } = newScene();
  sky(c, 140, { moon: [270, 30, 8], top: "#161427", bottom: "#3b3a5c", seed: 37, clouds: 9 });
  street(c, cam, { zb: 22, seed: 37, lit: 0.3, cols: ["#3e2e22", "#4c5266", "#6b0f1a"] });
  sideFacade(c, cam, -6.4, 9, 22, 5, { wall: "#3e2e22", brick: true, seed: 371, lit: 0.3 });
  sideFacade(c, cam, 6.4, 9, 22, 5.6, { wall: "#4c5266", brick: true, seed: 372, lit: 0.3 });
  floorQ(c, cam, -6.4, 6.4, 0.5, 22, mat(cobbleMat("#3b3a5c"), "#3b3a5c"), 0.005);
  // la carreta del carreter i bótes
  box(c, cam, 1.6, 4.2, 0.6, 1.2, 11.6, 12.8, { front: "#6e5638", top: "#3e2e22" });
  for (const x of [1.9, 3.9]) { const [px, py] = cam.p(x, 0.5, 11.5), s = cam.s(11.6); c.circle(px, py, s * 0.5, "#161427"); c.circle(px, py, s * 0.35, "#3e2e22"); }
  for (const [x, z] of [[-5.4, 12], [-4.8, 12.6]]) box(c, cam, x, x + 0.6, 0, 0.9, z, z + 0.6, { front: "#6e5638" });
  gasLamp(c, cam, -1, 14);
  fog(c, 120, 180, [143, 151, 168], 34, 37);
  const sc = scene(cam, c, floorW(cam, -6, 6, 192), 192, { outdoor: true });
  sc.spots = { "ex-me-picc": edgeL(192), "ex-me-docks": edgeR(192), "ho-me-carrer": R(110, 110, 120, 70) };
  sc.pts = { "c-carreter": at(cam, 3.2, 9.6), "o-caixes-me": at(cam, -3.2, 9.6) };
  return sc;
}

/* 38. Zoo de Londres */
export function zoo() {
  const { cam, c } = newScene();
  sky(c, 150, { moon: [60, 30, 9], seed: 38, clouds: 6 });
  forestSil(c, 118, 20, "#161427", { seed: 38 });
  floorQ(c, cam, -20, 20, 0.5, 60, mat(cobbleMat("#4c5266"), "#4c5266"));
  // la casa dels elefants i l'elefant darrere la reixa
  facade(c, cam, -9, 4, 6, 18, { wall: "#a08458", brick: true, seed: 38, win: 4, lit: 0.2, roofH: 2, door: null });
  floorQ(c, cam, -8, 3, 13.4, 17.6, "#3e2e22", 0.01);
  { const [x, y] = cam.p(-2.6, 0, 15.6), s = cam.s(15.6); c.ellipse(x, y - s * 1.8, s * 1.7, s * 1.1, "#6b7287"); c.ellipse(x - s * 1.5, y - s * 2.2, s * 0.8, s * 0.7, "#6b7287"); c.ellipse(x - s * 1.3, y - s * 2.1, s * 0.5, s * 0.6, "#8f97a8"); c.rect(x - s * 2.2, y - s * 2, s * 0.35, s * 1.6, "#6b7287");
    for (const dx of [-1, -0.2, 0.6, 1.2]) c.rect(x + s * dx, y - s * 1, s * 0.4, s, "#6b7287"); c.px(x - s * 1.7, y - s * 2.35, "#07060b"); }
  bars(c, cam, -8, 3, 0, 2.4, 13.3, 30, "#161427");
  // la gàbia buida del llop (en Bersicker!), amb la porta oberta
  box(c, cam, 4.4, 7.4, 0, 2.2, 12, 14, { front: "#1f1d36", side: "#2b2a48" });
  bars(c, cam, 4.4, 7.4, 0, 2.2, 11.98, 10, "#4c5266");
  backQ(c, cam, 5.4, 6.2, 0, 1.8, 11.96, "#1f1d36");
  { const [x, y] = cam.p(5.9, 2.3, 11.9); c.text(Math.round(x - 8), Math.round(y - 4), "LLOPS", "#c9b48a"); }
  gasLamp(c, cam, 3.6, 10);
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 196), 196, { outdoor: true });
  sc.spots = { "ex-zo-hs": edgeL(196), "ho-zo-elefant": hbBack(cam, -8, 3, 0, 4, 15.6, 2) };
  sc.pts = { "c-bilder": at(cam, 3.8, 9) };
  return sc;
}

/* 39. Docks de Londres */
export function docks() {
  const { cam, c } = newScene();
  sky(c, 140, { moon: [270, 28, 9], top: "#161427", bottom: "#3b3a5c", seed: 39, clouds: 8 });
  floorQ(c, cam, -60, 60, 13, 200, mat(waterMat("#161427", "#3b3a5c", 270), "#1f1d36"), -0.4);
  ship(c, cam, -14, -5, 22, { masts: 3, waterY: -0.4 }); ship(c, cam, 6, 16, 26, { masts: 2, waterY: -0.4 });
  floorQ(c, cam, -16, 16, 0.5, 13, planks ? "#3e2e22" : "#3e2e22");
  planks(c, cam, -16, 16, 0.5, 13, 0.3, "#3e2e22", "#1f1d36");
  // les oficines de la naviliera i caixes al moll
  box(c, cam, -1.4, 4.6, 0, 4.4, 10.6, 13, { front: "#4c5266", side: "#3b3a5c", top: "#2b2a48" });
  door(c, cam, 0.6, 1.6, 2.2, 10.59, { wood: "#3e2e22", frame: "#2b2a48", arch: false });
  for (const x of [-0.6, 2.6, 3.6]) { backQ(c, cam, x, x + 0.6, 2.4, 3.4, 10.58, "#f0a040"); addLight(c, x + 0.3, 2.8, 10, [1, 0.7, 0.35], 2, 0.5); }
  { const [x, y] = cam.p(1.6, 3.9, 10.58); c.text(Math.round(x - 30), Math.round(y), "LLOYD'S AGENCY", "#e8dcc0"); }
  for (const [x, z] of [[-6, 10.4], [-5.2, 11], [-5.8, 11.6], [6, 10]]) crate(c, cam, x, x + 0.8, z, z + 0.7, 0.7);
  gasLamp(c, cam, -3, 9.6);
  fog(c, 110, 170, [143, 151, 168], 34, 39);
  const sc = scene(cam, c, floorW(cam, -6.6, 6.6, 196), 196, { outdoor: true });
  sc.spots = { "ex-dk-me": edgeL(196), "ex-dk-tren": edgeR(196), "ho-dk-casa": hbBox(cam, -1.4, 4.6, 0, 4.4, 10.6, 13, 0) };
  sc.pts = { "c-agent": at(cam, 2.4, 9.2) };
  return sc;
}

/* 40. L'Orient Exprés */
export function tren() {
  const cam = new Cam({ ...STD, f: 230 }), { c } = newScene(cam), xl = -4.2, xr = 4.2, zb = 11, hgt = 3.8;
  hall(c, cam, { xl, xr, zb, hgt, kind: "wood", wall: "#6e5638", joint: "#3e2e22", ceil: "#3e2e22",
    floor: () => rug(c, cam, xl, xr, 0.5, zb, "#3a0a10", "#3e2e22") });
  // finestres a l'esquerra amb el paisatge fosc que passa
  for (const z of [6, 8.4]) { sideQ(c, cam, xl, z, z + 1.6, 1.0, 2.6, "#a08458"); sideQ(c, cam, xl, z + 0.08, z + 1.52, 1.08, 2.52, "#1f1d36"); const r = rng(z * 10); for (let k = 0; k < 5; k++) { const [x, y] = cam.p(xl, 1.2 + r() * 0.6, z + 0.2 + r() * 1.2); c.px(x, y, "#4c5266"); } }
  // seients de vellut i la porta del passadís al fons
  for (const z of [7, 9.6]) box(c, cam, 1.6, 4.1, 0, 0.5, z, z + 1, { front: "#6b0f1a", top: "#9e1a24" });
  box(c, cam, 3.7, 4.1, 0.5, 1.6, 7, 10.6, { front: "#6b0f1a" });
  door(c, cam, -0.6, 0.6, 2.4, zb - 0.01, { wood: "#6e5638", frame: "#a08458", arch: false });
  backQ(c, cam, -0.4, 0.4, 1.4, 2.1, zb - 0.02, "#2b2a48");
  for (const x of [-2.6, 2.6]) { const [px, py] = cam.p(x, 3.2, zb); c.rect(px - 2, py, 4, 3, "#ffd870"); addLight(c, x, 3, zb - 0.5, [1, 0.75, 0.4], 3, 0.8); }
  const sc = scene(cam, c, floorW(cam, -3.6, 1.4, 190), 190);
  sc.spots = { "ex-tr-varna": hbBack(cam, -0.7, 0.7, 0, 2.6, zb, 1), "ho-tr-finestres": hbSide(cam, xl, 5.8, 10.2, 0.8, 2.8, 1) };
  sc.pts = { "c-arthur-tren": at(cam, -2.2, 8.2), "c-quincey-tren": at(cam, 1, 7.8) };
  return sc;
}

export const ACTE3 = { hampstead, kingstead, cripta, asil, despatx, cella, jardi, "sala-reunio": salaReunio, "habitacio-mina": habitacioMina, carfax,
  "carfax-capella": carfaxCapella, piccadilly, "casa-piccadilly": casaPiccadilly, "mile-end": mileEnd, zoo, docks, tren };
