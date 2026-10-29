// Tots els decorats de «Dràcula», per clau d'escenari (la mateixa que fa servir escena() a build.mjs).
// persp.mjs, comu.mjs, textura.mjs i llums.mjs són el motor dels decorats del Barret Desaparegut
// (aventures/barret-perdut), passat a 320×240 i amb l'estil DRACULA; les peces pròpies són a dcomu.mjs.
import { ACTE1 } from "./transilvania.mjs";
import { ACTE2 } from "./whitby.mjs";
import { ACTE3 } from "./londres.mjs";
import { ACTE4 } from "./persecucio.mjs";

export const DECORATS = { ...ACTE1, ...ACTE2, ...ACTE3, ...ACTE4 };
