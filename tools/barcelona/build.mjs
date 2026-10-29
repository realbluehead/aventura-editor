// Construeix «La rosa de Sant Jordi», una aventura per Barcelona, com un zip importable a l'editor.
//   node tools/barcelona/build.mjs [sortida.zip] [--import http://localhost:8821]
// Totes les imatges i els sons es generen aquí mateix: no cal cap fitxer de fora.
import { writeFileSync } from "node:fs";
import { Canvas } from "./pixels.mjs";
import { SCENES, magicFountainWater, parkGuell } from "./scenes.mjs";
import * as S from "./sprites.mjs";
import * as A from "./audio.mjs";
import { zip } from "../../export.mjs";
import { DEFAULT_VERBS } from "../../public/js/defaults.js";

const files = [];
const file = (name, data) => (files.push({ name: `files/${name}`, data }), name);
const now = new Date().toISOString();

/* ---------- Sons ---------- */

const sounds = [
  ["snd-tema", "Tema principal", "tema.wav", A.temaPrincipal],
  ["snd-carrer", "Música de carrer", "carrer.wav", A.musicaCarrer],
  ["snd-final", "Música del final", "final.wav", A.musicaFinal],
  ["snd-moneda", "Moneda", "moneda.wav", A.sMoneda],
  ["snd-clic", "Clic", "clic.wav", A.sClic],
  ["snd-aigua", "Aigua", "aigua.wav", A.sAigua],
  ["snd-bus", "Clàxon del bus", "bus.wav", A.sBus],
  ["snd-exit", "Aconseguit", "exit.wav", A.sExit],
].map(([id, name, f, make]) => ({ id, name, file: file(f, make()) }));

/* ---------- Personatges ---------- */

const people = {
  jordi: ["Jordi", "Sóc jo, en Jordi. Avui toca quedar bé.", "#ffffff", { skin: "#f0c8a0", hair: "#5a3a1e", shirt: "#2e6fb5", pants: "#2b3550", shoes: "#3a2a1a" }],
  florista: ["Florista", "La florista de la Rambla. Té les roses més boniques de la ciutat.", "#ff9ec4", { skin: "#e8bf99", hair: "#9a9a9a", bun: 1, shirt: "#c25b8a", apron: "#4f8a3a", pants: "#333", shoes: "#222", dress: "#3a3a5a" }],
  estatua: ["Estàtua humana", "Un home pintat de plata que fa d'estàtua. Ni parpelleja.", "#c9ccd2", { skin: "#c9ccd2", hair: null, hat: "#9da2aa", shirt: "#b8bcc4", pants: "#a4a8b0", shoes: "#8a8e96" }],
  remei: ["Remei", "La Remei, peixatera de la Boqueria de tota la vida.", "#7fc8ff", { skin: "#d9a882", hair: "#1a1a1a", long: 1, shirt: "#2e86c1", apron: "#f2f2f2", pants: "#2b2b2b", shoes: "#2f6b3a" }],
  pere: ["Pere", "En Pere, el llibreter. Mira els llibres amb els ulls aclucats.", "#e3c08a", { skin: "#edc5a2", hair: null, beard: "#c0c0c0", shirt: "#7a5a3a", jacket: "#5a3f28", pants: "#4a4a4a", shoes: "#222" }],
  quim: ["Quim", "Un mariner vell que se les sap totes.", "#9fd3ff", { skin: "#c9936b", cap: "#f2f2f2", hair: "#3a2a1a", shirt: "#f2f2f2", stripes: "#1f4f7a", pants: "#1f2f4a", shoes: "#222" }],
  tomas: ["Tomàs", "En Tomàs, pescador de la Barceloneta. Fa cara de gana.", "#ffd36b", { skin: "#b67d55", hat: "#e3c770", beard: "#5a3a1e", hair: "#5a3a1e", shirt: "#e0a526", pants: "#3a4a5a", shoes: "#5a3a1e" }],
  anna: ["Anna", "L'Anna, guia turística. Porta un grup imaginari.", "#ff8a7a", { skin: "#f3cfae", hair: "#b5651d", ponytail: 1, shirt: "#f2f2f2", jacket: "#c0392b", pants: "#2b3550", shoes: "#222" }],
  manel: ["Manel", "En Manel, paleta de la Sagrada Família. Diu que hi treballa des de petit.", "#ffb86b", { skin: "#d7a07a", helmet: "#f2c52b", hair: "#2a1a0a", shirt: "#4a6a8a", vest: "#f28c28", pants: "#3a4a5a", shoes: "#5a3a1e" }],
  laia: ["Laia", "La Laia. M'espera al Park Güell.", "#d9a6ff", { skin: "#f5d2b5", hair: "#1a1a1a", long: 1, shirt: "#8e44ad", dress: "#8e44ad", legs: "#f5d2b5", pants: "#f5d2b5", shoes: "#5a2a5a" }],
};
const characters = Object.entries(people).map(([key, [name, description, color, look]]) => ({
  id: `c-${key}`, name, description, color,
  sheet: file(`pj-${key}.png`, S.characterSheet(look).png()),
  frameWidth: S.FRAME_W, frameHeight: S.FRAME_H,
  // L'estàtua no camina: només té la postura de cara
  animations: key === "estatua" ? { "idle-down": { frames: [4], fps: 1 }, "talk-down": { frames: [4], fps: 1 } } : S.ANIMATIONS,
  createdAt: now, updatedAt: now,
}));
const C = Object.fromEntries(Object.keys(people).map((k) => [k, `c-${k}`]));

/* ---------- Objectes ---------- */

function object(key, name, description, pickable, states) {
  const st = states.map(([sid, sname, img]) => ({ id: `${key}-${sid}`, name: sname, image: img ? file(`obj-${key}-${sid}.png`, img.png()) : null }));
  const firstImg = states.find(([, , img]) => img)?.[2];
  return {
    id: `o-${key}`, name, description, pickable, states: st, initialState: st[0].id,
    icon: pickable && firstImg ? file(`ico-${key}.png`, S.icon(firstImg).png()) : null,
    createdAt: now, updatedAt: now,
  };
}
const objects = [
  object("mapa", "mapa", "Un mapa turístic de Barcelona, amb les parades del bus marcades.", true, [["normal", "Normal", S.mapa()]]),
  object("moneda", "moneda", "Una moneda de dos euros. Brilla com el sol de Sant Jordi.", true, [["normal", "Normal", S.moneda()]]),
  object("rosa", "rosa", "Una rosa vermella amb una espiga i la cinta de la senyera.", true, [["normal", "Normal", S.rosa()]]),
  object("peix", "peix", "Un lluç acabat de pescar. Fa una olor de mar que tomba.", true, [["normal", "Normal", S.peix()]]),
  object("pa", "barra de pa", "Una barra de pa cruixent.", true, [["normal", "Normal", S.pa()]]),
  object("ulleres", "ulleres", "Unes ulleres de pasta, una mica molles.", true, [["amagades", "Amagades", null], ["visibles", "Visibles", S.ulleres()]]),
  object("llibre", "llibre", "«Tirant lo Blanc». Un clàssic: a la Laia li encantarà.", true, [["normal", "Normal", S.llibre()]]),
  object("bitllet", "bitllet de bus", "Un bitllet senzill. Val per al bus 24.", true, [["normal", "Normal", S.bitllet()]]),
  object("font", "Font Màgica", "L'aigua balla amb llums de colors.", false, [["engegada", "Engegada", magicFountainWater()], ["apagada", "Apagada", S.fontApagada()]]),
];
const O = Object.fromEntries(objects.map((o) => [o.id.slice(2), o.id]));

/* ---------- Escenaris ---------- */

const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const ground = (top) => [rect(0, top, 320, 199 - top)];
const spot = (id, name, description, polygon) => ({ id, name, description, polygon, exit: null });
const exit = (id, name, polygon, sceneId, arrival, extra = {}) => ({
  id, name, description: "", polygon, exit: { sceneId: `s-${sceneId}`, arrival, conditions: [], blocked: "", ...extra },
});
const leftEdge = (top = 152) => rect(0, top, 18, 199 - top);
const rightEdge = (top = 152) => rect(302, top, 18, 199 - top);
const npc = (key, position, facing = "down") => ({ characterId: C[key], position, walkTo: null, facing });

const layout = {
  pc: {
    description: "El cor de la ciutat. Coloms, turistes i la gran font.",
    walkable: ground(156), music: "snd-tema", map: [420, 260],
    hotspots: [
      exit("pc-rambla", "La Rambla", leftEdge(), "rambla", [292, 176]),
      exit("pc-pg", "Passeig de Gràcia", rightEdge(), "pg", [30, 176]),
      exit("pc-metro", "Metro (L2 a Sagrada Família)", rect(52, 112, 30, 38), "sf", [284, 186]),
      spot("pc-font", "font", "La font de la plaça. No s'hi pot nedar, ja ho he preguntat.", [[110, 128], [210, 128], [210, 152], [110, 152]]),
      spot("pc-edifici", "grans magatzems", "Uns grans magatzems. Allà dins tot costa més d'una moneda.", rect(150, 36, 110, 92)),
      spot("pc-coloms", "coloms", "Els coloms de la plaça. Em miren com si els degués alguna cosa.", rect(100, 156, 130, 34)),
      spot("pc-banc", "banc", "Un banc de fusta, per descansar els peus.", rect(218, 144, 44, 16)),
    ],
    objects: [{ objectId: O.mapa, position: [244, 146], walkTo: [244, 168], facing: "auto", layer: "auto" }],
    characters: [],
  },
  rambla: {
    description: "El passeig més famós: flors, estàtues humanes i el mosaic de Miró.",
    walkable: ground(156), music: "snd-carrer", map: [360, 360],
    hotspots: [
      exit("ra-pc", "Plaça de Catalunya", leftEdge(160), "pc", [30, 176]),
      exit("ra-boq", "Mercat de la Boqueria", rect(34, 90, 50, 60), "boqueria", [288, 182]),
      exit("ra-gotic", "Barri Gòtic", rect(244, 82, 34, 68), "gotic", [36, 182]),
      exit("ra-port", "Al port", rightEdge(160), "port", [70, 182]),
      spot("ra-flors", "parada de flors", "Roses, roses i més roses. Avui és el dia.", rect(92, 110, 52, 34)),
      spot("ra-miro", "mosaic de Miró", "El mosaic de Miró. Tothom el trepitja i ningú el mira.", [[156, 172], [184, 172], [184, 194], [156, 194]]),
    ],
    objects: [],
    characters: [npc("florista", [120, 162]), npc("estatua", [210, 166])],
  },
  boqueria: {
    description: "El mercat més bonic del món. Fruita, pernils i peix fresc.",
    walkable: ground(158), music: null, map: [250, 360],
    hotspots: [
      exit("bo-sortida", "Sortida a la Rambla", rightEdge(158), "rambla", [60, 174]),
      spot("bo-fruita", "parades de fruita", "Piràmides de fruita perfectes. Millor no toco res o s'ensorrarà tot.", rect(6, 86, 204, 66)),
      spot("bo-pernils", "pernils", "Pernils penjats. Se'm fa la boca aigua.", rect(10, 42, 300, 30)),
      spot("bo-peix", "parada del peix", "El gel hi és, però de peix gairebé no en queda.", rect(222, 84, 92, 68)),
    ],
    objects: [],
    characters: [npc("remei", [262, 168], "left")],
  },
  gotic: {
    description: "Carrers estrets, pedra antiga i la catedral.",
    walkable: ground(160), music: null, map: [480, 360],
    hotspots: [
      exit("go-rambla", "La Rambla", leftEdge(160), "rambla", [262, 174]),
      spot("go-catedral", "catedral", "La catedral de Barcelona. Fa més de sis-cents anys que és aquí.", rect(70, 20, 180, 86)),
      spot("go-porta", "porta de la catedral", "Hi ha missa. Millor no molestar.", [[146, 92], [174, 92], [174, 150], [146, 150]]),
      spot("go-llibres", "parada de llibres", "Novel·les, poesia, contes... i cap preu a la vista.", rect(188, 122, 74, 32)),
      spot("go-senyera", "senyera", "La senyera, quatre barres vermelles sobre groc.", rect(260, 98, 22, 30)),
    ],
    objects: [],
    characters: [npc("pere", [226, 170])],
  },
  port: {
    description: "El port vell, amb Colom assenyalant el mar i el telefèric de Montjuïc.",
    walkable: ground(156), music: "snd-carrer", map: [400, 470],
    hotspots: [
      exit("po-rambla", "La Rambla", leftEdge(162), "rambla", [290, 182]),
      exit("po-tele", "Telefèric de Montjuïc", rect(6, 104, 40, 46), "mj", [40, 172]),
      exit("po-platja", "La Barceloneta", rightEdge(156), "platja", [30, 176]),
      spot("po-colom", "monument a Colom", "Colom assenyala el mar. Diuen que en realitat assenyala cap a Mallorca.", rect(106, 10, 34, 140)),
      spot("po-velers", "velers", "Velers blancs. Algun dia en tindré un. O potser no.", rect(156, 94, 160, 42)),
      spot("po-mar", "mar", "La Mediterrània. Avui fa bona cara.", rect(0, 110, 320, 18)),
    ],
    objects: [],
    characters: [npc("quim", [196, 172], "left")],
  },
  platja: {
    description: "La platja de la Barceloneta: sorra, para-sols i el peix daurat.",
    walkable: ground(152), music: null, map: [560, 480],
    hotspots: [
      exit("pl-port", "Port Vell", leftEdge(152), "port", [292, 180]),
      spot("pl-peix", "peix daurat", "Un peix gegant de metall daurat. Aquest no es pot pescar.", rect(26, 88, 72, 26)),
      spot("pl-hotel", "hotel vela", "L'hotel en forma de vela, a la punta del port.", [[268, 30], [300, 124], [244, 124]]),
      spot("pl-mar", "mar", "Massa freda per banyar-s'hi a l'abril.", rect(0, 106, 320, 32)),
    ],
    objects: [],
    characters: [npc("tomas", [250, 168], "left")],
  },
  pg: {
    description: "El passeig del modernisme. La Casa Batlló sembla un drac adormit.",
    walkable: ground(156), music: "snd-carrer", map: [440, 150],
    hotspots: [
      exit("pg-pc", "Plaça de Catalunya", leftEdge(160), "pc", [292, 176]),
      exit("pg-sf", "Sagrada Família", rightEdge(162), "sf", [30, 160]),
      exit("pg-bus", "Parada del bus 24", rect(240, 96, 64, 54), "park", [40, 180], {
        conditions: [{ type: "has", objectId: O.bitllet, not: false }],
        blocked: "Necessito un bitllet per pujar al bus 24.",
      }),
      spot("pg-batllo", "Casa Batlló", "La Casa Batlló. El teulat és l'esquena del drac i la torre és l'espasa de Sant Jordi.", rect(92, 10, 136, 112)),
      spot("pg-fanal", "fanal", "Un fanal amb banc de trencadís. Aquí tot és art.", rect(80, 96, 14, 56)),
    ],
    objects: [],
    characters: [npc("anna", [176, 170], "left")],
  },
  sf: {
    description: "La Sagrada Família, sempre en obres.",
    walkable: [[[0, 156], [320, 156], [320, 199], [118, 199], [114, 164], [0, 164]]], music: null, map: [640, 150],
    hotspots: [
      exit("sf-pg", "Passeig de Gràcia", rect(0, 150, 18, 16), "pg", [292, 178]),
      exit("sf-metro", "Metro (L2 a Plaça de Catalunya)", rect(268, 158, 34, 22), "pc", [68, 162]),
      spot("sf-temple", "Sagrada Família", "Les torres de Gaudí. N'hi haurà divuit quan s'acabi... algun dia.", rect(80, 10, 168, 140)),
      spot("sf-grues", "grues", "Grues. Formen part del paisatge des de fa més de cent anys.", rect(18, 10, 40, 30)),
      spot("sf-llac", "estany", "Un estany amb el reflex del temple. I un ànec que em mira malament.", rect(10, 166, 100, 20)),
    ],
    objects: [],
    characters: [npc("manel", [200, 172], "left")],
  },
  mj: {
    description: "Montjuïc al capvespre, amb el Palau Nacional i la Font Màgica.",
    walkable: [[[0, 152], [80, 152], [92, 172], [228, 172], [240, 152], [320, 152], [320, 199], [0, 199]]], music: null, map: [180, 470],
    hotspots: [
      exit("mj-tele", "Telefèric al port", rect(4, 112, 44, 38), "port", [40, 180]),
      spot("mj-palau", "Palau Nacional", "El Palau Nacional. A dins hi ha un museu d'art romànic impressionant.", rect(100, 10, 120, 70)),
      spot("mj-panell", "panell de control", "El panell de control de la font. Té un botó vermell enorme.", rect(256, 122, 22, 30)),
      spot("mj-torres", "torres venecianes", "Les torres venecianes. Diuen que són còpies del campanar de Sant Marc.", rect(18, 40, 18, 70)),
    ],
    objects: [
      { objectId: O.font, position: [160, 152], walkTo: [160, 172], facing: "auto", layer: "back" },
      { objectId: O.ulleres, position: [112, 166], walkTo: [104, 178], facing: "right", layer: "front" },
    ],
    characters: [],
  },
  park: {
    description: "El Park Güell, amb el drac de trencadís i la ciutat als peus.",
    walkable: ground(156), music: "snd-tema", map: [480, 30],
    hotspots: [
      exit("pk-bus", "Bus 24 de tornada", leftEdge(158), "pg", [262, 172]),
      spot("pk-drac", "drac", "El drac del Park Güell. Bé, és una salamandra, però avui fa de drac.", [[112, 128], [190, 128], [190, 152], [112, 152]]),
      spot("pk-pavellons", "pavellons", "Semblen cases de pa de pessic. Com la de Hansel i Gretel.", rect(18, 70, 50, 82)),
      spot("pk-banc", "banc ondulat", "El banc de trencadís més llarg del món. O això diuen.", rect(0, 104, 320, 12)),
      spot("pk-vistes", "vistes", "Tota Barcelona als peus, i el mar al fons.", rect(0, 84, 320, 20)),
    ],
    objects: [],
    characters: [npc("laia", [236, 174], "left")],
  },
};

const scenes = SCENES.map(([key, name, draw]) => {
  const L = layout[key];
  return {
    id: `s-${key}`, name, description: L.description,
    background: file(`fons-${key}.png`, draw().png()),
    walkable: L.walkable, hotspots: L.hotspots,
    mapPosition: L.map, actorHeight: { near: 58, far: 46 },
    objects: L.objects, characters: L.characters,
    music: L.music, transition: key === "park" ? "iris" : "fade",
    onEnter: key === "park" ? { cutsceneId: "cs-park", once: true } : null,
    createdAt: now, updatedAt: now,
  };
});

/* ---------- Lògica ---------- */

const say = (text, by = null) => ({ type: "say", text, by: by && C[by] });
const take = (k) => ({ type: "take", objectId: O[k] });
const lose = (k) => ({ type: "lose", objectId: O[k] });
const sound = (id) => ({ type: "sound", soundId: id });
const setVar = (varId, value) => ({ type: "setVar", varId, op: "set", value });
const isVar = (varId, value) => ({ type: "var", varId, op: "==", value });
const obj = (k) => ({ kind: "object", id: O[k] });
const chr = (k) => ({ kind: "character", id: C[k] });
const hot = (id) => ({ kind: "hotspot", id });

const variables = [
  { id: "v-rosa", name: "rosa_donada", type: "bool", initial: false },
  { id: "v-llibre", name: "llibre_donat", type: "bool", initial: false },
];

let n = 0;
const rule = (verb, target, withRef, conditions, actions) => ({ id: `r-${++n}`, verb, target, with: withRef, conditions, actions });

const rules = [
  // Els intercanvis de la cadena: mapa → bitllet, pa → peix → moneda → rosa, ulleres → llibre
  rule("give", obj("mapa"), chr("anna"), [], [
    say("Un mapa! Els meus turistes sempre me'n demanen.", "anna"),
    lose("mapa"), take("bitllet"), sound("snd-exit"),
    say("Té, el bitllet del bus 24. Bon viatge al Park Güell!", "anna"),
  ]),
  rule("give", obj("pa"), chr("tomas"), [], [
    say("Pa! Beneït sigui. Porto des de l'alba amb la panxa buida.", "tomas"),
    lose("pa"), take("peix"), sound("snd-exit"),
    say("Té, el millor lluç del dia. Te l'has guanyat.", "tomas"),
  ]),
  rule("give", obj("peix"), chr("remei"), [], [
    say("Un lluç de la Barceloneta! Que bonic. Té, t'ho pago.", "remei"),
    lose("peix"), take("moneda"), sound("snd-moneda"),
  ]),
  rule("give", obj("moneda"), chr("florista"), [], [
    lose("moneda"), sound("snd-moneda"),
    say("Una rosa per al noi enamorat. Amb l'espiga i la senyera, com ha de ser.", "florista"),
    take("rosa"), sound("snd-exit"),
  ]),
  rule("give", obj("moneda"), chr("estatua"), [], [say("Millor me la guardo. La necessito per a la rosa.")]),
  rule("give", obj("ulleres"), chr("pere"), [], [
    say("Les meves ulleres! Ara hi torno a veure!", "pere"),
    lose("ulleres"), sound("snd-exit"),
    say("Té, el millor llibre de la parada. Un tracte és un tracte.", "pere"),
    take("llibre"),
  ]),
  // La Font Màgica: el panell l'apaga i deixa veure el que hi havia al fons
  rule("push", hot("mj-panell"), null, [{ type: "state", objectId: O.font, stateId: "font-engegada", not: false }], [
    sound("snd-clic"),
    { type: "setState", objectId: O.font, stateId: "font-apagada" },
    sound("snd-aigua"),
    { type: "setState", objectId: O.ulleres, stateId: "ulleres-visibles" },
    say("La font s'ha apagat... i al fons de la bassa brilla una cosa!"),
  ]),
  rule("push", hot("mj-panell"), null, [], [say("Millor la deixo apagada una estona.")]),
  rule("use", hot("mj-panell"), null, [], [say("Hauria d'empènyer el botó.")]),
  rule("look", obj("font"), null, [{ type: "state", objectId: O.font, stateId: "font-apagada", not: false }], [say("Ara l'aigua està quieta. Ja no fa tant d'efecte.")]),
  rule("pickup", obj("font"), null, [], [say("No em cap a la butxaca.")]),
  rule("look", obj("ulleres"), null, [], [say("Unes ulleres de pasta! Són les del llibreter?")]),
  // Laia: cal donar-li la rosa i el llibre; el segon regal fa el final
  rule("give", obj("rosa"), chr("laia"), [isVar("v-llibre", true)], [
    lose("rosa"), setVar("v-rosa", true), { type: "cutscene", cutsceneId: "cs-final" },
  ]),
  rule("give", obj("rosa"), chr("laia"), [], [
    lose("rosa"), setVar("v-rosa", true),
    say("Una rosa! Que bonica, Jordi.", "laia"),
    say("I... no t'oblides de res? És Sant Jordi: rosa i llibre!", "laia"),
  ]),
  rule("give", obj("llibre"), chr("laia"), [isVar("v-rosa", true)], [
    lose("llibre"), setVar("v-llibre", true), { type: "cutscene", cutsceneId: "cs-final" },
  ]),
  rule("give", obj("llibre"), chr("laia"), [], [
    lose("llibre"), setVar("v-llibre", true),
    say("El Tirant lo Blanc! Me'l volia llegir feia anys.", "laia"),
    say("Només falta una cosa... i fa olor de flor.", "laia"),
  ]),
  // Detalls i bromes
  rule("talk", chr("estatua"), null, [], [say("Hola?"), say("..."), say("Ni s'immuta. Quin ofici més dur.")]),
  rule("pickup", chr("estatua"), null, [], [say("Pesa massa. I crec que em denunciaria.")]),
  rule("use", obj("peix"), chr("estatua"), [], [say("No, que després fa pudor de peix tot el dia.")]),
  rule("give", obj("peix"), chr("tomas"), [], [say("Torna-me'l? No, no, és teu.", "tomas")]),
  rule("give", obj("rosa"), chr("florista"), [], [say("Aquesta ja és teva, maco. Dóna-la a qui toca!", "florista")]),
  rule("open", hot("go-porta"), null, [], [say("Hi ha missa. Millor no molestar.")]),
  rule("push", hot("pk-drac"), null, [], [say("Està ben enganxat. Fa més de cent anys que és aquí.")]),
  rule("talk", hot("pk-drac"), null, [], [say("Hola, drac. Avui ets el dolent de la història, eh?"), say("No diu res. Deu estar avergonyit.")]),
  rule("talk", hot("pc-coloms"), null, [], [say("Curru-currú?"), say("Em miren i marxen volant. Típic.")]),
  rule("pickup", hot("pc-coloms"), null, [], [say("Són massa ràpids. I massa bruts.")]),
  rule("use", obj("pa"), hot("pc-coloms"), [], [say("Ni parlar-ne: aquest pa és per a algú amb més gana que els coloms.")]),
  rule("give", obj("pa"), hot("pc-coloms"), [], [say("Ni parlar-ne: aquest pa és per a algú amb més gana que els coloms.")]),
  rule("use", obj("mapa"), null, [], [say("Segons el mapa, el bus 24 va al Park Güell des del Passeig de Gràcia.")]),
  rule("look", obj("mapa"), null, [{ type: "has", objectId: O.mapa, not: false }], [say("Segons el mapa, el bus 24 va al Park Güell des del Passeig de Gràcia.")]),
  rule("pickup", hot("pc-font"), null, [], [say("Agafar aigua amb les mans? Ja és prou difícil amb un got.")]),
];

// Diàlegs: nodes amb frases i opcions
let o = 0;
const opt = (text, next = null, { once = false, conditions = [], actions = [] } = {}) => ({ id: `op-${++o}`, text, once, conditions, actions, next });
const node = (id, lines, options) => ({ id, position: null, lines: lines.map(([by, text]) => ({ by: by && C[by], text })), options });
function dialogue(id, name, characterId, nodes) {
  // Distribueix els nodes en una graella perquè l'editor de diàlegs els mostri endreçats
  nodes.forEach((nd, i) => (nd.position = [40 + (i % 3) * 300, 40 + Math.floor(i / 3) * 220]));
  return { id, name, characterId: characterId && C[characterId], start: nodes[0].id, nodes };
}
const back = (k) => opt("Adéu.", null);

const dialogues = [
  dialogue("d-florista", "La florista", "florista", [
    node("fl-1", [["florista", "Bon dia de Sant Jordi! Vols una rosa, maco?"]], [
      opt("Quant val una rosa?", "fl-2"),
      opt("Per què regalem roses per Sant Jordi?", "fl-3"),
      opt("Adéu."),
    ]),
    node("fl-2", [["florista", "Una moneda, i te la poso amb espiga i senyera."], [null, "Una moneda... no en tinc cap."], ["florista", "Doncs a guanyar-te-la! A la Boqueria sempre hi ha feina."]], [opt("D'acord.", "fl-1")]),
    node("fl-3", [["florista", "Quan Sant Jordi va matar el drac, de la sang en va néixer un roser."], ["florista", "I ell en va collir una rosa per a la princesa."]], [opt("Que romàntic.", "fl-1")]),
  ]),
  dialogue("d-remei", "La Remei", "remei", [
    node("re-1", [["remei", "Peix fresc! Bé... quan n'hi ha."]], [
      opt("Què ha passat amb el peix?", "re-2"),
      opt("Em podria donar una moneda?", "re-3"),
      opt("Adéu."),
    ]),
    node("re-2", [["remei", "En Tomàs, el pescador de la Barceloneta, avui encara no m'ha portat res."], ["remei", "Si em portes un bon peix, te'l pago a bon preu."]], [opt("Hi pensaré.", "re-1")]),
    node("re-3", [["remei", "Una moneda per la cara? Ni pensar-ho! Porta'm un peix i en parlem."]], [opt("Entesos.", "re-1")]),
  ]),
  dialogue("d-pere", "El llibreter", "pere", [
    node("pe-1", [["pere", "Ai, ai, ai... Qui hi ha? Sense ulleres no hi veig tres en un burro."]], [
      opt("Sóc en Jordi. Què li passa?", "pe-2"),
      opt("Em vendria un llibre?", "pe-3"),
      opt("Adéu."),
    ]),
    node("pe-2", [["pere", "Ahir vaig anar a veure la Font Màgica de Montjuïc."], ["pere", "Em vaig acostar massa a l'aigua i plof! Les ulleres al fons de la bassa."]], [opt("Quina mala sort.", "pe-1")]),
    node("pe-3", [["pere", "Si em trobes les ulleres, et regalo el millor llibre de la parada."]], [opt("Tracte fet.", "pe-1")]),
  ]),
  dialogue("d-quim", "El mariner", "quim", [
    node("qu-1", [["quim", "Ei, grumet. Què busques pel port?"]], [
      opt("Com puc pujar a Montjuïc?", "qu-2"),
      opt("Coneixes la Font Màgica?", "qu-3"),
      opt("On puc trobar peix?", "qu-4"),
      opt("Adéu."),
    ]),
    node("qu-2", [["quim", "Amb el telefèric, aquí mateix. Les vistes valen la pena."]], [opt("Gràcies.", "qu-1")]),
    node("qu-3", [["quim", "La bassa amaga més tresors que el fons del port."], ["quim", "Hi ha un panell al costat: si l'empenys, l'aigua s'atura."]], [opt("Interessant...", "qu-1")]),
    node("qu-4", [["quim", "En Tomàs pesca a la Barceloneta, però diu que amb la panxa buida no hi ha qui piqui."]], [opt("Entesos.", "qu-1")]),
  ]),
  dialogue("d-tomas", "El pescador", "tomas", [
    node("to-1", [["tomas", "Avui els peixos piquen, però jo no tinc forces per estirar la canya."]], [
      opt("Em donaria un peix?", "to-2"),
      opt("Per què no té forces?", "to-3"),
      opt("Adéu."),
    ]),
    node("to-2", [["tomas", "Te'l canvio per una mica de pa. És just, no?"]], [opt("Molt just.", "to-1")]),
    node("to-3", [["tomas", "Porto des de l'alba sense esmorzar. Un pescador sense pa és com un vaixell sense vela."]], [opt("Vaja.", "to-1")]),
  ]),
  dialogue("d-anna", "La guia", "anna", [
    node("an-1", [["anna", "Benvingut al Passeig de Gràcia! Vols saber la llegenda de la Casa Batlló?"]], [
      opt("Sí, explica-me-la.", "an-2"),
      opt("Com arribo al Park Güell?", "an-3"),
      opt("Adéu."),
    ]),
    node("an-2", [["anna", "Diuen que el teulat és l'esquena del drac, i la torre és la llança de Sant Jordi clavada."], ["anna", "Els balcons són les calaveres de les seves víctimes. Brrr!"]], [opt("Quina por.", "an-1")]),
    node("an-3", [["anna", "Amb el bus 24, des d'aquella parada. Però cal bitllet."], ["anna", "Jo en tinc un de sobres... I m'aniria molt bé un mapa per als turistes."]], [opt("Ja en buscaré un.", "an-1")]),
  ]),
  dialogue("d-manel", "El paleta", "manel", [
    node("ma-1", [["manel", "Compte amb el casc! Aquí sempre estem en obres."]], [
      opt("Quan s'acabarà la Sagrada Família?", "ma-2"),
      opt("Tens res per menjar?", "ma-3", { once: true }),
      opt("Adéu."),
    ]),
    node("ma-2", [["manel", "L'any que ve. Ho diuen cada any, des de 1882."]], [opt("Ja ho veig.", "ma-1")]),
    node("ma-3", [["manel", "M'ha sobrat una barra de pa de l'esmorzar. Té, que fas cara de necessitar-la."]], [
      opt("Moltes gràcies!", "ma-1", { actions: [take("pa"), sound("snd-exit")] }),
    ]),
  ]),
  dialogue("d-laia", "La Laia", "laia", [
    node("la-1", [["laia", "Jordi! Ja pensava que no venies."]], [
      opt("Tinc una sorpresa per a tu...", "la-2"),
      opt("Que bonic que és el parc.", "la-3"),
      opt("Ara torno."),
    ]),
    node("la-2", [["laia", "Ah sí? Doncs ensenya-me-la!"], [null, "(Li hauria de donar els regals.)"]], [opt("Un moment...", "la-1")]),
    node("la-3", [["laia", "Sí... però avui m'importen més altres coses."]], [opt("Ja ho entenc.", "la-1")]),
  ]),
];

const walk = (point, by = null, scene = null) => ({ type: "walk", point, by: by && C[by], sceneId: scene && `s-${scene}` });
const cutscenes = [
  { id: "cs-intro", name: "Introducció", actions: [
    { type: "music", soundId: "snd-tema" },
    walk([160, 180], null, "pc"),
    say("Avui és Sant Jordi, i he quedat amb la Laia al Park Güell."),
    say("Li he de portar una rosa i un llibre, com mana la tradició."),
    say("Però no tinc ni un cèntim... Hauré d'espavilar."),
  ] },
  { id: "cs-park", name: "Arribada al Park Güell", actions: [
    walk([200, 178], null, "park"),
    say("Jordi! Ja pensava que no venies.", "laia"),
    say("No em perdria Sant Jordi amb tu per res del món."),
  ] },
  { id: "cs-final", name: "Final", actions: [
    { type: "music", soundId: "snd-final" },
    say("Una rosa i un llibre... Ets el meu Sant Jordi!", "laia"),
    say("I tu la meva princesa. Però sense drac, eh?"),
    { type: "wait", seconds: 1 },
    say("Ja ho tinc! Mira, aquí ho he escrit.", "laia"),
    say("«Per a en Jordi, que ha travessat tota Barcelona per mi.»", "laia"),
    { type: "end", text: "Bona diada de Sant Jordi!" },
  ] },
];

/* ---------- Pantalla de títol ---------- */

const title = parkGuell({ sign: false });
title.rect(40, 18, 240, 44, [20, 30, 60, 200]);
const t1 = "LA ROSA", t2 = "DE SANT JORDI";
title.text(160 - Canvas.textWidth(t1, 3) / 2 + 1, 23, t1, "#5a0a10", 3);
title.text(160 - Canvas.textWidth(t1, 3) / 2, 22, t1, "#e8394a", 3);
title.text(160 - Canvas.textWidth(t2, 2) / 2, 46, t2, "#f2c52b", 2);
const bigRose = S.rosa();
for (let y = 0; y < bigRose.h; y++) for (let x = 0; x < bigRose.w; x++) { const p = bigRose.get(x, y); if (p[3]) title.rect(270 + x * 3, 120 + y * 3, 3, 3, p); }

/* ---------- Tot junt ---------- */

const adventure = {
  title: "La rosa de Sant Jordi",
  description: "Una aventura gràfica per Barcelona. En Jordi ha de trobar una rosa i un llibre per a la Laia abans d'arribar al Park Güell. Deu escenaris, de la Plaça de Catalunya a Montjuïc.",
  formatVersion: 9,
  createdAt: now, updatedAt: now,
  startSceneId: "s-pc",
  scenes, verbs: DEFAULT_VERBS, objects, variables, rules, characters,
  playerId: C.jordi, dialogues, sounds, cutscenes,
  introCutsceneId: "cs-intro",
  titleScreen: { image: file("titol.png", title.png()), subtitle: "Una aventura per Barcelona", music: "snd-tema" },
  credits: "Guió, dibuixos i música generats amb tools/barcelona.\nFet amb l'editor d'aventures gràfiques.",
  cursor: "cross",
};

const out = zip([{ name: "adventure.json", data: Buffer.from(JSON.stringify(adventure, null, 2)) }, ...files]);
const args = process.argv.slice(2);
const imp = args.indexOf("--import");
const target = args.find((a, i) => !a.startsWith("--") && (imp < 0 || i !== imp + 1)) ?? new URL("./la-rosa-de-sant-jordi.zip", import.meta.url).pathname;
writeFileSync(target, out);
console.log(`${target}: ${(out.length / 1024).toFixed(0)} kB, ${scenes.length} escenaris, ${characters.length} personatges, ${objects.length} objectes, ${rules.length} regles`);
if (imp >= 0) {
  const base = args[imp + 1] ?? "http://localhost:8821";
  const res = await fetch(`${base}/api/import`, { method: "POST", body: out, headers: { "content-type": "application/zip" } });
  const body = await res.json();
  if (!res.ok) throw new Error(`No s'ha pogut importar: ${JSON.stringify(body)}`);
  console.log(`Importada: ${base}/#/aventura/${body.id}`);
}
