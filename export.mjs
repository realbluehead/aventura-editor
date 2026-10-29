// Exportar i importar aventures: un zip amb el joc a punt per jugar (index.html, el reproductor, les dades i els fitxers)
// que també conté adventure.json, perquè el mateix zip es pugui tornar a portar a l'editor.
// No té dependències: el zip s'escriu i es llegeix amb el zlib de Node.
import { readFile } from "node:fs/promises";
import { deflateRawSync, inflateRawSync, crc32 } from "node:zlib";
import { join, posix } from "node:path";
import { gameEntries, zipName } from "./public/js/backend/game-files.js";

/* ---------- Empaquetar el reproductor ---------- */

const IMPORT = /^import\s*\{([^}]*)\}\s*from\s*"([^"]+)";?[ \t]*$/gm;

// Ajunta els mòduls del reproductor (o del service worker de la versió web) en un sol script clàssic. Obrint index.html des del disc (file://), el navegador
// no deixa carregar mòduls, però un script normal sí. Cada mòdul queda dins de la seva funció, perquè els noms
// interns de l'un no xoquin amb els de l'altre, i els «import» es tornen a buscar les exportacions ja carregades.
// Només entén les formes que fa servir el codi: «import { a, b as c } from "./x.js"» i «export function/const …».
export async function bundle(root, entry) {
  const order = [];
  const visited = new Set();
  async function visit(rel) {
    if (visited.has(rel)) return;
    visited.add(rel);
    const src = await readFile(join(root, rel), "utf8");
    const imports = [...src.matchAll(IMPORT)].map((m) => ({ names: m[1].trim(), from: posix.normalize(posix.join(posix.dirname(rel), m[2])) }));
    for (const i of imports) await visit(i.from);
    order.push({ rel, src, imports });
  }
  await visit(entry);

  const modules = order.map(({ rel, src, imports }) => {
    const exported = [];
    let body = src.replace(IMPORT, "");
    body = body.replace(/^export\s+(async\s+function|function|const|let|class)\s+([\w$]+)/gm, (_, kind, name) => {
      exported.push(name);
      return `${kind} ${name}`;
    });
    if (/^\s*(import|export)\b/m.test(body)) throw new Error(`No es pot empaquetar ${rel}: té un import o export que no s'entén`);
    const head = imports.map((i) => `const { ${i.names.replace(/\s+as\s+/g, ": ")} } = modules[${JSON.stringify(i.from)}];`).join("\n");
    return `// ${rel}\nmodules[${JSON.stringify(rel)}] = (() => {\n${head}\n${body}\nreturn { ${exported.join(", ")} };\n})();`;
  });
  return `(() => {\n"use strict";\nconst modules = {};\n\n${modules.join("\n\n")}\n\nglobalThis.AventuraPlayer = modules[${JSON.stringify(entry)}];\n})();\n`;
}

/* ---------- Zip ---------- */

function dosDateTime(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

// entries: [{ name, data: Buffer }] → un zip. Els fitxers es comprimeixen si en surten més petits.
export function zip(entries) {
  const { time, date } = dosDateTime();
  const locals = [], centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const deflated = deflateRawSync(data);
    const [method, body] = deflated.length < data.length ? [8, deflated] : [0, data];
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);           // noms en UTF-8
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + body.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

// Llegeix un zip i en retorna els fitxers: [{ name, data }]. Llança un error si no és un zip que s'entengui.
export function unzip(buf) {
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end === -1) throw new Error("No és un fitxer zip");
  const count = buf.readUInt16LE(end + 10);
  let p = buf.readUInt32LE(end + 16);
  const out = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("El zip està malmès");
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;   // carpetes
    const start = offset + 30 + buf.readUInt16LE(offset + 26) + buf.readUInt16LE(offset + 28);
    const body = buf.subarray(start, start + size);
    if (method !== 0 && method !== 8) throw new Error(`«${name}» està comprimit d'una manera que no s'entén`);
    out.push({ name, data: method === 8 ? inflateRawSync(body) : Buffer.from(body) });
  }
  return out;
}

/* ---------- El joc exportat ---------- */

// Tots els fitxers del zip d'una aventura. «files» són els fitxers de l'aventura (imatges i sons): [{ name, data }]
export async function exportFiles(publicDir, adventure, files) {
  const player = await bundle(join(publicDir, "js"), "player/player.js");
  // Només els estils del reproductor: el joc no porta res de l'editor
  const css = await readFile(join(publicDir, "css", "player.css"));
  return gameEntries(adventure, files, { player, css });
}

export { zipName };
