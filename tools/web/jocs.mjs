// Els jocs fets amb el skill que es publiquen a GitHub Pages, cadascun a docs/jocs/<nom>/ (joc estàtic, per
// jugar-hi des del navegador). La llista és a jocs.json. tools/web/build.mjs els torna a posar cada vegada.
//   node tools/web/jocs.mjs <nom>            exporta aventures/<nom>/joc.zip a docs/jocs/<nom>/
//   node tools/web/jocs.mjs <nom> --push ["missatge"]   i a més en fa un commit (el joc i el seu codi) i el puja a GitHub
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { exportFiles, unzip } from "../../export.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PUBLICATS = JSON.parse(await readFile(join(ROOT, "tools", "web", "jocs.json"), "utf8"));

export async function publishGame(name, docs = join(ROOT, "docs")) {
  const entries = unzip(await readFile(join(ROOT, "aventures", name, "joc.zip")));
  const adventure = JSON.parse(entries.find((e) => e.name === "adventure.json").data.toString("utf8"));
  const files = entries.filter((e) => e.name.startsWith("files/")).map((e) => ({ name: e.name.slice("files/".length), data: e.data }));
  const out = join(docs, "jocs", name);
  await rm(out, { recursive: true, force: true });
  for (const f of await exportFiles(join(ROOT, "public"), adventure, files)) {
    const path = join(out, f.name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, f.data);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name, flag] = process.argv.slice(2);
  if (!name) { console.error("Ús: node tools/web/jocs.mjs <nom> [--push]"); process.exit(2); }
  if (!PUBLICATS.some((p) => p.nom === name)) { console.error(`«${name}» no és a tools/web/jocs.json`); process.exit(2); }
  const out = await publishGame(name);
  console.log(`Joc estàtic a ${out}`);
  if (flag === "--push") {
    const git = (...a) => execFileSync("git", a, { cwd: ROOT, stdio: "inherit" });
    git("add", "--", join("docs", "jocs", name), join("aventures", name), join("tools", "web"));
    const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: ROOT, encoding: "utf8" }).trim();
    if (!staged) { console.log("No hi ha canvis per publicar."); process.exit(0); }
    const titol = PUBLICATS.find((p) => p.nom === name).titol, msg = process.argv[4];
    git("commit", "-m", `${msg ? `«${titol}»: ${msg}` : `Publica «${titol}» a GitHub Pages`}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`);
    git("push", "origin", "HEAD");
    console.log(`Publicat: https://realbluehead.github.io/aventura-editor/jocs/${name}/`);
  }
}
