// «Dràcula»: una aventura gràfica fosca en 50 escenaris, a partir de la novel·la de Bram Stoker (1897).
// Feta amb el skill aventura-grafica. Executa: node build.mjs   (escriu joc.zip i el comprova)
// L'estètica és a estil.mjs; els objectes, a objectes.mjs; cada acte, a acte1.mjs … acte4.mjs.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
const K = await import(new URL("../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const E = await import(new URL("./estil.mjs", import.meta.url));
const O = await import(new URL("./objectes.mjs", import.meta.url));
const HERE = dirname(fileURLToPath(import.meta.url));
const OPTS = JSON.parse(readFileSync(join(HERE, "opcions.json"), "utf8"));

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
const ESCALA = { "o-calessa": 4, "o-skinsky": 4, "o-comte-caixa": 3, "o-capita": 3, "o-lucy-wh": 3, "o-lucy-hill": 3, "o-taut": 3,
  "o-carreta": 3, "o-tombes-germanes": 3, "o-cofre": 3, "o-caixes-castell": 3, "o-caixes-carfax": 3, "o-caixes-picc": 3, "o-caixes-me": 3, "o-foc": 3 };
const figures = new Set();
const object = P.object.bind(P);
P.object = (o) => {
  const f = figures.has(o.id) ? 4 : ESCALA[o.id] ?? 2;
  const first = o.states.find(([, , img]) => img)?.[2];
  // La icona de l'inventari es fa de la imatge petita, abans d'ampliar-la
  const icon = o.icon ?? (o.pickable && first ? K.icon(first) : null);
  return object({ ...o, icon, states: o.states.map(([id, name, img]) => [id, name, img ? K.zoomed(img, f) : null]) });
};

/* ---------- Ajudes per als escenaris ---------- */
const H = { near: 54, far: 44 };
function escena(key, name, description, { draw, ...rest }) {
  const bg = E.fons(join(HERE, "imatges", `${key}.jpg`), OPTS[key] ?? {});
  if (draw) draw(bg);
  P.attribute(join(HERE, "imatges", `${key}.jpg`));
  return P.scene({ id: `s-${key}`, name, description, background: bg, actorHeight: H, ...rest });
}
// Un objecte que és una figura (el comte, la Lucy...), amb estats visible / amagat
function aparicio(id, name, description, img, { visible = true } = {}) {
  figures.add(id);
  return P.object({ id, name, description, states: visible ? [["present", "Present", img], ["amagat", "Amagat", null]] : [["amagat", "Amagat", null], ["present", "Present", img]] });
}

const ctx = { P, K, E, O, pj, escena, aparicio, H };
for (const acte of ["acte1", "acte2", "acte3", "acte4"]) (await import(new URL(`./${acte}.mjs`, import.meta.url))).default(ctx);

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
const titol = E.fons(join(HERE, "imatges", "borgo.jpg"), OPTS.borgo ?? {});
titol.rect(112, 32, 416, 116, [7, 6, 11, 210]);
titol.text(320 - K.Canvas.textWidth("DRACULA", 12) / 2 + 4, 48, "DRACULA", "#3a0a10", 12);
titol.text(320 - K.Canvas.textWidth("DRACULA", 12) / 2, 44, "DRACULA", "#cc2a2a", 12);
titol.text(320 - K.Canvas.textWidth("BRAM STOKER", 2) / 2, 120, "BRAM STOKER", "#8f97a8", 2);

await P.write(join(HERE, "joc.zip"), {
  startSceneId: "s-hotel", playerId: "c-jonathan", introCutsceneId: "cs-intro",
  titleScreen: { image: titol, subtitle: "Una aventura gràfica a partir de la novel·la de Bram Stoker", music: "so-dracula" },
  credits: "Adaptació lliure de «Dracula», de Bram Stoker (1897).\nFet amb el skill aventura-grafica de l'editor d'aventures.",
});
// Els crèdits complets de les imatges (al joc hi van resumits, perquè hi caben 3000 caràcters)
writeFileSync(join(HERE, "CREDITS.md"), `# Crèdits de les imatges de «Dràcula»\n\nTotes són de Wikimedia Commons, adaptades a pixel art amb la paleta del joc.\n\n${P.credits.map((l) => `- ${l}`).join("\n")}\n`);
