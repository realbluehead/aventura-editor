// El skill «aventura-grafica»: el kit, la comprovació i la plantilla han de seguir funcionant amb l'editor
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Canvas, decodePng, pixelArt } from "../skills/aventura-grafica/scripts/kit.mjs";
import { checkZip } from "../skills/aventura-grafica/scripts/check.mjs";
import { zip, unzip } from "../export.mjs";

const SKILL = new URL("../skills/aventura-grafica/", import.meta.url);

test("el PNG que escriu el llenç es torna a llegir igual", () => {
  const c = new Canvas(5, 3);
  c.rect(0, 0, 5, 3, "#336699");
  c.px(4, 2, [255, 0, 0, 128]);
  const img = decodePng(c.png());
  assert.deepEqual([img.width, img.height], [5, 3]);
  assert.deepEqual([...img.data.slice(0, 4)], [0x33, 0x66, 0x99, 255]);
  assert.deepEqual([...img.data], [...c.data]);
});

test("pixelar una imatge: mida de fons, pocs colors i encaix", () => {
  const src = new Canvas(400, 300);
  src.gradient(0, 0, 400, 300, "#2244aa", "#ffcc66", 40);
  const bg = pixelArt(decodePng(src.png()), { preset: "photo", colors: 8 });
  assert.deepEqual([bg.w, bg.h], [320, 200]);
  const colors = new Set();
  for (let i = 0; i < bg.data.length; i += 4) colors.add(bg.data.slice(i, i + 3).join());
  assert.ok(colors.size <= 8, `${colors.size} colors`);
  const sprite = pixelArt(decodePng(src.png()), { preset: "sprite", width: 24, height: 24, fit: "contain" });
  assert.deepEqual([sprite.w, sprite.h], [24, 24]);
  assert.equal(sprite.get(0, 0)[3], 0, "amb «contain», el que sobra és transparent");
});

test("la plantilla del skill fa un joc que el servidor accepta i que es pot acabar", async () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-"));
  try {
    // La plantilla s'executa des de la carpeta del projecte; aquí, des d'una carpeta temporal amb el camí al kit absolut
    const src = readFileSync(new URL("assets/build-template.mjs", SKILL), "utf8")
      .replace(/const KIT = ".*?";/, `const KIT = ${JSON.stringify(new URL("scripts/kit.mjs", SKILL).href)};`);
    writeFileSync(join(dir, "build.mjs"), src);
    execFileSync(process.execPath, [join(dir, "build.mjs")], { stdio: "pipe" });
    const report = await checkZip(readFileSync(join(dir, "joc.zip")));
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.warnings, []);
    assert.equal(report.canFinish, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("la comprovació troba un joc que no es pot acabar i una arribada fora de la zona caminable", async () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-"));
  try {
    const src = readFileSync(new URL("assets/build-template.mjs", SKILL), "utf8")
      .replace(/const KIT = ".*?";/, `const KIT = ${JSON.stringify(new URL("scripts/kit.mjs", SKILL).href)};`);
    writeFileSync(join(dir, "build.mjs"), src);
    execFileSync(process.execPath, [join(dir, "build.mjs")], { stdio: "pipe" });
    const entries = unzip(readFileSync(join(dir, "joc.zip")));
    const json = entries.find((e) => e.name === "adventure.json");
    const a = JSON.parse(json.data.toString("utf8"));
    // Sense el que dona el pescador, el far no es pot encendre; i l'arribada al far queda a l'aire
    for (const d of a.dialogues) for (const n of d.nodes) for (const o of n.options) o.actions = o.actions.filter((x) => x.type !== "take");
    a.scenes[0].hotspots[0].exit.arrival = [60, 20];
    json.data = Buffer.from(JSON.stringify(a));
    const report = await checkZip(zip(entries));
    assert.equal(report.canFinish, false);
    assert.ok(report.errors.some((e) => /no es pot acabar/i.test(e)), report.errors.join("\n"));
    assert.ok(report.warnings.some((w) => /fora de la zona caminable/.test(w)), report.warnings.join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
