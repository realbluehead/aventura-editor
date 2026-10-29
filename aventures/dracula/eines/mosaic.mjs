// 9 escenaris per imatge, a mitja mida, per revisar-los tots de cop
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const K = await import("../../../skills/aventura-grafica/scripts/kit.mjs");
const { unzip } = await import("../../../export.mjs");
const a = JSON.parse(unzip(readFileSync("joc.zip")).find((e) => e.name === "adventure.json").data.toString("utf8"));
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
mkdirSync("prova/mosaic", { recursive: true });
for (let i = 0; i < a.scenes.length; i += 9) {
  const sheet = new K.Canvas(966, 750, "#000000");
  a.scenes.slice(i, i + 9).forEach((s, k) => {
    const ox = (k % 3) * 323, oy = Math.floor(k / 3) * 250;
    sheet.draw(K.toCanvas(K.ops.resample(K.decodePng(readFileSync(`preview/${slug(s.name)}.png`)), 320, 240, "nearest")), ox, oy + 8);
    sheet.text(ox, oy + 1, s.id.slice(2).toUpperCase(), "#ffff66");
  });
  writeFileSync(`prova/mosaic/m-${i / 9 + 1}.png`, sheet.png());
}
