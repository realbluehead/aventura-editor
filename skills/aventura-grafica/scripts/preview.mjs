// Fa una imatge de cada escenari tal com es veurà, amb el que no es veu marcat a sobre, per revisar-lo amb l'eina Read:
//   - els personatges i els objectes dibuixats al seu lloc i a la seva mida (segons la profunditat);
//   - en verd, la zona caminable; en groc, els punts calents; en blau cel, les sortides (amb el nom);
//   - creus blaves: on arriba el protagonista quan ve d'un altre escenari; creus blanques: on es posa per tocar una cosa.
// També fa «personatges.png», amb el full de sprites de cada personatge, i «objectes.png», amb tots els objectes.
//   node preview.mjs joc.zip carpeta [--scale 3]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzip } from "../../../export.mjs";
import { actorHeightAt } from "../../../public/js/player/actor.js";
import { facingToDir, animationFor } from "../../../public/js/player/characters.js";
import { Canvas, decodePng, toCanvas, zoomed } from "./kit.mjs";

const [zipPath, outDir, ...rest] = process.argv.slice(2);
if (!zipPath || !outDir) { console.error("Ús: node preview.mjs joc.zip carpeta [--scale 3]"); process.exit(2); }
const scale = Number(rest[rest.indexOf("--scale") + 1]) || 3;
mkdirSync(outDir, { recursive: true });

const entries = unzip(readFileSync(zipPath));
const a = JSON.parse(entries.find((e) => e.name === "adventure.json").data.toString("utf8"));
const files = new Map(entries.filter((e) => e.name.startsWith("files/")).map((e) => [e.name.slice(6), e.data]));
const image = (f) => (f && files.has(f) ? toCanvas(decodePng(files.get(f))) : null);
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Copia una part d'un llenç a un altre, escalada al més proper i emmirallada si cal
function blit(dst, src, sx, sy, sw, sh, dx, dy, dw, dh, flip = 1) {
  for (let y = 0; y < Math.round(dh); y++) for (let x = 0; x < Math.round(dw); x++) {
    const u = Math.floor(((flip === 1 ? x : dw - 1 - x) * sw) / dw), v = Math.floor((y * sh) / dh);
    const p = src.get(sx + u, sy + v);
    if (p[3] > 16) dst.px(dx + x, dy + y, p);
  }
}
const outline = (c, poly, color, k) => poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; c.line(p[0] * k, p[1] * k, q[0] * k, q[1] * k, color); });
const cross = (c, [x, y], color, k) => { c.line(x * k - 4, y * k, x * k + 4, y * k, color); c.line(x * k, y * k - 4, x * k, y * k + 4, color); };
const label = (c, x, y, text, color) => {
  const w = Canvas.textWidth(text);
  c.rect(x - 1, y - 1, w + 2, 7, [0, 0, 0, 170]);
  c.text(x, y, text, color);
};

const sheets = new Map(a.characters.map((ch) => [ch.id, image(ch.sheet)]));

for (const s of a.scenes) {
  const bg = image(s.background);
  if (!bg) { console.log(`«${s.name}»: sense fons`); continue; }
  const heightAt = actorHeightAt(s, bg.h);
  const view = new Canvas(bg.w, bg.h);
  view.draw(bg, 0, 0);
  // Objectes i personatges, de més lluny a més a prop
  const things = [
    ...s.objects.map((p) => ({ y: p.position[1], draw: () => {
      const o = a.objects.find((x) => x.id === p.objectId);
      const img = image(o?.states.find((st) => st.id === o.initialState)?.image);
      if (img) view.draw(img, Math.round(p.position[0] - img.w / 2), Math.round(p.position[1] - img.h));
    } })),
    ...s.characters.map((p) => ({ y: p.position[1], draw: () => {
      const ch = a.characters.find((x) => x.id === p.characterId), sheet = sheets.get(p.characterId);
      if (!ch || !sheet) return;
      const { dir, flip } = facingToDir(p.facing);
      const frame = animationFor(ch, "idle", dir).frames[0] ?? 0, cols = Math.max(1, Math.floor(sheet.w / ch.frameWidth));
      const h = heightAt(p.position[1]), w = (ch.frameWidth / ch.frameHeight) * h;
      blit(view, sheet, (frame % cols) * ch.frameWidth, Math.floor(frame / cols) * ch.frameHeight, ch.frameWidth, ch.frameHeight,
        Math.round(p.position[0] - w / 2), Math.round(p.position[1] - h), w, h, flip);
    } })),
  ].sort((x, y) => x.y - y.y);
  things.forEach((t) => t.draw());
  writeFileSync(join(outDir, `${slug(s.name)}.png`), zoomed(view, scale).png());

  // La mateixa imatge amb les zones marcades
  const k = scale, z = zoomed(view, k);
  for (const poly of s.walkable) outline(z, poly, "#33ff66", k);
  for (const h of s.hotspots) {
    outline(z, h.polygon, h.exit ? "#33ccff" : "#ffd23f", k);
    const [x, y] = h.polygon[0];
    label(z, x * k + 2, y * k + 2, (h.exit ? "> " : "") + h.name, h.exit ? "#33ccff" : "#ffd23f");
  }
  for (const p of [...s.objects, ...s.characters]) if (p.walkTo) cross(z, p.walkTo, "#ffffff", k);
  for (const other of a.scenes) for (const h of other.hotspots) {
    if (h.exit?.sceneId === s.id && h.exit.arrival) { cross(z, h.exit.arrival, "#33ccff", k); label(z, h.exit.arrival[0] * k + 6, h.exit.arrival[1] * k - 3, `DES DE ${other.name}`, "#33ccff"); }
  }
  // Mida del protagonista a dalt i a baix de la zona caminable
  const ys = s.walkable.flat().map((p) => p[1]);
  if (ys.length) for (const y of [Math.min(...ys), Math.max(...ys)]) z.rect(4, y * k - heightAt(y) * k, 3, heightAt(y) * k, "#ff4fd8");
  writeFileSync(join(outDir, `${slug(s.name)}.zones.png`), z.png());
  console.log(`${join(outDir, slug(s.name))}.png i .zones.png`);
}

// Fulls dels personatges i objectes, ampliats
const strip = (items, file) => {
  if (!items.length) return;
  const pad = 6, w = items.reduce((n, it) => n + it.img.w + pad, pad), h = Math.max(...items.map((it) => it.img.h)) + pad * 2 + 8;
  const c = new Canvas(w, h, "#5a5a6a");
  let x = pad;
  for (const it of items) { c.draw(it.img, x, pad + 8); c.text(x, 1, it.name.slice(0, Math.floor(it.img.w / 4) + 2), "#ffffff"); x += it.img.w + pad; }
  writeFileSync(join(outDir, file), zoomed(c, 4).png());
  console.log(join(outDir, file));
};
strip(a.characters.filter((ch) => sheets.get(ch.id)).map((ch) => ({ name: ch.name, img: sheets.get(ch.id) })), "personatges.png");
strip(a.objects.flatMap((o) => o.states.filter((st) => st.image).map((st) => ({ name: o.name, img: image(st.image) }))), "objectes.png");
