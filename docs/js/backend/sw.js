// El service worker de la versió web: fa de servidor dins del navegador. Respon les peticions a api/... i files/...
// amb el mateix codi que server.mjs (core.js), però guardant-ho tot a IndexedDB.
// Per publicar-lo, tools/web/build.mjs l'empaqueta en un sol script (sw.js), perquè no tots els navegadors
// accepten service workers fets de mòduls.
import { configure, handle } from "./core.js";
import { zip, unzip } from "./zip.js";
import { gameEntries, zipName } from "./game-files.js";
import { idbStore } from "./idb-store.js";

const base = new URL(self.registration.scope).pathname;   // «/aventura-editor/» a GitHub Pages

const fetchText = async (path) => (await fetch(base + path)).text();

configure(idbStore(), {
  zip, unzip, zipName,
  // El reproductor ja ve empaquetat de la publicació (player.js), amb els seus estils
  exportFiles: async (adventure, files) =>
    gameEntries(adventure, files, { player: await fetchText("player.js"), css: await fetchText("css/player.css") }),
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(base)) return;
  const path = "/" + url.pathname.slice(base.length);
  if (/^\/(api|files)\//.test(path)) e.respondWith(respond(e.request, path));
});

async function respond(request, path) {
  const body = ["GET", "HEAD"].includes(request.method) ? new Uint8Array() : new Uint8Array(await request.arrayBuffer());
  const req = {
    method: request.method,
    headers: { "content-type": request.headers.get("content-type") },
    async read(limit) {
      if (body.length > limit) throw Object.assign(new Error("El contingut és massa gran"), { status: 413 });
      return body;
    },
  };
  let status = 200, headers = {}, out = null;
  const res = { writeHead(s, h) { status = s; headers = h; }, end(b) { out = b; } };
  await handle(req, res, path);
  return new Response(status === 204 ? null : out, { status, headers });
}
