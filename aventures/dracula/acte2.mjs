// Acte II — Whitby i la Lucy: de l'hospital de Budapest a la nit en què la Lucy mor
export default function acte2({ P, K, E, O, pj, escena, aparicio }) {
  const { rect, leftEdge, rightEdge, spot, exit, npc, place, obj, chr, hot, hasItem, inState, isVar, said, say, take, lose, setState, setVar, sound, music, cutscene, wait, rule, dialogue, node, opt } = K;
  const V = (id) => isVar(id, true);
  const C = O.C;

  /* ---------- Objectes ---------- */
  P.object({ id: "o-bitllet", name: "bitllets", description: "Dos bitllets de tren i vaixell: Budapest, Calais, Dover, Whitby. Per a mi i per a la Mina. La senyora Harker.", pickable: true, states: [["normal", "Normal", O.bitllet()]] });
  P.object({ id: "o-quadern", name: "quadern de bitàcola", description: "El quadern de bitàcola del Demeter. L'última pàgina està escrita amb mà tremolosa.", pickable: true, states: [["normal", "Normal", O.quadern()]] });
  P.object({ id: "o-capita", name: "capità", description: "El capità del Demeter, lligat al timó amb les seves pròpies mans. Té un rosari entre els dits i els ulls oberts de terror.", states: [["normal", "Normal", O.capitaMort()]] });
  P.object({ id: "o-xal", name: "xal", description: "Un xal blanc de llana fina, amb les inicials L. W. brodades. És de la Lucy.", pickable: true, states: [["normal", "Normal", O.xal()]] });
  P.object({ id: "o-gos", name: "gos negre", description: "Un gos negre enorme, assegut entre les ruïnes. Té els ulls vermells i em mira com si em conegués.", states: [["present", "Present", O.gosNegre()], ["amagat", "Amagat", null]] });
  aparicio("o-lucy-banc", "Lucy", "La Lucy, en camisa de dormir, asseguda al banc. Dorm amb els ulls oberts.", E.figura(E.LOOKS.lucy, 4), { visible: false });
  P.object({ id: "o-lucy-wh", name: "Lucy", description: "La Lucy dorm. Està blanca com el llençol.", states: [["normal", "Normal", O.lucyLlit(false)]] });
  P.object({ id: "o-flors-all", name: "flors d'all", description: "Flors d'all fresques, arribades de Haarlem per encàrrec de Van Helsing. Fan una pudor que tomba.", pickable: true, states: [["normal", "Normal", O.florsAll()]] });
  P.object({ id: "o-lucy-hill", name: "Lucy", description: "La Lucy, al llit. Respira molt a poc a poc.", states: [["viva", "Viva", O.lucyLlit(false)], ["morta", "Morta", O.lucyLlit(true)]] });
  aparicio("o-westenra-hill", "senyora Westenra", "La mare de la Lucy. Està molt malalta del cor i no deixa la seva filla ni un moment.", E.figura(E.LOOKS.senyora, 0, true));

  /* ---------- Personatges ---------- */
  pj("c-agata", "monja", "germana Àgata", "La germana Àgata, que em va cuidar durant setmanes de febre.", "#d8d8f0");
  pj("c-mina-bp", "mina", "Mina");
  pj("c-guardacostes", "mariner", "guardacostes", "Un guardacostes de Whitby, mullat i de mal humor.", "#a0c0e0");
  pj("c-swales", "swales", "vell Swales", "El vell Swales, un mariner jubilat de gairebé cent anys. Diu que ho ha vist tot dues vegades.", "#d0c8a8");
  pj("c-westenra-wh", "senyora", "senyora Westenra", "La mare de la Lucy. Està molt malalta del cor i no deixa la seva filla ni un moment.", "#d8b8e0");
  pj("c-vh-hill", "vanHelsing", "Van Helsing");
  pj("c-arthur-hill", "arthur", "Arthur");
  pj("c-veu-westenra", "senyora", "senyora Westenra", "", "#d8b8e0");

  /* ---------- Escenaris ---------- */
  escena("budapest", "Hospital de Budapest", "L'hospital de Sant Josep i Santa Maria, a Budapest. Fa olor de sabó i d'encens.", {
    walkable: [[[0, 176], [200, 162], [320, 166], [320, 199], [0, 199]]], music: "so-whitby",
    onEnter: { cutsceneId: "cs-budapest", once: true },
    hotspots: [
      exit("ex-bp-estacio", "Cap a l'estació", rightEdge(166), "s-whitby-port", [60, 190], {
        conditions: [hasItem("o-bitllet")], blocked: "Sense bitllet no vaig enlloc. I la germana Àgata m'ha amagat les botes.",
      }),
      spot("ho-bp-estufa", "estufa", "Una estufa de ferro. La primera escalfor que he sentit en setmanes.", rect(160, 140, 40, 35)),
      spot("ho-bp-llits", "llits", "Llits de malalts. Algun encara crida de nit. Jo també ho feia, diuen.", rect(0, 40, 90, 120)),
    ],
    characters: [npc("c-agata", [232, 184], "left"), npc("c-mina-bp", [92, 190], "right")],
  });
  escena("whitby-port", "Port de Whitby", "El port de Whitby, l'endemà de la tempesta. Al moll hi ha un vaixell encallat.", {
    walkable: [[[0, 178], [320, 178], [320, 199], [0, 199]]], music: "so-whitby",
    onEnter: { cutsceneId: "cs-whitby", once: true },
    draw(c) {
      // Un moll de fusta a la part de baix, per on es camina
      c.rect(0, 176, 320, 24, C.fustaFosca);
      for (let y = 179; y < 200; y += 5) c.rect(0, y, 320, 1, C.negre);
      for (let x = 6; x < 320; x += 37) { c.rect(x, 168, 5, 10, C.fusta); c.rect(x, 168, 5, 1, C.palla); }
      c.rect(0, 176, 320, 1, C.fusta);
    },
    hotspots: [
      exit("ex-wp-demeter", "Pujar al Demeter", rect(45, 60, 60, 100), "s-demeter", [60, 190], {
        conditions: [said("d-guardacostes", "op-permis")], blocked: "El guardacostes crida: «Enrere! Ningú no puja a bord sense permís!»",
      }),
      exit("ex-wp-escales", "Cap a les 199 escales", rightEdge(178), "s-escales", [90, 190]),
      exit("ex-wp-crescent", "Al Royal Crescent", leftEdge(178), "s-crescent", [30, 186]),
      exit("ex-wp-estacio", "Estació de Whitby", rect(250, 105, 60, 50), "s-hillingham", [40, 190], {
        conditions: [V("v-marques")], blocked: "Encara no puc marxar de Whitby. La Lucy em preocupa massa.",
      }),
      spot("ho-wp-abadia", "abadia", "Dalt del penya-segat, les ruïnes de l'abadia de Whitby. Hi fa sempre vent.", rect(165, 85, 75, 25)),
    ],
    characters: [npc("c-guardacostes", [252, 192], "left")],
  });
  escena("demeter", "Coberta del Demeter", "La coberta del Demeter. Ni una ànima viva a bord. Només el capità, i cinquanta caixes de terra a la bodega.", {
    walkable: [[[0, 166], [220, 150], [300, 176], [320, 199], [0, 199]]], transition: "iris",
    hotspots: [
      exit("ex-dm-port", "Baixar al moll", leftEdge(166), "s-whitby-port", [80, 190]),
      spot("ho-dm-cordam", "cordam", "Les cordes estan tallades. Algú, o alguna cosa, les va mossegar.", rect(232, 20, 88, 140)),
      spot("ho-dm-veles", "veles", "Les veles, estripades per la tempesta. O per unes urpes.", rect(80, 0, 150, 55)),
    ],
    objects: [place("o-capita", [112, 172], [136, 182]), place("o-quadern", [202, 186], [190, 190])],
  });
  escena("escales", "Les 199 escales", "Les 199 escales que pugen del port a l'església de Santa Maria.", {
    walkable: [[[62, 170], [320, 160], [320, 199], [62, 199]]], music: "so-whitby",
    hotspots: [
      exit("ex-es-port", "Baixar al port", rect(62, 165, 20, 34), "s-whitby-port", [290, 190]),
      exit("ex-es-cementiri", "Pujar al cementiri", rect(205, 60, 65, 100), "s-cementiri-whitby", [40, 190]),
      spot("ho-es-cases", "cases", "Cases de pescadors, amb les finestres tancades. A Whitby tothom tanca les finestres de nit.", rect(0, 0, 60, 199)),
    ],
    characters: [npc("c-swales", [200, 188], "left")],
  });
  escena("cementiri-whitby", "Cementiri de l'East Cliff", "El cementiri de dalt del penya-segat, on la Lucy ve a seure cada nit.", {
    walkable: [[[0, 163], [320, 161], [320, 199], [0, 199]]], music: "so-whitby",
    hotspots: [
      exit("ex-cw-escales", "Baixar les escales", leftEdge(163), "s-escales", [230, 188]),
      exit("ex-cw-abadia", "A les ruïnes de l'abadia", rect(170, 65, 50, 95), "s-abadia", [40, 188]),
      spot("ho-cw-lapides", "làpides", "«Aquí reposa...» Mitja Whitby és al fons del mar, no pas aquí. Ho diu el vell Swales.", rect(20, 120, 140, 40)),
      spot("ho-cw-esglesia", "església", "L'església de Santa Maria. Les campanes sonen soles quan fa vent.", rect(240, 30, 80, 130)),
    ],
    objects: [place("o-lucy-banc", [120, 184], [96, 188])],
  });
  escena("abadia", "Ruïnes de l'abadia", "Les ruïnes de l'abadia de Whitby. El vent hi xiula com algú que crida.", {
    walkable: [[[0, 172], [320, 168], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-ab-cementiri", "Tornar al cementiri", leftEdge(172), "s-cementiri-whitby", [280, 188]),
      spot("ho-ab-ruines", "ruïnes", "Arcs gòtics sense sostre. Les estrelles fan de vitralls.", rect(85, 30, 115, 140)),
    ],
    objects: [place("o-xal", [226, 190], [210, 192]), place("o-gos", [286, 188], [262, 190])],
  });
  escena("crescent", "Casa dels Westenra (Whitby)", "Les habitacions que llogen la Lucy i la seva mare al Royal Crescent.", {
    walkable: [[[0, 168], [122, 168], [102, 199], [0, 199]]], music: "so-whitby",
    hotspots: [
      exit("ex-cr-port", "Sortir al port", leftEdge(168), "s-whitby-port", [40, 190]),
      exit("ex-cr-lucy", "Escala de les habitacions", rect(125, 60, 40, 105), "s-lucy-whitby", [60, 186], {
        conditions: [V("v-lucy-casa")], blocked: "La senyora Westenra no em deixa pujar: la Lucy no és a la seva habitació.",
      }),
      spot("ho-cr-lampada", "làmpada", "Un quinqué encès. Aquí deixen el llum encès tota la nit.", rect(190, 40, 40, 40)),
      spot("ho-cr-llar", "llar de foc", "Hi ha cendres d'herbes cremades. Remeis de la mare contra els malsons de la Lucy.", rect(0, 45, 90, 65)),
      spot("ho-cr-taula", "taula", "Cartes, labors i un llibre de pregàries obert a la pàgina dels difunts.", rect(122, 115, 198, 84)),
    ],
    characters: [npc("c-westenra-wh", [60, 190], "right")],
  });
  escena("lucy-whitby", "Dormitori de la Lucy (Whitby)", "L'habitació de la Lucy. Fa fred, encara que la finestra és tancada.", {
    walkable: [[[0, 164], [150, 146], [320, 152], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-lw-crescent", "Baixar", leftEdge(164), "s-crescent", [40, 186]),
      spot("ho-lw-armari", "armari", "Un armari de roure. La roba de la Lucy fa olor de violetes... i de terra humida.", rect(0, 30, 110, 130)),
      spot("ho-lw-quadre", "quadre", "Un quadre del mar. Algú hi ha dibuixat a llapis, al marge, dos punts vermells.", rect(120, 0, 80, 90)),
      spot("ho-lw-finestra", "finestra", "Un ratpenat enorme pica el vidre amb les ales. Pica. I pica.", rect(240, 10, 70, 50)),
    ],
    objects: [place("o-lucy-wh", [216, 142], [200, 162], { layer: "back" })],
  });
  escena("hillingham", "Hillingham", "La casa de la Lucy a Londres. Hi fa olor de medicines i de flors pansides.", {
    walkable: [[[0, 182], [320, 180], [320, 199], [0, 199]]], music: "so-londres",
    onEnter: { cutsceneId: "cs-hillingham", once: true },
    hotspots: [
      exit("ex-hl-dormitori", "Pujar al dormitori", rect(228, 70, 40, 90), "s-hillingham-dormitori", [40, 190]),
      exit("ex-hl-carrer", "Sortir al carrer", leftEdge(182), "s-piccadilly", [40, 188], {
        conditions: [V("v-lucy-morta")], blocked: "No puc deixar la Lucy ara. No aquesta nit.",
      }),
      spot("ho-hl-llar", "llar de foc", "Una llar de foc de marbre. El foc no escalfa gens.", rect(40, 115, 90, 70)),
      spot("ho-hl-llum", "llum", "Un llum de gas que tremola. Tot tremola, en aquesta casa.", rect(180, 60, 25, 25)),
    ],
    characters: [npc("c-vh-hill", [232, 192], "left"), npc("c-arthur-hill", [112, 192], "right")],
  });
  escena("hillingham-dormitori", "Dormitori de la Lucy (Londres)", "El dormitori de la Lucy, a Hillingham. Hi ha flors a tot arreu, i cap no fa olor de res.", {
    walkable: [[[0, 186], [320, 184], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-hd-baixar", "Baixar", leftEdge(186), "s-hillingham", [290, 192]),
      spot("ho-hd-finestra", "finestra", "Una finestra alta, amb cortines de vellut. Fora, la nit de Londres.", rect(0, 110, 50, 75)),
      spot("ho-hd-aranya", "aranya", "Una aranya de llums de cristall. Tremola cada vegada que passa un carruatge... o un ratpenat.", rect(110, 30, 60, 70)),
    ],
    objects: [place("o-lucy-hill", [166, 186], [140, 192], { layer: "back" }), place("o-westenra-hill", [270, 194], [248, 194])],
  });

  /* ---------- Lògica ---------- */
  P.variable("v-casats", "casats");
  P.variable("v-lucy-casa", "lucy_a_casa");
  P.variable("v-marques", "ha_vist_les_marques");
  P.variable("v-transfusio", "transfusio");
  P.variable("v-lucy-morta", "lucy_morta");

  P.rules.push(
    // Demeter
    rule("use", obj("o-quadern"), null, [], [
      say("«4 de juliol. Falta un altre home. Hi ha algú a bord que no és de la tripulació. Un home alt i prim.»"),
      say("«Ell és aquí. Que Déu ens perdoni. Em lligaré al timó, i el rosari a les mans.»"),
    ]),
    rule("give", obj("o-quadern"), chr("c-guardacostes"), [], [say("Llegeixi-ho vostè, senyor. Jo no tinc estómac per a fantasmes.", "c-guardacostes")]),
    rule("talk", obj("o-capita"), null, [], [say("Capità? ...No. Ja no.")]),
    rule("pickup", obj("o-capita"), null, [], [say("Que descansi. Ja ha fet prou guàrdia.")]),
    rule("use", obj("o-crucifix"), obj("o-capita"), [], [say("Ja en porta un, de rosari. No li va servir de gaire.")]),
    // El gos negre
    rule("talk", obj("o-gos"), null, [], [say("Bon gosset... bon..."), sound("so-udol"), setState("o-gos", "o-gos-amagat"), say("Ha desaparegut dins la boira sense fer cap soroll. Els gossos no fan això.")]),
    rule("use", obj("o-crucifix"), obj("o-gos"), [], [sound("so-udol"), setState("o-gos", "o-gos-amagat"), say("Ha fugit com una ombra. Els gossos normals no tenen por dels crucifixos.")]),
    rule("pickup", obj("o-gos"), null, [], [say("Té les dents més grans que la meva mà. Ni parlar-ne.")]),
    // La Lucy al banc
    rule("give", obj("o-xal"), obj("o-lucy-banc"), [], [cutscene("cs-lucy-banc")]),
    rule("use", obj("o-xal"), obj("o-lucy-banc"), [], [cutscene("cs-lucy-banc")]),
    rule("talk", obj("o-lucy-banc"), null, [], [say("...el mar... unes ales negres... uns ulls vermells com dues brases...", "c-veu-lucy"), say("Dorm. I té la pell gelada.")]),
    rule("pickup", obj("o-lucy-banc"), null, [], [say("No la puc despertar de cop: diuen que als somnàmbuls els pot aturar el cor. Potser si l'abrigués...")]),
    rule("use", obj("o-crucifix"), obj("o-lucy-banc"), [], [say("Ella no és el perill. El perill és qui l'ha vinguda a veure.")]),
    // Les marques
    rule("look", obj("o-lucy-wh"), null, [isVar("v-marques", false)], [
      say("(Dorm. Està blanca com el llençol.)"),
      say("(Al coll... dues marques petites, vermelles, amb les vores blanques. Com dues punxades.)"),
      sound("so-descobert"), setVar("v-marques", true),
      say("(Al calaix hi ha un telegrama de l'Arthur: «Porteu la Lucy a Hillingham de seguida. Vindrà un metge holandès.»)"),
      say("Això no és anèmia. He d'anar a Londres. Ara."),
    ]),
    rule("talk", obj("o-lucy-wh"), null, [], [say("Deixem-la dormir. Necessita totes les forces.")]),
    rule("use", obj("o-crucifix"), obj("o-lucy-wh"), [], [say("Li deixo el crucifix un moment sobre el pit. Gemega, i es gira. Me'l torno a quedar: el necessitaré.")]),
    // La nit fatal
    rule("use", obj("o-flors-all"), hot("ho-hd-finestra"), [], [cutscene("cs-nit")]),
    rule("use", obj("o-flors-all"), obj("o-lucy-hill"), [], [cutscene("cs-nit")]),
    rule("talk", obj("o-lucy-hill"), null, [isVar("v-lucy-morta", false)], [say("Jonathan... la Mina t'estima tant... cuida-la...", "c-veu-lucy")]),
    rule("look", obj("o-lucy-hill"), null, [V("v-lucy-morta")], [say("És morta. I tanmateix... sembla més bonica que mai. Els llavis, més vermells. Les dents, més llargues.")]),
    rule("talk", obj("o-westenra-hill"), null, [], [say("La meva nena... la meva pobra nena... Aquesta casa fa pudor d'hospital.", "c-veu-westenra")]),
  );

  P.dialogues.push(
    dialogue("d-mina-bp", "Mina", "c-mina-bp", [
      node("mb-1", [["c-mina-bp", "Jonathan! Gràcies a Déu! Pensava que no et tornaria a veure mai més."]], [
        opt("Mina... casem-nos. Ara mateix.", "mb-2", { once: true }),
        opt("Com està la Lucy?", "mb-3"),
        opt("No em preguntis què vaig veure al castell.", "mb-4"),
        opt("Ara torno."),
      ]),
      node("mb-2", [["c-mina-bp", "Aquí? En un hospital? Jonathan, estàs boig!"], ["c-agata", "Tenim capellà, i dos testimonis. I Déu ho veu tot igual."], ["c-mina-bp", "...Sí. Sí, vull."]], [
        opt("(Ens casem al costat del meu llit.)", "mb-1", { actions: [setVar("v-casats", true), sound("so-campana")] }),
      ]),
      node("mb-3", [["c-mina-bp", "És a Whitby, amb la seva mare. M'escriu que torna a caminar adormida, com quan era petita. I que té malsons d'ales negres."]], [opt("Ales negres...", "mb-1")]),
      node("mb-4", [["c-mina-bp", "No t'ho preguntaré. Però si mai vols que ho sàpiga, dona'm el teu diari i el llegiré. Jo també sé taquigrafia."]], [opt("Gràcies, Mina.", "mb-1")]),
    ]),
    dialogue("d-agata", "Germana Àgata", "c-agata", [
      node("ag-1", [["c-agata", "Que Déu el guardi, fill. Ja té millor color."]], [
        opt("Puc marxar ja?", "ag-2", { once: true, conditions: [V("v-casats")] }),
        opt("Puc marxar ja?", "ag-4", { conditions: [isVar("v-casats", false)] }),
        opt("Què deia, quan vaig arribar?", "ag-3"),
        opt("Gràcies per tot."),
      ]),
      node("ag-2", [["c-agata", "Ara és un home casat, i un home casat fa el que diu la seva dona. Tingui: dos bitllets cap a Anglaterra, passant per Whitby."]], [
        opt("Gràcies, germana.", "ag-1", { actions: [take("o-bitllet"), sound("so-descobert")] }),
      ]),
      node("ag-3", [["c-agata", "Parlava de llops, de sang, i de caixes plenes de terra. El seu diari l'he guardat; no l'he llegit, no pateixi."], ["c-agata", "Bé... no l'he entès, que no és el mateix."]], [opt("És taquigrafia.", "ag-1")]),
      node("ag-4", [["c-agata", "Marxar? Si encara està pàl·lid com un ciri! I aquella noia tan bonica l'espera... No la farà esperar més, oi?"]], [opt("...Entesos.", "ag-1")]),
    ]),
    dialogue("d-guardacostes", "El guardacostes", "c-guardacostes", [
      node("gc-1", [["c-guardacostes", "Enrere, senyor! Aquest vaixell és cosa de la duana."]], [
        opt("Què ha passat?", "gc-2"),
        opt("Hi havia càrrega?", "gc-3"),
        opt("Puc pujar a bord?", "gc-4", { id: "op-permis" }),
        opt("Adéu."),
      ]),
      node("gc-2", [["c-guardacostes", "El Demeter, de Varna. Ha entrat al port sol, enmig de la tempesta. El capità era mort, lligat al timó."], ["c-guardacostes", "I un gos negre, enorme, va saltar a terra i va pujar les escales cap al cementiri."]], [opt("Un gos negre...", "gc-1")]),
      node("gc-3", [["c-guardacostes", "Cinquanta caixes de terra, adreçades a un advocat de Londres. Terra! Qui envia terra per mar?"]], [opt("Jo sé qui.", "gc-1")]),
      node("gc-4", [["c-guardacostes", "...Bé. Vostè té cara d'advocat, i els advocats ja estan morts per dins. Pugi. Però no toqui res."]], [opt("Gràcies.", "gc-1")]),
    ]),
    dialogue("d-swales", "El vell Swales", "c-swales", [
      node("sw-1", [["c-swales", "Ei, jove! Aquí dalt, a Whitby, els morts no reposen."]], [
        opt("Per què ho dieu?", "sw-2"),
        opt("Heu vist un gos negre?", "sw-3"),
        opt("Coneixeu la senyoreta Lucy?", "sw-4"),
        opt("Adéu."),
      ]),
      node("sw-2", [["c-swales", "Mitja làpida d'aquest cementiri és mentida. Diuen «aquí reposa» i el pobre és al fons del mar."], ["c-swales", "El dia del judici, uns sortiran de la terra i els altres de l'aigua, i hi haurà empentes."]], [opt("Quina imatge.", "sw-1")]),
      node("sw-3", [["c-swales", "Un gos? Un llop, diria jo. Va pujar les escales d'una revolada i es va ficar a la tomba del suïcida."]], [opt("Del suïcida?", "sw-1")]),
      node("sw-4", [["c-swales", "La noia rossa? Cada nit seu al banc de dalt, mirant el mar. Massa pàl·lida per tenir dinou anys."], ["c-swales", "La seva mare la busca sempre, pobra dona. Viu al Royal Crescent."]], [opt("Gràcies.", "sw-1")]),
    ]),
    dialogue("d-westenra-wh", "Senyora Westenra", "c-westenra-wh", [
      node("ww-1", [["c-westenra-wh", "Senyor Harker! Gràcies a Déu! La Lucy... no és al llit!"]], [
        opt("On pot haver anat?", "ww-2", { once: true, actions: [setState("o-lucy-banc", "o-lucy-banc-present")] }),
        opt("Com està de salut?", "ww-3"),
        opt("Adéu, senyora."),
      ]),
      node("ww-2", [["c-westenra-wh", "Camina adormida, de petita ja ho feia. Sempre va cap al cementiri de l'East Cliff, al banc de dalt de tot."], ["c-westenra-wh", "Porti-me-la, si us plau! I abrigui-la, que es glaçarà."]], [opt("Hi vaig ara mateix.", "ww-1")]),
      node("ww-3", [["c-westenra-wh", "Pàl·lida, cansada, i cada dia més prima. Diu que té malsons de llops."]], [opt("Llops...", "ww-1")]),
    ]),
    dialogue("d-vh-hill", "Van Helsing", "c-vh-hill", [
      node("vh-1", [["c-vh-hill", "Ah, el jove Harker. El meu amic Seward diu que vostè ha vist coses... coses que la ciència no vol veure."]], [
        opt("Què li passa a la Lucy?", "vh-2"),
        opt("Necessita sang? Agafeu la meva.", null, { once: true, conditions: [isVar("v-transfusio", false)], actions: [cutscene("cs-transfusio")] }),
        opt("I ara què, professor?", "vh-4", { once: true, conditions: [V("v-lucy-morta")], actions: [take("o-tornavis"), take("o-estaca"), take("o-mall"), take("o-hosties"), sound("so-descobert")] }),
        opt("Adéu, professor."),
      ]),
      node("vh-2", [["c-vh-hill", "Anèmia, diuen els metges anglesos. Ximpleries! Ha perdut sang, molta, i no per cap ferida... excepte dues de molt petites."]], [opt("Al coll.", "vh-1")]),
      node("vh-4", [["c-vh-hill", "La Lucy no reposa. Els nens de Hampstead parlen d'una «dama bonica» que els passeja de nit, i tornen amb dues marques al coll."], ["c-vh-hill", "Prengui el meu maletí: un tornavís, una estaca, un mall i hòsties consagrades. Ens veurem al cementiri de Kingstead, passat Hampstead."]], [opt("Que Déu ens ajudi.", "vh-1")]),
    ]),
    dialogue("d-arthur-hill", "Arthur", "c-arthur-hill", [
      node("ah-1", [["c-arthur-hill", "Harker. La Lucy... és tot el que tinc."]], [
        opt("Què diuen els metges?", "ah-2"),
        opt("Ho sento molt, Arthur.", "ah-3", { conditions: [V("v-lucy-morta")] }),
        opt("Adéu."),
      ]),
      node("ah-2", [["c-arthur-hill", "Que no saben res. Per això el Seward ha cridat el seu professor d'Amsterdam. Diuen que és un geni... o un boig."]], [opt("Potser les dues coses.", "ah-1")]),
      node("ah-3", [["c-arthur-hill", "L'enterrarem a Kingstead, al panteó dels Westenra. Jo guardaré la clau. No me'n puc desprendre."]], [opt("...", "ah-1")]),
    ]),
  );

  P.cutscenes.push(
    { id: "cs-budapest", name: "Budapest", actions: [
      music("so-whitby"),
      say("(Setmanes després. Hospital de Sant Josep i Santa Maria, Budapest.)"),
      say("(No recordo com vaig baixar de les muntanyes. Les monges diuen que deliava de llops i de sang.)"),
      say("(La Mina ha vingut des d'Anglaterra a buscar-me. És aquí.)"),
    ] },
    { id: "cs-whitby", name: "Whitby", actions: [
      sound("so-aigua"),
      say("(Whitby. Ahir a la nit, en plena tempesta, un vaixell rus va entrar al port sense ningú viu a bord.)"),
      say("(Un vaixell carregat amb cinquanta caixes de terra. Jo sé d'on venen.)"),
    ] },
    { id: "cs-lucy-banc", name: "La Lucy al banc", actions: [
      sound("so-ensurt"),
      say("(Una ombra negra, llarga, s'aixeca del costat de la Lucy... i es desfà com fum.)"),
      say("(Li poso el xal sobre les espatlles. Al coll té dues marques vermelles, com dues punxades.)"),
      say("...Jonathan? On sóc? Tinc tant de fred...", "c-veu-lucy"),
      lose("o-xal"), setState("o-lucy-banc", "o-lucy-banc-amagat"), setVar("v-lucy-casa", true),
      say("(L'acompanyo a casa, al Royal Crescent. No para de tremolar.)"),
    ] },
    { id: "cs-hillingham", name: "Van Helsing", actions: [
      say("(Hillingham, Londres. La Lucy hi ha arribat més pàl·lida que mai.)"),
      say("Vostè és el senyor Harker? Abraham Van Helsing. La seva amiga s'està morint, i encara no sé de què.", "c-vh-hill"),
      say("Bé. Sí que ho sé. Però no m'ho creuria.", "c-vh-hill"),
    ] },
    { id: "cs-transfusio", name: "La transfusió", actions: [
      say("Bravo! Segui aquí. Una transfusió, com fem a Amsterdam. Sang jove per a sang jove.", "c-vh-hill"),
      say("(Em clava una agulla al braç. La meva sang passa a les venes de la Lucy.)"),
      wait(1),
      say("Ja té color a les galtes! Ara escolti'm bé: la nit és el perill.", "c-vh-hill"),
      say("He fet portar flors d'all de Haarlem. Que les posi a la finestra de la Lucy, i que ningú, ningú, no les tregui!", "c-vh-hill"),
      take("o-flors-all"), setVar("v-transfusio", true), sound("so-descobert"),
    ] },
    { id: "cs-nit", name: "La nit fatal", actions: [
      lose("o-flors-all"),
      say("(Poso les flors d'all a la finestra i al voltant del coll de la Lucy. Ella somriu, per fi, i s'adorm.)"),
      wait(1), say("(Aquella nit...)"),
      sound("so-udol"),
      say("Quina pudor d'all! La meva filla no pot respirar, així. Fora, fora!", "c-veu-westenra"),
      say("(La senyora Westenra ha tret les flors i ha obert la finestra de bat a bat...)"),
      sound("so-ensurt"),
      say("(Un llop gris ha trencat el vidre. La senyora Westenra ha caigut, fulminada del cor.)"),
      setState("o-westenra-hill", "o-westenra-hill-amagat"),
      say("Jonathan... tinc son... tanta son...", "c-veu-lucy"),
      setState("o-lucy-hill", "o-lucy-hill-morta"), setVar("v-lucy-morta", true), music("so-final"),
      say("(La Lucy Westenra ha mort a trenc d'alba. Tenia dinou anys.)"),
      say("(Van Helsing m'espera a baix. Diu que la història no s'ha acabat.)"),
    ] },
  );
}
