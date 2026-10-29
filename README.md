# Editor d'aventures gràfiques

Eina web per crear aventures gràfiques a l'estil de Monkey Island o Maniac Mansion. El pla complet és a [PLA.md](PLA.md).

**Prova-la en línia:** https://realbluehead.github.io/aventura-editor/ — l'editor sencer, sense instal·lar res, amb l'aventura «La rosa de Sant Jordi» ja carregada. A la versió web les aventures es guarden al navegador de cadascú (IndexedDB); «Exporta el joc…» en treu un zip que es pot tornar a importar.

De moment gestiona:

- **Aventures**: títol, descripció i escenari inicial.
- **Escenaris** dins de cada aventura: nom, imatge de fons i descripció.
- **Editor visual d'escenaris**: dibuixar sobre el fons la zona caminable i els punts calents. Un punt calent pot ser una **sortida** cap a un altre escenari, amb el punt on hi apareix el personatge. Una sortida pot tenir **condicions** (per exemple, tenir el bitllet del bus) i el que diu el protagonista si encara no hi pot passar. Té zoom, desfer/refer i desat automàtic.
- **Mapa de l'aventura**: els escenaris connectats per les sortides, amb avisos (escenaris on no es pot arribar, sortides que no porten enlloc…).
- **Objectes**: una biblioteca per aventura. Cada objecte té nom, descripció, estats amb la seva imatge (per exemple, oberta i tancada) i pot ser agafable, amb una icona d'inventari. Es col·loquen als escenaris des de l'editor, arrossegant-los. També hi tries on es posa el personatge per fer-los servir, cap on mira i si van davant o darrere seu.
- **Verbs**: els 9 clàssics per defecte (Dóna, Agafa, Fes servir, Obre, Mira, Empeny, Tanca, Parla amb, Estira). Cada aventura els pot reanomenar, reordenar, afegir-ne i canviar-ne la resposta per defecte. Un verb amb preposició pot unir dos objectes: «Fes servir la clau *amb* la porta», «Dóna el rom *al* pirata».
- **Personatges**: nom, descripció, color de les frases i un full de sprites tallat en fotogrames iguals. Les animacions són quiet, camina i parla, cadascuna de costat, de cara i d'esquena. A l'editor es tria una animació, es clica els fotogrames del full en ordre i es veu a l'instant. Si una animació falta, se'n fa servir una de semblant; sense full, surt la figura provisional amb una camisa del color de les frases. Un dels personatges és el **protagonista**. La resta es col·loquen als escenaris com els objectes, i s'hi tria cap on miren i on es posa el protagonista per parlar-hi. Tots s'escalen igual segons la profunditat, prenent com a referència l'alçada del fotograma del protagonista.
- **Diàlegs**: converses en forma de graf. Cada node té frases (cadascuna amb qui la diu) i les opcions que pot triar el jugador. Una opció pot tenir condicions (només surt si…), ser d'un sol ús, fer accions (les mateixes que les regles) i portar a un altre node, tornar al mateix o acabar la conversa. «Parla amb» un personatge comença el seu diàleg si cap regla no diu una altra cosa. Al joc, les opcions ocupen el lloc dels verbs, i el protagonista diu la que tries.
- **Puzles i comprovació**: diu si l'aventura es pot acabar i dibuixa el **mapa de puzles**. És un graf amb tot el que el jugador pot fer, ordenat per quan es pot fer, i amb fletxes del que cal cap al que s'aprofita; el camí més curt fins al final surt ressaltat. També avisa de:
  - si no hi ha final, o no s'hi pot arribar (i per què);
  - escenaris on no es pot arribar, regles i opcions de diàleg que no es poden fer mai, nodes on no s'arriba, diàlegs que no comencen mai;
  - objectes que es necessiten i no es poden aconseguir;
  - variables que no canvien o que no mira ningú;
  - referències trencades;
  - **atzucacs**: escenaris d'on ja no es pot tornar on s'acaba el joc.

  La comprovació és optimista, perquè no té en compte el que es perd pel camí. Si diu que una cosa no es pot fer, és segur; si diu que es pot acabar, és molt probable.
- **Sons, seqüències i presentació**: biblioteca de sons (MP3, OGG, WAV). Cada escenari té música, transició d'entrada (fos a negre, tall sec o cercle que es tanca) i una seqüència en entrar (opcionalment només la primera vegada). Les **seqüències** són llistes d'accions sense control del jugador; a més de les de les regles, poden fer caminar personatges, fer sonar sons, canviar la música i començar altres seqüències. Al joc, Esc salta la seqüència (els efectes es fan igualment). La **presentació** té la pantalla de títol (imatge, subtítol, música), la seqüència d'inici, els crèdits del final i el cursor (creu clàssica o del sistema).
- **Partides, exportar i importar**: al joc, el botó «Partides» desa i carrega fins a 5 partides, guardades al navegador de qui juga. Si n'hi ha, el títol ofereix «Carrega una partida». «Exporta el joc» baixa un zip amb el joc a punt: s'obre l'`index.html`, o es puja la carpeta a qualsevol web. El reproductor hi va empaquetat en un sol script, sense mòduls, perquè funcioni també des del disc. El mateix zip porta `adventure.json`, i amb «Importa…» torna a l'editor com una aventura nova; serveix també de còpia de seguretat.
- **Variables i regles**: les variables recorden coses de la partida (sí/no, números o text). Una regla té la forma «quan el jugador fa [verb] [cosa] (amb [cosa]), si [condicions], llavors [accions]».
  - Condicions: tenir o no tenir un objecte, l'estat d'un objecte, el valor d'una variable, haver triat (o no) una opció d'un diàleg.
  - La cosa pot ser un objecte, un punt calent o un personatge («Dóna el rom al pirata»).
  - Accions: dir una frase (el protagonista o un altre personatge, amb el seu color), rebre o perdre un objecte, canviar un estat, canviar una variable, anar a un escenari, esperar, començar un diàleg, acabar el joc.
  - Guanya la primera regla de la llista que compleixi les condicions. Si no n'hi ha cap, el verb fa el que fa per defecte: «Mira» diu la descripció, «Agafa» agafa els objectes que es poden agafar, i la resta diu la seva resposta.
  - Les regles que apunten a coses esborrades es conserven, marcades com a trencades.
- **Reproductor**: es pot jugar l'aventura des de l'escenari inicial, o provar un escenari concret des de l'editor (▶ Prova). El personatge provisional camina on cliques, sense sortir de la zona caminable, i s'encongeix com més lluny és. Passa per les sortides cap als altres escenaris. Té la barra de verbs i la frase d'acció («Mira Barril»). «Mira» diu la descripció de la cosa, i la resta de verbs, la seva resposta per defecte. El clic dret mira directament. Els objectes queden davant o darrere del personatge segons la profunditat. L'inventari és a la dreta dels verbs. Amb «Fes servir» o «Dóna», clicar un objecte de l'inventari deixa la frase a mitges («Fes servir Clau amb…») fins que cliques la segona cosa. Mentre una regla executa les seves accions, un clic salta la frase que s'està dient. El protagonista camina de costat, de cara o d'esquena segons cap on va, i parla amb l'animació de parlar. Els personatges es giren cap a ell quan s'hi interactua. Un doble clic en una sortida hi passa de seguida, sense esperar que el protagonista hi arribi. Les tecles 1-9 trien els verbs. Amb «Mostra zones» (tecla D) es veuen les zones i el camí. Amb **«Proves»** (tecla T) s'obre un panell per saltar a qualsevol escenari i canviar en directe l'inventari, els estats dels objectes, les variables i les opcions de diàleg ja dites. La situació d'aquell moment es pot desar com a **punt de partida de proves**, i llavors el joc (i «Reinicia») comença així. Es desa al navegador.

```bash
npm start
```

## Joc d'exemple: «La rosa de Sant Jordi»

**Juga-hi en línia:** https://realbluehead.github.io/aventura-editor/joc/ — o obre-la a l'[editor en línia](https://realbluehead.github.io/aventura-editor/), on ja hi és carregada.

Una aventura per Barcelona amb 10 escenaris (Plaça de Catalunya, la Rambla, la Boqueria, el Barri Gòtic, el Port Vell, la Barceloneta, el Passeig de Gràcia, la Sagrada Família, Montjuïc i el Park Güell), 10 personatges, 9 objectes, diàlegs, seqüències i música. En Jordi ha d'aconseguir una rosa i un llibre per a la Laia, amb una cadena d'intercanvis per tota la ciutat.

Tot (fons, sprites, objectes, música i sons) es genera amb codi a `tools/barcelona/`, sense fitxers de fora. Per crear-lo i importar-lo a l'editor (amb el servidor engegat):

```bash
node tools/barcelona/build.mjs --import http://localhost:8821
```

Sense `--import` només escriu el zip (`tools/barcelona/la-rosa-de-sant-jordi.zip`), que es pot importar amb «Importa…». Ja n'hi ha un de fet a [`docs/exemples/la-rosa-de-sant-jordi.zip`](docs/exemples/la-rosa-de-sant-jordi.zip).

I obre http://localhost:8821. No té dependències, només Node.

Tests: `npm test`.

## Versió web

La mateixa aplicació funciona sense servidor: un service worker fa de servidor dins del navegador, amb el mateix codi de l'API (`public/js/backend/core.js`), i guarda les dades a IndexedDB. Per construir-la a `docs/` (la carpeta que publica GitHub Pages):

```bash
npm run build:web
```

## Estructura

- API del servidor local (127.0.0.1):
  - `GET/POST /api/adventures`, `GET/PUT/DELETE /api/adventures/:id`
  - `GET/POST /api/adventures/:id/scenes`, `GET/PUT/DELETE /api/adventures/:id/scenes/:sceneId`. El `PUT` sempre porta `name` i `description`. `walkable`, `hotspots` i `mapPosition` només es canvien si s'envien.
  - `PUT/DELETE /api/adventures/:id/scenes/:sceneId/background`. El cos del `PUT` és la imatge, amb el seu `content-type`.
  - `GET/POST /api/adventures/:id/objects`, `GET/PUT/DELETE /api/adventures/:id/objects/:objectId`, i el mateix per a `characters` (el full de sprites va dins del JSON, com les imatges dels objectes). Les imatges dels estats i la icona s'envien dins del JSON: el nom d'un fitxer que l'objecte ja tenia, una imatge nova com a data URL, o `null`. Les que deixen de fer-se servir s'esborren.
  - El `PUT` d'una aventura també accepta `verbs`, `variables`, `rules`, `dialogues` i `playerId`. Les regles només es validen per la forma, no per si existeixen les coses a què apunten.
  - `GET /api/adventures/:id/export`: el zip del joc. `POST /api/import` (cos: el zip) crea una aventura nova.
  - `GET /files/:id/:fitxer`: imatges (fons i objectes).
- `public/js/backend/`: l'API, compartida pel servidor i la versió web.
  - `core.js`: la validació i totes les rutes de l'API. No sap on es guarden les dades: li passen un «store».
  - `game-files.js`: els fitxers del joc exportat.
  - `sw.js`, `idb-store.js` i `zip.js`: el service worker de la versió web, el «store» d'IndexedDB i els zips al navegador.
- `server.mjs`: a més de l'API, guarda les aventures en carpetes i serveix la interfície.
- `export.mjs`: empaqueta el reproductor (i el service worker) en un sol script i escriu i llegeix zips (amb el zlib de Node).
- `tools/web/build.mjs`: construeix la versió web a `docs/`, amb l'aventura d'exemple i el joc exportat a `docs/joc/`.
- `public/`: la UI, amb mòduls JS i sense compilació. L'editor té l'aspecte d'una aplicació de Windows 95, amb un menú lateral per a les seccions de cada aventura.
  - `css/app.css`: els estils de l'editor (el tema de Windows 95).
  - `css/player.css`: els estils del joc, independents de l'editor. És l'únic full d'estils que porta el joc exportat.
  - `js/sidebar.js`: el menú lateral de l'aventura.
  - `js/main.js`: rutes (`#/`, `#/aventura/:id`, `#/aventura/:id/mapa`, `#/aventura/:id/objectes`, `#/aventura/:id/regles[/:id]`, `#/aventura/:id/personatges[/:id]`, `#/aventura/:id/dialegs[/:id]`, `#/aventura/:id/puzles`, `#/aventura/:id/verbs`, `#/aventura/:id/escenari/:id`, `#/aventura/:id/juga[/:id]`).
  - `js/defaults.js`: els verbs per defecte i els tipus de condicions, accions i variables, compartits amb el servidor.
  - `js/rule-dialog.js` i `js/rules-text.js`: l'editor de regles i les frases que les expliquen.
  - `js/logic-fields.js`: els editors de condicions i d'accions, compartits per les regles i les opcions dels diàlegs.
  - `js/analysis.js`: l'anàlisi de l'aventura (què es pot arribar a fer, si es pot acabar, mapa de puzles i avisos). No fa servir el DOM.
  - `js/object-dialog.js`: la finestra per crear i editar objectes, que es fa servir des de la biblioteca i des de l'editor d'escenaris.
  - `js/views/`: una vista per pàgina. `scene-editor.js` és l'editor visual.
  - `js/geometry.js`: geometria de polígons, compartida per l'editor i el reproductor.
  - `js/player/`: el reproductor, que no depèn de l'editor perquè més endavant es pugui exportar sol.
    - `player.js`: el motor, amb el bucle, el dibuix, els clics, les sortides i les transicions.
    - `navmesh.js`: els camins dins la zona caminable. Fa servir un graf de visibilitat entre vèrtexs i A*.
    - `actor.js`: el personatge provisional i la seva mida segons la profunditat.
    - `objects.js`: la imatge de cada objecte segons l'estat, el rectangle que ocupa i si un clic toca un píxel opac.
    - `characters.js`: fotogrames, animacions (amb les de reserva), dibuix i clics sobre els personatges.
    - `saves.js`: les ranures de partides desades.
    - `rules.js`: l'estat de la partida (i com es desa i es recupera) (inventari, on és cada objecte, estats, variables i opcions de diàleg ja dites), el motor de regles i les opcions disponibles de cada node. No fa servir el DOM.
- `tools/barcelona/`: el generador del joc d'exemple. `pixels.mjs` és un llenç de píxels amb codificador PNG i una lletra de 3×5; `scenes.mjs`, els 10 fons; `sprites.mjs`, els fulls de sprites i els objectes; `audio.mjs`, la música i els sons en WAV; `build.mjs` ho ajunta tot en un zip importable.
- `data/adventures/<id>/adventure.json` i `data/adventures/<id>/images/`: les dades de cada aventura. Es creen soles.
- `tests/`: tests de geometria, de camins, del motor de regles, dels personatges, de l'anàlisi, de l'API, de l'exportació i del joc d'exemple, que s'ha de poder acabar (`node:test`).

## Format de les dades

Les coordenades són píxels de la imatge de fons original. Un punt és `[x, y]` i un polígon és una llista de punts.

```jsonc
{
  "formatVersion": 8,   // 8: sounds, cutscenes, introCutsceneId, titleScreen, credits, cursor; escenaris: music, transition, onEnter
  "id": "…", "title": "…", "description": "…",
  "startSceneId": "…",            // null: el primer escenari
  "verbs": [{ "id": "use", "name": "Fes servir", "response": "…", "preposition": "amb" }, …],
  "playerId": "…",                // el personatge protagonista, o null (figura provisional)
  "characters": [{
    "id": "…", "name": "…", "description": "…", "color": "#ffffff",
    "sheet": "fitxer.png",        // full de sprites, o null
    "frameWidth": 16, "frameHeight": 32,
    "animations": { "walk-side": { "frames": [1, 2, 3, 2], "fps": 8 }, … }   // idle|walk|talk - side|down|up
  }],
  "dialogues": [{
    "id": "…", "name": "…",
    "characterId": "…",           // de qui és (el comença «Parla amb»), o null
    "start": "…",                 // node inicial
    "nodes": [{
      "id": "…", "position": [x, y],
      "lines": [{ "by": "…", "text": "…" }],   // by null: el protagonista
      "options": [{
        "id": "…", "text": "…", "once": false,
        "conditions": […], "actions": […],  // com a les regles
        "next": "…"               // node següent; el mateix node torna a mostrar les opcions; null acaba
      }]
    }]
  }],
  "variables": [{ "id": "…", "name": "monedes", "type": "number", "initial": 0 }],   // type: bool | number | text
  "rules": [{
    "id": "…",
    "verb": "use",
    "target": { "kind": "object", "id": "…" },  // kind: object | hotspot | character
    "with": { "kind": "object", "id": "…" },    // o null
    "conditions": [                              // totes s'han de complir
      { "type": "has", "objectId": "…", "not": false },
      { "type": "state", "objectId": "…", "stateId": "…", "not": false },
      { "type": "var", "varId": "…", "op": ">=", "value": 2 },   // op: == != < > <= >=
      { "type": "said", "dialogueId": "…", "optionId": "…", "not": false }
    ],
    "actions": [                                 // en ordre
      { "type": "say", "text": "…", "by": null },   // by: id d'un personatge, o null (el protagonista)
      { "type": "take", "objectId": "…" },       // a l'inventari
      { "type": "lose", "objectId": "…" },       // desapareix
      { "type": "setState", "objectId": "…", "stateId": "…" },
      { "type": "setVar", "varId": "…", "op": "set", "value": 1 },   // op: set | add
      { "type": "goto", "sceneId": "…", "arrival": [x, y] },
      { "type": "wait", "seconds": 1 },
      { "type": "dialogue", "dialogueId": "…" },
      { "type": "end", "text": "…" }
    ]
  }],
  "objects": [{
    "id": "…", "name": "…", "description": "…",
    "pickable": false,
    "states": [{ "id": "…", "name": "Tancada", "image": "fitxer.png" }],  // image pot ser null
    "initialState": "…",
    "icon": null                  // icona d'inventari (només si es pot agafar)
  }],
  "scenes": [{
    "id": "…", "name": "…", "description": "…",
    "background": "fitxer.png",   // o null
    "walkable": [[[x, y], …]],    // zones caminables
    "hotspots": [{
      "id": "…", "name": "…", "description": "…",
      "polygon": [[x, y], …],
      "exit": null                // o { "sceneId": "…", "arrival": [x, y] }
    }],
    "objects": [{                 // objectes col·locats aquí (cada objecte, en un sol escenari)
      "objectId": "…",
      "position": [x, y],         // baix al mig de la imatge, com els peus del personatge
      "walkTo": [x, y],           // on es posa el personatge per fer-lo servir, o null (el punt caminable més proper)
      "facing": "auto",           // auto | left | right
      "layer": "auto"             // auto (segons la profunditat) | back | front
    }],
    "characters": [{              // personatges col·locats aquí
      "characterId": "…", "position": [x, y], "walkTo": null,
      "facing": "down"            // down | left | right | up
    }],
    "mapPosition": [x, y],        // posició al mapa, o null
    "actorHeight": { "near": 60, "far": 40 } // alçada del personatge a baix i a dalt de la zona caminable, o null (automàtica)
  }]
}
```

Quan el format canvia, `FORMAT_VERSION` puja i el servidor porta sol les aventures antigues al format nou. El format 1, amb un sol `data/adventures.json`, es migra en arrencar.
