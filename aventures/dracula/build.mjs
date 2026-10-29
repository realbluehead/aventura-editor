// «Dràcula»: una aventura gràfica fosca en 50 escenaris, a partir de la novel·la de Bram Stoker (1897).
// Feta amb el skill aventura-grafica. Executa: node build.mjs   (escriu joc.zip i el comprova)
// Els decorats es dibuixen per codi en perspectiva (decorats/, el motor del Barret Desaparegut); els personatges i
// la música són a estil.mjs; els objectes, a objectes.mjs; cada acte, a acte1.mjs … acte4.mjs.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const K = await import(new URL("../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const E = await import(new URL("./estil.mjs", import.meta.url));
const O = await import(new URL("./objectes.mjs", import.meta.url));
const T = await import(new URL("./decorats/textura.mjs", import.meta.url));
const { DECORATS } = await import(new URL("./decorats/index.mjs", import.meta.url));
const { lightFrames } = await import(new URL("./decorats/llums.mjs", import.meta.url));
const { crop } = await import(new URL("./decorats/comu.mjs", import.meta.url));
const HERE = dirname(fileURLToPath(import.meta.url));

const P = new K.Project({
  title: "Dràcula",
  description: "Una aventura gràfica fosca a partir de la novel·la de Bram Stoker. En Jonathan Harker viatja a Transilvània per vendre una casa a un comte que no surt als miralls... i haurà de perseguir-lo fins a Londres i tornar.",
});

/* ---------- Música i sons ---------- */
for (const [id, name] of [["dracula", "Tema del comte"], ["transilvania", "Transilvània"], ["whitby", "Whitby"], ["londres", "Londres"], ["persecucio", "La persecució"], ["final", "Rèquiem"]]) {
  P.sound(`so-${id}`, name, E.MUSICA[id]());
}
P.sound("so-udol", "Udol de llop", E.MUSICA.udol());
P.sound("so-campana", "Campana", E.MUSICA.campana());
P.sound("so-ensurt", "Ensurt", E.MUSICA.ensurt());
P.sound("so-descobert", "Descobriment", E.MUSICA.descobert());
P.sound("so-clic", "Clic", K.SFX.click());
P.sound("so-aigua", "Aigua i vent", K.SFX.water());

/* ---------- Personatges ---------- */
// Els que surten a diversos escenaris tenen una entrada per escenari (mateix nom i aspecte, id diferent)
const COLORS = {
  jonathan: "#e6e0cf", dracula: "#ff4a4a", mina: "#a8d8b0", lucy: "#f0d0e0", vanHelsing: "#e8c47a", arthur: "#9fc4ff",
  quincey: "#e0a070", seward: "#b8c8e0", renfield: "#c8c870", germana: "#ffb0c8",
};
const DESC = {
  dracula: "Un vell alt, de bigoti blanc i ungles llargues. Els ulls li brillen com brases.",
  mina: "La Mina, la meva promesa. És més valenta que tots nosaltres junts.",
  vanHelsing: "El professor Abraham Van Helsing, d'Amsterdam. Metge, filòsof... i caçador de coses que no haurien d'existir.",
  arthur: "L'Arthur Holmwood, el promès de la Lucy. Un cavaller, amb tot el que això vol dir.",
  quincey: "El Quincey Morris, de Texas. Porta un ganivet de caçador i somriu com si res li fes por.",
  seward: "El doctor John Seward, director de l'asil. Té ulleres de no dormir.",
};
function pj(id, base, name, description, color) {
  return P.character({ id, name, description: description ?? DESC[base] ?? "", color: color ?? COLORS[base] ?? "#d8d8e0", look: E.LOOKS[base] });
}
pj("c-jonathan", "jonathan", "Jonathan", "Sóc en Jonathan Harker, passant d'advocat d'Exeter. Fins fa poc, la cosa més perillosa que havia fet era una escriptura de compravenda.");
// Veus fora d'escena (diuen coses des de fora o des d'un objecte)
pj("c-comte", "dracula", "el comte Dràcula");
pj("c-veu-germanes", "germana", "les germanes", "", COLORS.germana);
pj("c-veu-lucy", "lucy", "Lucy", "", COLORS.lucy);

/* ---------- Mida dels objectes ---------- */
// Els fons fan 640×480 amb píxels de 2×2, i els personatges hi fan uns 130 px (píxels de 4×4). Els objectes es
// dibuixen petits i aquí s'amplien: els normals ×2 (com el fons), els que porten figures humanes ×3 o ×4.
// Un estat pot ser una llista d'imatges (animació) amb els fotogrames per segon al final.
const ESCALA = { "o-calessa": 4, "o-skinsky": 4, "o-comte-caixa": 3, "o-capita": 3, "o-lucy-wh": 3, "o-lucy-hill": 3, "o-taut": 3,
  "o-carreta": 3, "o-tombes-germanes": 3, "o-cofre": 3, "o-caixes-castell": 3, "o-caixes-carfax": 3, "o-caixes-picc": 3, "o-caixes-me": 3, "o-foc": 3 };
const figures = new Set();
const object = P.object.bind(P);
P.object = (o) => {
  const f = figures.has(o.id) ? 4 : ESCALA[o.id] ?? 2;
  const first = o.states.find(([, , img]) => img)?.[2];
  // La icona de l'inventari es fa de la imatge petita, abans d'ampliar-la
  const icon = o.icon ?? (o.pickable && first ? K.icon(first) : null);
  const zoom = (img) => (Array.isArray(img) ? img.map((i) => K.zoomed(i, f)) : img ? K.zoomed(img, f) : null);
  return object({ ...o, icon, states: o.states.map(([id, name, img, ...rest]) => [id, name, zoom(img), ...rest]) });
};

/* ---------- Ajudes per als escenaris ---------- */
// Cada decorat (decorats/) es dibuixa a 320×240 i porta la zona caminable, l'alçada dels actors, el polígon de cada
// punt calent (per id) i on va cada personatge o objecte. El joc es col·loca en coordenades de 320×200 (vegeu més
// avall), així que aquí les y es divideixen per 1,2; el fons s'amplia ×2 fins a 640×480.
const H = { near: 54, far: 44 };
const DEC = {};
const g = ([x, y]) => [x, y / 1.2];
function escena(key, name, description, { draw, ...rest }) {
  const sc = (DEC[key] = T.render(DECORATS[key], T.DRACULA));
  const hotspots = (rest.hotspots ?? []).map((h) => (sc.spots[h.id] ? { ...h, polygon: sc.spots[h.id].map(g) } : h));
  const characters = (rest.characters ?? []).map((n) => (sc.pts[n.characterId] ? { ...n, position: g(sc.pts[n.characterId]) } : n));
  const objects = (rest.objects ?? []).map((o) => (sc.pts[o.objectId] ? { ...o, position: g(sc.pts[o.objectId]) } : o));
  return P.scene({ id: `s-${key}`, name, description, background: K.zoomed(sc.bg, 2), ...rest, hotspots, characters, objects,
    walkable: sc.walk.map((poly) => poly.map(g)), actorHeight: { near: sc.ah.near / 1.2, far: sc.ah.far / 1.2 } });
}
// Un objecte que és una figura (el comte, la Lucy...), amb estats visible / amagat
function aparicio(id, name, description, img, { visible = true } = {}) {
  figures.add(id);
  return P.object({ id, name, description, states: visible ? [["present", "Present", img], ["amagat", "Amagat", null]] : [["amagat", "Amagat", null], ["present", "Present", img]] });
}

const ctx = { P, K, E, O, pj, escena, aparicio, H };
for (const acte of ["acte1", "acte2", "acte3", "acte4"]) (await import(new URL(`./${acte}.mjs`, import.meta.url))).default(ctx);

/* ---------- Llums animades i encaix ---------- */
// Les flames de les torxes, espelmes i llars de foc, i les finestres llunyanes que fan pampallugues: un objecte
// decoratiu animat per escenari (llums.mjs), darrere dels personatges
for (const [key, sc] of Object.entries(DEC)) {
  const fr = lightFrames(sc);
  if (!fr) continue;
  const { imgs, pos } = crop(fr), id = `o-llums-${key}`;
  P.object({ id, name: "llums", description: "", decor: true, states: [["anim", "Animació", imgs, 7]] });
  P.scenes.find((s) => s.id === `s-${key}`).objects.push(K.place(id, g(pos), null, { layer: "back" }));
}
// Els decorats nous tenen el terra on toca: els personatges, els punts per acostar-s'hi i les arribades de les
// sortides que hi queden fora es porten al punt de terra més proper
const inside = (poly, [x, y]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
function onFloor(scene, p) {
  if (!p || scene.walkable.some((w) => inside(w, p))) return p;
  let best = null, bd = Infinity;
  for (const w of scene.walkable) for (let i = 0; i < w.length; i++) {
    const [a, b] = [w[i], w[(i + 1) % w.length]], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const q = [a[0] + dx * t, a[1] + dy * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) { bd = d; best = q; }
  }
  // una mica cap endins, perquè no quedi just a la vora
  const cx = scene.walkable[0].reduce((s, q) => s + q[0], 0) / scene.walkable[0].length, cy = scene.walkable[0].reduce((s, q) => s + q[1], 0) / scene.walkable[0].length;
  for (let k = 0.04; k < 1; k += 0.04) { const q = [best[0] + (cx - best[0]) * k, best[1] + (cy - best[1]) * k]; if (scene.walkable.some((w) => inside(w, q))) return q; }
  return best;
}
const byId = Object.fromEntries(P.scenes.map((s) => [s.id, s]));
for (const s of P.scenes) {
  for (const n of s.characters) { n.position = onFloor(s, n.position); n.walkTo = onFloor(s, n.walkTo); }
  for (const o of s.objects) o.walkTo = onFloor(s, o.walkTo);
  for (const h of s.hotspots) if (h.exit?.arrival) h.exit.arrival = onFloor(byId[h.exit.sceneId], h.exit.arrival);
}

/* ---------- De 320×200 a 640×480 ---------- */
// Tot el joc s'ha col·locat en coordenades de 320×200; aquí es passen a les dels fons (x×2, y×2,4)
const pt = (p) => (p ? [Math.round(Math.min(E.W, p[0] * E.SX)), Math.round(Math.min(E.H, p[1] * E.SY))] : p);
for (const s of P.scenes) {
  s.walkable = s.walkable.map((poly) => poly.map(pt));
  for (const h of s.hotspots) { h.polygon = h.polygon.map(pt); if (h.exit) h.exit.arrival = pt(h.exit.arrival); }
  for (const p of [...s.objects, ...s.characters]) { p.position = pt(p.position); p.walkTo = pt(p.walkTo); }
  s.actorHeight = s.actorHeight && { near: Math.round(s.actorHeight.near * E.SY), far: Math.round(s.actorHeight.far * E.SY) };
}
const actions = [...P.cutscenes.flatMap((c) => c.actions), ...P.rules.flatMap((r) => r.actions), ...P.dialogues.flatMap((d) => d.nodes.flatMap((n) => n.options.flatMap((o) => o.actions)))];
for (const a of actions) { if (a.type === "walk") a.point = pt(a.point); if (a.type === "goto") a.arrival = pt(a.arrival); }

/* ---------- Títol i escriure ---------- */
const titol = K.zoomed(T.render(DECORATS.borgo, T.DRACULA).bg, 2);
titol.rect(112, 32, 416, 116, [7, 6, 11, 210]);
titol.text(320 - K.Canvas.textWidth("DRACULA", 12) / 2 + 4, 48, "DRACULA", "#3a0a10", 12);
titol.text(320 - K.Canvas.textWidth("DRACULA", 12) / 2, 44, "DRACULA", "#cc2a2a", 12);
titol.text(320 - K.Canvas.textWidth("BRAM STOKER", 2) / 2, 120, "BRAM STOKER", "#8f97a8", 2);

await P.write(join(HERE, "joc.zip"), {
  startSceneId: "s-hotel", playerId: "c-jonathan", introCutsceneId: "cs-intro",
  titleScreen: { image: titol, subtitle: "Una aventura gràfica a partir de la novel·la de Bram Stoker", music: "so-dracula" },
  credits: "Adaptació lliure de «Dracula», de Bram Stoker (1897).\nFet amb el skill aventura-grafica de l'editor d'aventures.",
});
