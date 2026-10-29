// Lògica de la partida: l'estat (inventari, on és cada objecte, estats i variables),
// les condicions i les accions de les regles. No depèn del navegador: es prova des de Node.
//
// Una regla és: verb + cosa (objecte o punt calent) [+ segon objecte] → condicions (totes) → accions (en ordre).
// Si n'hi ha diverses que encaixen, guanya la primera de la llista.

export const INVENTORY = "inventory";

export function createGameState(adventure) {
  const location = new Map();   // objecte → id de l'escenari on és, o INVENTORY; si no hi és, ha desaparegut
  for (const s of adventure.scenes) for (const p of s.objects) location.set(p.objectId, s.id);
  return {
    inventory: [],
    location,
    states: new Map(adventure.objects.map((o) => [o.id, o.initialState])),
    vars: new Map(adventure.variables.map((v) => [v.id, v.initial])),
    said: new Set(),            // opcions de diàleg que ja s'han triat: «idDiàleg:idOpció»
    seen: new Set(),            // seqüències que ja s'han vist (per a les que només es fan la primera vegada)
    ended: null,                // text de la pantalla final, quan s'acaba el joc
  };
}

export const sameRef = (a, b) => (!a && !b) || (!!a && !!b && a.kind === b.kind && a.id === b.id);

function compare(a, op, b) {
  switch (op) {
    case "!=": return a !== b;
    case "<": return Number(a) < Number(b);
    case ">": return Number(a) > Number(b);
    case "<=": return Number(a) <= Number(b);
    case ">=": return Number(a) >= Number(b);
    default: return a === b;
  }
}

// Una condició que apunta a una cosa que ja no existeix no es compleix mai
export function checkCondition(state, c) {
  if (!c) return false;
  let ok;
  if (c.type === "has") ok = state.inventory.includes(c.objectId);
  else if (c.type === "state") {
    if (!state.states.has(c.objectId)) return false;
    ok = state.states.get(c.objectId) === c.stateId;
  } else if (c.type === "said") {
    ok = state.said.has(`${c.dialogueId}:${c.optionId}`);
  } else if (c.type === "var") {
    if (!state.vars.has(c.varId)) return false;
    ok = compare(state.vars.get(c.varId), c.op, c.value);
  } else return false;
  return c.not ? !ok : ok;
}

// «Fes servir la clau amb la porta» també troba la regla escrita com «Fes servir la porta amb la clau»
export function findRule(adventure, state, verbId, target, withRef = null) {
  const fits = (r, t, w) => r.verb === verbId && sameRef(r.target, t) && sameRef(r.with, w)
    && r.conditions.every((c) => checkCondition(state, c));
  return adventure.rules.find((r) => fits(r, target, withRef))
    ?? (withRef ? adventure.rules.find((r) => fits(r, withRef, target)) : undefined)
    ?? null;
}

// Les accions que només canvien l'estat. Retorna false si l'acció és d'un altre tipus (o apunta a una cosa que no existeix).
export function applyStateAction(adventure, state, a) {
  if (!a) return false;
  const object = (id) => adventure.objects.find((o) => o.id === id);
  switch (a.type) {
    case "take":
      if (!object(a.objectId)) return false;
      if (!state.inventory.includes(a.objectId)) state.inventory.push(a.objectId);
      state.location.set(a.objectId, INVENTORY);
      return true;
    case "lose":
      state.inventory = state.inventory.filter((id) => id !== a.objectId);
      state.location.delete(a.objectId);
      return true;
    case "setState":
      if (!object(a.objectId)?.states.some((s) => s.id === a.stateId)) return false;
      state.states.set(a.objectId, a.stateId);
      return true;
    case "setVar": {
      if (!state.vars.has(a.varId)) return false;
      const cur = state.vars.get(a.varId);
      state.vars.set(a.varId, a.op === "add" ? Number(cur) + Number(a.value) : a.value);
      return true;
    }
    default:
      return false;
  }
}

// Executa les accions una darrere l'altra. «fx» fa les que necessiten el reproductor, i totes retornen una promesa:
// say(text, qui: id de personatge o null per al protagonista), goto(sceneId, arrival), wait(segons), end(text),
// dialogue(id), walk(punt, qui), sound(id), music(id o null), cutscene(id) i changed() després de cada canvi d'estat.
export async function runActions(adventure, state, actions, fx) {
  for (const a of actions) {
    if (state.ended) return;
    if (!a) continue;
    if (["take", "lose", "setState", "setVar"].includes(a.type)) {
      if (applyStateAction(adventure, state, a)) await fx.changed?.();
      continue;
    }
    if (a.type === "say") await fx.say(a.text, a.by ?? null);
    else if (a.type === "goto") {
      if (adventure.scenes.some((s) => s.id === a.sceneId)) await fx.goto(a.sceneId, a.arrival);
    } else if (a.type === "wait") await fx.wait(a.seconds);
    else if (a.type === "dialogue") {
      if (adventure.dialogues?.some((d) => d.id === a.dialogueId)) await fx.dialogue(a.dialogueId);
    } else if (a.type === "walk") await fx.walk?.(a.point, a.by ?? null);
    else if (a.type === "sound") fx.sound?.(a.soundId);
    else if (a.type === "music") fx.music?.(a.soundId ?? null);
    else if (a.type === "cutscene") {
      if (adventure.cutscenes?.some((c) => c.id === a.cutsceneId)) await fx.cutscene(a.cutsceneId);
    }
    else if (a.type === "end") {
      state.ended = a.text || "Fi";
      await fx.end(state.ended);
    }
  }
}

/* ---------- Diàlegs ---------- */

export const startNode = (dialogue) => dialogue.nodes.find((n) => n.id === dialogue.start) ?? dialogue.nodes[0] ?? null;

// Opcions que es poden triar ara: compleixen les condicions i, si són d'un sol ús, encara no s'han dit
export function availableOptions(dialogue, node, state) {
  return node.options.filter((o) => !(o.once && state.said.has(`${dialogue.id}:${o.id}`))
    && o.conditions.every((c) => checkCondition(state, c)));
}

export function markSaid(state, dialogue, option) {
  state.said.add(`${dialogue.id}:${option.id}`);
}

// El diàleg d'un personatge, si en té: el que comença «Parla amb» quan cap regla diu el contrari
export const dialogueFor = (adventure, characterId) => adventure.dialogues?.find((d) => d.characterId === characterId) ?? null;

/* ---------- Partides desades ---------- */

// L'estat de la partida en un objecte que es pot guardar com a JSON
export function serializeGame(state) {
  return {
    inventory: [...state.inventory],
    location: [...state.location],
    states: [...state.states],
    vars: [...state.vars],
    said: [...state.said],
    seen: [...state.seen],
  };
}

// I a l'inrevés. Si l'aventura ha canviat des que es va desar (coses esborrades), el que ja no existeix es descarta.
export function restoreGame(adventure, data) {
  const state = createGameState(adventure);
  const objects = new Map(adventure.objects.map((o) => [o.id, o]));
  const scenes = new Set(adventure.scenes.map((s) => s.id));
  state.inventory = (data.inventory ?? []).filter((id) => objects.has(id));
  state.location = new Map((data.location ?? []).filter(([id, where]) => objects.has(id) && (where === INVENTORY || scenes.has(where))));
  for (const [id, s] of data.states ?? []) if (objects.get(id)?.states.some((x) => x.id === s)) state.states.set(id, s);
  for (const [id, v] of data.vars ?? []) if (state.vars.has(id)) state.vars.set(id, v);
  state.said = new Set(data.said ?? []);
  state.seen = new Set(data.seen ?? []);
  return state;
}
