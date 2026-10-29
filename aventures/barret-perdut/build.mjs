// «Harry Potter i el Barret Desaparegut»: aventura gràfica de 20 escenaris amb els decorats dibuixats en
// perspectiva per codi (castell.mjs, fora.mjs). Feta amb el skill aventura-grafica. Executa: node build.mjs
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const K = await import(new URL("../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const {
  Project, Canvas, SFX, song, characterSheet,
  spot, exit, npc, place, obj, chr, hot, hasItem, inState, isVar, said,
  say, take, lose, setState, setVar, goto, wait, walk, talkTo, sound, music, cutscene, end, rule, dialogue, node, opt,
} = K;
const CA = await import(new URL("./castell.mjs", import.meta.url));
const FO = await import(new URL("./fora.mjs", import.meta.url));
const F = await import(new URL("./figures.mjs", import.meta.url));
const HERE = dirname(fileURLToPath(import.meta.url));

const P = new Project({
  title: "Harry Potter i el Barret Desaparegut",
  description: "La nit de Halloween algú ha robat el Barret Seleccionador i ha deixat Dumbledore adormit amb un encanteri. En Harry té fins a l'alba per trobar el barret i despertar el director.",
});

/* ---------- Música i sons ---------- */
P.sound("so-tema", "Tema de Hogwarts", song(126, [
  { wave: "pulse", vol: 0.13, decay: 1.2, notes: `E4:1 G4:1 B4:1 A4:2 G4:1 F#4:1 G4:1 E4:1 D4:3
    E4:1 G4:1 B4:1 D5:2 C5:1 B4:1 A4:1 F#4:1 E4:3
    B4:1 C5:1 D5:1 E5:2 D5:1 C5:1 B4:1 A4:1 B4:3
    G4:1 A4:1 B4:1 A4:1 G4:1 F#4:1 E4:3 -:3` },
  { wave: "triangle", vol: 0.24, decay: 0.6, notes: `E2:3 C3:3 A2:3 B2:3 E2:3 G2:3 A2:3 E2:3 G2:3 C3:3 D3:3 G2:3 E2:3 B2:3 E2:3 E2:3` },
  { wave: "sine", vol: 0.06, decay: 2, notes: `-:1 B3:1 E4:1 -:1 C4:1 E4:1 -:1 A3:1 C4:1 -:1 B3:1 D#4:1 -:1 B3:1 E4:1 -:1 B3:1 D4:1 -:1 A3:1 C4:1 -:1 G3:1 B3:1
    -:1 B3:1 D4:1 -:1 C4:1 E4:1 -:1 D4:1 F#4:1 -:1 B3:1 D4:1 -:1 B3:1 E4:1 -:1 B3:1 D#4:1 -:1 G3:1 B3:1 -:1 G3:1 B3:1` },
], 2));
P.sound("so-castell", "Passadissos del castell", song(84, [
  { wave: "triangle", vol: 0.2, decay: 0.8, notes: `A2:2 E3:2 A2:2 E3:2 F2:2 C3:2 F2:2 C3:2 D2:2 A2:2 E2:2 B2:2` },
  { wave: "pulse", vol: 0.08, decay: 2.2, notes: `-:2 C5:1 B4:1 A4:2 E4:2 -:2 A4:1 B4:1 C5:2 A4:2 -:2 F4:1 G4:1 A4:3 G#4:1` },
], 3));
P.sound("so-fora", "Nit als jardins", song(96, [
  { wave: "sine", vol: 0.16, decay: 1.4, notes: `D5:1 A4:1 F#4:1 A4:1 G5:2 F#5:1 E5:1 D5:1 A4:1 F#4:1 E4:1 D4:4
    B4:1 D5:1 F#5:1 E5:1 D5:2 B4:2 A4:1 G4:1 F#4:1 E4:1 D4:4` },
  { wave: "triangle", vol: 0.2, decay: 0.7, notes: `D3:4 G2:4 D3:4 A2:4 B2:4 G2:4 A2:4 D3:4` },
], 2));
P.sound("so-bosc", "El Bosc Prohibit", song(70, [
  { wave: "triangle", vol: 0.22, decay: 0.5, notes: `E2:2 -:1 E2:1 F2:2 -:2 E2:2 -:1 E2:1 D#2:2 -:2` },
  { wave: "square", vol: 0.04, decay: 3, notes: `-:3 B4:1 -:4 -:3 C5:1 -:2 A#4:2` },
], 3));
P.sound("so-final", "Final", song(120, [
  { wave: "pulse", vol: 0.15, decay: 1.2, notes: `G4:1 C5:1 E5:1 G5:2 E5:1 F5:1 D5:1 B4:1 C5:2 -:1
    E5:1 F5:1 G5:1 A5:2 G5:1 F5:1 E5:1 D5:1 C5:4` },
  { wave: "triangle", vol: 0.24, decay: 0.6, notes: `C3:2 G2:2 C3:2 G2:2 F2:2 G2:2 C3:2 E3:2 F3:2 C3:2 G2:2 C3:2 C3:2 G2:2` },
], 2));
P.sound("so-exit", "Aconseguit", SFX.success());
P.sound("so-clic", "Clic", SFX.click());
P.sound("so-aigua", "Aigua", SFX.water());
P.sound("so-moneda", "Dring", SFX.coin());

/* ---------- Escenaris (els dibuixos) ---------- */
// Estil dels decorats (textura.mjs): A pedra i torxes, B lluna i molsa, C aquarel·la, D retro 32 colors
const T = await import(new URL("./textura.mjs", import.meta.url));
const ESTIL = T.ESTILS.find((e) => e.id === "D");
const FNS = { ...CA, ...FO };
const S = Object.fromEntries(["dormitori", "comuna", "escala", "vestibul", "gransalo", "biblioteca", "masmorra", "lavabo", "cuines", "gargola",
  "despatx", "astronomia", "setena", "sala", "jardins", "cabana", "hivernacle", "quidditch", "bosc", "llac"]
  .map((k) => [k, T.render(FNS[k], ESTIL, { outdoor: T.OUTDOOR.has(k) })]));

// Un punt dins de la zona caminable a prop d'un altre (per on es posa el protagonista per tocar una cosa)
const inside = (poly, [x, y]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
function walkNear(sc, [x, y]) {
  const ok = (p) => sc.walk.some((w) => inside(w, p));
  for (let d = 0; d < 120; d++) for (const p of [[x, y + d], [x - d, y + d], [x + d, y + d], [x - d, y], [x + d, y]]) if (ok(p)) return p.map(Math.round);
  throw new Error(`No trobo terra a prop de ${x},${y}`);
}
// Un objecte dibuixat dins d'un escenari: [idEstat, nom] per a cada imatge del retall (null = invisible)
function sobj(sc, key, { id, name, description, states = [["normal", "Normal"]], imgs, pickable = false, initial, walkTo, layer = "auto", icon }) {
  const o = sc.objs[key];
  const images = imgs ?? o.imgs;
  P.object({ id, name, description, pickable, states: states.map(([s, n], i) => [s, n, images[i] ?? null]), initial, icon });
  return place(id, o.pos, walkNear(sc, walkTo ?? o.pos), { layer });
}
// Un objecte que només és a l'inventari
const inv = (id, name, description, key) => P.object({ id, name, description, pickable: true, states: [["normal", "Normal", F.ICONS[key]()]] });

/* ---------- Personatges ---------- */
const pj = (id, name, description, color, look) => P.character({ id, name, description, color, look });
pj("c-harry", "Harry", "Sóc jo, en Harry Potter. Ulleres rodones, cicatriu en forma de llamp i un talent especial per ficar-me en embolics.", "#ffffff", F.LOOKS.harry);
pj("c-ron", "Ron", "En Ron Weasley, el meu millor amic. Ara mateix, sobretot, un estómac amb cames.", "#f4a460", F.LOOKS.ron);
pj("c-hermione", "Hermione", "L'Hermione Granger. Si no ho sap ella, no ho sap ningú. I si ho sap, t'ho explicarà dues vegades.", "#f0c0e0", F.LOOKS.hermione);
pj("c-neville", "Neville", "En Neville Longbottom, en pijama. Té cara d'haver perdut alguna cosa. És la seva cara de sempre.", "#a8d8ff", F.LOOKS.neville);
pj("c-mcgonagall", "professora McGonagall", "La professora McGonagall, cap de Gryffindor. Té els llavis tan prims que gairebé no hi són.", "#9ad89a", F.LOOKS.mcgonagall);
pj("c-dumbledore", "Dumbledore", "El professor Dumbledore, director de Hogwarts... dormint dret, amb un somriure. Deu somiar en caramels.", "#c8a8ff", F.LOOKS.dumbledore);
pj("c-snape", "professor Snape", "El professor Snape. Cabells greixosos, nas ganxut i una antipatia per mi que ve de lluny.", "#b0b0c0", F.LOOKS.snape);
P.character({ id: "c-hagrid", name: "Hagrid", description: "En Hagrid, el guardabosc. És el doble d'alt que una persona normal i el triple de bona persona.", color: "#e0b080",
  sheet: F.scale(characterSheet(F.LOOKS.hagrid), 2), frameWidth: 32, frameHeight: 64 });
pj("c-pince", "Madame Pince", "Madame Pince, la bibliotecària. Sembla un voltor que vigila llibres.", "#d0c0e0", F.LOOKS.pince);
pj("c-filch", "Filch", "L'Argus Filch, el conserge. Odia els alumnes, en Peeves i, per aquest ordre, el bon humor.", "#d8c890", F.LOOKS.filch);
pj("c-peeves", "Peeves", "En Peeves, el poltergeist del castell. Un fantasma no, una plaga.", "#ff9a4a", F.LOOKS.peeves);
P.character({ id: "c-nick", name: "Nick Quasi Decapitat", description: "En Nick Quasi Decapitat, el fantasma de Gryffindor. El cap li penja d'un fil de pell. Literalment.", color: "#d8e8ff", sheet: F.ghostSheet(F.LOOKS.nick) });
P.character({ id: "c-myrtle", name: "Myrtle", description: "La Myrtle, el fantasma que viu al lavabo de les noies. Plora més que una aixeta espatllada.", color: "#c0f0e0", sheet: F.ghostSheet(F.LOOKS.myrtle) });
P.character({ id: "c-baro", name: "Baró Sagnant", description: "El Baró Sagnant, el fantasma de Slytherin. Va cobert de taques platejades i fa una cara de pomes agres.", color: "#e8b0c0", sheet: F.ghostSheet(F.LOOKS.baro, 175) });
P.character({ id: "c-dobby", name: "Dobby", description: "En Dobby, l'elf domèstic. Orelles de ratpenat, ulls com pilotes de tennis i una coixinera per roba.", color: "#a8f0a0", ...F.dobbySheet(), animations: F.DOBBY_ANIM });
pj("c-draco", "Draco", "En Draco Malfoy. Cabells engominats i un somriure que demana un cop de puny.", "#c0f0c0", F.LOOKS.draco);
pj("c-sprout", "professora Sprout", "La professora Sprout, d'Herbologia. Va tota plena de terra i fa olor de fems. Això és bo, en el seu cas.", "#c8e078", F.LOOKS.sprout);
pj("c-hooch", "Madame Hooch", "Madame Hooch, la professora de vol. Ulls grocs de falcó i cabells grisos de punta.", "#f0e070", F.LOOKS.hooch);
P.character({ id: "c-firenze", name: "Firenze", description: "En Firenze, un centaure de cabells rossos i ulls d'un blau impossible. Mira les estrelles com qui llegeix el diari.", color: "#a0d0ff", ...F.firenzeSheet() });
pj("c-luna", "Luna", "La Luna Lovegood, de Ravenclaw. Porta arracades de raves i parla com si sabés coses que tu no saps. Potser és així.", "#e0e0ff", F.LOOKS.luna);

/* ---------- Variables ---------- */
const V = (id, name, type = "bool") => P.variable(id, name, type);
V("v-grassa", "contrasenya_dama"); V("v-pera", "pera_pessigolles"); V("v-filch", "filch_fora"); V("v-recepta", "recepta");
V("v-snape", "snape_permet"); V("v-ingr", "ingredients", "number"); V("v-mart", "mart_vist"); V("v-sprout", "sprout_permet");
V("v-myrtle", "myrtle_contenta"); V("v-peeves", "peeves_confessa"); V("v-dobby", "dobby_explica"); V("v-sala", "sala_oberta");
V("v-dalt", "dalt_dels_trastos"); V("v-barret", "barret_content"); V("v-despert", "dumbledore_despert");

/* ---------- Objectes de l'inventari (sense lloc a cap escenari) ---------- */
inv("o-varita", "vareta", "La meva vareta: grèvol i ploma de fènix, onze polzades. Fa coses, si les demano bé.", "varita");
inv("o-capa", "capa invisible", "La capa invisible que era del meu pare. Si me la poso, ningú no em veu. Ideal per anar on no em deixen anar.", "capa");
inv("o-flauta", "flauta", "La flauta de fusta que em va tallar en Hagrid. Només sé tocar-ne una cançó... i malament. Però els animals la troben preciosa.", "flauta");
inv("o-nota", "paper d'en Neville", "Hi diu, amb la lletra tremolosa d'en Neville: «CONTRASENYA: CAP DE DRAC».", "nota");
inv("o-orelleres", "orelleres", "Unes orelleres de pelfa rosa d'Herbologia. Per arrencar mandràgores sense quedar-se sord.", "orelleres");
inv("o-bomba", "bomba fètida", "Una bomba fètida dels bessons Weasley. Fa olor de mitjons de troll. Millor no obrir-la a prop meu.", "bomba");
inv("o-invitacio", "invitació", "«En Nick Quasi Decapitat us convida a la celebració del seu 505è aniversari de mort. Vestit: fúnebre.»", "invitacio");
inv("o-permis", "permís", "Un permís signat per la professora McGonagall: «Autoritzo el senyor Potter a fer servir un calder de la masmorra.»", "permis");
inv("o-flasco-buit", "flascó buit", "Un flascó de vidre buit. Fa olor de plimpy.", "flasco-buit");
inv("o-flasco-aigua", "flascó amb aigua", "Aigua del Llac Negre. Freda com el cor de l'Snape.", "flasco-aigua");
inv("o-pocio", "poció despertadora", "Una poció daurada que fa pampallugues. Desperta fins i tot els morts... bé, quasi.", "pocio");
inv("o-fulla", "fulla de mandràgora", "Una fulla de mandràgora. Encara es mou una mica.", "fulla");
inv("o-pel", "pèl d'unicorn", "Un pèl d'unicorn, platejat i lleuger com un raig de lluna.", "pel");
inv("o-ploma", "ploma de fènix", "Una ploma de Fawkes, vermella i daurada. És calenta, com si encara tingués foc a dins.", "ploma");
inv("o-cadena", "cadena del Baró", "Una de les cadenes del Baró Sagnant. Rovellada, freda i molt sorollosa.", "cadena");
inv("o-pastis", "pastís de carbassa", "Un pastís de carbassa sencer, encara calent. En Ron em vendria la seva germana per aquest pastís.", "pastis");
inv("o-escombra", "escombra", "Una escombra de l'escola. No és la meva Nimbus, però vola recte (gairebé).", "escombra");
inv("o-paraigua", "paraigua rosa", "El paraigua rosa d'en Hagrid. Pesa més del que sembla. Diria que hi ha alguna cosa amagada a dins...", "paraigua");
inv("o-llanterna", "llanterna", "La llanterna d'en Hagrid. Fa una llum ben càlida. Amb això ja puc entrar al bosc.", "llanterna");
inv("o-recepta", "recepta", "La recepta de la Poció Despertadora, amb la lletra de l'Hermione: aigua del Llac Negre, fulla de mandràgora, pèl d'unicorn i ploma de fènix. Barrejar al calder i escalfar amb un encanteri de foc. Embotellar.", "recepta");
inv("o-cromo", "cromo de Dumbledore", "Un cromo de les granotes de xocolata: «Albus Dumbledore. Li agraden la música de cambra i els caramels de llimona.» Ara el cromo s'ha adormit.", "cromo");

/* ---------- Escenaris ---------- */
const ex = (id, name, poly, to, at, opts) => exit(id, name, poly, to, walkNear(S[to.slice(2)], at), opts);
const go = (to, at) => goto(to, walkNear(S[to.slice(2)], at));
const SP = (sc, k) => S[sc].spots[k];
const PT = (sc, k) => S[sc].pts[k];
const filchImg = F.resize(F.frame(characterSheet(F.LOOKS.filch), 4), S.vestibul.cam.h(PT("vestibul", "filch")[1]));
const filchFig = new Canvas(filchImg.w + (filchImg.w % 2), filchImg.h); filchFig.draw(filchImg, 0, 0);

// 1. Dormitori
P.scene({ id: "s-dormitori", name: "Dormitori de Gryffindor", background: S.dormitori.bg, walkable: S.dormitori.walk, actorHeight: S.dormitori.ah, music: "so-castell",
  description: "El dormitori dels nois de segon, a la torre de Gryffindor.",
  hotspots: [
    ex("ex-dorm-comuna", "escala de la sala comuna", SP("dormitori", "porta"), "s-comuna", PT("comuna", "deDormitori")),
    spot("ho-dorm-finestra", "finestra", "Lluna plena sobre el Bosc Prohibit. Una nit perfecta per quedar-se al llit. Llàstima.", SP("dormitori", "finestra")),
    spot("ho-dorm-llitron", "llit d'en Ron", "El llit d'en Ron. Està buit: deu ser a la sala comuna jugant als escacs. O menjant. O totes dues coses.", SP("dormitori", "llitRon")),
    spot("ho-dorm-llitharry", "el meu llit", "El meu llit. Encara és calent. M'hi tornaria a ficar ara mateix.", SP("dormitori", "llitHarry")),
    spot("ho-dorm-llitneville", "llit d'en Neville", "El llit d'en Neville. Sota el coixí hi ha una Recordadora vermella. Vol dir que ha oblidat alguna cosa. Sempre és vermella.", SP("dormitori", "llitNeville")),
  ],
  objects: [
    sobj(S.dormitori, "bagul", { id: "o-bagul", name: "bagul", description: "El meu bagul de l'escola, amb les meves inicials. H.J.P.", states: [["tancat", "Tancat"], ["obert", "Obert"]] }),
    sobj(S.dormitori, "mitjo", { id: "o-mitjo", name: "mitjó", description: "Un mitjó desaparellat, ple de pols. No és meu. No vull saber de qui és.", pickable: true }),
    sobj(S.dormitori, "bufanda", { id: "o-bufanda", name: "bufanda", description: "La meva bufanda de Gryffindor, vermella i daurada. Ideal per a llocs alts i freds.", pickable: true, layer: "back" }),
  ],
  characters: [npc("c-neville", PT("dormitori", "neville"), "right")],
});
// 2. Sala comuna
P.scene({ id: "s-comuna", name: "Sala comuna de Gryffindor", background: S.comuna.bg, walkable: S.comuna.walk, actorHeight: S.comuna.ah, music: "so-castell",
  description: "La sala comuna, amb el foc encara encès.",
  hotspots: [
    ex("ex-comuna-dorm", "escala dels dormitoris", SP("comuna", "dormitori"), "s-dormitori", PT("dormitori", "arribada")),
    ex("ex-comuna-retrat", "forat del retrat", SP("comuna", "retrat"), "s-escala", PT("escala", "deComuna")),
    spot("ho-comuna-tauler", "tauler d'anuncis", "«Proves de Quidditch dissabte.» «Es busca gripau (respon al nom de Trevor).» «Prohibit fer explotar coses a la sala comuna. — Prof. McGonagall.» Aquest últim és per als bessons.", SP("comuna", "tauler")),
    spot("ho-comuna-foc", "llar de foc", "Les brases encara cremen. Fa una calor que adorm.", SP("comuna", "foc")),
    spot("ho-comuna-lleo", "estendard", "El lleó de Gryffindor. Valor, coratge i, sovint, poc seny.", SP("comuna", "estendard")),
    spot("ho-comuna-butaques", "butaques", "Les butaques més còmodes del castell. Si m'hi assec, no m'aixeco fins dijous.", SP("comuna", "butaques")),
  ],
  objects: [
    sobj(S.comuna, "escacs", { id: "o-escacs", name: "escacs", description: "Els escacs de mag d'en Ron. Les peces es barallen soles. El cavall negre m'acaba de fer una botzina.", layer: "back", walkTo: walkNear(S.comuna, [70, 160]) }),
    sobj(S.comuna, "quisquiller", { id: "o-quisquiller", name: "Quisquiller", description: "Un número vell del Quisquiller, la revista del pare de la Luna Lovegood. Portada: «VAIG SER SEGRESTAT PER UN NARGLE».", pickable: true, layer: "back", walkTo: walkNear(S.comuna, [250, 150]) }),
  ],
  characters: [npc("c-ron", PT("comuna", "ron"), "left")],
});
// 3. Escala Gran
P.scene({ id: "s-escala", name: "Escala Gran", background: S.escala.bg, walkable: S.escala.walk, actorHeight: S.escala.ah, music: "so-castell",
  description: "Un replà de l'Escala Gran. Les escales es mouen quan els ve de gust.",
  hotspots: [
    ex("ex-escala-biblio", "biblioteca", SP("escala", "biblioteca"), "s-biblioteca", PT("biblioteca", "arribada")),
    ex("ex-escala-gargola", "passadís de la gàrgola", SP("escala", "gargola"), "s-gargola", PT("gargola", "arribada")),
    ex("ex-escala-lavabo", "lavabos", SP("escala", "lavabo"), "s-lavabo", PT("lavabo", "arribada")),
    ex("ex-escala-amunt", "escala amunt", SP("escala", "amunt"), "s-setena", PT("setena", "arribada")),
    ex("ex-escala-avall", "escala avall", SP("escala", "avall"), "s-vestibul", PT("vestibul", "deEscala")),
    spot("ho-escala-escales", "escales mòbils", "Les escales es mouen. Divendres n'hi ha una que porta a un lloc diferent. Diuen.", SP("escala", "escales")),
    spot("ho-escala-q1", "retrat del cavaller", "Un mag amb barba groga que em saluda amb el barret. Darrere seu, un ase llegeix el diari.", SP("escala", "quadre1")),
    spot("ho-escala-q2", "retrat de la bruixa", "Una bruixa que fa punt amb les agulles... i les agulles fan punt amb ella.", SP("escala", "quadre2")),
  ],
  objects: [sobj(S.escala, "grassa", { id: "o-grassa", name: "Dama Grassa", description: "La Dama Grassa, amb el seu vestit rosa. Guarda l'entrada de la torre de Gryffindor. Sense contrasenya, no hi ha res a fer.", layer: "back", walkTo: walkNear(S.escala, [60, 140]) })],
});
// 4. Vestíbul
P.scene({ id: "s-vestibul", name: "Vestíbul", background: S.vestibul.bg, walkable: S.vestibul.walk, actorHeight: S.vestibul.ah, music: "so-castell",
  description: "El gran vestíbul de l'entrada.",
  hotspots: [
    ex("ex-vest-porta", "porta principal", SP("vestibul", "porta"), "s-jardins", PT("jardins", "deCastell"), { conditions: [isVar("v-filch", true)], blocked: "En Filch no deixa sortir ningú. M'hauria de treure'l del davant." }),
    ex("ex-vest-saló", "Gran Saló", SP("vestibul", "gransalo"), "s-gransalo", PT("gransalo", "deVestibul")),
    ex("ex-vest-escala", "Escala Gran", SP("vestibul", "escala"), "s-escala", PT("escala", "deVestibul")),
    ex("ex-vest-masmorres", "escala de les masmorres", SP("vestibul", "masmorres"), "s-masmorra", PT("masmorra", "arribada")),
    ex("ex-vest-cuines", "forat del quadre", SP("vestibul", "cuines"), "s-cuines", PT("cuines", "arribada"), { conditions: [isVar("v-pera", true)], blocked: "Només és un quadre." }),
    spot("ho-vest-rellotges", "rellotges de punts", "Els rellotges de sorra amb els punts de les cases. Gryffindor va primer! Bé, de moment. L'Snape encara no s'ha llevat.", SP("vestibul", "rellotges")),
  ],
  objects: [
    sobj(S.vestibul, "porta", { id: "o-porta", name: "porta principal", description: "La porta principal del castell. Al darrere, els jardins i la nit.", states: [["tancada", "Tancada"], ["oberta", "Oberta"]], layer: "back", walkTo: PT("vestibul", "dePorta") }),
    sobj(S.vestibul, "pera", { id: "o-pera", name: "quadre de fruita", description: "Un bodegó amb un bol de fruita. La pera verda sembla que em miri. I que tingui pessigolles.", states: [["quadre", "Quadre"], ["obert", "Obert"]], layer: "back", walkTo: PT("vestibul", "deCuines") }),
    { ...(() => { P.object({ id: "o-filch", name: "Filch", description: "L'Argus Filch, el conserge, plantat davant la porta com un pal de paller. La seva gata, la senyora Norris, deu ser per aquí.", states: [["hi", "Hi és", filchFig], ["fora", "Fora", null]] }); return place("o-filch", PT("vestibul", "filch"), walkNear(S.vestibul, [176, 132])); })() },
  ],
});
// 5. Gran Saló
P.scene({ id: "s-gransalo", name: "Gran Saló", background: S.gransalo.bg, walkable: S.gransalo.walk, actorHeight: S.gransalo.ah, music: "so-castell",
  description: "El Gran Saló després del banquet de Halloween. Les carbasses encara suren.",
  hotspots: [
    ex("ex-salo-vest", "cap al vestíbul", SP("gransalo", "vestibul"), "s-vestibul", PT("vestibul", "deGransalo")),
    spot("ho-salo-sostre", "sostre encantat", "El sostre està encantat perquè sembli el cel de fora. Si plou, no et mulles. Si fa sol, no et bronzeges.", SP("gransalo", "sostre")),
    spot("ho-salo-prof", "taula dels professors", "La taula dels professors. La cadira daurada del mig, la de Dumbledore, és buida aquesta nit.", SP("gransalo", "professors")),
    spot("ho-salo-taules", "taules de les cases", "Les taules llargues, plenes de molles de pastís de carbassa. Els elfs ja ho deuen haver netejat tot, a sota.", SP("gransalo", "taules")),
    spot("ho-salo-taules2", "taules de les cases", "La taula de Ravenclaw i la de Slytherin. Algú hi ha gravat «SNAPE ÉS UN...». La resta està ratllada.", SP("gransalo", "taules2")),
    spot("ho-salo-estendards", "estendards", "Els estendards de les quatre cases: Gryffindor, Slytherin, Hufflepuff i Ravenclaw.", SP("gransalo", "estendards")),
  ],
  objects: [sobj(S.gransalo, "xiulet", { id: "o-xiulet", name: "xiulet", description: "Un xiulet platejat, sota la taula dels professors. Té gravat «R. H.».", pickable: true, walkTo: PT("gransalo", "xiuletWalk") })],
  characters: [npc("c-nick", PT("gransalo", "nick"), "left")],
});
// 6. Biblioteca
P.scene({ id: "s-biblioteca", name: "Biblioteca", background: S.biblioteca.bg, walkable: S.biblioteca.walk, actorHeight: S.biblioteca.ah, music: "so-castell",
  description: "La biblioteca, amb la Secció Prohibida al fons.",
  hotspots: [
    ex("ex-biblio-escala", "sortida", SP("biblioteca", "sortida"), "s-escala", PT("escala", "deBiblioteca")),
    spot("ho-biblio-prest", "prestatgeries", "Milers de llibres. «Arbres carnívors del món», «Com fer-se amic d'un drac (i sobreviure-hi)», «Història de la màgia, vol. 47».", SP("biblioteca", "prestatges")),
    spot("ho-biblio-prest2", "prestatgeries", "«Quidditch a través dels temps». Algú hi ha posat un punt de llibre a la pàgina de les lesions més greus.", SP("biblioteca", "prestatges2")),
    spot("ho-biblio-prohibida", "Secció Prohibida", "La Secció Prohibida: llibres encadenats, llibres que xiuxiuegen i llibres que mosseguen. Sense permís no s'hi pot entrar... si et veuen.", SP("biblioteca", "prohibida")),
    spot("ho-biblio-taula", "taula de lectura", "La taula de l'Hermione: dotze llibres oberts, tres plomes i un pergamí de dos metres. Per a un treball de deu centímetres.", SP("biblioteca", "taula")),
    spot("ho-biblio-taulell", "taulell", "El taulell de Madame Pince. Hi ha un cartell: «ELS LLIBRES ES TORNEN SENCERS, SECS I SENSE MOSSEGADES».", SP("biblioteca", "taulell")),
  ],
  objects: [
    sobj(S.biblioteca, "corda", { id: "o-corda", name: "cordó", description: "Un cordó vermell que barra el pas a la Secció Prohibida. No és gaire alt... però Madame Pince té ulls al clatell.", walkTo: PT("biblioteca", "cordaWalk") }),
    sobj(S.biblioteca, "llibre", { id: "o-llibre", name: "Pocions Molt Potents", description: "Un llibre negre encadenat a un faristol: «Pocions Molt Potents». Ja hi som.", layer: "back", walkTo: PT("biblioteca", "llibreWalk") }),
  ],
  characters: [npc("c-hermione", PT("biblioteca", "hermione"), "right"), npc("c-pince", PT("biblioteca", "pince"), "left")],
});
// 7. Masmorra
P.scene({ id: "s-masmorra", name: "Masmorra de Pocions", background: S.masmorra.bg, walkable: S.masmorra.walk, actorHeight: S.masmorra.ah, music: "so-bosc",
  description: "L'aula de Pocions, a les masmorres. Fa fred i fa olor de coses mortes en pots.",
  hotspots: [
    ex("ex-masm-vest", "escala del vestíbul", SP("masmorra", "escala"), "s-vestibul", PT("vestibul", "deMasmorra")),
    spot("ho-masm-pots", "pots", "Pots amb coses flotant en líquids de colors. Ulls, cues, una cosa que fa pampallugues... Prefereixo no saber-ho.", SP("masmorra", "pots")),
    spot("ho-masm-pissarra", "pissarra", "«FILTRE DE LA PAU». Els deures de la setmana. Si el fas malament, adorms la classe sencera. Hum... adormir. Algú ha fet servir alguna cosa semblant amb Dumbledore?", SP("masmorra", "pissarra")),
    spot("ho-masm-armari", "armari d'ingredients", "L'armari privat de l'Snape. Té un cadenat amb cara de pocs amics.", SP("masmorra", "armari")),
  ],
  objects: [sobj(S.masmorra, "calder", { id: "o-calder", name: "calder", description: "Un calder de peltre del número 2. Està net, cosa rara en aquesta aula.",
    states: [["buit", "Buit"], ["aigua", "Amb aigua"], ["ingredients", "Amb ingredients"], ["llest", "Poció feta"]], imgs: [0, 1, 2, 4].map((i) => S.masmorra.objs.calder.imgs[i]), walkTo: PT("masmorra", "calderWalk") })],
  characters: [npc("c-snape", PT("masmorra", "snape"), "down")],
});
// 8. Lavabo
P.scene({ id: "s-lavabo", name: "Lavabo de la Myrtle", background: S.lavabo.bg, walkable: S.lavabo.walk, actorHeight: S.lavabo.ah, music: "so-castell",
  description: "El lavabo de les noies del primer pis. Ningú no hi entra: hi viu la Myrtle.",
  hotspots: [
    ex("ex-lav-escala", "sortida", SP("lavabo", "sortida"), "s-escala", PT("escala", "deLavabo")),
    spot("ho-lav-piques", "piques", "Piques velles. Una té una serp petita gravada a l'aixeta. Curiós. Segur que no és res.", SP("lavabo", "piques")),
    spot("ho-lav-cabines", "cabines", "Les cabines. De la del fons surten plors i esquitxades.", SP("lavabo", "cabines")),
    spot("ho-lav-bassal", "bassal", "Un bassal enorme. La Myrtle ha tornat a inundar el lavabo.", SP("lavabo", "bassal")),
  ],
  objects: [sobj(S.lavabo, "trevor", { id: "o-trevor", name: "Trevor", description: "En Trevor, el gripau d'en Neville, assegut a la pica com un rei. Rauca amb satisfacció.", layer: "back", walkTo: PT("lavabo", "trevorWalk") })],
  characters: [npc("c-myrtle", PT("lavabo", "myrtle"), "left")],
});
// 9. Cuines
P.scene({ id: "s-cuines", name: "Cuines", background: S.cuines.bg, walkable: S.cuines.walk, actorHeight: S.cuines.ah, music: "so-castell",
  description: "Les cuines, just a sota del Gran Saló. Fa olor de pa i de canyella.",
  hotspots: [
    ex("ex-cuines-vest", "sortida", SP("cuines", "sortida"), "s-vestibul", PT("vestibul", "deCuines")),
    spot("ho-cuines-foc", "llar de foc", "Una llar de foc on hi cabria un drac petit. Les olles bullen soles.", SP("cuines", "foc")),
    spot("ho-cuines-paelles", "paelles", "Paelles de coure tan brillants que m'hi veig la cicatriu.", SP("cuines", "paelles")),
    spot("ho-cuines-taula", "taula", "Aquesta taula és just sota la de Gryffindor. El menjar puja per màgia fins al Gran Saló.", SP("cuines", "taula")),
  ],
  objects: [sobj(S.cuines, "granota", { id: "o-granota", name: "granota de xocolata", description: "Una capsa de granota de xocolata. Porta cromo de regal.", pickable: true, layer: "back", walkTo: PT("cuines", "granotaWalk") })],
  characters: [npc("c-dobby", PT("cuines", "dobby"), "left")],
});
// 10. Passadís de la gàrgola
P.scene({ id: "s-gargola", name: "Passadís de la gàrgola", background: S.gargola.bg, walkable: S.gargola.walk, actorHeight: S.gargola.ah, music: "so-castell",
  description: "El passadís del segon pis, amb la gàrgola que guarda el despatx del director.",
  onEnter: { cutsceneId: "cs-mcgonagall", once: true },
  hotspots: [
    ex("ex-garg-escala", "sortida", SP("gargola", "sortida"), "s-escala", PT("escala", "deGargola")),
    ex("ex-garg-despatx", "escala de cargol", SP("gargola", "escala"), "s-despatx", PT("despatx", "arribada"), { conditions: [inState("o-gargola", "o-gargola-oberta")], blocked: "La gàrgola no s'aparta si no li dic la contrasenya." }),
    spot("ho-garg-armadura", "armadura", "Una armadura. Quan passo, gira el cap. Espero que sigui un encanteri i no algú a dins.", SP("gargola", "armadura")),
    spot("ho-garg-finestres", "finestres", "Fa una nit clara. Des d'aquí es veu la Torre d'Astronomia, ben amunt del castell.", SP("gargola", "finestres")),
  ],
  objects: [sobj(S.gargola, "gargola", { id: "o-gargola", name: "gàrgola", description: "Una gàrgola de pedra lletja com un pecat. Guarda l'escala del despatx del director.", states: [["tancada", "Tancada"], ["oberta", "Oberta"]], layer: "back", walkTo: PT("gargola", "gargolaWalk") })],
  characters: [npc("c-mcgonagall", PT("gargola", "mcgonagall"), "right")],
});
// 11. Despatx
P.scene({ id: "s-despatx", name: "Despatx de Dumbledore", background: S.despatx.bg, walkable: S.despatx.walk, actorHeight: S.despatx.ah, music: "so-castell",
  description: "El despatx del director, ple d'instruments que xiulen i retrats que ronquen.",
  onEnter: { cutsceneId: "cs-despatx", once: true },
  hotspots: [
    ex("ex-desp-garg", "escala de cargol", SP("despatx", "sortida"), "s-gargola", PT("gargola", "gargolaWalk")),
    spot("ho-desp-retrats", "retrats dels directors", "Els antics directors de Hogwarts. Tots dormen. O fan veure que dormen per no haver d'ajudar.", SP("despatx", "retrats")),
    spot("ho-desp-instr", "instruments", "Instruments de plata que fumegen i fan tic-tac. Un d'ells marca «PERILL: MOLT SON».", SP("despatx", "instruments")),
  ],
  objects: [
    sobj(S.despatx, "escriptori", { id: "o-escriptori", name: "escriptori", description: "L'escriptori del director. Hi ha un pot de caramels de llimona... buit. I una tassa de te amb un pòsit verdós. Algú li ha posat un Filtre de Son al te!", walkTo: PT("despatx", "deskWalk") }),
    sobj(S.despatx, "fawkes", { id: "o-fawkes", name: "Fawkes", description: "En Fawkes, el fènix de Dumbledore. Està trist: el seu amo no es desperta. Diuen que als fènixs els agrada molt la música.", states: [["quiet", "Quiet"], ["canta", "Canta"]], walkTo: PT("despatx", "fawkesWalk") }),
    sobj(S.despatx, "prestatge", { id: "o-prestatge", name: "prestatge", description: "El prestatge on sempre hi ha el Barret Seleccionador. Ara només hi ha un rodolí de pols on era.", states: [["buit", "Buit"], ["barret", "Amb el barret"]], layer: "back", walkTo: PT("despatx", "shelfWalk") }),
    sobj(S.despatx, "pensadora", { id: "o-pensadora", name: "pensadora", description: "La pensadora de Dumbledore: una pica de pedra plena de records platejats. Hi veig un record recent: en Peeves, rient, sortint per la finestra amb un bony sota el braç.", walkTo: PT("despatx", "pensWalk") }),
  ],
  characters: [npc("c-dumbledore", PT("despatx", "dumbledore"), "down")],
});
// 12. Torre d'Astronomia
P.scene({ id: "s-astronomia", name: "Torre d'Astronomia", background: S.astronomia.bg, walkable: S.astronomia.walk, actorHeight: S.astronomia.ah, music: "so-fora",
  description: "Dalt de tot de la Torre d'Astronomia. Fa un vent que glaça.",
  hotspots: [
    ex("ex-astro-setena", "porta de l'escala", SP("astronomia", "porta"), "s-setena", PT("setena", "deTorre")),
    spot("ho-astro-cel", "cel", "Milers d'estrelles. La professora Sinistra en sabria el nom de cadascuna. Jo en sé tres, i una és un avió. No, aquí no hi ha avions.", SP("astronomia", "cel")),
    spot("ho-astro-mart", "punt vermell", "Un punt vermell que brilla molt. A ull nu no sé dir quin planeta és.", SP("astronomia", "mart")),
    spot("ho-astro-llac", "llac", "El Llac Negre, allà baix, platejat sota la lluna.", SP("astronomia", "llac")),
  ],
  objects: [sobj(S.astronomia, "telescopi", { id: "o-telescopi", name: "telescopi", description: "Un telescopi de llautó, apuntant al cel. Està enfocat cap a un punt vermell.", walkTo: PT("astronomia", "teleWalk") })],
  characters: [npc("c-peeves", PT("astronomia", "peeves"), "right")],
});
// 13. Setè pis
P.scene({ id: "s-setena", name: "Passadís del setè pis", background: S.setena.bg, walkable: S.setena.walk, actorHeight: S.setena.ah, music: "so-castell",
  description: "Un passadís llarg del setè pis, davant del tapís de Barnabas el Barrut.",
  hotspots: [
    ex("ex-set-escala", "escala avall", SP("setena", "sortida"), "s-escala", PT("escala", "deSetena")),
    ex("ex-set-torre", "escala de la torre", SP("setena", "torre"), "s-astronomia", PT("astronomia", "arribada"), { conditions: [hasItem("o-bufanda")], blocked: "Allà dalt hi fa un fred que pela. Sense bufanda no hi pujo, que demà tinc Quidditch." }),
    ex("ex-set-sala", "paret llisa", SP("setena", "paret"), "s-sala", PT("sala", "arribada"), { conditions: [isVar("v-sala", true)], blocked: "És una paret. Molt llisa. Massa llisa, potser." }),
    spot("ho-set-tapis", "tapís", "Barnabas el Barrut intentant ensenyar ballet a uns trols. Els trols li piquen el cap amb les porres. Art del bo.", SP("setena", "tapis")),
  ],
  objects: [sobj(S.setena, "portasala", { id: "o-portasala", name: "porta", description: "Una porta que abans no hi era. La Sala dels Menesters!", states: [["amagada", "Amagada"], ["visible", "Visible"]], imgs: [null, S.setena.objs.portasala.imgs[0]], walkTo: PT("setena", "paretWalk"), layer: "back" })],
  characters: [npc("c-baro", PT("setena", "baro"), "down")],
});
// 14. Sala dels Menesters
P.scene({ id: "s-sala", name: "Sala dels Menesters", background: S.sala.bg, walkable: S.sala.walk, actorHeight: S.sala.ah, music: "so-bosc",
  description: "La sala de les coses amagades: segles de trastos que algú no volia que es trobessin.",
  onEnter: { cutsceneId: "cs-sala", once: true },
  hotspots: [
    ex("ex-sala-set", "porta", SP("sala", "sortida"), "s-setena", PT("setena", "deSala")),
    spot("ho-sala-trastos", "trastos", "Cadires trencades, llibres prohibits, un troll dissecat, una diadema vella... Que hi faci la neteja un altre.", SP("sala", "trastos")),
    spot("ho-sala-trastos2", "trastos", "Un armari negre i alt. Quan m'hi acosto, se sent un xiuxiueig a dins. No l'obriré. No.", SP("sala", "trastos2")),
    spot("ho-sala-torre", "muntanya de trastos", "Una torre de trastos que gairebé toca el sostre. Dalt de tot, el Barret Seleccionador! Escalar-la seria un suïcidi. Volar-hi, en canvi...", SP("sala", "torre")),
  ],
  objects: [sobj(S.sala, "barret", { id: "o-barret", name: "Barret Seleccionador", description: "El Barret Seleccionador, apedaçat i ronyós, dalt de tot de la muntanya de trastos.", layer: "back", walkTo: PT("sala", "torreWalk") })],
});
// 15. Jardins
P.scene({ id: "s-jardins", name: "Jardins de Hogwarts", background: S.jardins.bg, walkable: S.jardins.walk, actorHeight: S.jardins.ah, music: "so-fora",
  description: "Els jardins del castell sota la lluna.",
  hotspots: [
    ex("ex-jard-castell", "castell", SP("jardins", "castell"), "s-vestibul", PT("vestibul", "dePorta")),
    ex("ex-jard-cabana", "cabana d'en Hagrid", SP("jardins", "cabana"), "s-cabana", PT("cabana", "arribada")),
    ex("ex-jard-bosc", "Bosc Prohibit", SP("jardins", "bosc"), "s-bosc", PT("bosc", "arribada"), { conditions: [hasItem("o-llanterna")], blocked: "Entrar al Bosc Prohibit de nit, sense llum? Ni boig. Necessito una llanterna." }),
    ex("ex-jard-quidditch", "camp de Quidditch", SP("jardins", "quidditch"), "s-quidditch", PT("quidditch", "arribada")),
    ex("ex-jard-hiver", "hivernacles", SP("jardins", "hivernacle"), "s-hivernacle", PT("hivernacle", "arribada")),
    ex("ex-jard-llac", "camí del llac", SP("jardins", "llac"), "s-llac", PT("llac", "arribada")),
    spot("ho-jard-carbasses", "carbasses gegants", "Les carbasses d'en Hagrid. Són tan grosses que hi podries viure. Sospito que hi ha fet servir algun encanteri que no hauria de saber.", SP("jardins", "carbasses")),
  ],
  characters: [npc("c-draco", PT("jardins", "draco"), "left")],
});
// 16. Cabana
P.scene({ id: "s-cabana", name: "Cabana d'en Hagrid", background: S.cabana.bg, walkable: S.cabana.walk, actorHeight: S.cabana.ah, music: "so-fora",
  description: "La cabana d'en Hagrid, a tocar del bosc.",
  hotspots: [
    ex("ex-cab-jard", "sortida", SP("cabana", "sortida"), "s-jardins", PT("jardins", "deCabana")),
    spot("ho-cab-foc", "llar de foc", "Una tetera grossa com un calder bull al foc. En Hagrid sempre té te... i un ou de drac amagat, si s'hi descuida.", SP("cabana", "foc")),
    spot("ho-cab-llit", "llit", "Un llit enorme amb un edredó de retalls. Hi dormiríem tots quatre i encara sobraria lloc per en Fang.", SP("cabana", "llit")),
    spot("ho-cab-pernils", "pernils", "Pernils i faisans penjats del sostre. I alguna cosa que no sé què és, però té massa potes.", SP("cabana", "pernils")),
    spot("ho-cab-ballesta", "ballesta", "La ballesta d'en Hagrid. Diu que és per si de cas. No vull saber de quin cas.", SP("cabana", "ballesta")),
    spot("ho-cab-tassa", "tassa", "Una tassa de te de la mida d'un cubell.", SP("cabana", "tassa")),
  ],
  objects: [
    sobj(S.cabana, "fems", { id: "o-fems", name: "sac de fems de drac", description: "Un sac de fems de drac. Hi diu «FEMS». Fa una pudor que tomba. Per a les plantes, és or.", pickable: true, walkTo: PT("cabana", "sackWalk") }),
    sobj(S.cabana, "galetes", { id: "o-galetes", name: "galetes de roca", description: "Galetes de roca fetes per en Hagrid. El nom és literal.", pickable: true, layer: "back", walkTo: PT("cabana", "cakesWalk") }),
    sobj(S.cabana, "fang", { id: "o-fang", name: "Fang", description: "En Fang, el gos d'en Hagrid. Un gos enorme i porugues que bava com una font." }),
  ],
  characters: [npc("c-hagrid", PT("cabana", "hagrid"), "left")],
});
// 17. Hivernacle
P.scene({ id: "s-hivernacle", name: "Hivernacle 3", background: S.hivernacle.bg, walkable: S.hivernacle.walk, actorHeight: S.hivernacle.ah, music: "so-fora",
  description: "L'hivernacle 3, el de les plantes perilloses.",
  hotspots: [
    ex("ex-hiv-jard", "sortida", SP("hivernacle", "sortida"), "s-jardins", PT("jardins", "deHivernacle")),
    spot("ho-hiv-tent", "tentàcula verinosa", "Una Tentàcula Verinosa. Mou les branques cap a mi com qui diu «vine, vine». No, gràcies.", SP("hivernacle", "tentacula")),
    spot("ho-hiv-testos", "testos", "Testos de plantes estranyes: una que fa bombolles, una que esternuda i una que crec que m'acaba d'insultar.", SP("hivernacle", "testos")),
    spot("ho-hiv-vidres", "vidres", "A través del vidre es veuen les estrelles. I uns quants caragols enganxats.", SP("hivernacle", "vidres")),
  ],
  objects: [sobj(S.hivernacle, "mandragora", { id: "o-mandragora", name: "mandràgores", description: "Testos de mandràgores joves. Les fulles es mouen soles. Si n'arrenques una sense protecció, el crit et deixa estabornit.", states: [["plantades", "Plantades"], ["arrencada", "Arrencada"]], walkTo: PT("hivernacle", "mandWalk") })],
  characters: [npc("c-sprout", PT("hivernacle", "sprout"), "right")],
});
// 18. Camp de Quidditch
P.scene({ id: "s-quidditch", name: "Camp de Quidditch", background: S.quidditch.bg, walkable: S.quidditch.walk, actorHeight: S.quidditch.ah, music: "so-fora",
  description: "El camp de Quidditch, de nit i buit. Bé, gairebé buit.",
  hotspots: [
    ex("ex-quid-jard", "sortida", SP("quidditch", "sortida"), "s-jardins", PT("jardins", "deQuidditch")),
    spot("ho-quid-port", "porteries", "Les tres anelles de porteria. Hi he fet passar la Quaffle... cap vegada. Jo sóc Buscador.", SP("quidditch", "porteries")),
    spot("ho-quid-grad", "graderies", "Les graderies, amb les teles de les cases. Al partit de dissabte estaran plenes.", SP("quidditch", "graderies")),
    spot("ho-quid-grad2", "graderies", "La tribuna de Slytherin. Hi ha una pancarta mig caiguda: «POTTER PER AL CUBELL».", SP("quidditch", "graderies2")),
  ],
  objects: [sobj(S.quidditch, "snitch", { id: "o-snitch", name: "snitch daurada", description: "La snitch daurada d'entrenament, voleiant ben amunt. Batega les ales com un colibrí nerviós.", layer: "back", walkTo: PT("quidditch", "snitchWalk") })],
  characters: [npc("c-hooch", PT("quidditch", "hooch"), "right")],
});
// 19. Bosc Prohibit
P.scene({ id: "s-bosc", name: "Bosc Prohibit", background: S.bosc.bg, walkable: S.bosc.walk, actorHeight: S.bosc.ah, music: "so-bosc",
  description: "El Bosc Prohibit. Prohibit per alguna cosa.",
  hotspots: [
    ex("ex-bosc-jard", "sortida del bosc", SP("bosc", "sortida"), "s-jardins", PT("jardins", "deBosc")),
    spot("ho-bosc-unicorn", "unicorn", "Un unicorn adormit, al fons, entre els arbres. Brilla com si fos fet de lluna. No m'hi acostaré: no vull espantar-lo.", SP("bosc", "unicorn")),
    spot("ho-bosc-arbres", "arbres", "Arbres vells i retorçats. Alguna cosa amb massa ulls em mira des de les branques.", SP("bosc", "arbres")),
    spot("ho-bosc-cami", "camí", "En Hagrid m'ha dit que no surti del camí. És el millor consell que m'ha donat mai.", SP("bosc", "cami")),
  ],
  characters: [npc("c-firenze", PT("bosc", "firenze"), "left")],
});
// 20. Llac
P.scene({ id: "s-llac", name: "Riba del Llac Negre", background: S.llac.bg, walkable: S.llac.walk, actorHeight: S.llac.ah, music: "so-fora",
  description: "La riba del Llac Negre, amb el castell a l'altra banda.",
  hotspots: [
    ex("ex-llac-jard", "camí dels jardins", SP("llac", "sortida"), "s-jardins", PT("jardins", "deLlac")),
    spot("ho-llac-aigua", "aigua del llac", "L'aigua del Llac Negre, fosca i freda. Hi viuen sirenes, grindylows i un calamar gegant.", SP("llac", "aigua")),
    spot("ho-llac-castell", "castell", "Hogwarts, a l'altra banda del llac, amb totes les finestres enceses. Des d'aquí sembla un pastís d'aniversari.", SP("llac", "castell")),
    spot("ho-llac-lluna", "lluna", "Lluna plena. En el professor Lupin no hi vull pensar ara.", SP("llac", "lluna")),
    spot("ho-llac-moll", "moll", "El moll de fusta. Al cap del moll l'aigua és més neta i més fonda.", SP("llac", "moll")),
  ],
  objects: [sobj(S.llac, "tentacle", { id: "o-tentacle", name: "tentacle", description: "Un tentacle del calamar gegant, que treu el cap... la punta... per saludar.", walkTo: PT("llac", "tentWalk") })],
  characters: [npc("c-luna", PT("llac", "luna"), "right")],
});

/* ---------- Llums animades (llums.mjs) ---------- */
const LL = await import(new URL("./llums.mjs", import.meta.url));
for (const [k, sc] of Object.entries(S)) {
  const L = LL.lightsCharacter(sc);
  if (!L) continue;
  P.character({ id: `c-llum-${k}`, name: "llum", description: "La llum tremola i fa ballar les ombres.", color: "#feae34",
    sheet: L.sheet, frameWidth: L.frameWidth, frameHeight: L.frameHeight, animations: L.animations });
  P.scenes.find((x) => x.id === `s-${k}`).characters.push(npc(`c-llum-${k}`, L.position, "down"));
}

/* ---------- Regles ---------- */
const R = (...a) => P.rules.push(rule(...a));
const OK = () => sound("so-exit");

// Dormitori
R("open", obj("o-bagul"), null, [inState("o-bagul", "o-bagul-tancat")], [setState("o-bagul", "o-bagul-obert"), sound("so-clic"), say("A dins hi ha la capa invisible i la flauta d'en Hagrid. M'ho emporto tot: aquesta nit pot ser llarga."), take("o-capa"), take("o-flauta"), OK()]);
R("open", obj("o-bagul"), null, [], [say("Ja està obert. Només hi queden mitjons i deures sense fer.")]);
R("close", obj("o-bagul"), null, [inState("o-bagul", "o-bagul-obert")], [setState("o-bagul", "o-bagul-tancat"), sound("so-clic")]);
R("pickup", obj("o-bagul"), null, [], [say("Pesa com un hipogrif. Ja l'obriré, si cal.")]);
R("pickup", chr("c-neville"), null, [], [say("En Neville no és un objecte. Encara que de vegades l'hagis de buscar com un.")]);
R("give", obj("o-trevor"), chr("c-neville"), [], [lose("o-trevor"), say("TREVOR! On t'havies ficat?", "c-neville"), say("Al lavabo de la Myrtle. Fa vida social."), say("Gràcies, Harry! Té, les meves orelleres d'Herbologia. La professora Sprout diu que no es pot treballar amb mandràgores sense.", "c-neville"), take("o-orelleres"), OK()]);
R("give", obj("o-bufanda"), chr("c-neville"), [], [say("Ja en tinc una, Harry. La porto lligada al turmell per no perdre'l.", "c-neville")]);
// Sala comuna
R("push", obj("o-escacs"), null, [], [say("Peó a e4!"), say("El peó m'ha mirat malament i no s'ha mogut. Només obeeix en Ron.")]);
R("pickup", obj("o-escacs"), null, [], [say("Si toco els escacs d'en Ron, em mata. I les peces també.")]);
R("give", obj("o-pastis"), chr("c-ron"), [], [lose("o-pastis"), say("UN PASTÍS DE CARBASSA SENCER! Harry, ets el millor amic del món.", "c-ron"), say("Mmmf... Té. Una bomba fètida d'en Fred i en George. En Filch hi té pànic: les odia més que en Peeves.", "c-ron"), take("o-bomba"), OK()]);
R("give", obj("o-galetes"), chr("c-ron"), [], [say("(Crec!) Ai! Aquesta galeta m'ha mossegat ella a mi. Són d'en Hagrid, oi?", "c-ron"), say("Quedeu-vos-les. Les faré servir de pedres per al tirador.", "c-ron")]);
R("give", obj("o-cromo"), chr("c-ron"), [], [lose("o-cromo"), say("Dumbledore! En tinc sis, però mai no en sobren. Gràcies!", "c-ron"), say("Sabies que li agrada molt la música? Al seu despatx, en Fawkes canta cada cop que algú hi toca una melodia. Ho diu al cromo.", "c-ron")]);
R("give", obj("o-granota"), chr("c-ron"), [], [say("Obre-la tu, Harry. Si no surt el cromo d'Agripa em posaré a plorar.", "c-ron")]);
// Escala: la Dama Grassa
R("talk", obj("o-grassa"), null, [], [talkTo("d-grassa")]);
R("open", obj("o-grassa"), null, [isVar("v-grassa", true)], [go("s-comuna", PT("comuna", "deRetrat"))]);
R("open", obj("o-grassa"), null, [], [say("No s'obre si no li dic la contrasenya. Hauria de parlar-hi.")]);
R("push", obj("o-grassa"), null, [], [say("Ei! Una dama no s'empeny, jovenet!", "c-harry")]);
// Vestíbul: Filch, la porta i la pera
R("talk", obj("o-filch"), null, [inState("o-filch", "o-filch-hi")], [talkTo("d-filch")]);
R("use", obj("o-bomba"), obj("o-filch"), [], [lose("o-bomba"), sound("so-clic"), say("Ups! Se m'ha escapat la bomba fètida..."), say("UNA BOMBA FÈTIDA! A L'ENTRADA! PEEVES! AQUEST COP T'ENXAMPO!", "c-filch"), setState("o-filch", "o-filch-fora"), setVar("v-filch", true), wait(0.5), say("En Filch ha marxat corrents cap al Gran Saló, tapant-se el nas. La porta ha quedat lliure."), setState("o-porta", "o-porta-oberta"), OK()]);
R("give", obj("o-bomba"), obj("o-filch"), [], [say("Donar-li en mà una bomba fètida a en Filch... Millor la faig servir amb ell, sense que se n'adoni.")]);
R("open", obj("o-porta"), null, [isVar("v-filch", false)], [say("Ni se t'acudeixi, Potter! Ningú no surt del castell aquesta nit. Ordres de la professora McGonagall.", "c-filch")]);
R("open", obj("o-porta"), null, [], [say("Ja és oberta. Els jardins m'esperen.")]);
R("push", obj("o-pera"), null, [isVar("v-pera", false)], [say("Li faig pessigolles a la pera amb el dit..."), say("Ji ji ji!"), setState("o-pera", "o-pera-obert"), setVar("v-pera", true), sound("so-clic"), say("La pera ha rigut i el quadre s'ha obert com una porta. Hi ha un passadís cap a les cuines!"), OK()]);
R("pull", obj("o-pera"), null, [isVar("v-pera", false)], [say("No vull arrencar-la. Potser si li faig pessigolles... Empenyent-la amb el dit, suaument.")]);
R("use", obj("o-pera"), null, [], [say("La pera té cara de tenir pessigolles. Potser si l'empenyo amb el dit...")]);
// Gran Saló
R("pickup", chr("c-nick"), null, [], [say("La mà em travessa en Nick. Fa un fred que glaça.")]);
// Biblioteca: el llibre prohibit
R("pickup", obj("o-llibre"), null, [], [say("Ni se t'acudeixi, Potter! La Secció Prohibida és prohibida. Per això es diu així.", "c-pince"), say("Si Madame Pince no em veiés...")]);
R("use", obj("o-capa"), obj("o-llibre"), [], [say("Em poso la capa invisible... Passo pel costat de Madame Pince, salto el cordó, i..."), sound("so-clic"), take("o-llibre"), say("...el llibre deixa la cadena i em ve a la mà! Torno, em trec la capa. Ningú no ha vist res."), OK()]);
R("use", obj("o-capa"), obj("o-corda"), [], [say("Em poso la capa invisible... Passo pel costat de Madame Pince, salto el cordó, i..."), sound("so-clic"), take("o-llibre"), say("...ja tinc «Pocions Molt Potents»! Torno, em trec la capa. Ningú no ha vist res."), OK()]);
R("use", obj("o-capa"), chr("c-pince"), [], [say("Fer-la invisible a ella? Seria més fàcil fer-me invisible jo... i anar a buscar el llibre.")]);
R("pickup", obj("o-corda"), null, [], [say("Si el toco, Madame Pince ho sabrà. Ho sap tot. Té un sisè sentit per als cordons.")]);
R("give", obj("o-llibre"), chr("c-hermione"), [], [cutscene("cs-recepta")]);
// Masmorra: el calder
const calderBlocked = [isVar("v-snape", false)];
const snapeNo = say("Posa un sol dit al meu calder, Potter, i passaràs la resta del curs netejant gripaus. Sense guants.", "c-snape");
for (const o of ["o-flasco-aigua", "o-fulla", "o-pel", "o-ploma", "o-varita", "o-flasco-buit"]) R("use", obj(o), obj("o-calder"), calderBlocked, [snapeNo]);
R("use", obj("o-flasco-aigua"), obj("o-calder"), [inState("o-calder", "o-calder-buit")], [lose("o-flasco-aigua"), take("o-flasco-buit"), setState("o-calder", "o-calder-aigua"), sound("so-aigua"), say("Aboco l'aigua del llac al calder. Em guardo el flascó: el necessitaré per embotellar la poció.")]);
for (const [o, txt] of [["o-fulla", "la fulla de mandràgora. Ha fet un crit petitó en tocar l'aigua."], ["o-pel", "el pèl d'unicorn. L'aigua s'ha tornat platejada."], ["o-ploma", "la ploma de fènix. Fa xup-xup sense foc!"]]) {
  R("use", obj(o), obj("o-calder"), [inState("o-calder", "o-calder-aigua"), isVar("v-ingr", 2)], [lose(o), setVar("v-ingr", 3), setState("o-calder", "o-calder-ingredients"), say(`Hi tiro ${txt}`), say("Ja hi ha tots els ingredients. Ara cal escalfar-ho amb un encanteri de foc."), OK()]);
  R("use", obj(o), obj("o-calder"), [inState("o-calder", "o-calder-aigua")], [lose(o), setVar("v-ingr", 1, "add"), say(`Hi tiro ${txt}`)]);
  R("use", obj(o), obj("o-calder"), [inState("o-calder", "o-calder-buit")], [say("Primer hi he de posar l'aigua del llac. Ho diu la recepta.")]);
}
R("use", obj("o-varita"), obj("o-calder"), [inState("o-calder", "o-calder-ingredients")], [say("Incendio!"), sound("so-clic"), setState("o-calder", "o-calder-llest"), wait(0.6), say("La poció bull, canvia de color tres vegades i es queda d'un daurat que enlluerna. Ara l'he d'embotellar."), say("Hm. No està malament, Potter. Per ser vostè.", "c-snape"), OK()]);
R("use", obj("o-varita"), obj("o-calder"), [], [say("Encara no hi ha res per escalfar. Primer, els ingredients.")]);
R("use", obj("o-flasco-buit"), obj("o-calder"), [inState("o-calder", "o-calder-llest")], [lose("o-flasco-buit"), take("o-pocio"), setState("o-calder", "o-calder-buit"), sound("so-aigua"), say("Omplo el flascó de Poció Despertadora. Ara, al despatx de Dumbledore!"), OK()]);
R("use", obj("o-flasco-buit"), obj("o-calder"), [], [say("Encara no hi ha cap poció per embotellar.")]);
R("pickup", obj("o-calder"), null, [], [say("És de l'escola i pesa una tona. Millor el faig servir aquí.")]);
R("use", obj("o-recepta"), obj("o-calder"), [], [say("Segons la recepta: aigua del llac, fulla de mandràgora, pèl d'unicorn i ploma de fènix. Després, foc amb la vareta i embotellar amb un flascó.")]);
R("give", obj("o-permis"), chr("c-snape"), [], [lose("o-permis"), setVar("v-snape", true), say("(Llegeix el permís amb cara d'haver menjat una llimona)", "c-snape"), say("Molt bé. Faci servir aquest calder. Però si fa explotar la masmorra, ho pagarà vostè, no la professora McGonagall.", "c-snape"), OK()]);
// Lavabo: en Trevor
R("pickup", obj("o-trevor"), null, [isVar("v-myrtle", false)], [say("NO TOQUIS EL MEU GRIPAU! És l'únic que em fa companyia!", "c-myrtle"), say("Ui. Potser primer hauria de fer-la una mica més feliç.")]);
R("pickup", obj("o-trevor"), null, [], [take("o-trevor"), say("Vine aquí, Trevor. En Neville et busca. (Rauc.)"), OK()]);
R("give", obj("o-invitacio"), chr("c-myrtle"), [], [lose("o-invitacio"), setVar("v-myrtle", true), say("Una festa? Per a MI? Ningú no m'havia convidat mai a res!", "c-myrtle"), say("Endu-te el gripau, si vols. Ara tinc vida social!", "c-myrtle"), OK()]);
// Cuines
R("open", obj("o-granota"), null, [], [lose("o-granota"), say("Obro la capsa... La granota de xocolata salta, fa dos bots i s'escapa per sota d'una porta. Em queda el cromo."), take("o-cromo")]);
R("give", obj("o-mitjo"), chr("c-dobby"), [], [lose("o-mitjo"), say("Un MITJÓ! Harry Potter dona un mitjó a Dobby! Ara Dobby en té dos... i són diferents!", "c-dobby"), say("Dobby li dona el pastís de carbassa més gran de la cuina, senyor!", "c-dobby"), take("o-pastis"), OK()]);
R("give", obj("o-bufanda"), chr("c-dobby"), [], [say("Dobby la trobaria preciosa, senyor... però la necessitarà vostè. Dobby prefereix mitjons. Mitjons vells, si pot ser.", "c-dobby")]);
// Gàrgola i despatx
R("talk", obj("o-gargola"), null, [inState("o-gargola", "o-gargola-tancada")], [talkTo("d-gargola")]);
R("push", obj("o-gargola"), null, [], [say("Pesa tones. I m'ha fet una ganyota.")]);
R("use", obj("o-flauta"), obj("o-fawkes"), [], [setState("o-fawkes", "o-fawkes-canta"), say("Toco l'única cançó que sé..."), sound("so-moneda"), say("En Fawkes obre els ulls i canta amb mi! És la cosa més bonica que he sentit mai."), say("Quan acaba, s'espolsa i deixa caure una ploma als meus peus."), take("o-ploma"), setState("o-fawkes", "o-fawkes-quiet"), OK()]);
R("pickup", obj("o-fawkes"), null, [], [say("Arrencar-li una ploma a un fènix? Ni parlar-ne. Potser me'n regala una si el poso de bon humor.")]);
R("talk", obj("o-fawkes"), null, [], [say("Hola, Fawkes. Estàs trist, oi?"), say("(En Fawkes fa un piulet melancòlic. Sembla que trobi a faltar la música.)")]);
R("use", obj("o-pocio"), chr("c-dumbledore"), [], [lose("o-pocio"), setVar("v-despert", true), cutscene("cs-despertar")]);
R("give", obj("o-pocio"), chr("c-dumbledore"), [], [lose("o-pocio"), setVar("v-despert", true), cutscene("cs-despertar")]);
R("give", obj("o-barret"), chr("c-dumbledore"), [isVar("v-despert", true)], [lose("o-barret"), cutscene("cs-final")]);
R("use", obj("o-barret"), obj("o-prestatge"), [isVar("v-despert", true)], [lose("o-barret"), cutscene("cs-final")]);
R("give", obj("o-barret"), chr("c-dumbledore"), [], [say("Està adormit com un tronc. Primer l'he de despertar.")]);
R("use", obj("o-barret"), obj("o-prestatge"), [], [say("Vull que Dumbledore vegi que el barret ha tornat. Primer l'he de despertar.")]);
R("talk", chr("c-dumbledore"), null, [isVar("v-despert", false)], [say("Professor? Professor Dumbledore?"), say("Zzzz... mmm... un altre caramel de llimona, si us plau... zzzz...", "c-dumbledore")]);
R("push", chr("c-dumbledore"), null, [isVar("v-despert", false)], [say("El sacsejo una mica. Res. Ni un terratrèmol el despertaria. Cal alguna cosa més forta.")]);
R("pickup", obj("o-escriptori"), null, [], [say("No em puc endur l'escriptori del director. Però el pot de caramels, en una altra ocasió...")]);
R("use", obj("o-pensadora"), null, [], [say("Hi fico el cap? Millor no: encara em perdré en els records d'algú altre.")]);
// Torre d'Astronomia
R("use", obj("o-telescopi"), null, [], [say("...")]);
R("push", obj("o-telescopi"), null, [], [setVar("v-mart", true), say("Hi miro... Aquell punt vermell és Mart! I brilla moltíssim. Els centaures diuen que quan Mart brilla així, passen coses."), OK()]);
R("look", obj("o-telescopi"), null, [isVar("v-mart", false)], [say("Un telescopi de llautó enfocat a un punt vermell del cel. Si l'empenyo una mica cap a l'ull, potser podré mirar-hi."), say("(Mira, Harry: s'empeny.)")]);
R("pull", obj("o-telescopi"), null, [], [setVar("v-mart", true), say("L'acosto a l'ull i hi miro: aquell punt vermell és Mart, i brilla moltíssim. Els centaures diuen que quan Mart brilla així, passen coses."), OK()]);
R("pickup", obj("o-telescopi"), null, [], [say("És de la professora Sinistra. Però hi puc mirar: només l'he d'estirar cap a mi.")]);
R("use", obj("o-cadena"), chr("c-peeves"), [], [cutscene("cs-peeves")]);
R("give", obj("o-cadena"), chr("c-peeves"), [], [say("Donar-li una cadena a en Peeves? Me la tiraria pel cap. La faré sonar davant seu.")]);
R("pickup", chr("c-peeves"), null, [], [say("Agafar en Peeves és com agafar fum. Fum que et fa la botzina.")]);
// Setè pis: la Sala dels Menesters
const pace = [walk(PT("setena", "paretWalk")), walk([PT("setena", "paretWalk")[0] - 40, PT("setena", "paretWalk")[1] - 18]), walk(PT("setena", "paretWalk")), walk([PT("setena", "paretWalk")[0] - 40, PT("setena", "paretWalk")[1] - 18]), walk(PT("setena", "paretWalk"))];
for (const verb of ["push", "talk", "use", "open"]) {
  P.rules.push(rule(verb, hot("ex-set-sala"), null, [isVar("v-sala", false), isVar("v-dobby", true), isVar("v-peeves", true)], [say("Necessito un lloc per amagar coses... Necessito un lloc per amagar coses..."), ...pace, sound("so-moneda"), setState("o-portasala", "o-portasala-visible"), setVar("v-sala", true), say("A la paret hi ha aparegut una porta! La Sala dels Menesters!"), OK()]));
  P.rules.push(rule(verb, hot("ex-set-sala"), null, [isVar("v-sala", false), isVar("v-dobby", true)], [say("Necessito... eh... un barret? Necessito un barret..."), ...pace, say("Res. Potser no estic demanant la cosa exacta. On l'hauria amagat, en Peeves?")]));
  P.rules.push(rule(verb, hot("ex-set-sala"), null, [isVar("v-sala", false)], [say("És una paret llisa. Què hi vols fer, Harry? Parlar amb les parets?")]));
}
R("open", obj("o-portasala"), null, [], [go("s-sala", PT("sala", "arribada"))]);
R("pull", obj("o-portasala"), null, [], [go("s-sala", PT("sala", "arribada"))]);
R("push", obj("o-portasala"), null, [], [go("s-sala", PT("sala", "arribada"))]);
// Sala dels Menesters: el barret
R("pickup", obj("o-barret"), null, [isVar("v-dalt", false)], [say("És massa amunt! Si escalo la muntanya de trastos, tot se m'ensorrarà a sobre.")]);
R("pickup", obj("o-barret"), null, [isVar("v-barret", false)], [say("NO EM TOQUIS! No vull tornar! Allà ningú no aprecia les meves cançons!", "c-barret")]);
R("pickup", obj("o-barret"), null, [], [take("o-barret")]);
R("use", obj("o-escombra"), obj("o-barret"), [isVar("v-dalt", false)], [cutscene("cs-volar")]);
R("use", obj("o-escombra"), hot("ho-sala-torre"), [isVar("v-dalt", false)], [cutscene("cs-volar")]);
R("use", obj("o-escombra"), obj("o-barret"), [], [say("Ja hi sóc, al costat del barret, aguantant-me a l'escombra.")]);
R("talk", obj("o-barret"), null, [isVar("v-dalt", false)], [say("Barret! Baixa d'aquí dalt!"), say("No vull! Aquí ningú no em diu que les meves cançons són avorrides! Fora, fora!", "c-barret")]);
R("talk", obj("o-barret"), null, [isVar("v-barret", false)], [talkTo("d-barret")]);
R("talk", obj("o-barret"), null, [], [say("Som-hi, a casa!", "c-barret")]);
R("use", obj("o-flauta"), obj("o-barret"), [isVar("v-dalt", false)], [say("Des d'aquí baix no em sentiria. Hauria de pujar fins on és.")]);
R("use", obj("o-flauta"), obj("o-barret"), [isVar("v-barret", false)], [cutscene("cs-barret")]);
// Jardins i fora
R("give", obj("o-snitch"), chr("c-draco"), [], [lose("o-snitch"), say("(La mira embadalit) Una snitch... de veritat...", "c-draco"), say("Té, el paraigua del gegant. I no diguis a ningú que l'he tocat: encara agafaré puces.", "c-draco"), take("o-paraigua"), OK()]);
R("give", obj("o-paraigua"), chr("c-hagrid"), [], [lose("o-paraigua"), say("El meu paraigua! (L'abraça tan fort que se sent un cric.) Està sencer! Sobretot... el que hi ha a dins.", "c-hagrid"), say("Té, la meva llanterna. Si entres al bosc, no et separis del camí. I si veus en Firenze, saluda'l de part meva.", "c-hagrid"), take("o-llanterna"), OK()]);
R("give", obj("o-galetes"), chr("c-hagrid"), [], [say("Oh, no, són per a tu, Harry! Jo ja n'he menjat dotze.", "c-hagrid")]);
R("give", obj("o-galetes"), obj("o-fang"), [], [lose("o-galetes"), say("En Fang s'empassa les galetes de roca d'un mos. Crec que les he sentit picar dins la panxa.")]);
R("give", obj("o-bufanda"), chr("c-hagrid"), [], [say("Gràcies, Harry, però a mi no em fa fred. Tinc pell de gegant. Bé, de mig gegant.", "c-hagrid")]);
R("pickup", obj("o-fems"), null, [], [take("o-fems"), say("Uf, quina pudor! Ho sento, Hagrid, me l'emporto.", null), say("Per a la professora Sprout? Endu-te'l, endu-te'l. En tinc una muntanya darrere la cabana.", "c-hagrid")]);
R("pickup", obj("o-fang"), null, [], [say("En Fang pesa més que jo. I em llepa.")]);
R("push", obj("o-fang"), null, [], [say("En Fang es posa panxa enlaire perquè li faci moixaines. Molt temible.")]);
R("give", obj("o-fems"), chr("c-sprout"), [], [lose("o-fems"), setVar("v-sprout", true), say("Fems de drac! Fantàstic, Harry, gràcies!", "c-sprout"), say("Agafa una fulla de mandràgora, si la necessites. Però posa't orelleres, eh!", "c-sprout"), OK()]);
for (const verb of ["pull", "pickup"]) {
  P.rules.push(rule(verb, obj("o-mandragora"), null, [inState("o-mandragora", "o-mandragora-arrencada")], [say("Ja en tinc una fulla. Les altres que dormin.")]));
  P.rules.push(rule(verb, obj("o-mandragora"), null, [isVar("v-sprout", false)], [say("Eh, eh, eh! Aquestes no es toquen sense permís, Potter!", "c-sprout")]));
  P.rules.push(rule(verb, obj("o-mandragora"), null, [hasItem("o-orelleres", true)], [say("Sense orelleres? El crit d'una mandràgora et deixa estabornit unes quantes hores. No tinc temps per dormir.")]));
  P.rules.push(rule(verb, obj("o-mandragora"), null, [], [say("Em poso les orelleres i estiro..."), setState("o-mandragora", "o-mandragora-arrencada"), say("AAAAAAAAH! (Se sent esmorteït, com des de molt lluny.)"), say("Li agafo una fulla i la torno a plantar. Ja està: fulla de mandràgora!"), take("o-fulla"), OK()]));
}
R("use", obj("o-orelleres"), obj("o-mandragora"), [isVar("v-sprout", true)], [say("Me les poso i estiro la mandràgora..."), setState("o-mandragora", "o-mandragora-arrencada"), say("AAAAAAAAH! (Se sent molt lluny.) Li agafo una fulla i la torno a plantar."), take("o-fulla"), OK()]);
R("give", obj("o-xiulet"), chr("c-hooch"), [], [lose("o-xiulet"), say("El meu xiulet! FIIIIIUUUU! Ah, ara sí que em sento jo mateixa.", "c-hooch"), say("Té, Potter, agafa una escombra de l'escola. I ja que hi ets, atrapa'm aquella snitch, que se m'ha escapat i no em deixa dormir.", "c-hooch"), take("o-escombra"), OK()]);
R("pickup", obj("o-snitch"), null, [], [say("És massa amunt, i va massa de pressa. Necessitaria una escombra.")]);
R("use", obj("o-escombra"), obj("o-snitch"), [], [say("Pujo a l'escombra i m'enlairo!"), wait(0.5), say("Un gir, un picat, un tirabuixó... i... LA TINC!"), take("o-snitch"), OK(), say("Encara ets el Buscador més jove del segle, Potter!", "c-hooch")]);
R("talk", obj("o-tentacle"), null, [], [say("Hola, calamar!"), say("(El tentacle fa adéu i es torna a enfonsar mig segon. Després torna a sortir.)")]);
R("push", obj("o-tentacle"), null, [], [say("No empenyo el calamar gegant. Té més braços que jo.")]);
R("give", obj("o-quisquiller"), chr("c-luna"), [], [lose("o-quisquiller"), say("Oh, el número de febrer! El de les arracades de rave que espanten els nargles!", "c-luna"), say("Té, el meu flascó. Avui els plimpies no piquen; diuen que la lluna els fa tímids.", "c-luna"), take("o-flasco-buit"), OK()]);
R("use", obj("o-flasco-buit"), hot("ho-llac-aigua"), [], [take("o-flasco-aigua"), lose("o-flasco-buit"), sound("so-aigua"), say("M'ajupo al cap del moll i omplo el flascó d'aigua del Llac Negre. Brrr, està gelada!"), OK()]);
R("use", obj("o-flasco-buit"), hot("ho-llac-moll"), [], [take("o-flasco-aigua"), lose("o-flasco-buit"), sound("so-aigua"), say("Al cap del moll omplo el flascó d'aigua del Llac Negre. Brrr, està gelada!"), OK()]);
R("pickup", hot("ho-llac-aigua"), null, [], [say("Amb les mans no la puc portar fins al castell. Necessito un recipient.")]);

/* ---------- Diàlegs ---------- */
const D = (...a) => P.dialogues.push(dialogue(...a));
D("d-neville", "Neville", "c-neville", [
  node("ne-1", [["c-neville", "Harry! La professora McGonagall t'espera al passadís de la gàrgola, al segon pis. Deia que és urgent!"]], [
    opt("Quina és la contrasenya de la Dama Grassa?", "ne-2", { id: "op-ne-contra" }),
    opt("Què et passa? Fas cara de...", "ne-3"),
    opt("He trobat en Trevor!", null, { conditions: [hasItem("o-trevor")], actions: [lose("o-trevor"), say("TREVOR! Gràcies, Harry! Té, les meves orelleres d'Herbologia. La professora Sprout diu que no es pot tocar una mandràgora sense.", "c-neville"), take("o-orelleres"), OK()] }),
    opt("Fins després, Neville."),
  ]),
  node("ne-2", [["c-neville", "Espera, que la tinc apuntada... Té, queda't el paper. Jo ja me la sé de memòria. Crec."]], [
    opt("Gràcies!", "ne-1", { once: true, conditions: [hasItem("o-nota", true)], actions: [take("o-nota")] }),
    opt("Ja me l'havies donat.", "ne-1", { conditions: [hasItem("o-nota")] }),
    opt("Torna-m'ho a dir.", "ne-1", { conditions: [hasItem("o-nota", true)], actions: [say("«Cap de drac». Ho has entès? Cap. De. Drac.", "c-neville")] }),
  ]),
  node("ne-3", [["c-neville", "He tornat a perdre en Trevor, el meu gripau. El vaig sentir raucar a prop dels lavabos del primer pis... però allà hi viu la Myrtle i em fa por."]], [
    opt("Si el trobo, te'l porto.", "ne-1"),
  ]),
]);
D("d-ron", "Ron", "c-ron", [
  node("ro-1", [["c-ron", "Harry! Ostres, quina gana. M'he saltat el banquet de Halloween per acabar la partida d'escacs. Contra mi mateix. He perdut."]], [
    opt("Han robat el Barret Seleccionador!", "ro-2"),
    opt("Com s'entra a les cuines?", "ro-3"),
    opt("Tens res que em pugui servir?", "ro-4"),
    opt("Té, un pastís de carbassa.", null, { conditions: [hasItem("o-pastis")], actions: [lose("o-pastis"), say("UN PASTÍS SENCER! Ets el millor amic del món.", "c-ron"), say("Mmmf... Té, una bomba fètida d'en Fred i en George. En Filch hi té pànic.", "c-ron"), take("o-bomba"), OK()] }),
    opt("Adéu, Ron."),
  ]),
  node("ro-2", [["c-ron", "Qui vol un barret vell que canta malament? Algú amb molt mal gust..."], ["c-ron", "...o en Peeves. Tota la setmana que fa broma amb la Dama Grassa dient que li canta millor que el barret."]], [opt("Gràcies, Ron.", "ro-1")]),
  node("ro-3", [["c-ron", "En Fred i en George diuen que s'ha de fer pessigolles a la pera del quadre de fruita del vestíbul. La pera riu i s'obre la porta."], ["c-ron", "Jo hi aniria, però tinc tanta gana que no em puc moure de la butaca."]], [opt("Ja hi aniré jo.", "ro-1")]),
  node("ro-4", [["c-ron", "Tinc una bomba fètida d'en Fred i en George. Te la canvio per menjar. Molt menjar. Un pastís sencer, per exemple."]], [opt("Ja veurem què trobo.", "ro-1")]),
]);
D("d-hermione", "Hermione", "c-hermione", [
  node("he-1", [["c-hermione", "Harry! La McGonagall m'ho ha explicat. Un encanteri de son així només es desfà amb una Poció Despertadora molt forta."]], [
    opt("Com es fa, aquesta poció?", "he-2"),
    opt("Tinc el llibre de la Secció Prohibida!", null, { conditions: [hasItem("o-llibre")], actions: [cutscene("cs-recepta")] }),
    opt("Recorda'm els ingredients.", "he-3", { conditions: [isVar("v-recepta", true)] }),
    opt("Saps alguna cosa de la Sala dels Menesters?", "he-4", { conditions: [isVar("v-peeves", true)] }),
    opt("Ens veiem, Hermione."),
  ]),
  node("he-2", [["c-hermione", "La recepta és a «Pocions Molt Potents», a la Secció Prohibida. Madame Pince no hi deixa passar ningú sense permís... ni tan sols a mi!"], ["c-hermione", "Si algú hi pogués entrar sense ser vist... Ai, no em miris així, Harry. No ho he dit jo."]], [opt("Entesos.", "he-1")]),
  node("he-3", [["c-hermione", "Aigua del Llac Negre, una fulla de mandràgora, un pèl d'unicorn i una ploma de fènix. Tot al calder de la masmorra, foc amb la vareta i embotellar."], ["c-hermione", "I necessitaràs un permís de la McGonagall perquè l'Snape et deixi el calder."]], [opt("Gràcies.", "he-1")]),
  node("he-4", [["c-hermione", "És una sala del setè pis que només apareix quan la necessites. Diuen que cal passar tres vegades per davant d'una paret pensant molt fort què necessites."]], [opt("Interessant...", "he-1")]),
]);
D("d-pince", "Madame Pince", "c-pince", [
  node("pi-1", [["c-pince", "Xxxxt! Això és una biblioteca, no un camp de Quidditch."]], [
    opt("Puc entrar a la Secció Prohibida?", "pi-2"),
    opt("(Xiuxiuejant) Perdó."),
  ]),
  node("pi-2", [["c-pince", "Només amb un permís signat per un professor. I tu no en tens. I si en tinguessis, també me'l miraria amb lupa."]], [opt("D'acord, d'acord.")]),
]);
D("d-nick", "Nick Quasi Decapitat", "c-nick", [
  node("ni-1", [["c-nick", "Bona nit, jove Potter! Feliç Halloween! Avui faig cinc-cents cinc anys de mort, saps?"]], [
    opt("Has vist algú amb el Barret Seleccionador?", "ni-2"),
    opt("Com s'ha de tractar el Baró Sagnant?", "ni-3", { id: "op-reverencia" }),
    opt("Celebres el teu aniversari de mort?", "ni-4"),
    opt("Adéu, Nick."),
  ]),
  node("ni-2", [["c-nick", "Vaig veure en Peeves rient com un boig, amb un bony sota el braç, pujant cap a la Torre d'Astronomia."], ["c-nick", "Però a en Peeves no li trauràs res. Només té por d'una persona: el Baró Sagnant."]], [opt("El Baró Sagnant, eh?", "ni-1")]),
  node("ni-3", [["c-nick", "Amb molta reverència. Literalment: si no li fas una reverència abans de dirigir-li la paraula, ni et mira."], ["c-nick", "Ronda pel setè pis. Si fa cara de pomes agres, és ell. Sempre fa cara de pomes agres."]], [opt("Una reverència. Entesos.", "ni-1")]),
  node("ni-4", [["c-nick", "Faig una festa! Però ningú no hi vol venir. Diuen que les festes de fantasmes són... fredes."], ["c-nick", "Té, una invitació. Dona-la a qui vulguis. A algú que estigui sol, potser."]], [
    opt("Gràcies, Nick.", "ni-1", { once: true, actions: [take("o-invitacio")] }),
    opt("Ja en tinc una.", "ni-1"),
  ]),
]);
D("d-snape", "Snape", "c-snape", [
  node("sn-1", [["c-snape", "Potter. A la meva masmorra, a aquestes hores. Deu punts menys per a Gryffindor."]], [
    opt("Necessito fer servir un calder.", "sn-2", { conditions: [isVar("v-snape", false)] }),
    opt("Tinc un permís de la professora McGonagall.", null, { conditions: [hasItem("o-permis")], actions: [lose("o-permis"), setVar("v-snape", true), say("(Llegeix el permís amb cara d'haver mossegat una llimona)", "c-snape"), say("Molt bé. Faci servir el calder. Però si fa explotar res, ho pagarà vostè.", "c-snape"), OK()] }),
    opt("Sap qui ha robat el barret?", "sn-3"),
    opt("Me'n vaig, professor."),
  ]),
  node("sn-2", [["c-snape", "Els meus calders no són joguines per a famosos. Sense un permís d'un professor, ni el mira."]], [opt("...", "sn-1")]),
  node("sn-3", [["c-snape", "Si ho sabés, Potter, no l'hi diria a vostè. Algú ha posat Filtre de Son al te del director, i aquest algú sabia fer pocions... cosa que el descarta a vostè."]], [opt("Gràcies pel compliment.", "sn-1")]),
]);
D("d-myrtle", "Myrtle", "c-myrtle", [
  node("my-1", [["c-myrtle", "Què vols? Has vingut a riure't de la pobra Myrtle?"]], [
    opt("Aquest gripau és teu?", "my-2", { conditions: [isVar("v-myrtle", false)] }),
    opt("Tinc una invitació a una festa per a tu.", null, { conditions: [hasItem("o-invitacio")], actions: [lose("o-invitacio"), setVar("v-myrtle", true), say("Una festa? Per a MI? Ningú no m'havia convidat mai a res!", "c-myrtle"), say("Endu-te el gripau, si vols. Ara tinc vida social!", "c-myrtle"), OK()] }),
    opt("No, res. Adéu."),
  ]),
  node("my-2", [["c-myrtle", "Ara és meu. És l'únic que em fa companyia. Ningú no em convida mai a res... ni a festes, ni a res!"], ["c-myrtle", "BUAAAAAAH!"]], [opt("Ja me'n vaig...")]),
]);
D("d-dobby", "Dobby", "c-dobby", [
  node("do-1", [["c-dobby", "Harry Potter! Senyor! Dobby està tan content de veure'l!"]], [
    opt("Tens alguna cosa per menjar?", "do-2"),
    opt("Té, un mitjó.", null, { conditions: [hasItem("o-mitjo")], actions: [lose("o-mitjo"), say("Un MITJÓ! Ara Dobby en té dos, i són diferents! Té, el pastís de carbassa més gran de la cuina!", "c-dobby"), take("o-pastis"), OK()] }),
    opt("On amagaries una cosa perquè ningú no la trobés?", "do-3", { actions: [setVar("v-dobby", true)] }),
    opt("Adéu, Dobby."),
  ]),
  node("do-2", [["c-dobby", "Dobby donaria qualsevol cosa a Harry Potter! Però Dobby està trist... Dobby només té un mitjó, i els elfs lliures haurien de tenir-ne dos."]], [opt("Ho tindré en compte.", "do-1")]),
  node("do-3", [["c-dobby", "A la Sala dels Menesters, senyor! Al setè pis, davant del tapís dels trols ballarins."], ["c-dobby", "Cal passar tres vegades per davant de la paret, pensant molt fort en el que es necessita. I llavors apareix una porta!"]], [opt("Gràcies, Dobby!", "do-1")]),
]);
D("d-mcgonagall", "McGonagall", "c-mcgonagall", [
  node("mc-1", [["c-mcgonagall", "Potter. Algú ha entrat al despatx del director, ha robat el Barret Seleccionador i ha deixat el professor Dumbledore sumit en un son màgic."], ["c-mcgonagall", "Demà al matí arriben alumnes nous d'intercanvi i cal seleccionar-los. Sense barret... i sense director..."]], [
    opt("Què puc fer?", "mc-2"),
    opt("Quina és la contrasenya de la gàrgola?", "mc-3", { id: "op-contra" }),
    opt("Necessito un permís per fer servir un calder.", "mc-4", { conditions: [isVar("v-recepta", true), hasItem("o-permis", true), isVar("v-snape", false)] }),
    opt("Puc sortir als jardins?", "mc-5"),
    opt("Hi vaig de seguida."),
  ]),
  node("mc-2", [["c-mcgonagall", "Troba el barret, Potter. I si trobes la manera de despertar el director, encara millor."], ["c-mcgonagall", "La senyoreta Granger és a la biblioteca. Si algú sap com desfer un son màgic, és ella."]], [opt("Entesos.", "mc-1")]),
  node("mc-3", [["c-mcgonagall", "«Gotes de regalèssia». No la diguis a ningú. Ni al Ron Weasley."]], [opt("Gotes de regalèssia. Gràcies.", "mc-1")]),
  node("mc-4", [["c-mcgonagall", "Una Poció Despertadora? Brillant idea, la de la senyoreta Granger. Té, un permís signat. L'Snape rondinarà, però l'acceptarà."]], [opt("Gràcies, professora!", "mc-1", { once: true, actions: [take("o-permis"), OK()] })]),
  node("mc-5", [["c-mcgonagall", "De nit? Està prohibit, Potter. En Filch vigila la porta principal."], ["c-mcgonagall", "...Ara bé, si en Filch no et veu sortir, jo tampoc no t'hauré vist."]], [opt("No he sentit res.", "mc-1")]),
]);
D("d-gargola", "Gàrgola", null, [
  node("ga-1", [[null, "(La gàrgola em mira amb els ulls de pedra. Espera una contrasenya.)"]], [
    opt("Gotes de regalèssia.", null, { conditions: [said("d-mcgonagall", "op-contra")], actions: [sound("so-clic"), setState("o-gargola", "o-gargola-oberta"), say("La gàrgola fa un salt de costat i darrere seu apareix una escala de cargol que puja sola."), OK()] }),
    opt("Caramels de llimona.", null, { actions: [say("(La gàrgola no es mou. Era la contrasenya de l'any passat, segur.)")] }),
    opt("Obre't, sèsam.", null, { actions: [say("(La gàrgola em fa una ganyota.)")] }),
    opt("Si us plau?", null, { actions: [say("(Res. Les gàrgoles no tenen educació.)")] }),
    opt("(Marxar)"),
  ]),
]);
D("d-grassa", "Dama Grassa", null, [
  node("gr-1", [[null, "Contrasenya?"]], [
    opt("Cap de drac.", null, { conditions: [hasItem("o-nota")], actions: [setVar("v-grassa", true), say("Correcte, estimat. Passa, passa."), go("s-comuna", PT("comuna", "deRetrat"))] }),
    opt("Cap de... gripau?", null, { conditions: [hasItem("o-nota", true)], actions: [say("Frec, frec... però no. Sense contrasenya no passes, guapo.")] }),
    opt("Sóc en Harry Potter!", null, { actions: [say("I jo, la reina d'Anglaterra. Contrasenya!")] }),
    opt("Què li sembla la meva veu? Do-re-mi...", null, { actions: [say("Ai, no! Una altra vegada no! En Peeves ja m'ha vingut a cantar tota la setmana!")] }),
    opt("(Marxar)"),
  ]),
]);
D("d-filch", "Filch", "c-filch", [
  node("fi-1", [["c-filch", "Potter! Què hi fas, aquí, a aquestes hores? Ningú no surt del castell aquesta nit. Ordres de la professora McGonagall."]], [
    opt("Ha vist en Peeves?", "fi-2"),
    opt("Bona nit, senyor Filch."),
  ]),
  node("fi-2", [["c-filch", "Aquell poltergeist! Avui ha llençat tres bombes fètides al Gran Saló. Si en sento l'olor una altra vegada, el penjo pels turmells!"]], [opt("(Interessant...)")]),
]);
D("d-baro", "Baró Sagnant", "c-baro", [
  node("ba-1", [["c-baro", "..."]], [
    opt("Hola! Sóc en Harry...", null, { conditions: [said("d-nick", "op-reverencia", true)], actions: [say("(El Baró em mira com si fos una taca a la catifa. No diu res.)")] }),
    opt("(Fer una reverència molt profunda)", "ba-2", { conditions: [said("d-nick", "op-reverencia")] }),
    opt("(Marxar a poc a poc)"),
  ]),
  node("ba-2", [["c-baro", "Hm. Un jove amb modals. Avui dia en queden pocs. Què vols?"]], [
    opt("En Peeves ha robat una cosa i no vol dir on l'ha amagada.", "ba-3"),
    opt("Res, només volia saludar-lo, senyor Baró."),
  ]),
  node("ba-3", [["c-baro", "Peeves... Té, una de les meves cadenes. Fes-la sonar davant seu: recordarà qui mana en aquest castell."]], [
    opt("Gràcies, senyor Baró.", null, { once: true, actions: [take("o-cadena"), OK()] }),
    opt("Ja en tinc una, gràcies."),
  ]),
]);
D("d-peeves", "Peeves", "c-peeves", [
  node("pe-1", [["c-peeves", "Potty Potter! Pipí de gripau! El barret s'ha perdut, ningú sap on ha anat, ningú, ningú, NINGÚ!"]], [
    opt("On has amagat el barret, Peeves?", "pe-2"),
    opt("Per què l'has robat?", "pe-3"),
    opt("Adéu, Peeves."),
  ]),
  node("pe-2", [["c-peeves", "No t'ho diré, Potty! Ni que em suplicis! Ni que em llepis les sabates! Ni que...!"]], [opt("Ja n'hi ha prou.", "pe-1")]),
  node("pe-3", [["c-peeves", "Aquell barret vell em va dir que les meves cançons eren DOLENTES! Doncs ara que canti per als ratolins! Ji ji ji!"]], [opt("Ah.", "pe-1")]),
]);
D("d-draco", "Draco", "c-draco", [
  node("dr-1", [["c-draco", "Potter. Què hi fas, fora, de nit? L'Snape ho sabrà de seguida."]], [
    opt("Què hi fas tu, amb un paraigua rosa?", "dr-2"),
    opt("I tu, què hi fas, fora?", "dr-3"),
    opt("Adéu, Malfoy."),
  ]),
  node("dr-2", [["c-draco", "Això? És del gegant ximple. L'hi he pres per riure. Pesa com si estigués ple de pedres."], ["c-draco", "Te'l canvio... per la snitch que s'ha escapat del camp de Quidditch. Si la portes tu, que ets el Buscador «estrella»..."]], [opt("Ja veurem.", "dr-1")]),
  node("dr-3", [["c-draco", "Jo vaig on vull. El meu pare és al consell escolar."], ["c-draco", "...I m'he perdut tornant de l'hivernacle. Però això no ho diràs a ningú."]], [opt("Ni a una ànima.", "dr-1")]),
]);
D("d-hagrid", "Hagrid", "c-hagrid", [
  node("ha-1", [["c-hagrid", "Harry! Entra, entra, que fa fresca. Vols una galeta de roca? Acabades de fer!"]], [
    opt("Què et passa, Hagrid? Fas mala cara.", "ha-2"),
    opt("Puc entrar al Bosc Prohibit?", "ha-3"),
    opt("Han robat el Barret Seleccionador.", "ha-4"),
    opt("Me'n vaig, Hagrid."),
  ]),
  node("ha-2", [["c-hagrid", "En Malfoy m'ha pres el paraigua rosa aquesta tarda! I aquell paraigua és molt... especial. No et puc dir per què. No ho hauria d'haver dit."]], [opt("Te'l recuperaré.", "ha-1")]),
  node("ha-3", [["c-hagrid", "Ni pensar-hi! Bé... amb una llanterna i sense sortir del camí, potser. En Firenze ronda pel camí aquesta nit."], ["c-hagrid", "Però la llanterna la tinc jo, i no et deixo res fins que no em tornin el paraigua. Estic de mal humor."]], [opt("Entesos.", "ha-1")]),
  node("ha-4", [["c-hagrid", "El barret? Qui faria una cosa així? Pobre Dumbledore... el millor mag del món, això és el que és."], ["c-hagrid", "Si necessites res del bosc, en Firenze sap llegir els estels. Sempre sap coses."]], [opt("Gràcies, Hagrid.", "ha-1")]),
]);
D("d-sprout", "Sprout", "c-sprout", [
  node("sp-1", [["c-sprout", "Bona nit, Harry! Estic trasplantant mandràgores a la llum de la lluna. Els va molt bé per a les arrels."]], [
    opt("Necessito una fulla de mandràgora.", "sp-2", { conditions: [isVar("v-sprout", false)] }),
    opt("Les mandràgores fan mal?", "sp-3"),
    opt("Adéu, professora."),
  ]),
  node("sp-2", [["c-sprout", "Una fulla? Per a una poció, suposo. D'acord, però fem un tracte: necessito fems de drac per als testos, i en Hagrid en té un sac."]], [opt("Li portaré.", "sp-1")]),
  node("sp-3", [["c-sprout", "El crit d'una mandràgora jove et deixa estabornit unes hores. Mai, mai les toquis sense orelleres!"]], [opt("Ho recordaré.", "sp-1")]),
]);
D("d-hooch", "Hooch", "c-hooch", [
  node("ho-1", [["c-hooch", "Potter! Has vist el meu xiulet? L'he perdut durant el banquet i sense xiulet no sóc ningú."]], [
    opt("On el podries haver perdut?", "ho-2"),
    opt("Què hi fa, la snitch, allà dalt?", "ho-3"),
    opt("Adéu, Madame Hooch."),
  ]),
  node("ho-2", [["c-hooch", "Al Gran Saló, segur. Vaig fer un xiulet de sorpresa a la taula dels professors i el director va riure tant que se'm va caure."]], [opt("Ho miraré.", "ho-1")]),
  node("ho-3", [["c-hooch", "La snitch d'entrenament s'ha escapat de la capsa. Si tingués el xiulet, et deixaria una escombra per atrapar-la."]], [opt("Entesos.", "ho-1")]),
]);
D("d-firenze", "Firenze", "c-firenze", [
  node("fz-1", [["c-firenze", "Harry Potter. Els estels deien que vindries aquesta nit."]], [
    opt("Necessito un pèl d'unicorn.", "fz-2"),
    opt("Saps qui ha robat el Barret Seleccionador?", "fz-3"),
    opt("Adéu, Firenze."),
  ]),
  node("fz-2", [["c-firenze", "Els unicorns només donen el seu pèl a qui sap mirar el cel. Digues-me, Harry Potter: quin planeta brilla més aquesta nit?"]], [
    opt("Venus.", "fz-4"),
    opt("Júpiter.", "fz-4"),
    opt("Mart.", null, { conditions: [isVar("v-mart", true)], once: true, actions: [say("Mart. Fa segles que no brillava així. Sí: saps mirar.", "c-firenze"), say("Té. L'unicorn el va deixar anar ahir, quan el vaig ajudar. És per a qui el necessita de debò.", "c-firenze"), take("o-pel"), OK()] }),
    opt("Mart.", "fz-5", { conditions: [isVar("v-mart", false)] }),
    opt("No ho sé.", "fz-5"),
  ]),
  node("fz-3", [["c-firenze", "Els estels no parlen de lladres. Però Mart, el guerrer, brilla vermell: hi haurà baralla abans de l'alba. I música."]], [opt("Música?", "fz-1")]),
  node("fz-4", [["c-firenze", "No. Mires sense veure, com tots els humans. Puja a la torre més alta i mira-ho bé."]], [opt("...", "fz-1")]),
  node("fz-5", [["c-firenze", "Endevinar no és saber. Puja a la torre més alta del castell i mira-ho amb els teus ulls."]], [opt("D'acord.", "fz-1")]),
]);
D("d-luna", "Luna", "c-luna", [
  node("lu-1", [["c-luna", "Hola, Harry. Estic pescant plimpies. Però no recordo quin cebo els agrada; ho deia el Quisquiller del mes passat."]], [
    opt("Què són els plimpies?", "lu-2"),
    opt("Has vist algú estrany aquesta nit?", "lu-3"),
    opt("Per què necessites el flascó?", "lu-4"),
    opt("Adéu, Luna."),
  ]),
  node("lu-2", [["c-luna", "Uns peixets rodons amb potes. Fan olor de llimona. El meu pare diu que si te'n menges un, pots respirar sota l'aigua... però només de dijous."]], [opt("Ah.", "lu-1")]),
  node("lu-3", [["c-luna", "En Peeves ha passat volant cap a la torre amb un barret. El barret cantava una cançó molt trista. Em va agradar."]], [opt("Ho sabia!", "lu-1")]),
  node("lu-4", [["c-luna", "Per guardar-hi els plimpies. Però si em portessis un Quisquiller, potser recordaria el cebo... i llavors ja no el necessitaria."]], [opt("Ho miraré.", "lu-1")]),
]);
D("d-barret", "Barret Seleccionador", null, [
  node("ba-b1", [["c-barret", "Què vols, noi? Vine a dir-me que les meves cançons són avorrides, com aquell poltergeist?"]], [
    opt("Has de tornar. Demà s'han de seleccionar alumnes nous!", "ba-b2"),
    opt("A mi m'agraden les teves cançons.", "ba-b3"),
    opt("(Marxar)"),
  ]),
  node("ba-b2", [["c-barret", "Que els seleccioni un altre! Mil anys cantant i ningú no em fa cas. Aquí, almenys, els trastos no es queixen."]], [opt("...", "ba-b1")]),
  node("ba-b3", [["c-barret", "De debò? Doncs demostra-ho! Una mica de música, almenys. Fa segles que ningú no em toca una melodia."]], [opt("Hm. Una melodia...", "ba-b1")]),
]);
// Veu del barret (no es col·loca enlloc: parla des de l'objecte)
P.character({ id: "c-barret", name: "Barret Seleccionador", description: "", color: "#e8c890", look: { skin: "#7a5a38", hair: "#6a5030", hat: "#7a5a38", shirt: "#6a5030", pants: "#5a4028", shoes: "#3a2a1a" } });

/* ---------- Seqüències ---------- */
P.cutscenes.push(
  { id: "cs-intro", name: "Introducció", actions: [
    wait(0.6),
    say("Harry! Harry, desperta't!", "c-neville"),
    say("Mmm... Neville? Encara és fosc..."),
    say("La professora McGonagall ha vingut a buscar-te! Diu que vagis al passadís de la gàrgola, al segon pis. És urgent!", "c-neville"),
    say("La gàrgola? Allà hi ha el despatx de Dumbledore. Alguna cosa ha passat."),
    take("o-varita"),
    say("Agafo la vareta. Una nit de Halloween tranquil·la... segur que no."),
  ] },
  { id: "cs-mcgonagall", name: "McGonagall", actions: [say("Potter! Per fi. Vine, ràpid.", "c-mcgonagall"), talkTo("d-mcgonagall")] },
  { id: "cs-despatx", name: "El despatx", actions: [say("Dumbledore dorm dret darrere l'escriptori, amb un somriure."), say("I el prestatge del Barret Seleccionador... és buit."), say("Necessito dues coses: el barret i alguna manera de despertar-lo.")] },
  { id: "cs-recepta", name: "La recepta", actions: [
    lose("o-llibre"), setVar("v-recepta", true),
    say("Harry! Com ho has...? No, no m'ho expliquis. No vull saber-ho.", "c-hermione"),
    say("A veure... «Poció Despertadora»: aigua del Llac Negre, una fulla de mandràgora, un pèl d'unicorn i una ploma de fènix.", "c-hermione"),
    say("Es barreja al calder, s'escalfa amb un encanteri de foc i s'embotella. Té, t'ho he apuntat.", "c-hermione"),
    take("o-recepta"),
    say("El calder ha de ser el de la masmorra, i l'Snape no te'l deixarà sense un permís de la McGonagall.", "c-hermione"),
    say("I jo tornaré el llibre abans que Madame Pince se n'adoni.", "c-hermione"), OK(),
  ] },
  { id: "cs-peeves", name: "Peeves confessa", actions: [
    say("Faig sonar la cadena del Baró... CLANC, CLANC, CLANC!"),
    say("EL BARÓ! No, no, no, senyor Baró! Ho confesso tot!", "c-peeves"),
    say("He amagat el barret a la sala on s'amaguen les coses, al setè pis! Allà on tothom amaga el que no vol que es trobi!", "c-peeves"),
    say("Per entrar-hi cal demanar «un lloc per amagar coses»... però ara el barret no en vol sortir! Diu que allà ningú no li critica les cançons!", "c-peeves"),
    say("...Un moment. Tu no ets el Baró! POTTY! M'has enganyat! Ji ji ji!", "c-peeves"),
    setVar("v-peeves", true), OK(),
  ] },
  { id: "cs-sala", name: "La Sala dels Menesters", actions: [say("Uau... Hi ha trastos de mil anys enrere."), say("I allà dalt, a la punta de la muntanya més alta... el Barret Seleccionador!")] },
  { id: "cs-volar", name: "Volar fins al barret", actions: [say("Pujo a l'escombra i m'enlairo entre les muntanyes de trastos..."), setVar("v-dalt", true), wait(0.5), say("...fins arribar al costat del barret, a tocar del sostre."), say("Tu, altra vegada? Fora d'aquí! No penso tornar!", "c-barret")] },
  { id: "cs-barret", name: "La flauta i el barret", actions: [
    say("Toco la flauta. L'única cançó que sé, i malament."), sound("so-moneda"),
    say("...Oh. Oh! Aquesta melodia... Ningú no m'havia tocat una cançó, en mil anys!", "c-barret"),
    say("I sabeu què? Té bon ritme per a una cançó nova! Ja la tinc! Porta'm a casa, noi, que tinc feina!", "c-barret"),
    setVar("v-barret", true), take("o-barret"), say("Baixo amb el barret sota el braç. Ara, a despertar Dumbledore!"), OK(),
  ] },
  { id: "cs-despertar", name: "Dumbledore es desperta", actions: [
    say("Li faig beure unes gotes de poció..."), wait(0.6), sound("so-exit"),
    say("...Ah. Bon dia, Harry. O bona nit, més aviat. Quin son més estrany. He somiat que era un caramel de llimona.", "c-dumbledore"),
    say("Algú em va posar Filtre de Son al te. Un poltergeist, diria, per l'olor de bomba fètida. I el meu barret?", "c-dumbledore"),
  ] },
  { id: "cs-final", name: "Final", actions: [
    setState("o-prestatge", "o-prestatge-barret"), music("so-final"),
    say("El Barret Seleccionador! Harry, m'has salvat el curs. I potser el castell.", "c-dumbledore"),
    say("Ejem, ejem. Tinc una cançó nova. La vull dedicar a aquest jove de les ulleres rodones:", "c-barret"),
    say("«Un noi amb flauta i escombra, que no té por de la foscor, va trobar un barret amb ombra i li va tornar la cançó!»", "c-barret"),
    say("Magnífic. Cinquanta punts per a Gryffindor. I ara, si em disculpes, em ve de gust un caramel de llimona.", "c-dumbledore"),
    wait(0.5),
    end("L'endemà al matí, el Barret Seleccionador va seleccionar els alumnes nous cantant la seva cançó més llarga (quaranta-tres estrofes). En Peeves va netejar els lavabos durant un mes, vigilat pel Baró Sagnant. I a la Dama Grassa li van regalar unes orelleres. FI."),
  ] },
);

/* ---------- Pantalla de títol i escriure ---------- */
const titol = new Canvas(320, 200); titol.draw(S.jardins.bg, 0, 0);
titol.rect(26, 8, 268, 50, [10, 10, 30, 190]);
titol.text(160 - Canvas.textWidth("HARRY POTTER", 4) / 2 + 2, 14, "HARRY POTTER", "#5a3a10", 4);
titol.text(160 - Canvas.textWidth("HARRY POTTER", 4) / 2, 12, "HARRY POTTER", "#ffd23f", 4);
titol.text(160 - Canvas.textWidth("I EL BARRET DESAPAREGUT", 2) / 2, 38, "I EL BARRET DESAPAREGUT", "#e8e0c8", 2);

await P.write(join(HERE, "joc.zip"), {
  startSceneId: "s-dormitori", playerId: "c-harry", introCutsceneId: "cs-intro",
  titleScreen: { image: titol, subtitle: "Una aventura de Halloween a Hogwarts", music: "so-tema" },
  credits: "Aventura no oficial feta per a ús personal, inspirada en els llibres de Harry Potter de J. K. Rowling (els personatges i el món són seus). Guió, decorats en perspectiva, personatges i música fets per codi amb el skill aventura-grafica. Sense cap imatge externa.",
});
console.log(`Escenaris: ${P.scenes.length} · personatges: ${P.characters.length} · objectes: ${P.objects.length} · regles: ${P.rules.length} · diàlegs: ${P.dialogues.length}`);
// La còpia estàtica per a GitHub Pages (docs/jocs/barret-perdut/). Per pujar-la: node tools/web/jocs.mjs barret-perdut --push
const { publishGame } = await import(new URL("../../tools/web/jocs.mjs", import.meta.url));
console.log(`Joc estàtic a ${await publishGame("barret-perdut")}`);
