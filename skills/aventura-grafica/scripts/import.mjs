// Importa un zip d'aventura a l'editor local que s'està executant (npm start, al port 8821 per defecte).
//   node import.mjs joc.zip [http://localhost:8821]
import { readFileSync } from "node:fs";

const [zipPath, base = "http://localhost:8821"] = process.argv.slice(2);
if (!zipPath) { console.error("Ús: node import.mjs joc.zip [http://localhost:8821]"); process.exit(2); }
let res;
try {
  res = await fetch(`${base}/api/import`, { method: "POST", body: readFileSync(zipPath), headers: { "content-type": "application/zip" } });
} catch {
  console.error(`No hi ha cap editor a ${base}. Engega'l amb «npm start» a la carpeta aventura-editor, o importa el zip a mà (botó «Importa…»).`);
  process.exit(1);
}
const body = await res.json();
if (!res.ok) { console.error(`No s'ha pogut importar: ${body.error ?? res.status}`); process.exit(1); }
console.log(`Importada: ${base}/#/aventura/${body.id}`);
