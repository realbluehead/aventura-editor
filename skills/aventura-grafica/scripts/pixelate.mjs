// Converteix una imatge (foto, pintura, gravat) en pixel art per fer-ne un fons, un objecte o la pantalla de títol.
//   node pixelate.mjs entrada.jpg sortida.png [--width 320] [--height 200] [--fit cover|contain|stretch]
//        [--preset photo|painting|soft|sprite|ega|pico8|gameboy] [--colors 32] [--palette db32] [--dither floyd]
//        [--crop x,y,w,h] (fraccions 0–1 de l'original)  [--anchor-x 0.5] [--anchor-y 0.5]
//        [--brightness 0] [--contrast 0] [--saturation 0] [--remove-bg] [--outline "#1a1c2c"]
// Deixa també sortida.zoom.png, ampliada ×3, per mirar-la amb l'eina Read i decidir si està bé.
import { writeFileSync } from "node:fs";
import { pixelArt, zoomed } from "./kit.mjs";

const [input, output, ...rest] = process.argv.slice(2);
if (!input || !output) {
  console.error("Ús: node pixelate.mjs entrada.jpg sortida.png [--width 320 --height 200 --preset photo ...]");
  process.exit(2);
}
const opts = {};
for (let i = 0; i < rest.length; i++) {
  const key = rest[i].replace(/^--/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase());
  const next = rest[i + 1];
  if (next === undefined || next.startsWith("--")) { opts[key] = true; continue; }
  i++;
  if (key === "crop") opts.crop = next.split(",").map(Number);
  else if (key === "anchorX" || key === "anchorY") opts[key] = Number(next);
  else opts[key] = /^-?\d+(\.\d+)?$/.test(next) ? Number(next) : next;
}
const c = pixelArt(input, opts);
writeFileSync(output, c.png());
const zoomFile = output.replace(/\.png$/i, "") + ".zoom.png";
writeFileSync(zoomFile, zoomed(c, Number(opts.zoom) || 3).png());
console.log(`${output}: ${c.w}×${c.h} · per revisar-la: ${zoomFile}`);
