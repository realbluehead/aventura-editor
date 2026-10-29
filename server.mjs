#!/usr/bin/env node
// Editor d'aventures gràfiques: servidor local amb una API CRUD i la UI a public/.
// Ús:  node aventura-editor/server.mjs   (i obre http://localhost:8821)
// Només escolta a 127.0.0.1. No té dependències: només Node.
// Cada aventura té la seva carpeta: data/adventures/<id>/adventure.json i data/adventures/<id>/images/.
// L'API és a public/js/backend/core.js, compartida amb la versió web (que guarda les dades al navegador).
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, rename, rm, rmdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname, resolve } from "node:path";
import { exportFiles, unzip, zip, zipName } from "./export.mjs";
import { configure, handle, send, upgrade, FORMAT_VERSION, TYPES } from "./public/js/backend/core.js";

const PORT = Number(process.env.PORT) || 8821;
const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, "public");
const DATA_DIR = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(HERE, "data");
const ADVENTURES = join(DATA_DIR, "adventures");
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);
const MAX_BODY = 300 * 1024 * 1024;

const advDir = (id) => join(ADVENTURES, id);
const advFile = (id) => join(advDir(id), "adventure.json");
const imagesDir = (id) => join(advDir(id), "images");

const missing = (err) => { if (err.code === "ENOENT") return null; throw err; };

// Les aventures i els seus fitxers, en carpetes dins de data/
const store = {
  async list() {
    const entries = await readdir(ADVENTURES, { withFileTypes: true }).catch(missing) ?? [];
    const all = await Promise.all(entries.filter((e) => e.isDirectory()).map((e) => store.load(e.name)));
    return all.filter(Boolean);
  },
  load: (id) => readFile(advFile(id), "utf8").then(JSON.parse, missing),
  // Escriu a un fitxer temporal i el reanomena, perquè un tall a mitges no deixi el JSON trencat
  async save(a) {
    await mkdir(advDir(a.id), { recursive: true });
    const tmp = advFile(a.id) + ".tmp";
    await writeFile(tmp, JSON.stringify(a, null, 2) + "\n");
    await rename(tmp, advFile(a.id));
  },
  remove: (id) => rm(advDir(id), { recursive: true, force: true }),
  async putFile(id, name, bytes) {
    await mkdir(imagesDir(id), { recursive: true });
    await writeFile(join(imagesDir(id), name), bytes);
  },
  getFile: (id, name) => readFile(join(imagesDir(id), name)).catch(missing),
  removeFile: (id, name) => rm(join(imagesDir(id), name), { force: true }),
  async files(id) {
    const names = await readdir(imagesDir(id)).catch(missing) ?? [];
    return Promise.all(names.map(async (name) => ({ name, data: await readFile(join(imagesDir(id), name)) })));
  },
};

configure(store, {
  zip, unzip, zipName,
  exportFiles: (adventure, files) => exportFiles(PUBLIC, adventure, files),
});

// Format 1: totes les aventures en un sol data/adventures.json i les imatges a data/images/
async function migrateV1() {
  const old = join(DATA_DIR, "adventures.json");
  const raw = await readFile(old, "utf8").catch(missing);
  if (raw === null) return;
  const db = JSON.parse(raw);
  for (const a of db.adventures) {
    await mkdir(imagesDir(a.id), { recursive: true });
    for (const s of a.scenes ?? []) {
      if (!s.background) continue;
      // Si la imatge s'havia perdut, l'escenari es queda sense fons en lloc d'apuntar a un fitxer que no hi és
      await rename(join(DATA_DIR, "images", s.background), join(imagesDir(a.id), s.background)).catch(() => { s.background = null; });
    }
    await store.save(upgrade(a));
  }
  await rename(old, old + ".v1-migrat");
  await rmdir(join(DATA_DIR, "images")).catch(() => {});
  console.log(`Migrades ${db.adventures.length} aventures al format ${FORMAT_VERSION}`);
}

// El cos de la petició, sencer, sense passar de «limit» bytes
async function readRaw(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > Math.min(limit, MAX_BODY)) throw Object.assign(new Error("El contingut és massa gran"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function serveFile(res, root, path) {
  const file = normalize(join(root, path));
  if (!file.startsWith(root + "/")) return send(res, 403, "Prohibit", "text/plain");
  try {
    send(res, 200, await readFile(file), TYPES[extname(file)] || "application/octet-stream");
  } catch {
    send(res, 404, "No trobat", "text/plain; charset=utf-8");
  }
}

await migrateV1();

createServer(async (req, res) => {
  // Evita que una web externa parli amb el servidor local fent-se passar per localhost (DNS rebinding)
  if (!ALLOWED_HOSTS.has(req.headers.host)) return send(res, 403, "Host no permès", "text/plain");
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  // (no es pot posar «read» a la mateixa petició: els streams de Node ja en tenen un)
  const request = { method: req.method, headers: req.headers, read: (limit) => readRaw(req, limit) };
  if (await handle(request, res, pathname)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Mètode no permès" });
  await serveFile(res, PUBLIC, pathname === "/" ? "index.html" : pathname);
}).listen(PORT, "127.0.0.1", () => console.log(`Editor d'aventures a http://localhost:${PORT}`));
