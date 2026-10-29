// Acte I — Transilvània: de l'hotel de Bistritz a la fugida del castell
export default function acte1({ P, K, E, O, pj, escena, aparicio }) {
  const { rect, leftEdge, rightEdge, spot, exit, npc, place, obj, chr, hot, hasItem, inState, isVar, say, take, lose, setState, setVar, sound, music, cutscene, wait, rule, dialogue, node, opt } = K;
  const V = (id) => isVar(id, true);
  const COMTE = "c-comte";

  /* ---------- Objectes ---------- */
  P.object({ id: "o-diari", name: "diari", description: "El meu diari, escrit en taquigrafia. Si algú el llegeix, no entendrà res. Aquesta és la idea.", pickable: true, states: [["normal", "Normal", O.diari()]] });
  P.object({ id: "o-escriptures", name: "escriptures de Carfax", description: "Les escriptures de compravenda de Carfax, una finca vella a Purfleet, vora Londres. Amb una capella que no fa servir ningú.", pickable: true, states: [["normal", "Normal", O.escriptures()]] });
  P.object({ id: "o-carta", name: "carta del comte", description: "«Benvingut als Carpats. La diligència de Bukovina us espera a la plaça. Dormiu bé. —Dràcula.» La lletra és antiga i molt elegant.", pickable: true, states: [["normal", "Normal", O.carta()]] });
  P.object({ id: "o-crucifix", name: "crucifix", description: "Un crucifix petit que em va penjar la dona de l'hotel. Sóc protestant, però ara mateix no em sembla moment de discutir de teologia.", pickable: true, states: [["normal", "Normal", O.crucifix()]] });
  P.object({ id: "o-mirall", name: "mirall d'afaitar", description: "El meu mirallet d'afaitar. L'únic mirall que he vist en tot el castell.", pickable: true, states: [["normal", "Normal", O.mirall()]] });
  P.object({ id: "o-clau-rovellada", name: "clau rovellada", description: "Una clau gran i rovellada. Fa olor de pols de segles.", pickable: true, states: [["normal", "Normal", O.clauRovellada()]] });
  P.object({ id: "o-clau-ferro", name: "clau de ferro", description: "Una clau de ferro negre, freda com si sortís d'un pou.", pickable: true, states: [["normal", "Normal", O.clauFerro()]] });
  P.object({ id: "o-bossa-or", name: "bossa d'or", description: "Monedes d'or de tots els països i de totes les èpoques. Algunes tenen tres-cents anys. Pesen com un mal record.", pickable: true, states: [["normal", "Normal", O.bossaOr()]] });
  P.object({ id: "o-cofre", name: "munt d'or", description: "Un cofre desbordant de monedes d'or. Romanes, turques, austríaques, angleses... cobertes de pols.", states: [["normal", "Normal", O.cofreOr()]] });
  P.object({ id: "o-pala", name: "pala", description: "Una pala de les que fan servir els gitanos per omplir les caixes de terra.", pickable: true, states: [["normal", "Normal", O.pala()]] });
  P.object({ id: "o-caixes-castell", name: "caixes de terra", description: "Cinquanta caixes de fusta plenes de terra. Totes porten la mateixa adreça: Carfax, Purfleet, Anglaterra.", states: [["normal", "Normal", O.caixes(6)]] });
  P.object({ id: "o-comte-caixa", name: "el comte", description: "El comte, ajagut dins d'una caixa de terra. No respira, però no és mort. Té la boca tacada de sang fresca.", states: [["dorm", "Dorm", O.caixaComte(false)], ["ferit", "Ferit", O.caixaComte(true)]] });
  aparicio("o-calessa", "cotxer negre", "Un cotxer alt, embolicat en una capa negra, amb un barret que li tapa la cara. Els ulls li brillen vermells.", O.calessa());
  aparicio("o-comte-pati", "el comte", "Un vell alt, vestit de negre de cap a peus, amb un llum antic a la mà.", E.grup([E.figura(E.LOOKS.dracula, 4), O.llum()], 0));
  aparicio("o-comte-sala", "el comte", "El comte Dràcula. Les ungles llargues, les orelles punxegudes, i un alè que fa olor de cripta.", E.figura(E.LOOKS.dracula, 0, true));
  aparicio("o-germanes", "les tres germanes", "Tres dones pàl·lides com la lluna, amb els llavis vermells i les dents esmolades. Riuen sense fer soroll.", O.germanes());

  /* ---------- Personatges ---------- */
  pj("c-hostaler", "hostaler", "hostaler", "L'hostaler de la Corona d'Or. Somriu massa i em mira el coll.", "#e0c090");
  pj("c-hostalera", "hostalera", "hostalera", "La dona de l'hostaler. Té els ulls vermells de plorar... per mi?", "#e8a0b0");
  pj("c-cotxer", "cotxer", "cotxer de la diligència", "El cotxer de la diligència de Bukovina. Bigoti immens, paciència minúscula.", "#d0b080");
  pj("c-pagesa", "pagesa", "pagesa", "Una pagesa amb un mocador vermell. No para de fer el senyal de la creu.", "#d8a0a0");

  /* ---------- Escenaris ---------- */
  escena("hotel", "Hotel Corona d'Or", "Bistritz, a les portes dels Carpats. Fa olor de paprika i de por.", {
    walkable: [[[0, 170], [320, 165], [320, 199], [0, 199]]], music: "so-transilvania",
    hotspots: [
      exit("ex-hotel-placa", "Sortir a la plaça", rightEdge(165), "s-placa", [40, 186]),
      spot("ho-hotel-finestra", "finestra", "Fora, la nit cau sobre les muntanyes. Algú hi ha penjat una branca d'all.", rect(180, 50, 36, 60)),
      spot("ho-hotel-llar", "llar de foc", "El foc crepita. És l'única cosa alegre d'aquest lloc.", rect(0, 20, 30, 100)),
      spot("ho-hotel-pagesos", "pagesos", "Pagesos que beuen i xiuxiuegen. Sento paraules estranyes: «ördög», «pokol», «vrolok».", rect(80, 100, 120, 65)),
    ],
    characters: [npc("c-hostaler", [235, 186], "left"), npc("c-hostalera", [285, 190], "left")],
  });
  escena("placa", "Plaça de Bistritz", "La plaça del poble, sota les muntanyes. La diligència espera.", {
    walkable: [[[0, 168], [320, 163], [320, 199], [0, 199]]], music: "so-transilvania",
    hotspots: [
      exit("ex-placa-hotel", "Tornar a l'hotel", leftEdge(168), "s-hotel", [290, 186]),
      exit("ex-placa-diligencia", "Pujar a la diligència", rect(262, 118, 40, 44), "s-borgo", [60, 188], {
        conditions: [V("v-seient")], blocked: "El cotxer em barra el pas: «Bitllet? Carta? Res?»",
      }),
      spot("ho-placa-muntanyes", "muntanyes", "Els Carpats. Allà dalt, en algun lloc, m'espera el castell del comte.", rect(40, 10, 240, 70)),
      spot("ho-placa-vilatans", "vilatans", "Gent que em mira i fa el senyal de la creu. M'estic començant a ofendre.", rect(120, 130, 70, 30)),
    ],
    characters: [npc("c-cotxer", [230, 184], "left"), npc("c-pagesa", [90, 186], "right")],
  });
  escena("borgo", "Pas del Borgo", "El pas del Borgo, a mitjanit. La diligència m'ha deixat aquí, sol, i ha fugit a tota velocitat.", {
    walkable: [[[0, 172], [320, 172], [320, 199], [0, 199]]], music: "so-dracula", transition: "iris",
    hotspots: [
      exit("ex-borgo-castell", "Pujar a la calessa", rect(196, 150, 50, 40), "s-pati", [80, 190], {
        conditions: [V("v-calessa")], blocked: "La calessa negra espera. El cotxer em mira sense dir res. Potser hauria de parlar-hi.",
      }),
      spot("ho-borgo-lluna", "lluna", "Una lluna plena, freda i blanca. Sembla que m'observi.", rect(150, 10, 22, 20)),
      spot("ho-borgo-llops", "llops", "Entre els arbres brillen desenes d'ulls. Llops. I s'acosten.", rect(0, 120, 80, 50)),
      spot("ho-borgo-cami", "camí", "El camí cap al castell. Ple de neu i de silenci.", rect(90, 135, 100, 30)),
    ],
    objects: [place("o-calessa", [220, 192], [180, 190])],
  });
  escena("pati", "Pati del castell", "El pati del castell de Dràcula. Ruïnes, torres i un silenci que fa mal a les orelles.", {
    walkable: [[[0, 176], [320, 173], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-pati-sala", "Porta del castell", rect(140, 110, 40, 60), "s-sala", [120, 192], {
        conditions: [V("v-benvinguda")], blocked: "La porta és tancada. Sento passos a l'altra banda.",
      }),
      spot("ho-pati-torre", "torre", "Una torre altíssima. Cap finestra no té llum.", rect(0, 50, 45, 120)),
      spot("ho-pati-muralles", "muralles", "Muralles antigues, plenes d'esquerdes. Per aquí ningú no ha entrat ni sortit en anys.", rect(185, 110, 85, 55)),
    ],
    objects: [place("o-comte-pati", [166, 184], [140, 188])],
  });
  escena("sala", "Gran saló", "El gran saló del castell. Un sopar per a un sol convidat. El comte no menja mai.", {
    walkable: [[[0, 188], [150, 182], [320, 180], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-sala-pati", "Tornar al pati", leftEdge(186), "s-pati", [160, 190]),
      exit("ex-sala-passadis", "Porta del passadís", rect(182, 95, 30, 88), "s-passadis", [60, 190]),
      spot("ho-sala-escut", "escut d'armes", "L'escut dels Dràcula: un drac. El comte diu que els seus avantpassats van lluitar contra el turc. Ho diu com si ell hi hagués estat.", rect(20, 30, 90, 150)),
      spot("ho-sala-aranya", "aranya de llums", "Les espelmes no s'acaben mai. No sé qui les encén.", rect(115, 55, 100, 65)),
      spot("ho-sala-sostre", "sostre", "Un sostre d'escuts i dracs. Tot fa olor de segles.", rect(120, 0, 200, 50)),
    ],
    objects: [place("o-comte-sala", [252, 194], [225, 194])],
  });
  escena("biblioteca", "Biblioteca", "La biblioteca del comte. Tot són llibres anglesos.", {
    walkable: [[[0, 166], [320, 162], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-biblio-passadis", "Tornar al passadís", leftEdge(166), "s-passadis", [40, 192]),
      spot("ho-biblio-mapa", "mapa d'Anglaterra", "Un mapa d'Anglaterra amb cercles a llapis: Exeter, Whitby, Purfleet. Està tort, com si algú el mogués sovint.", rect(185, 40, 30, 35)),
      spot("ho-biblio-prestatges", "prestatges", "Història d'Anglaterra, la guia de ferrocarrils Bradshaw, l'almanac de Whitaker... El comte estudia Anglaterra com qui estudia un mapa de caça.", rect(0, 40, 60, 120)),
      spot("ho-biblio-finestra", "finestra", "Les finestres tenen reixes. Per fora, un precipici.", rect(120, 35, 60, 80)),
      spot("ho-biblio-taula", "taula", "Una taula amb papers en un idioma que no conec i una llista d'adreces de Londres.", rect(160, 100, 100, 30)),
    ],
  });
  escena("cambra", "La meva cambra", "La cambra on dormo. Luxosa, freda, i sense cap mirall destapat.", {
    walkable: [[[0, 179], [320, 177], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-cambra-passadis", "Sortir al passadís", rightEdge(177), "s-passadis", [280, 192]),
      exit("ex-cambra-finestra", "finestra", rect(200, 90, 50, 60), "s-muralla", [40, 190], {
        conditions: [V("v-reptar")], blocked: "Sortir per la finestra? Hi ha cent metres de caiguda. Només un boig... o algú que hagi vist com es fa.",
        description: "Una finestra alta que dona a la muralla. A sota, el precipici.",
      }),
      spot("ho-cambra-mirall-paret", "mirall de la paret", "Un mirall cobert amb un drap negre, clavat a la paret. En aquest castell no hi ha cap mirall destapat.", rect(0, 75, 40, 115)),
      spot("ho-cambra-aranya", "aranya", "Una aranya de cristall que tremola quan passen els ratpenats.", rect(135, 0, 40, 70)),
    ],
    objects: [place("o-mirall", [206, 156], [206, 186], { layer: "back" })],
  });
  escena("passadis", "Passadís", "Un passadís llarg, de voltes de pedra. Al fons, una porta tancada.", {
    walkable: [[[120, 150], [200, 150], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-passadis-sala", "Al gran saló", rect(25, 80, 35, 90), "s-sala", [200, 192]),
      exit("ex-passadis-biblio", "A la biblioteca", rect(85, 90, 25, 60), "s-biblioteca", [40, 186]),
      exit("ex-passadis-cambra", "A la meva cambra", rect(240, 100, 60, 70), "s-cambra", [290, 190]),
      exit("ex-passadis-alasud", "Porta de l'ala sud", rect(145, 70, 30, 70), "s-ala-sud", [40, 190], {
        conditions: [hasItem("o-clau-rovellada")], blocked: "La porta del fons és tancada. El pany és enorme i rovellat.",
      }),
      spot("ho-passadis-fanal", "fanal", "Un fanal que crema sense oli. Prefereixo no pensar-hi.", rect(150, 25, 20, 30)),
    ],
  });
  escena("ala-sud", "Ala sud", "Les cambres abandonades de l'ala sud, on fa segles que no viu ningú. O això diu el comte.", {
    walkable: [[[0, 176], [320, 176], [320, 199], [0, 199]]], music: "so-dracula",
    onEnter: { cutsceneId: "cs-germanes", once: true },
    hotspots: [
      exit("ex-alasud-passadis", "Tornar al passadís", leftEdge(176), "s-passadis", [160, 160]),
      spot("ho-alasud-rosassa", "rosassa", "Una rosassa per on entra la lluna. Fa dibuixos al terra que semblen ulls.", rect(115, 85, 35, 30)),
      spot("ho-alasud-retrats", "retrats", "Retrats de nobles i dames d'altres temps. Totes les dames s'assemblen a... no. No pot ser.", rect(230, 40, 90, 130)),
    ],
    objects: [place("o-germanes", [170, 194], [130, 192]), place("o-clau-ferro", [276, 152], [262, 190], { layer: "back" })],
  });
  escena("muralla", "La muralla", "Per fora del castell, sobre la muralla. El vent udola. A sota, el no-res.", {
    walkable: [[[0, 178], [320, 176], [320, 199], [0, 199]]], transition: "iris",
    hotspots: [
      exit("ex-muralla-cambra", "Tornar per la finestra", leftEdge(178), "s-cambra", [230, 190]),
      exit("ex-muralla-comte", "Finestra de la cambra del comte", rect(255, 140, 40, 40), "s-cambra-comte", [40, 192]),
      spot("ho-muralla-torres", "torres", "Les torres del castell, retallades contra la lluna. Hi volen ratpenats.", rect(60, 20, 190, 120)),
      spot("ho-muralla-abisme", "abisme", "Centenars de metres de no-res. No miro avall. Ja ho he fet. No ho torno a fer.", rect(100, 186, 120, 13)),
    ],
  });
  escena("cambra-comte", "Cambra del comte", "La cambra del comte. Luxe antic, pols, i cap llit on dormir.", {
    walkable: [[[0, 174], [70, 167], [250, 162], [320, 166], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-ccomte-muralla", "Sortir a la muralla", leftEdge(174), "s-muralla", [290, 190]),
      exit("ex-ccomte-capella", "Porta de roure", rect(280, 50, 36, 96), "s-capella", [40, 194], {
        conditions: [hasItem("o-clau-ferro")], blocked: "Una porta de roure amb un pany de ferro negre. Tancada.",
      }),
      spot("ho-ccomte-aranya", "aranya", "Una aranya de llums encesa. El comte no necessita llum. La té per als convidats.", rect(90, 5, 60, 40)),
      spot("ho-ccomte-sofas", "sofàs", "Sofàs de vellut on fa segles que no seu ningú. Hi ha pols en forma de persona.", rect(70, 130, 170, 40)),
    ],
    objects: [place("o-cofre", [292, 194], [268, 192])],
  });
  escena("capella", "Capella del castell", "La capella en ruïnes, sota el castell. Fa olor de terra remoguda i de mort.", {
    walkable: [[[0, 184], [320, 184], [320, 199], [0, 199]]], music: "so-dracula",
    hotspots: [
      exit("ex-capella-ccomte", "Escala amunt", leftEdge(184), "s-cambra-comte", [250, 190]),
      exit("ex-capella-esquerda", "Esquerda del mur", rightEdge(184), "s-espadat", [100, 186], {
        conditions: [V("v-fugida")], blocked: "Hi ha una esquerda al mur que dona a fora. Però abans de fugir... aquest monstre no pot continuar dormint tan tranquil.",
      }),
      spot("ho-capella-columnes", "columnes", "Columnes gòtiques que aguanten segles i coses pitjors.", rect(30, 40, 70, 140)),
      spot("ho-capella-volta", "volta", "La volta és plena de ratpenats que dormen cap per avall. Com el seu amo.", rect(100, 0, 220, 60)),
    ],
    objects: [place("o-caixes-castell", [70, 199], [70, 192]), place("o-comte-caixa", [176, 199], [148, 194]), place("o-pala", [272, 197], [254, 194])],
  });
  escena("espadat", "L'espadat", "Un camí de cabres a la vora del precipici. Baix de tot, el riu i la llibertat.", {
    walkable: [[[60, 170], [320, 165], [320, 199], [60, 199]]], music: "so-transilvania",
    onEnter: { cutsceneId: "cs-espadat", once: true },
    hotspots: [
      exit("ex-espadat-baixar", "Baixar per l'espadat", rightEdge(165), "s-budapest", [80, 190]),
      spot("ho-espadat-cami", "camí", "Un camí estret que baixa fent ziga-zagues. Si rellisco, s'ha acabat la història.", rect(150, 110, 100, 50)),
      spot("ho-espadat-arbre", "arbre", "Un arbre torçat pel vent, aferrat a la roca. Com jo.", rect(180, 30, 70, 60)),
    ],
  });

  /* ---------- Lògica ---------- */
  P.variable("v-seient", "seient_diligencia");
  P.variable("v-calessa", "calessa");
  P.variable("v-benvinguda", "benvinguda");
  P.variable("v-venda", "venda_signada");
  P.variable("v-mirall", "sap_que_no_fa_reflex");
  P.variable("v-reptar", "ha_vist_reptar");
  P.variable("v-germanes-fora", "germanes_fora");
  P.variable("v-fugida", "comte_ferit");

  P.rules.push(
    // Bistritz
    rule("talk", hot("ho-hotel-pagesos"), null, [], [say("Bona nit! Algú sap on és el castell de Dràcula?"), say("(Silenci. Tots fan el senyal de la creu i miren el got.)")]),
    rule("give", obj("o-carta"), chr("c-cotxer"), [], [
      lose("o-carta"), say("Del comte? Del comte...", "c-cotxer"), say("Pugi, pugi. Però jo no passo del pas del Borgo. Ni per tot l'or del món.", "c-cotxer"),
      setVar("v-seient", true), sound("so-clic"),
    ]),
    rule("give", obj("o-carta"), chr("c-hostaler"), [], [say("No, no, és per a vostè, senyor! No la vull ni tocar.", "c-hostaler")]),
    rule("give", obj("o-crucifix"), chr("c-pagesa"), [], [say("No, senyor! Quedi-se'l. Vostè el necessita més que jo.", "c-pagesa")]),
    // El pas del Borgo
    rule("talk", obj("o-calessa"), null, [isVar("v-calessa", false)], [cutscene("cs-borgo")]),
    rule("talk", obj("o-calessa"), null, [], [say("No diu res. Només espera que pugi.")]),
    rule("use", obj("o-crucifix"), obj("o-calessa"), [], [say("El cotxer gira el cap, molest. Millor no fer-lo enfadar a mitjanit enmig del no-res.")]),
    // El pati
    rule("talk", obj("o-comte-pati"), null, [], [cutscene("cs-benvinguda")]),
    // El saló: la venda i el mirall
    rule("give", obj("o-escriptures"), obj("o-comte-sala"), [], [
      lose("o-escriptures"),
      say("Carfax... Una casa vella, amb una capella. M'agrada. Les cases noves no tenen ombres.", COMTE),
      say("Signat. Ara escriurà tres cartes als seus: diran que es queda un mes. Insisteixo, amic meu.", COMTE),
      setVar("v-venda", true), sound("so-campana"),
    ]),
    rule("use", obj("o-mirall"), obj("o-comte-sala"), [V("v-venda")], [cutscene("cs-mirall")]),
    rule("use", obj("o-mirall"), obj("o-comte-sala"), [], [say("Primer, els negocis. He vingut a vendre una casa.")]),
    rule("use", obj("o-mirall"), null, [], [say("M'hi veig cansat i pàl·lid. Com si m'hagués deixat sang en algun lloc.")]),
    rule("talk", obj("o-comte-sala"), null, [], [K.talkTo("d-comte")]),
    rule("use", obj("o-crucifix"), obj("o-comte-sala"), [], [say("El comte s'aparta amb un gest de fàstic. Millor no el provoco... encara."), say("Aquest objecte no li agrada gens. Me'n recordaré.")]),
    rule("give", obj("o-crucifix"), obj("o-comte-sala"), [], [say("Ni boig. Aquest crucifix és l'única cosa que m'ha fet sentir segur des que vaig arribar.")]),
    rule("pickup", obj("o-comte-sala"), null, [], [say("Prefereixo no tocar-lo. Té les mans fredes com un cadàver.")]),
    // La cambra i la finestra
    rule("look", hot("ex-cambra-finestra"), null, [V("v-mirall"), isVar("v-reptar", false)], [cutscene("cs-reptar")]),
    // La biblioteca
    rule("pull", hot("ho-biblio-mapa"), null, [hasItem("o-clau-rovellada", true)], [sound("so-clic"), take("o-clau-rovellada"), sound("so-descobert"), say("Darrere del mapa hi havia una clau penjada! Una clau enorme i rovellada.")]),
    rule("pull", hot("ho-biblio-mapa"), null, [], [say("Ja no hi ha res més darrere. Només pols i una aranya ofesa.")]),
    rule("push", hot("ho-biblio-mapa"), null, [], [say("Es mou una mica cap als costats. Potser estirant-lo...")]),
    rule("pickup", hot("ho-biblio-mapa"), null, [], [say("És clavat a la paret. Però es mou una mica, com si s'hi pogués estirar.")]),
    rule("pickup", hot("ho-biblio-prestatges"), null, [], [say("No he vingut a llegir. He vingut a sortir d'aquí viu.")]),
    // L'ala sud
    rule("use", obj("o-crucifix"), obj("o-germanes"), [], [
      sound("so-ensurt"), say("(Aixeco el crucifix...)"), say("Ens fa mal! Ens fa mal!", "c-veu-germanes"),
      setState("o-germanes", "o-germanes-amagat"), setVar("v-germanes-fora", true), sound("so-descobert"),
      say("Es desfan com pols a la llum de la lluna. Ara puc respirar."),
    ]),
    rule("talk", obj("o-germanes"), null, [], [say("Vine... vine, germanet. Només un petó.", "c-veu-germanes"), say("No, gràcies. Ja tinc promesa.")]),
    rule("pickup", obj("o-clau-ferro"), null, [isVar("v-germanes-fora", false)], [say("Les germanes em barren el pas. Riuen, i s'acosten.")]),
    // La cambra del comte
    rule("pickup", obj("o-cofre"), null, [hasItem("o-bossa-or", true)], [take("o-bossa-or"), sound("so-descobert"), say("Me n'emporto una bossa. Em deu tres mesos de sou i l'ànima.")]),
    rule("pickup", obj("o-cofre"), null, [], [say("Ja en tinc prou. L'or no em traurà d'aquí. O potser sí: me'l guardo per si de cas.")]),
    // La capella
    rule("use", obj("o-pala"), obj("o-comte-caixa"), [inState("o-comte-caixa", "o-comte-caixa-dorm")], [cutscene("cs-pala")]),
    rule("use", obj("o-pala"), obj("o-caixes-castell"), [], [say("N'hi ha cinquanta. No tinc tota la nit... ni tota la vida.")]),
    rule("use", obj("o-crucifix"), obj("o-comte-caixa"), [], [say("Fins i tot dormint, arrufa el nas. Però això no el destruirà.")]),
    rule("talk", obj("o-comte-caixa"), null, [], [say("No contesta. I prefereixo que continuï així.")]),
    rule("pickup", obj("o-comte-caixa"), null, [], [say("Ni en el pitjor dels meus malsons.")]),
    rule("open", obj("o-caixes-castell"), null, [], [say("Terra. Terra de cementiri, humida i negra. Per a ell és un llit.")]),
  );

  P.dialogues.push(
    dialogue("d-hostaler", "L'hostaler", "c-hostaler", [
      node("hs-1", [["c-hostaler", "Benvingut a la Corona d'Or! Vostè deu ser el senyor anglès, el senyor Harker."]], [
        opt("Hi ha res per a mi?", "hs-2", { id: "op-carta", once: true, actions: [take("o-carta"), sound("so-clic")] }),
        opt("Què és aquest plat tan vermell?", "hs-3"),
        opt("On és el castell de Dràcula?", "hs-4"),
        opt("Adéu."),
      ]),
      node("hs-2", [["c-hostaler", "Sí... una carta. La va deixar un home... del comte. Tingui."], ["c-hostaler", "I agafi-la vostè, que jo no la vull tocar més."]], [opt("Gràcies.", "hs-1")]),
      node("hs-3", [["c-hostaler", "Paprika hendl! Pollastre amb pebre vermell. Fa set, molta set. Després no dormirà, però tampoc no ho faria igualment."]], [opt("Molt tranquil·litzador.", "hs-1")]),
      node("hs-4", [["c-hostaler", "Jo... no entenc l'alemany. Ni l'anglès. Ni res."], [null, "M'ho està dient en un alemany perfecte."]], [opt("Ja.", "hs-1")]),
    ]),
    dialogue("d-hostalera", "L'hostalera", "c-hostalera", [
      node("ha-1", [["c-hostalera", "Ai, senyor jove... de veritat ha d'anar-hi?"]], [
        opt("Vaig al castell del comte Dràcula.", "ha-2", { once: true, conditions: [K.said("d-hostaler", "op-carta")] }),
        opt("Per què em mireu així?", "ha-3"),
        opt("Adéu."),
      ]),
      node("ha-2", [["c-hostalera", "Avui és la vigília de Sant Jordi. Quan toqui mitjanit, totes les coses dolentes del món tindran poder."], ["c-hostalera", "Si no em vol fer cas, almenys porti això. Per la seva mare."]], [
        opt("Gràcies...", null, { actions: [take("o-crucifix"), sound("so-descobert")] }),
      ]),
      node("ha-3", [["c-hostalera", "Perquè vostè no sap on va, ni què hi trobarà."], [null, "Hi trobaré un client. I una comissió."]], [opt("D'acord.", "ha-1")]),
    ]),
    dialogue("d-cotxer", "El cotxer", "c-cotxer", [
      node("co-1", [["c-cotxer", "Bukovina! Bukovina! Qui puja?"]], [
        opt("Em podeu deixar al pas del Borgo?", "co-2"),
        opt("Per què tothom té tanta por?", "co-3"),
        opt("Adéu."),
      ]),
      node("co-2", [["c-cotxer", "Només si algú important ho demana. I algú que no sigui vostè."]], [opt("Entesos.", "co-1")]),
      node("co-3", [["c-cotxer", "Perquè els morts viatgen de pressa, senyor."]], [opt("Ah. Bé. Gràcies.", "co-1")]),
    ]),
    dialogue("d-pagesa", "La pagesa", "c-pagesa", [
      node("pg-1", [["c-pagesa", "(Fa el senyal de la creu tres vegades.)"]], [
        opt("Per què feu això?", "pg-2"),
        opt("Què vol dir «vrolok»?", "pg-3"),
        opt("Adéu."),
      ]),
      node("pg-2", [["c-pagesa", "Contra el mal d'ull, senyor. I vostè en té molt, al darrere."]], [opt("Al darrere? On?", "pg-1")]),
      node("pg-3", [["c-pagesa", "Vampir. O home llop. O les dues coses. Al castell no hi ha diferència."]], [opt("Ah.", "pg-1")]),
    ]),
    dialogue("d-comte", "El comte", null, [
      node("dc-1", [[COMTE, "Escolti'ls: els fills de la nit. Quina música que fan!"]], [
        opt("Parlem de la casa de Londres.", "dc-2"),
        opt("Qui sou, de debò?", "dc-3"),
        opt("Puc passejar pel castell?", "dc-4"),
        opt("Bona nit, comte."),
      ]),
      node("dc-2", [[COMTE, "Carfax, sí. Porta les escriptures? Doni-me-les i ho signaré tot aquesta mateixa nit."]], [opt("Les tinc aquí.", "dc-1")]),
      node("dc-3", [[COMTE, "Sóc un boiar. Els meus avantpassats van lluitar contra el turc, contra l'hongarès, contra tothom."], [COMTE, "La sang és vida, senyor Harker. La sang és vida."]], [opt("...Entesos.", "dc-1")]),
      node("dc-4", [[COMTE, "Pot anar on vulgui, excepte allà on les portes són tancades."], [COMTE, "I mai, mai, no s'adormi en cap altra cambra que no sigui la seva."]], [opt("Ho tindré present.", "dc-1")]),
    ]),
  );

  P.cutscenes.push(
    { id: "cs-intro", name: "Introducció", actions: [
      take("o-diari"), take("o-escriptures"),
      say("Diari de Jonathan Harker. 3 de maig. Bistritz."),
      say("Vaig sortir de Munic ahir al vespre. Demà em trobaré amb el comte Dràcula, al seu castell dels Carpats."),
      say("Porto les escriptures de Carfax, la casa que vol comprar a Anglaterra. Una feina senzilla."),
      say("L'hostaler diu que té una carta per a mi. I la seva dona no para de mirar-me com si fos a un funeral."),
    ] },
    { id: "cs-borgo", name: "El cotxer negre", actions: [
      sound("so-udol"),
      say("Arriba d'hora, amic meu. Pugi. El meu senyor l'espera.", COMTE),
      say("(Em dona la mà per pujar. Té una força terrible: m'ha aixecat com si fos una ploma.)"),
      sound("so-udol"), say("(Els llops ens envolten... ell aixeca el braç, i fugen com gossos apallissats.)"),
      setVar("v-calessa", true),
    ] },
    { id: "cs-benvinguda", name: "Benvinguda", actions: [
      say("Benvingut a casa meva! Entri lliurement, i deixi una mica de la felicitat que porta.", COMTE),
      say("(Té la mà freda com el gel. I la mateixa força que el cotxer.)"),
      say("Jo sóc Dràcula. Passi, passi. El sopar és a taula. Jo ja he sopat.", COMTE),
      setState("o-comte-pati", "o-comte-pati-amagat"), setVar("v-benvinguda", true), sound("so-campana"),
    ] },
    { id: "cs-mirall", name: "El mirall", actions: [
      say("(Em començo a afaitar davant del mirall. El comte és just darrere meu...)"),
      sound("so-ensurt"), say("(...però al mirall no hi és! Només em veig a mi!)"),
      say("(M'he tallat. Una gota de sang em llisca per la barbeta.)"),
      say("Vigili! Vigili com es talla! És més perillós del que creu, en aquest país.", COMTE),
      say("(Els seus ulls s'han encès... però en veure el crucifix s'ha aturat en sec.)"),
      say("Aquest maleït objecte és el que fa tot el mal. Fora la vanitat!", COMTE),
      lose("o-mirall"), setState("o-comte-sala", "o-comte-sala-amagat"), setVar("v-mirall", true),
      say("(Ha llençat el mirall per la finestra i se n'ha anat. Ara ja ho sé: sóc presoner d'un home que no fa reflex.)"),
    ] },
    { id: "cs-reptar", name: "El comte a la paret", actions: [
      say("(La lluna il·lumina la muralla...)"),
      say("(Algú surt per una finestra de sota. És el comte!)"),
      sound("so-ensurt"), say("(Baixa per la paret cap per avall, amb la capa estesa com unes ales, com un llangardaix enorme.)"),
      say("(Si ell es mou per fora, per la muralla es deu poder arribar a la seva cambra...)"),
      setVar("v-reptar", true),
    ] },
    { id: "cs-germanes", name: "Les germanes", actions: [
      say("(Aquí la lluna entra per tot arreu. Em recolzo un moment en aquest sofà vell...)"),
      wait(1), sound("so-ensurt"),
      say("Ell és jove i fort. N'hi ha petons per a totes.", "c-veu-germanes"),
      say("(Tres dones. Pàl·lides, amb els llavis vermells i les dents com punxes.)"),
      say("Com goseu tocar-lo? Aquest home és meu!", COMTE),
      say("(La veu del comte, des d'algun lloc. Elles riuen... i no se'n van. Darrere seu, penjada a la paret, hi ha una clau de ferro.)"),
    ] },
    { id: "cs-pala", name: "La pala", actions: [
      say("(Dorm amb els ulls oberts. Sembla més jove que ahir. La sang li regalima per la barbeta.)"),
      say("(Aixeco la pala i colpejo amb totes les forces...)"),
      sound("so-ensurt"), setState("o-comte-caixa", "o-comte-caixa-ferit"), lose("o-pala"),
      say("(Li he obert un tall al front. Però els ulls... els ulls s'han girat cap a mi.)"),
      say("(Ha de ser ara o mai. Per l'esquerda del mur!)"),
      setVar("v-fugida", true),
    ] },
    { id: "cs-espadat", name: "La fugida", actions: [
      say("(Les caixes de terra... les volen portar a Anglaterra. A Carfax. A la casa que jo mateix li he venut.)"),
      say("(Mina, perdona'm. Baixaré per aquí, encara que em trenqui el coll.)"),
    ] },
  );
}
