---
name: aventura-grafica
description: Crea una aventura gràfica sencera, a l'estil Monkey Island, per a l'editor aventura-editor (realbluehead/aventura-editor) a partir d'una idea, un conte, un llibre o un lloc, i la deixa en un zip que l'editor importa i es pot jugar. Escriu la història, els puzles, els diàlegs i les bromes, fa els fons pixelant imatges lliures de Wikimedia Commons (o dibuixant-los), genera els personatges, els objectes i la música de 8 bits, i comprova que el joc es pugui acabar. Fes-lo servir sempre que algú vulgui fer, generar, inventar o adaptar una aventura gràfica, un point-and-click, un joc d'aventures o un joc per a l'editor d'aventures, encara que només digui «fes-me una aventura sobre…», «converteix aquest llibre en un joc», «make a graphic adventure about…» o «crea un joc com el de Sant Jordi».
---

# Crear una aventura gràfica

L'objectiu és un **joc acabat i jugable** que l'usuari importa a l'editor (local o
https://realbluehead.github.io/aventura-editor/) i hi juga de seguida, amb la història, els puzles, l'art i el so
fets per tu. L'usuari només dona la idea: decideix tu la resta amb bon criteri, sense fer-li preguntes, i explica
al final què has decidit.

## On és tot

El skill viu dins del repositori de l'editor: `aventura-editor/skills/aventura-grafica/`. Si l'has carregat des
d'un altre lloc (un enllaç a `~/.claude/skills`), el repositori és la carpeta que conté `skills/`. Les ordres
d'aquí suposen que ets a l'arrel del repositori i que `S=skills/aventura-grafica/scripts`.

| fitxer | per a què |
|---|---|
| `scripts/kit.mjs` | la llibreria per escriure el joc en un `build.mjs` (escenaris, personatges, regles…) |
| `scripts/commons.mjs` | buscar i baixar imatges lliures de Wikimedia Commons, amb els crèdits |
| `scripts/pixelate.mjs` | provar el pixelat d'una imatge (deixa una còpia ampliada per mirar-la) |
| `scripts/check.mjs` | validar un zip: el servidor l'accepta? es pot acabar? zones mal posades? |
| `scripts/preview.mjs` | imatges de cada escenari amb personatges, objectes i zones marcades, per revisar-les |
| `scripts/import.mjs` | importar el zip a l'editor local si està engegat |
| `assets/build-template.mjs` | un joc petit complet (2 escenaris) per començar a partir d'ell |
| `references/design.md` | com dissenyar la història i els puzles — **llegeix-lo abans de dissenyar** |
| `references/format.md` | totes les peces del joc i com s'escriuen amb el kit — **llegeix-lo abans d'escriure el build** |
| `references/art.md` | fons de Commons, pixelar, dibuixar, personatges, objectes, música — **abans de fer l'art** |

Dos exemples fets amb les mateixes peces; mira'ls quan dubtis de com es fa alguna cosa:
- `aventures/illa-del-tresor/` — fet amb aquest skill a partir d'un llibre: fons de pintures de Commons pixelades,
  6 personatges, 5 diàlegs, `diseny.md` i `build.mjs`. El més semblant al que hauràs de fer.
- `aventures/dracula/` — 50 escenaris en quatre actes, amb un **tractament d'estil propi** (`estil.mjs`: una sola
  paleta i un mapa de gradient perquè pintures i fotos molt diferents semblin del mateix joc) i un build repartit en
  actes. Mira'l per a aventures grans o quan l'usuari demani una estètica concreta.
- `tools/barcelona/build.mjs` — «La rosa de Sant Jordi», 10 escenaris amb els fons dibuixats a mà amb el llenç.

Necessites Node 18 o més nou i, per llegir JPG/WebP, `ffmpeg` (o `sips`, a macOS). Comprova-ho amb `ffmpeg -version`.

## Com es fa

Treballa a `aventures/<nom-curt>/` dins del repositori (crea-la): `diseny.md`, `imatges/`, `build.mjs`, `joc.zip`.

### 1. Dissenya (llegeix `references/design.md`)

A partir de la idea o el llibre, decideix l'objectiu, el protagonista, els personatges, els escenaris i la cadena de
puzles (pensada al revés, des del final). Si no et diuen la mida, fes-la mitjana: 6–10 escenaris. Escriu-ho a
`diseny.md`. Comprova mentalment que es pot acabar i que ningú no es pot quedar encallat.

### 2. Aconsegueix i fes l'art (llegeix `references/art.md`)

Per a cada escenari, busca una imatge a Commons (2–3 paraules en anglès; les pintures antigues i els gravats donen
molt bon resultat), baixa-la a `imatges/` i pixela-la. **Mira el resultat** (el `.zoom.png`, amb l'eina Read) abans
de quedar-te-la: ha de tenir terra a baix per caminar, no tenir gent en primer pla i encaixar amb l'estil dels altres
fons. Si després de 2–3 cerques no en trobes cap de bona, dibuixa el fons amb el llenç. Fes tots els fons amb el
mateix estil (preset o paleta).

Els personatges es fan amb `look` (figures animades de 16×32); els objectes, dibuixats amb el llenç o pixelats.
Fes 2–4 músiques curtes i reaprofita els efectes de `SFX`.

### 3. Escriu el build (llegeix `references/format.md`)

Copia `assets/build-template.mjs` a `aventures/<nom>/build.mjs` (el camí a `KIT` ja va bé des d'allà) i
substitueix-ne el contingut pel teu joc. Per a les imatges de Commons, `pixelArt(camí, opcions)` i
`P.attribute(camí)` (posa l'autor als crèdits; és obligatori per a CC BY i CC BY-SA).

Les coordenades de les zones caminables, els punts calents i les posicions s'han de triar **mirant la imatge**:
on és el terra, on és la porta, on és la barca. Per això el pas següent és imprescindible.

### 4. Construeix, comprova i mira

```bash
node aventures/<nom>/build.mjs                       # escriu joc.zip i el comprova
node $S/preview.mjs aventures/<nom>/joc.zip aventures/<nom>/preview
```

- Tots els **ERROR** s'han d'arreglar. Els **avís** també, si no és que ho has fet expressament (per exemple, un
  escenari al qual encara no s'arriba).
- Llegeix amb l'eina Read cada `preview/<escenari>.zones.png` i `personatges.png`. Corregeix les zones que no
  coincideixen amb el dibuix, els personatges que suren o són massa grans o petits, i les sortides mal posades.
- Repeteix fins que el build digui «✔ Es pot acabar» i «Cap problema», i les vistes prèvies quadrin.

### 5. Lliura-ho

- Si l'editor local està engegat (`npm start`), importa-la: `node $S/import.mjs aventures/<nom>/joc.zip` i dona
  l'enllaç. Si no, digues on és el zip i que es pot importar amb **«Importa…»** a l'editor local o a
  https://realbluehead.github.io/aventura-editor/.
- Explica en poques línies: de què va, els escenaris, els personatges, i d'on surten les imatges (amb les
  llicències). **No expliquis la solució** si no te la demanen: l'usuari hi voldrà jugar. Ofereix-la a part.
- Si no has pogut comprovar alguna cosa (per exemple, jugar-hi de debò al navegador), digues-ho.

## Criteris de qualitat

Abans de donar-la per acabada, comprova que:
- el build no dona cap error i diu que es pot acabar;
- cada escenari té coses a mirar amb descripcions amb gràcia, i almenys un motiu per anar-hi;
- cada personatge té un diàleg amb alguna cosa útil o divertida;
- hi ha pistes per a cada puzle (diàlegs, descripcions, respostes en fallar);
- hi ha introducció (`introCutsceneId`) que deixa clar l'objectiu, i un final satisfactori (`end`);
- les imatges de Commons surten als crèdits;
- tot el text és en l'idioma de l'usuari i sense errors.
