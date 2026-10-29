import { readFileSync, existsSync } from "node:fs";
import { get } from "../../../skills/aventura-grafica/scripts/commons.mjs";
const F = JSON.parse(readFileSync("fons.json", "utf8"));
const only = process.argv.slice(2);
for (const [id, title] of Object.entries(F)) {
  if (only.length && !only.includes(id)) continue;
  const out = `imatges/${id}.jpg`;
  if (existsSync(out) && !only.length) continue;
  try { const m = await get(title, out); console.log(`${id}: ${m.license}`); }
  catch (e) { console.log(`${id}: ERROR ${e.message}`); }
}
