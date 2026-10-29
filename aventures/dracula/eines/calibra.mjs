// Prova de l'estil dels fons amb personatges a sobre, a la mida del joc: node eines/calibra.mjs hotel kingstead ...
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const E = await import("../estil.mjs");
const K = await import("../../../skills/aventura-grafica/scripts/kit.mjs");
const OPTS = JSON.parse(readFileSync("opcions.json", "utf8"));
const ids = process.argv.slice(2);
const sheet = new K.Canvas(660, Math.ceil(ids.length / 2) * 215, "#000000");
const people = ["jonathan", "mina", "vanHelsing", "dracula"];
ids.forEach((id, k) => {
  const c = E.fons(`imatges/${id}.jpg`, OPTS[id] ?? {});
  // Personatges a 54 px d'alçada, com al joc (cada píxel del sprite ≈ 1,7 píxels)
  people.forEach((p, i) => {
    const f = E.figura(E.LOOKS[p], i % 2 ? 0 : 4), s = 54 / 32;
    for (let y = 0; y < 54; y++) for (let x = 0; x < Math.round(16 * s); x++) { const px = f.get(Math.floor(x / s), Math.floor(y / s)); if (px[3]) c.px(90 + i * 40 + x, 140 + y, px); }
  });
  sheet.draw(c, (k % 2) * 330 + 5, Math.floor(k / 2) * 215 + 10);
  sheet.text((k % 2) * 330 + 5, Math.floor(k / 2) * 215 + 2, id.toUpperCase(), "#ffff66");
});
mkdirSync("prova", { recursive: true });
writeFileSync("prova/calibra.png", K.zoomed(sheet, 2).png());
