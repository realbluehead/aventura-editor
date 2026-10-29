// «L'illa del tresor», versió curta: prova del skill aventura-grafica. Executa: node build.mjs
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const KIT = "../../skills/aventura-grafica/scripts/kit.mjs";
const {
  Project, Canvas, pixelArt, SFX, song,
  rect, leftEdge, spot, exit, npc, place,
  obj, chr, hot, hasItem, inState, isVar, say, take, lose, setState, setVar, sound, cutscene, end, walk, wait,
  rule, dialogue, node, opt,
} = await import(new URL(KIT, import.meta.url));
const HERE = dirname(fileURLToPath(import.meta.url));
const img = (f) => join(HERE, "imatges", f);

const P = new Project({
  title: "L'illa del tresor",
  description: "Una aventura curta a partir de la novel·la de Stevenson: en Jim Hawkins, un mapa, un vaixell ple de pirates i un home que somia formatge.",
});

/* ---------- Sons ---------- */
P.sound("so-tema", "Tema mariner", song(112, [
  { wave: "pulse", vol: 0.14, decay: 1.4, notes: "D4:1 F4:1 A4:2 G4:1 F4:1 E4:2 D4:1 F4:1 A4:1 D5:1 C5:2 A4:2 G4:1 A4:1 F4:1 E4:1 D4:4" },
  { wave: "triangle", vol: 0.24, decay: 0.4, notes: "D2:2 A2:2 C3:2 A2:2 D2:2 A2:2 G2:2 A2:2 D2:4" },
], 2));
P.sound("so-exit", "Aconseguit", SFX.success());
P.sound("so-clic", "Clic", SFX.click());

/* ---------- Fons: pintures de domini públic, pixelades amb el mateix estil ---------- */
const STYLE = { preset: "painting", brightness: 15 };
const fons = {
  hostal: pixelArt(img("hostal.jpg"), STYLE),
  port: pixelArt(img("port.jpg"), { ...STYLE, crop: [0, 0.03, 1, 0.97] }),
  coberta: pixelArt(img("coberta.jpg"), { ...STYLE, saturation: 0 }),
  illa: pixelArt(img("illa.jpg"), { ...STYLE, crop: [0.01, 0, 0.98, 1] }),
};
for (const f of ["hostal.jpg", "port.jpg", "coberta.jpg", "illa.jpg"]) P.attribute(img(f));

/* ---------- Objectes dibuixats ---------- */
const clau = () => { const c = new Canvas(10, 5); c.circle(2, 2, 2, "#c9a227"); c.px(2, 2, [0, 0, 0, 0]); c.rect(4, 2, 6, 1, "#c9a227"); c.rect(8, 3, 1, 2, "#c9a227"); return c; };
function bagul(obert) {
  const c = new Canvas(26, 20);
  c.rect(1, 8, 24, 12, "#6b3e1f"); c.rect(1, 8, 24, 2, "#4a2a12"); c.rect(1, 13, 24, 1, "#c9a227"); c.rect(11, 11, 4, 4, "#c9a227");
  if (obert) { c.rect(1, 0, 24, 6, "#5a3418"); c.rect(3, 6, 20, 3, "#1a0e05"); }
  else { c.rect(1, 4, 24, 5, "#7a4a26"); c.rect(1, 4, 24, 1, "#8f5a30"); }
  return c;
}
const mapa = () => { const c = new Canvas(14, 11); c.rect(0, 0, 14, 11, "#e8d6a6"); c.rect(0, 0, 14, 1, "#b89c62"); c.rect(3, 3, 6, 4, "#5e8a3a"); c.line(9, 8, 12, 9, "#7a5a3a"); c.line(5, 4, 7, 6, "#b23a2a"); c.line(7, 4, 5, 6, "#b23a2a"); return c; };
const carta = () => { const c = new Canvas(12, 9); c.rect(0, 0, 12, 9, "#f2ead8"); c.line(0, 0, 6, 5, "#a89a80"); c.line(11, 0, 6, 5, "#a89a80"); c.circle(6, 6, 2, "#a02020"); return c; };
const formatge = () => { const c = new Canvas(12, 8); c.poly([[0, 7], [11, 7], [11, 2], [0, 5]], "#f2c94c"); c.rect(0, 7, 12, 1, "#c9a227"); c.px(4, 5, "#c9a227"); c.px(8, 4, "#c9a227"); return c; };
function bota() {
  const c = new Canvas(18, 22);
  c.ellipse(9, 11, 8, 10, "#7a5232"); c.rect(1, 4, 16, 1, "#3a3a3a"); c.rect(1, 17, 16, 1, "#3a3a3a");
  c.ellipse(9, 2, 6, 2, "#b23a2a"); c.px(6, 1, "#5e8a3a"); c.px(11, 2, "#d94a3a");   // pomes a dalt
  return c;
}

P.object({ id: "o-clau", name: "clau", description: "Una clau de bronze. Fa olor de rom i de gàbia.", pickable: true, states: [["normal", "Normal", clau()]] });
P.object({ id: "o-bagul", name: "bagul del capità", description: "El bagul de mariner de Billy Bones. Té les inicials B. B. cremades a la fusta.",
  states: [["tancat", "Tancat", bagul(false)], ["obert", "Obert", bagul(true)]] });
P.object({ id: "o-mapa", name: "mapa", description: "Un mapa d'una illa en forma de drac dret. Una creu vermella diu: «Aquí, el gruix del tresor».", pickable: true, states: [["normal", "Normal", mapa()]] });
P.object({ id: "o-carta", name: "carta de l'amo", description: "«Que el portador, Jim Hawkins, sigui admès a bord de l'Hispaniola. —J. Trelawney».", pickable: true, states: [["normal", "Normal", carta()]] });
P.object({ id: "o-formatge", name: "formatge", description: "Un bon tros de formatge de la mare. Per al viatge.", pickable: true, states: [["normal", "Normal", formatge()]] });
P.object({ id: "o-bota", name: "bóta de pomes", description: "Una bóta gairebé buida de pomes. Hi cabria un grumet.", states: [["normal", "Normal", bota()]] });

/* ---------- Personatges ---------- */
P.character({ id: "c-jim", name: "Jim", description: "Sóc en Jim Hawkins, de l'hostal de l'Almirall Benbow.", color: "#ffffff",
  look: { skin: "#f0c8a0", hair: "#7a4a1e", shirt: "#e8e2d0", vest: "#2e5fa5", pants: "#5a4a3a", shoes: "#2a1a0a" } });
P.character({ id: "c-mare", name: "mare", description: "La mare. Porta l'hostal ella sola des que va morir el pare.", color: "#ffb3c7",
  look: { skin: "#e8bf99", hair: "#5a3a1e", bun: 1, shirt: "#8a2a3a", apron: "#e8e2d0", dress: "#4a2a3a", legs: "#e8bf99", pants: "#4a2a3a", shoes: "#222" } });
P.character({ id: "c-trelawney", name: "amo Trelawney", description: "L'amo Trelawney: ric, valent i incapaç de guardar un secret.", color: "#ffd36b",
  look: { skin: "#f0c8a0", hair: "#e8e8e8", hat: "#2a2a2a", shirt: "#e8e2d0", jacket: "#7a1a2a", pants: "#2a2a3a", shoes: "#111" } });
P.character({ id: "c-silver", name: "Long John Silver", description: "El cuiner del vaixell. Té una sola cama i un lloro que es diu Capità Flint.", color: "#9fd36b",
  look: { skin: "#d7a07a", hair: "#2a1a0a", beard: "#2a1a0a", shirt: "#e8e2d0", stripes: "#2a3a5a", apron: "#c9c0a8", pants: "#3a3a3a", shoes: "#2a1a0a" } });
P.character({ id: "c-smollett", name: "capità Smollett", description: "El capità Smollett. Sec com una galeta, però honrat.", color: "#7fc8ff",
  look: { skin: "#e8bf99", hair: "#9a9a9a", cap: "#1a2a4a", shirt: "#e8e2d0", jacket: "#1a2a4a", pants: "#1a2a4a", shoes: "#111" } });
P.character({ id: "c-ben", name: "Ben Gunn", description: "Un home pelut i colrat pel sol, vestit amb pells de cabra.", color: "#e3c08a",
  look: { skin: "#b67d55", hair: "#c8b48a", long: 1, beard: "#c8b48a", shirt: "#9a7a4a", pants: "#7a5a3a", shoes: "#5a3a1a" } });

/* ---------- Escenaris ---------- */
const H = { near: 62, far: 50 };
P.scene({ id: "s-hostal", name: "Hostal de l'Almirall Benbow", description: "L'hostal de la família Hawkins, a la costa.", background: fons.hostal,
  walkable: [[[0, 150], [230, 142], [320, 168], [320, 199], [0, 199]]], music: "so-tema", actorHeight: H,
  hotspots: [
    exit("ex-port", "Al port de Bristol", rect(20, 76, 16, 50), "s-port", [40, 190]),
    spot("ho-gabia", "gàbia", "Una gàbia d'ocell penjada al sostre. No hi ha cap ocell... però alguna cosa hi brilla.", rect(70, 40, 24, 24)),
    spot("ho-parroquians", "parroquians", "Pescadors, contrabandistes i gent que no paga. Els clients de sempre.", rect(50, 85, 180, 60)),
    spot("ho-botes", "bótes de vi", "Bótes de vi i de rom. El rom era del capità; ara ja no en beurà més.", rect(232, 90, 72, 60)),
    spot("ho-taula", "taula parada", "Pa, formatge i una gerra. La mare sempre té alguna cosa a punt.", rect(254, 152, 66, 34)),
  ],
  objects: [place("o-bagul", [70, 190], [96, 188])],
  characters: [npc("c-mare", [150, 192], "left")],
});
P.scene({ id: "s-port", name: "Port de Bristol", description: "El port, ple de vaixells. L'Hispaniola espera.", background: fons.port,
  walkable: [[[0, 176], [320, 178], [320, 199], [0, 199]]], music: "so-tema", actorHeight: { near: 38, far: 34 },
  hotspots: [
    exit("ex-hostal", "Tornar a l'hostal", leftEdge(176), "s-hostal", [44, 160]),
    exit("ex-bord", "Pujar a l'Hispaniola", rect(134, 118, 64, 50), "s-coberta", [70, 186], {
      conditions: [hasItem("o-carta")], blocked: "Un mariner em barra el pas: sense una carta de l'amo, ningú no puja a bord.",
    }),
    spot("ho-bandera", "bandera vermella", "La bandera de la marina mercant. Fa goig.", rect(114, 100, 34, 36)),
    spot("ho-velers", "vaixells", "Vaixells que van i vénen de les Antilles. Algun dia en tindré un.", rect(220, 88, 60, 70)),
    spot("ho-mar", "aigua del port", "Aigua bruta de port. Millor no caure-hi.", rect(0, 140, 320, 34)),
  ],
  characters: [npc("c-trelawney", [210, 190], "left")],
});
P.scene({ id: "s-coberta", name: "Coberta de l'Hispaniola", description: "La coberta del vaixell, en alta mar, sota la lluna.", background: fons.coberta,
  walkable: [[[10, 150], [200, 140], [230, 199], [0, 199]]], music: null, actorHeight: H, transition: "iris",
  hotspots: [
    exit("ex-bot", "Baixar al bot", leftEdge(160), "s-illa", [70, 190], {
      conditions: [isVar("v-avis", true)], blocked: "No puc marxar així com així. Primer he d'explicar al capità el que passa a bord.",
    }),
    spot("ho-veles", "veles", "Les veles, plenes de vent. Anem cap a l'illa a tota vela.", rect(70, 0, 250, 60)),
    spot("ho-cordes", "cordam", "Cordes i més cordes. Un mariner de debò sap per a què serveix cadascuna. Jo no.", rect(232, 30, 88, 150)),
    spot("ho-cabrestant", "cabrestant", "El cabrestant de l'àncora. Pesa més que tota la tripulació junta.", rect(20, 90, 50, 56)),
  ],
  objects: [place("o-bota", [150, 160], [132, 170], { layer: "back" })],
  characters: [npc("c-smollett", [60, 186], "right"), npc("c-silver", [196, 168], "left")],
});
P.scene({ id: "s-illa", name: "L'illa del tresor", description: "Una illa salvatge. La creu del mapa és aquí a prop.", background: fons.illa,
  walkable: [[[0, 168], [150, 172], [190, 186], [320, 186], [320, 199], [0, 199]]], music: "so-tema", actorHeight: { near: 56, far: 48 },
  onEnter: { cutsceneId: "cs-illa", once: true },
  hotspots: [
    exit("ex-vaixell", "Tornar al vaixell", leftEdge(168), "s-coberta", [40, 186]),
    spot("ho-creu", "lloc de la creu", "Aquí hi hauria d'haver el tresor. Només hi ha un forat ben gros... i buit.", rect(84, 174, 30, 12)),
    spot("ho-hispaniola", "l'Hispaniola", "L'Hispaniola, ancorada a la badia. Des d'aquí sembla un vaixell de joguina.", rect(272, 90, 36, 64)),
    spot("ho-turons", "turons", "Els turons de l'illa. Segons el mapa, el més alt es diu el Pal de Mitjana.", rect(0, 95, 260, 50)),
  ],
  characters: [npc("c-ben", [250, 194], "left")],
});

/* ---------- Variables i lògica ---------- */
P.variable("v-moti", "sap_el_moti");
P.variable("v-avis", "capita_avisat");

P.rules.push(
  // La clau, a la gàbia
  rule("open", hot("ho-gabia"), null, [hasItem("o-clau", true), inState("o-bagul", "o-bagul-tancat")], [sound("so-clic"), take("o-clau"), say("Una clau! El capità la penjava aquí perquè ningú no hi arribés.")]),
  rule("pickup", hot("ho-gabia"), null, [hasItem("o-clau", true), inState("o-bagul", "o-bagul-tancat")], [sound("so-clic"), take("o-clau"), say("Una clau! El capità la penjava aquí perquè ningú no hi arribés.")]),
  rule("open", hot("ho-gabia"), null, [], [say("Ja no hi ha res més. Ni ocell, ni clau.")]),
  // El bagul
  rule("use", obj("o-clau"), obj("o-bagul"), [], [
    sound("so-clic"), setState("o-bagul", "o-bagul-obert"), lose("o-clau"), take("o-mapa"), sound("so-exit"),
    say("Roba vella, una brúixola trencada... i un paquet d'hule. És un mapa!"),
  ]),
  rule("open", obj("o-bagul"), null, [inState("o-bagul", "o-bagul-tancat")], [say("Està tancat amb clau. El capità no se'n fiava, de ningú.")]),
  rule("open", obj("o-bagul"), null, [], [say("Ja l'he buidat.")]),
  rule("pickup", obj("o-bagul"), null, [], [say("Pesa com un ancoratge. Millor treure'n el que hi hagi.")]),
  // L'amo i la carta
  rule("give", obj("o-mapa"), chr("c-trelawney"), [hasItem("o-carta", true)], [
    say("Per tots els llamps! El mapa del capità Flint!", "c-trelawney"),
    say("Compro un vaixell avui mateix: l'Hispaniola. I tu, Jim, en seràs el grumet.", "c-trelawney"),
    take("o-carta"), sound("so-exit"),
    say("Té, aquesta carta et deixarà pujar a bord. I guarda bé el mapa, noi.", "c-trelawney"),
  ]),
  rule("give", obj("o-mapa"), chr("c-trelawney"), [], [say("Ja l'he vist, noi, ja l'he vist! Guarda-te'l.", "c-trelawney")]),
  rule("give", obj("o-mapa"), chr("c-silver"), [], [say("Ni boig. Aquest home té una mirada que no m'agrada gens.")]),
  // La bóta de pomes: s'hi escolta el motí
  rule("use", obj("o-bota"), null, [isVar("v-moti", false)], [cutscene("cs-bota")]),
  rule("open", obj("o-bota"), null, [isVar("v-moti", false)], [cutscene("cs-bota")]),
  rule("use", obj("o-bota"), null, [], [say("Ja n'he sentit prou des d'aquí dins.")]),
  rule("pickup", obj("o-bota"), null, [], [say("Està clavada a la coberta. Però algú hi podria cabre dins...")]),
  // L'illa
  rule("use", obj("o-mapa"), null, [], [say("La creu és a l'illa, sota el turó més alt.")]),
  rule("use", obj("o-mapa"), hot("ho-creu"), [], [say("És aquí, segur. Però algú ja ha excavat... i s'ho ha emportat tot."), say("Qui deu viure en una illa deserta?")]),
  rule("give", obj("o-formatge"), chr("c-ben"), [], [lose("o-formatge"), cutscene("cs-final")]),
  rule("give", obj("o-formatge"), chr("c-silver"), [], [say("Ni parlar-ne. Aquest formatge és per a algú que el necessiti de debò.")]),
  // Bromes
  rule("talk", hot("ho-parroquians"), null, [], [say("Algú sap res del capità Flint?"), say("Silenci absolut. Tothom mira el got.")]),
  rule("pickup", chr("c-silver"), null, [], [say("Amb una cama i tot, crec que encara m'atraparia.")]),
  rule("push", chr("c-silver"), null, [], [say("Empènyer un pirata en alta mar. Quina gran idea, Jim.")]),
  rule("pickup", hot("ho-taula"), null, [], [say("La mare em mataria. Ja me'n donarà si li ho demano bé.")]),
);

P.dialogues.push(
  dialogue("d-mare", "La mare", "c-mare", [
    node("ma-1", [["c-mare", "Jim, fill, què faràs ara amb el bagul del capità?"]], [
      opt("Què hi havia, al bagul?", "ma-2"),
      opt("Mare, me'n vaig de viatge.", "ma-3", { once: true }),
      opt("Res, ja t'ho diré."),
    ]),
    node("ma-2", [["c-mare", "Només ell ho sabia. La clau la penjava sempre en un lloc alt, on cap lladre no hi arribés."]], [opt("En un lloc alt...", "ma-1")]),
    node("ma-3", [["c-mare", "De viatge? Ai, aquest noi... Doncs no te'n vagis amb la panxa buida."]], [
      opt("Gràcies, mare.", "ma-1", { actions: [take("o-formatge"), sound("so-exit")] }),
    ]),
  ]),
  dialogue("d-trelawney", "L'amo Trelawney", "c-trelawney", [
    node("tr-1", [["c-trelawney", "Jove Hawkins! Quines notícies em portes?"]], [
      opt("Què en sap, del capità Flint?", "tr-2"),
      opt("Em portaria en un vaixell?", "tr-3"),
      opt("Adéu, senyor."),
    ]),
    node("tr-2", [["c-trelawney", "El pirata més sanguinari que ha navegat mai! Diuen que va enterrar el seu tresor en una illa."]], [opt("Una illa...", "tr-1")]),
    node("tr-3", [["c-trelawney", "Si tinguessis un mapa del tresor, armaria un vaixell avui mateix!"]], [opt("Hi pensaré.", "tr-1")]),
  ]),
  dialogue("d-silver", "Long John Silver", "c-silver", [
    node("si-1", [["c-silver", "Ah, el grumet! Seu, seu. Vols un mos de la cuina d'en Long John?"], [null, "(El lloro crida: «Peces de vuit! Peces de vuit!»)"]], [
      opt("Com es diu el lloro?", "si-2"),
      opt("On anem exactament?", "si-3"),
      opt("Me'n vaig a la feina."),
    ]),
    node("si-2", [["c-silver", "Capità Flint, com el pirata. Té més de dos-cents anys i ha vist més maldat que el dimoni."]], [opt("Quin lloro més simpàtic.", "si-1")]),
    node("si-3", [["c-silver", "Això ho sap el capità, noi. Jo només remeno l'olla. Per què no vas a buscar una poma a la bóta?"]], [opt("Bona idea.", "si-1")]),
  ]),
  dialogue("d-smollett", "El capità Smollett", "c-smollett", [
    node("sm-1", [["c-smollett", "Grumet. Tens feina?"]], [
      opt("Capità, he sentit en Silver: prepara un motí!", "sm-3", { conditions: [isVar("v-moti", true), isVar("v-avis", false)] }),
      opt("Què en pensa, de la tripulació?", "sm-2"),
      opt("Sí, capità."),
    ]),
    node("sm-2", [["c-smollett", "No m'agrada. Massa homes del cuiner, i tots saben on anem. Això no és un viatge, és un rumor amb veles."]], [opt("Entesos.", "sm-1")]),
    node("sm-3", [["c-smollett", "Ho sospitava. Ben fet, noi."], ["c-smollett", "Agafa el bot i baixa a l'illa abans que ells. Troba el tresor; nosaltres guardarem el vaixell."]], [
      opt("A sus ordres!", null, { actions: [setVar("v-avis", true), sound("so-exit")] }),
    ]),
  ]),
  dialogue("d-ben", "Ben Gunn", "c-ben", [
    node("be-1", [["c-ben", "Un cristià! Un cristià de debò! Sóc en Ben Gunn, abandonat aquí fa tres anys."]], [
      opt("Saps on és el tresor de Flint?", "be-2"),
      opt("Què trobes més a faltar?", "be-3"),
      opt("Adéu, Ben."),
    ]),
    node("be-2", [["c-ben", "Potser sí, potser no. En Ben Gunn té el cap ple de secrets... i la panxa buida."]], [opt("Ja ho veig.", "be-1")]),
    node("be-3", [["c-ben", "Formatge! Moltes nits he somiat formatge, torrat sobretot. I em desperto i aquí no n'hi ha."]], [opt("Pobre home.", "be-1")]),
  ]),
);

P.cutscenes.push(
  { id: "cs-intro", name: "Introducció", actions: [
    walk([110, 182]),
    say("El vell capità Billy Bones ha mort aquesta nit, aquí a l'hostal."),
    say("Deia que uns pirates el buscaven pel que guardava al bagul..."),
    say("Si hi ha alguna cosa que valgui la pena, l'haig de trobar abans que tornin."),
  ] },
  { id: "cs-bota", name: "Dins la bóta", actions: [
    say("(M'amago dins la bóta a buscar una poma...)"),
    wait(1),
    say("Escolteu, nois: quan tinguem el tresor a bord, l'amo i el capità aniran a peixos.", "c-silver"),
    say("Fins llavors, somriures i «sí, capità». Entesos?", "c-silver"),
    setVar("v-moti", true),
    say("(Un motí! Ho he de dir al capità Smollett.)"),
  ] },
  { id: "cs-illa", name: "Arribada a l'illa", actions: [
    walk([90, 188]),
    say("L'illa del tresor. Segons el mapa, la creu és aquí mateix."),
  ] },
  { id: "cs-final", name: "Final", actions: [
    say("Formatge! Formatge de debò!", "c-ben"),
    say("Per això en Ben Gunn et dirà un secret: el tresor ja no és sota la creu."),
    say("Fa dos anys el vaig desenterrar, moneda a moneda, i el vaig amagar a la meva cova.", "c-ben"),
    say("Vine, grumet. Hi ha or per a tots... menys per als pirates.", "c-ben"),
    wait(1),
    end("En Jim Hawkins va tornar a Bristol amb el tresor de Flint. Silver va desaparèixer amb un sac de monedes... i el lloro. Fi."),
  ] },
);

/* ---------- Títol i escriure ---------- */
const titol = pixelArt(img("illa.jpg"), { ...STYLE, crop: [0.01, 0, 0.98, 1] });
titol.rect(40, 18, 240, 46, [10, 10, 30, 200]);
titol.text(160 - Canvas.textWidth("L'ILLA DEL", 2) / 2, 24, "L'ILLA DEL", "#e8d6a6", 2);
titol.text(160 - Canvas.textWidth("TRESOR", 4) / 2 + 1, 39, "TRESOR", "#5a0a10", 4);
titol.text(160 - Canvas.textWidth("TRESOR", 4) / 2, 38, "TRESOR", "#f2c94c", 4);

await P.write(join(HERE, "joc.zip"), {
  startSceneId: "s-hostal", playerId: "c-jim", introCutsceneId: "cs-intro",
  titleScreen: { image: titol, subtitle: "Una aventura a partir de Robert Louis Stevenson", music: "so-tema" },
  credits: "Adaptació lliure de «L'illa del tresor», de Robert Louis Stevenson (1883).\nFet amb el skill aventura-grafica de l'editor d'aventures.",
});
