// Comprova un zip d'aventura abans de donar-lo per bo:
//   1. el valida amb el mateix codi que el servidor de l'editor (importar-lo ha de funcionar);
//   2. l'analitza com fa la pàgina «Puzles» de l'editor: si es pot acabar i què no es pot fer mai;
//   3. revisa la geometria: zones, sortides, punts d'arribada i posicions dins del fons i de la zona caminable.
//   node check.mjs joc.zip
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { configure, handle } from "../../../public/js/backend/core.js";
import { zip, unzip, zipName } from "../../../export.mjs";
import { analyze, sceneWarnings } from "../../../public/js/analysis.js";
import { pointInPolygon, distToSegment } from "../../../public/js/geometry.js";

// Un magatzem en memòria per fer servir el nucli del servidor sense tocar el disc
function memoryStore() {
  const adventures = new Map(), files = new Map();
  return {
    list: async () => [...adventures.values()],
    load: async (id) => adventures.get(id) ?? null,
    save: async (a) => void adventures.set(a.id, structuredClone(a)),
    remove: async (id) => void adventures.delete(id),
    putFile: async (id, f, b) => void files.set(`${id}/${f}`, b),
    getFile: async (id, f) => files.get(`${id}/${f}`) ?? null,
    removeFile: async (id, f) => void files.delete(`${id}/${f}`),
    files: async (id) => [...files].filter(([k]) => k.startsWith(`${id}/`)).map(([k, data]) => ({ name: k.slice(id.length + 1), data })),
  };
}
configure(memoryStore(), { zip, unzip, zipName, exportFiles: async () => [] });

async function importWithServerCode(bytes) {
  let status = 0, body = null;
  const req = { method: "POST", headers: { "content-type": "application/zip" }, read: async () => Buffer.from(bytes) };
  const res = { writeHead(s) { status = s; }, end(b) { body = b; } };
  await handle(req, res, "/api/import");
  const text = Buffer.from(body ?? "").toString("utf8");
  return { status, data: text ? JSON.parse(text) : null };
}

// Mida d'un PNG sense descomprimir-lo
function pngSize(buf) {
  if (!buf || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

const inBounds = ([x, y], [w, h]) => x >= 0 && y >= 0 && x <= w && y <= h;
const inWalkable = (p, scene) => scene.walkable.some((poly) => pointInPolygon(p, poly));

export async function checkZip(bytes) {
  const errors = [], warnings = [];
  let entries;
  try { entries = unzip(Buffer.from(bytes)); } catch (e) { return { errors: [e.message], warnings, canFinish: false }; }
  const json = entries.find((e) => e.name === "adventure.json");
  if (!json) return { errors: ["El zip no té adventure.json"], warnings, canFinish: false };
  const a = JSON.parse(json.data.toString("utf8"));
  const files = new Map(entries.filter((e) => e.name.startsWith("files/")).map((e) => [e.name.slice(6), e.data]));

  // 1. El servidor l'accepta?
  const imported = await importWithServerCode(bytes);
  if (imported.status >= 300) errors.push(`El servidor no l'accepta: ${imported.data?.error ?? imported.status}`);

  // Fitxers a què es fa referència
  const refs = [
    ...a.scenes.map((s) => [s.background, `fons de «${s.name}»`]),
    ...a.characters.map((c) => [c.sheet, `full de «${c.name}»`]),
    ...a.objects.flatMap((o) => [[o.icon, `icona de «${o.name}»`], ...o.states.map((s) => [s.image, `imatge de «${o.name}» (${s.name})`])]),
    ...a.sounds.map((s) => [s.file, `so «${s.name}»`]),
    [a.titleScreen?.image, "pantalla de títol"],
  ].filter(([f]) => f);
  for (const [f, what] of refs) if (!files.has(f)) errors.push(`Falta el fitxer ${f} (${what})`);

  // 3. Geometria
  const byId = new Map(a.scenes.map((s) => [s.id, s]));
  const size = (s) => pngSize(files.get(s.background)) ?? [320, 200];
  for (const s of a.scenes) {
    const dim = size(s), where = `«${s.name}»`;
    if (!s.walkable?.length) errors.push(`${where} no té zona caminable`);
    for (const poly of s.walkable ?? []) if (!poly.every((p) => inBounds(p, dim))) warnings.push(`${where}: una zona caminable surt del fons (${dim.join("×")})`);
    for (const h of s.hotspots) {
      if (!h.polygon.every((p) => inBounds(p, dim))) warnings.push(`${where}: «${h.name}» surt del fons`);
      if (!h.exit) continue;
      const target = byId.get(h.exit.sceneId);
      if (!target) { errors.push(`${where}: la sortida «${h.name}» porta a un escenari que no existeix (${h.exit.sceneId})`); continue; }
      if (!h.exit.arrival) warnings.push(`${where}: la sortida «${h.name}» no té punt d'arribada`);
      else if (!inWalkable(h.exit.arrival, target)) warnings.push(`${where}: la sortida «${h.name}» deixa el protagonista a ${JSON.stringify(h.exit.arrival)}, fora de la zona caminable de «${target.name}»`);
      // Una sortida s'ha de poder tocar caminant: el seu polígon ha de tocar o ser a prop de la zona caminable
      const gap = Math.min(...s.walkable.flatMap((poly) => h.polygon.map((p) => (pointInPolygon(p, poly) ? 0 :
        Math.min(...poly.map((a, i) => distToSegment(p, a, poly[(i + 1) % poly.length])))))));
      if (gap > dim[1] * 0.2) warnings.push(`${where}: la sortida «${h.name}» queda a ${Math.round(gap)} px de la zona caminable`);
    }
    for (const p of s.characters) {
      const name = a.characters.find((c) => c.id === p.characterId)?.name ?? p.characterId;
      if (!inBounds(p.position, dim)) errors.push(`${where}: «${name}» és fora del fons`);
      else if (!inWalkable(p.position, s)) warnings.push(`${where}: «${name}» té els peus fora de la zona caminable (${p.position})`);
      if (p.walkTo && !inWalkable(p.walkTo, s)) warnings.push(`${where}: el punt per parlar amb «${name}» és fora de la zona caminable`);
    }
    for (const p of s.objects) {
      const name = a.objects.find((o) => o.id === p.objectId)?.name ?? p.objectId;
      if (!inBounds(p.position, dim)) errors.push(`${where}: l'objecte «${name}» és fora del fons`);
      if (p.walkTo && !inWalkable(p.walkTo, s)) warnings.push(`${where}: el punt per agafar «${name}» és fora de la zona caminable`);
    }
  }
  for (const o of a.objects) if (o.pickable && !o.icon && !o.states.some((s) => s.image)) warnings.push(`«${o.name}» es pot agafar però no té cap imatge per a l'inventari`);
  if (a.playerId && !a.characters.some((c) => c.id === a.playerId)) errors.push("El protagonista (playerId) no existeix");
  if (!a.playerId) warnings.push("No hi ha protagonista: es farà servir la figura provisional");

  // 2. Es pot acabar?
  let r = null;
  try {
    r = analyze(imported.data?.id ? imported.data : a);
    for (const w of sceneWarnings(a)) warnings.push(w.text);
    for (const i of r.issues) (i.level === "error" ? errors : warnings).push(i.text);
    if (!r.hasEnding) errors.push("Cap regla, diàleg ni seqüència no acaba el joc (acció «end»)");
    else if (!r.canFinish) errors.push("El joc no es pot acabar: algun pas del camí cap al final no es pot fer mai (mira els avisos)");
    const unreached = a.scenes.filter((s) => !r.reachableScenes.has(s.id));
    if (unreached.length) warnings.push(`No s'arriba mai a: ${unreached.map((s) => s.name).join(", ")}`);
  } catch (e) {
    errors.push(`No s'ha pogut analitzar: ${e.message}`);
  }

  const summary = {
    scenes: a.scenes.length, characters: a.characters.length, objects: a.objects.length, rules: a.rules.length,
    dialogues: a.dialogues.length, cutscenes: a.cutscenes.length, sounds: a.sounds.length,
    kB: Math.round(bytes.length / 1024), criticalSteps: r?.chart?.critical?.size ?? null,
  };
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], canFinish: !!r?.canFinish, hasEnding: !!r?.hasEnding, summary };
}

export async function printReport(reportOrPromise, label = "") {
  const r = await reportOrPromise;
  const s = r.summary ?? {};
  console.log(`\n${label}: ${s.scenes} escenaris, ${s.characters} personatges, ${s.objects} objectes, ${s.rules} regles, ${s.dialogues} diàlegs, ${s.cutscenes} seqüències, ${s.sounds} sons · ${s.kB} kB`);
  console.log(r.canFinish ? `✔ Es pot acabar (${s.criticalSteps} passos imprescindibles).` : "✘ NO es pot acabar.");
  for (const e of r.errors) console.log(`  ERROR  ${e}`);
  for (const w of r.warnings) console.log(`  avís   ${w}`);
  if (!r.errors.length && !r.warnings.length) console.log("  Cap problema.");
  return r;
}

// Executat directament (també a través d'un enllaç simbòlic, com el de ~/.claude/skills)
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.argv[2];
  if (!path) { console.error("Ús: node check.mjs joc.zip"); process.exit(2); }
  const r = await printReport(checkZip(readFileSync(path)), path);
  process.exitCode = r.errors.length ? 1 : 0;
}
