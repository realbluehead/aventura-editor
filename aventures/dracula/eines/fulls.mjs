// Fulls de contacte: 4 fons per full, ampliats ×2, amb una graella cada 20 px i les coordenades
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const E = await import("../estil.mjs");
const K = await import("../../../skills/aventura-grafica/scripts/kit.mjs");
const F = JSON.parse(readFileSync("fons.json", "utf8"));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(F);
mkdirSync("prova/fulls", { recursive: true });
const OPTS = JSON.parse(readFileSync("opcions.json", "utf8").toString() || "{}");
for (let s = 0; s < ids.length; s += 4) {
  const sheet = new K.Canvas(660, 430, "#000000");
  ids.slice(s, s + 4).forEach((id, k) => {
    const c = E.fons(`imatges/${id}.jpg`, OPTS[id] ?? {});
    const ox = (k % 2) * 330, oy = Math.floor(k / 2) * 215;
    sheet.draw(c, ox + 10, oy + 12);
    for (let x = 0; x <= 320; x += 20) for (let y = 0; y < 200; y += 2) sheet.px(ox + 10 + x, oy + 12 + y, x % 100 ? [255, 255, 0, 70] : [255, 80, 80, 140]);
    for (let y = 0; y <= 200; y += 20) for (let x = 0; x < 320; x += 2) sheet.px(ox + 10 + x, oy + 12 + y, y % 100 ? [255, 255, 0, 70] : [255, 80, 80, 140]);
    sheet.text(ox + 10, oy + 4, id.toUpperCase(), "#ffffff");
    for (let y = 0; y <= 200; y += 40) sheet.text(ox, oy + 10 + y, String(y / 10), "#ffff66");
  });
  writeFileSync(`prova/fulls/full-${String(s / 4 + 1).padStart(2, "0")}.png`, K.zoomed(sheet, 2).png());
}
console.log("fet");
