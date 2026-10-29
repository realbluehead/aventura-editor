# Imatges i so

## Índex
1. Fons a partir d'imatges lliures (Wikimedia Commons)
2. Pixelar: estils i opcions
3. Dibuixar amb el llenç (`Canvas`)
4. Personatges (`look`)
5. Objectes
6. Pantalla de títol
7. Música i efectes
8. Revisar-ho tot amb els ulls

## 1. Fons a partir d'imatges lliures

```bash
node $S/commons.mjs search "harbour painting" --limit 12      # $S = skills/aventura-grafica/scripts
node $S/commons.mjs get "File:Nom exacte.jpg" aventures/<nom>/imatges/port.jpg
```

- Busca amb **2 o 3 paraules en anglès**; amb més, Commons no troba res. Afegir `painting`, `engraving`,
  `illustration`, `watercolor` o `photo` canvia molt el resultat.
- Només surten imatges de domini públic, CC0, CC BY i CC BY-SA (les que es poden adaptar). `get` deixa un `.json`
  al costat amb l'autor i la llicència; al build, `P.attribute(camí)` l'afegeix als crèdits del joc. Fes-ho per a
  **totes** les imatges de Commons que facis servir: CC BY i CC BY-SA ho exigeixen.
- Què funciona com a fons d'aventura:
  - **Pintures antigues** (domini públic): interiors, ports, carrers, paisatges. Queden molt bé pixelades.
  - Fotos de llocs **sense gent en primer pla** i amb **terra visible a la part de baix** (on caminarà el
    protagonista). Una foto des de massa amunt o massa a prop no serveix.
  - Gravats i il·lustracions de llibres (bons per a contes i clàssics).
  - Evita imatges amb molta gent, text gran, marques d'aigua, o on el terra no es veu.
- **Una mateixa aventura ha de semblar d'una sola mà**: fes servir el mateix estil de pixelat (mateix `preset`,
  o la mateixa `palette`) per a tots els fons. Barrejar pintures i fotos queda estrany si no comparteixen paleta.
- Si no trobes res bo per a un escenari, **dibuixa'l** amb el llenç (secció 3) o fes-ne una barreja: un fons pixelat
  amb coses dibuixades a sobre (portes, rètols, la barca del pescador).

## 2. Pixelar

```js
const bg = pixelArt(join(HERE, "imatges/port.jpg"), { preset: "painting", crop: [0, 0.2, 1, 0.8] });
```

Per provar-ho ràpid sense el build: `node $S/pixelate.mjs entrada.jpg sortida.png --preset painting` (en deixa també
`sortida.zoom.png`, ampliada, per mirar-la amb Read).

| opció | per a què |
|---|---|
| `width`, `height` | mida final (per defecte 320×200) |
| `fit` | `"cover"` omple i retalla (fons), `"contain"` sencera amb vores transparents (objectes), `"stretch"` |
| `crop: [x, y, w, h]` | fraccions 0–1 de l'original: quedar-se'n un tros (per exemple, treure el cel buit o la gent) |
| `anchorX`, `anchorY` | amb `cover`, cap on es retalla (0 esquerra/dalt, 1 dreta/baix) |
| `preset` | `photo`, `painting`, `soft`, `sprite`, `ega`, `pico8`, `gameboy` |
| `colors` | quants colors triar de la imatge (16–48 queda «de joc antic») |
| `palette` | una paleta fixa: `aventura`, `pico8`, `db32`, `endesga32`, `ega`, `c64`, `gameboy`, `grays`, o una llista de `"#rrggbb"` |
| `dither`, `ditherAmount` | `none`, `floyd`, `atkinson`, `bayer2/4/8`; força 0–1 |
| `brightness`, `contrast`, `saturation` | −100 a 100. Les pintures antigues solen demanar `brightness: 15–25` |
| `removeBg`, `bgTolerance` | treu el fons (el color de les cantonades): per a objectes fotografiats sobre fons llis |
| `outline: "#1a1c2c"` | contorn d'un píxel (sprites) |
| `method` | `average` (fotos), `dominant` (dibuixos, vores netes), `nearest` |

**Que no semblin fotos.** Una foto o una pintura pixelada a 320×200 encara sembla una foto, i els personatges
(figures de 16×32 que al joc fan uns 50 px, és a dir, píxels d'1,5–2 px) hi queden enganxats. Per integrar-los:
treballa a la meitat de la resolució del fons i amplia ×2 (blocs de 2×2), aplana-hi les textures abans (filtre de
Kuwahara), queda't amb **~20 colors** per escena (de la paleta comuna), conserva una part del color original
perquè cada lloc es distingeixi, i neteja els píxels solts. No ho enfosqueixis massa: s'ha de veure tot.
`aventures/dracula/estil.mjs` (funció `fons`) ho fa tot i es pot copiar.

**Més resolució (640×480).** Per a fons amb més detall, fes-los de 640×480 (detall de 320×240). Es pot col·locar
tot el joc en coordenades de 320×200 i convertir-les al final (x×2, y×2,4: el 16:10 estirat a 4:3, com es veien
els jocs de 320×200 als monitors); amplia també els objectes (×2–×4) i l'alçada dels actors. Ho fa
`aventures/dracula/build.mjs` (blocs «Mida dels objectes» i «De 320×200 a 640×480»).

Per a una aventura coherent, tria una paleta comuna (per exemple `palette: "db32"` o `"endesga32"`) per a tots els
fons i objectes. Les pintures fosques: puja la brillantor perquè el protagonista i els objectes es vegin.

## 3. Dibuixar amb el llenç

`new Canvas(w, h, colorDeFons?)`. Colors: `"#rrggbb"` o `[r, g, b, a]` (amb `a` < 255 es barreja).

| mètode | |
|---|---|
| `px(x, y, c)`, `get(x, y)` | un píxel |
| `rect(x, y, w, h, c)` | rectangle ple |
| `line(x0, y0, x1, y1, c)` | línia |
| `circle(cx, cy, r, c)`, `ellipse(cx, cy, rx, ry, c)` | plens |
| `poly([[x,y],...], c)` | polígon ple |
| `gradient(x, y, w, h, colorDalt, colorBaix, franges)` | degradat per franges amb tramat (cels) |
| `dither(x, y, w, h, a, b)` | tramat de dos colors (ombres) |
| `noise(x, y, w, h, base, quantitat, llavor, densitat)` | textura (pedra, sorra, fulles) |
| `text(x, y, "TEXT", c, escala)` | lletra de 3×5 (només majúscules, sense accents) per a rètols |
| `Canvas.textWidth(text, escala)` | amplada d'un text |
| `draw(altreCanvas, x, y)` | enganxa un altre llenç (respectant la transparència) |

També: `mix(a, b, t)` barreja dos colors; `rng(llavor)` dona nombres aleatoris repetibles (per escampar estrelles,
pedres, fulles sempre igual). Mira `tools/barcelona/scenes.mjs` per veure deu fons fets així.

Pensa el fons com un escenari de teatre: **cel o paret a dalt, coses interessants al mig (on aniran els punts
calents), i terra pla a baix (y ≈ 150–199)** on camina el protagonista. Deixa lloc lliure per als personatges.

## 4. Personatges

`look` dibuixa una figura de 16×32 amb totes les animacions (de costat, de cara, d'esquena, caminar i parlar):

| clau | |
|---|---|
| `skin`, `hair`, `shirt`, `pants`, `shoes` | colors bàsics (`hair: null` = calb) |
| `long: 1`, `bun: 1`, `ponytail: 1` | cabell llarg, monyo, cua |
| `beard`, `glasses` | colors de la barba i les ulleres |
| `cap`, `hat`, `helmet` | gorra, barret, casc (colors) |
| `jacket`, `vest`, `apron`, `stripes` | jaqueta, armilla, davantal, ratlles a la camisa |
| `dress`, `legs` | faldilla (color) i color de les cames si porta faldilla |

Fes cada personatge **reconeixible de lluny**: colors diferents de camisa, i un tret (barret, barba, davantal).
El protagonista ha de destacar sobre tots els fons. Revisa'ls a `personatges.png` de la vista prèvia.

Per a criatures o personatges no humans, dibuixa un full propi amb `Canvas` (fotogrames en graella) i passa
`sheet`, `frameWidth`, `frameHeight` i `animations` (vegeu format.md). N'hi ha prou amb un sol fotograma de cara
(`{ "idle-down": { frames: [0], fps: 1 } }`) per a un personatge que no camina.

## 5. Objectes

- Mida: com seria a l'escenari (una clau, 8×4; una llanterna, 10×14; una porta, 30×50). La icona de l'inventari
  es fa sola, ampliada.
- Dibuixats amb `Canvas` (el més segur: vegeu `tools/barcelona/sprites.mjs`), o d'una foto de Commons:
  `pixelArt(foto, { preset: "sprite", width: 24, height: 24, fit: "contain", removeBg: true })`.
- Els objectes col·locats a l'escenari han de **semblar part del fons** (mateixa paleta) però distingir-se'n prou
  per veure que són clicables. Un contorn fosc (`outline`) ajuda.
- Un objecte que només existeix a l'inventari pot ser més petit o fer-se només com a icona.

## 6. Pantalla de títol

El joc ja escriu el títol de l'aventura i el subtítol a la part de baix de la pantalla de títol, sobre la imatge.
Per tant, la imatge pot ser només un fons bonic (el del primer escenari, o un d'especial). Si hi vols un logotip
dibuixat, posa'l a la part de dalt i fes-lo diferent del text (més gran, amb ombra), perquè no sembli repetit:
```js
const t = pixelArt(...);  t.rect(40, 18, 240, 40, [10, 10, 30, 200]);
t.text(160 - Canvas.textWidth("TITOL", 4) / 2, 24, "TITOL", "#ffd23f", 4);
```
La lletra del llenç només té majúscules sense accents (les lletres accentuades surten sense accent).

## 7. Música i efectes

```js
song(bpm, [
  { wave: "pulse", vol: 0.15, decay: 1.5, notes: "E4:1 G4:1 A4:2 -:1 B4:1" },   // melodia: nota:temps, «-» silenci
  { wave: "triangle", vol: 0.22, decay: 0.5, notes: "A2:4 C3:4" },              // baix
], repeticions)
```
Ones: `square`, `pulse`, `triangle`, `sine`. Cada so és un WAV; una cançó de 30 s ocupa ~1,3 MB, així que fes-ne
2 o 4 per aventura (tema, ambient, tensió, final) i reaprofita-les. Mira `tools/barcelona/audio.mjs` per a exemples.

## 8. Revisar-ho tot amb els ulls

```bash
node $S/preview.mjs aventures/<nom>/joc.zip aventures/<nom>/preview
```
Llegeix (eina Read) cada `<escenari>.zones.png`: la zona caminable (verda) ha de cobrir el terra que es veu, els
punts calents (grocs) han d'envoltar la cosa que nomenen, les sortides (blau cel) han de ser on sembla que s'hi
pugui anar, i els personatges han de tenir els peus a terra i una mida creïble (les barres roses al marge esquerre
són l'alçada del protagonista a dalt i a baix de la zona). Corregeix el build i torna-hi fins que quadri.
