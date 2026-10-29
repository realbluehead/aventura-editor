(() => {
"use strict";
const modules = {};

// geometry.js
modules["geometry.js"] = (() => {

// Geometria 2D per a l'editor i el reproductor.
// Un punt és [x, y] en píxels de la imatge de fons; un polígon és una llista de punts (tancada implícitament).
// No depèn del navegador: també es fa servir des dels tests de Node.

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Raig cap a la dreta: el punt és dins si travessa un nombre senar de vores
function pointInPolygon([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function closestPointOnSegment([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return [ax + t * dx, ay + t * dy];
}

const distToSegment = (p, a, b) => dist(p, closestPointOnSegment(p, a, b));

// On talla el segment ab amb el segment cd, com a fracció t (0..1) del camí d'a fins a b.
// Inclou els contactes pels extrems; dos segments paral·lels no es tallen.
function segmentIntersection(a, b, c, d) {
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
function segmentsCross(a, b, c, d) {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Un polígon que es creua amb si mateix (en forma de 8) no té un interior clar i el reproductor no hi podrà buscar camins
function isSelfIntersecting(poly) {
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // la primera i l'última vora comparteixen un vèrtex
      if (segmentsCross(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) return true;
    }
  }
  return false;
}

function area(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return a / 2;
}

// Centre de masses del polígon; si és degenerat (àrea zero), la mitjana dels vèrtexs
function centroid(poly) {
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

function bounds(poly) {
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

return { dist, pointInPolygon, closestPointOnSegment, distToSegment, segmentIntersection, segmentsCross, isSelfIntersecting, area, centroid, bounds };
})();

// player/navmesh.js
modules["player/navmesh.js"] = (() => {
const { dist, pointInPolygon, distToSegment, closestPointOnSegment, segmentIntersection } = modules["geometry.js"];
// Camins dins de la zona caminable d'un escenari.
// La zona és la unió de tots els polígons caminables (es poden solapar). El camí més curt entre dos punts
// d'una zona poligonal només gira als vèrtexs, així que fem un graf de visibilitat: els nodes són els vèrtexs
// (i els punts on es creuen polígons diferents), i dos nodes estan connectats si es veuen sense sortir de la zona.
// Després, A* sobre aquest graf. No depèn del navegador.


// Marge per considerar que un punt sobre la vora (o a tocar) és dins: els camins van arran de les vores
const EPS = 0.75;

// El punt de la zona caminable més proper a «pt» (ell mateix si ja hi és), sense muntar el graf de camins.
// L'editor ho fa servir per ensenyar on es posarà el personatge.
function nearestWalkable(polygons, pt) {
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

function createNavMesh(polygons) {
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

return { nearestWalkable, createNavMesh };
})();

// player/actor.js
modules["player/actor.js"] = (() => {

// Personatge provisional (fins que a la fase 5 hi hagi sprites) i la seva mida segons la profunditat.
// La mida es dona en píxels de la imatge: «near» és l'alçada a la part de baix de la zona caminable (a prop de la càmera)
// i «far» a la part de dalt (lluny). Entremig, es reparteix en línia recta.

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function walkableRange(scene) {
  const ys = scene.walkable.flat().map((p) => p[1]);
  return ys.length ? { minY: Math.min(...ys), maxY: Math.max(...ys) } : null;
}

// Si l'escenari no en té de definida: a prop fa un 30% de l'alçada de la imatge, i lluny s'encongeix
// com si l'horitzó fos a dalt de tot de la imatge
function autoActorHeight(scene, imageHeight) {
  const near = Math.round(imageHeight * 0.3);
  const range = walkableRange(scene);
  if (!range || range.maxY <= 0) return { near, far: near };
  return { near, far: Math.round(near * clamp(range.minY / range.maxY, 0.4, 1)) };
}

// Funció y → alçada del personatge en aquest escenari
function actorHeightAt(scene, imageHeight) {
  const { near, far } = scene.actorHeight ?? autoActorHeight(scene, imageHeight);
  const range = walkableRange(scene);
  if (!range || range.maxY <= range.minY) return () => near;
  return (y) => far + (near - far) * clamp((y - range.minY) / (range.maxY - range.minY), 0, 1);
}

// Dibuixa el personatge amb els peus a (x, y), en coordenades de la imatge.
// La figura fa 16 unitats d'alt; «step» és la fase del pas (radians) i «facing» 1 (dreta) o -1 (esquerra).
// «shirt» canvia el color de la camisa, per distingir personatges que encara no tenen sprites.
function drawActor(ctx, { x, y, height, facing = 1, step = 0, shirt = "#f2efe6" }) {
  const u = height / 16;
  const swing = Math.sin(step);
  // Les posicions són per a la figura mirant a la dreta; mirant a l'esquerra s'emmirallen
  const part = (color, x0, y0, w, h) => {
    const left = facing === 1 ? x0 : -(x0 + w);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + left * u), Math.round(y + y0 * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(h * u)));
  };

  ctx.fillStyle = "rgba(0, 0, 0, .3)";
  ctx.beginPath();
  ctx.ellipse(x, y, 3 * u, Math.max(1, 0.7 * u), 0, 0, Math.PI * 2);
  ctx.fill();

  const s = swing * 0.9;
  part("#1f2a4d", -1.6 - s, -6, 1.5, 6);      // cama de darrere
  part("#3b2416", -1.6 - s, -0.8, 1.9, 0.8);
  part("#2b3a67", 0.1 + s, -6, 1.5, 6);       // cama del davant
  part("#3b2416", 0.1 + s, -0.8, 1.9, 0.8);
  part(shirt, -2, -12, 4, 6.2);               // camisa
  part("#6b4226", -2, -6.6, 4, 0.7);          // cinturó
  part("#e3ddd0", -0.5 - swing * 0.6, -11.5, 1.2, 4.8); // braç
  part("#e8b48a", -0.5 - swing * 0.6, -6.9, 1.2, 1);
  part("#e8b48a", -1.5, -15.5, 3.2, 3.6);     // cap
  part("#c9772b", -1.8, -16.3, 3.6, 1.3);     // cabell
  part("#c9772b", -1.8, -15.2, 1.1, 2.6);
  part("#1a1405", 0.8, -14.4, 0.6, 0.7);      // ull
}

return { walkableRange, autoActorHeight, actorHeightAt, drawActor };
})();

// player/objects.js
modules["player/objects.js"] = (() => {

// Ajudes sobre els objectes compartides per l'editor i el reproductor

// Fitxer de la imatge d'un objecte en un estat (per defecte, l'inicial), o null si en aquest estat no té imatge.
// Si l'estat és animat (frames, fps), el del fotograma que toca a l'instant «time» (en segons).
function spriteFile(object, stateId = object.initialState, time = 0) {
  const st = object.states.find((s) => s.id === stateId);
  if (!st) return null;
  if (st.frames?.length > 1) return st.frames[Math.floor(time * (st.fps || 8)) % st.frames.length];
  return st.image ?? null;
}

// Tots els fitxers que pot mostrar un estat (per carregar-los abans)
const stateFiles = (object, stateId = object.initialState) => {
  const st = object.states.find((s) => s.id === stateId);
  return st ? [st.image, ...(st.frames ?? [])].filter(Boolean) : [];
};

// Rectangle que ocupa la imatge: la posició és el punt de baix al mig, com els peus del personatge
function spriteRect(position, img) {
  const w = img?.naturalWidth ?? 16, h = img?.naturalHeight ?? 16;
  return { x: Math.round(position[0] - w / 2), y: Math.round(position[1] - h), w, h };
}

// Opacitat dels píxels de cada imatge, per saber si un clic toca l'objecte o un forat transparent
const alphaCache = new WeakMap();

function opaqueAt(img, x, y) {
  if (!img) return true;
  let data = alphaCache.get(img);
  if (!data) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    try {
      data = ctx.getImageData(0, 0, c.width, c.height).data;
    } catch {
      data = null;
    }
    alphaCache.set(img, data);
  }
  if (!data) return true;
  const px = Math.floor(x), py = Math.floor(y);
  if (px < 0 || py < 0 || px >= img.naturalWidth || py >= img.naturalHeight) return false;
  return data[(py * img.naturalWidth + px) * 4 + 3] > 16;
}

return { spriteFile, stateFiles, spriteRect, opaqueAt };
})();

// player/characters.js
modules["player/characters.js"] = (() => {
const { drawActor } = modules["player/actor.js"];
const { opaqueAt } = modules["player/objects.js"];
// Personatges: fotogrames del full de sprites, animacions i dibuix. Compartit per l'editor i el reproductor.
// El full és una graella de fotogrames iguals (frameWidth × frameHeight), numerats d'esquerra a dreta i de dalt a baix.
// Els peus del personatge són al mig de la vora de baix del fotograma.



// Si una animació no té fotogrames, se'n fa servir una de semblant: la mateixa de costat o de cara,
// i si no, estar quiet. Així un personatge amb només «quiet de costat» ja funciona.
function animationKeyFor(ch, anim, dir) {
  const keys = [`${anim}-${dir}`, `${anim}-side`, `${anim}-down`];
  if (anim !== "idle") keys.push(`idle-${dir}`, "idle-side", "idle-down");
  return keys.find((k) => ch.animations[k]?.frames.length) ?? null;
}

function animationFor(ch, anim, dir) {
  return ch.animations[animationKeyFor(ch, anim, dir)] ?? { frames: [0], fps: 1 };
}

function frameAt(ch, anim, dir, time) {
  const a = animationFor(ch, anim, dir);
  return a.frames[Math.floor(time * a.fps) % a.frames.length];
}

function sheetGrid(ch, sheet) {
  const cols = Math.max(1, Math.floor(sheet.naturalWidth / ch.frameWidth));
  const rows = Math.max(1, Math.floor(sheet.naturalHeight / ch.frameHeight));
  return { cols, rows, count: cols * rows };
}

function frameSource(ch, sheet, index) {
  const { cols } = sheetGrid(ch, sheet);
  return { sx: (index % cols) * ch.frameWidth, sy: Math.floor(index / cols) * ch.frameHeight, sw: ch.frameWidth, sh: ch.frameHeight };
}

// Cap on mira, tal com es guarda a les col·locacions, convertit a direcció d'animació i a emmirallat
function facingToDir(facing) {
  if (facing === "left") return { dir: "side", flip: -1 };
  if (facing === "right") return { dir: "side", flip: 1 };
  return { dir: facing === "up" ? "up" : "down", flip: 1 };
}

// Rectangle que ocupa el personatge, en coordenades de l'escenari.
// «height» és l'alçada a què es dibuixa; sense full de sprites, la figura provisional és més estreta que alta.
function characterRect(ch, sheet, x, y, height) {
  const w = sheet ? (ch.frameWidth / ch.frameHeight) * height : height * 0.38;
  return { x: x - w / 2, y: y - height, w, h: height };
}

// Dibuixa el personatge amb els peus a (x, y). Sense full de sprites, fa servir la figura provisional amb la camisa del seu color.
function drawCharacter(ctx, ch, sheet, { x, y, height, dir = "side", flip = 1, anim = "idle", time = 0, step = 0 }) {
  if (!ch || !sheet) {
    drawActor(ctx, { x, y, height, facing: flip, step, shirt: ch?.color });
    return;
  }
  const scale = height / ch.frameHeight;
  const w = ch.frameWidth * scale;
  const src = frameSource(ch, sheet, frameAt(ch, anim, dir, time));
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (dir === "side" && flip < 0) ctx.scale(-1, 1);
  ctx.drawImage(sheet, src.sx, src.sy, src.sw, src.sh, -w / 2, -height, w, height);
  ctx.restore();
}

// Si un punt de l'escenari toca un píxel opac del fotograma que s'està mostrant
function characterHit(ch, sheet, { x, y, height, dir = "side", flip = 1, anim = "idle", time = 0 }, p) {
  const r = characterRect(ch, sheet, x, y, height);
  if (p[0] < r.x || p[0] >= r.x + r.w || p[1] < r.y || p[1] >= r.y + r.h) return false;
  if (!sheet) return true;
  const scale = height / ch.frameHeight;
  let lx = (p[0] - r.x) / scale;
  const ly = (p[1] - r.y) / scale;
  if (dir === "side" && flip < 0) lx = ch.frameWidth - lx;
  const src = frameSource(ch, sheet, frameAt(ch, anim, dir, time));
  return opaqueAt(sheet, src.sx + lx, src.sy + ly);
}

// On es posa el protagonista per parlar amb un personatge (si no se n'ha triat cap): al costat cap on mira,
// a una distància proporcional a la seva alçada
function defaultApproach(position, facing, height) {
  const side = facing === "left" ? -1 : 1;
  return [position[0] + side * height * 0.6, position[1]];
}

return { animationKeyFor, animationFor, frameAt, sheetGrid, frameSource, facingToDir, characterRect, drawCharacter, characterHit, defaultApproach };
})();

// player/rules.js
modules["player/rules.js"] = (() => {

// Lògica de la partida: l'estat (inventari, on és cada objecte, estats i variables),
// les condicions i les accions de les regles. No depèn del navegador: es prova des de Node.
//
// Una regla és: verb + cosa (objecte o punt calent) [+ segon objecte] → condicions (totes) → accions (en ordre).
// Si n'hi ha diverses que encaixen, guanya la primera de la llista.

const INVENTORY = "inventory";

function createGameState(adventure) {
  const location = new Map();   // objecte → id de l'escenari on és, o INVENTORY; si no hi és, ha desaparegut
  for (const s of adventure.scenes) for (const p of s.objects) location.set(p.objectId, s.id);
  return {
    inventory: [],
    location,
    states: new Map(adventure.objects.map((o) => [o.id, o.initialState])),
    vars: new Map(adventure.variables.map((v) => [v.id, v.initial])),
    said: new Set(),            // opcions de diàleg que ja s'han triat: «idDiàleg:idOpció»
    seen: new Set(),            // seqüències que ja s'han vist (per a les que només es fan la primera vegada)
    ended: null,                // text de la pantalla final, quan s'acaba el joc
  };
}

const sameRef = (a, b) => (!a && !b) || (!!a && !!b && a.kind === b.kind && a.id === b.id);

function compare(a, op, b) {
  switch (op) {
    case "!=": return a !== b;
    case "<": return Number(a) < Number(b);
    case ">": return Number(a) > Number(b);
    case "<=": return Number(a) <= Number(b);
    case ">=": return Number(a) >= Number(b);
    default: return a === b;
  }
}

// Una condició que apunta a una cosa que ja no existeix no es compleix mai
function checkCondition(state, c) {
  if (!c) return false;
  let ok;
  if (c.type === "has") ok = state.inventory.includes(c.objectId);
  else if (c.type === "state") {
    if (!state.states.has(c.objectId)) return false;
    ok = state.states.get(c.objectId) === c.stateId;
  } else if (c.type === "said") {
    ok = state.said.has(`${c.dialogueId}:${c.optionId}`);
  } else if (c.type === "var") {
    if (!state.vars.has(c.varId)) return false;
    ok = compare(state.vars.get(c.varId), c.op, c.value);
  } else return false;
  return c.not ? !ok : ok;
}

// «Fes servir la clau amb la porta» també troba la regla escrita com «Fes servir la porta amb la clau»
function findRule(adventure, state, verbId, target, withRef = null) {
  const fits = (r, t, w) => r.verb === verbId && sameRef(r.target, t) && sameRef(r.with, w)
    && r.conditions.every((c) => checkCondition(state, c));
  return adventure.rules.find((r) => fits(r, target, withRef))
    ?? (withRef ? adventure.rules.find((r) => fits(r, withRef, target)) : undefined)
    ?? null;
}

// Les accions que només canvien l'estat. Retorna false si l'acció és d'un altre tipus (o apunta a una cosa que no existeix).
function applyStateAction(adventure, state, a) {
  if (!a) return false;
  const object = (id) => adventure.objects.find((o) => o.id === id);
  switch (a.type) {
    case "take":
      if (!object(a.objectId)) return false;
      if (!state.inventory.includes(a.objectId)) state.inventory.push(a.objectId);
      state.location.set(a.objectId, INVENTORY);
      return true;
    case "lose":
      state.inventory = state.inventory.filter((id) => id !== a.objectId);
      state.location.delete(a.objectId);
      return true;
    case "setState":
      if (!object(a.objectId)?.states.some((s) => s.id === a.stateId)) return false;
      state.states.set(a.objectId, a.stateId);
      return true;
    case "setVar": {
      if (!state.vars.has(a.varId)) return false;
      const cur = state.vars.get(a.varId);
      state.vars.set(a.varId, a.op === "add" ? Number(cur) + Number(a.value) : a.value);
      return true;
    }
    default:
      return false;
  }
}

// Executa les accions una darrere l'altra. «fx» fa les que necessiten el reproductor, i totes retornen una promesa:
// say(text, qui: id de personatge o null per al protagonista), goto(sceneId, arrival), wait(segons), end(text),
// dialogue(id), walk(punt, qui), sound(id), music(id o null), cutscene(id) i changed() després de cada canvi d'estat.
async function runActions(adventure, state, actions, fx) {
  for (const a of actions) {
    if (state.ended) return;
    if (!a) continue;
    if (["take", "lose", "setState", "setVar"].includes(a.type)) {
      if (applyStateAction(adventure, state, a)) await fx.changed?.();
      continue;
    }
    if (a.type === "say") await fx.say(a.text, a.by ?? null);
    else if (a.type === "goto") {
      if (adventure.scenes.some((s) => s.id === a.sceneId)) await fx.goto(a.sceneId, a.arrival);
    } else if (a.type === "wait") await fx.wait(a.seconds);
    else if (a.type === "dialogue") {
      if (adventure.dialogues?.some((d) => d.id === a.dialogueId)) await fx.dialogue(a.dialogueId);
    } else if (a.type === "walk") await fx.walk?.(a.point, a.by ?? null);
    else if (a.type === "sound") fx.sound?.(a.soundId);
    else if (a.type === "music") fx.music?.(a.soundId ?? null);
    else if (a.type === "cutscene") {
      if (adventure.cutscenes?.some((c) => c.id === a.cutsceneId)) await fx.cutscene(a.cutsceneId);
    }
    else if (a.type === "end") {
      state.ended = a.text || "Fi";
      await fx.end(state.ended);
    }
  }
}

/* ---------- Diàlegs ---------- */

const startNode = (dialogue) => dialogue.nodes.find((n) => n.id === dialogue.start) ?? dialogue.nodes[0] ?? null;

// Opcions que es poden triar ara: compleixen les condicions i, si són d'un sol ús, encara no s'han dit
function availableOptions(dialogue, node, state) {
  return node.options.filter((o) => !(o.once && state.said.has(`${dialogue.id}:${o.id}`))
    && o.conditions.every((c) => checkCondition(state, c)));
}

function markSaid(state, dialogue, option) {
  state.said.add(`${dialogue.id}:${option.id}`);
}

// El diàleg d'un personatge, si en té: el que comença «Parla amb» quan cap regla diu el contrari
const dialogueFor = (adventure, characterId) => adventure.dialogues?.find((d) => d.characterId === characterId) ?? null;

/* ---------- Partides desades ---------- */

// L'estat de la partida en un objecte que es pot guardar com a JSON
function serializeGame(state) {
  return {
    inventory: [...state.inventory],
    location: [...state.location],
    states: [...state.states],
    vars: [...state.vars],
    said: [...state.said],
    seen: [...state.seen],
  };
}

// I a l'inrevés. Si l'aventura ha canviat des que es va desar (coses esborrades), el que ja no existeix es descarta.
function restoreGame(adventure, data) {
  const state = createGameState(adventure);
  const objects = new Map(adventure.objects.map((o) => [o.id, o]));
  const scenes = new Set(adventure.scenes.map((s) => s.id));
  state.inventory = (data.inventory ?? []).filter((id) => objects.has(id));
  state.location = new Map((data.location ?? []).filter(([id, where]) => objects.has(id) && (where === INVENTORY || scenes.has(where))));
  for (const [id, s] of data.states ?? []) if (objects.get(id)?.states.some((x) => x.id === s)) state.states.set(id, s);
  for (const [id, v] of data.vars ?? []) if (state.vars.has(id)) state.vars.set(id, v);
  state.said = new Set(data.said ?? []);
  state.seen = new Set(data.seen ?? []);
  return state;
}

return { INVENTORY, createGameState, sameRef, checkCondition, findRule, applyStateAction, runActions, startNode, availableOptions, markSaid, dialogueFor, serializeGame, restoreGame };
})();

// defaults.js
modules["defaults.js"] = (() => {

// Valors per defecte compartits pel servidor i la interfície

// Els 9 verbs clàssics, en l'ordre de la graella de 3×3 de Monkey Island 2.
// «response» és el que diu el personatge quan el verb no té cap efecte sobre una cosa.
// «look» és especial: amb un objecte o un punt calent, el personatge en diu la descripció.
// «preposition» fa que el verb pugui unir dos objectes: «Fes servir la clau amb la porta», «Dóna el rom al pirata».
// «key» és la drecera de teclat del joc (una lletra o un número, o "" si no en té).
const DEFAULT_VERBS = [
  { id: "give", name: "Dóna", response: "No crec que ho vulgui.", preposition: "a", key: "d" },
  { id: "pickup", name: "Agafa", response: "No ho puc agafar.", key: "a" },
  { id: "use", name: "Fes servir", response: "No sé com fer-ho servir.", preposition: "amb", key: "f" },
  { id: "open", name: "Obre", response: "No es pot obrir.", key: "o" },
  { id: "look", name: "Mira", response: "No hi veig res d'especial.", key: "m" },
  { id: "push", name: "Empeny", response: "No es mou.", key: "e" },
  { id: "close", name: "Tanca", response: "No es pot tancar.", key: "t" },
  { id: "talk", name: "Parla amb", response: "No crec que em contesti.", key: "p" },
  { id: "pull", name: "Estira", response: "No es mou.", key: "s" },
].map((v) => ({ preposition: "", ...v }));

// Les tecles que poden ser drecera d'un verb
const VERB_KEY = /^[a-z0-9ç]$/;

const LOOK = "look";
const PICKUP = "pickup";

// Tipus de condicions i accions de les regles (el servidor les valida i el reproductor les executa)
const CONDITION_TYPES = ["has", "state", "var", "said"];
const ACTION_TYPES = ["say", "take", "lose", "setState", "setVar", "goto", "wait", "dialogue", "end", "walk", "sound", "music", "cutscene"];
const VARIABLE_TYPES = ["bool", "number", "text"];
const OPS = ["==", "!=", "<", ">", "<=", ">="];

// Animacions dels personatges: tres accions en tres direccions. «side» és mirant a la dreta (a l'esquerra s'emmiralla),
// «down» és de cara a la càmera i «up» d'esquena. Cada animació és una llista de fotogrames del full de sprites.
const ANIMATIONS = ["idle", "walk", "talk"];
const DIRECTIONS = ["side", "down", "up"];
const ANIMATION_KEYS = ANIMATIONS.flatMap((a) => DIRECTIONS.map((d) => `${a}-${d}`));
const CHARACTER_FACINGS = ["down", "left", "right", "up"];

// Com s'entra a un escenari: fos a negre, tall sec, o el cercle que es tanca sobre el protagonista
const TRANSITIONS = ["fade", "cut", "iris"];
const CURSORS = ["cross", "system"];

return { DEFAULT_VERBS, VERB_KEY, LOOK, PICKUP, CONDITION_TYPES, ACTION_TYPES, VARIABLE_TYPES, OPS, ANIMATIONS, DIRECTIONS, ANIMATION_KEYS, CHARACTER_FACINGS, TRANSITIONS, CURSORS };
})();

// player/audio.js
modules["player/audio.js"] = (() => {

// So del reproductor: una música que es repeteix i efectes que sonen una vegada.
// Els navegadors no deixen sonar res fins que el jugador ha fet algun clic: si la música no pot començar,
// es torna a provar amb el següent clic (unlock).

function createAudio(adventure, urlFor) {
  const sounds = new Map((adventure.sounds ?? []).map((s) => [s.id, s]));
  let music = null, musicId = null, muted = false, blocked = false;

  const tryPlay = (el) => el.play().then(() => { blocked = false; }).catch(() => { blocked = true; });

  return {
    // La mateixa música que ja sona continua; null l'atura
    music(id) {
      if (id === musicId) return;
      musicId = id;
      music?.pause();
      music = null;
      const s = sounds.get(id);
      if (!s) return;
      music = new Audio(urlFor(s.file));
      music.loop = true;
      music.volume = 0.5;
      music.muted = muted;
      tryPlay(music);
    },
    sound(id) {
      const s = sounds.get(id);
      if (!s || muted) return;
      const a = new Audio(urlFor(s.file));
      a.volume = 0.9;
      a.play().catch(() => {});
    },
    unlock() {
      if (blocked && music) tryPlay(music);
    },
    setMuted(on) {
      muted = on;
      if (music) music.muted = on;
    },
    stop() {
      music?.pause();
      music = null;
      musicId = null;
    },
    get musicId() { return musicId; },
  };
}

return { createAudio };
})();

// player/saves.js
modules["player/saves.js"] = (() => {

// Les partides desades: unes quantes ranures al navegador de qui juga (localStorage), una llista per aventura.
// Si el navegador no deixa guardar res (navegació privada…), les funcions ho diuen en lloc de petar.

const SLOTS = 5;

function createSaves(adventureId, storage = globalThis.localStorage) {
  const key = `aventura-partides:${adventureId}`;
  function read() {
    try {
      const list = JSON.parse(storage.getItem(key));
      return Array.from({ length: SLOTS }, (_, i) => list?.[i] ?? null);
    } catch {
      return Array(SLOTS).fill(null);
    }
  }
  function write(list) {
    try {
      storage.setItem(key, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  }
  return {
    list: read,
    // Retorna false si no s'ha pogut guardar
    save(slot, data) {
      const list = read();
      list[slot] = { ...data, savedAt: new Date().toISOString() };
      return write(list);
    },
    remove(slot) {
      const list = read();
      list[slot] = null;
      return write(list);
    },
    any: () => read().some(Boolean),
  };
}

return { SLOTS, createSaves };
})();

// player/player.js
modules["player/player.js"] = (() => {
const { pointInPolygon } = modules["geometry.js"];
const { createNavMesh } = modules["player/navmesh.js"];
const { actorHeightAt } = modules["player/actor.js"];
const { drawCharacter, characterRect, characterHit, facingToDir, defaultApproach } = modules["player/characters.js"];
const { spriteFile, stateFiles, spriteRect, opaqueAt } = modules["player/objects.js"];
const { createGameState, checkCondition, findRule, applyStateAction, runActions, startNode, availableOptions, markSaid, dialogueFor, serializeGame, restoreGame } = modules["player/rules.js"];
const { LOOK, PICKUP } = modules["defaults.js"];
const { createAudio } = modules["player/audio.js"];
const { createSaves } = modules["player/saves.js"];
// Motor del reproductor: dibuixa l'escenari a la seva resolució, mou el personatge on cliques
// (buscant camí per la zona caminable), executa els verbs sobre objectes, punts calents i l'inventari
// seguint les regles de l'aventura, i canvia d'escenari en passar per una sortida.
// No depèn de l'editor: rep l'aventura i una funció per trobar les imatges, perquè més endavant es pugui exportar sol.










const FALLBACK = { w: 320, h: 200 };   // mida d'un escenari sense fons
const WALK_SPEED = 1.6;                 // alçades del personatge per segon
const FADE_MS = 250;
const LAYER_ORDER = { back: 0, auto: 1, front: 2 };
const IRIS_MS = 450;

// Cursor clàssic: una creu de píxels; groga quan és sobre una cosa
const crossCursor = (color) => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='23' height='23' shape-rendering='crispEdges'><g fill='${color}' stroke='#000'>`
  + "<rect x='10' y='0' width='3' height='8'/><rect x='10' y='15' width='3' height='8'/>"
  + "<rect x='0' y='10' width='8' height='3'/><rect x='15' y='10' width='8' height='3'/></g></svg>",
)}") 11 11, crosshair`;
const CURSOR_STYLES = {
  cross: { normal: crossCursor("#ffffff"), hover: crossCursor("#f5b942"), wait: "wait" },
  system: { normal: "crosshair", hover: "pointer", wait: "wait" },
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const refOf = (t) => ({ kind: t.kind, id: t.id });

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// opcions: imageUrl(fitxer) → url, startSceneId, onSceneChange(escenari), onStateChange() quan canvia la partida
// (inventari, estats, variables…), setup: una situació de prova per començar (vegeu «applySetup»),
// title: si es mostra la pantalla de títol (només quan es juga des del principi), i saves: on es desen les partides
function createPlayer(container, adventure, {
  imageUrl, startSceneId, onSceneChange, onStateChange, setup = null, title = false, saves = createSaves(adventure.id),
}) {
  container.innerHTML = `
    <div class="player-screen">
      <canvas></canvas>
      <div class="player-overlay"></div>
      <div class="player-fade"></div>
      <div class="player-iris" hidden></div>
      <div class="player-title" hidden><div class="player-title-text"><strong></strong><span></span>
        <div class="player-title-buttons"><button type="button" data-act="start">Comença</button><button type="button" data-act="load" hidden>Carrega una partida</button></div>
      </div></div>
      <div class="player-menu" hidden role="dialog" aria-label="Partides">
        <h3>Partides</h3><ol></ol><p class="player-menu-msg" aria-live="polite"></p>
        <button type="button" data-act="close">Torna al joc</button>
      </div>
      <div class="player-end" hidden><p></p><small class="credits"></small><button type="button">Torna a començar</button></div>
    </div>
    <div class="player-ui">
      <div class="player-corner">
        <button type="button" class="player-hide-button" title="Amaga o mostra els verbs i l'inventari" aria-pressed="false">◐</button>
        <button type="button" class="player-full-button" title="Pantalla completa">⛶</button>
        <button type="button" class="player-menu-button">Partides</button>
      </div>
      <div class="player-sentence" aria-live="polite"></div>
      <div class="player-panel">
        <div class="player-verbs" role="toolbar" aria-label="Verbs"></div>
        <div class="player-inventory" aria-label="Inventari"></div>
        <div class="player-options" role="list" aria-label="Què dius?" hidden></div>
      </div>
    </div>`;
  const screen = container.querySelector(".player-screen");
  const canvas = screen.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const overlay = screen.querySelector(".player-overlay");
  const fader = screen.querySelector(".player-fade");
  const endScreen = screen.querySelector(".player-end");
  const iris = screen.querySelector(".player-iris");
  const titleScreen = screen.querySelector(".player-title");
  const menu = screen.querySelector(".player-menu");
  let menuOpen = false;
  const ui = container.querySelector(".player-ui");
  const sentence = container.querySelector(".player-sentence");
  const verbBox = container.querySelector(".player-verbs");
  const inventoryBox = container.querySelector(".player-inventory");
  const optionsBox = container.querySelector(".player-options");

  const library = new Map(adventure.objects.map((o) => [o.id, o]));
  const cast = new Map(adventure.characters.map((c) => [c.id, c]));
  const playerCh = cast.get(adventure.playerId) ?? null;   // null: la figura provisional
  const lookVerb = adventure.verbs.find((v) => v.id === LOOK);
  let game = createGameState(adventure);
  const images = new Map();   // fitxer → imatge carregada (null mentre es carrega o si falla)
  const meshes = new Map();   // id d'escenari → navmesh
  let scene = null, img = null, mesh = null, heightAt = () => 60;
  let W = FALLBACK.w, H = FALLBACK.h, scale = 1;
  let hover = null;           // la cosa sota el ratolí (a l'escenari o a l'inventari)
  let verb = null;            // verb triat; null és «Camina»
  let first = null;           // primer objecte de «Fes servir X amb…», esperant el segon
  let pending = null;         // acció en curs mentre el personatge hi camina: { verb, target, with }
  let busy = true;            // durant les transicions no s'accepten clics
  let scripting = false;      // mentre s'executen les accions d'una regla, un clic només salta la frase
  let scriptDepth = 0;        // les regles i seqüències es poden encadenar (una seqüència que va a un escenari amb una altra…)
  let cutsceneDepth = 0;      // dins d'una seqüència no es veuen els verbs
  let skipping = false;       // Esc salta la seqüència: les frases, esperes i passeigs es fan a l'instant
  const audio = createAudio(adventure, imageUrl);
  const cursors = CURSOR_STYLES[adventure.cursor] ?? CURSOR_STYLES.cross;
  const setCursor = (kind) => { canvas.style.cursor = cursors[kind]; };
  let debug = false;
  let frame = 0, last = 0, destroyed = false;
  // El protagonista: «dir» és la direcció de l'animació (side, down, up) i «facing» si mira a la dreta (1) o a l'esquerra (-1)
  const actor = { ch: playerCh, x: 0, y: 0, path: [], facing: 1, dir: "side", step: 0, time: 0, onArrive: null };
  setCursor("normal");
  let npcs = [];              // personatges de l'escenari actual, amb la mateixa forma que «actor»
  let speech = null;          // { el, until, done, speaker }

  /* ---------- Mida i coordenades ---------- */

  // L'escenari s'amplia tant com hi càpiga; si es pot, per un factor enter perquè el pixel art quedi net.
  // Quan els verbs i l'inventari a sota el farien molt més petit (un mòbil de costat, una finestra baixa), l'escenari
  // ocupa tota l'alçada i els verbs i l'inventari hi queden a sobre, als costats i translúcids (mode «compact»).
  function layout() {
    container.classList.remove("compact");
    const fullW = container.clientWidth, fullH = container.clientHeight;
    const availW = fullW - 24, availH = fullH - ui.offsetHeight - 34;
    if (fullW <= 0 || fullH <= 0) return;
    const below = availW > 0 && availH > 0 ? Math.min(availW / W, availH / H) : 0, full = Math.min(fullW / W, fullH / H);
    const compact = full > below * 1.25;
    container.classList.toggle("compact", compact);
    const s = compact ? full : below;
    scale = s >= 1 && !compact ? Math.floor(s) : s;
    for (const node of [screen, canvas]) {
      node.style.width = `${W * scale}px`;
      node.style.height = `${H * scale}px`;
    }
    ui.style.width = compact ? "" : `${Math.max(W * scale, Math.min(availW, 360))}px`;
    canvas.style.imageRendering = scale >= 1 ? "pixelated" : "auto";
  }
  const ro = new ResizeObserver(layout);
  ro.observe(container);

  function toImage(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }

  /* ---------- Escenaris i objectes ---------- */

  function meshFor(s) {
    if (!meshes.has(s.id)) meshes.set(s.id, createNavMesh(s.walkable));
    return meshes.get(s.id);
  }

  async function imageFor(file) {
    if (!file) return null;
    if (!images.has(file)) {
      images.set(file, null);
      images.set(file, await loadImage(imageUrl(file)));
    }
    return images.get(file);
  }

  const sheetOf = (ch) => (ch?.sheet ? images.get(ch.sheet) ?? null : null);
  // Tots els personatges s'escalen igual segons la profunditat; l'alçada del fotograma del protagonista fa de referència
  const heightFor = (ch, y) => heightAt(y) * (ch && sheetOf(ch) && playerCh && sheetOf(playerCh) ? ch.frameHeight / playerCh.frameHeight : 1);
  const poseOf = (a) => ({
    x: a.x, y: a.y, height: heightFor(a.ch, a.y), dir: a.dir, flip: a.facing, time: a.time, step: a.step,
    anim: a.path?.length ? "walk" : speech?.speaker === a ? "talk" : "idle",
  });

  // Objectes que ara mateix són en aquest escenari, amb la imatge del seu estat i el rectangle que ocupen.
  // Si un canvi d'estat demana una imatge que encara no s'ha carregat, es carrega i surt al cap d'un moment.
  function sceneObjects() {
    if (!scene) return [];
    return scene.objects.flatMap((p) => {
      const object = library.get(p.objectId);
      if (!object || game.location.get(object.id) !== scene.id) return [];
      const file = spriteFile(object, game.states.get(object.id), performance.now() / 1000);
      if (!file) return [];
      if (!images.has(file)) imageFor(file);
      const sprite = images.get(file);
      return sprite ? [{ p, object, sprite, rect: spriteRect(p.position, sprite) }] : [];
    });
  }

  function fade(to) {
    fader.style.opacity = String(to);
    return new Promise((r) => setTimeout(r, FADE_MS));
  }

  // Canvia l'opacitat del fos a l'instant, sense l'animació
  function blackNow(on) {
    fader.style.transition = "none";
    fader.style.opacity = on ? "1" : "0";
    void fader.offsetWidth;
    fader.style.transition = "";
  }

  // El cercle que es tanca (o s'obre) sobre el protagonista: un forat rodó amb una ombra negra que ho tapa tot
  function irisTo(open, [cx, cy]) {
    const big = Math.hypot(W * scale, H * scale);
    const place = (r) => Object.assign(iris.style, { width: `${r * 2}px`, height: `${r * 2}px`, left: `${cx - r}px`, top: `${cy - r}px` });
    iris.style.transition = "none";
    iris.hidden = false;
    place(open ? 0 : big);
    void iris.offsetWidth;
    iris.style.transition = "";
    place(open ? big : 0);
    return new Promise((r) => setTimeout(r, IRIS_MS));
  }
  const actorOnScreen = () => [actor.x * scale, (actor.y - heightFor(actor.ch, actor.y) / 2) * scale];

  async function transitionOut(kind) {
    if (!scene || kind === "cut" || skipping) return blackNow(true);
    if (kind === "iris") {
      await irisTo(false, actorOnScreen());
      blackNow(true);
      iris.hidden = true;
      return;
    }
    await fade(1);
  }

  async function transitionIn(kind) {
    if (kind === "cut" || skipping) return blackNow(false);
    if (kind === "iris") {
      const opening = irisTo(true, actorOnScreen());
      blackNow(false);
      await opening;
      iris.hidden = true;
      return;
    }
    await fade(0);
  }

  // quiet: sense la seqüència d'entrada (en carregar una partida no s'ha de tornar a veure)
  async function enterScene(id, arrival, { quiet = false } = {}) {
    const next = adventure.scenes.find((s) => s.id === id);
    if (!next) { say("Aquest escenari ja no existeix."); return; }
    busy = true;
    hover = null;
    pending = null;
    verb = null;
    first = null;
    clearSpeech();
    await transitionOut(next.transition);
    if (destroyed) return;
    scene = next;
    img = await imageFor(scene.background);
    await Promise.all([
      ...scene.objects.map((p) => {
        const o = library.get(p.objectId);
        return o ? Promise.all(stateFiles(o, game.states.get(o.id)).map(imageFor)) : null;
      }),
      imageFor(playerCh?.sheet),
      ...scene.characters.map((p) => imageFor(cast.get(p.characterId)?.sheet)),
    ]);
    W = img?.naturalWidth ?? FALLBACK.w;
    H = img?.naturalHeight ?? FALLBACK.h;
    canvas.width = W;
    canvas.height = H;
    layout();
    mesh = meshFor(scene);
    heightAt = actorHeightAt(scene, H);
    // Sense punt d'arribada, el personatge surt al punt de la zona caminable més proper a baix al mig
    const target = arrival ?? [W / 2, H];
    const p = mesh.isEmpty ? [clamp(target[0], 0, W), clamp(target[1], 0, H)] : mesh.nearestPoint(target);
    Object.assign(actor, { x: p[0], y: p[1], path: [], onArrive: null });
    // El protagonista no surt mai com a personatge col·locat, encara que algú l'hagi deixat en un escenari
    npcs = scene.characters
      .filter((pl) => pl.characterId !== adventure.playerId && cast.has(pl.characterId))
      .map((pl) => ({ ch: cast.get(pl.characterId), placement: pl, x: pl.position[0], y: pl.position[1], path: [], step: 0, time: 0, onArrive: null, ...facingFields(pl.facing) }));
    // La música de l'escenari; si no en té, continua la que soni
    if (scene.music) audio.music(scene.music);
    renderVerbs();
    renderInventory();
    updateSentence();
    onSceneChange?.(scene);
    await transitionIn(scene.transition);
    busy = false;
    // La seqüència d'entrada (si n'hi ha); qui hagi cridat enterScene l'espera
    const enter = scene.onEnter;
    if (!quiet && enter?.cutsceneId && !(enter.once && game.seen.has(enter.cutsceneId))) {
      await script([{ type: "cutscene", cutsceneId: enter.cutsceneId }]);
    } else if (mesh.isEmpty && !cutsceneDepth) say("Aquí no hi ha on caminar.");
  }

  /* ---------- Coses: a l'escenari i a l'inventari ---------- */

  // Els objectes i personatges queden per sobre dels punts calents; d'entre ells, el que es dibuixa a sobre
  function targetAt(p) {
    if (!scene) return null;
    for (const d of drawables().reverse()) {
      if (d.kind === "object") {
        const o = d.item, { x, y, w, h } = o.rect;
        if (o.object.decor) continue;   // els objectes decoratius (llums, espelmes...) no es poden tocar
        if (p[0] >= x && p[0] < x + w && p[1] >= y && p[1] < y + h && opaqueAt(o.sprite, p[0] - x, p[1] - y)) {
          return {
            kind: "object", id: o.object.id, name: o.object.name, description: o.object.description, object: o.object,
            inScene: true, walkTo: o.p.walkTo ?? o.p.position, facing: o.p.facing, anchor: o.p.position,
          };
        }
      } else if (d.kind === "npc") {
        const n = d.item, pose = poseOf(n);
        if (characterHit(n.ch, sheetOf(n.ch), pose, p)) {
          return {
            kind: "character", id: n.ch.id, name: n.ch.name, description: n.ch.description, npc: n, inScene: true,
            walkTo: n.placement.walkTo ?? defaultApproach([n.x, n.y], n.placement.facing, pose.height),
            facing: "auto", anchor: [n.x, n.y],
          };
        }
      }
    }
    for (let i = scene.hotspots.length - 1; i >= 0; i--) {
      const h = scene.hotspots[i];
      if (pointInPolygon(p, h.polygon)) {
        return { kind: "hotspot", id: h.id, name: h.name, description: h.description, inScene: true, walkTo: p, facing: "auto", anchor: p, exit: h.exit };
      }
    }
    return null;
  }

  function facingFields(facing) {
    const { dir, flip } = facingToDir(facing);
    return { dir, facing: flip };
  }

  const inventoryTarget = (o) => ({ kind: "object", id: o.id, name: o.name, description: o.description, object: o, inScene: false });

  function renderInventory() {
    // Tot el que canvia la partida acaba refent l'inventari: és el moment d'avisar el mode de proves
    onStateChange?.();
    inventoryBox.replaceChildren();
    const items = game.inventory.map((id) => library.get(id)).filter(Boolean);
    if (!items.length) {
      const empty = document.createElement("span");
      empty.className = "inv-empty";
      empty.textContent = "Inventari buit";
      inventoryBox.append(empty);
      return;
    }
    for (const o of items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "inv-item";
      b.title = o.name;
      b.setAttribute("aria-label", o.name);
      b.classList.toggle("selected", first?.id === o.id);
      const file = o.icon ?? spriteFile(o, game.states.get(o.id));
      if (file) {
        const im = document.createElement("img");
        im.alt = "";
        im.src = imageUrl(file);
        b.append(im);
      } else {
        b.textContent = o.name;
      }
      const target = inventoryTarget(o);
      b.onpointerenter = () => { hover = target; updateSentence(); };
      b.onpointerleave = () => { hover = null; updateSentence(); };
      // Sense verb, un clic a l'inventari mira l'objecte
      b.onclick = () => (verb || first ? choose(target) : look(target));
      b.oncontextmenu = (e) => { e.preventDefault(); look(target); };
      inventoryBox.append(b);
    }
  }

  /* ---------- Verbs i frase ---------- */

  function pickVerb(v) {
    verb = verb?.id === v.id ? null : v;
    first = null;
    renderVerbs();
    renderInventory();
    updateSentence();
  }

  // Les tecles d'un verb: la seva drecera i, si cap verb no l'ha agafada, el número de la seva posició (1-9)
  function verbKeys(v) {
    const keys = v.key ? [v.key] : [];
    const n = String(adventure.verbs.indexOf(v) + 1);
    if (n.length === 1 && n !== "0" && !adventure.verbs.some((o) => o.key === n)) keys.push(n);
    return keys;
  }
  const verbForKey = (k) => adventure.verbs.find((v) => verbKeys(v).includes(k));

  function renderVerbs() {
    verbBox.replaceChildren();
    for (const v of adventure.verbs) {
      const b = document.createElement("button");
      b.type = "button";
      // La lletra de la drecera surt subratllada al nom, com als menús clàssics
      const at = v.key ? v.name.toLowerCase().indexOf(v.key) : -1;
      if (at >= 0) {
        const u = document.createElement("u");
        u.textContent = v.name[at];
        b.append(v.name.slice(0, at), u, v.name.slice(at + 1));
      } else b.textContent = v.name;
      b.setAttribute("aria-pressed", String(verb?.id === v.id));
      const keys = verbKeys(v);
      if (keys.length) {
        b.title = `Tecla ${keys.map((k) => k.toUpperCase()).join(" o ")}`;
        b.setAttribute("aria-keyshortcuts", keys.map((k) => k.toUpperCase()).join(" "));
      }
      b.onclick = () => {
        if (busy || scripting) return;
        pickVerb(v);
      };
      verbBox.append(b);
    }
  }

  // «Camina a Porta», «Mira Barril», «Fes servir Clau amb Porta»…
  // Mentre s'executa una acció, la frase queda fixada i ressaltada.
  function updateSentence() {
    let words;
    if (pending) {
      const v = pending.verb;
      words = [v ? v.name : "Camina a", pending.target.name, pending.with && v.preposition, pending.with?.name];
    } else if (first) {
      words = [verb.name, first.name, verb.preposition, hover?.id !== first.id && hover?.name];
    } else {
      words = verb || hover ? [verb ? verb.name : "Camina a", hover?.name] : ["Camina"];
    }
    sentence.textContent = words.filter(Boolean).join(" ");
    sentence.classList.toggle("active", !!pending);
  }

  function resetVerb() {
    verb = null;
    first = null;
    renderVerbs();
    renderInventory();
    updateSentence();
  }

  /* ---------- Accions ---------- */

  function useExit(exit) {
    if (!exit?.sceneId) { say("Per aquí no es va enlloc."); return; }
    // Una sortida tancada (per exemple, cal un bitllet): el protagonista diu per què no hi pot passar
    if (!(exit.conditions ?? []).every((c) => checkCondition(game, c))) { say(exit.blocked || "Ara no hi puc passar."); return; }
    enterScene(exit.sceneId, exit.arrival);
  }

  // Les accions de les regles: les frases esperen que s'acabin (o que el jugador cliqui per saltar-les)
  const fx = {
    say: (text, by) => say(text, speakerFor(by)),
    goto: (id, arrival) => enterScene(id, arrival),
    wait: (seconds) => wait(seconds),
    end: (text) => showEnd(text),
    changed: () => renderInventory(),
    dialogue: (id) => runDialogue(id),
    walk: (point, by) => walkTo(by, point),
    sound: (id) => { if (!skipping) audio.sound(id); },
    music: (id) => audio.music(id),
    cutscene: (id) => runCutscene(id),
  };

  /* ---------- Seqüències ---------- */

  // Mentre dura una seqüència, els verbs i l'inventari no es veuen i el jugador no pot fer res (un clic salta la frase)
  async function runCutscene(id) {
    const c = adventure.cutscenes.find((x) => x.id === id);
    if (!c) return;
    game.seen.add(id);
    cutsceneDepth++;
    ui.classList.add("cutscene");
    try {
      await runActions(adventure, game, c.actions, fx);
    } finally {
      cutsceneDepth--;
      if (!cutsceneDepth) {
        skipping = false;
        ui.classList.remove("cutscene");
      }
    }
  }

  // Esc: el que queda de la seqüència es fa a l'instant
  function skipCutscene() {
    if (!cutsceneDepth || skipping) return;
    skipping = true;
    for (const m of [actor, ...npcs]) finishWalk(m);
    clearSpeech();
    waitSkip?.();
  }

  // Un personatge (o el protagonista, amb «by» buit) camina fins a un punt; la promesa es compleix quan hi arriba
  function walkTo(by, point) {
    const who = !by || by === adventure.playerId ? actor : npcs.find((n) => n.ch.id === by);
    if (!who || !mesh) return;
    const target = mesh.isEmpty ? point : mesh.nearestPoint(point);
    const path = mesh.isEmpty ? null : mesh.findPath([who.x, who.y], target);
    if (skipping || !path) {
      Object.assign(who, { x: target[0], y: target[1], path: [] });
      return;
    }
    who.path = path.slice(1);
    return new Promise((resolve) => { who.onArrive = resolve; });
  }

  function finishWalk(m) {
    if (!m.path.length) return;
    const [x, y] = m.path.at(-1);
    Object.assign(m, { x, y, path: [] });
  }

  let waitSkip = null;
  function wait(seconds) {
    if (skipping) return;
    return new Promise((resolve) => {
      const t = setTimeout(done, seconds * 1000);
      function done() { clearTimeout(t); waitSkip = null; resolve(); }
      waitSkip = done;
    });
  }

  /* ---------- Diàlegs ---------- */

  // Mentre hi ha una conversa, les opcions ocupen el lloc dels verbs i l'inventari
  function showOptions(on) {
    optionsBox.hidden = !on;
    verbBox.hidden = on;
    inventoryBox.hidden = on;
    sentence.style.visibility = on ? "hidden" : "";
    layout();
  }

  // Mostra les opcions i espera que el jugador en triï una
  function chooseOption(options) {
    return new Promise((resolve) => {
      optionsBox.replaceChildren();
      for (const o of options) {
        const b = document.createElement("button");
        b.type = "button";
        b.role = "listitem";
        b.textContent = o.text;
        b.onclick = () => {
          optionsBox.replaceChildren();
          resolve(o);
        };
        optionsBox.append(b);
      }
      showOptions(true);
    });
  }

  // Una conversa: el node diu les seves frases, el jugador tria una opció, el protagonista la diu,
  // es fan les seves accions i es passa al node on porta. S'acaba quan no hi ha cap opció o una porta a «fi».
  async function runDialogue(id) {
    const d = adventure.dialogues.find((x) => x.id === id);
    let node = d && startNode(d);
    try {
      while (node && !game.ended && !destroyed) {
        for (const line of node.lines) {
          if (game.ended) return;
          await say(line.text, speakerFor(line.by));
        }
        const options = availableOptions(d, node, game);
        if (!options.length) break;
        const option = await chooseOption(options);
        showOptions(false);
        markSaid(game, d, option);
        onStateChange?.();
        await say(option.text, actor);
        await runActions(adventure, game, option.actions, fx);
        node = option.next ? d.nodes.find((n) => n.id === option.next) : null;
      }
    } finally {
      showOptions(false);
      renderInventory();
    }
  }

  async function script(actions) {
    scriptDepth++;
    scripting = true;
    setCursor("wait");
    try {
      await runActions(adventure, game, actions, fx);
    } finally {
      scriptDepth--;
      scripting = scriptDepth > 0;
      if (!scripting) setCursor("normal");
      updateSentence();
    }
  }

  // El que passa quan el personatge arriba: la primera regla que encaixa o, si no n'hi ha cap, el comportament per defecte
  function execute({ verb: v, target, with: w }) {
    if (!v) {
      if (target?.exit) useExit(target.exit);
      return;
    }
    const rule = findRule(adventure, game, v.id, refOf(target), w ? refOf(w) : null);
    if (rule) return script(rule.actions);
    if (v.id === LOOK && !w) return say(target.description || v.response);
    // Els objectes que es poden agafar s'agafen sense haver d'escriure cap regla
    if (v.id === PICKUP && !w && target.kind === "object") {
      if (game.inventory.includes(target.id)) return say("Ja ho tinc.");
      if (target.object.pickable) {
        applyStateAction(adventure, game, { type: "take", objectId: target.id });
        renderInventory();
        return;
      }
    }
    // «Parla amb» un personatge que té un diàleg el comença
    if (v.id === "talk" && !w && target.kind === "character") {
      const dialogue = dialogueFor(adventure, target.id);
      if (dialogue) return script([{ type: "dialogue", dialogueId: dialogue.id }]);
    }
    if (v.response) say(v.response);
  }

  function face(target) {
    actor.dir = "side";
    if (target.facing === "left") actor.facing = -1;
    else if (target.facing === "right") actor.facing = 1;
    else if (Math.abs(target.anchor[0] - actor.x) > 1) actor.facing = target.anchor[0] > actor.x ? 1 : -1;
    // Un personatge es gira cap al protagonista quan s'hi parla
    if (target.npc) {
      target.npc.dir = "side";
      target.npc.facing = actor.x > target.npc.x ? 1 : -1;
    }
  }

  // Camina fins a la cosa de l'escenari que hi intervé (si n'hi ha) i llavors executa l'acció
  function go(action, point) {
    const place = [action.with, action.target].find((t) => t?.inScene);
    if (!action.target) {
      // Clic al buit: només caminar
      const path = mesh.isEmpty ? null : mesh.findPath([actor.x, actor.y], point);
      if (path) { actor.path = path.slice(1); actor.onArrive = null; }
      else say(mesh.isEmpty ? "Aquí no hi ha on caminar." : "No hi puc arribar.");
      pending = null;
      resetVerb();
      return;
    }
    if (!place || mesh.isEmpty) {
      resetVerb();
      execute(action);
      return;
    }
    const path = mesh.findPath([actor.x, actor.y], place.walkTo);
    if (!path) {
      // Mirar es pot fer de lluny; la resta cal fer-ho de prop
      resetVerb();
      if (action.verb?.id === LOOK) execute(action);
      else say("No hi puc arribar.");
      return;
    }
    actor.path = path.slice(1);
    pending = action;
    verb = null;
    first = null;
    renderVerbs();
    renderInventory();
    updateSentence();
    actor.onArrive = () => {
      if (pending !== action) return;
      pending = null;
      face(place);
      updateSentence();
      execute(action);
    };
  }

  // El jugador ha clicat una cosa (o el buit, amb target null) amb el verb triat
  function choose(target, point) {
    if (busy) return;
    if (scripting) { clearSpeech(); return; }
    clearSpeech();
    // «Fes servir» o «Dóna» amb un objecte de l'inventari: falta el segon
    if (verb?.preposition && !first && target?.kind === "object" && !target.inScene) {
      first = target;
      renderInventory();
      updateSentence();
      return;
    }
    if (first) {
      if (!target || target.id === first.id) { resetVerb(); return; }
      const action = { verb, target: first, with: target };
      go(action, point);
      return;
    }
    go({ verb, target, with: null }, point);
  }

  function look(target) {
    if (busy) return;
    if (scripting) { clearSpeech(); return; }
    if (!lookVerb) return;
    clearSpeech();
    const keep = verb;
    go({ verb: lookVerb, target, with: null });
    verb = keep;
    renderVerbs();
    updateSentence();
  }

  // Doble clic en una sortida: s'hi passa de seguida, sense esperar que el protagonista hi arribi caminant
  let lastClick = { t: 0, id: null };
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || menuOpen) return;
    const p = toImage(e);
    const target = targetAt(p);
    const now = performance.now();
    const double = target?.exit && target.id === lastClick.id && now - lastClick.t < 400;
    lastClick = { t: now, id: target?.id ?? null };
    if (double && !verb && !first && !busy && !scripting) {
      Object.assign(actor, { path: [], onArrive: null });
      pending = null;
      updateSentence();
      useExit(target.exit);
      return;
    }
    choose(target, p);
  });

  // El clic dret mira la cosa, sense canviar el verb triat
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const target = targetAt(toImage(e));
    if (target) look(target);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (busy) return;
    const t = targetAt(toImage(e));
    if (t?.id !== hover?.id) {
      hover = t;
      updateSentence();
    }
    setCursor(scripting ? "wait" : t ? "hover" : "normal");
  });
  canvas.addEventListener("pointerleave", () => { hover = null; updateSentence(); });

  /* ---------- Frases i final ---------- */

  function clearSpeech() {
    if (!speech) return;
    speech.el.remove();
    const done = speech.done;
    speech = null;
    done?.();
  }

  // Qui diu una frase d'una regla: el protagonista (by buit), un personatge de l'escenari,
  // o una veu de fora si el personatge no hi és (surt a dalt de tot, amb el seu color)
  function speakerFor(by) {
    if (!by || by === adventure.playerId) return actor;
    return npcs.find((n) => n.ch.id === by) ?? { ch: cast.get(by) ?? null, offstage: true };
  }

  // Retorna una promesa que es compleix quan la frase desapareix (per temps, per un clic o per una altra frase)
  function say(text, speaker = actor) {
    clearSpeech();
    if (skipping) return Promise.resolve();
    const el = document.createElement("div");
    el.className = "speech";
    el.textContent = text;
    el.style.color = speaker.ch?.color ?? "#fff";
    overlay.append(el);
    const s = { el, until: performance.now() + 1500 + text.length * 60, done: null, speaker };
    speech = s;
    placeSpeech();
    return new Promise((resolve) => { s.done = resolve; });
  }

  // La frase va damunt del cap de qui parla, sense sortir de la pantalla
  function placeSpeech() {
    if (!speech) return;
    const el = speech.el, who = speech.speaker;
    const [x, top] = who.offstage ? [W / 2, 0] : [who.x, who.y - heightFor(who.ch, who.y) - 4];
    const headY = top * scale;
    const left = clamp(x * scale - el.offsetWidth / 2, 4, W * scale - el.offsetWidth - 4);
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(el.offsetHeight + 4, headY)}px`;
  }

  function showEnd(text) {
    busy = true;
    clearSpeech();
    endScreen.querySelector("p").textContent = text;
    endScreen.querySelector(".credits").textContent = adventure.credits ?? "";
    endScreen.hidden = false;
  }
  endScreen.querySelector("button").onclick = () => (title ? showTitle() : restart());

  /* ---------- Pantalla de títol ---------- */

  // Surt abans de començar; el clic de «Comença» també és el que deixa sonar la música
  function showTitle() {
    const t = adventure.titleScreen ?? {};
    endScreen.hidden = true;
    blackNow(true);
    titleScreen.style.backgroundImage = t.image ? `url("${imageUrl(t.image)}")` : "";
    titleScreen.querySelector("strong").textContent = adventure.title;
    titleScreen.querySelector("span").textContent = t.subtitle ?? "";
    titleScreen.querySelector("[data-act=load]").hidden = !saves.any();
    titleScreen.hidden = false;
    busy = true;
    audio.stop();
    if (t.music) audio.music(t.music);
  }
  titleScreen.querySelector("[data-act=start]").onclick = () => {
    titleScreen.hidden = true;
    audio.unlock();
    restart(setup);
  };
  titleScreen.querySelector("[data-act=load]").onclick = () => openMenu();

  /* ---------- Partides desades ---------- */

  // Només es pot desar quan no passa res: ni seqüències, ni converses, ni transicions, ni el títol o el final
  const canSave = () => !!scene && !busy && !scripting && optionsBox.hidden && endScreen.hidden && titleScreen.hidden;
  const formatDate = (iso) => new Date(iso).toLocaleString("ca", { dateStyle: "short", timeStyle: "short" });

  function openMenu() {
    menuOpen = true;
    menu.querySelector(".player-menu-msg").textContent = canSave() ? "" : "Ara no es pot desar: espera que acabi el que està passant.";
    renderMenu();
    menu.hidden = false;
    menu.querySelector("button").focus();
  }

  function closeMenu() {
    menuOpen = false;
    menu.hidden = true;
  }

  function renderMenu() {
    const list = menu.querySelector("ol");
    list.replaceChildren();
    saves.list().forEach((slot, i) => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = slot ? `${slot.sceneName} · ${formatDate(slot.savedAt)}` : "Buida";
      li.append(label);
      const button = (text, act, disabled) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.disabled = disabled;
        b.onclick = act;
        li.append(b);
      };
      button("Desa", () => {
        const ok = saves.save(i, snapshot());
        menu.querySelector(".player-menu-msg").textContent = ok ? `Desat a la ranura ${i + 1}.` : "Aquest navegador no deixa desar partides.";
        renderMenu();
      }, !canSave());
      button("Carrega", () => loadGame(slot), !slot);
      button("Esborra", () => { saves.remove(i); renderMenu(); }, !slot);
      list.append(li);
    });
  }

  function snapshot() {
    return {
      version: 1,
      sceneId: scene.id,
      sceneName: scene.name,
      position: [Math.round(actor.x), Math.round(actor.y)],
      facing: actor.facing,
      dir: actor.dir,
      musicId: audio.musicId,
      game: serializeGame(game),
    };
  }

  async function loadGame(data) {
    closeMenu();
    game = restoreGame(adventure, data.game ?? {});
    endScreen.hidden = true;
    titleScreen.hidden = true;
    scripting = false;
    scriptDepth = 0;
    cutsceneDepth = 0;
    skipping = false;
    ui.classList.remove("cutscene");
    showOptions(false);
    audio.unlock();
    const sceneId = adventure.scenes.some((x) => x.id === data.sceneId) ? data.sceneId : startSceneId;
    await enterScene(sceneId, data.position, { quiet: true });
    actor.facing = data.facing ?? 1;
    actor.dir = data.dir ?? "side";
    // La música que sonava en desar (l'escenari pot no tenir-ne i heretar la d'un altre)
    if (data.musicId) audio.music(data.musicId);
    renderInventory();
  }

  ui.querySelector(".player-menu-button").onclick = () => (menuOpen ? closeMenu() : openMenu());
  // Amagar els verbs i l'inventari (en mode compact tapen una mica l'escenari)
  const hideButton = ui.querySelector(".player-hide-button");
  hideButton.onclick = () => hideButton.setAttribute("aria-pressed", String(container.classList.toggle("ui-hidden")));
  // Pantalla completa: amb l'API del navegador si n'hi ha (i girant el mòbil de costat), i si no (iPhone), ocupant
  // tota la pàgina
  ui.querySelector(".player-full-button").onclick = async () => {
    const on = !container.classList.contains("player-fullpage");
    container.classList.toggle("player-fullpage", on);
    try {
      if (on && !document.fullscreenElement) { await container.requestFullscreen?.(); await window.screen.orientation?.lock?.("landscape"); }
      else if (!on && document.fullscreenElement) await document.exitFullscreen();
    } catch { /* el navegador no ho permet: es queda a tota la pàgina */ }
  };
  const onFullscreen = () => { if (!document.fullscreenElement) container.classList.remove("player-fullpage"); };
  document.addEventListener("fullscreenchange", onFullscreen);
  menu.querySelector("[data-act=close]").onclick = closeMenu;
  // Qualsevol clic al joc torna a provar la música si el navegador l'havia aturat
  container.addEventListener("pointerdown", () => audio.unlock());

  function onKey(e) {
    if (e.key === "Escape") {
      if (menuOpen) closeMenu();
      else skipCutscene();
      return;
    }
    // Les dreceres dels verbs (i els números 1-9, per posició): tornar a prémer el mateix el desfà
    if (e.key.length !== 1 || e.target.closest?.("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const v = verbForKey(e.key.toLowerCase());
    if (!v || busy || scripting || menuOpen || !optionsBox.hidden) return;
    e.preventDefault();
    pickVerb(v);
  }
  window.addEventListener("keydown", onKey);

  /* ---------- Bucle ---------- */

  // Mou un personatge (o el protagonista) pel seu camí i avisa quan arriba
  function move(m, dt) {
    if (m.path.length) {
      const [tx, ty] = m.path[0];
      const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
      const stepLen = heightAt(m.y) * WALK_SPEED * dt;
      if (Math.abs(dx) > 0.5) m.facing = dx > 0 ? 1 : -1;
      // De costat, de cara o d'esquena segons cap on va més. A l'últim tros (gairebé zero) no es toca,
      // perquè quedi mirant cap on caminava i no es giri de costat en arribar.
      if (d > 0.5) m.dir = Math.abs(dy) > Math.abs(dx) * 1.2 ? (dy > 0 ? "down" : "up") : "side";
      if (stepLen >= d) {
        m.x = tx;
        m.y = ty;
        m.path.shift();
      } else {
        m.x += (dx / d) * stepLen;
        m.y += (dy / d) * stepLen;
      }
      // Una passa cada mitja alçada de personatge, més o menys
      m.step += (Math.min(stepLen, d) / heightAt(m.y)) * 9;
    } else {
      m.step = 0;
    }
    m.time += dt;
    if (!m.path.length && m.onArrive) {
      const f = m.onArrive;
      m.onArrive = null;
      f();
    }
  }

  function update(dt) {
    for (const m of [actor, ...npcs]) move(m, dt);
    if (speech && performance.now() > speech.until) clearSpeech();
  }

  // Tot el que es dibuixa sobre el fons, en ordre: objectes, personatges i el protagonista.
  // Els personatges van entre els objectes «automàtics» segons on tenen els peus.
  function drawables() {
    const items = [
      ...sceneObjects().map((o) => ({ kind: "object", item: o, layer: LAYER_ORDER[o.p.layer], y: o.p.position[1] })),
      ...npcs.map((n) => ({ kind: "npc", item: n, layer: LAYER_ORDER.auto, y: n.y })),
      { kind: "player", item: actor, layer: LAYER_ORDER.auto, y: actor.y },
    ];
    return items.sort((a, b) => a.layer - b.layer || a.y - b.y);
  }

  function strokePolygon(poly, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
  }

  function drawDebug(objects) {
    ctx.lineWidth = Math.max(1, W / 640);
    for (const p of mesh.polygons) strokePolygon(p, "#4ade80");
    for (const h of scene.hotspots) strokePolygon(h.polygon, h.exit ? "#60a5fa" : "#f5b942");
    ctx.strokeStyle = "#e879f9";
    for (const o of objects) ctx.strokeRect(o.rect.x + 0.5, o.rect.y + 0.5, o.rect.w - 1, o.rect.h - 1);
    ctx.strokeStyle = "#38bdf8";
    for (const n of npcs) {
      const r = characterRect(n.ch, sheetOf(n.ch), n.x, n.y, heightFor(n.ch, n.y));
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    }
    ctx.fillStyle = "#fff";
    for (const [x, y] of mesh.nodes) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    if (actor.path.length) {
      ctx.strokeStyle = "#fff";
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(actor.x, actor.y);
      for (const [x, y] of actor.path) ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function draw() {
    ctx.imageSmoothingEnabled = false;
    if (img) ctx.drawImage(img, 0, 0);
    else {
      ctx.fillStyle = "#14121f";
      ctx.fillRect(0, 0, W, H);
    }
    if (!scene) return;
    for (const d of drawables()) {
      if (d.kind === "object") ctx.drawImage(d.item.sprite, d.item.rect.x, d.item.rect.y);
      else drawCharacter(ctx, d.item.ch, sheetOf(d.item.ch), poseOf(d.item));
    }
    if (debug) drawDebug(sceneObjects());
  }

  function loop(t) {
    if (destroyed) return;
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    update(dt);
    draw();
    placeSpeech();
    frame = requestAnimationFrame(loop);
  }

  /* ---------- Mode de proves ---------- */

  // On era cada objecte al principi, per tornar-lo al seu lloc si el mode de proves el treu de l'inventari
  const homeScene = new Map(adventure.scenes.flatMap((s) => s.objects.map((p) => [p.objectId, s.id])));

  function setHas(id, on) {
    if (!library.has(id)) return;
    if (on) applyStateAction(adventure, game, { type: "take", objectId: id });
    else {
      game.inventory = game.inventory.filter((x) => x !== id);
      if (homeScene.has(id)) game.location.set(id, homeScene.get(id));
      else game.location.delete(id);
    }
  }

  // Una situació de prova: { sceneId, inventory: [ids], states: {obj: estat}, vars: {var: valor}, said: ["diàleg:opció"] }
  function applySetup(st) {
    if (!st) return;
    for (const id of st.inventory ?? []) setHas(id, true);
    for (const [id, state] of Object.entries(st.states ?? {})) {
      if (library.get(id)?.states.some((x) => x.id === state)) game.states.set(id, state);
    }
    for (const [id, value] of Object.entries(st.vars ?? {})) if (game.vars.has(id)) game.vars.set(id, value);
    for (const key of st.said ?? []) game.said.add(key);
  }

  async function restart(st = null) {
    game = createGameState(adventure);
    applySetup(st);
    endScreen.hidden = true;
    titleScreen.hidden = true;
    scripting = false;
    scriptDepth = 0;
    cutsceneDepth = 0;
    skipping = false;
    ui.classList.remove("cutscene");
    showOptions(false);
    const sceneId = st?.sceneId && adventure.scenes.some((x) => x.id === st.sceneId) ? st.sceneId : startSceneId;
    await enterScene(sceneId);
    // La seqüència d'inici, només quan es comença de veritat: ni en una situació de prova ni provant un altre escenari
    const realStart = adventure.startSceneId ?? adventure.scenes[0]?.id;
    if (!st && adventure.introCutsceneId && sceneId === startSceneId && sceneId === realStart) {
      await script([{ type: "cutscene", cutsceneId: adventure.introCutsceneId }]);
    }
  }

  fader.style.opacity = "1";
  frame = requestAnimationFrame(loop);
  if (title) showTitle();
  else restart(setup);

  return {
    restart: (st) => (title && !st ? showTitle() : restart(st)),
    setDebug(on) { debug = on; },
    setMuted: (on) => audio.setMuted(on),
    // Per al panell de proves: llegir la partida i canviar-la en directe
    debug: {
      get game() { return game; },
      sceneId: () => scene?.id ?? null,
      goto: (id) => enterScene(id),
      setHas(id, on) { setHas(id, on); renderInventory(); },
      setState(id, state) { game.states.set(id, state); renderInventory(); },
      setVar(id, value) { game.vars.set(id, value); renderInventory(); },
      forgetSaid() { game.said.clear(); renderInventory(); },
      snapshot: () => ({
        sceneId: scene?.id ?? null,
        inventory: [...game.inventory],
        states: Object.fromEntries(game.states),
        vars: Object.fromEntries(game.vars),
        said: [...game.said],
      }),
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      document.removeEventListener("fullscreenchange", onFullscreen);
      clearSpeech();
      audio.stop();
      window.removeEventListener("keydown", onKey);
    },
  };
}

return { createPlayer };
})();

globalThis.AventuraPlayer = modules["player/player.js"];
})();

const { createPlayer } = window.AventuraPlayer;
const adventure = window.ADVENTURE;
const player = createPlayer(document.querySelector(".play-stage"), adventure, {
  imageUrl: (file) => "files/" + encodeURIComponent(file),
  startSceneId: adventure.startSceneId ?? adventure.scenes[0]?.id,
  title: true,
});
// Maj+M silencia el so (les lletres soles són les dreceres dels verbs)
let muted = false;
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m" && e.shiftKey && !e.metaKey && !e.ctrlKey) player.setMuted((muted = !muted));
});
