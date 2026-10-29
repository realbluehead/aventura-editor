import { test } from "node:test";
import assert from "node:assert/strict";
import { createSaves } from "../public/js/player/saves.js";
import { createGameState, checkCondition, findRule, runActions, INVENTORY, startNode, availableOptions, markSaid, dialogueFor, serializeGame, restoreGame } from "../public/js/player/rules.js";

// Una aventura petita: una clau al moll i una porta tancada a la taverna
const adventure = {
  scenes: [
    { id: "moll", objects: [{ objectId: "clau" }] },
    { id: "taverna", objects: [{ objectId: "porta" }] },
  ],
  objects: [
    { id: "clau", initialState: "normal", states: [{ id: "normal" }] },
    { id: "porta", initialState: "tancada", states: [{ id: "tancada" }, { id: "oberta" }] },
  ],
  variables: [
    { id: "obertes", type: "number", initial: 0 },
    { id: "avisat", type: "bool", initial: false },
  ],
  rules: [
    { id: "r1", verb: "use", target: { kind: "object", id: "clau" }, with: { kind: "object", id: "porta" },
      conditions: [{ type: "state", objectId: "porta", stateId: "tancada" }],
      actions: [
        { type: "setState", objectId: "porta", stateId: "oberta" },
        { type: "setVar", varId: "obertes", op: "add", value: 1 },
        { type: "say", text: "Oberta!" },
      ] },
    { id: "r2", verb: "open", target: { kind: "object", id: "porta" }, with: null,
      conditions: [{ type: "has", objectId: "clau", not: true }],
      actions: [{ type: "say", text: "Està tancada amb clau." }] },
    { id: "r3", verb: "open", target: { kind: "object", id: "porta" }, with: null,
      conditions: [],
      actions: [{ type: "say", text: "Millor amb la clau." }] },
  ],
};

const fx = (log) => ({
  say: async (t) => log.push(`diu: ${t}`),
  goto: async (id) => log.push(`va a: ${id}`),
  wait: async (s) => log.push(`espera ${s}`),
  end: async (t) => log.push(`fi: ${t}`),
  changed: async () => log.push("canvi"),
});

test("estat inicial: on és cada objecte, estats i variables", () => {
  const st = createGameState(adventure);
  assert.equal(st.location.get("clau"), "moll");
  assert.equal(st.states.get("porta"), "tancada");
  assert.equal(st.vars.get("obertes"), 0);
  assert.deepEqual(st.inventory, []);
});

test("condicions: tenir, estat, variables i negacions", () => {
  const st = createGameState(adventure);
  assert.equal(checkCondition(st, { type: "has", objectId: "clau" }), false);
  assert.equal(checkCondition(st, { type: "has", objectId: "clau", not: true }), true);
  assert.equal(checkCondition(st, { type: "state", objectId: "porta", stateId: "tancada" }), true);
  assert.equal(checkCondition(st, { type: "var", varId: "obertes", op: "<", value: 1 }), true);
  assert.equal(checkCondition(st, { type: "var", varId: "avisat", op: "==", value: false }), true);
  assert.equal(checkCondition(st, { type: "var", varId: "no-existeix", op: "==", value: 0 }), false, "una variable esborrada no es compleix");
  assert.equal(checkCondition(st, null), false);
});

test("la primera regla que encaixa guanya, segons les condicions", () => {
  const st = createGameState(adventure);
  const porta = { kind: "object", id: "porta" };
  assert.equal(findRule(adventure, st, "open", porta).id, "r2");
  st.inventory.push("clau");
  assert.equal(findRule(adventure, st, "open", porta).id, "r3");
  assert.equal(findRule(adventure, st, "push", porta), null);
});

test("fer servir X amb Y troba la regla en qualsevol ordre", () => {
  const st = createGameState(adventure);
  const clau = { kind: "object", id: "clau" }, porta = { kind: "object", id: "porta" };
  assert.equal(findRule(adventure, st, "use", clau, porta).id, "r1");
  assert.equal(findRule(adventure, st, "use", porta, clau).id, "r1");
  assert.equal(findRule(adventure, st, "use", clau), null, "sense segon objecte no és la mateixa regla");
});

test("les accions canvien l'estat i es fan en ordre", async () => {
  const st = createGameState(adventure);
  const log = [];
  await runActions(adventure, st, adventure.rules[0].actions, fx(log));
  assert.equal(st.states.get("porta"), "oberta");
  assert.equal(st.vars.get("obertes"), 1);
  assert.deepEqual(log, ["canvi", "canvi", "diu: Oberta!"]);
  // Ja oberta: la regla deixa de complir-se
  assert.equal(findRule(adventure, st, "use", { kind: "object", id: "clau" }, { kind: "object", id: "porta" }), null);
});

test("inventari: agafar i perdre objectes", async () => {
  const st = createGameState(adventure);
  await runActions(adventure, st, [{ type: "take", objectId: "clau" }, { type: "take", objectId: "clau" }], fx([]));
  assert.deepEqual(st.inventory, ["clau"], "no es duplica");
  assert.equal(st.location.get("clau"), INVENTORY);
  await runActions(adventure, st, [{ type: "lose", objectId: "clau" }], fx([]));
  assert.deepEqual(st.inventory, []);
  assert.equal(st.location.has("clau"), false, "ha desaparegut del joc");
});

test("el final atura les accions que venen darrere", async () => {
  const st = createGameState(adventure);
  const log = [];
  await runActions(adventure, st, [
    { type: "goto", sceneId: "taverna" }, { type: "goto", sceneId: "no-existeix" },
    { type: "end", text: "Has guanyat" }, { type: "say", text: "no s'ha de dir" },
  ], fx(log));
  assert.deepEqual(log, ["va a: taverna", "fi: Has guanyat"]);
  assert.equal(st.ended, "Has guanyat");
});

test("accions que apunten a coses esborrades no fan res", async () => {
  const st = createGameState(adventure);
  const log = [];
  await runActions(adventure, st, [
    { type: "take", objectId: "fantasma" },
    { type: "setState", objectId: "porta", stateId: "trencada" },
    { type: "setVar", varId: "fantasma", op: "set", value: 1 },
    null,
  ], fx(log));
  assert.deepEqual(log, []);
  assert.deepEqual(st.inventory, []);
  assert.equal(st.states.get("porta"), "tancada");
});

/* ---------- Diàlegs ---------- */


const talk = {
  id: "d1", characterId: "pirata", start: "n1",
  nodes: [
    { id: "n0", lines: [], options: [] },
    { id: "n1", lines: [{ by: "pirata", text: "Arrr" }], options: [
      { id: "o1", text: "Qui ets?", once: true, conditions: [], actions: [], next: "n1" },
      { id: "o2", text: "Tinc la clau", once: false, conditions: [{ type: "has", objectId: "clau" }], actions: [], next: null },
      { id: "o3", text: "Adéu", once: false, conditions: [], actions: [], next: null },
    ] },
  ],
};

test("diàlegs: node inicial, opcions segons condicions i d'un sol ús", () => {
  const adv = { ...adventure, dialogues: [talk] };
  const st = createGameState(adv);
  assert.equal(startNode(talk).id, "n1");
  assert.equal(startNode({ ...talk, start: "no-hi-és" }).id, "n0", "si l'inici no existeix, el primer node");
  const ids = () => availableOptions(talk, talk.nodes[1], st).map((o) => o.id);
  assert.deepEqual(ids(), ["o1", "o3"], "sense la clau no surt l'opció que la demana");
  markSaid(st, talk, talk.nodes[1].options[0]);
  assert.deepEqual(ids(), ["o3"], "una opció d'un sol ús desapareix un cop dita");
  st.inventory.push("clau");
  assert.deepEqual(ids(), ["o2", "o3"]);
  assert.equal(dialogueFor(adv, "pirata").id, "d1");
  assert.equal(dialogueFor(adv, "ningú"), null);
});

test("la condició «ha dit» i l'acció de començar un diàleg", async () => {
  const adv = { ...adventure, dialogues: [talk] };
  const st = createGameState(adv);
  const said = { type: "said", dialogueId: "d1", optionId: "o1" };
  assert.equal(checkCondition(st, said), false);
  assert.equal(checkCondition(st, { ...said, not: true }), true);
  markSaid(st, talk, talk.nodes[1].options[0]);
  assert.equal(checkCondition(st, said), true);
  const started = [];
  await runActions(adv, st, [{ type: "dialogue", dialogueId: "d1" }, { type: "dialogue", dialogueId: "no-hi-és" }], { dialogue: async (id) => started.push(id) });
  assert.deepEqual(started, ["d1"], "un diàleg esborrat no es comença");
});

test("accions de seqüència: caminar, sons, música i seqüències dins de seqüències", async () => {
  const adv = { ...adventure, dialogues: [], cutscenes: [{ id: "c", name: "C", actions: [] }] };
  const st = createGameState(adv);
  const log = [];
  await runActions(adv, st, [
    { type: "walk", point: [1, 2], by: "pirata" },
    { type: "sound", soundId: "s" },
    { type: "music", soundId: null },
    { type: "cutscene", cutsceneId: "c" },
    { type: "cutscene", cutsceneId: "no-hi-és" },
  ], {
    walk: async (p, by) => log.push(`camina ${by} a ${p}`),
    sound: (id) => log.push(`so ${id}`),
    music: (id) => log.push(`música ${id}`),
    cutscene: async (id) => log.push(`seqüència ${id}`),
  });
  assert.deepEqual(log, ["camina pirata a 1,2", "so s", "música null", "seqüència c"]);
  assert.ok(st.seen instanceof Set);
});

/* ---------- Partides desades ---------- */


test("desar i carregar l'estat de la partida, encara que l'aventura hagi canviat", async () => {
  const adv = { ...adventure, dialogues: [], cutscenes: [] };
  const st = createGameState(adv);
  await runActions(adv, st, [{ type: "take", objectId: "clau" }, { type: "setState", objectId: "porta", stateId: "oberta" }, { type: "setVar", varId: "obertes", op: "add", value: 2 }], {});
  st.said.add("d:o");
  st.seen.add("intro");
  const data = JSON.parse(JSON.stringify(serializeGame(st)));
  const back = restoreGame(adv, data);
  assert.deepEqual(back.inventory, ["clau"]);
  assert.equal(back.location.get("clau"), INVENTORY);
  assert.equal(back.states.get("porta"), "oberta");
  assert.equal(back.vars.get("obertes"), 2);
  assert.ok(back.said.has("d:o") && back.seen.has("intro"));
  // Si després s'esborra la clau i l'estat «oberta», la partida es carrega igualment
  const changed = { ...adv, objects: [{ id: "porta", initialState: "tancada", states: [{ id: "tancada" }] }] };
  const partial = restoreGame(changed, data);
  assert.deepEqual(partial.inventory, []);
  assert.equal(partial.location.has("clau"), false);
  assert.equal(partial.states.get("porta"), "tancada");
});

test("ranures de partides, i un navegador que no deixa guardar", () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const saves = createSaves("a1", storage);
  assert.equal(saves.any(), false);
  assert.equal(saves.list().length, 5);
  assert.equal(saves.save(2, { sceneName: "Moll" }), true);
  assert.equal(saves.list()[2].sceneName, "Moll");
  assert.ok(saves.list()[2].savedAt);
  assert.equal(saves.any(), true);
  saves.remove(2);
  assert.equal(saves.any(), false);
  const broken = createSaves("a1", { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); } });
  assert.deepEqual(broken.list(), [null, null, null, null, null]);
  assert.equal(broken.save(0, {}), false);
});
