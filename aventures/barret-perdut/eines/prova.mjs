// Fulls de contacte dels decorats: fons, zona caminable (verd), punts calents (groc), objectes i una figura del
// protagonista a l'escala de la càmera en uns quants punts del terra. Ús: node eines/prova.mjs [castell|fora]
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url));
const K = await import(new URL("../../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const { Canvas, characterSheet } = K;
const mods = process.argv.slice(2).length ? process.argv.slice(2) : ["castell", "fora"];
const sheet = characterSheet({ skin: "#f0c8a0", hair: "#1a1a1a", glasses: "#222", shirt: "#9a1c1c", jacket: "#1e1e24", pants: "#2a2a30", shoes: "#111" });
function drawFig(c, x, y, h) {
  const s = h / 32;
  for (let j = 0; j < h; j++) for (let i = 0; i < 16 * s; i++) {
    const p = sheet.get(16 + Math.floor(i / s) % 16, 32 + Math.floor(j / s));   // fotograma de cara
    if (p[3]) c.px(Math.round(x - 8 * s + i), Math.round(y - h + j), p);
  }
}
const outline = (c, poly, col) => poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; c.line(p[0], p[1], q[0], q[1], col); });
mkdirSync(join(HERE, "../prova"), { recursive: true });
for (const m of mods) {
  const S = await import(new URL(`../${m}.mjs`, import.meta.url));
  const names = Object.keys(S).filter((k) => typeof S[k] === "function");
  for (const name of names) {
    const sc = S[name]();
    const c = new Canvas(320, 200); c.draw(sc.bg, 0, 0);
    for (const o of Object.values(sc.objs ?? {})) { const img = o.imgs.find(Boolean); c.draw(img, Math.round(o.pos[0] - img.w / 2), o.pos[1] - img.h); }
    const clean = new Canvas(320, 200); clean.draw(c, 0, 0);
    for (const p of sc.walk) outline(c, p, "#4ade80");
    for (const h of Object.values(sc.spots ?? {})) outline(c, h, "#f5b942");
    const ys = sc.walk.flat().map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const hAt = (y) => sc.ah.far + (sc.ah.near - sc.ah.far) * (y - y0) / (y1 - y0);
    for (const [x, y] of Object.values(sc.pts ?? {})) { c.rect(x - 1, y - 1, 3, 3, "#ff40ff"); }
    for (const [x, y] of Object.values(sc.pts ?? {}).filter(([, y]) => y >= y0 && y <= y1).slice(0, 3)) drawFig(c, x, y, Math.round(hAt(y)));
    drawFig(clean, 160, y1, sc.ah.near); drawFig(clean, 160, y0 + 1, sc.ah.far);
    const z = K.zoomed(c, 2), z2 = K.zoomed(clean, 2);
    writeFileSync(join(HERE, `../prova/${name}.png`), z.png());
    writeFileSync(join(HERE, `../prova/${name}.net.png`), z2.png());
    console.log(name, sc.ah);
  }
}
