import { test } from "node:test";
import assert from "node:assert/strict";
import { createNavMesh } from "../public/js/player/navmesh.js";
import { dist } from "../public/js/geometry.js";

const length = (path) => path.slice(1).reduce((s, p, i) => s + dist(path[i], p), 0);
const close = (a, b) => assert.ok(dist(a, b) < 0.01, `${a} hauria de ser ${b}`);

// Forma de L: per anar d'un braç a l'altre cal girar per la cantonada interior (10, 10)
const L = [[0, 0], [20, 0], [20, 10], [10, 10], [10, 30], [0, 30]];

test("camí recte quan es veu el destí", () => {
  const mesh = createNavMesh([L]);
  assert.deepEqual(mesh.findPath([2, 2], [18, 5]), [[2, 2], [18, 5]]);
});

test("gira per la cantonada interior de la L", () => {
  const mesh = createNavMesh([L]);
  const path = mesh.findPath([18, 5], [5, 28]);
  assert.equal(path.length, 3);
  close(path[1], [10, 10]);
  assert.ok(length(path) < dist([18, 5], [10, 10]) + dist([10, 10], [5, 28]) + 0.01);
});

test("un clic fora de la zona camina fins a la vora més propera", () => {
  const mesh = createNavMesh([L]);
  close(mesh.nearestPoint([15, 20]), [10, 20]);
  const path = mesh.findPath([5, 5], [30, 5]);
  close(path.at(-1), [20, 5]);
});

test("dos polígons que se solapen fan una sola zona", () => {
  // Dos rectangles en creu: les cantonades de la unió són punts on es creuen, no vèrtexs de cap dels dos
  const h = [[0, 10], [30, 10], [30, 20], [0, 20]];
  const v = [[10, 0], [20, 0], [20, 30], [10, 30]];
  const mesh = createNavMesh([h, v]);
  const path = mesh.findPath([2, 15], [15, 2]);
  assert.ok(path, "s'hi ha de poder arribar");
  assert.ok(path.slice(1, -1).some((p) => dist(p, [10, 10]) < 0.01), "gira per la cantonada (10, 10)");
  for (let i = 1; i < path.length; i++) assert.ok(mesh.visible(path[i - 1], path[i]));
});

test("zones separades: no s'hi pot arribar", () => {
  const mesh = createNavMesh([[[0, 0], [10, 0], [10, 10], [0, 10]], [[20, 0], [30, 0], [30, 10], [20, 10]]]);
  assert.equal(mesh.findPath([5, 5], [25, 5]), null);
});

test("no travessa forats d'una forma en U", () => {
  const U = [[0, 0], [10, 0], [10, 20], [20, 20], [20, 0], [30, 0], [30, 30], [0, 30]];
  const mesh = createNavMesh([U]);
  assert.equal(mesh.visible([5, 5], [25, 5]), false);
  const path = mesh.findPath([5, 5], [25, 5]);
  assert.equal(path.length, 4);
  close(path[1], [10, 20]);
  close(path[2], [20, 20]);
});

test("escenari sense zona caminable", () => {
  const mesh = createNavMesh([]);
  assert.equal(mesh.isEmpty, true);
  assert.equal(mesh.findPath([0, 0], [5, 5]), null);
  assert.equal(mesh.nearestPoint([1, 1]), null);
});
