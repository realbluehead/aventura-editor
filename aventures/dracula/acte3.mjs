// Acte III — Londres: la Lucy al panteó, l'asil, les caixes de terra i la fugida del comte per mar
export default function acte3({ P, K, E, O, pj, escena, aparicio }) {
  const { rect, leftEdge, rightEdge, spot, exit, npc, place, obj, chr, hot, hasItem, inState, isVar, said, say, take, lose, setState, setVar, sound, music, cutscene, wait, rule, dialogue, node, opt } = K;
  const V = (id) => isVar(id, true);
  const COMTE = "c-comte";
  const pick = (id, name, description, img) => P.object({ id, name, description, pickable: true, states: [["normal", "Normal", img]] });

  /* ---------- Objectes ---------- */
  pick("o-tornavis", "tornavís", "Un tornavís del maletí de Van Helsing. Per obrir taüts, diu. Com si fos el més normal del món.", O.tornavis());
  pick("o-estaca", "estaca", "Una estaca de fusta de freixe, de tres peus, ben esmolada.", O.estaca());
  pick("o-mall", "mall", "Un mall de fuster. Pesa.", O.mall());
  pick("o-hosties", "hòsties", "Hòsties consagrades, en una capseta d'argent. Van Helsing té permís del Papa. O això diu.", O.hosties());
  pick("o-clau-panteo", "clau del panteó", "La clau del panteó dels Westenra, a Kingstead.", O.clauPanteo());
  pick("o-sucre", "sucrera", "Una sucrera de porcellana del doctor Seward. Plena de sucre, que és el que agrada a les mosques.", O.sucre());
  pick("o-pot", "pot de vidre", "Un pot de vidre buit, amb tapa. Al despatx d'un metge sempre n'hi ha.", O.potVidre());
  pick("o-mosca", "mosca en un pot", "Una mosca grossa i blava, tancada en un pot. El regal perfecte per a algú.", O.mosca());
  pick("o-clau-carfax", "clau de Carfax", "Una clau vella de la capella de Carfax. L'agent immobiliari la va deixar al doctor Seward.", O.clauCarfax());
  pick("o-xiulet", "xiulet de caça", "El xiulet de caça del Quincey. Diu que els terriers el senten a mig quilòmetre.", O.xiulet());
  pick("o-llista", "llista de cases", "Papers del comte: escriptures de cases a Piccadilly, a Mile End i a Bermondsey. Ha comprat mig Londres.", O.llista());
  pick("o-rebut", "rebut", "Un rebut de transports Joseph Smollet: «Caixes recollides a Piccadilly. Entregades a Mile End New Town.»", O.rebut());
  pick("o-bitllets-tren", "bitllets de l'Orient Exprés", "Bitllets de l'Orient Exprés: Londres – París – Varna. Arribarem abans que el vaixell.", O.bitlletsTren());
  pick("o-ganivet", "ganivet kukri", "Un kukri, el ganivet corbat dels gurkhes. El Quincey diu que talla el que calgui tallar.", O.ganivet());
  P.object({ id: "o-taut", name: "taüt", description: "El taüt de la Lucy, de roure i plom.", states: [["tancat", "Tancat", O.taut("tancat")], ["buit", "Buit", O.taut("buit")], ["ocupat", "Ocupat", O.taut("tancat")], ["pau", "En pau", O.taut("pau")]] });
  aparicio("o-lucy-vampira", "Lucy", "És la Lucy... i no ho és. Té la boca tacada de sang i els ulls com brases.", E.figura({ ...E.LOOKS.lucy, shirt: "#dcdbe0", dress: "#dcdbe0" }, 4), { visible: false });
  P.object({ id: "o-rates", name: "rates", description: "Centenars de rates, que surten de les caixes i de les esquerdes. Em miren com si jo fos el sopar.", states: [["present", "Presents", O.rates()], ["fugides", "Fugides", null]] });
  P.object({ id: "o-caixes-carfax", name: "caixes de terra", description: "Caixes de terra, com les del castell. N'hi ha vint-i-nou. De cinquanta.", states: [["normal", "Normals", O.caixes(5)], ["segellades", "Segellades", O.caixes(5, true)]] });
  P.object({ id: "o-caixes-picc", name: "caixes de terra", description: "Caixes de terra, ben arrenglerades al menjador del comte.", states: [["normal", "Normals", O.caixes(3)], ["segellades", "Segellades", O.caixes(3, true)]] });
  P.object({ id: "o-caixes-me", name: "caixes de terra", description: "Un munt de caixes en un pati de l'East End. Entre les altres, n'hi ha de terra.", states: [["normal", "Normals", O.caixes(3)], ["segellades", "Segellades", O.caixes(3, true)]] });
  aparicio("o-comte-picc", "un senyor alt", "Un senyor alt, de barret de copa i bigoti negre, que mira una noia com un gat mira un ocell.", E.figura(E.LOOKS.draculaJove, 0, true));

  /* ---------- Personatges ---------- */
  pj("c-policia", "policia", "policia", "Un policia de Londres, amb el casc i el bigoti reglamentaris.", "#a8b8e0");
  pj("c-vh-king", "vanHelsing", "Van Helsing");
  pj("c-arthur-king", "arthur", "Arthur");
  pj("c-arthur-cripta", "arthur", "Arthur");
  pj("c-zelador", "zelador", "zelador", "Un zelador de l'asil, amb les mans plenes d'esgarrapades.", "#c8c8c8");
  pj("c-seward-desp", "seward", "doctor Seward");
  pj("c-renfield", "renfield", "Renfield", "En Renfield, el pacient zoòfag. Somriu amb massa dents.", "#d0d070");
  pj("c-vh-sala", "vanHelsing", "Van Helsing");
  pj("c-quincey-sala", "quincey", "Quincey");
  pj("c-mina-asil", "mina", "Mina");
  pj("c-veu-mina", "mina", "Mina", "", "#a8d8b0");
  pj("c-serraller", "obrer", "serraller", "Un serraller amb una bossa d'eines i un ull que avalua butxaques.", "#d8c098");
  pj("c-carreter", "obrer", "carreter", "En Joseph Smollet, carreter. Fa olor de cavall i de cervesa.", "#c8b088");
  pj("c-bilder", "guardia", "guardià Bilder", "En Bilder, el guardià dels llops del zoo. Coneix els seus animals com si fossin fills.", "#b0c8a0");
  pj("c-agent", "senyor", "agent de la naviliera", "Un agent de la naviliera, amb ulleres i manegots negres.", "#c0c0d0");
  pj("c-quincey-tren", "quincey", "Quincey");
  pj("c-arthur-tren", "arthur", "Arthur");

  /* ---------- Escenaris ---------- */
  escena("hampstead", "Hampstead Heath", "El bruguerar de Hampstead, al nord de Londres. De nit, s'hi perden els nens.", {
    walkable: [[[0, 163], [320, 167], [320, 199], [0, 199]]], music: "so-londres",
    hotspots: [
      exit("ex-hs-picc", "Tornar a Londres", leftEdge(163), "s-piccadilly", [150, 184]),
      exit("ex-hs-king", "Cap al cementiri de Kingstead", rightEdge(167), "s-kingstead", [110, 188]),
      exit("ex-hs-zoo", "Camí del zoo", rect(240, 120, 60, 30), "s-zoo", [40, 190]),
      spot("ho-hs-nuvols", "núvols", "Núvols que corren com si algú els perseguís.", rect(60, 10, 240, 60)),
      spot("ho-hs-bruguerar", "bruguerar", "Bruc i matolls fins on arriba la vista. Un bon lloc per amagar-se. O per amagar algú.", rect(0, 120, 200, 40)),
    ],
    characters: [npc("c-policia", [200, 188], "left")],
  });
  escena("kingstead", "Cementiri de Kingstead", "El cementiri de Kingstead, a mitjanit. Àngels de pedra, heura i silenci.", {
    walkable: [[[110, 140], [200, 140], [260, 199], [60, 199]]], music: "so-dracula",
    hotspots: [
      exit("ex-kg-hs", "Tornar a Hampstead", rect(40, 170, 22, 29), "s-hampstead", [290, 188]),
      exit("ex-kg-cripta", "Panteó dels Westenra", rect(130, 100, 40, 40), "s-cripta", [290, 190], {
        conditions: [hasItem("o-clau-panteo")], blocked: "La porta del panteó dels Westenra és tancada. L'Arthur en porta la clau.",
      }),
      spot("ho-kg-creu", "creu", "Una creu celta coberta d'heura. Algú hi ha penjat una branca d'all, i s'ha assecat.", rect(220, 60, 30, 50)),
      spot("ho-kg-tombes", "tombes", "Tombes antigues, mig enfonsades. Les arrels dels arbres les abracen.", rect(0, 70, 100, 100)),
    ],
    characters: [npc("c-vh-king", [212, 192], "left"), npc("c-arthur-king", [92, 192], "right")],
  });
  escena("cripta", "Panteó dels Westenra", "Dins del panteó dels Westenra. Fa olor de flors marcides i d'una altra cosa.", {
    walkable: [[[0, 176], [320, 176], [320, 199], [0, 199]]], transition: "iris",
    hotspots: [
      exit("ex-cr-sortir", "Sortir", rightEdge(176), "s-kingstead", [150, 152]),
      spot("ho-cr-porta", "porta del panteó", "La porta del panteó. Les escletxes són prou amples perquè hi passi... la boira.", rect(0, 60, 40, 110)),
      spot("ho-cr-nínxols", "nínxols", "Westenra, Westenra, Westenra. Generacions de família, i ara la Lucy i la seva mare.", rect(60, 30, 220, 100)),
    ],
    objects: [place("o-taut", [160, 194], [140, 194]), place("o-lucy-vampira", [242, 194], [222, 194])],
    characters: [npc("c-arthur-cripta", [60, 194], "right")],
  });
  escena("asil", "Asil de Purfleet", "L'asil del doctor Seward, a Purfleet. Darrere el mur del jardí, Carfax.", {
    walkable: [[[0, 166], [320, 161], [320, 199], [0, 199]]], music: "so-londres",
    hotspots: [
      exit("ex-as-picc", "Tren a Londres", leftEdge(166), "s-piccadilly", [290, 188]),
      exit("ex-as-despatx", "Despatx del doctor Seward", rect(130, 112, 40, 40), "s-despatx", [40, 192]),
      exit("ex-as-cella", "Pavelló dels pacients", rect(40, 110, 50, 40), "s-cella", [40, 186]),
      exit("ex-as-sala", "Saló", rect(200, 110, 40, 40), "s-sala-reunio", [290, 190]),
      exit("ex-as-mina", "Habitació de la Mina", rect(250, 100, 40, 40), "s-habitacio-mina", [40, 190], {
        conditions: [V("v-caixes-carfax"), V("v-caixes-picc"), V("v-caixes-me")], blocked: "La Mina descansa. Ens ha fet prometre que no la despertarem fins que hàgim segellat totes les caixes que trobem.",
      }),
      exit("ex-as-jardi", "Jardí", rightEdge(161), "s-jardi", [40, 190]),
    ],
    characters: [npc("c-zelador", [150, 188], "right")],
  });
  escena("despatx", "Despatx del doctor Seward", "El despatx del doctor Seward. Llibres, estatuetes i un fonògraf on dicta el seu diari.", {
    walkable: [[[0, 186], [180, 166], [320, 170], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-dp-asil", "Sortir", leftEdge(186), "s-asil", [140, 188]),
      spot("ho-dp-fonograf", "fonògraf", "El fonògraf del doctor. Hi grava el diari en cilindres de cera. Diu que és més ràpid que escriure. Jo uso taquigrafia.", rect(170, 70, 40, 40)),
      spot("ho-dp-estatuetes", "estatuetes", "Estatuetes egípcies i gregues. Déus antics que ja ningú no prega.", rect(60, 112, 100, 25)),
      spot("ho-dp-prestatges", "prestatges", "Psiquiatria, fisiologia... i un llibre sobre la superstició als Carpats, amb el llom gastat.", rect(0, 0, 120, 110)),
    ],
    objects: [place("o-sucre", [124, 142], [120, 182], { layer: "back" }), place("o-pot", [64, 150], [62, 192], { layer: "back" })],
    characters: [npc("c-seward-desp", [252, 192], "left")],
  });
  escena("cella", "Cel·la de Renfield", "La cel·la del pacient Renfield. Neta, buida, i amb una finestra amb reixa.", {
    walkable: [[[30, 152], [290, 152], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-ce-asil", "Sortir", leftEdge(160), "s-asil", [60, 188]),
      spot("ho-ce-finestra", "finestra", "Una finestra amb reixa. Per aquí entren les mosques que en Renfield caça.", rect(140, 15, 40, 50)),
      spot("ho-ce-llit", "llit", "Un llit de ferro, cargolat a terra. En Renfield no hi dorm mai.", rect(200, 120, 90, 40)),
    ],
    characters: [npc("c-renfield", [200, 184], "left")],
  });
  escena("jardi", "Jardí de l'asil", "El jardí tancat de l'asil. Al fons, el mur que el separa de Carfax.", {
    walkable: [[[0, 176], [320, 171], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-jd-asil", "Tornar a l'asil", leftEdge(176), "s-asil", [290, 188]),
      exit("ex-jd-mur", "Mur de Carfax", rect(270, 60, 50, 105), "s-carfax", [290, 190], {
        conditions: [V("v-carfax")], blocked: "A l'altra banda del mur hi ha Carfax, la casa que vaig vendre. De moment no hi tinc res a fer.",
      }),
      spot("ho-jd-font", "font", "Una font amb nenúfars. L'aigua està quieta, com un mirall que no reflecteix el cel.", rect(90, 135, 70, 30)),
      spot("ho-jd-roses", "roses", "Roses blanques i vermelles. Les blanques són les més boniques. Les vermelles, les més tristes.", rect(240, 100, 30, 60)),
    ],
  });
  escena("sala-reunio", "Saló de l'asil", "El saló on ens reunim. Aquí hem jurat destruir el comte.", {
    walkable: [[[0, 192], [60, 173], [320, 173], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-sr-asil", "Sortir", rightEdge(173), "s-asil", [230, 188]),
      spot("ho-sr-taula", "taula", "Mapes, diaris, cartes i telegrames. Hem posat en ordre totes les peces del trencaclosques.", rect(50, 130, 140, 69)),
      spot("ho-sr-quadre", "quadre", "Un retrat d'algú que ens mira amb desaprovació. Com tot Londres, últimament.", rect(260, 35, 30, 40)),
    ],
    characters: [npc("c-vh-sala", [250, 188], "left"), npc("c-quincey-sala", [296, 194], "left")],
  });
  escena("habitacio-mina", "Habitació de la Mina", "La nostra habitació a l'asil. Per primera vegada, la Mina no em somriu en entrar.", {
    walkable: [[[0, 177], [110, 173], [320, 190], [320, 199], [0, 199]]],
    onEnter: { cutsceneId: "cs-atac", once: true },
    hotspots: [
      exit("ex-hm-asil", "Sortir", leftEdge(177), "s-asil", [270, 182]),
      spot("ho-hm-llit", "llit", "El llit desfet. Hi ha una taca vermella al coixí.", rect(150, 60, 170, 120)),
    ],
    characters: [npc("c-mina-asil", [60, 190], "right")],
  });
  escena("carfax", "Carfax", "Carfax, la finca vella que vaig vendre al comte. A la lluna, sembla un cementiri amb finestres.", {
    walkable: [[[0, 180], [320, 180], [320, 199], [0, 199]]], music: "so-dracula",
    hotspots: [
      exit("ex-cx-jardi", "Saltar el mur", rightEdge(180), "s-jardi", [290, 188]),
      exit("ex-cx-capella", "Capella de Carfax", rect(40, 60, 40, 110), "s-carfax-capella", [160, 184], {
        conditions: [hasItem("o-clau-carfax")], blocked: "La capella de Carfax és tancada amb clau. Vaig signar-ne la venda... i no em van donar cap clau.",
      }),
      spot("ho-cx-lluna", "lluna", "La lluna treu el cap entre els núvols, com si espiés.", rect(150, 40, 50, 40)),
      spot("ho-cx-llac", "llac", "Un llac fosc. Hi ha un rastre al fang, com si haguessin arrossegat coses pesants.", rect(100, 120, 180, 50)),
    ],
  });
  escena("carfax-capella", "Capella de Carfax", "La capella de Carfax. Les caixes de terra del comte són aquí.", {
    walkable: [[[100, 130], [230, 130], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-cc-sortir", "Sortir", rect(0, 170, 20, 29), "s-carfax", [60, 188]),
      spot("ho-cc-murs", "murs", "Murs antics coberts d'heura. Fa una olor espantosa: a terra remoguda i a sang vella.", rect(0, 0, 100, 160)),
    ],
    objects: [place("o-rates", [160, 176], [150, 190]), place("o-caixes-carfax", [266, 182], [240, 190]), place("o-llista", [92, 186], [102, 192])],
  });
  escena("piccadilly", "Piccadilly", "Piccadilly, el cor de Londres. Carruatges, gent, i en algun lloc d'aquí, una casa del comte.", {
    walkable: [[[0, 171], [320, 171], [320, 199], [0, 199]]], music: "so-londres",
    hotspots: [
      exit("ex-pc-hill", "Cap a Hillingham", leftEdge(171), "s-hillingham", [290, 192]),
      exit("ex-pc-hs", "Cotxe a Hampstead", rect(150, 120, 40, 40), "s-hampstead", [40, 188]),
      exit("ex-pc-asil", "Tren a Purfleet", rightEdge(171), "s-asil", [40, 188], {
        conditions: [V("v-lucy-pau")], blocked: "El doctor Seward ens espera a Purfleet, però primer hem d'acabar el que hem començat a Kingstead.",
      }),
      exit("ex-pc-casa", "Casa del comte", rect(30, 60, 90, 80), "s-casa-piccadilly", [290, 190], {
        conditions: [V("v-serraller")], blocked: "Una casa elegant, amb les persianes tancades. Pany i forrellat. Caldria un serraller.",
      }),
      exit("ex-pc-east", "Cap a l'East End", rect(230, 80, 40, 88), "s-mile-end", [40, 190], {
        conditions: [hasItem("o-rebut")], blocked: "L'East End és immens. Sense saber on anar, m'hi perdria fins a Nadal.",
      }),
    ],
    objects: [place("o-comte-picc", [262, 188], [240, 188])],
    characters: [npc("c-serraller", [70, 192], "right")],
  });
  escena("casa-piccadilly", "Casa del comte a Piccadilly", "El menjador de la casa de Piccadilly. Tot és pols, menys les caixes.", {
    walkable: [[[0, 177], [320, 173], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-cp-sortir", "Sortir al carrer", rightEdge(173), "s-piccadilly", [90, 188]),
      spot("ho-cp-llar", "llar de foc", "La llar de foc és freda. Hi ha papers cremats: noms de vaixells, i la paraula «Varna».", rect(75, 80, 45, 60)),
      spot("ho-cp-finestres", "finestres", "Persianes tancades. Aquí no hi ha entrat el sol en mesos.", rect(220, 70, 30, 60)),
      spot("ho-cp-retrat", "retrat", "Un retrat antic d'un noble amb un bigoti blanc. Els ulls... són els del comte.", rect(30, 60, 25, 30)),
    ],
    objects: [place("o-caixes-picc", [232, 190], [206, 194]), place("o-rebut", [112, 186], [112, 192])],
  });
  escena("mile-end", "Mile End", "L'East End. Fang, carros, botigues i més gent de la que hi cap.", {
    walkable: [[[0, 177], [320, 173], [320, 199], [0, 199]]], music: "so-londres",
    hotspots: [
      exit("ex-me-picc", "Tornar a Piccadilly", leftEdge(177), "s-piccadilly", [200, 190]),
      exit("ex-me-docks", "Cap als molls", rightEdge(173), "s-docks", [40, 190], {
        conditions: [V("v-vaixell")], blocked: "Als molls? Encara no sabem per on vol fugir.",
      }),
      spot("ho-me-carrer", "carrer", "Un carrer ple de fang i de crits. Ningú no mira ningú. El lloc ideal per amagar un taüt.", rect(100, 100, 180, 60)),
    ],
    objects: [place("o-caixes-me", [92, 192], [116, 194])],
    characters: [npc("c-carreter", [242, 192], "left")],
  });
  escena("zoo", "Zoo de Londres", "El zoo de Regent's Park. D'aquí es va escapar un llop la nit que va morir la Lucy.", {
    walkable: [[[0, 182], [320, 182], [320, 199], [0, 199]]],
    hotspots: [
      exit("ex-zo-hs", "Tornar a Hampstead", leftEdge(182), "s-hampstead", [290, 190]),
      spot("ho-zo-elefant", "elefant", "Un elefant que em mira amb uns ulls molt més tranquils que els meus.", rect(30, 15, 210, 165)),
    ],
    characters: [npc("c-bilder", [276, 194], "left")],
  });
  escena("docks", "Docks de Londres", "Els molls de Londres. Vaixells cap a tot el món. Un d'ells s'emporta el comte.", {
    walkable: [[[0, 179], [320, 179], [320, 199], [0, 199]]], music: "so-persecucio",
    hotspots: [
      exit("ex-dk-me", "Tornar a l'East End", leftEdge(179), "s-mile-end", [290, 190]),
      exit("ex-dk-tren", "Estació de Charing Cross", rightEdge(179), "s-tren", [130, 192], {
        conditions: [hasItem("o-bitllets-tren")], blocked: "Primer he de saber cap on va el comte. I tenir bitllets per arribar-hi abans.",
      }),
      spot("ho-dk-casa", "oficines", "Les oficines de la naviliera. Llibres de registre i tinta fins al sostre.", rect(150, 60, 120, 100)),
    ],
    characters: [npc("c-agent", [200, 192], "left")],
  });
  escena("tren", "L'Orient Exprés", "Un vagó de l'Orient Exprés, camí de Varna. El tren fa un soroll de cor accelerat.", {
    walkable: [[[100, 170], [220, 170], [260, 199], [60, 199]]], music: "so-persecucio",
    onEnter: { cutsceneId: "cs-tren", once: true },
    hotspots: [
      exit("ex-tr-varna", "Baixar a Varna", rect(150, 90, 30, 70), "s-varna", [240, 186], {
        conditions: [hasItem("o-ganivet")], blocked: "Encara som a mig camí. Hauria de parlar amb els companys: el Quincey té alguna cosa per a mi.",
      }),
      spot("ho-tr-finestres", "finestres", "Fora passen Europa, els Alps, el Danubi. No veig res. Penso en la Mina.", rect(0, 40, 90, 120)),
    ],
    characters: [npc("c-arthur-tren", [112, 192], "right"), npc("c-quincey-tren", [206, 192], "left")],
  });

  /* ---------- Lògica ---------- */
  for (const [id, name] of [["v-taut-buit", "taut_buit"], ["v-lucy-atrapada", "lucy_atrapada"], ["v-lucy-pau", "lucy_en_pau"], ["v-carfax", "sap_carfax"], ["v-rates", "rates_fora"],
    ["v-caixes-carfax", "caixes_carfax"], ["v-serraller", "serraller"], ["v-caixes-picc", "caixes_piccadilly"], ["v-carreter", "carreter"], ["v-caixes-me", "caixes_mile_end"],
    ["v-mina-mossegada", "mina_mossegada"], ["v-vaixell", "sap_el_vaixell"]]) P.variable(id, name);

  P.rules.push(
    // El panteó
    rule("use", obj("o-tornavis"), obj("o-taut"), [inState("o-taut", "o-taut-tancat")], [
      sound("so-clic"), setState("o-taut", "o-taut-buit"), setVar("v-taut-buit", true),
      say("(Descargolo la tapa de plom... El taüt és buit.)"), say("Buit?! On és? Qui se l'ha emportada?!", "c-arthur-cripta"),
    ]),
    rule("open", obj("o-taut"), null, [inState("o-taut", "o-taut-tancat")], [say("La tapa és cargolada. Necessito una eina.")]),
    rule("use", obj("o-hosties"), hot("ho-cr-porta"), [V("v-taut-buit"), isVar("v-lucy-atrapada", false)], [cutscene("cs-lucy-vampira")]),
    rule("use", obj("o-hosties"), hot("ho-cr-porta"), [isVar("v-taut-buit", false)], [say("Primer hauríem de veure què hi ha dins del taüt.")]),
    rule("give", obj("o-estaca"), chr("c-arthur-cripta"), [V("v-lucy-atrapada"), hasItem("o-mall")], [cutscene("cs-lucy-pau")]),
    rule("give", obj("o-estaca"), chr("c-arthur-cripta"), [V("v-lucy-atrapada")], [say("Sense un mall no tindré prou força. Dona-me'l també.", "c-arthur-cripta")]),
    rule("give", obj("o-estaca"), chr("c-arthur-cripta"), [], [say("Una estaca? Per a què? ...No. No m'ho diguis encara.", "c-arthur-cripta")]),
    rule("give", obj("o-mall"), chr("c-arthur-cripta"), [V("v-lucy-atrapada"), hasItem("o-estaca")], [cutscene("cs-lucy-pau")]),
    rule("use", obj("o-estaca"), obj("o-taut"), [], [say("No. Això ho ha de fer l'Arthur. Era la seva promesa, i serà el seu adéu.")]),
    rule("talk", obj("o-lucy-vampira"), null, [], [say("Vine amb mi, Jonathan... la Mina no ho sabrà mai.", "c-veu-lucy")]),
    rule("look", obj("o-taut"), null, [inState("o-taut", "o-taut-pau")], [say("La Lucy, en pau. Té la cara dolça que recordo. Les flors tornen a fer olor.")]),
    // L'asil: la mosca i en Renfield
    rule("use", obj("o-sucre"), hot("ho-ce-finestra"), [hasItem("o-pot")], [
      lose("o-sucre"), lose("o-pot"), take("o-mosca"), sound("so-clic"),
      say("(Escampo sucre a l'ampit de la finestra. En un moment hi ha una mosca grossa i blava... La caço amb el pot!)"),
    ]),
    rule("use", obj("o-sucre"), hot("ho-ce-finestra"), [], [say("Les mosques vénen... i se'n van. Si tingués on ficar-ne una...")]),
    rule("use", obj("o-pot"), hot("ho-ce-finestra"), [], [say("Les mosques no entren al pot soles. Caldria un esquer.")]),
    rule("give", obj("o-mosca"), chr("c-renfield"), [], [
      lose("o-mosca"), say("Una mosca! Una mosca grossa i blava! Plena de vida!", "c-renfield"),
      say("Per aquest regal... un secret. El Mestre ja és aquí. A la casa del costat. A Carfax.", "c-renfield"),
      say("Ha portat la seva terra, caixes i caixes. I diu que, quan tot acabi, em donarà milers de vides.", "c-renfield"),
      setVar("v-carfax", true), sound("so-descobert"),
    ]),
    rule("give", obj("o-sucre"), chr("c-renfield"), [], [say("Sucre? Sucre! El sucre no té vida. Porti'm vida!", "c-renfield")]),
    rule("give", obj("o-hosties"), chr("c-renfield"), [], [say("Fora, fora! Això crema! El Mestre no ho vol!", "c-renfield")]),
    // Carfax
    rule("use", obj("o-xiulet"), obj("o-rates"), [], [
      say("(Bufo el xiulet amb totes les forces...)"), sound("so-udol"),
      say("(En un moment entren corrent tres terriers. Borden, mosseguen... i les rates fugen per centenars.)"),
      setState("o-rates", "o-rates-fugides"), setVar("v-rates", true), sound("so-descobert"),
    ]),
    rule("use", obj("o-hosties"), obj("o-rates"), [], [say("Les rates no són vampirs. Només són rates. Moltes.")]),
    rule("use", obj("o-hosties"), obj("o-caixes-carfax"), [isVar("v-rates", false)], [say("Les rates no em deixen acostar-me a les caixes. Em miren, i esperen.")]),
    rule("use", obj("o-hosties"), obj("o-caixes-carfax"), [inState("o-caixes-carfax", "o-caixes-carfax-normal")], [
      setState("o-caixes-carfax", "o-caixes-carfax-segellades"), setVar("v-caixes-carfax", true), sound("so-descobert"),
      say("(Poso un tros d'hòstia a cada caixa. Aquesta terra ja no li servirà de llit.)"),
      say("Però en compto vint-i-nou. De cinquanta. On són les altres?"),
    ]),
    rule("pickup", obj("o-llista"), null, [isVar("v-rates", false)], [say("Hi ha unes rates enormes sobre els papers. Una m'ha ensenyat les dents. No, gràcies.")]),
    // Piccadilly
    rule("give", obj("o-bossa-or"), chr("c-serraller"), [isVar("v-serraller", false)], [
      say("Una moneda turca de tres-cents anys! Per això li obro la catedral de Westminster, si vol.", "c-serraller"),
      say("Quina casa diu que és seva? Aquella? Fet. Ni un sol veí no preguntarà res.", "c-serraller"),
      setVar("v-serraller", true), sound("so-clic"),
    ]),
    rule("give", obj("o-bossa-or"), chr("c-serraller"), [], [say("Ja m'ha pagat, senyor. I bé, molt bé.", "c-serraller")]),
    rule("look", obj("o-comte-picc"), null, [], [
      say("(Aquell home... és alt, jove, de bigoti negre...)"), sound("so-ensurt"),
      say("(És el comte! Rejovenit. La sang de Londres li ha tret quaranta anys de sobre.)"),
      setState("o-comte-picc", "o-comte-picc-amagat"), say("(Ha desaparegut entre la gent. Però té una casa aquí. Segur.)"),
    ]),
    rule("talk", obj("o-comte-picc"), null, [], [say("(No m'hi atreveixo. Aquí, enmig de Piccadilly, de dia... Ell somriu. Sap que el miro.)")]),
    rule("use", obj("o-hosties"), obj("o-caixes-picc"), [inState("o-caixes-picc", "o-caixes-picc-normal")], [
      setState("o-caixes-picc", "o-caixes-picc-segellades"), setVar("v-caixes-picc", true), sound("so-descobert"),
      say("(Segellades. Però aquí n'hi hauria d'haver més. Algú se les ha emportades: hi ha un rebut de transports a la taula.)"),
    ]),
    // Mile End
    rule("give", obj("o-rebut"), chr("c-carreter"), [], [
      lose("o-rebut"), setVar("v-carreter", true),
      say("Ah, les caixes del senyor estranger! Pesaven com morts. Les vaig deixar aquí mateix, en aquell pati.", "c-carreter"),
      say("I no les toqui, que el senyor va dir que eren «terra de casa seva». Gent rara, els estrangers.", "c-carreter"),
    ]),
    rule("use", obj("o-hosties"), obj("o-caixes-me"), [isVar("v-carreter", false)], [say("Aquí tot són caixes. Quines són les del comte? Necessito saber-ho.")]),
    rule("use", obj("o-hosties"), obj("o-caixes-me"), [inState("o-caixes-me", "o-caixes-me-normal")], [
      setState("o-caixes-me", "o-caixes-me-segellades"), setVar("v-caixes-me", true), sound("so-descobert"),
      say("(Segellades. Carfax, Piccadilly, Mile End... Ja li queden ben poques, de caixes. Hauria de tornar a l'asil amb la Mina.)"),
    ]),
    // Altres
    rule("use", obj("o-hosties"), null, [], [say("Les hòsties són per segellar, no per menjar. Van Helsing m'ho ha deixat molt clar.")]),
    rule("use", obj("o-xiulet"), null, [], [sound("so-udol"), say("Fa un xiulet tan agut que els gossos de mig Londres em deuen odiar.")]),
  );

  P.dialogues.push(
    dialogue("d-policia", "El policia", "c-policia", [
      node("po-1", [["c-policia", "Compte, senyor. No és hora de passejar pel Heath."]], [
        opt("Què passa al Heath?", "po-2"),
        opt("On és el cementiri de Kingstead?", "po-3"),
        opt("Bona nit, agent."),
      ]),
      node("po-2", [["c-policia", "Nens. Tres han desaparegut de nit i tornen l'endemà amb dues ferides al coll."], ["c-policia", "Tots diuen el mateix: que una «dama bonica» els ha passejat. Una dama de blanc."]], [opt("Una dama de blanc...", "po-1")]),
      node("po-3", [["c-policia", "Seguint el camí, cap a l'est. Però a aquestes hores no hi trobarà cap viu."]], [opt("Gràcies.", "po-1")]),
    ]),
    dialogue("d-vh-king", "Van Helsing", "c-vh-king", [
      node("vk-1", [["c-vh-king", "Ara ho veurà amb els seus propis ulls, Harker. I després creurà."]], [
        opt("Què hem de fer?", "vk-2"),
        opt("I si és dins del taüt?", "vk-3"),
        opt("Anem."),
      ]),
      node("vk-2", [["c-vh-king", "Obrir el taüt. Si és buit, segellarem la porta del panteó amb l'hòstia: ella no podrà tornar a entrar al seu llit."], ["c-vh-king", "I aleshores, l'estaca. Però ho ha de fer l'Arthur. Només l'amor pot donar-li la pau."]], [opt("Entesos.", "vk-1")]),
      node("vk-3", [["c-vh-king", "Aleshores dorm. I l'haurem de despertar... per sempre."]], [opt("...", "vk-1")]),
    ]),
    dialogue("d-arthur-king", "Arthur", "c-arthur-king", [
      node("ak-1", [["c-arthur-king", "Professor, Harker... què hi fem, en un cementiri a mitjanit?"]], [
        opt("Necessitem la clau del panteó.", "ak-2", { once: true, actions: [take("o-clau-panteo"), sound("so-clic")] }),
        opt("Confia en el professor.", "ak-3"),
        opt("Esperem."),
      ]),
      node("ak-2", [["c-arthur-king", "Profanar la tomba de la Lucy?!"], ["c-arthur-king", "...Si el professor ho diu, que sigui així. Però jo entro amb vosaltres. Té la clau."]], [opt("Gràcies, Arthur.", "ak-1")]),
      node("ak-3", [["c-arthur-king", "Hi confio. Però si m'ha mentit, ni Déu no el salvarà."]], [opt("...", "ak-1")]),
    ]),
    dialogue("d-arthur-cripta", "Arthur", "c-arthur-cripta", [
      node("ac-1", [["c-arthur-cripta", "Lucy... estimada... què t'han fet?"]], [opt("Aguanta, Arthur.")]),
    ]),
    dialogue("d-zelador", "El zelador", "c-zelador", [
      node("ze-1", [["c-zelador", "Compte, senyor. El pacient Renfield està molt agitat avui. Diu que «el Mestre» és a prop."]], [
        opt("On és el doctor Seward?", "ze-2"),
        opt("Què hi ha darrere el jardí?", "ze-3"),
        opt("Gràcies."),
      ]),
      node("ze-2", [["c-zelador", "Al seu despatx, amb el fonògraf. Parla tot sol, com els pacients. Bé, com tots nosaltres."]], [opt("Ja.", "ze-1")]),
      node("ze-3", [["c-zelador", "Carfax. Una casa buida, amb una capella. Hi han vist llums de nit. I en Renfield s'hi escapa sempre."]], [opt("Interessant.", "ze-1")]),
    ]),
    dialogue("d-seward", "Doctor Seward", "c-seward-desp", [
      node("se-1", [["c-seward-desp", "Harker. El professor m'ho ha explicat tot... i jo, que dirigeixo un manicomi, començo a pensar que el boig sóc jo."]], [
        opt("Hi ha res d'estrany a l'asil?", "se-2"),
        opt("Hem d'entrar a Carfax.", "se-3", { once: true, conditions: [V("v-carfax")], actions: [take("o-clau-carfax"), sound("so-clic")] }),
        opt("Puc agafar coses del despatx?", "se-4"),
        opt("Adéu, doctor."),
      ]),
      node("se-2", [["c-seward-desp", "En Renfield, el de la cel·la. Menja mosques. Després aranyes, per menjar-se les mosques. Després ocells, per menjar-se les aranyes."], ["c-seward-desp", "Diu que la vida és a la sang. Últimament parla d'un «Mestre». Potser vostè el fa parlar: a mi no em diu res si no li porto un regal."]], [opt("Un regal...", "se-1")]),
      node("se-3", [["c-seward-desp", "Carfax és aquí al costat, darrere el mur del jardí. L'agent immobiliari em va deixar una clau de la capella, per si de cas. Tingui."]], [opt("Gràcies.", "se-1")]),
      node("se-4", [["c-seward-desp", "El que vulgui. El sucre és per al te, i els pots per a mostres. Però no em toqui els cilindres del fonògraf."]], [opt("Entesos.", "se-1")]),
    ]),
    dialogue("d-renfield", "Renfield", "c-renfield", [
      node("rf-1", [["c-renfield", "Que no veu que tinc gana? Gana de vida! Les mosques tenen vida, i jo me la menjo."]], [
        opt("Qui és el Mestre?", "rf-2"),
        opt("Per què menges mosques?", "rf-3"),
        opt("Adéu, Renfield."),
      ]),
      node("rf-2", [["c-renfield", "El Mestre ve de lluny, per mar. Em promet vides, milers de vides: rates, gats, gossos..."], ["c-renfield", "Però vostè no em dona res. Ni una mosca! Per què li hauria de dir res?"]], [opt("Ja veurem.", "rf-1")]),
      node("rf-3", [["c-renfield", "La sang és la vida! Ho diu la Bíblia. Bé, ho diu el Mestre. És gairebé el mateix."]], [opt("...", "rf-1")]),
    ]),
    dialogue("d-vh-sala", "Van Helsing", "c-vh-sala", [
      node("vs-1", [["c-vh-sala", "Senyors, senyora: el nostre enemic té la força de vint homes, la saviesa dels segles i l'ajuda de la nit. Però també té límits."]], [
        opt("Quins límits?", "vs-2"),
        opt("Hipnotitzeu la Mina, professor.", null, { once: true, conditions: [V("v-mina-mossegada")], actions: [cutscene("cs-hipnosi")] }),
        opt("Què hem de fer ara?", "vs-3"),
        opt("Adéu."),
      ]),
      node("vs-2", [["c-vh-sala", "No pot entrar on no l'han convidat. No travessa l'aigua corrent si no és amb la marea. De dia, perd el poder."], ["c-vh-sala", "I ha de dormir a la terra del seu país: les caixes! Si les segellem totes, no tindrà on amagar-se."]], [opt("Les caixes.", "vs-1")]),
      node("vs-3", [["c-vh-sala", "Carfax, la casa de Piccadilly, i les que hagi repartit per Londres. Cada caixa segellada és una tomba menys per a ell."]], [opt("Entesos.", "vs-1")]),
    ]),
    dialogue("d-quincey-sala", "Quincey", "c-quincey-sala", [
      node("qs-1", [["c-quincey-sala", "Howdy, Harker. Al meu país, quan un llop baixa al ranxo, se l'espera a la porta amb el rifle."]], [
        opt("Què portes al coll?", "qs-2", { once: true, actions: [take("o-xiulet"), sound("so-descobert")] }),
        opt("Tens por?", "qs-3"),
        opt("Adéu, Quincey."),
      ]),
      node("qs-2", [["c-quincey-sala", "Un xiulet de caça. He llogat tres terriers que fan feredat a les rates. Si el bufes, vindran. Té, potser et farà servei."]], [opt("Gràcies.", "qs-1")]),
      node("qs-3", [["c-quincey-sala", "Por? Només de no arribar a temps. Per la Lucy... i per la teva Mina."]], [opt("...", "qs-1")]),
    ]),
    dialogue("d-mina-asil", "Mina", "c-mina-asil", [
      node("ma-1", [["c-mina-asil", "Jonathan... sento el que ell sent. Quan s'acosta l'alba, sento l'aigua, les cadenes, la fusta que cruix."]], [
        opt("Com et trobes?", "ma-2"),
        opt("Què hem de fer?", "ma-3"),
        opt("T'estimo, Mina."),
      ]),
      node("ma-2", [["c-mina-asil", "Com si portés un ull obert dins del cap. I l'ull no és meu."]], [opt("...", "ma-1")]),
      node("ma-3", [["c-mina-asil", "Que el professor m'hipnotitzi. Si el meu cap és de la seva sang, que ens serveixi per seguir-lo."]], [opt("Ho farem.", "ma-1")]),
    ]),
    dialogue("d-serraller", "El serraller", "c-serraller", [
      node("sr-1", [["c-serraller", "Panys, claus, forrellats! Obro el que sigui... si el preu és bo."]], [
        opt("Necessito entrar a una casa. He perdut la clau.", "sr-2"),
        opt("Adéu."),
      ]),
      node("sr-2", [["c-serraller", "Casa seva, eh? Té cara de tenir casa a Piccadilly?"], ["c-serraller", "...Bé. L'or no fa preguntes. I jo tampoc, si n'hi ha prou."]], [opt("Entesos.", "sr-1")]),
    ]),
    dialogue("d-carreter", "El carreter", "c-carreter", [
      node("ca-1", [["c-carreter", "Bon dia, senyor. Si busca transport, ja plego. Si busca beure, encara no."]], [
        opt("Heu portat caixes de terra?", "ca-2"),
        opt("Adéu."),
      ]),
      node("ca-2", [["c-carreter", "Jo porto el que em diuen, i no miro què hi ha a dins. Ensenyi'm un paper i li diré on van anar."]], [opt("Un paper...", "ca-1")]),
    ]),
    dialogue("d-bilder", "El guardià Bilder", "c-bilder", [
      node("bi-1", [["c-bilder", "Vol saber del llop? Tothom ho vol saber! Els diaris en diuen «l'escapada del zoo»."]], [
        opt("Què va passar?", "bi-2"),
        opt("Algú va venir a veure'l?", "bi-3"),
        opt("Adéu."),
      ]),
      node("bi-2", [["c-bilder", "En Bersicker, el meu llop gris, va fugir una nit i va tornar l'endemà, ple de vidres al pèl. Mans d'home no van obrir la gàbia, això li ho dic jo."]], [opt("Vidres...", "bi-1")]),
      node("bi-3", [["c-bilder", "Un senyor alt, de bigoti blanc i ulls vermells. Va parlar amb els llops, i els llops es van posar a gemegar com gossets. No m'agradava gens."]], [opt("A mi tampoc.", "bi-1")]),
    ]),
    dialogue("d-agent", "L'agent de la naviliera", "c-agent", [
      node("an-1", [["c-agent", "Naviliera de Londres, molt bon dia. En què el puc ajudar?"]], [
        opt("Ha sortit avui algun vaixell cap al mar Negre?", "an-2", { once: true, conditions: [V("v-vaixell")], actions: [take("o-bitllets-tren"), sound("so-descobert")] }),
        opt("Adéu."),
      ]),
      node("an-2", [["c-agent", "El Czarina Catherine, cap a Varna, amb la marea d'aquesta tarda. L'últim passatger va pujar amb una caixa gran... un senyor alt, de barret."], [null, "Per mar trigarà setmanes. Per terra, amb l'Orient Exprés, arribarem abans. Quatre bitllets, si us plau!"]], [opt("Gràcies.", "an-1")]),
    ]),
    dialogue("d-quincey-tren", "Quincey", "c-quincey-tren", [
      node("qt-1", [["c-quincey-tren", "Harker. Té, això és per a tu."]], [
        opt("Què és?", "qt-2", { once: true, actions: [take("o-ganivet"), sound("so-descobert")] }),
        opt("Quan arribem?", "qt-3"),
        opt("Després."),
      ]),
      node("qt-2", [["c-quincey-tren", "Un kukri, un ganivet dels gurkhes. El meu Bowie i el teu kukri. Quan el sol es pongui sobre aquell castell, hi haurà feina."]], [opt("Hi serem.", "qt-1")]),
      node("qt-3", [["c-quincey-tren", "Demà, a Varna. I el vaixell, d'aquí a uns dies, si el vent no l'ajuda. I ja saps qui mana el vent."]], [opt("...", "qt-1")]),
    ]),
    dialogue("d-arthur-tren", "Arthur", "c-arthur-tren", [
      node("at-1", [["c-arthur-tren", "Per la Lucy. Tot això és per la Lucy."]], [opt("I per la Mina."), opt("I per tots els altres.")]),
    ]),
  );

  P.cutscenes.push(
    { id: "cs-lucy-vampira", name: "La Lucy", actions: [
      say("(Desfaig una hòstia i n'omplo les escletxes de la porta. Esperem a les fosques...)"),
      wait(1), sound("so-ensurt"), setState("o-lucy-vampira", "o-lucy-vampira-present"),
      say("Arthur... vine amb mi, amor meu. Els meus braços tenen fam de tu.", "c-veu-lucy"),
      say("(És la Lucy... però no és la Lucy. Té la boca plena de sang, i un nen adormit als braços.)"),
      say("(Deixa el nen a terra, amb un gruny, i veu l'hòstia a la porta. Recula... i s'esmuny dins del taüt per una escletxa, com fum.)"),
      setState("o-lucy-vampira", "o-lucy-vampira-amagat"), setState("o-taut", "o-taut-ocupat"), setVar("v-lucy-atrapada", true),
      say("Ara, Arthur. L'estaca, i el mall.", "c-arthur-cripta"),
    ] },
    { id: "cs-lucy-pau", name: "La pau de la Lucy", actions: [
      lose("o-estaca"), lose("o-mall"),
      say("Per la Lucy. Per la Lucy de debò.", "c-arthur-cripta"),
      sound("so-ensurt"), say("(L'Arthur clava l'estaca. Un crit que gela l'ànima... i després, silenci.)"),
      setState("o-taut", "o-taut-pau"), setVar("v-lucy-pau", true), music("so-final"),
      say("(La Lucy torna a tenir la cara dolça d'abans. Per fi descansa.)"),
      say("Gràcies... Gràcies a tots.", "c-arthur-cripta"),
      say("(Van Helsing diu que ara ens toca el comte. El doctor Seward ens espera a l'asil de Purfleet.)"),
    ] },
    { id: "cs-atac", name: "L'atac", actions: [
      say("(La porta de la Mina és oberta...)"), sound("so-ensurt"), music("so-dracula"),
      say("(El comte és aquí! Té la Mina agafada, i la força a beure d'una ferida del seu propi pit.)"),
      say("Ara ets carn de la meva carn, sang de la meva sang. Quan et cridi, vindràs.", COMTE),
      say("(Aixeco les hòsties... i el comte es desfà en una boira verdosa per sota la porta.)"),
      say("Jonathan... sóc impura. Impura!", "c-mina-asil"),
      say("(Van Helsing li toca el front amb una hòstia... i la carn se li crema. Li queda una cicatriu vermella.)"),
      setVar("v-mina-mossegada", true),
      say("(Ja no té cap caixa segura a Londres. Fugirà. Però cap on? Potser Van Helsing ho pot descobrir... a través de la Mina.)"),
    ] },
    { id: "cs-hipnosi", name: "La hipnosi", actions: [
      say("Miri'm als ulls, senyora Harker... Respiri. Ara, digui'm: què sent?", "c-vh-sala"),
      wait(1),
      say("Aigua... aigua que xipolleja... cadenes que grinyolen... una àncora que puja...", "c-veu-mina"),
      say("Un vaixell! Fuig per mar, cap a casa seva. Als molls sabran quin vaixell ha salpat avui!", "c-vh-sala"),
      setVar("v-vaixell", true), sound("so-descobert"),
    ] },
    { id: "cs-tren", name: "L'Orient Exprés", actions: [
      say("(L'Orient Exprés. Tres dies fins a Varna. El Czarina Catherine en trigarà més... si el vent no l'ajuda.)"),
      say("(La Mina dorm al compartiment del costat. Cada matí, a l'alba, Van Helsing l'hipnotitza: «Aigua... ones... foscor».)"),
    ] },
  );
}
