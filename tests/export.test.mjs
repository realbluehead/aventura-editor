import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle, zip, unzip, zipName } from "../export.mjs";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

test("zip: el que s'hi posa és el que en surt, comprimit o no", () => {
  const entries = [
    { name: "index.html", data: Buffer.from("<p>hola</p>".repeat(100)) },          // es comprimeix
    { name: "files/àvia.png", data: Buffer.from([1, 2, 3]) },                      // massa petit per comprimir; nom amb accent
    { name: "buit.txt", data: Buffer.alloc(0) },
  ];
  const out = unzip(zip(entries));
  assert.deepEqual(out.map((e) => e.name), entries.map((e) => e.name));
  out.forEach((e, i) => assert.ok(e.data.equals(entries[i].data), e.name));
  assert.throws(() => unzip(Buffer.from("no sóc un zip")), /No és un fitxer zip/);
});

test("el reproductor empaquetat en un sol script funciona sense mòduls", async () => {
  const code = await bundle(join(PUBLIC, "js"), "player/player.js");
  assert.doesNotMatch(code, /^\s*(import|export)\s/m, "no hi queda cap import ni export");
  // S'executa com un script normal i deixa el reproductor a window.AventuraPlayer
  const win = {};
  new Function("window", code)(win);
  assert.equal(typeof win.AventuraPlayer.createPlayer, "function");
  assert.ok(!("dist" in win.AventuraPlayer), "només exporta el que exporta player.js");
});

test("nom del fitxer a partir del títol", () => {
  assert.equal(zipName("El secret de l'illa"), "el-secret-de-l-illa.zip");
  assert.equal(zipName("Àvia Maria!"), "avia-maria.zip");
  assert.equal(zipName("???"), "aventura.zip");
});
