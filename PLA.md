# Pla de desenvolupament de l'editor d'aventures gràfiques

Objectiu: una eina web per crear aventures gràfiques de point & click a l'estil de Monkey Island o Maniac Mansion, i un **reproductor** per jugar-les al navegador.

Anem per fases curtes. Al final de cada fase hi ha alguna cosa que es pot fer servir i provar.

## On som

- ✅ **Aventures**: títol i descripció.
- ✅ **Escenaris**: nom, imatge de fons i descripció.
- ✅ **Fase 1**: editor visual d'escenaris i mapa de l'aventura.
- ✅ **Fase 2**: primer reproductor.
- ✅ **Fase 3**: objectes i verbs.
- ✅ **Fase 4**: variables, regles i inventari.
- ✅ **Fase 5**: personatges.
- ✅ **Fase 6**: diàlegs.
- ✅ **Fase 7**: mapa de puzles, comprovació i mode de proves.
- ✅ **Fase 8**: seqüències, so, transicions i pantalles de títol i final.
- ✅ **Fase 9**: partides desades, exportar el joc i importar aventures.
- ✅ **Millores**: editor amb menú lateral i aspecte de Windows 95, sortides amb condicions, doble clic a les sortides, tecles 1-9 per als verbs, i el joc d'exemple de Barcelona.

## Idea general

Una aventura gràfica té dues parts:

1. **El món**: escenaris, objectes, personatges i inventari. És el que *hi ha*.
2. **La lògica**: què passa quan el jugador fa una acció. «Mira el cartell», «Fes servir la clau amb la porta», «Parla amb el pirata». És el que *passa*.

Els puzzles no són una peça a part. Surten de la lògica: «la porta només s'obre si tens la clau, i la clau te la dona el pirata si li dones el rom». Per això l'editor no «crea puzzles» directament. Et deixa definir regles i després te les mostra com un **mapa de puzzles** (el *puzzle dependency chart* de Ron Gilbert), per veure que l'aventura es pot acabar.

La lògica és **declarativa**: regles fetes amb formularis, no codi. Tenen la forma *quan passa X, si es compleix Y, fes Z*. Així es poden editar sense programar, i l'editor les pot analitzar per trobar errors.

## Model de dades (on volem arribar)

```
Aventura
├── configuració: resolució, verbs, escenari inicial, personatge inicial
├── variables (flags): "porta_oberta" = false, "monedes" = 0 …
├── Escenaris
│   ├── fons, música, capa de primer pla (el que tapa els personatges)
│   ├── zona caminable (polígon) + escala per profunditat
│   ├── punts calents (hotspots): zones clicables del fons
│   ├── sortides: hotspot → un altre escenari + punt d'arribada
│   ├── objectes col·locats (amb posició)
│   └── personatges presents (amb posició)
├── Objectes: nom, sprite(s) per estat, es pot agafar?, icona d'inventari,
│             punt on es posa el personatge per fer-lo servir, cap on mira
├── Personatges: nom, color del text, animacions (quiet, caminar ×4 direccions, parlar)
├── Interaccions (regles): verb + objecte [+ objecte 2] → condicions → accions
├── Diàlegs: arbres d'opcions amb condicions i conseqüències
└── Seqüències (cutscenes): llistes d'accions que s'executen en ordre
```

**Accions** que podran fer les regles, els diàlegs i les seqüències: dir una frase, caminar fins a un punt, agafar o donar un objecte, treure'l de l'inventari, canviar l'estat d'un objecte (obert/tancat), canviar una variable, anar a un altre escenari, començar un diàleg, fer una animació, moure un personatge, esperar, fer sonar un so, acabar el joc.

**Condicions**: tenir un objecte, valor d'una variable, estat d'un objecte, si ja s'ha vist una opció de diàleg, quin personatge controles.

## Fases

### Fase 1 — Editor visual d'escenaris ✅
Deixem de veure l'escenari només com una targeta i passem a editar-lo sobre la imatge.

- Pàgina d'edició de l'escenari amb el fons a mida real, zoom i desplaçament.
- Dibuixar polígons: la **zona caminable** i els **punts calents**. Cada punt calent té nom i descripció.
- **Sortides**: un punt calent que porta a un altre escenari i a un punt d'arribada.
- Desfer/refer.
- Canvis interns: cada aventura passa a tenir la seva pròpia carpeta (`data/adventures/<id>/`), amb una versió de format per poder migrar dades. El codi de la UI es divideix en mòduls JS, sense eines de compilació.

**Fet quan:** puc dibuixar on es pot caminar i connectar escenaris entre ells. A més, veig un **mapa de l'aventura** amb els escenaris i les sortides com a fletxes.

### Fase 2 — Primer reproductor ✅
Fem el joc jugable de seguida, encara que sigui pobre, perquè cada fase següent es pugui provar jugant.

- Pàgina «Juga» que llegeix l'aventura i la dibuixa en un canvas a la resolució de l'aventura.
- Un personatge provisional (un rectangle o un sprite d'exemple) camina on cliques. Busca el camí dins la zona caminable (A* sobre el polígon) i s'escala segons la profunditat.
- En passar el ratolí per sobre d'un punt calent se'n mostra el nom. Si cliques una sortida, canvies d'escenari.
- Botó «Prova aquest escenari» des de l'editor.

**Fet quan:** puc passejar per tots els escenaris de l'aventura.

### Fase 3 — Objectes i verbs ✅
- Biblioteca d'**objectes** de l'aventura: nom, descripció, un sprite per a cada estat (porta oberta/tancada), si es pot agafar, i la icona d'inventari.
- Col·locar objectes a l'escenari arrossegant-los. Cal indicar on es posa el personatge i cap on mira, i fer-hi l'ordre de capes (què queda davant de què).
- **Verbs** configurables per aventura. Per defecte, els 9 clàssics: Dóna, Obre, Tanca, Agafa, Mira, Parla amb, Fes servir, Empeny, Estira.
- Al reproductor: barra de verbs, frase d'acció («Agafa la clau»), «Mira» mostra la descripció i hi ha una resposta per defecte per a cada verb («No crec que pugui fer això»).

**Fet quan:** puc mirar i intentar fer coses amb tots els objectes de l'escenari.

### Fase 4 — Inventari i interaccions (guions) ✅
És el cor de l'eina.

- **Variables** de l'aventura: booleanes, números o text, amb valor inicial.
- **Editor de regles**: tries verb i objecte (o «Fes servir X amb Y» / «Dóna X a Y»), afegeixes condicions i una llista d'accions. Tot amb formularis i desplegables, amb una frase llegible a dalt («Quan *fas servir* la *clau* amb la *porta*, si *porta_oberta* és fals → …»).
- Inventari al reproductor: agafar objectes, combinar-los i fer-los servir sobre l'escenari.
- Motor de regles compartit entre l'editor i el reproductor, amb tests (`node:test`).

**Fet quan:** puc fer un puzzle senzill: agafar una clau, obrir una porta i passar a l'escenari següent.

### Fase 5 — Personatges ✅
- **Personatges** amb animacions fetes a partir de fulls de sprites (sprite sheets): quiet, caminar en 4 direccions i parlar. Editor per tallar els fotogrames i provar l'animació.
- Triar el personatge jugador. Opcionalment n'hi pot haver diversos i es pot canviar d'un a l'altre, com a Maniac Mansion.
- Col·locar personatges no jugadors a escenaris, i que es puguin moure segons variables.
- Les frases es mostren damunt del personatge amb el seu color.

**Fet quan:** el protagonista és un personatge animat i hi ha altres personatges a qui pots mirar i donar coses.

### Fase 6 — Diàlegs ✅
- **Editor de diàlegs** en forma de graf: nodes amb el que diu cada personatge i les opcions del jugador.
- Cada opció pot tenir condicions (només surt si…), es pot amagar un cop dita, i pot executar accions (donar un objecte, canviar una variable…).
- «Parla amb» un personatge comença el seu diàleg.

**Fet quan:** puc mantenir una conversa ramificada que desbloqueja part d'un puzzle.

### Fase 7 — Mapa de puzzles i validació ✅
- **Mapa de puzzles** generat automàticament a partir de les regles i els diàlegs: què necessita cada pas i què desbloqueja.
- **Validador** que avisa de problemes: escenaris on no es pot arribar, objectes que no es poden aconseguir mai, variables que no es canvien enlloc, regles que no es poden complir, possibles bloquejos.
- Mode de prova del reproductor: començar a qualsevol escenari amb l'inventari i les variables que vulguis, i un panell de depuració per veure i canviar l'estat.

**Fet quan:** l'editor em diu si l'aventura es pot acabar.

### Fase 8 — Seqüències, so i acabats ✅
- **Seqüències** (cutscenes): llistes d'accions amb esperes que s'executen sense que el jugador pugui fer res. S'activen en entrar a un escenari, des de regles o en començar el joc.
- Música per escenari i efectes de so.
- Transicions entre escenaris (fos a negre…), cursor personalitzat, pantalla de títol i final.

### Fase 9 — Desar, exportar i compartir ✅
- Desar i carregar partides al reproductor.
- **Exportar** l'aventura com un joc independent: una carpeta amb HTML, JSON i imatges que es pot penjar a qualsevol web.
- Importar i exportar aventures senceres (zip) per fer còpies de seguretat.

### Després de la fase 9 ✅
- Editor més compacte: menú lateral i aspecte de Windows 95.
- Sortides amb condicions i frase quan no s'hi pot passar (format 9). L'anàlisi de puzles les té en compte.
- Al joc: doble clic a una sortida per passar-hi de seguida, i tecles 1-9 per als verbs.
- **Joc d'exemple**: «La rosa de Sant Jordi», 10 escenaris de Barcelona generats amb codi (`tools/barcelona/`). Un test comprova que es genera i que es pot acabar.
- **Versió web** a GitHub Pages: l'API és compartida (`public/js/backend/core.js`) i, sense servidor, la fa un service worker que guarda les dades a IndexedDB.

### Més endavant (idees)
- Traduccions: tots els textos en diverses llengües.
- Biblioteca d'assets compartida entre aventures.
- Generació assistida d'imatges de fons o de sprites.
- Editor col·laboratiu.

## Decisions tècniques

- **Sense dependències ni compilació** mentre sigui possible: Node per al servidor, i JavaScript amb mòduls ES al navegador. Si l'editor visual o el de diàlegs ho demanen molt, es pot valorar alguna llibreria lleugera.
- **Coordenades en píxels de la imatge** original de l'escenari, no de la pantalla. Així no depenen del zoom ni de la mida de la finestra.
- **Codi compartit** (`shared/`): model de dades, validació i motor de regles. El fan servir el servidor, l'editor i el reproductor, i així el que veus a l'editor és el que passa al joc.
- **Format versionat**: cada aventura porta `formatVersion`, i el servidor migra les antigues automàticament.
- **Referències per id**, mai per nom: si reanomenes un objecte, les regles continuen funcionant.
- **Tests** amb `node:test` per al motor de regles, el validador i l'API.

## Decisions pendents (cal triar-les abans de la fase que s'indica)

1. **Estil gràfic i resolució** (fase 1): pixel art a baixa resolució (320×200, escalat sense suavitzar) o il·lustració a alta resolució (1920×1080)?
2. ~~**Interfície de verbs** (fase 3)~~: de moment, els 9 verbs clàssics a la part de baix, i el clic dret per mirar. Com que els verbs són editables, es pot canviar més endavant.
3. **Un o diversos protagonistes**: de moment n'hi ha un (el que es marca com a protagonista). Poder canviar entre diversos, com a Maniac Mansion, es pot afegir més endavant.
4. **D'on surten els gràfics**: els dibuixaràs tu, els trauràs de packs d'assets o vols generació assistida?
