// Mostra un escenari amb els seus objectes animats en dos fotogrames (0 i el del mig), un sota l'altre, ampliat ×2.
// Ús: node eines/fx-prova.mjs <id-escenari> sortida.png   (llegeix joc.zip)
import { readFileSync, writeFileSync } from "node:fs";
const K = await import(new URL("../../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const { unzip } = await import(new URL("../../../export.mjs", import.meta.url));
const [sid, out] = process.argv.slice(2);
const e = unzip(readFileSync(new URL("../joc.zip", import.meta.url)));
const a = JSON.parse(e.find((x) => x.name === "adventure.json").data);
const file = (n) => K.toCanvas(K.decodePng(e.find((x) => x.name === `files/${n}`).data));
const sc = a.scenes.find((s) => s.id === sid);
const sheet = new K.Canvas(320, 400);
for (const row of [0, 1]) {
  const c = new K.Canvas(320, 200); c.draw(file(sc.background), 0, 0);
  for (const p of sc.objects) {
    const o = a.objects.find((x) => x.id === p.objectId), st = o.states.find((x) => x.id === o.initialState);
    const f = st.frames ? st.frames[row ? Math.floor(st.frames.length / 2) : 0] : st.image;
    if (!f) continue;
    const img = file(f); c.draw(img, Math.round(p.position[0] - img.w / 2), Math.round(p.position[1] - img.h));
  }
  sheet.draw(c, 0, row * 200);
}
writeFileSync(out, K.zoomed(sheet, 2).png());
