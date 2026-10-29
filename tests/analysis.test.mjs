import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, F } from "../public/js/analysis.js";
import { DEFAULT_VERBS } from "../public/js/defaults.js";

// Una aventura mínima: la clau és a la taverna, el barril al moll, i obrir el barril amb la clau acaba el joc
function base() {
  const hotspot = (id, name, to) => ({ id, name, description: "", polygon: [[0, 0], [1, 0], [1, 1]], exit: to ? { sceneId: to, arrival: [0, 0] } : null });
  return {
    startSceneId: "moll",
    playerId: null,
    verbs: structuredClone(DEFAULT_VERBS),
    scenes: [
      { id: "moll", name: "Moll", background: "f.png", walkable: [[[0, 0], [9, 0], [9, 9]]], hotspots: [hotspot("h1", "Porta", "taverna")],
        objects: [{ objectId: "barril", position: [0, 0] }], characters: [] },
      { id: "taverna", name: "Taverna", background: "f.png", walkable: [[[0, 0], [9, 0], [9, 9]]], hotspots: [hotspot("h2", "Sortida", "moll")],
        objects: [{ objectId: "clau", position: [0, 0] }], characters: [{ characterId: "pirata", position: [0, 0] }] },
    ],
    objects: [
      { id: "clau", name: "Clau", pickable: true, initialState: "n", states: [{ id: "n", name: "Normal" }] },
      { id: "barril", name: "Barril", pickable: false, initialState: "tancat", states: [{ id: "tancat", name: "Tancat" }, { id: "obert", name: "Obert" }] },
    ],
    characters: [{ id: "pirata", name: "Pirata" }],
    variables: [],
    dialogues: [],
    rules: [
      { id: "r-fi", verb: "use", target: { kind: "object", id: "clau" }, with: { kind: "object", id: "barril" }, conditions: [],
        actions: [{ type: "setState", objectId: "barril", stateId: "obert" }, { type: "end", text: "Fi" }] },
    ],
  };
}
const texts = (r, level) => r.issues.filter((i) => !level || i.level === level).map((i) => i.text);

test("una aventura que es pot acabar, i el camí cap al final", () => {
  const r = analyze(base());
  assert.equal(r.canFinish, true);
  assert.deepEqual(texts(r, "error"), []);
  assert.ok(r.chart.critical.has("rule:r-fi"));
  assert.ok(r.chart.critical.has("pickup:clau"), "cal agafar la clau");
  assert.ok(r.chart.critical.has("exit:h1"), "cal anar a la taverna");
  assert.ok(r.chart.edges.some(([from, to]) => from === "pickup:clau" && to === "rule:r-fi"));
});

test("si la clau és en un escenari on no es pot arribar, no es pot acabar i diu per què", () => {
  const a = base();
  a.scenes[0].hotspots = [];   // el moll ja no porta a la taverna
  const r = analyze(a);
  assert.equal(r.canFinish, false);
  assert.ok(texts(r, "error").some((t) => t.includes("No es pot arribar al final") && t.includes("tenir «Clau»")), texts(r).join("\n"));
  assert.ok(texts(r).includes("No es pot arribar mai a «Taverna»."));
  assert.ok(texts(r).some((t) => t.includes("necessiten tenir «Clau»")));
});

test("sense cap acció de final, ho diu", () => {
  const a = base();
  a.rules[0].actions = [{ type: "say", text: "Clic" }];
  const r = analyze(a);
  assert.equal(r.hasEnding, false);
  assert.ok(texts(r, "error")[0].includes("Cap regla, opció de diàleg ni seqüència acaba el joc"));
});

test("atzucacs: un escenari d'on no es pot tornar on s'acaba el joc", () => {
  const a = base();
  a.scenes[1].hotspots = [];   // de la taverna no se'n pot sortir
  const r = analyze(a);
  assert.ok(texts(r, "warn").includes("Si el jugador arriba a «Taverna», ja no pot tornar on s'acaba el joc."), texts(r).join("\n"));
});

test("un diàleg que dona la clau desbloqueja el final", () => {
  const a = base();
  a.objects[0].pickable = false;               // la clau ja no es pot agafar del terra
  a.scenes[1].objects = [];
  a.dialogues = [{ id: "d", name: "Xerrada", characterId: "pirata", start: "n1", nodes: [
    { id: "n1", lines: [], options: [
      { id: "o1", text: "Hola", conditions: [], actions: [], next: "n2" },
      { id: "o2", text: "Mai", conditions: [{ type: "has", objectId: "barril" }], actions: [], next: null },
    ] },
    { id: "n2", lines: [], options: [{ id: "o3", text: "La clau?", conditions: [{ type: "said", dialogueId: "d", optionId: "o1" }], actions: [{ type: "take", objectId: "clau" }], next: null }] },
    { id: "n3", lines: [{ text: "Ningú no hi arriba" }], options: [] },
  ] }];
  const r = analyze(a);
  assert.equal(r.canFinish, true);
  assert.ok(r.chart.critical.has("option:d:o3"));
  assert.ok(r.chart.critical.has("talk:d"));
  assert.ok(texts(r).some((t) => t.includes("«Mai»") && t.includes("tenir «Barril»")), "l'opció que demana una cosa impossible");
  assert.ok(texts(r).some((t) => t.includes("Ningú no hi arriba")), "el node on no porta cap opció");
});

test("variables: sumes, valors que no s'assoleixen i variables que no canvien", () => {
  const a = base();
  a.variables = [
    { id: "monedes", name: "monedes", type: "number", initial: 0 },
    { id: "fixa", name: "fixa", type: "bool", initial: false },
    { id: "sobra", name: "sobra", type: "text", initial: "" },
    { id: "comptador", name: "comptador", type: "number", initial: 0 },
  ];
  a.rules.push(
    { id: "r-cobra", verb: "push", target: { kind: "object", id: "barril" }, with: null, conditions: [], actions: [{ type: "setVar", varId: "monedes", op: "add", value: 1 }] },
    { id: "r-rica", verb: "pull", target: { kind: "object", id: "barril" }, with: null, conditions: [{ type: "var", varId: "monedes", op: ">=", value: 5 }], actions: [] },
    { id: "r-compta", verb: "close", target: { kind: "object", id: "barril" }, with: null, conditions: [], actions: [{ type: "setVar", varId: "comptador", op: "set", value: 1 }] },
    { id: "r-mai", verb: "open", target: { kind: "object", id: "barril" }, with: null, conditions: [{ type: "var", varId: "fixa", op: "==", value: true }], actions: [] },
  );
  const r = analyze(a);
  assert.ok(r.steps.find((s) => s.id === "rule:r-rica").round !== null, "amb sumes, es pot arribar a 5");
  assert.equal(r.steps.find((s) => s.id === "rule:r-mai").round, null);
  assert.ok(texts(r).some((t) => t.includes("«fixa» no arriba mai a complir la condició")));
  assert.ok(texts(r).includes("La variable «fixa» no canvia mai: les condicions sobre ella sempre donen el mateix."));
  assert.ok(texts(r, "info").includes("Ningú no fa servir la variable «sobra»."));
  assert.ok(texts(r, "info").includes("La variable «comptador» canvia, però cap condició no la mira."));
});

test("referències trencades i personatges que no són enlloc", () => {
  const a = base();
  a.scenes[1].characters = [];
  a.rules.push({ id: "r-x", verb: "talk", target: { kind: "character", id: "pirata" }, with: null, conditions: [], actions: [{ type: "take", objectId: "fantasma" }] });
  const r = analyze(a);
  assert.ok(texts(r, "error").some((t) => t.includes("està trencada") && t.includes("l'objecte ja no existeix")));
  assert.ok(texts(r, "warn").some((t) => t.includes("«Pirata» no és a cap escenari")));
  assert.ok(!r.facts.has(F.has("fantasma")));
});

test("una seqüència en entrar a un escenari pot acabar el joc", () => {
  const a = base();
  a.rules = [];
  a.cutscenes = [{ id: "fi", name: "Final", actions: [{ type: "say", text: "Ja som aquí" }, { type: "end", text: "Fi" }] }];
  a.scenes[1].onEnter = { cutsceneId: "fi", once: true };
  const r = analyze(a);
  assert.equal(r.canFinish, true);
  assert.ok(r.chart.critical.has("cutscene:fi"));
  assert.ok(r.chart.critical.has("exit:h1"), "cal entrar a la taverna");
  a.cutscenes.push({ id: "sola", name: "Oblidada", actions: [] });
  assert.ok(texts(analyze(a), "info").includes("La seqüència «Oblidada» no es fa mai: res no la comença."));
});

test("una sortida tancada amb condicions només s'obre quan es compleixen", () => {
  const a = base();
  a.scenes[0].hotspots[0].exit.conditions = [{ type: "has", objectId: "barril" }];   // mai es tindrà el barril
  const r = analyze(a);
  assert.equal(r.canFinish, false);
  assert.ok(texts(r).includes("No es pot arribar mai a «Taverna»."));
  a.scenes[0].hotspots[0].exit.conditions = [{ type: "state", objectId: "barril", stateId: "tancat" }];   // sempre ho és al principi
  assert.equal(analyze(a).canFinish, true);
});

test("una variable que només mira una sortida amb condicions no surt com a «cap condició no la mira»", () => {
  const a = base();
  a.variables = [{ id: "v", name: "porta_oberta", type: "bool", initial: false }];
  a.rules.push({ id: "r-v", verb: "push", target: { kind: "hotspot", id: "h2" }, with: null, conditions: [], actions: [{ type: "setVar", varId: "v", op: "set", value: true }] });
  a.scenes[1].hotspots[0].exit.conditions = [{ type: "var", varId: "v", op: "==", value: true }];
  const r = analyze(a);
  assert.ok(!texts(r).some((t) => t.includes("porta_oberta")), texts(r).join("\n"));
});
