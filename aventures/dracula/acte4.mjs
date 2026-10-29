// Acte IV — La persecució: de Varna al castell, fins a la posta de sol
export default function acte4({ P, K, E, O, pj, escena, aparicio }) {
  const { rect, leftEdge, rightEdge, spot, exit, npc, place, obj, chr, hot, hasItem, inState, isVar, say, take, lose, setState, setVar, sound, music, cutscene, wait, goto, end, rule, dialogue, node, opt } = K;
  const V = (id) => isVar(id, true);
  const COMTE = "c-comte";

  /* ---------- Objectes ---------- */
  P.object({ id: "o-telegrama", name: "telegrama", description: "«Czarina Catherine ha passat de llarg de Varna. Entrat al port de Galatz aquesta matinada. —Lloyd's.»", pickable: true, states: [["normal", "Normal", O.telegrama()]] });
  P.object({ id: "o-albara", name: "albarà", description: "«Una caixa per als Szgany. Riu amunt, pel Siret i el Bistrița, fins al pas del Borgo.» Signat: Skinsky.", pickable: true, states: [["normal", "Normal", O.albara()]] });
  P.object({ id: "o-skinsky", name: "Skinsky", description: "En Skinsky, el comerciant. Mort, amb el coll obert de dalt a baix. Els gitanos no volen testimonis.", states: [["normal", "Normal", E.estirada(E.LOOKS.senyor)]] });
  P.object({ id: "o-estaca-nova", name: "estaca", description: "L'última estaca de Van Helsing. Freixe sec, beneït a Amsterdam.", pickable: true, states: [["normal", "Normal", O.estaca()]] });
  aparicio("o-germanes-camp", "les tres germanes", "Les germanes del castell, de peu dret a la neu, fora del cercle del foc. No deixen petjades.", O.germanes());
  P.object({ id: "o-foc", name: "foc", description: "El foc del campament. És l'única cosa calenta en cent quilòmetres.", states: [["normal", "Normal", O.foc()]] });
  P.object({ id: "o-tombes-germanes", name: "tombes de les germanes", description: "Tres tombes de marbre, sense nom. Dins, dormen les germanes.", states: [["dormen", "Dormen", O.tombesGermanes(false)], ["pau", "En pau", O.tombesGermanes(true)]] });
  P.object({ id: "o-carreta", name: "carro dels gitanos", description: "Un carro amb una caixa gran lligada amb cordes. La caixa. La darrera.", states: [["normal", "Normal", O.carreta()]] });

  /* ---------- Personatges ---------- */
  pj("c-telegrafista", "senyor", "telegrafista", "El telegrafista de Varna. Té els dits tacats de tinta i els ulls de son.", "#c0c8d8");
  pj("c-viceconsol", "senyor", "vicecònsol", "El vicecònsol britànic a Galatz. Molt britànic i molt poc cònsol.", "#c8c0d8");
  pj("c-barquer", "mariner", "barquer", "El patró d'una llanxa de vapor. Fuma una pipa que fa més fum que la caldera.", "#a0c0d8");
  pj("c-quincey-bosc", "quincey", "Quincey");
  pj("c-mina-camp", "mina", "Mina");
  pj("c-vh-camp", "vanHelsing", "Van Helsing");
  pj("c-gitano", "gitano", "gitano", "Un dels Szgany, els gitanos que serveixen el comte. Porta un ganivet llarg a la faixa.", "#d8a080");

  /* ---------- Escenaris ---------- */
  escena("varna", "Port de Varna", "El port de Varna, al mar Negre. Fa dies que esperem un vaixell que no arriba.", {
    music: "so-persecucio",
    onEnter: { cutsceneId: "cs-varna", once: true },
    hotspots: [
      exit("ex-va-galatz", "Tren a Galatz", rightEdge(171), "s-galatz", [40, 186], {
        conditions: [hasItem("o-telegrama")], blocked: "Esperem el Czarina Catherine aquí. Si marxem ara, el perdrem.",
      }),
      spot("ho-va-vaixell", "vaixell", "Un vapor gros, que no és el nostre. Cap vaixell no és el nostre.", rect(0, 20, 240, 140)),
    ],
    characters: [npc("c-telegrafista", [242, 190], "left")],
  });
  escena("galatz", "Port de Galatz", "Galatz, al Danubi. El Czarina Catherine és aquí, amarrat. Buit.", {
    music: "so-persecucio",
    hotspots: [
      exit("ex-ga-magatzem", "Magatzem de Skinsky", rect(0, 40, 50, 90), "s-magatzem", [290, 190]),
      exit("ex-ga-riu", "Llanxa de vapor", rect(100, 160, 60, 30), "s-riu", [60, 190], {
        conditions: [hasItem("o-albara")], blocked: "Una llanxa de vapor. Però cap on? Primer he de saber on s'han endut la caixa.",
      }),
      spot("ho-ga-vapor", "Czarina Catherine", "El Czarina Catherine. La tripulació diu que el viatge ha estat el més ràpid de la seva vida. El vent els empenyia. Ja sabem qui.", rect(140, 60, 140, 80)),
    ],
    characters: [npc("c-viceconsol", [60, 188], "right")],
  });
  escena("magatzem", "Magatzem de Skinsky", "El magatzem de Skinsky. Fosc, humit, i amb una olor que ja conec massa bé.", {
    hotspots: [
      exit("ex-mg-galatz", "Sortir", rightEdge(176), "s-galatz", [40, 160]),
      spot("ho-mg-caixes", "fardells", "Fardells, sacs i caixes. Cap no fa olor de terra de cementiri. La que buscàvem ja no hi és.", rect(20, 100, 120, 70)),
    ],
    objects: [place("o-skinsky", [222, 196], [200, 194]), place("o-albara", [122, 192], [122, 194])],
  });
  escena("riu", "Riu Bistrița", "El riu, a la nit. Aigua negra i corrent, cap a les muntanyes.", {
    music: "so-persecucio",
    hotspots: [
      exit("ex-ri-bosc", "Remuntar el riu", rect(170, 100, 50, 60), "s-bosc", [60, 190], {
        conditions: [V("v-vapor")], blocked: "El barquer no engegarà la caldera per res. Ni per ningú.",
      }),
      exit("ex-ri-galatz", "Tornar a Galatz", leftEdge(176), "s-galatz", [120, 186]),
      spot("ho-ri-aigua", "aigua", "Aigua corrent. Ell no la pot travessar si no és dins de la caixa, i amb ajuda. Per això el porten per riu.", rect(160, 160, 160, 39)),
    ],
    characters: [npc("c-barquer", [100, 190], "right")],
  });
  escena("bosc", "Bosc nevat", "Els boscos dels Carpats, sota la neu. Fa tant de fred que l'aire fa mal.", {
    music: "so-transilvania",
    onEnter: { cutsceneId: "cs-bosc", once: true },
    hotspots: [
      exit("ex-bo-riu", "Tornar al riu", leftEdge(176), "s-riu", [100, 188]),
      exit("ex-bo-camp", "Cap al campament", rightEdge(162), "s-campament", [90, 192]),
      spot("ho-bo-arbres", "avets", "Avets negres, carregats de neu. A vegades, un d'ells es mou sense vent.", rect(0, 0, 320, 100)),
    ],
    characters: [npc("c-quincey-bosc", [240, 188], "left")],
  });
  escena("campament", "Campament", "El campament de Van Helsing i la Mina, a la vista del castell. La nit és plena d'ulls.", {
    music: "so-dracula",
    onEnter: { cutsceneId: "cs-campament", once: true },
    hotspots: [
      exit("ex-cm-bosc", "Tornar al bosc", leftEdge(185), "s-bosc", [290, 188]),
      exit("ex-cm-castell", "Cap al castell", rightEdge(156), "s-castell-neu", [40, 188], {
        conditions: [V("v-cercle")], blocked: "No puc deixar la Mina sola amb aquelles tres rondant el campament.",
      }),
      spot("ho-cm-llop", "llop", "Un llop enorme, a la vora del gel. Ens mira i no s'acosta. Espera ordres.", rect(140, 90, 80, 80)),
    ],
    objects: [place("o-germanes-camp", [128, 192], [160, 190]), place("o-foc", [206, 192], [190, 194])],
    characters: [npc("c-mina-camp", [252, 188], "left"), npc("c-vh-camp", [294, 192], "left")],
  });
  escena("castell-neu", "El castell sota la neu", "El castell de Dràcula, cobert de neu, sota un cel de tempesta.", {
    music: "so-dracula",
    onEnter: { cutsceneId: "cs-castell", once: true },
    hotspots: [
      exit("ex-cn-tombes", "Ruïnes de la capella", rect(10, 60, 100, 90), "s-tombes", [290, 190]),
      exit("ex-cn-camp", "Tornar al campament", leftEdge(178), "s-campament", [290, 190]),
      exit("ex-cn-cami", "Al camí dels gitanos", rightEdge(171), "s-cami", [40, 190], {
        conditions: [V("v-germanes-pau"), V("v-tomba")], blocked: "Encara no. Quan arribi el comte, el castell no li ha d'oferir cap refugi: primer, les tombes.",
      }),
      spot("ho-cn-cel", "tempesta", "Núvols negres, com si el cel també volgués protegir-lo.", rect(120, 0, 200, 80)),
    ],
  });
  escena("tombes", "Tombes del castell", "Sota el castell, les tombes. La més gran porta un sol nom.", {
    hotspots: [
      exit("ex-tb-castell", "Sortir", rightEdge(180), "s-castell-neu", [60, 188]),
      spot("ho-tb-sarcofag", "sarcòfag del comte", "Una tomba enorme, sense cap creu. Només una paraula gravada a la pedra: DRACULA.", rect(60, 10, 220, 150)),
    ],
    objects: [place("o-tombes-germanes", [62, 198], [62, 194])],
  });
  escena("cami", "Camí dels gitanos", "El camí del castell, a la posta de sol. Els gitanos arriben amb el carro.", {
    music: "so-persecucio",
    onEnter: { cutsceneId: "cs-cami", once: true },
    hotspots: [
      exit("ex-ca-castell", "Tornar al castell", leftEdge(166), "s-castell-neu", [290, 188]),
      spot("ho-ca-sol", "sol", "El sol ja toca les muntanyes. Quan s'amagui, el comte sortirà de la caixa.", rect(80, 60, 160, 40)),
    ],
    objects: [place("o-carreta", [122, 192], [152, 192])],
    characters: [npc("c-gitano", [202, 186], "left")],
  });
  escena("epileg", "Epíleg", "Set anys després. Les ruïnes del castell, a l'alba.", {
    music: "so-final",
    hotspots: [spot("ho-ep-ruines", "ruïnes", "Del castell de Dràcula només en queden pedres. I el vent.", rect(30, 10, 200, 170))],
  });

  /* ---------- Lògica ---------- */
  for (const [id, name] of [["v-vapor", "vapor_pagat"], ["v-cercle", "cercle_sagrat"], ["v-germanes-pau", "germanes_en_pau"], ["v-tomba", "tomba_segellada"]]) P.variable(id, name);

  P.rules.push(
    rule("pickup", obj("o-skinsky"), null, [], [say("No. Que el trobin els seus.")]),
    rule("talk", obj("o-skinsky"), null, [], [say("Ja no dirà res a ningú. Per això el van matar.")]),
    rule("give", obj("o-bossa-or"), chr("c-barquer"), [isVar("v-vapor", false)], [
      say("Or! Or antic! Per això remunto el riu fins a l'infern... però ni un pam més enllà.", "c-barquer"),
      setVar("v-vapor", true), sound("so-descobert"),
    ]),
    rule("give", obj("o-bossa-or"), chr("c-gitano"), [], [say("L'or no ens servirà de res si el boiar es desperta i ens troba sense la seva caixa.", "c-gitano")]),
    rule("use", obj("o-hosties"), obj("o-germanes-camp"), [], [
      say("(Esmicolo una hòstia i en faig un cercle al voltant de la Mina i del foc.)"),
      say("Germana! No ens tanquis fora! Germana!", "c-veu-germanes"), sound("so-ensurt"),
      setState("o-germanes-camp", "o-germanes-camp-amagat"), setVar("v-cercle", true),
      say("(Xisclen, i fugen per la neu cap al castell.)"),
      say("Ara ja sé on dormen. Vagi a les seves tombes abans que es faci de nit, Jonathan. I no les miri als ulls.", "c-vh-camp"),
    ]),
    rule("use", obj("o-crucifix"), obj("o-germanes-camp"), [], [say("Fan un pas enrere... i en fan dos endavant. Aquí fora són massa fortes. Cal alguna cosa per protegir tot el campament.")]),
    rule("talk", obj("o-germanes-camp"), null, [], [say("Vine, germanet... la neu és tan freda, i nosaltres tan calentes...", "c-veu-germanes")]),
    rule("use", obj("o-estaca-nova"), obj("o-tombes-germanes"), [inState("o-tombes-germanes", "o-tombes-germanes-dormen")], [
      say("(Una per una, aixeco les tapes. Dormen, boniques i terribles, amb els llavis vermells.)"),
      sound("so-ensurt"), say("(L'estaca. Una pedra per mall. Tres crits... i tres vegades pols.)"),
      setState("o-tombes-germanes", "o-tombes-germanes-pau"), setVar("v-germanes-pau", true), lose("o-estaca-nova"),
      say("(Per fi descansen. Fa segles que esperaven aquest moment, potser.)"),
    ]),
    rule("open", obj("o-tombes-germanes"), null, [inState("o-tombes-germanes", "o-tombes-germanes-dormen")], [say("Dormen, amb els ulls oberts. Necessito alguna cosa per acabar amb això. Una estaca.")]),
    rule("use", obj("o-hosties"), hot("ho-tb-sarcofag"), [isVar("v-tomba", false)], [
      say("(Poso l'hòstia dins de la tomba buida del comte.)"), sound("so-descobert"), setVar("v-tomba", true),
      say("(Ja no hi podrà tornar mai més. Aquesta nit, si arriba, no tindrà on dormir.)"),
    ]),
    rule("open", hot("ho-tb-sarcofag"), null, [], [say("Buida. Ell encara no ha arribat. Però vindrà.")]),
    rule("use", obj("o-ganivet"), obj("o-carreta"), [], [cutscene("cs-final")]),
    rule("open", obj("o-carreta"), null, [], [say("Els gitanos m'envolten. Amb les mans no podré pas. Necessito una arma.")]),
    rule("talk", obj("o-carreta"), null, [], [say("...Dins la caixa, alguna cosa s'ha mogut.")]),
  );

  P.dialogues.push(
    dialogue("d-telegrafista", "El telegrafista", "c-telegrafista", [
      node("tg-1", [["c-telegrafista", "Telègrafs de Varna. Senyor Harker? Té un telegrama de Lloyd's, de Londres."]], [
        opt("Llegiu-me'l.", "tg-2", { once: true, actions: [take("o-telegrama"), sound("so-ensurt")] }),
        opt("Encara res del Czarina Catherine?", "tg-3"),
        opt("Adéu."),
      ]),
      node("tg-2", [["c-telegrafista", "«Czarina Catherine ha passat de llarg de Varna. Entrat al port de Galatz aquesta matinada.»"], [null, "Galatz! Ens ha enganyat. Llegeix la ment de la Mina igual que ella llegeix la seva."]], [opt("Al tren, de seguida!", "tg-1")]),
      node("tg-3", [["c-telegrafista", "Res, senyor. El mar Negre és molt gran, i aquests dies fa una boira estranya."]], [opt("Estranya...", "tg-1")]),
    ]),
    dialogue("d-viceconsol", "El vicecònsol", "c-viceconsol", [
      node("vc-1", [["c-viceconsol", "El vicecònsol britànic, per servir-lo. Vostè busca el Czarina Catherine? Ha arribat aquesta matinada."]], [
        opt("I la càrrega?", "vc-2"),
        opt("Adéu."),
      ]),
      node("vc-2", [["c-viceconsol", "Una sola caixa, consignada a un tal Hildesheim, que la va passar a un tal Skinsky. Té el magatzem aquí mateix."], ["c-viceconsol", "Però ahir no va obrir la botiga. Deu estar indisposat."]], [opt("Indisposat...", "vc-1")]),
    ]),
    dialogue("d-barquer", "El barquer", "c-barquer", [
      node("ba-1", [["c-barquer", "Riu amunt? A aquestes hores? Amb aquest fred?"]], [
        opt("Hem de seguir una barca de gitanos.", "ba-2"),
        opt("Adéu."),
      ]),
      node("ba-2", [["c-barquer", "Tot té un preu, senyor. I el meu, per anar cap al Borgo de nit, és alt. Molt alt."]], [opt("Ja veig.", "ba-1")]),
    ]),
    dialogue("d-quincey-bosc", "Quincey", "c-quincey-bosc", [
      node("qb-1", [["c-quincey-bosc", "Els gitanos van per la carretera, amb la caixa en un carro. Arribaran al castell al capvespre."]], [
        opt("I la Mina?", "qb-2"),
        opt("Endavant."),
      ]),
      node("qb-2", [["c-quincey-bosc", "Amb el professor, al campament, aquí al davant. Ves-hi. Jo vigilo el camí."]], [opt("Gràcies, Quincey.", "qb-1")]),
    ]),
    dialogue("d-vh-camp", "Van Helsing", "c-vh-camp", [
      node("vc-1", [["c-vh-camp", "Jonathan! Gràcies a Déu. Aquesta nit, les germanes han vingut tres vegades."]], [
        opt("Necessito una altra estaca.", "vc-2", { once: true, actions: [take("o-estaca-nova"), sound("so-descobert")] }),
        opt("Com està la Mina?", "vc-3"),
        opt("Adéu, professor."),
      ]),
      node("vc-2", [["c-vh-camp", "Tinc la darrera. Freixe sec, beneït. És per a elles... o per a ell."]], [opt("Que no falli.", "vc-1")]),
      node("vc-3", [["c-vh-camp", "Cada dia més pàl·lida, i cada dia més seva. Si ell no mor abans de la posta, la perdrem."]], [opt("No la perdrem.", "vc-1")]),
    ]),
    dialogue("d-mina-camp", "Mina", "c-mina-camp", [
      node("mc-1", [["c-mina-camp", "Jonathan... sento la caixa. Va sacsejant-se en un carro, per la neu. És a prop, molt a prop."]], [
        opt("Aguanta, Mina.", "mc-2"),
        opt("T'estimo."),
      ]),
      node("mc-2", [["c-mina-camp", "Si em torno com elles... promet-me que faràs amb mi el que l'Arthur va fer amb la Lucy."], [null, "...Ho prometo. Però no caldrà."]], [opt("No caldrà.", "mc-1")]),
    ]),
    dialogue("d-gitano", "El gitano", "c-gitano", [
      node("gi-1", [["c-gitano", "Enrere, anglès! Aquesta caixa és del boiar!"]], [
        opt("Deixa'ns passar.", "gi-2"),
        opt("Saps què porteu, en aquesta caixa?", "gi-3"),
      ]),
      node("gi-2", [["c-gitano", "Mai! El sol encara no s'ha post. Quan s'amagui, ell us farà miques."]], [opt("Ja veurem.", "gi-1")]),
      node("gi-3", [["c-gitano", "El nostre senyor. Ens paga bé, ens protegeix dels llops... i ens deixa viure. No ho fa amb tothom."]], [opt("...", "gi-1")]),
    ]),
  );

  P.cutscenes.push(
    { id: "cs-varna", name: "Varna", actions: [
      say("(Varna. Fa dies que esperem el Czarina Catherine.)"),
      say("(Cada matí, a l'alba, Van Helsing hipnotitza la Mina. I cada matí diu el mateix: «Aigua. Ones. Foscor.»)"),
    ] },
    { id: "cs-bosc", name: "Els Carpats", actions: [
      sound("so-udol"),
      say("(Els Carpats, una altra vegada. La Mina i Van Helsing han anat endavant, en carro, cap al castell.)"),
      say("(Nosaltres seguim els gitanos. El Quincey diu que la neu ens ajudarà: deixen rastre.)"),
    ] },
    { id: "cs-campament", name: "Les germanes al campament", actions: [
      say("(Van Helsing ha encès un foc... però a fora, a la neu, hi ha tres figures blanques.)"),
      say("Vine, germana! Vine amb nosaltres! Ja ets gairebé de la família!", "c-veu-germanes"),
      say("Jonathan... em criden. I una part de mi les vol seguir.", "c-mina-camp"),
    ] },
    { id: "cs-castell", name: "Tornada al castell", actions: [
      say("(El castell de Dràcula, sota la neu. L'última vegada que hi vaig ser, en vaig fugir per un espadat.)"),
      say("(Abans que arribi el seu amo, hem d'assegurar-nos que no hi trobi cap refugi.)"),
    ] },
    { id: "cs-cami", name: "La posta de sol", actions: [
      say("(El sol es pon. Els gitanos arriben amb el carro, cap al castell.)"),
      say("Ara, Jonathan! Abans que el sol s'amagui del tot!", "c-quincey-bosc"),
    ] },
    { id: "cs-final", name: "Final", actions: [
      sound("so-ensurt"),
      say("(Salto sobre el carro. Els gitanos ens envolten. El Quincey rep una ganivetada al costat... però no s'atura.)"),
      say("(Arrenquem la tapa. El comte és a dins, pàl·lid com la cera, amb els ulls plens d'odi.)"),
      say("Massa tard, mortals. El sol ja s'amaga...", COMTE),
      say("(Però no prou! El meu kukri li talla el coll. El ganivet del Quincey se li clava al cor.)"),
      music("so-final"),
      say("(I davant dels nostres ulls, el comte es desfà en pols. Un instant abans de desaparèixer, a la cara hi té... pau.)"),
      say("(El Quincey ha caigut a la neu. Somriu: «Mireu el front de la Mina... la cicatriu ha desaparegut». I tanca els ulls.)"),
      wait(1),
      goto("s-epileg", [160, 192]),
      say("(Set anys després.)"),
      say("(La Mina i jo tenim un fill. Es diu Quincey.)"),
      say("(Hem tornat a Transilvània. Del castell només en queden les pedres, i el vent.)"),
      say("(Ningú no creurà mai aquesta història. Però aquí la tens, escrita. I nosaltres sabem que va ser veritat.)"),
      end("FI. «Els morts viatgen de pressa.»"),
    ] },
  );
}
