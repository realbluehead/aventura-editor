// Els decorats de fora del castell (6 escenaris): jardins, cabana d'en Hagrid, hivernacle, camp de Quidditch,
// Bosc Prohibit i riba del llac. Mateix sistema que castell.mjs.
import { theme } from "./persp.mjs";
import {
  Canvas, mix, rng, Cam, fill, quad, seg, box, floorQ, backQ, sideQ, stoneBack, stoneSide, floorPoly, tiles, planks,
  torch, gothicWindow, sideWindow, door, sideDoor, nightSky, castle, standee, pine, oak,
  STD, hb, hbBox, hbBack, hbSide, at, cut, room, beams, table, bench, fire, fireplace,
} from "./comu.mjs";

const W = 320;
const scene = (cam, walk, yt, yb = 197) => ({ cam, walk, ah: cam.actor(yt, yb) });

// Terra d'herba amb franges segons la profunditat (més fosca lluny)
function grass(c, cam, z0, z1, near = "#3a6a3a", far = "#1a2e2a", x0 = -80, x1 = 80) {
  if (theme()) return floorQ(c, cam, x0, x1, z0, z1, theme().grass(near, far, z0, z1));
  for (let z = z0, k = 0; z < z1; z *= 1.12, k++) floorQ(c, cam, x0, x1, z, Math.min(z * 1.12, z1), mix(mix(near, far, Math.min(1, (z - z0) / (z1 - z0) * 1.4)), k % 2 ? "#000" : "#fff", 0.04));
  const r = rng(5);
  for (let k = 0; k < 400; k++) { const Z = z0 + r() * (z1 - z0) * 0.4, [x, y] = cam.p((r() - 0.5) * 40, 0, Z); if (y < 200) c.px(x, y, mix(near, "#9ac07a", 0.3 * r())); }
}
// Un camí de pedres que va cap al fons seguint una corba
function path(c, cam, pts, w, col) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [xa, za] = pts[i], [xb, zb] = pts[i + 1];
    quad(c, cam, [[xa - w / 2, 0, za], [xa + w / 2, 0, za], [xb + w / 2, 0, zb], [xb - w / 2, 0, zb]], theme() ? theme().dirt(col) : i % 2 ? col : mix(col, "#000", 0.06));
  }
}

/* 15. Jardins del castell */
export function jardins() {
  const cam = new Cam({ vx: 160, vy: 88, f: 250, E: 2.65 }), c = new Canvas(W, 200);
  nightSky(c, 100, { moon: [280, 24, 8], seed: 41 });
  // turons i el castell a dalt
  fill(c, [[0, 92], [60, 80], [130, 70], [200, 72], [260, 84], [320, 88], [320, 100], [0, 100]], "#16202a");
  castle(c, 96, 76, 1.0);
  c.rect(0, 88, W, 12, "#16202a");
  grass(c, cam, 4, 120);
  // el llac a l'esquerra, a l'horitzó
  fill(c, [[0, 88], [70, 88], [56, 96], [0, 98]], "#1a2a50"); for (let k = 0; k < 10; k++) c.px(4 + k * 6, 92 + (k % 3), "#5a6aa0");
  // camí cap al castell
  path(c, cam, [[0.5, 4], [0.8, 8], [0.2, 12], [-0.8, 18], [-0.4, 26], [0.4, 36], [0.6, 60]], 1.6, "#6a6458");
  // cabana d'en Hagrid (esquerra) i el bosc darrere
  for (let k = 0; k < 18; k++) standee(c, cam, -26 + k * 1.1, 34 + (k % 3) * 2, (cc, x, y, s) => pine(cc, x, y, s, 9 + (k % 4) * 2, "#14261e", k));
  standee(c, cam, -12, 24, (cc, x, y, s) => {
    const w = s * 4, h = s * 2.6;
    cc.rect(x - w / 2, y - h, w, h, "#6a5a4a"); for (let j = 0; j < 5; j++) cc.rect(x - w / 2, y - h + j * h / 5, w, 1, "#5a4a3a");
    fill(cc, [[x - w * 0.6, y - h], [x + w * 0.6, y - h], [x, y - h - s * 2.4]], "#3a2a1e");
    cc.rect(x - s * 0.5, y - s * 1.8, s * 1.0, s * 1.8, "#3a2412"); cc.rect(x + s * 0.8, y - s * 1.6, s * 0.8, s * 0.7, "#ffcf6a"); (cc.twinkles ??= []).push({ x: x + s * 0.8, y: y - s * 1.6, w: s * 0.8, h: s * 0.7, col: "#ffcf6a", warm: true });
    cc.rect(x + s * 0.9, y - h - s * 1.8, s * 0.5, s * 1.2, "#4a3a2a"); for (let j = 0; j < 4; j++) cc.circle(x + s * (1.1 + j * 0.3), y - h - s * (2.2 + j * 0.6), Math.max(1, s * (0.3 + j * 0.1)), [140, 140, 150, 80]);
  });
  // carbasses gegants d'en Hagrid
  for (const [X, Z] of [[-8, 16], [-6.5, 17], [-9.2, 18.5]]) standee(c, cam, X, Z, (cc, x, y, s) => { cc.ellipse(x, y - s * 0.5, s * 0.8, s * 0.5, "#d0701a"); cc.rect(x - 1, y - s, 2, 2, "#2a5a1a"); });
  // hivernacle (dreta, a mitja distància) i camp de Quidditch al fons a la dreta
  standee(c, cam, 9, 15, (cc, x, y, s) => {
    const w = s * 5, h = s * 2.2;
    cc.rect(x - w / 2, y - h, w, h, [120, 170, 160, 170]); fill(cc, [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2 - s, y - h - s * 1.2], [x - w / 2 + s, y - h - s * 1.2]], [150, 190, 180, 170]);
    for (let i = 0; i <= 8; i++) cc.rect(x - w / 2 + (i * w) / 8, y - h, 1, h, "#2a3a3a");
    cc.rect(x - w / 2, y - h / 2, w, 1, "#2a3a3a"); cc.rect(x - s * 0.5, y - s * 1.8, s, s * 1.8, "#2a3a3a");
    for (let i = 0; i < 6; i++) cc.circle(x - w / 2 + s * (0.6 + i * 0.75), y - s * 0.8, Math.max(1, s * 0.25), "#3a7a3a");
  });
  for (const [X, H] of [[17, 12], [19, 15], [21, 12]]) standee(c, cam, X, 46, (cc, x, y, s) => { cc.rect(x, y - H * s, 1, H * s, "#c9a227"); cc.ellipse(x, y - H * s - s * 1.2, s * 1.1, s * 1.2, "#c9a227"); cc.ellipse(x, y - H * s - s * 1.2, s * 0.8, s * 0.9, "#16202a"); });
  for (const X of [14, 24]) standee(c, cam, X, 50, (cc, x, y, s) => { cc.rect(x - s, y - s * 6, s * 2, s * 6, "#5a4a3a"); cc.rect(x - s, y - s * 6, s * 2, s * 2, "#9a1c1c"); });
  // arbres de primer terme
  standee(c, cam, -7, 7, (cc, x, y, s) => oak(cc, x, y, s, 6, "#1e3a24", 3));
  standee(c, cam, 8, 6.4, (cc, x, y, s) => oak(cc, x, y, s, 5.5, "#1e3a24", 8));
  return {
    ...scene(cam, [floorPoly(cam, -14, 14, 104)], 104), bg: c,
    spots: {
      castell: [[136, 64], [184, 64], [184, 108], [136, 108]],
      cabana: hb(cam, [[-14.2, 0, 24], [-9.8, 5.2, 24]], 1),
      bosc: [[76, 30], [118, 30], [118, 104], [76, 104]],
      quidditch: [[236, 20], [300, 20], [300, 106], [236, 106]],
      hivernacle: hb(cam, [[6.5, 0, 15], [11.5, 3.4, 15]], 1),
      llac: [[0, 160], [26, 160], [26, 199], [0, 199]],
      carbasses: hb(cam, [[-9.8, 0, 16], [-6, 1, 18.5]], 2),
    },
    pts: { draco: at(cam, 2.2, 9.5), deCastell: at(cam, 0.2, 30), deCabana: at(cam, -6.8, 24), deBosc: at(cam, -11, 28), deQuidditch: at(cam, 11, 34), deHivernacle: at(cam, 6.0, 15), deLlac: at(cam, -3.0, 6.6) },
    objs: {},
  };
}

/* 16. Cabana d'en Hagrid */
export function cabana() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -4.5, xr = 4.5, zb = 10.5, hgt = 3.8;
  c.rect(0, 0, W, 200, "#2a1a10");
  // parets de troncs
  const logBack = () => { backQ(c, cam, xl, xr, 0, hgt, zb, "#6a4a30"); for (let y = 0; y < hgt; y += 0.32) seg(c, cam, [xl, y, zb], [xr, y, zb], "#4a3220"); };
  const logSide = (x, col) => { sideQ(c, cam, x, 0.5, zb, 0, hgt, col); for (let y = 0; y < hgt; y += 0.32) seg(c, cam, [x, y, 0.5], [x, y, zb], "#4a3220"); };
  quad(c, cam, [[xl, hgt, 0.5], [xr, hgt, 0.5], [xr, hgt, zb], [xl, hgt, zb]], "#2e1e14");
  logSide(xl, "#5e4028"); logSide(xr, "#563a24"); logBack();
  planks(c, cam, xl, xr, 0.5, zb, 0.4, "#5a3e26", "#46301c");
  beams(c, cam, xl, xr, hgt, 5, zb - 0.4, 1.4, "#3a2616");
  // pernils i ballesta
  for (const x of [-1.8, -1.2, 0.8]) { const [px, py] = cam.p(x, hgt - 0.25, 8.6), s = cam.s(8.6); c.line(px, py, px, py + s * 0.4, "#2a1a10"); c.ellipse(px, py + s * 0.65, s * 0.15, s * 0.28, "#a85a3a"); }
  const [bx, by] = cam.p(1.2, 2.4, zb - 0.02), s0 = cam.s(zb); c.rect(bx, by, s0 * 1.2, 2, "#3a2414"); c.line(bx + 4, by - 6, bx + 4, by + 7, "#5a4030");
  // llar de foc amb la tetera (esquerra del fons)
  fireplace(c, cam, -3.8, -1.6, zb, { stone: "#6a6058", h: 1.8 });
  const [kx, ky] = cam.p(-2.7, 0.45, zb - 0.7), s1 = cam.s(zb - 0.7); c.ellipse(kx, ky - s1 * 0.2, s1 * 0.28, s1 * 0.22, "#2a2a2e");
  // llit gegant (dreta) amb edredó de retalls
  box(c, cam, 2.2, xr, 0, 0.7, 7.0, 10.3, { front: "#4a3020", top: "#4a3020" });
  const r = rng(6), quilt = ["#a83a2a", "#3a6a8a", "#c8a040", "#5a8a3a", "#8a4a8a"];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) floorQ(c, cam, 2.25 + i * 0.75, 2.25 + (i + 1) * 0.75, 7.05 + j * 0.8, 7.05 + (j + 1) * 0.8, quilt[Math.floor(r() * 5)], 0.72);
  backQ(c, cam, 2.2, xr, 0, 0.72, 7.0, "#5a3a24");
  // finestra
  sideWindow(c, cam, xl, 7.6, 8.6, 1.2, 2.2, { glass: "#1a2a4a", frame: "#3a2414" });
  // taula (davant a l'esquerra) amb tassa gegant
  table(c, cam, -3.6, -1.8, 7.0, 8.2, 0.95, "#5a3a20");
  const [tx, ty] = cam.p(-2.2, 0.96, 7.6); c.rect(tx - 3, ty - 6, 6, 6, "#c8c0b0"); c.rect(tx + 3, ty - 5, 2, 3, "#c8c0b0");
  // porta de sortida (paret dreta, davant)
  const dz0 = 7.8, dz1 = 9.2;
  const sack = (k) => { const [x, y] = cam.p(1.2, 0, 10.0), s = cam.s(10.0); k.ellipse(x, y - s * 0.35, s * 0.36, s * 0.38, "#7a6a40"); k.rect(x - s * 0.15, y - s * 0.8, s * 0.3, s * 0.12, "#5a4a2a"); k.text(x - 5, y - s * 0.45, "FEMS", "#3a2a10"); };
  const cakes = (k) => { for (let i = 0; i < 3; i++) { const [x, y] = cam.p(-3.2 + i * 0.25, 0.96, 7.5 + (i % 2) * 0.2); k.circle(x, y - 2, 2, "#8a7a5a"); k.px(x - 1, y - 3, "#5a4a2a"); } };
  const fang = (k) => { const [x, y] = cam.p(-1.0, 0, 9.4), s = cam.s(9.4); k.ellipse(x, y - s * 0.22, s * 0.6, s * 0.22, "#2a2220"); k.circle(x - s * 0.55, y - s * 0.3, s * 0.18, "#2a2220"); k.px(x - s * 0.62, y - s * 0.34, "#c0a060"); k.rect(x - s * 0.7, y - s * 0.16, 3, 2, "#c06070"); };
  return {
    ...scene(cam, [floorPoly(cam, -3.8, 2.0, 150)], 150), bg: c,
    spots: {
      sortida: [[268, 176], [319, 176], [319, 199], [268, 199]],
      foc: hbBox(cam, -3.8, -1.6, 0, 2.0, zb - 0.5, zb, 0),
      llit: hbBox(cam, 2.2, xr, 0, 0.75, 7.0, 10.3, 0),
      pernils: hb(cam, [[-2.0, hgt - 0.2, 8.6], [1.0, hgt - 1.0, 8.6]], 2),
      ballesta: hbBack(cam, 1.1, 2.5, 2.2, 2.7, zb, 1),
      tassa: hbBox(cam, -2.4, -1.9, 0.9, 1.3, 7.4, 7.8, 1),
    },
    pts: { hagrid: at(cam, 0.6, 8.4), arribada: at(cam, 1.4, 6.8), sackWalk: at(cam, 1.0, 9.4), cakesWalk: at(cam, -1.6, 7.0) },
    objs: { fems: cut(sack), galetes: cut(cakes), fang: cut(fang) },
  };
}

/* 17. Hivernacle */
export function hivernacle() {
  const cam = new Cam(STD), c = new Canvas(W, 200);
  const xl = -4.5, xr = 4.5, zb = 16, hgt = 3.4, ridge = 5.0;
  nightSky(c, 120, { top: "#0a1426", bottom: "#24304a", moon: [230, 30, 6], seed: 51 });
  const glass = [120, 170, 170, 70], frame = "#2a3a3a";
  // vidres: parets laterals, fons i teulada a dues aigües
  sideQ(c, cam, xl, 0.5, zb, 0, hgt, glass); sideQ(c, cam, xr, 0.5, zb, 0, hgt, glass);
  backQ(c, cam, xl, xr, 0, hgt, zb, glass); quad(c, cam, [[xl, hgt, zb], [0, ridge, zb], [xr, hgt, zb]], glass);
  for (let z = 1; z <= zb; z += 1.5) { seg(c, cam, [xl, 0, z], [xl, hgt, z], frame); seg(c, cam, [xr, 0, z], [xr, hgt, z], frame); seg(c, cam, [xl, hgt, z], [0, ridge, z], frame); seg(c, cam, [xr, hgt, z], [0, ridge, z], frame); }
  for (const y of [hgt / 2, hgt]) { seg(c, cam, [xl, y, 0.5], [xl, y, zb], frame); seg(c, cam, [xr, y, 0.5], [xr, y, zb], frame); }
  seg(c, cam, [0, ridge, 0.5], [0, ridge, zb], frame);
  for (let x = xl; x <= xr; x += 1.5) seg(c, cam, [x, 0, zb], [x, hgt, zb], frame);
  floorQ(c, cam, xl, xr, 0.5, zb, "#4a3a2a");
  for (let k = 0; k < 300; k++) { const r = rng(k); const [x, y] = cam.p((r() - 0.5) * 9, 0, 6 + r() * 10); c.px(x, y, "#5a4a36"); }
  // taules llargues amb testos
  const r = rng(12);
  for (const [x0, x1] of [[xl + 0.1, -2.6], [2.6, xr - 0.1]]) {
    table(c, cam, x0, x1, 6.5, 15.5, 0.9, "#5a4a3a", { cloth: "#4a3a2a" });
    for (let z = 10.8; z < 15.3; z += 0.6) {
      const X = (x0 + x1) / 2 + (r() - 0.5) * 0.6, [px, py] = cam.p(X, 0.9, z), s = cam.s(z);
      c.rect(px - s * 0.15, py - s * 0.25, s * 0.3, s * 0.25, "#a0583a");
      for (let i = 0; i < 4; i++) c.ellipse(px + (r() - 0.5) * s * 0.4, py - s * (0.4 + r() * 0.3), Math.max(1, s * 0.12), Math.max(1, s * 0.2), mix("#3a7a3a", "#8ac05a", r()));
    }
  }
  // tentàcula venenosa al fons
  const [vx, vy] = cam.p(0.2, 0, zb - 0.4), s2 = cam.s(zb);
  for (let i = 0; i < 5; i++) c.line(vx, vy, vx + (i - 2) * s2 * 0.5, vy - s2 * (1.2 + (i % 2) * 0.6), "#3a8a4a");
  c.rect(vx - s2 * 0.3, vy - s2 * 0.4, s2 * 0.6, s2 * 0.4, "#7a4a3a");
  const mandrake = (pulled) => (k) => {
    for (let i = 0; i < 4; i++) {
      const Z = 7.2 + i * 0.85, [x, y] = cam.p(3.5, 0.9, Z), s = cam.s(Z);
      k.rect(x - s * 0.2, y - s * 0.32, s * 0.4, s * 0.32, "#b0603a"); k.rect(x - s * 0.22, y - s * 0.34, s * 0.44, 2, "#c8784a");
      if (pulled && i === 0) { k.ellipse(x - s * 0.6, y - s * 0.6, s * 0.1, s * 0.16, "#c8a070"); k.px(x - s * 0.62, y - s * 0.66, "#111"); continue; }
      for (let j = -1; j <= 1; j++) k.ellipse(x + j * s * 0.1, y - s * 0.5, Math.max(1, s * 0.07), Math.max(2, s * 0.18), j ? "#4a8a3a" : "#6aaa4a");
    }
  };
  return {
    ...scene(cam, [floorPoly(cam, -2.4, 2.4, 125)], 125), bg: c,
    spots: {
      sortida: [[0, 176], [70, 176], [70, 199], [0, 199]],
      tentacula: hb(cam, [[-1.0, 0, zb - 0.4], [1.4, 1.8, zb - 0.4]], 2),
      testos: hbBox(cam, xl + 0.1, -2.6, 0.9, 1.5, 10.6, 15.4, 0),
      vidres: [[0, 0], [319, 0], [319, 30], [0, 30]],
    },
    pts: { sprout: at(cam, -1.2, 11.2), arribada: at(cam, -1.4, 7.0), mandWalk: at(cam, 2.2, 7.6) },
    objs: { mandragora: cut(mandrake(false), mandrake(true)) },
  };
}

/* 18. Camp de Quidditch */
export function quidditch() {
  const cam = new Cam({ vx: 160, vy: 92, f: 250, E: 2.55 }), c = new Canvas(W, 200);
  nightSky(c, 100, { top: "#08102a", bottom: "#283a5a", moon: [40, 22, 8], seed: 61 });
  c.rect(0, 86, W, 14, "#1a2430");
  if (theme()) floorQ(c, cam, -60, 60, 4, 140, theme().grass("#3a6a3a", "#16262a", 4, 60, 3));
  else for (let z = 4, k = 0; z < 140; z *= 1.08, k++) floorQ(c, cam, -60, 60, z, z * 1.08, k % 2 ? mix("#2e5a32", "#16262a", Math.min(1, z / 60)) : mix("#3a6a3a", "#16262a", Math.min(1, z / 60)));
  // línia del mig
  floorQ(c, cam, -0.05, 0.05, 5, 60, [220, 220, 220, 80]);
  // graderies: torres amb teles dels colors de les cases
  const cols = ["#9a1c1c", "#1f6a30", "#c8a020", "#22408a"];
  for (const side of [-1, 1]) for (let i = 5; i >= 0; i--) {
    const Z = 12 + i * 6, X = side * 14;
    box(c, cam, X - 1.2, X + 1.2, 0, 7, Z, Z + 2, { front: "#5a4a3a", side: "#4a3a2a", top: "#3a2a1a" });
    backQ(c, cam, X - 1.2, X + 1.2, 4.6, 7, Z - 0.01, cols[(i + (side > 0 ? 2 : 0)) % 4]);
    fill(c, [cam.p(X - 1.4, 7, Z), cam.p(X + 1.4, 7, Z), cam.p(X, 9, Z + 1)], cols[(i + 1) % 4]);
  }
  // les tres anelles de porteria al fons
  for (const [X, H] of [[-3, 11], [0, 14], [3, 11]]) {
    const Z = 42, [x, y] = cam.p(X, 0, Z), s = cam.s(Z), [, yt] = cam.p(X, H, Z);
    c.rect(x, yt, Math.max(1, s * 0.15), y - yt, "#c9a227");
    c.ellipse(x, yt - s * 1.3, s * 1.3, s * 1.3, "#c9a227"); c.ellipse(x, yt - s * 1.3, s * 1.0, s * 1.0, mix("#283a5a", "#08102a", 0.3));
  }
  // caseta de les escombres (davant a l'esquerra)
  const snitch = (k) => { const [x, y] = cam.p(1.8, 4.4, 12), s = cam.s(12); k.circle(x, y, Math.max(1, s * 0.08), "#f0c830"); k.px(x, y, "#fff0a0"); fill(k, [[x - 1, y], [x - 7, y - 4], [x - 6, y - 1]], "#e8e8f0"); fill(k, [[x + 1, y], [x + 7, y - 4], [x + 6, y - 1]], "#e8e8f0"); k.circle(x, y, 4, [255, 220, 80, 40]); };
  return {
    ...scene(cam, [floorPoly(cam, -9, 9, 122)], 122), bg: c,
    spots: {
      sortida: [[0, 168], [22, 168], [22, 199], [0, 199]],
      porteries: hb(cam, [[-4.4, 0, 42], [4.4, 16.6, 42]], 2),
      graderies: [[0, 20], [90, 20], [90, 118], [0, 118]],
      graderies2: [[230, 20], [319, 20], [319, 118], [230, 118]],
    },
    pts: { hooch: at(cam, -2.4, 9.0), arribada: at(cam, -5.0, 7.2), snitchWalk: at(cam, 1.6, 11.0) },
    objs: { snitch: cut(snitch) },
  };
}

/* 19. Bosc Prohibit */
export function bosc() {
  const cam = new Cam({ vx: 160, vy: 92, f: 250, E: 2.55 }), c = new Canvas(W, 200);
  c.gradient(0, 0, W, 110, "#06080e", "#121a22", 6);
  if (theme()) floorQ(c, cam, -60, 60, 4, 80, theme().grass("#2e3a22", "#0c1012", 4, 30, 0, "#4a3a26"));
  else for (let z = 4, k = 0; z < 80; z *= 1.1, k++) floorQ(c, cam, -60, 60, z, z * 1.1, mix(k % 2 ? "#26301e" : "#2a3420", "#0c1012", Math.min(1, z / 30)));
  // camí de terra
  quad(c, cam, [[-0.7, 0, 4], [0.9, 0, 4], [0.3, 0, 30], [-0.3, 0, 30]], theme() ? theme().dirt("#3a3226") : "#3a3226");
  // raig de lluna
  fill(c, [[150, 0], [196, 0], [230, 190], [120, 190]], [170, 190, 230, 22]);
  // troncs a moltes profunditats (del fons cap endavant)
  const r = rng(91), trees = [];
  for (let k = 0; k < 60; k++) { const Z = 6 + r() * 34, X = (r() - 0.5) * 30; if (Math.abs(X) < 2.6 + Z * 0.05) continue; trees.push([X, Z, 0.4 + r() * 0.5]); }
  trees.sort((a, b) => b[1] - a[1]);
  for (const [X, Z, w] of trees) {
    const [x, y] = cam.p(X, 0, Z), s = cam.s(Z), col = mix("#3a2e24", "#0c1012", Math.min(0.9, Z / 40));
    c.rect(x - (w * s) / 2, 0, w * s, y, col);
    c.rect(x - (w * s) / 2, 0, Math.max(1, w * s * 0.25), y, mix(col, "#8a9ab0", 0.08));
    for (let i = 0; i < 3; i++) c.line(x, y - s * (3 + i * 1.5), x + (i % 2 ? 1 : -1) * s * 1.2, y - s * (4.2 + i * 1.5), col);
    c.ellipse(x, y, (w * s) * 0.8, Math.max(1, s * 0.1), col);
  }
  // fullam a dalt
  for (let k = 0; k < 40; k++) c.circle(r() * W, r() * 24, 10 + r() * 14, mix("#0e1610", "#1a2a1a", r()));
  // unicorn adormit al fons, platejat
  const [ux, uy] = cam.p(-1.6, 0, 22), su = cam.s(22);
  c.ellipse(ux, uy - su * 0.35, su * 0.7, su * 0.3, "#d8e0f0"); c.circle(ux - su * 0.7, uy - su * 0.55, su * 0.2, "#e8eef8"); c.line(ux - su * 0.8, uy - su * 0.7, ux - su * 1.0, uy - su * 1.1, "#f0e0a0");
  c.circle(ux, uy - su * 0.4, su * 1.2, [200, 220, 255, 26]);
  // boira
  for (let k = 0; k < 8; k++) c.ellipse(r() * W, 150 + r() * 40, 40 + r() * 40, 4, [140, 160, 190, 26]);
  return {
    ...scene(cam, [floorPoly(cam, -3.2, 3.2, 120)], 120), bg: c,
    spots: {
      sortida: [[286, 170], [319, 170], [319, 199], [286, 199]],
      unicorn: hb(cam, [[-2.8, 0, 22], [-0.6, 1.2, 22]], 2),
      arbres: [[0, 0], [90, 0], [90, 150], [0, 150]],
      cami: hb(cam, [[-0.3, 0, 30], [0.3, 0, 16]], 2),
    },
    pts: { firenze: at(cam, 1.3, 9.5), arribada: at(cam, 2.4, 6.4) },
    objs: {},
  };
}

/* 20. Riba del llac */
export function llac() {
  const cam = new Cam({ vx: 160, vy: 96, f: 250, E: 2.45 }), c = new Canvas(W, 200);
  nightSky(c, 98, { top: "#060c26", bottom: "#2a3466", moon: [96, 30, 9], seed: 71 });
  // muntanyes i el castell a l'altra banda
  fill(c, [[0, 96], [40, 88], [90, 92], [150, 84], [200, 90], [250, 86], [320, 92], [320, 98], [0, 98]], "#141a30");
  fill(c, [[170, 96], [200, 74], [300, 74], [320, 96]], "#141a30");
  castle(c, 190, 76, 0.8);
  // aigua fins a l'horitzó, amb el reflex de la lluna i de les finestres
  if (theme()) floorQ(c, cam, -200, 200, 10, 300, theme().water("#1a2a5a", "#0c1430", 96));
  else for (let z = 10, k = 0; z < 300; z *= 1.06, k++) floorQ(c, cam, -200, 200, z, z * 1.06, mix(k % 2 ? "#1a2a5a" : "#16244e", "#0c1430", Math.min(1, z / 200)));
  const r = rng(13);
  for (let y = 98; y < 150; y += 2) { const w = 2 + (y - 98) * 0.25; c.rect(96 - w / 2 + (r() - 0.5) * 4, y, w, 1, [240, 240, 210, 140 - (y - 98) * 2]); }
  for (let k = 0; k < 30; k++) c.rect(200 + r() * 100, 98 + r() * 12, 2, 1, [255, 207, 106, 120]);
  // riba de còdols
  quad(c, cam, [[-60, 0, 3], [60, 0, 3], [60, 0, 11.5], [-60, 0, 11.5]], theme() ? theme().pebbles("#4a4a44") : "#4a4a44");
  quad(c, cam, [[-60, 0, 11.2], [60, 0, 11.2], [60, 0, 12.3], [-60, 0, 12.3]], "#3a3a3a");
  for (let k = 0; k < 160; k++) { const Z = 4.5 + r() * 7, [x, y] = cam.p((r() - 0.5) * 24, 0, Z), s = cam.s(Z); c.ellipse(x, y, Math.max(1, s * 0.12), Math.max(1, s * 0.05), mix("#6a6a60", "#2a2a28", r())); }
  // moll de fusta que entra a l'aigua
  for (let z = 22; z > 8; z -= 1.5) for (const x of [1.0, 2.6]) box(c, cam, x, x + 0.12, -0.6, 0.35, z, z + 0.12, { front: "#3a2a1a" });
  planks(c, cam, 1.0, 2.7, 9, 22, 0.28, "#6a4a2e", "#4a3220");
  quad(c, cam, [[1.0, 0.35, 9], [2.7, 0.35, 9], [2.7, 0.35, 22], [1.0, 0.35, 22]], "#6a4a2e");
  for (let z = 9; z < 22; z += 0.6) seg(c, cam, [1.0, 0.35, z], [2.7, 0.35, z], "#4a3220");
  // roques i joncs
  for (const [X, Z, w] of [[-7, 9, 1.6], [6, 8, 1.2], [-4, 11, 0.8]]) { const [x, y] = cam.p(X, 0, Z), s = cam.s(Z); c.ellipse(x, y - s * w * 0.3, s * w * 0.6, s * w * 0.4, "#3a3a40"); c.ellipse(x - s * 0.1, y - s * w * 0.45, s * w * 0.3, s * w * 0.15, "#5a5a60"); }
  for (let k = 0; k < 30; k++) { const X = -12 + r() * 4, Z = 10 + r() * 2, [x, y] = cam.p(X, 0, Z), s = cam.s(Z); c.line(x, y, x + (r() - 0.5) * 3, y - s * (0.6 + r() * 0.6), "#3a5a3a"); }
  const tentacle = (k) => { const [x, y] = cam.p(-5, 0, 18), s = cam.s(18); for (let i = 0; i < 10; i++) k.circle(x + Math.sin(i * 0.6) * s * 0.4, y - i * s * 0.25, Math.max(1, s * (0.25 - i * 0.02)), i % 2 ? "#8a5a7a" : "#9a6a8a"); for (let i = 0; i < 4; i++) k.px(x + Math.sin(i * 1.2) * s * 0.4 + 1, y - i * s * 0.5 - 1, "#e8c8d8"); };
  const dock = floorPoly(cam, 1.15, 2.55, 125, 154);
  return {
    ...scene(cam, [floorPoly(cam, -9, 9, 150), dock], 125), bg: c,
    spots: {
      sortida: [[0, 160], [22, 160], [22, 199], [0, 199]],
      aigua: [[0, 99], [319, 99], [319, 136], [0, 136]],
      castell: [[188, 56], [300, 56], [300, 98], [188, 98]],
      lluna: [[84, 18], [108, 18], [108, 42], [84, 42]],
      moll: hb(cam, [[1.0, 0.35, 12], [2.7, 0.35, 22]], 2),
    },
    pts: { luna: at(cam, -2.2, 7.4), arribada: at(cam, -6.0, 6.4), aiguaWalk: at(cam, 1.8, 18), tentWalk: at(cam, -3.0, 11.0) },
    objs: { tentacle: cut(tentacle) },
  };
}
