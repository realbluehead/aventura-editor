import { test } from "node:test";
import assert from "node:assert/strict";
import { animationKeyFor, animationFor, frameAt, frameSource, sheetGrid, facingToDir, defaultApproach, characterRect } from "../public/js/player/characters.js";

const ch = {
  frameWidth: 16, frameHeight: 32,
  animations: {
    "idle-side": { frames: [0], fps: 1 },
    "walk-side": { frames: [1, 2, 3, 4], fps: 8 },
    "talk-down": { frames: [6, 7], fps: 4 },
  },
};
const sheet = { naturalWidth: 64, naturalHeight: 96 };   // 4 columnes × 3 files

test("animacions de reserva quan una direcció no en té", () => {
  assert.equal(animationKeyFor(ch, "walk", "side"), "walk-side");
  assert.equal(animationKeyFor(ch, "walk", "up"), "walk-side", "caminar d'esquena fa servir caminar de costat");
  assert.equal(animationKeyFor(ch, "talk", "side"), "talk-down");
  assert.equal(animationKeyFor(ch, "idle", "down"), "idle-side");
  assert.equal(animationKeyFor({ animations: {} }, "walk", "down"), null);
  assert.deepEqual(animationFor({ animations: {} }, "walk", "down"), { frames: [0], fps: 1 }, "sense res, el primer fotograma");
});

test("el fotograma depèn del temps i dels fotogrames per segon", () => {
  assert.equal(frameAt(ch, "walk", "side", 0), 1);
  assert.equal(frameAt(ch, "walk", "side", 0.125), 2);
  assert.equal(frameAt(ch, "walk", "side", 0.5), 1, "torna a començar");
});

test("posició de cada fotograma dins del full", () => {
  assert.deepEqual(sheetGrid(ch, sheet), { cols: 4, rows: 3, count: 12 });
  assert.deepEqual(frameSource(ch, sheet, 0), { sx: 0, sy: 0, sw: 16, sh: 32 });
  assert.deepEqual(frameSource(ch, sheet, 5), { sx: 16, sy: 32, sw: 16, sh: 32 });
});

test("cap on mira, on s'hi acosta el protagonista i el rectangle", () => {
  assert.deepEqual(facingToDir("left"), { dir: "side", flip: -1 });
  assert.deepEqual(facingToDir("up"), { dir: "up", flip: 1 });
  assert.deepEqual(defaultApproach([100, 50], "left", 40), [76, 50]);
  assert.deepEqual(defaultApproach([100, 50], "down", 40), [124, 50]);
  assert.deepEqual(characterRect(ch, sheet, 100, 80, 64), { x: 84, y: 16, w: 32, h: 64 }, "mateixa proporció que el fotograma");
});

test("objectes animats: el fotograma de cada instant", async () => {
  const { spriteFile, stateFiles } = await import("../public/js/player/objects.js");
  const o = { initialState: "a", states: [{ id: "a", image: "f0.png", frames: ["f0.png", "f1.png", "f2.png"], fps: 4 }, { id: "b", image: "quiet.png" }] };
  assert.equal(spriteFile(o), "f0.png");
  assert.equal(spriteFile(o, "a", 0.3), "f1.png");
  assert.equal(spriteFile(o, "a", 0.8), "f0.png", "torna a començar");
  assert.equal(spriteFile(o, "b", 5), "quiet.png");
  assert.deepEqual(stateFiles(o), ["f0.png", "f0.png", "f1.png", "f2.png"]);
});
