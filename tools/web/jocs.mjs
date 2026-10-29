// Els jocs fets amb el skill que es publiquen a GitHub Pages, cadascun a docs/jocs/<nom>/ (joc estàtic, per
// jugar-hi des del navegador). La llista és a jocs.json. tools/web/build.mjs els torna a posar cada vegada.
// docs/jocs/index.html és l'índex de tots els jocs publicats (writeIndex), amb una fitxa per joc.
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

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// L'índex dels jocs publicats (docs/jocs/index.html): una fitxa per joc, amb la pantalla de títol, la descripció i el
// botó per jugar-hi. També hi va l'exemple de l'editor, «La rosa de Sant Jordi» (docs/joc/).
export async function writeIndex(docs = join(ROOT, "docs")) {
  const games = [...PUBLICATS.map((p) => ({ dir: join(docs, "jocs", p.nom), href: `${p.nom}/`, titol: p.titol })), { dir: join(docs, "joc"), href: "../joc/" }];
  const cards = [];
  for (const g of games) {
    let a;
    try { a = JSON.parse(await readFile(join(g.dir, "adventure.json"), "utf8")); } catch { continue; }
    const img = a.titleScreen?.image ?? a.scenes[0]?.background;
    const n = a.scenes.length;
    cards.push(`    <article class="game">
      <a class="shot" href="${esc(g.href)}">${img ? `<img src="${esc(g.href)}files/${esc(encodeURIComponent(img))}" alt="" loading="lazy">` : ""}</a>
      <div class="info">
        <h2><a href="${esc(g.href)}">${esc(g.titol ?? a.title)}</a></h2>
        ${a.titleScreen?.subtitle ? `<p class="sub">${esc(a.titleScreen.subtitle)}</p>` : ""}
        <p>${esc(a.description)}</p>
        <p class="meta">${n} escenari${n === 1 ? "" : "s"} · ${a.characters.length} personatges</p>
        <a class="play" href="${esc(g.href)}">▶ Juga</a>
      </div>
    </article>`);
  }
  const html = `<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aventures gràfiques</title>
<meta name="description" content="Aventures gràfiques fetes amb l'editor d'aventures, per jugar-hi des del navegador.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root { --bg: #0b0a12; --card: #15131f; --line: #2a2640; --text: #e4e0f2; --dim: #9d97c0; --accent: #3fa9c9; --gold: #f5b942; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.55 Inter, system-ui, sans-serif; }
  header, main, footer { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
  header { padding-top: 40px; padding-bottom: 8px; }
  h1 { margin: 0 0 10px; font: 22px/1.4 "Press Start 2P", monospace; color: var(--gold); text-shadow: 3px 3px #000; }
  header p { margin: 0; color: var(--dim); max-width: 60ch; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 20px; padding-top: 24px; padding-bottom: 40px; }
  .game { display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
  .shot { display: block; aspect-ratio: 4 / 3; background: #000; }
  .shot img { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; display: block; }
  .info { display: flex; flex-direction: column; gap: 8px; padding: 16px; flex: 1; }
  h2 { margin: 0; font: 13px/1.6 "Press Start 2P", monospace; }
  h2 a { color: var(--text); text-decoration: none; }
  .info p { margin: 0; }
  .sub { color: var(--gold); font-weight: 500; }
  .meta { color: var(--dim); font-size: 13px; }
  .play { margin-top: auto; align-self: flex-start; padding: 10px 16px; border: 1px solid var(--accent); border-radius: 6px; color: #fff; background: #1f1c30;
    text-decoration: none; font: 10px/1.6 "Press Start 2P", monospace; }
  .play:hover, .play:focus-visible { background: #2a2640; outline: none; border-color: var(--gold); }
  a:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
  footer { padding-bottom: 40px; color: var(--dim); font-size: 13px; }
  footer a { color: var(--accent); }
</style>
</head>
<body>
<header>
  <h1>Aventures gràfiques</h1>
  <p>Jocs a l'estil de Monkey Island fets amb l'editor d'aventures. Es juguen al navegador, també al mòbil (millor de costat).</p>
</header>
<main>
${cards.join("\n")}
</main>
<footer><a href="../">Obre l'editor d'aventures</a> per fer-ne una de teva.</footer>
</body>
</html>
`;
  await mkdir(join(docs, "jocs"), { recursive: true });
  await writeFile(join(docs, "jocs", "index.html"), html);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name, flag] = process.argv.slice(2);
  if (!name) { console.error("Ús: node tools/web/jocs.mjs <nom> [--push]"); process.exit(2); }
  if (!PUBLICATS.some((p) => p.nom === name)) { console.error(`«${name}» no és a tools/web/jocs.json`); process.exit(2); }
  const out = await publishGame(name);
  await writeIndex();
  console.log(`Joc estàtic a ${out}`);
  if (flag === "--push") {
    const git = (...a) => execFileSync("git", a, { cwd: ROOT, stdio: "inherit" });
    git("add", "--", join("docs", "jocs", name), join("docs", "jocs", "index.html"), join("aventures", name), join("tools", "web"));
    const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: ROOT, encoding: "utf8" }).trim();
    if (!staged) { console.log("No hi ha canvis per publicar."); process.exit(0); }
    const titol = PUBLICATS.find((p) => p.nom === name).titol, msg = process.argv[4];
    git("commit", "-m", `${msg ? `«${titol}»: ${msg}` : `Publica «${titol}» a GitHub Pages`}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`);
    git("push", "origin", "HEAD");
    console.log(`Publicat: https://realbluehead.github.io/aventura-editor/jocs/${name}/`);
  }
}
