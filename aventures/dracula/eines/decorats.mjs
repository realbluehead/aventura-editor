// Dibuixa els decorats fets per codi (decorats/*.mjs) sense fer tot el joc: un PNG de 640×480 per escenari i un
// altre amb les zones (terra caminable en verd, punts calents en groc, on van les coses en vermell, amb una barra
// de l'alçada d'un actor), i fulls amb 12 decorats en petit. Ús: node eines/decorats.mjs [clau ...]
import { writeFileSync, mkdirSync } from "node:fs";
const K = await import("../../../skills/aventura-grafica/scripts/kit.mjs");
const T = await import("../decorats/textura.mjs");
const { DECORATS } = await import("../decorats/index.mjs");
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DECORATS);
mkdirSync("prova/decorats", { recursive: true });
const ahAt = (sc, y) => { const [yt, yb] = [Math.min(...sc.walk.flat().map((p) => p[1])), 237]; return sc.ah.far + ((sc.ah.near - sc.ah.far) * (y - yt)) / Math.max(1, yb - yt); };
const shots = [];
for (const k of keys) {
  const t0 = Date.now(), sc = T.render(DECORATS[k], T.DRACULA);
  const big = K.zoomed(sc.bg, 2);
  writeFileSync(`prova/decorats/${k}.png`, big.png());
  const z = K.zoomed(sc.bg, 2);
  const poly = (pts, col) => pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; z.line(p[0] * 2, p[1] * 2, q[0] * 2, q[1] * 2, col); });
  for (const w of sc.walk) poly(w, "#00ff66");
  for (const [id, p] of Object.entries(sc.spots)) { poly(p, id.startsWith("ex-") ? "#00ccff" : "#ffff00"); z.text(p[0][0] * 2 + 2, p[0][1] * 2 + 2, id.replace(/^(ho|ex)-[a-z]+-/, ""), "#ffffff"); }
  for (const [id, [x, y]] of Object.entries(sc.pts)) { const h = ahAt(sc, y) * 2; z.rect(x * 2 - 1, y * 2 - h, 3, h, [255, 60, 60, 160]); z.text(x * 2 + 4, y * 2 - 10, id.slice(2), "#ff8080"); }
  writeFileSync(`prova/decorats/${k}.zones.png`, z.png());
  shots.push([k, sc.bg]);
  console.log(`${k}: ${Date.now() - t0} ms`);
}
for (let i = 0; i < shots.length; i += 12) {
  const part = shots.slice(i, i + 12), sheet = new K.Canvas(966, Math.ceil(part.length / 3) * 250, "#000000");
  part.forEach(([k, bg], j) => { const ox = (j % 3) * 323, oy = Math.floor(j / 3) * 250; sheet.draw(bg, ox, oy + 8); sheet.text(ox, oy, k.toUpperCase(), "#ffff66"); });
  writeFileSync(`prova/decorats/_full-${i / 12 + 1}.png`, sheet.png());
}
