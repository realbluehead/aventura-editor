# Format d'una aventura (versió 10) i com s'escriu amb el kit

Tot es declara en un `build.mjs` amb el kit (`scripts/kit.mjs`). El kit omple els camps obligatoris
(`createdAt`, noms de fitxer, icones…), així que normalment només cal el que hi ha aquí. Si un camp no és vàlid,
`P.write()` ho diu amb el missatge del servidor de l'editor.

## Índex
1. Coordenades i mides
2. Escenaris (`P.scene`)
3. Personatges (`P.character`)
4. Objectes (`P.object`)
5. Regles (`rule`)
6. Condicions i accions
7. Diàlegs
8. Seqüències (cutscenes)
9. Variables, sons i `P.write`
10. Com raona el reproductor (coses que costen d'endevinar)

## 1. Coordenades i mides

- Tot va en **píxels del fons**. Els fons fan **320×200** (com els jocs de LucasArts de 1990). Es pot fer servir
  una altra mida, però totes les coordenades d'aquell escenari van en píxels d'aquella imatge.
- `[x, y]`: x cap a la dreta, y cap avall. Un polígon és una llista de 3 o més punts `[[x,y], ...]`.
- La **posició** d'un personatge o d'un objecte és el punt on **toca a terra** (els peus, la base), al mig.
- Mida del protagonista: `actorHeight: { near, far }` és l'alçada en píxels a la part de baix de la zona caminable
  (`near`) i a la de dalt (`far`); entremig s'interpola. Amb figures de 16×32, `{ near: 56–64, far: 40–50 }` va bé
  per a un terra que comença cap a y=150. Si no es posa, es calcula sol (un 30% de l'alçada del fons a prop).

## 2. Escenaris

```js
P.scene({
  id: "s-moll", name: "El moll", description: "…",
  background: canvas,                 // Canvas 320×200 (pixelArt(...) o dibuixat)
  walkable: [polígon, ...],           // on pot caminar el protagonista (ground(152) = tot el terra de y=152 avall)
  hotspots: [spot(...), exit(...)],   // coses que es poden mirar/tocar, i sortides
  objects: [place(objectId, [x, y], walkTo, { facing, layer })],
  characters: [npc(characterId, [x, y], facing, walkTo)],
  music: "so-id" | null,              // música en entrar (null: continua la que sonava)
  transition: "fade" | "cut" | "iris",
  onEnter: { cutsceneId: "cs-x", once: true } | null,   // seqüència en entrar (once: només la primera vegada)
  mapPosition: [x, y] | null,         // on surt a la pàgina «Mapa» de l'editor (opcional)
  actorHeight: { near: 60, far: 46 } | null,
});
```

- `spot(id, nom, descripció, polígon)`: un punt calent. **«Mira»** sobre ell diu la descripció.
- `exit(id, nom, polígon, idEscenariDestí, [x, y] d'arribada, { conditions, blocked })`: una sortida.
  Clicar-la fa caminar el protagonista fins a ella i passar a l'altre escenari, on apareix al punt d'arribada
  (que ha de ser **dins de la zona caminable del destí**). Amb `conditions`, només es passa si es compleixen;
  si no, el protagonista diu `blocked`. Doble clic hi passa de seguida.
- Les sortides als costats: `leftEdge(top)` / `rightEdge(top)` (franges de 18 px al costat, del terra avall).
  L'arribada des d'una sortida esquerra sol ser a prop del costat dret de l'altre escenari, i al revés.
- Les sortides han de tocar la zona caminable (o quedar-hi a tocar): el protagonista hi ha d'arribar caminant.
- Els ids: lletres, números, `-` i `_`, fins a 64 caràcters, únics. Convenció: `s-` escenaris, `c-` personatges,
  `o-` objectes, `ho-`/`ex-` punts calents i sortides, `d-` diàlegs, `cs-` seqüències, `v-` variables, `so-` sons.

## 3. Personatges

```js
P.character({ id: "c-mar", name: "Mar", description: "El que es diu en mirar-la", color: "#ffd23f",
  look: { skin, hair, shirt, pants, shoes, ... } });       // figura generada de 16×32 (vegeu art.md)
// o un full propi:
P.character({ id, name, description, color, sheet: canvas, frameWidth, frameHeight, animations });
```

- `color`: el color de les seves frases al joc (el protagonista sol anar en blanc).
- Animacions (si es fa un full propi): `{ "idle-side": { frames: [0], fps: 4 }, "walk-side": {…}, "talk-side": {…},
  "idle-down", "walk-down", "talk-down", "idle-up", "walk-up", "talk-up" }`. Els fotogrames es compten d'esquerra a
  dreta i de dalt a baix. «side» mira a la dreta (a l'esquerra s'emmiralla sol). Les que faltin fan servir les altres.
- El protagonista és el de `playerId` a `P.write`. Els altres es col·loquen amb `npc(...)` en **un sol** escenari.
- **«Parla amb»** un personatge comença el diàleg que té `characterId` igual al seu (si n'hi ha); si no, la resposta
  per defecte del verb. Una regla `rule("talk", chr(id), …)` té prioritat sobre el diàleg.

## 4. Objectes

```js
P.object({ id: "o-clau", name: "clau", description: "Una clau rovellada.", pickable: true,
  states: [["normal", "Normal", canvas]],            // [idEstat, nom, Canvas o null]
  initial: "normal", icon: canvasOpcional });
```

- Els estats es diuen `${idObjecte}-${idEstat}` (per exemple `o-porta-oberta`): és el que fan servir
  `inState()` i `setState()`.
- Un estat sense imatge (`null`) fa l'objecte invisible i no clicable en aquell estat: és la manera d'amagar una cosa
  fins que passi alguna cosa (`setState` la fa aparèixer).
- `pickable: true`: **«Agafa»** el treu de l'escenari i el posa a l'inventari, sense regla. La icona de l'inventari
  (24×24) es fa sola de la primera imatge.
- Un objecte no agafable és decorat interactiu (una porta, una màquina) amb estats.
- Un objecte que només s'aconsegueix per una acció (`take`) no cal que sigui a cap escenari.
- `place(id, [x, y], walkTo, { facing: "auto"|"left"|"right", layer: "auto"|"back"|"front" })`: la posició és la
  base de la imatge. `walkTo` és on es posa el protagonista per tocar-lo (dins de la zona caminable).
  `layer: "back"` el deixa sempre darrere del protagonista (per a coses penjades a la paret, per exemple).

## 5. Regles

```js
P.rules.push(rule(verb, target, withRef, conditions, actions));
```

- `verb`: `"give"` (Dóna), `"pickup"` (Agafa), `"use"` (Fes servir), `"open"` (Obre), `"look"` (Mira),
  `"push"` (Empeny), `"close"` (Tanca), `"talk"` (Parla amb), `"pull"` (Estira).
- `target` i `withRef`: `obj(id)`, `chr(id)` o `hot(id)`. `withRef` és el segon element dels verbs amb preposició:
  **«Fes servir X amb Y»** → `rule("use", obj(X), obj/chr/hot(Y), …)`; **«Dóna X a Y»** → `rule("give", obj(X), chr(Y), …)`.
  Per a la resta de verbs, `null`.
- **La primera regla que encaixa (verb, coses i condicions) és la que s'executa.** Posa les concretes (amb
  condicions) abans de les generals del mateix verb i cosa.
- Si cap regla no encaixa: «Mira» diu la descripció; «Agafa» agafa si és `pickable`; «Parla amb» obre el diàleg del
  personatge; la resta diu la resposta per defecte del verb («No es mou.», etc.).
- «Dóna» i «Fes servir … amb» funcionen amb l'objecte a l'inventari; per a «Fes servir X amb Y», X s'ha de tenir.

## 6. Condicions i accions

Condicions (totes s'han de complir):

| kit | significa |
|---|---|
| `hasItem(o, not=false)` | té (o no té) l'objecte a l'inventari |
| `inState(o, "o-estat", not=false)` | l'objecte és (o no és) en aquest estat |
| `isVar(v, valor, op="==")` | variable comparada amb `==`, `!=`, `<`, `>`, `<=`, `>=` |
| `said(dialeg, opcio, not=false)` | ha triat (o no) aquesta opció d'aquest diàleg |

Accions (es fan en ordre; les frases esperen que es llegeixin):

| kit | fa |
|---|---|
| `say(text, by=null)` | diu una frase; `by` = id del personatge, `null` el protagonista |
| `take(o)` / `lose(o)` | posa / treu un objecte de l'inventari (`take` també el treu de l'escenari) |
| `setState(o, "o-estat")` | canvia l'estat d'un objecte |
| `setVar(v, valor, op="set"\|"add")` | canvia una variable |
| `goto(s, [x,y])` | porta el protagonista a un altre escenari |
| `walk([x,y], by=null)` | fa caminar algú (a l'escenari actual) |
| `wait(segons)` | espera |
| `talkTo(d)` | comença un diàleg |
| `sound(so)` / `music(so\|null)` | toca un so / canvia (o atura) la música |
| `cutscene(cs)` | fa una seqüència |
| `end(text)` | **acaba el joc** amb aquest text (i els crèdits). Cal almenys un camí que hi arribi. |

## 7. Diàlegs

```js
P.dialogues.push(dialogue("d-pesc", "El pescador", "c-pesc", [
  node("pe-1", [["c-pesc", "Frase del personatge"], [null, "Frase del protagonista"]], [
    opt("Text de l'opció", "pe-2"),                     // porta al node pe-2
    opt("Adéu."),                                       // next = null: acaba la conversa
  ]),
  node("pe-2", [...], [opt("Gràcies!", null, { once: true, actions: [take("o-x")], conditions: [hasItem("o-y")] })]),
]));
```

- El primer node és el d'inici. Cada node: frases que es diuen en ordre i opcions del jugador.
- `once: true`: l'opció desapareix un cop triada. `conditions`: només surt si es compleixen. `actions`: el que passa
  en triar-la (abans d'anar al node següent).
- Deixa sempre una opció per sortir. Amb opcions que tornen al node principal es fa el menú clàssic de preguntes.
- `said("d-pesc", "op-id")` necessita l'id de l'opció: posa-l'hi tu amb `opt(text, next, { id: "op-preu" })`.

## 8. Seqüències

```js
P.cutscenes.push({ id: "cs-final", name: "Final", actions: [say(...), walk(...), wait(1), end("Fi.")] });
```

Mentre dura una seqüència el jugador no pot fer res (un clic salta la frase; Esc la salta sencera).
`introCutsceneId` (a `P.write`) és la del principi; `onEnter` d'un escenari en fa una en entrar-hi.

## 9. Variables, sons i escriure

- `P.variable("v-x", "nom_visible", "bool"|"number"|"text", valorInicial)`.
- `P.sound("so-id", "Nom", wavBuffer)`: `song(bpm, veus, repeticions)` fa música de 8 bits (vegeu art.md) i
  `SFX.coin()`, `SFX.click()`, `SFX.water()`, `SFX.horn()`, `SFX.success()` són efectes fets.
- `await P.write("joc.zip", { startSceneId, playerId, introCutsceneId, titleScreen: { image: canvas, subtitle, music }, credits })`
  escriu el zip, el valida i diu si es pot acabar. Els crèdits de les imatges de Commons (`P.attribute`) s'hi
  afegeixen sols. Màxim 3000 caràcters de crèdits.

## 10. Com raona el reproductor

- L'anàlisi («es pot acabar?») suposa que el jugador pot anar a tots els escenaris on porten sortides que es poden
  obrir, agafar el que és `pickable`, triar opcions de diàleg i fer qualsevol regla les condicions de la qual es
  poden complir. Si diu que no es pot acabar, llegeix el primer error: diu quin pas falla i per què.
- Un objecte que es dona o es fa servir s'ha de **treure** (`lose`) si ja no ha de servir; si no, queda a l'inventari.
- Un objecte agafat amb «Agafa» desapareix de l'escenari sol; un de `take()` també (si hi era).
- Els verbs tenen dreceres de teclat (D, A, F, O, M, E, T, P, S) i 1–9 per posició; no cal fer-hi res.
