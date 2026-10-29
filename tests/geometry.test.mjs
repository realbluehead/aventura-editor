import { test } from "node:test";
import assert from "node:assert/strict";
import { pointInPolygon, distToSegment, isSelfIntersecting, centroid, bounds, area } from "../public/js/geometry.js";

const square = [[0, 0], [10, 0], [10, 10], [0, 10]];

test("pointInPolygon distingeix dins i fora", () => {
  assert.equal(pointInPolygon([5, 5], square), true);
  assert.equal(pointInPolygon([15, 5], square), false);
  assert.equal(pointInPolygon([-1, -1], square), false);
  // Forma de L: el racó buit queda fora
  const l = [[0, 0], [10, 0], [10, 4], [4, 4], [4, 10], [0, 10]];
  assert.equal(pointInPolygon([2, 8], l), true);
  assert.equal(pointInPolygon([8, 8], l), false);
});

test("distToSegment mesura fins al punt més proper del segment", () => {
  assert.equal(distToSegment([5, 3], [0, 0], [10, 0]), 3);
  assert.equal(distToSegment([13, 4], [0, 0], [10, 0]), 5); // més enllà de l'extrem
  assert.equal(distToSegment([3, 4], [0, 0], [0, 0]), 5);   // segment degenerat
});

test("isSelfIntersecting detecta les formes de 8", () => {
  assert.equal(isSelfIntersecting(square), false);
  assert.equal(isSelfIntersecting([[0, 0], [10, 10], [10, 0], [0, 10]]), true);
  assert.equal(isSelfIntersecting([[0, 0], [10, 0], [5, 8]]), false);
  assert.equal(isSelfIntersecting([[0, 0], [10, 0], [10, 4], [4, 4], [4, 10], [0, 10]]), false);
});

test("centroid, area i bounds", () => {
  assert.deepEqual(centroid(square), [5, 5]);
  assert.equal(Math.abs(area(square)), 100);
  assert.deepEqual(centroid([[0, 0], [4, 0], [8, 0]]), [4, 0]); // àrea zero: mitjana
  assert.deepEqual(bounds([[3, 7], [-2, 1], [5, 4]]), { minX: -2, minY: 1, maxX: 5, maxY: 7 });
});
