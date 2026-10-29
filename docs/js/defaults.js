// Valors per defecte compartits pel servidor i la interfície

// Els 9 verbs clàssics, en l'ordre de la graella de 3×3 de Monkey Island 2.
// «response» és el que diu el personatge quan el verb no té cap efecte sobre una cosa.
// «look» és especial: amb un objecte o un punt calent, el personatge en diu la descripció.
// «preposition» fa que el verb pugui unir dos objectes: «Fes servir la clau amb la porta», «Dóna el rom al pirata».
export const DEFAULT_VERBS = [
  { id: "give", name: "Dóna", response: "No crec que ho vulgui.", preposition: "a" },
  { id: "pickup", name: "Agafa", response: "No ho puc agafar." },
  { id: "use", name: "Fes servir", response: "No sé com fer-ho servir.", preposition: "amb" },
  { id: "open", name: "Obre", response: "No es pot obrir." },
  { id: "look", name: "Mira", response: "No hi veig res d'especial." },
  { id: "push", name: "Empeny", response: "No es mou." },
  { id: "close", name: "Tanca", response: "No es pot tancar." },
  { id: "talk", name: "Parla amb", response: "No crec que em contesti." },
  { id: "pull", name: "Estira", response: "No es mou." },
].map((v) => ({ preposition: "", ...v }));

export const LOOK = "look";
export const PICKUP = "pickup";

// Tipus de condicions i accions de les regles (el servidor les valida i el reproductor les executa)
export const CONDITION_TYPES = ["has", "state", "var", "said"];
export const ACTION_TYPES = ["say", "take", "lose", "setState", "setVar", "goto", "wait", "dialogue", "end", "walk", "sound", "music", "cutscene"];
export const VARIABLE_TYPES = ["bool", "number", "text"];
export const OPS = ["==", "!=", "<", ">", "<=", ">="];

// Animacions dels personatges: tres accions en tres direccions. «side» és mirant a la dreta (a l'esquerra s'emmiralla),
// «down» és de cara a la càmera i «up» d'esquena. Cada animació és una llista de fotogrames del full de sprites.
export const ANIMATIONS = ["idle", "walk", "talk"];
export const DIRECTIONS = ["side", "down", "up"];
export const ANIMATION_KEYS = ANIMATIONS.flatMap((a) => DIRECTIONS.map((d) => `${a}-${d}`));
export const CHARACTER_FACINGS = ["down", "left", "right", "up"];

// Com s'entra a un escenari: fos a negre, tall sec, o el cercle que es tanca sobre el protagonista
export const TRANSITIONS = ["fade", "cut", "iris"];
export const CURSORS = ["cross", "system"];
