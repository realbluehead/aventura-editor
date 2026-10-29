// Arrenca el servidor de veritat en un port lliure i amb una carpeta de dades temporal
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { zip, unzip } from "../export.mjs";

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "server.mjs");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

async function startServer(dataDir) {
  const port = 20000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, [SERVER], { env: { ...process.env, PORT: String(port), DATA_DIR: dataDir } });
  let log = "";
  await new Promise((resolve, reject) => {
    child.stdout.on("data", (d) => { log += d; if (log.includes("Editor d'aventures a")) resolve(); });
    child.stderr.on("data", (d) => { log += d; });
    child.on("exit", (code) => reject(new Error(`El servidor ha sortit (${code}): ${log}`)));
  });
  const api = async (method, path, body, type = "application/json") => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: body !== undefined ? { "content-type": type } : undefined,
      body: body === undefined ? undefined : type === "application/json" ? JSON.stringify(body) : body,
    });
    const text = await res.text();
    return { status: res.status, body: text && res.headers.get("content-type")?.includes("json") ? JSON.parse(text) : text };
  };
  return { child, api, log: () => log, base: `http://127.0.0.1:${port}` };
}

let dir, server, api;
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "aventura-test-"));
  server = await startServer(dir);
  api = server.api;
});
after(async () => {
  server.child.kill();
  await rm(dir, { recursive: true, force: true });
});

const square = [[10, 10], [100, 10], [100, 80], [10, 80]];

test("crear una aventura amb escenaris, geometria i sortides", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "  Illa  ", description: "Proves" });
  assert.equal(adv.title, "Illa");
  assert.equal(adv.formatVersion, 9);
  assert.deepEqual(adv.scenes, []);

  const { body: moll } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "Moll" });
  const { body: taverna } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "Taverna" });
  assert.deepEqual(moll.walkable, []);
  assert.deepEqual(moll.hotspots, []);

  const r = await api("PUT", `/api/adventures/${adv.id}/scenes/${moll.id}`, {
    name: "Moll",
    walkable: [[[0.4, 0.6], [50.5, 0], [50, 50]]],
    hotspots: [
      { id: "porta", name: "Porta", description: "", polygon: square, exit: { sceneId: taverna.id, arrival: [20, 30] } },
      { id: "porta", name: "Barril", polygon: square, exit: null },
    ],
  });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.walkable, [[[0, 1], [51, 0], [50, 50]]], "els punts s'arrodoneixen");
  assert.equal(r.body.hotspots[0].id, "porta");
  assert.notEqual(r.body.hotspots[1].id, "porta", "un id repetit se'n genera un de nou");
  assert.deepEqual(r.body.hotspots[0].exit, { sceneId: taverna.id, arrival: [20, 30], conditions: [], blocked: "" });

  // Desar el nom i la descripció des de la finestra no esborra la geometria
  const renamed = await api("PUT", `/api/adventures/${adv.id}/scenes/${moll.id}`, { name: "El moll", description: "" });
  assert.equal(renamed.body.hotspots.length, 2);

  const start = await api("PUT", `/api/adventures/${adv.id}`, { title: "Illa", startSceneId: taverna.id });
  assert.equal(start.body.startSceneId, taverna.id);
  assert.equal(start.body.scenes.length, 2, "editar l'aventura no toca els escenaris");

  // Esborrar la taverna deixa la sortida sense destinació i treu l'escenari inicial
  assert.equal((await api("DELETE", `/api/adventures/${adv.id}/scenes/${taverna.id}`)).status, 204);
  const { body: after } = await api("GET", `/api/adventures/${adv.id}`);
  assert.deepEqual(after.scenes[0].hotspots[0].exit, { sceneId: null, arrival: null, conditions: [], blocked: "" });
  assert.equal(after.startSceneId, null);
});

test("la validació rebutja geometria i referències incorrectes", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "Validació" });
  const { body: s } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "A" });
  const put = (body) => api("PUT", `/api/adventures/${adv.id}/scenes/${s.id}`, { name: "A", ...body });

  assert.equal((await put({ walkable: [[[0, 0], [1, 1]]] })).status, 400, "menys de 3 punts");
  assert.equal((await put({ walkable: [[[0, 0], [1, "x"], [2, 2]]] })).status, 400, "punt no numèric");
  assert.equal((await put({ walkable: "no" })).status, 400);
  assert.equal((await put({ hotspots: [{ name: "", polygon: square }] })).status, 400, "punt calent sense nom");
  assert.equal((await put({ hotspots: [{ name: "P", polygon: square, exit: { sceneId: "no-existeix" } }] })).status, 400);
  assert.equal((await put({ hotspots: [{ name: "P", polygon: square, exit: { sceneId: null, arrival: [1] } }] })).status, 400);
  assert.equal((await api("PUT", `/api/adventures/${adv.id}`, { title: "V", startSceneId: "no-existeix" })).status, 400);
  assert.equal((await api("PUT", `/api/adventures/${adv.id}`, [1, 2])).status, 400, "el cos ha de ser un objecte");

  assert.equal((await put({ actorHeight: { near: 0, far: 20 } })).status, 400, "alçada fora de límits");
  assert.equal((await put({ actorHeight: { near: 60 } })).status, 400, "cal l'alçada a prop i lluny");
  assert.deepEqual((await put({ actorHeight: { near: 60.4, far: 40 } })).body.actorHeight, { near: 60, far: 40 });
  assert.equal((await put({ actorHeight: null })).body.actorHeight, null);

  const ok = await put({ hotspots: [{ name: "Sortida", polygon: square, exit: { sceneId: null, arrival: null } }], mapPosition: [-20.4, 300] });
  assert.equal(ok.status, 200, "una sortida sense destinació es pot desar");
  assert.deepEqual(ok.body.mapPosition, [-20, 300]);
});

test("imatges de fons: pujar, servir i esborrar amb l'aventura", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "Imatges" });
  const { body: s } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "A" });
  const up = await api("PUT", `/api/adventures/${adv.id}/scenes/${s.id}/background`, PNG, "image/png");
  assert.equal(up.status, 200);
  const file = up.body.background;
  assert.match(file, /\.png$/);
  assert.deepEqual(await readdir(join(dir, "adventures", adv.id, "images")), [file]);
  assert.equal((await api("GET", `/files/${adv.id}/${file}`)).status, 200);
  for (const path of [`/files/${adv.id}/..`, `/files/${adv.id}/..%2Fadventure.json`, `/files/${adv.id}/%2e%2e/adventure.json`]) {
    assert.notEqual((await api("GET", path)).status, 200, `no es pot sortir de la carpeta d'imatges: ${path}`);
  }
  assert.equal((await api("PUT", `/api/adventures/${adv.id}/scenes/${s.id}/background`, "<svg/>", "image/svg+xml")).status, 415);

  assert.equal((await api("DELETE", `/api/adventures/${adv.id}`)).status, 204);
  await assert.rejects(readdir(join(dir, "adventures", adv.id)), "la carpeta de l'aventura s'esborra sencera");
});

test("migra les dades del format 1 (un sol fitxer)", async () => {
  const old = await mkdtemp(join(tmpdir(), "aventura-v1-"));
  await mkdir(join(old, "images"));
  await writeFile(join(old, "images", "s1-1.png"), PNG);
  await writeFile(join(old, "adventures.json"), JSON.stringify({
    adventures: [
      { id: "a1", title: "Antiga", description: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
        scenes: [
          { id: "s1", name: "Amb fons", description: "", background: "s1-1.png" },
          { id: "s2", name: "Imatge perduda", description: "", background: "no-hi-es.png" },
        ] },
      { id: "a2", title: "Sense escenaris", description: "" },
    ],
  }));
  const s = await startServer(old);
  try {
    const { body: list } = await s.api("GET", "/api/adventures");
    assert.equal(list.length, 2);
    const a1 = list.find((a) => a.id === "a1");
    assert.equal(a1.formatVersion, 9);
    assert.equal(a1.scenes[0].actorHeight, null);
    assert.equal(a1.scenes[0].background, "s1-1.png");
    assert.equal(a1.scenes[1].background, null, "la imatge que faltava queda com a sense fons");
    assert.deepEqual(a1.scenes[0].walkable, []);
    assert.deepEqual(list.find((a) => a.id === "a2").scenes, []);
    assert.equal((await s.api("GET", "/files/a1/s1-1.png")).status, 200);
    assert.ok(JSON.parse(await readFile(join(old, "adventures.json.v1-migrat"), "utf8")), "es guarda una còpia de l'original");
    assert.match(s.log(), /Migrades 2 aventures/);
  } finally {
    s.child.kill();
    await rm(old, { recursive: true, force: true });
  }
});

const dataUrl = (buf, type = "image/png") => `data:${type};base64,${buf.toString("base64")}`;

test("verbs: per defecte els 9 clàssics, editables, i «Mira» no es pot treure", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "Verbs" });
  assert.equal(adv.verbs.length, 9);
  assert.ok(adv.verbs.some((v) => v.id === "look"));
  const verbs = [{ id: "look", name: "Examina", response: "Res." }, { name: "Llepa", response: "Puaj." }];
  const r = await api("PUT", `/api/adventures/${adv.id}`, { title: "Verbs", verbs });
  assert.equal(r.status, 200);
  assert.equal(r.body.verbs[0].name, "Examina");
  assert.match(r.body.verbs[1].id, /^[\w-]+$/, "un verb nou rep un id");
  assert.equal((await api("PUT", `/api/adventures/${adv.id}`, { title: "Verbs", verbs: [{ id: "x", name: "X" }] })).status, 400);
  assert.equal((await api("PUT", `/api/adventures/${adv.id}`, { title: "Verbs", verbs: [{ id: "look", name: "" }] })).status, 400);
});

test("objectes: imatges per estat, col·locació en un sol escenari i neteja en esborrar", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "Objectes" });
  const imgDir = join(dir, "adventures", adv.id, "images");
  const { body: s1 } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "A" });
  const { body: s2 } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "B" });

  const create = await api("POST", `/api/adventures/${adv.id}/objects`, {
    name: "Porta", description: "Una porta de fusta.", pickable: false,
    states: [{ id: "tancada", name: "Tancada", image: dataUrl(PNG) }, { id: "oberta", name: "Oberta", image: null }],
    initialState: "tancada",
  });
  assert.equal(create.status, 201);
  const door = create.body;
  assert.equal(door.initialState, "tancada");
  assert.match(door.states[0].image, /\.png$/);
  assert.deepEqual(await readdir(imgDir), [door.states[0].image]);

  assert.equal((await api("POST", `/api/adventures/${adv.id}/objects`, { name: "X", states: [] })).status, 400, "cal un estat");
  assert.equal((await api("POST", `/api/adventures/${adv.id}/objects`, { name: "X", states: [{ name: "a", image: "../adventure.json" }] })).status, 400,
    "no es pot apuntar a fitxers que no són de l'objecte");
  assert.equal((await api("POST", `/api/adventures/${adv.id}/objects`, { name: "X", states: [{ name: "a", image: "data:image/svg+xml;base64,PHN2Zy8+" }] })).status, 400);

  // Canviar la imatge d'un estat esborra la vella; conservar-la per nom la manté
  const upd = await api("PUT", `/api/adventures/${adv.id}/objects/${door.id}`, {
    ...door, states: [{ ...door.states[0], image: dataUrl(PNG) }, { ...door.states[1], image: door.states[0].image }],
  });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.states[1].image, door.states[0].image);
  const third = await api("PUT", `/api/adventures/${adv.id}/objects/${door.id}`, { ...upd.body, states: [upd.body.states[0]] });
  assert.deepEqual(await readdir(imgDir), [third.body.states[0].image], "la imatge que ja no es fa servir s'esborra");

  // Col·locar-lo a A i després a B: només queda a B
  const place = (scene, extra = {}) => api("PUT", `/api/adventures/${adv.id}/scenes/${scene.id}`, {
    name: scene.name, objects: [{ objectId: door.id, position: [10.4, 20], ...extra }],
  });
  const p1 = await place(s1, { facing: "left", layer: "front", walkTo: [5, 30] });
  assert.deepEqual(p1.body.objects, [{ objectId: door.id, position: [10, 20], walkTo: [5, 30], facing: "left", layer: "front" }]);
  await place(s2, { facing: "cap", layer: "?" });
  const { body: after } = await api("GET", `/api/adventures/${adv.id}`);
  assert.deepEqual(after.scenes[0].objects, []);
  assert.equal(after.scenes[1].objects[0].facing, "auto", "valors desconeguts tornen a auto");
  assert.equal((await place(s1, { position: "x" })).status, 400);
  assert.equal((await api("PUT", `/api/adventures/${adv.id}/scenes/${s1.id}`, { name: "A", objects: [{ objectId: "no", position: [1, 1] }] })).status, 400);

  assert.equal((await api("DELETE", `/api/adventures/${adv.id}/objects/${door.id}`)).status, 204);
  const { body: gone } = await api("GET", `/api/adventures/${adv.id}`);
  assert.deepEqual(gone.objects, []);
  assert.deepEqual(gone.scenes[1].objects, [], "esborrar l'objecte el treu dels escenaris");
  assert.deepEqual(await readdir(imgDir), []);
});

test("variables i regles: es validen per la forma i es conserven si apunten a coses esborrades", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "Regles" });
  assert.equal(adv.verbs.find((v) => v.id === "use").preposition, "amb");
  const put = (body) => api("PUT", `/api/adventures/${adv.id}`, { title: "Regles", ...body });

  const vars = await put({ variables: [{ id: "n", name: "Monedes", type: "number", initial: "3" }, { name: "Avisat", type: "bool", initial: true }] });
  assert.equal(vars.status, 200);
  assert.deepEqual(vars.body.variables[0], { id: "n", name: "Monedes", type: "number", initial: 3 });
  assert.equal((await put({ variables: [{ name: "A" }, { name: "a" }] })).status, 400, "noms repetits");

  const rule = {
    verb: "use", target: { kind: "object", id: "clau" }, with: { kind: "object", id: "porta" },
    conditions: [{ type: "var", varId: "n", op: ">=", value: 2 }, { type: "has", objectId: "clau", not: true }],
    actions: [{ type: "say", text: "Hola" }, { type: "goto", sceneId: "taverna", arrival: [10.6, 20] }, { type: "wait", seconds: 99 }],
  };
  const ok = await put({ rules: [rule] });
  assert.equal(ok.status, 200, "les referències a coses que no existeixen es poden desar");
  const saved = ok.body.rules[0];
  assert.ok(saved.id);
  assert.deepEqual(saved.actions[1], { type: "goto", sceneId: "taverna", arrival: [11, 20] });
  assert.equal(saved.actions[2].seconds, 60, "l'espera té un màxim");
  assert.equal(saved.conditions[1].not, true);

  assert.equal((await put({ rules: [{ ...rule, verb: "" }] })).status, 400, "cal un verb");
  assert.equal((await put({ rules: [{ ...rule, target: { kind: "nau", id: "x" } }] })).status, 400);
  assert.equal((await put({ rules: [{ ...rule, conditions: [{ type: "màgia" }] }] })).status, 400);
  assert.equal((await put({ rules: [{ ...rule, actions: [{ type: "say", text: "" }] }] })).status, 400, "dir res no té sentit");
  assert.equal((await put({ rules: [{ ...rule, actions: [{ type: "take" }] }] })).status, 400);
});

test("personatges: full de sprites, animacions, protagonista i col·locacions", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "Personatges" });
  assert.deepEqual(adv.characters, []);
  assert.equal(adv.playerId, null);
  const imgDir = join(dir, "adventures", adv.id, "images");
  const { body: s1 } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "A" });
  const { body: s2 } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "B" });

  const created = await api("POST", `/api/adventures/${adv.id}/characters`, {
    name: "Guybrush", color: "#AABBCC", sheet: dataUrl(PNG), frameWidth: 16, frameHeight: 32,
    animations: { "walk-side": { frames: [1, 2, 3, -1, 2.5], fps: 99 }, "idle-down": { frames: [] }, "fly-side": { frames: [1] } },
  });
  assert.equal(created.status, 201);
  const hero = created.body;
  assert.equal(hero.color, "#aabbcc");
  assert.deepEqual(hero.animations, { "walk-side": { frames: [1, 2, 3], fps: 30 } }, "només fotogrames vàlids i animacions conegudes");
  assert.deepEqual(await readdir(imgDir), [hero.sheet]);
  const { body: pirate } = await api("POST", `/api/adventures/${adv.id}/characters`, { name: "Pirata", frameWidth: 0 });
  assert.equal(pirate.frameWidth, 32, "mida no vàlida torna al valor per defecte");
  assert.equal(pirate.sheet, null);

  assert.equal((await api("PUT", `/api/adventures/${adv.id}`, { title: "P", playerId: "no" })).status, 400);
  assert.equal((await api("PUT", `/api/adventures/${adv.id}`, { title: "P", playerId: hero.id })).body.playerId, hero.id);

  // Col·locar el pirata a A i després a B: només queda a B
  const place = (scene, extra = {}) => api("PUT", `/api/adventures/${adv.id}/scenes/${scene.id}`, {
    name: scene.name, characters: [{ characterId: pirate.id, position: [50, 60], ...extra }],
  });
  assert.equal((await place(s1, { facing: "left" })).body.characters[0].facing, "left");
  assert.equal((await place(s2, { facing: "volant" })).body.characters[0].facing, "down", "valors desconeguts tornen a «de cara»");
  let { body: now } = await api("GET", `/api/adventures/${adv.id}`);
  assert.deepEqual(now.scenes[0].characters, []);
  assert.equal((await place(s1, { characterId: "no" })).status, 400);

  // Regles amb personatges: com a cosa i com a qui parla
  const rule = { verb: "give", target: { kind: "object", id: "rom" }, with: { kind: "character", id: pirate.id },
    conditions: [], actions: [{ type: "say", text: "Gràcies!", by: pirate.id }] };
  const r = await api("PUT", `/api/adventures/${adv.id}`, { title: "P", rules: [rule] });
  assert.equal(r.status, 200);
  assert.equal(r.body.rules[0].actions[0].by, pirate.id);

  // Esborrar el protagonista: torna la figura provisional i s'esborra el seu full
  assert.equal((await api("DELETE", `/api/adventures/${adv.id}/characters/${hero.id}`)).status, 204);
  assert.equal((await api("DELETE", `/api/adventures/${adv.id}/characters/${pirate.id}`)).status, 204);
  ({ body: now } = await api("GET", `/api/adventures/${adv.id}`));
  assert.equal(now.playerId, null);
  assert.deepEqual(now.scenes[1].characters, []);
  assert.deepEqual(await readdir(imgDir), []);
});

test("diàlegs: es validen, i les opcions que porten a nodes esborrats acaben la conversa", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "Diàlegs" });
  assert.deepEqual(adv.dialogues, []);
  const put = (dialogues) => api("PUT", `/api/adventures/${adv.id}`, { title: "D", dialogues });
  const dialogue = {
    id: "d1", name: "Conversa", characterId: "pirata", start: "no-hi-és",
    nodes: [
      { id: "n1", position: [10.4, 20], lines: [{ by: "pirata", text: "Arrr" }, { text: "Hola" }], options: [
        { id: "o1", text: "Qui ets?", once: true, conditions: [{ type: "said", dialogueId: "d1", optionId: "o2", not: true }],
          actions: [{ type: "dialogue", dialogueId: "d1" }], next: "n2" },
        { id: "o2", text: "Adéu", next: "esborrat" },
      ] },
      { id: "n2", lines: [], options: [] },
    ],
  };
  const r = await put([dialogue]);
  assert.equal(r.status, 200);
  const d = r.body.dialogues[0];
  assert.equal(d.start, "n1", "un inici que no existeix passa al primer node");
  assert.deepEqual(d.nodes[0].position, [10, 20]);
  assert.equal(d.nodes[0].lines[1].by, null, "sense «by», ho diu el protagonista");
  assert.equal(d.nodes[0].options[0].once, true);
  assert.equal(d.nodes[0].options[1].next, null, "una opció cap a un node que no hi és acaba la conversa");
  assert.equal(d.nodes[0].options[0].conditions[0].type, "said");

  assert.equal((await put([{ ...dialogue, name: "" }])).status, 400, "cal nom");
  assert.equal((await put([{ ...dialogue, nodes: [] }])).status, 400, "cal almenys un node");
  assert.equal((await put([{ ...dialogue, nodes: [{ id: "n", lines: [{ text: "" }], options: [] }] }])).status, 400, "frases buides no");
  assert.equal((await put([{ ...dialogue, nodes: [{ id: "n", lines: [], options: [{ text: "" }] }] }])).status, 400, "opcions buides no");
});

test("sons, seqüències, música i transició dels escenaris, i pantalla de títol", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "So" });
  assert.equal(adv.cursor, "cross");
  assert.deepEqual(adv.titleScreen, { image: null, subtitle: "", music: null });
  const imgDir = join(dir, "adventures", adv.id, "images");
  const WAV = Buffer.from("RIFF0000WAVEfmt ");

  const created = await api("POST", `/api/adventures/${adv.id}/sounds`, { name: "Tema", file: dataUrl(WAV, "audio/wav") });
  assert.equal(created.status, 201);
  const theme = created.body;
  assert.match(theme.file, /\.wav$/);
  assert.equal((await api("GET", `/files/${adv.id}/${theme.file}`)).status, 200);
  assert.equal((await api("POST", `/api/adventures/${adv.id}/sounds`, { name: "X", file: dataUrl(PNG) })).status, 400, "una imatge no és un so");
  assert.equal((await api("POST", `/api/adventures/${adv.id}/sounds`, { name: "X" })).status, 400, "cal el fitxer");

  const { body: s } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "A" });
  assert.equal(s.transition, "fade");
  const put = await api("PUT", `/api/adventures/${adv.id}/scenes/${s.id}`, { name: "A", music: theme.id, transition: "iris", onEnter: { cutsceneId: "c1" } });
  assert.equal(put.body.music, theme.id);
  assert.equal(put.body.transition, "iris");
  assert.deepEqual(put.body.onEnter, { cutsceneId: "c1", once: true }, "per defecte, només la primera vegada");
  assert.equal((await api("PUT", `/api/adventures/${adv.id}/scenes/${s.id}`, { name: "A", transition: "explosió" })).body.transition, "fade");

  const r = await api("PUT", `/api/adventures/${adv.id}`, {
    title: "So", cursor: "system", credits: "Fet per mi", introCutsceneId: "c1",
    titleScreen: { image: dataUrl(PNG), subtitle: "Una aventura", music: theme.id },
    cutscenes: [{ id: "c1", name: "Intro", actions: [
      { type: "walk", point: [10.2, 20], by: null, sceneId: s.id }, { type: "sound", soundId: theme.id },
      { type: "music", soundId: null }, { type: "cutscene", cutsceneId: "c1" },
    ] }],
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.cursor, "system");
  assert.match(r.body.titleScreen.image, /\.png$/);
  assert.deepEqual(r.body.cutscenes[0].actions[0], { type: "walk", point: [10, 20], by: null, sceneId: s.id });
  assert.deepEqual(r.body.cutscenes[0].actions[2], { type: "music", soundId: null }, "sense so, la música s'atura");
  assert.equal((await api("PUT", `/api/adventures/${adv.id}`, { title: "So", cutscenes: [{ name: "", actions: [] }] })).status, 400);
  assert.equal((await api("PUT", `/api/adventures/${adv.id}`, { title: "So", cutscenes: [{ name: "X", actions: [{ type: "walk" }] }] })).status, 400, "caminar demana el punt");

  // Canviar la imatge del títol esborra la vella; esborrar el so treu la música de l'escenari i del títol
  const old = r.body.titleScreen.image;
  const r2 = await api("PUT", `/api/adventures/${adv.id}`, { title: "So", titleScreen: { ...r.body.titleScreen, image: null } });
  assert.equal(r2.body.titleScreen.image, null);
  assert.ok(!(await readdir(imgDir)).includes(old));
  assert.equal((await api("DELETE", `/api/adventures/${adv.id}/sounds/${theme.id}`)).status, 204);
  const { body: after } = await api("GET", `/api/adventures/${adv.id}`);
  assert.equal(after.scenes[0].music, null);
  assert.equal(after.titleScreen.music, null);
  assert.deepEqual(await readdir(imgDir), []);
});

test("exportar el joc en un zip i tornar-lo a importar com una aventura nova", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "L'illa àvida" });
  const { body: s } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "Moll" });
  const { body: bg } = await api("PUT", `/api/adventures/${adv.id}/scenes/${s.id}/background`, PNG, "image/png");

  const res = await fetch(`${server.base}/api/adventures/${adv.id}/export`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "application/zip");
  assert.match(res.headers.get("content-disposition"), /filename="l-illa-avida\.zip"/);
  const zipped = Buffer.from(await res.arrayBuffer());
  const names = unzip(zipped).map((e) => e.name);
  for (const n of ["index.html", "game.js", "adventure.js", "adventure.json", "player.css", "LLEGEIX-ME.txt", `files/${bg.background}`]) assert.ok(names.includes(n), n);
  const html = unzip(zipped).find((e) => e.name === "index.html").data.toString();
  assert.match(html, /<title>L&#39;illa àvida<\/title>/, "el títol va escapat");

  const imported = await api("POST", "/api/import", zipped, "application/zip");
  assert.equal(imported.status, 201);
  assert.notEqual(imported.body.id, adv.id, "és una aventura nova");
  assert.equal(imported.body.title, "L'illa àvida");
  assert.equal(imported.body.scenes[0].name, "Moll");
  assert.equal((await api("GET", `/files/${imported.body.id}/${bg.background}`)).status, 200, "els fitxers també s'importen");

  // Un zip fet comprimint la carpeta (tot dins d'una carpeta) també val, i els camins estranys s'ignoren
  const inFolder = zip([
    { name: "joc/adventure.json", data: Buffer.from(JSON.stringify({ title: "Carpeta", scenes: [] })) },
    { name: "joc/files/../../fora.txt", data: Buffer.from("no") },
    { name: "joc/files/bo.png", data: PNG },
  ]);
  const r2 = await api("POST", "/api/import", inFolder, "application/zip");
  assert.equal(r2.status, 201);
  assert.deepEqual(await readdir(join(dir, "adventures", r2.body.id, "images")), ["bo.png"]);

  assert.equal((await api("POST", "/api/import", Buffer.from("hola"), "application/zip")).status, 400);
  assert.equal((await api("POST", "/api/import", zip([{ name: "x.txt", data: Buffer.from("x") }]), "application/zip")).status, 400, "cal un adventure.json");
});

test("sortides amb condicions i el que es diu si no es pot passar", async () => {
  const { body: adv } = await api("POST", "/api/adventures", { title: "Portes" });
  const { body: a } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "A" });
  const { body: b } = await api("POST", `/api/adventures/${adv.id}/scenes`, { name: "B" });
  const door = (exit) => api("PUT", `/api/adventures/${adv.id}/scenes/${a.id}`, {
    name: "A", hotspots: [{ name: "Porta", polygon: [[0, 0], [5, 0], [5, 5]], exit }],
  });
  const r = await door({ sceneId: b.id, arrival: [1, 1], conditions: [{ type: "has", objectId: "clau" }], blocked: "Està tancat." });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.hotspots[0].exit, { sceneId: b.id, arrival: [1, 1], conditions: [{ type: "has", objectId: "clau", not: false }], blocked: "Està tancat." });
  assert.deepEqual((await door({ sceneId: b.id })).body.hotspots[0].exit.conditions, [], "sense condicions, sempre oberta");
  assert.equal((await door({ sceneId: b.id, conditions: [{ type: "màgia" }] })).status, 400);
});
