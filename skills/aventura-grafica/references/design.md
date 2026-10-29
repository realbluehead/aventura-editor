# Dissenyar l'aventura

## De la idea (o el llibre) al joc

1. **L'objectiu**: una frase. «La Mar ha d'encendre el far abans de la tempesta». El final és quan s'aconsegueix.
2. **El protagonista** i per què li importa. **3–8 personatges** més, cadascun amb una cosa que vol o que sap.
3. **Els llocs**: 5–10 escenaris (menys per a una història curta). Cada un ha de tenir alguna cosa a fer.
4. **El camí de puzles**, pensat **al revés**: què cal per a l'objectiu? I per aconseguir allò? Cada resposta és
   un puzle. Para quan arribis a coses que es troben directament.
5. **Bromes i detalls**: respostes a «Mira», «Agafa», «Parla amb»… sobre coses que no són del camí. Són el que
   fa que el món sembli viu (i el que recorda la gent de Monkey Island).

## Tipus de puzles que funcionen

- **Intercanvi**: algú vol una cosa i a canvi en dona una altra (`give` → `lose` + `take`). La cadena clàssica.
- **Ús d'un objecte**: X amb Y (clau amb porta, corda amb pou). Ha de ser lògic dins del món.
- **Combinar objectes de l'inventari**: `use` X amb Y, tots dos a l'inventari → `lose` X i Y, `take` Z.
- **Informació**: un diàleg explica com fer una cosa; la condició `said(...)` desbloqueja una opció o regla.
- **Canvi d'estat del món**: empènyer un botó apaga la font i deixa veure el que hi havia al fons (`setState`).
- **Lloc tancat**: una sortida amb `conditions` («Necessito un bitllet») obre una part nova del mapa.
- **Distracció**: donar una cosa a un personatge perquè deixi de vigilar (`setVar` + condicions).

## Regles d'or (de les aventures de LucasArts)

- **No es pot morir ni quedar-se encallat.** Cap acció no ha de fer impossible acabar. No llencis un objecte que
  encara fa falta; si una cosa es gasta, que es pugui tornar a aconseguir.
- **Cada puzle té pistes**: algú en parla, la descripció ho insinua, o la resposta en fallar orienta («Si tingués
  alguna cosa per tallar-ho…»). Les respostes de «Mira» són el millor lloc per a pistes.
- **Lògica del món, no de l'autor**: el jugador ha de poder endevinar la solució abans de provar-la.
- **Més d'un fil obert alhora** a partir de la meitat: si el jugador s'encalla en un puzle, que en pugui fer un altre.
  (A «La rosa de Sant Jordi», la rosa i el llibre són dues cadenes independents.)
- **Dosifica el mapa**: al principi pocs llocs; se n'obren més a mesura que s'avança (sortides amb condicions).
- **Recompensa**: un so (`SFX.success()`), una frase satisfeta, una petita seqüència quan es resol un puzle gran.

## Que el món reaccioni (no fer-la lineal)

Una aventura sembla lineal i falsa quan tots els temes de conversa i totes les portes hi són des del principi: el
jugador pot preguntar a un personatge per una cosa que encara no sap que ha passat. Per evitar-ho:

- **El protagonista només pregunta el que sap.** Fes una variable per a cada cosa que algú li explica
  (`v-sap-robatori`, `v-sap-peeves`…) i posa-la com a condició dels temes que en depenen. Un tema desapareix quan
  ja està resolt (`no("v-ron-ok")`, `hasItem(x, true)`).
- **Les salutacions canvien.** Cada personatge diu una cosa diferent segons el moment: abans de saber res, quan
  ja hi ha un encàrrec, quan està resolt.
- **Les accions necessiten un motiu.** «Per què hauria de fer pessigolles a un quadre?» fins que algú en parla; el
  mateix per agafar coses que encara no serveixen de res.
- **El mapa s'obre amb la història.** Cada sortida que porta a una part nova té `conditions` amb el que hi dona
  motiu per anar-hi, i un `blocked` que diu per què no («Ara no tinc res a fer a les masmorres»). Al principi només
  hi ha oberts els llocs de l'objectiu inicial.
- **Compte amb els encallaments**: tot el que obre un tema o una sortida s'ha de poder aconseguir abans del punt on
  cal. Si una cosa la pot explicar més d'un personatge, que totes les vies posin la mateixa variable (fes una llista
  d'accions compartida). `P.write` ho comprova: si diu que no es pot acabar, és que una condició no s'arriba a complir.

`format.md` (secció 10) explica com s'escriu.

## Mida

| durada | escenaris | personatges | objectes de l'inventari | passos imprescindibles |
|---|---|---|---|---|
| curta (10–15 min) | 3–5 | 2–4 | 3–5 | 6–12 |
| mitjana (30–45 min) | 6–10 | 5–9 | 6–10 | 15–30 |
| llarga | 10–20 | 8–15 | 10–20 | 30+ |

Si no et diuen res, fes-la **mitjana** (com «La rosa de Sant Jordi»: 10 escenaris, 18 passos).
`P.write` diu quants passos imprescindibles té el camí.

## Adaptar un llibre

- Agafa **l'arc principal** (un objectiu clar i el final) i 5–10 llocs memorables. No cal seguir tots els capítols.
- Converteix els moments clau en puzles: el que al llibre passa sol, al joc ho ha de fer el jugador.
- Els personatges del llibre parlen com al llibre, però **amb frases curtes** (un globus de text són 1–2 línies).
- Drets d'autor: un llibre en **domini públic** (autors morts fa més de 70 anys en general) es pot adaptar lliurement.
  Si no ho és, l'adaptació és per a ús personal: no copiïs paràgrafs sencers, resumeix amb paraules teves, i
  avisa'n l'usuari si la vol publicar.

## Escriure el text

- Escriu en l'idioma de qui ho demana (per defecte, el de la conversa). Tots els noms, descripcions, frases i
  opcions en aquest idioma.
- Els noms de punts calents i objectes van **en minúscula i amb article implícit** («barca», «clau rovellada»): surten
  a la frase d'acció («Mira barca», «Fes servir clau amb porta»).
- Descripcions curtes i amb personalitat: el protagonista hi diu el que pensa, no un inventari.
- Cada personatge té una veu (vocabulari, manies). L'humor amable funciona sempre.

## Document de disseny (diseny.md)

Abans d'escriure el build, deixa a la carpeta un `diseny.md` curt: objectiu, personatges, escenaris (amb què hi ha
a cada un i d'on ve la imatge), la cadena de puzles com a llista o arbre, i el final. Serveix per pensar-ho i per
explicar-ho a l'usuari en acabar.
