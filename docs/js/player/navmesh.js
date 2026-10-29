// Camins dins de la zona caminable d'un escenari.
// La zona és la unió de tots els polígons caminables (es poden solapar). El camí més curt entre dos punts
// d'una zona poligonal només gira als vèrtexs, així que fem un graf de visibilitat: els nodes són els vèrtexs
// (i els punts on es creuen polígons diferents), i dos nodes estan connectats si es veuen sense sortir de la zona.
// Després, A* sobre aquest graf. No depèn del navegador.
import { dist, pointInPolygon, distToSegment, closestPointOnSegment, segmentIntersection } from "../geometry.js";

// Marge per considerar que un punt sobre la vora (o a tocar) és dins: els camins van arran de les vores
const EPS = 0.75;

// El punt de la zona caminable més proper a «pt» (ell mateix si ja hi és), sense muntar el graf de camins.
// L'editor ho fa servir per ensenyar on es posarà el personatge.
export function nearestWalkable(polygons, pt) {
  const polys = polygons.filter((p) => p.length >= 3);
  if (!polys.length) return null;
  if (polys.some((p) => pointInPolygon(pt, p))) return pt;
  let best = null, bestD = Infinity;
  for (const p of polys) {
    p.forEach((a, i) => {
      const q = closestPointOnSegment(pt, a, p[(i + 1) % p.length]);
      const d = dist(pt, q);
      if (d < bestD) { bestD = d; best = q; }
    });
  }
  return best;
}

export function createNavMesh(polygons) {
  const polys = polygons.filter((p) => p.length >= 3);
  const edges = polys.flatMap((p, pi) => p.map((a, i) => ({ a, b: p[(i + 1) % p.length], pi })));

  const contains = (pt) => polys.some((p) => pointInPolygon(pt, p)) || edges.some((e) => distToSegment(pt, e.a, e.b) <= EPS);

  // El punt de la zona més proper: el mateix punt si ja és dins (amb el marge de les vores), o el més proper de les vores
  const nearestPoint = (pt) => (polys.length && contains(pt) ? pt : nearestWalkable(polys, pt));

  // Les vores parteixen el segment en trossos que són tot dins o tot fora; n'hi ha prou de mirar el mig de cada tros
  function visible(a, b) {
    if (dist(a, b) < 1e-9) return true;
    const ts = [0, 1];
    for (const e of edges) {
      const t = segmentIntersection(a, b, e.a, e.b);
      if (t !== null) ts.push(t);
    }
    ts.sort((x, y) => x - y);
    for (let i = 0; i < ts.length - 1; i++) {
      if (ts[i + 1] - ts[i] < 1e-9) continue;
      const m = (ts[i] + ts[i + 1]) / 2;
      if (!contains([a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m])) return false;
    }
    return true;
  }

  const nodes = [];
  const addNode = (p) => { if (!nodes.some((n) => dist(n, p) < 1)) nodes.push(p); };
  for (const p of polys) p.forEach(addNode);
  // Quan dos polígons se solapen, les cantonades de la unió són als punts on es creuen les vores
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      if (edges[i].pi === edges[j].pi) continue;
      const t = segmentIntersection(edges[i].a, edges[i].b, edges[j].a, edges[j].b);
      if (t === null) continue;
      const { a, b } = edges[i];
      addNode([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }

  const links = nodes.map(() => []);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (visible(nodes[i], nodes[j])) { links[i].push(j); links[j].push(i); }
    }
  }

  // Retorna els punts del camí (el primer és l'origen ja dins la zona), o null si no s'hi pot arribar
  function findPath(from, to) {
    if (!polys.length) return null;
    const s = nearestPoint(from), g = nearestPoint(to);
    if (visible(s, g)) return [s, g];

    const n = nodes.length, S = n, G = n + 1;
    const pts = [...nodes, s, g];
    const fromStart = nodes.map((p) => visible(s, p));
    const toGoal = nodes.map((p) => visible(p, g));
    const neighbors = (i) => {
      if (i === S) return nodes.map((_, k) => k).filter((k) => fromStart[k]);
      return toGoal[i] ? [...links[i], G] : links[i];
    };

    const cost = new Array(n + 2).fill(Infinity);
    const prev = new Array(n + 2).fill(-1);
    const done = new Array(n + 2).fill(false);
    cost[S] = 0;
    const open = new Set([S]);
    while (open.size) {
      let cur = -1, bestF = Infinity;
      for (const i of open) {
        const f = cost[i] + dist(pts[i], g);
        if (f < bestF) { bestF = f; cur = i; }
      }
      if (cur === G) break;
      open.delete(cur);
      done[cur] = true;
      for (const k of neighbors(cur)) {
        if (done[k]) continue;
        const c = cost[cur] + dist(pts[cur], pts[k]);
        if (c < cost[k]) { cost[k] = c; prev[k] = cur; open.add(k); }
      }
    }
    if (cost[G] === Infinity) return null;
    const path = [];
    for (let i = G; i !== -1; i = prev[i]) path.unshift(pts[i]);
    return path;
  }

  return { isEmpty: !polys.length, polygons: polys, nodes, contains, nearestPoint, visible, findPath };
}
