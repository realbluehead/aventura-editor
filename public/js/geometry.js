// Geometria 2D per a l'editor i el reproductor.
// Un punt és [x, y] en píxels de la imatge de fons; un polígon és una llista de punts (tancada implícitament).
// No depèn del navegador: també es fa servir des dels tests de Node.

export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Raig cap a la dreta: el punt és dins si travessa un nombre senar de vores
export function pointInPolygon([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function closestPointOnSegment([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return [ax + t * dx, ay + t * dy];
}

export const distToSegment = (p, a, b) => dist(p, closestPointOnSegment(p, a, b));

// On talla el segment ab amb el segment cd, com a fracció t (0..1) del camí d'a fins a b.
// Inclou els contactes pels extrems; dos segments paral·lels no es tallen.
export function segmentIntersection(a, b, c, d) {
  const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;
  const qx = c[0] - a[0], qy = c[1] - a[1];
  const t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
  const E = 1e-9;
  return t >= -E && t <= 1 + E && u >= -E && u <= 1 + E ? Math.max(0, Math.min(1, t)) : null;
}

const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

// Només els creuaments de veritat: dos segments que es toquen per un extrem no compten
export function segmentsCross(a, b, c, d) {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Un polígon que es creua amb si mateix (en forma de 8) no té un interior clar i el reproductor no hi podrà buscar camins
export function isSelfIntersecting(poly) {
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // la primera i l'última vora comparteixen un vèrtex
      if (segmentsCross(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) return true;
    }
  }
  return false;
}

export function area(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return a / 2;
}

// Centre de masses del polígon; si és degenerat (àrea zero), la mitjana dels vèrtexs
export function centroid(poly) {
  const a = area(poly);
  if (Math.abs(a) < 1e-9) {
    const n = poly.length || 1;
    return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
  }
  let cx = 0, cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const f = poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    cx += (poly[j][0] + poly[i][0]) * f;
    cy += (poly[j][1] + poly[i][1]) * f;
  }
  return [cx / (6 * a), cy / (6 * a)];
}

export function bounds(poly) {
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}
