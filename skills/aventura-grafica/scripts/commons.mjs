// Busca i baixa imatges lliures de Wikimedia Commons, amb l'autoria i la llicència al costat.
//   node commons.mjs search "castle courtyard painting" [--limit 12]
//   node commons.mjs get "File:Nom del fitxer.jpg" carpeta/fons-pati.jpg [--width 1600]
// «get» deixa també carpeta/fons-pati.jpg.json amb el títol, l'autor, la llicència i la pàgina, per als crèdits
// (Project.attribute() del kit els afegeix als crèdits del joc).
// Només accepta llicències que permeten fer-ne obres derivades: domini públic, CC0, CC BY i CC BY-SA.
import { writeFileSync, mkdirSync, realpathSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://commons.wikimedia.org/w/api.php";
// Wikimedia demana que les eines s'identifiquin
const HEADERS = { "user-agent": "aventura-editor-skill/1.0 (https://github.com/realbluehead/aventura-editor)" };

const plain = (html = "") => html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();

export function freeLicense(short = "") {
  const s = short.toLowerCase();
  if (/\bnc\b|non-?commercial|\bnd\b|no ?deriv|fair use|copyrighted/.test(s)) return false;
  return /public domain|^pd\b|pd-|cc0|cc[- ]by|attribution|gfdl|no restrictions/.test(s);
}

function describe(page) {
  const ii = page.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  const license = plain(m.LicenseShortName?.value) || "desconeguda";
  return {
    title: page.title,
    author: plain(m.Artist?.value) || "autor desconegut",
    license,
    licenseUrl: m.LicenseUrl?.value ?? "",
    free: freeLicense(license),
    page: ii.descriptionurl,
    url: ii.thumburl ?? ii.url,
    original: ii.url,
    size: [ii.width, ii.height],
    mime: ii.mime,
    description: plain(m.ImageDescription?.value).slice(0, 200),
  };
}

async function query(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Commons ha respost ${res.status}`);
  return res.json();
}

const INFO = { prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiextmetadatafilter: "LicenseShortName|LicenseUrl|Artist|ImageDescription" };

export async function search(text, { limit = 12, width = 1600 } = {}) {
  // Primer només imatges; amb moltes paraules el filtre a vegades no troba res, i llavors es busca sense
  for (const q of [`${text} filetype:bitmap`, text]) {
    const data = await query({
      action: "query", generator: "search", gsrnamespace: "6", gsrsearch: q,
      gsrlimit: String(Math.min(50, limit * 3)), iiurlwidth: String(width), ...INFO,
    });
    const found = (data.query?.pages ?? [])
      .sort((a, b) => a.index - b.index)
      .map(describe)
      .filter((d) => d && d.free && /^image\/(jpeg|png|webp|tiff|gif)/.test(d.mime))
      .slice(0, limit);
    if (found.length) return found;
  }
  return [];
}

export async function get(title, out, { width = 1600 } = {}) {
  const t = title.startsWith("File:") ? title : `File:${title}`;
  const data = await query({ action: "query", titles: t, iiurlwidth: String(width), ...INFO });
  const meta = describe(data.query?.pages?.[0] ?? {});
  if (!meta) throw new Error(`No trobo «${t}» a Commons`);
  if (!meta.free) throw new Error(`«${t}» té la llicència «${meta.license}», que no permet adaptar-la lliurement`);
  const res = await fetch(meta.url, { headers: HEADERS });
  if (!res.ok) throw new Error(`No s'ha pogut baixar (${res.status})`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  writeFileSync(`${out}.json`, JSON.stringify(meta, null, 2));
  return meta;
}

// Executat directament (també a través d'un enllaç simbòlic, com el de ~/.claude/skills)
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, a, b] = process.argv.slice(2);
  const flag = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? Number(process.argv[i + 1]) : def; };
  if (cmd === "search" && a) {
    const found = await search(a, { limit: flag("limit", 12) });
    if (!found.length) console.log("Cap imatge lliure. Prova amb menys paraules (2 o 3, en anglès), per exemple «tavern painting» o «harbour engraving».");
    for (const f of found) console.log(`${f.title}\n   ${f.size.join("×")} · ${f.license} · ${f.author.slice(0, 60)}\n   ${f.description.slice(0, 120)}`);
  } else if (cmd === "get" && a && b) {
    const m = await get(a, b, { width: flag("width", 1600) });
    console.log(`Baixada a ${b} · ${m.license} · ${m.author}\nCrèdits a ${b}.json`);
  } else {
    console.error('Ús:\n  node commons.mjs search "paraules" [--limit 12]\n  node commons.mjs get "File:Nom.jpg" sortida.jpg [--width 1600]');
    process.exitCode = 2;
  }
}
