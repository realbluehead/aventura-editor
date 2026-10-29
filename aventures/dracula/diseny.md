# Dràcula — disseny

Adaptació de *Dracula* (Bram Stoker, 1897, domini públic). Aventura llarga i fosca: 50 escenaris en quatre actes.
Protagonista: **Jonathan Harker**. Objectiu final: destruir el comte Dràcula abans que arribi al seu castell.

## Estètica

- Totes les imatges (pintures i fotos de Commons) passen pel mateix tractament (`estil.mjs`): mapa de gradient de
  lluminositat cap a una rampa nocturna (negre blavós → morat → gris lunar → os), els vermells intensos es conserven
  com a sang, vinyeta fosca, i quantització a la paleta comuna **«Nosferatu»** amb tramat ordenat suau.
- Els personatges es pinten amb colors de la mateixa paleta (apagats, freds), perquè no desentonin.
- Les aparicions que han de desaparèixer (el comte, les germanes, la Lucy) són **objectes** amb estats; els personatges
  que surten a diversos escenaris tenen una entrada per escenari (mateix aspecte i nom, id diferent).

## Escenaris (50)

### Acte I — Transilvània
1. `s-hotel` Hotel Corona d'Or (Bistritz) — hostaler, hostalera
2. `s-placa` Plaça de Bistritz — cotxer de la diligència, pagesa
3. `s-borgo` Pas del Borgo — cotxer negre (objecte: el comte disfressat), llops
4. `s-pati` Pati del castell — el comte (objecte) amb el llum
5. `s-sala` Gran saló — el comte (objecte)
6. `s-biblioteca` Biblioteca — mapa d'Anglaterra (amaga la clau rovellada)
7. `s-cambra` Cambra de Jonathan — mirall d'afaitar, finestra
8. `s-passadis` Passadís — porta de l'ala sud (clau rovellada)
9. `s-ala-sud` Ala sud — les germanes (objecte), clau de ferro
10. `s-muralla` Muralla — per fora, com el comte
11. `s-cambra-comte` Cambra del comte — munt d'or, porta de la capella (clau de ferro)
12. `s-capella` Capella del castell — caixes de terra, el comte dormint (objecte), pala
13. `s-espadat` L'espadat — la fugida

### Acte II — Whitby i la Lucy
14. `s-budapest` Hospital de Budapest — germana Àgata, Mina
15. `s-whitby-port` Port de Whitby — guardacostes
16. `s-demeter` Coberta del Demeter — capità mort (objecte), quadern de bitàcola
17. `s-escales` Les 199 escales — el vell Swales
18. `s-cementiri-whitby` Cementiri de l'East Cliff — Lucy somnàmbula al banc (objecte)
19. `s-abadia` Ruïnes de l'abadia — xal de la Lucy, gos negre
20. `s-crescent` Casa dels Westenra (Whitby) — senyora Westenra
21. `s-lucy-whitby` Dormitori de la Lucy (Whitby) — Lucy al llit (objecte)
22. `s-hillingham` Hillingham (Londres) — Van Helsing, Arthur
23. `s-hillingham-dormitori` Dormitori de la Lucy (Londres) — Lucy (objecte), finestra

### Acte III — Londres
24. `s-hampstead` Hampstead Heath — policia
25. `s-kingstead` Cementiri de Kingstead — Van Helsing, Arthur
26. `s-cripta` Panteó dels Westenra — taüt, Lucy vampira (objectes), Arthur
27. `s-asil` Asil de Purfleet (entrada) — zelador
28. `s-despatx` Despatx del Dr. Seward — Seward, fonògraf, sucre, pot de vidre
29. `s-cella` Cel·la de Renfield — Renfield
30. `s-jardi` Jardí de l'asil — mur de Carfax
31. `s-sala-reunio` Saló de l'asil — Van Helsing, Quincey
32. `s-habitacio-mina` Habitació de la Mina — Mina
33. `s-carfax` Carfax (exterior)
34. `s-carfax-capella` Capella de Carfax — rates, caixes, llista de cases
35. `s-piccadilly` Piccadilly — el comte (objecte), serraller
36. `s-casa-piccadilly` Casa del comte a Piccadilly — caixes, rebut del carreter
37. `s-mile-end` Mile End — carreter, caixes
38. `s-zoo` Zoo de Londres — guardià Bilder (opcional)
39. `s-docks` Docks de Londres — agent de la naviliera
40. `s-tren` L'Orient Exprés — Quincey, Arthur

### Acte IV — La persecució
41. `s-varna` Port de Varna — telegrafista
42. `s-galatz` Port de Galatz — vicecònsol
43. `s-magatzem` Magatzem de Skinsky — albarà
44. `s-riu` Riu Bistritza — barquer
45. `s-bosc` Bosc nevat — Quincey, llops
46. `s-campament` Campament — Mina, Van Helsing, les germanes (objecte)
47. `s-castell-neu` El castell sota la neu
48. `s-tombes` Tombes del castell — tombes de les germanes i del comte (objectes)
49. `s-cami` Camí dels gitanos — gitano, la caixa del comte (objecte)
50. `s-epileg` Epíleg — set anys després

## Camí imprescindible (resum)

**I.** Hostaler → *carta del comte*. Hostalera (si tens la carta) → *crucifix*. Dóna la carta al cotxer → diligència.
Parla amb el cotxer negre → calessa. Parla amb el comte al pati → entrar. Dóna les *escriptures de Carfax* al comte.
Agafa el *mirall* (cambra) i fes-lo servir amb el comte → no fa reflex; ja ets presoner. Mira per la finestra → el
comte repta per la paret. Estira el mapa (biblioteca) → *clau rovellada* → ala sud. Fes servir el crucifix amb les
germanes → *clau de ferro*. Surt per la finestra → muralla → cambra del comte (*bossa d'or*). Clau de ferro → capella.
Agafa la *pala*, fes-la servir amb el comte dormint → fugida per l'espadat.

**II.** Budapest: parla amb la Mina (casament); la germana Àgata → *bitllet*. Whitby: guardacostes (permís) →
Demeter → *quadern de bitàcola* (pista del gos negre). Senyora Westenra: la Lucy és somnàmbula. Abadia → *xal*.
Dóna el xal a la Lucy al banc → a casa. Mira la Lucy al llit → les marques. Tren a Londres. Van Helsing:
transfusió → *flors d'all*. Fes-les servir amb la finestra de la Lucy → la nit fatal: la Lucy mor.

**III.** Van Helsing → *tornavís, estaca, mall, hòsties*. Arthur (Kingstead) → *clau del panteó*. Tornavís amb el
taüt (buit) → hòsties amb la porta (la Lucy queda atrapada) → estaca a l'Arthur → la Lucy descansa.
Asil: *sucre* i *pot de vidre* (despatx) → sucre amb la finestra de la cel·la → *mosca* → a Renfield → Carfax.
Seward → *clau de Carfax*. Quincey → *xiulet*. Capella de Carfax: xiulet amb les rates, hòsties amb les caixes,
*llista de cases*. Piccadilly: bossa d'or al serraller → casa: hòsties amb les caixes, *rebut*. Mile End: rebut al
carreter → hòsties amb les caixes. Habitació de la Mina: l'atac del comte. Van Helsing hipnotitza la Mina → un vaixell.
Docks → *bitllets* → tren: Quincey → *ganivet kukri*.

**IV.** Varna: *telegrama* (Galatz). Galatz: vicecònsol → magatzem → *albarà*. Bossa d'or al barquer → bosc →
campament: Van Helsing → *estaca nova*; hòsties amb les germanes → cercle sagrat. Castell: estaca amb les tombes de
les germanes; hòsties amb la tomba del comte. Camí: el ganivet amb la caixa del comte al capvespre → epíleg i fi.
