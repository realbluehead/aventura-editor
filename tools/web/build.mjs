// Construeix la versió web de l'editor, per publicar-la sense servidor (per exemple, a GitHub Pages):
//   node tools/web/build.mjs [carpeta]      (per defecte, docs/)
// Hi posa:
//   - l'editor (public/), marcat amb window.EDITOR_WEB perquè faci servir el service worker en lloc del servidor;
//   - sw.js: el service worker (public/js/backend/sw.js empaquetat), que guarda les aventures a IndexedDB;
//   - player.js: el reproductor empaquetat, que el service worker fa servir per exportar jocs;
//   - exemples/la-rosa-de-sant-jordi.zip: l'aventura d'exemple, que es carrega sola la primera vegada;
//   - joc/: «La rosa de Sant Jordi» exportada, per jugar-hi directament.
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle, exportFiles, unzip } from "../../export.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PUBLIC = join(ROOT, "public");
const OUT = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(ROOT, "docs");

await rm(OUT, { recursive: true, force: true });
await cp(PUBLIC, OUT, { recursive: true });

const indexFile = join(OUT, "index.html");
const index = await readFile(indexFile, "utf8");
if (!index.includes('<script type="module" src="js/main.js">')) throw new Error("No trobo on posar la marca de la versió web a index.html");
await writeFile(indexFile, index.replace('<script type="module" src="js/main.js">', '<script>window.EDITOR_WEB = true;</script>\n<script type="module" src="js/main.js">'));

await writeFile(join(OUT, "sw.js"), await bundle(join(PUBLIC, "js"), "backend/sw.js"));
await writeFile(join(OUT, "player.js"), await bundle(join(PUBLIC, "js"), "player/player.js"));
// Sense això, GitHub Pages passaria la carpeta per Jekyll
await writeFile(join(OUT, ".nojekyll"), "");

const example = join(OUT, "exemples", "la-rosa-de-sant-jordi.zip");
await mkdir(dirname(example), { recursive: true });
execFileSync(process.execPath, [join(ROOT, "tools", "barcelona", "build.mjs"), example], { stdio: "inherit" });

const entries = unzip(await readFile(example));
const adventure = JSON.parse(entries.find((e) => e.name === "adventure.json").data.toString("utf8"));
const files = entries.filter((e) => e.name.startsWith("files/")).map((e) => ({ name: e.name.slice("files/".length), data: e.data }));
for (const f of await exportFiles(PUBLIC, adventure, files)) {
  const path = join(OUT, "joc", f.name);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, f.data);
}
console.log(`Versió web a ${OUT}`);
