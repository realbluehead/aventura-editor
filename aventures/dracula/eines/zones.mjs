import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const K = await import("../../../skills/aventura-grafica/scripts/kit.mjs");
const { unzip } = await import("../../../export.mjs");
const a = JSON.parse(unzip(readFileSync("joc.zip")).find((e) => e.name === "adventure.json").data.toString("utf8"));
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
mkdirSync("prova/zones", { recursive: true });
const only = process.argv.slice(2);
const scenes = only.length ? a.scenes.filter((s) => only.includes(s.id)) : a.scenes;
for (let i = 0; i < scenes.length; i += 4) {
  const sheet = new K.Canvas(1290, 820, "#000000");
  scenes.slice(i, i + 4).forEach((s, k) => {
    const img = K.toCanvas(K.decodePng(readFileSync(`preview/${slug(s.name)}.zones.png`)));
    const ox = (k % 2) * 650, oy = Math.floor(k / 2) * 412;
    sheet.draw(img, ox, oy + 10);
    sheet.text(ox, oy + 2, `${s.id}`.toUpperCase(), "#ffff66");
  });
  writeFileSync(`prova/zones/z-${String(i / 4 + 1).padStart(2, "0")}.png`, sheet.png());
}
console.log("ok");
