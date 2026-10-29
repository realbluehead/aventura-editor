// Plantilla d'una aventura feta amb el kit del skill «aventura-grafica». Copia-la a la carpeta del projecte
// (per exemple aventures/<nom>/build.mjs), canvia KIT si cal i omple-la. Executa-la amb:  node build.mjs
// Escriu joc.zip i el comprova (es pot importar? es pot acabar? hi ha zones mal posades?).
//
// Aquesta plantilla ja és un joc petit que funciona: dos escenaris, un puzle de dos passos, un diàleg i un final.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const KIT = "../../skills/aventura-grafica/scripts/kit.mjs";   // camí relatiu des d'aquest fitxer fins al kit
const {
  Project, Canvas, pixelArt, SFX, song,
  rect, ground, leftEdge, rightEdge, spot, exit, npc, place,
  obj, chr, hot, hasItem, inState, isVar, say, take, lose, setState, setVar, sound, music, cutscene, end, walk, wait,
  rule, dialogue, node, opt,
} = await import(new URL(KIT, import.meta.url));
const HERE = dirname(fileURLToPath(import.meta.url));

const P = new Project({ title: "El far", description: "Una aventura curta: la Mar ha d'encendre el far abans que arribi la tempesta." });

/* ---------- Sons ---------- */
P.sound("so-tema", "Tema", song(100, [
  { wave: "pulse", vol: 0.14, decay: 1.5, notes: "E4:1 G4:1 A4:2 G4:1 E4:1 D4:2 E4:1 G4:1 A4:1 B4:1 A4:4" },
  { wave: "triangle", vol: 0.22, decay: 0.5, notes: "A2:4 C3:4 D3:4 A2:4" },
], 2));
P.sound("so-exit", "Aconseguit", SFX.success());

/* ---------- Imatges ---------- */
// Un fons dibuixat a mà amb el llenç de píxels. Per fer-lo d'una foto o pintura lliure:
//   const bg = pixelArt(join(HERE, "imatges/port.jpg"), { preset: "painting" });  P.attribute(join(HERE, "imatges/port.jpg"));
function moll() {
  const c = new Canvas(320, 200);
  c.gradient(0, 0, 320, 110, "#2b3a67", "#e07a5f", 10);       // cel de capvespre
  c.rect(0, 110, 320, 40, "#1d4e6b");                          // mar
  c.noise(0, 110, 320, 40, "#1d4e6b", 0.1, 3);
  c.rect(0, 150, 320, 50, "#7a5c3e");                          // moll de fusta
  for (let x = 0; x < 320; x += 16) c.rect(x, 150, 1, 50, "#5e4630");
  c.rect(250, 40, 24, 110, "#e8e2d0"); c.rect(250, 70, 24, 10, "#b23a48"); c.rect(246, 30, 32, 12, "#3a3a3a");   // far
  c.rect(30, 118, 70, 30, "#8b5a2b"); c.rect(36, 104, 50, 16, "#a0522d"); c.text(40, 108, "BARCA", "#f2e8cf");    // barca
  return c;
}
function far() {
  const c = new Canvas(320, 200, "#3d3a4b");
  c.noise(0, 0, 320, 200, "#3d3a4b", 0.12, 5);
  c.rect(0, 150, 320, 50, "#55505f");                          // terra de pedra
  c.rect(130, 20, 60, 60, "#22202b"); c.circle(160, 50, 18, "#6b6578");    // el llum, apagat
  c.rect(20, 60, 30, 90, "#4a4556");                           // escala
  return c;
}
const llanterna = () => { const c = new Canvas(10, 14); c.rect(2, 0, 6, 2, "#333"); c.rect(1, 2, 8, 10, "#c9a227"); c.rect(3, 4, 4, 6, "#fff3b0"); c.rect(2, 12, 6, 2, "#333"); return c; };
const llumApagat = () => { const c = new Canvas(36, 36); c.circle(18, 18, 17, "#6b6578"); c.circle(18, 18, 10, "#8a849a"); return c; };
const llumEnces = () => { const c = new Canvas(36, 36); c.circle(18, 18, 17, "#ffd23f"); c.circle(18, 18, 10, "#fff8d6"); return c; };

/* ---------- Personatges ---------- */
// «look» dibuixa una figura de 16×32 amb totes les animacions (vegeu references/art.md per a totes les opcions)
P.character({ id: "c-mar", name: "Mar", description: "Sóc jo, la Mar. Guardiana del far des d'ahir.", color: "#ffffff",
  look: { skin: "#f0c8a0", hair: "#3a2a1e", ponytail: 1, shirt: "#2e6fb5", pants: "#2b3550", shoes: "#3a2a1a" } });
P.character({ id: "c-pesc", name: "pescador", description: "Un pescador vell amb gorra.", color: "#9fd3ff",
  look: { skin: "#c9936b", cap: "#f2f2f2", hair: "#9a9a9a", beard: "#c0c0c0", shirt: "#f2f2f2", stripes: "#1f4f7a", pants: "#1f2f4a", shoes: "#222" } });

/* ---------- Objectes ---------- */
P.object({ id: "o-llanterna", name: "llanterna", description: "Una llanterna d'oli, plena.", pickable: true, states: [["normal", "Normal", llanterna()]] });
P.object({ id: "o-llum", name: "llum del far", description: "El gran llum del far.", states: [["apagat", "Apagat", llumApagat()], ["ences", "Encès", llumEnces()]] });

/* ---------- Escenaris ---------- */
P.scene({ id: "s-moll", name: "El moll", description: "El moll, amb el far al fons.", background: moll(), walkable: ground(152), music: "so-tema",
  hotspots: [
    exit("ex-far", "Porta del far", rect(244, 120, 36, 32), "s-far", [60, 180]),
    spot("ho-barca", "barca", "La barca del pescador. Fa olor de peix.", rect(30, 104, 70, 44)),
    spot("ho-mar", "mar", "Les onades comencen a créixer.", rect(0, 110, 320, 38)),
  ],
  characters: [npc("c-pesc", [140, 176], "right")],
  actorHeight: { near: 60, far: 48 },
});
P.scene({ id: "s-far", name: "Dins del far", description: "L'escala i el gran llum.", background: far(), walkable: ground(152),
  hotspots: [
    exit("ex-moll", "Sortida al moll", leftEdge(152), "s-moll", [262, 176]),
    spot("ho-escala", "escala", "L'escala de cargol puja fins al llum.", rect(20, 60, 30, 90)),
  ],
  objects: [place("o-llum", [160, 70], [160, 170], { layer: "back" })],
  actorHeight: { near: 60, far: 48 },
});

/* ---------- Lògica ---------- */
// La primera regla que encaixa guanya: les que tenen condicions, abans de les generals
P.rules.push(
  rule("use", obj("o-llanterna"), obj("o-llum"), [inState("o-llum", "o-llum-apagat")], [
    setState("o-llum", "o-llum-ences"), sound("so-exit"), lose("o-llanterna"), cutscene("cs-final"),
  ]),
  rule("use", obj("o-llum"), null, [], [say("Cal una flama per encendre'l.")]),
  rule("pickup", chr("c-pesc"), null, [], [say("No crec que es deixi.")]),
);
P.dialogues.push(dialogue("d-pesc", "El pescador", "c-pesc", [
  node("pe-1", [["c-pesc", "Ve tempesta, noia. Sense el far, els vaixells s'estavellaran."]], [
    opt("No tinc res per encendre'l.", "pe-2"),
    opt("Adéu."),
  ]),
  node("pe-2", [["c-pesc", "Té, la meva llanterna. Encara té oli."]], [
    opt("Gràcies!", null, { once: true, actions: [take("o-llanterna"), sound("so-exit")] }),
  ]),
]));
P.cutscenes.push(
  { id: "cs-intro", name: "Introducció", actions: [say("Se'm fa fosc i el far encara és apagat..."), say("He de trobar com encendre'l.")] },
  { id: "cs-final", name: "Final", actions: [wait(1), say("Ja brilla! Els vaixells trobaran el port."), end("El far torna a brillar. Fi.")] },
);

/* ---------- Pantalla de títol i escriure ---------- */
const titol = moll();
titol.rect(60, 20, 200, 34, [20, 20, 40, 200]);
titol.text(160 - Canvas.textWidth("EL FAR", 4) / 2, 26, "EL FAR", "#ffd23f", 4);

await P.write(join(HERE, "joc.zip"), {
  startSceneId: "s-moll", playerId: "c-mar", introCutsceneId: "cs-intro",
  titleScreen: { image: titol, subtitle: "Una aventura curta", music: "so-tema" },
  credits: "Guió i dibuixos fets amb el skill aventura-grafica.",
});
