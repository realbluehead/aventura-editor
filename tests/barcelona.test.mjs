// El joc d'exemple de Barcelona: es genera sencer i s'ha de poder acabar
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unzip } from "../export.mjs";
import { analyze } from "../public/js/analysis.js";

test("La rosa de Sant Jordi es genera i es pot acabar", () => {
  const dir = mkdtempSync(join(tmpdir(), "barcelona-"));
  try {
    const out = join(dir, "joc.zip");
    execFileSync(process.execPath, [new URL("../tools/barcelona/build.mjs", import.meta.url).pathname, out]);
    const entries = unzip(readFileSync(out));
    const a = JSON.parse(entries.find((e) => e.name === "adventure.json").data.toString("utf8"));
    assert.equal(a.scenes.length, 10);
    assert.ok(a.characters.length >= 8);

    // Tots els fitxers a què apunta l'aventura són dins del zip
    const names = new Set(entries.map((e) => e.name));
    const referenced = [
      ...a.scenes.map((s) => s.background),
      ...a.characters.map((c) => c.sheet),
      ...a.objects.flatMap((o) => [o.icon, ...o.states.map((s) => s.image)]),
      ...a.sounds.map((s) => s.file),
      a.titleScreen.image,
    ].filter(Boolean);
    for (const f of referenced) assert.ok(names.has(`files/${f}`), `falta ${f}`);

    const r = analyze(a);
    assert.equal(r.canFinish, true);
    assert.deepEqual(r.issues, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
