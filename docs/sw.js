(() => {
"use strict";
const modules = {};

// defaults.js
modules["defaults.js"] = (() => {

// Valors per defecte compartits pel servidor i la interfície

// Els 9 verbs clàssics, en l'ordre de la graella de 3×3 de Monkey Island 2.
// «response» és el que diu el personatge quan el verb no té cap efecte sobre una cosa.
// «look» és especial: amb un objecte o un punt calent, el personatge en diu la descripció.
// «preposition» fa que el verb pugui unir dos objectes: «Fes servir la clau amb la porta», «Dóna el rom al pirata».
// «key» és la drecera de teclat del joc (una lletra o un número, o "" si no en té).
const DEFAULT_VERBS = [
  { id: "give", name: "Dóna", response: "No crec que ho vulgui.", preposition: "a", key: "d" },
  { id: "pickup", name: "Agafa", response: "No ho puc agafar.", key: "a" },
  { id: "use", name: "Fes servir", response: "No sé com fer-ho servir.", preposition: "amb", key: "f" },
  { id: "open", name: "Obre", response: "No es pot obrir.", key: "o" },
  { id: "look", name: "Mira", response: "No hi veig res d'especial.", key: "m" },
  { id: "push", name: "Empeny", response: "No es mou.", key: "e" },
  { id: "close", name: "Tanca", response: "No es pot tancar.", key: "t" },
  { id: "talk", name: "Parla amb", response: "No crec que em contesti.", key: "p" },
  { id: "pull", name: "Estira", response: "No es mou.", key: "s" },
].map((v) => ({ preposition: "", ...v }));

// Les tecles que poden ser drecera d'un verb
const VERB_KEY = /^[a-z0-9ç]$/;

const LOOK = "look";
const PICKUP = "pickup";

// Tipus de condicions i accions de les regles (el servidor les valida i el reproductor les executa)
const CONDITION_TYPES = ["has", "state", "var", "said"];
const ACTION_TYPES = ["say", "take", "lose", "setState", "setVar", "goto", "wait", "dialogue", "end", "walk", "sound", "music", "cutscene"];
const VARIABLE_TYPES = ["bool", "number", "text"];
const OPS = ["==", "!=", "<", ">", "<=", ">="];

// Animacions dels personatges: tres accions en tres direccions. «side» és mirant a la dreta (a l'esquerra s'emmiralla),
// «down» és de cara a la càmera i «up» d'esquena. Cada animació és una llista de fotogrames del full de sprites.
const ANIMATIONS = ["idle", "walk", "talk"];
const DIRECTIONS = ["side", "down", "up"];
const ANIMATION_KEYS = ANIMATIONS.flatMap((a) => DIRECTIONS.map((d) => `${a}-${d}`));
const CHARACTER_FACINGS = ["down", "left", "right", "up"];

// Com s'entra a un escenari: fos a negre, tall sec, o el cercle que es tanca sobre el protagonista
const TRANSITIONS = ["fade", "cut", "iris"];
const CURSORS = ["cross", "system"];

return { DEFAULT_VERBS, VERB_KEY, LOOK, PICKUP, CONDITION_TYPES, ACTION_TYPES, VARIABLE_TYPES, OPS, ANIMATIONS, DIRECTIONS, ANIMATION_KEYS, CHARACTER_FACINGS, TRANSITIONS, CURSORS };
})();

// backend/core.js
modules["backend/core.js"] = (() => {
const { DEFAULT_VERBS, LOOK, CONDITION_TYPES, ACTION_TYPES, VARIABLE_TYPES, OPS, ANIMATION_KEYS, CHARACTER_FACINGS, TRANSITIONS, CURSORS, VERB_KEY } = modules["defaults.js"];
// El cor del servidor: validació i API de les aventures, sense res de Node.
// El fa servir el servidor local (server.mjs, amb les dades en carpetes) i el service worker de la versió web
// (sw.js, amb les dades a IndexedDB del navegador). On es guarden les coses ho decideix «store», i com es
// fan i es llegeixen els zips, «platform»: totes dues coses es passen a configure().


let store, platform;

// store: { list(), load(id), save(adventure), remove(id), putFile(id, name, bytes), getFile(id, name), removeFile(id, name), files(id) }
// platform: { zip(entries), unzip(bytes), exportFiles(adventure, files), zipName(title) }. Els fitxers són Uint8Array.
function configure(s, p) {
  store = s;
  platform = p;
}

const TYPES = { ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".weba": "audio/webm", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };
// Formats d'imatge acceptats per als fons (l'SVG queda fora perquè pot portar scripts)
const IMAGE_EXT = { "image/png": ".png", "image/jpeg": ".jpg", "image/gif": ".gif", "image/webp": ".webp" };
const AUDIO_EXT = { "audio/mpeg": ".mp3", "audio/mp3": ".mp3", "audio/ogg": ".ogg", "audio/wav": ".wav", "audio/x-wav": ".wav", "audio/wave": ".wav", "audio/webm": ".weba" };
const MAX_AUDIO = 10 * 1024 * 1024;
const MAX_IMPORT = 300 * 1024 * 1024;
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_SPRITE = 5 * 1024 * 1024;

// Versió del format de adventure.json. Si canvia, upgrade() ha de saber portar les aventures antigues al nou format.
const FORMAT_VERSION = 10;
const LIMITS = {
  title: 120, name: 120, description: 5000, response: 500, preposition: 20, text: 500,
  shapes: 100, points: 500, verbs: 20, objects: 300, states: 20,
  variables: 200, rules: 2000, conditions: 20, actions: 50, characters: 100, frames: 64,
  dialogues: 200, nodes: 200, lines: 50, options: 20,
  sounds: 200, cutscenes: 200, subtitle: 200, credits: 3000, blocked: 500,
};
const FACINGS = ["auto", "left", "right"];   // cap on mira el personatge en fer servir un objecte
const LAYERS = ["auto", "back", "front"];    // auto: davant o darrere del personatge segons la profunditat

// Omple els camps que no existien en versions anteriors del format
function upgrade(a) {
  a.startSceneId ??= null;
  a.scenes ??= [];
  a.verbs ??= structuredClone(DEFAULT_VERBS);   // format 4
  a.objects ??= [];                             // format 4: biblioteca d'objectes
  a.variables ??= [];                           // format 5
  a.rules ??= [];                               // format 5
  a.characters ??= [];                          // format 6: personatges
  a.playerId ??= null;                          // format 6: el protagonista (null = el provisional)
  a.dialogues ??= [];                           // format 7: diàlegs
  a.sounds ??= [];                              // format 8: sons i músiques
  a.cutscenes ??= [];                           // format 8: seqüències
  a.introCutsceneId ??= null;                   // format 8: seqüència en començar el joc
  a.titleScreen ??= { image: null, subtitle: "", music: null };
  a.credits ??= "";
  a.cursor ??= "cross";
  // Format 5: «Fes servir» i «Dóna» poden unir dos objectes
  const prepositions = Object.fromEntries(DEFAULT_VERBS.map((v) => [v.id, v.preposition]));
  for (const v of a.verbs) v.preposition ??= prepositions[v.id] ?? "";
  // Format 10: dreceres de teclat. Els verbs clàssics prenen la de sempre si no la fa servir cap altre verb.
  if (a.verbs.some((v) => v.key === undefined)) {
    const keys = Object.fromEntries(DEFAULT_VERBS.map((v) => [v.id, v.key]));
    const used = new Set(a.verbs.map((v) => v.key).filter(Boolean));
    for (const v of a.verbs) {
      if (v.key !== undefined) continue;
      v.key = keys[v.id] && !used.has(keys[v.id]) ? keys[v.id] : "";
      if (v.key) used.add(v.key);
    }
  }
  for (const s of a.scenes) {
    s.background ??= null;
    s.walkable ??= [];
    s.hotspots ??= [];
    // Format 9: les sortides poden tenir condicions, i el que es diu quan no es pot passar
    for (const h of s.hotspots) if (h.exit) { h.exit.conditions ??= []; h.exit.blocked ??= ""; }
    s.mapPosition ??= null;
    s.actorHeight ??= null;   // format 3: alçada del personatge a prop i lluny (null = automàtica)
    s.objects ??= [];         // format 4: objectes de la biblioteca col·locats en aquest escenari
    s.characters ??= [];      // format 6: personatges no jugadors col·locats en aquest escenari
    s.music ??= null;         // format 8: música en entrar (null: continua la que soni)
    s.transition ??= "fade";  // format 8: com s'hi entra
    s.onEnter ??= null;       // format 8: { cutsceneId, once } seqüència en entrar
  }
  a.formatVersion = FORMAT_VERSION;
  return a;
}

// Cada petició a l'API llegeix i reescriu el fitxer sencer: les fem d'una en una perquè dues
// peticions seguides (per exemple el desat automàtic de l'editor) no es trepitgin els canvis.
async function loadAdventure(id) {
  const a = await store.load(id);
  return a ? upgrade(a) : null;
}

const removeFile = (adventureId, file) => file ? store.removeFile(adventureId, file) : null;

let queue = Promise.resolve();
function locked(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

/* ---------- Validació ---------- */

const text = (v) => typeof v === "string" ? v.trim() : "";

function textField(input, key, label, errors, required = false) {
  const v = text(input?.[key]);
  if (required && !v) errors.push(`${label} és obligatori`);
  if (v.length > LIMITS[key]) errors.push(`${label} no pot passar de ${LIMITS[key]} caràcters`);
  return v;
}

// Un punt és [x, y] en píxels de la imatge de fons; es guarda arrodonit
const point = (v) => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) ? v.map(Math.round) : null;

function polygon(v, label, errors) {
  if (!Array.isArray(v) || v.length < 3) return errors.push(`${label}: calen almenys 3 punts`), null;
  if (v.length > LIMITS.points) return errors.push(`${label}: com a màxim ${LIMITS.points} punts`), null;
  const pts = v.map(point);
  if (pts.includes(null)) return errors.push(`${label}: hi ha punts que no són vàlids`), null;
  return pts;
}

function list(v, label, errors) {
  if (!Array.isArray(v)) return errors.push(`${label} ha de ser una llista`), [];
  if (v.length > LIMITS.shapes) return errors.push(`${label}: com a màxim ${LIMITS.shapes}`), [];
  return v;
}

const validId = (v, seen) => typeof v === "string" && /^[\w-]{1,64}$/.test(v) && !seen.has(v);

// La drecera d'un verb: una lletra o un número, sense repetir; "" vol dir que no en té
function verbKey(value, label, keys, errors) {
  const k = text(value).toLowerCase();
  if (!k) return "";
  if (!VERB_KEY.test(k)) return errors.push(`${label}: la drecera ha de ser una lletra o un número`), "";
  if (keys.has(k)) return errors.push(`${label}: la tecla «${k.toUpperCase()}» ja és la drecera d'un altre verb`), "";
  keys.add(k);
  return k;
}

function cleanVerbs(v, errors) {
  if (!Array.isArray(v) || !v.length) return errors.push("Cal almenys un verb"), [];
  if (v.length > LIMITS.verbs) return errors.push(`Com a màxim ${LIMITS.verbs} verbs`), [];
  const seen = new Set(), keys = new Set();
  const verbs = v.map((verb, i) => {
    const id = validId(verb?.id, seen) ? verb.id : crypto.randomUUID();
    seen.add(id);
    return {
      id,
      name: textField(verb, "name", `Verb ${i + 1}: el nom`, errors, true),
      response: textField(verb, "response", `Verb ${i + 1}: la resposta`, errors),
      preposition: textField(verb, "preposition", `Verb ${i + 1}: la preposició`, errors),
      key: verbKey(verb?.key, `Verb ${i + 1}`, keys, errors),
    };
  });
  // El reproductor necessita «Mira» per mostrar les descripcions
  if (!seen.has(LOOK)) errors.push("El verb «Mira» no es pot treure");
  return verbs;
}

function cleanAdventure(input, adventure, errors, uploads = null) {
  const data = {
    title: textField(input, "title", "El títol", errors, true),
    description: textField(input, "description", "La descripció", errors),
  };
  if ("startSceneId" in input) {
    const id = input.startSceneId ?? null;
    if (id !== null && !adventure.scenes.some((s) => s.id === id)) errors.push("L'escenari inicial no existeix");
    data.startSceneId = id;
  }
  if ("verbs" in input) data.verbs = cleanVerbs(input.verbs, errors);
  if ("variables" in input) data.variables = cleanVariables(input.variables, errors);
  if ("rules" in input) data.rules = cleanRules(input.rules, errors);
  if ("dialogues" in input) data.dialogues = cleanDialogues(input.dialogues, errors);
  if ("cutscenes" in input) data.cutscenes = cleanCutscenes(input.cutscenes, errors);
  if ("introCutsceneId" in input) data.introCutsceneId = idRef(input.introCutsceneId) ? input.introCutsceneId : null;
  if ("credits" in input) data.credits = textField(input, "credits", "Els crèdits", errors);
  if ("cursor" in input) data.cursor = CURSORS.includes(input.cursor) ? input.cursor : "cross";
  if ("titleScreen" in input && uploads) {
    const t = input.titleScreen ?? {};
    data.titleScreen = {
      image: dataFile(t.image, new Set([adventure.titleScreen?.image].filter(Boolean)), "La imatge de títol", errors, uploads, `${adventure.id ?? "titol"}-titol`, IMAGE_EXT, MAX_IMAGE),
      subtitle: textField(t, "subtitle", "El subtítol", errors),
      music: idRef(t.music) ? t.music : null,
    };
  }
  if ("playerId" in input) {
    const id = input.playerId ?? null;
    if (id !== null && !adventure.characters.some((c) => c.id === id)) errors.push("El protagonista no existeix");
    data.playerId = id;
  }
  return data;
}

/* ---------- Variables i regles ---------- */

// Les regles només es validen per la forma: si una cosa a què apunten s'esborra, la regla es conserva
// i l'editor la marca com a trencada (i el reproductor se la salta), en lloc de perdre-la.
const idRef = (v) => typeof v === "string" && /^[\w-]{1,64}$/.test(v);

function typedValue(type, v) {
  if (type === "bool") return v === true;
  if (type === "number") return Number.isFinite(Number(v)) ? Number(v) : 0;
  return typeof v === "string" ? v.slice(0, LIMITS.text) : String(v ?? "");
}
// El valor d'una condició o d'una acció: es guarda tal com ve si és d'un tipus simple
const plainValue = (v) => (typeof v === "boolean" || Number.isFinite(v) ? v : typeof v === "string" ? v.slice(0, LIMITS.text) : null);

function cleanVariables(v, errors) {
  if (!Array.isArray(v)) return errors.push("Les variables han de ser una llista"), [];
  if (v.length > LIMITS.variables) return errors.push(`Com a màxim ${LIMITS.variables} variables`), [];
  const seen = new Set(), names = new Set();
  return v.map((x, i) => {
    const id = validId(x?.id, seen) ? x.id : crypto.randomUUID();
    seen.add(id);
    const name = textField(x, "name", `Variable ${i + 1}: el nom`, errors, true);
    if (name && names.has(name.toLowerCase())) errors.push(`Hi ha dues variables que es diuen «${name}»`);
    names.add(name.toLowerCase());
    const type = VARIABLE_TYPES.includes(x?.type) ? x.type : "bool";
    return { id, name, type, initial: typedValue(type, x?.initial) };
  });
}

function cleanRef(r, label, errors) {
  if (!r || !["object", "hotspot", "character"].includes(r.kind) || !idRef(r.id)) return errors.push(`${label} no és vàlid`), null;
  return { kind: r.kind, id: r.id };
}

function cleanCondition(c, label, errors) {
  if (!CONDITION_TYPES.includes(c?.type)) return errors.push(`${label}: tipus desconegut`), null;
  const not = c.not === true;
  if (c.type === "has") return idRef(c.objectId) ? { type: "has", objectId: c.objectId, not } : (errors.push(`${label}: falta l'objecte`), null);
  if (c.type === "state") {
    if (!idRef(c.objectId) || !idRef(c.stateId)) return errors.push(`${label}: falta l'objecte o l'estat`), null;
    return { type: "state", objectId: c.objectId, stateId: c.stateId, not };
  }
  if (c.type === "said") {
    // «Ha dit l'opció X del diàleg Y» (o encara no)
    if (!idRef(c.dialogueId) || !idRef(c.optionId)) return errors.push(`${label}: falta el diàleg o l'opció`), null;
    return { type: "said", dialogueId: c.dialogueId, optionId: c.optionId, not };
  }
  if (!idRef(c.varId)) return errors.push(`${label}: falta la variable`), null;
  return { type: "var", varId: c.varId, op: OPS.includes(c.op) ? c.op : "==", value: plainValue(c.value) };
}

function cleanAction(a, label, errors) {
  if (!ACTION_TYPES.includes(a?.type)) return errors.push(`${label}: tipus desconegut`), null;
  const need = (ok, what) => (ok ? true : (errors.push(`${label}: falta ${what}`), false));
  switch (a.type) {
    case "say":
      // «by» és qui ho diu: un personatge, o null per al protagonista
      return { type: "say", text: textField(a, "text", `${label}: el text`, errors, true), by: idRef(a.by) ? a.by : null };
    case "end":
      return { type: "end", text: textField(a, "text", `${label}: el text`, errors) };
    case "take":
    case "lose":
      return need(idRef(a.objectId), "l'objecte") ? { type: a.type, objectId: a.objectId } : null;
    case "setState":
      return need(idRef(a.objectId) && idRef(a.stateId), "l'objecte o l'estat") ? { type: "setState", objectId: a.objectId, stateId: a.stateId } : null;
    case "setVar":
      return need(idRef(a.varId), "la variable") ? { type: "setVar", varId: a.varId, op: a.op === "add" ? "add" : "set", value: plainValue(a.value) } : null;
    case "goto": {
      if (!need(idRef(a.sceneId), "l'escenari")) return null;
      const arrival = a.arrival == null ? null : point(a.arrival);
      return { type: "goto", sceneId: a.sceneId, arrival };
    }
    case "wait":
      return { type: "wait", seconds: Math.min(60, Math.max(0, Number(a.seconds) || 0)) };
    case "dialogue":
      return need(idRef(a.dialogueId), "el diàleg") ? { type: "dialogue", dialogueId: a.dialogueId } : null;
    case "walk": {
      // «sceneId» només serveix a l'editor per triar el punt sobre una imatge; al joc es camina a l'escenari on s'és
      const p = point(a.point);
      if (!need(p, "el punt on ha d'anar")) return null;
      return { type: "walk", point: p, by: idRef(a.by) ? a.by : null, sceneId: idRef(a.sceneId) ? a.sceneId : null };
    }
    case "sound":
      return need(idRef(a.soundId), "el so") ? { type: "sound", soundId: a.soundId } : null;
    case "music":
      // Sense so, la música s'atura
      return { type: "music", soundId: idRef(a.soundId) ? a.soundId : null };
    case "cutscene":
      return need(idRef(a.cutsceneId), "la seqüència") ? { type: "cutscene", cutsceneId: a.cutsceneId } : null;
  }
}

// Diàlegs: nodes amb frases (cada una amb qui la diu) i opcions del jugador.
// Cada opció pot tenir condicions, ser d'un sol ús, fer accions i portar a un altre node (o acabar, si «next» és null).
function cleanDialogues(v, errors) {
  if (!Array.isArray(v)) return errors.push("Els diàlegs han de ser una llista"), [];
  if (v.length > LIMITS.dialogues) return errors.push(`Com a màxim ${LIMITS.dialogues} diàlegs`), [];
  const seen = new Set();
  return v.map((d, i) => {
    const label = `Diàleg ${i + 1}`;
    const id = validId(d?.id, seen) ? d.id : crypto.randomUUID();
    seen.add(id);
    const nodes = Array.isArray(d?.nodes) ? d.nodes.slice(0, LIMITS.nodes) : [];
    if (!nodes.length) errors.push(`${label}: cal almenys un node`);
    const nodeIds = new Set();
    const optionIds = new Set();
    const cleanNodes = nodes.map((n, j) => {
      const nl = `${label}, node ${j + 1}`;
      const nid = validId(n?.id, nodeIds) ? n.id : crypto.randomUUID();
      nodeIds.add(nid);
      const lines = Array.isArray(n?.lines) ? n.lines.slice(0, LIMITS.lines) : [];
      const options = Array.isArray(n?.options) ? n.options.slice(0, LIMITS.options) : [];
      return {
        id: nid,
        position: n?.position == null ? null : point(n.position),
        lines: lines.map((l, k) => ({
          by: idRef(l?.by) ? l.by : null,
          text: textField(l, "text", `${nl}, frase ${k + 1}`, errors, true),
        })),
        options: options.map((o, k) => {
          const ol = `${nl}, opció ${k + 1}`;
          const oid = validId(o?.id, optionIds) ? o.id : crypto.randomUUID();
          optionIds.add(oid);
          const conditions = Array.isArray(o?.conditions) ? o.conditions.slice(0, LIMITS.conditions) : [];
          const actions = Array.isArray(o?.actions) ? o.actions.slice(0, LIMITS.actions) : [];
          return {
            id: oid,
            text: textField(o, "text", `${ol}: el text`, errors, true),
            once: o?.once === true,
            conditions: conditions.map((c, m) => cleanCondition(c, `${ol}, condició ${m + 1}`, errors)),
            actions: actions.map((a, m) => cleanAction(a, `${ol}, acció ${m + 1}`, errors)),
            next: idRef(o?.next) ? o.next : null,
          };
        }),
      };
    });
    // Les opcions que porten a un node que ja no existeix acaben la conversa
    for (const n of cleanNodes) for (const o of n.options) if (o.next && !nodeIds.has(o.next)) o.next = null;
    return {
      id,
      name: textField(d, "name", `${label}: el nom`, errors, true),
      characterId: idRef(d?.characterId) ? d.characterId : null,
      start: nodeIds.has(d?.start) ? d.start : cleanNodes[0]?.id ?? null,
      nodes: cleanNodes,
    };
  });
}

function cleanCutscenes(v, errors) {
  if (!Array.isArray(v)) return errors.push("Les seqüències han de ser una llista"), [];
  if (v.length > LIMITS.cutscenes) return errors.push(`Com a màxim ${LIMITS.cutscenes} seqüències`), [];
  const seen = new Set();
  return v.map((c, i) => {
    const label = `Seqüència ${i + 1}`;
    const id = validId(c?.id, seen) ? c.id : crypto.randomUUID();
    seen.add(id);
    const actions = Array.isArray(c?.actions) ? c.actions.slice(0, LIMITS.actions) : [];
    return {
      id,
      name: textField(c, "name", `${label}: el nom`, errors, true),
      actions: actions.map((a, j) => cleanAction(a, `${label}, acció ${j + 1}`, errors)),
    };
  });
}

function cleanRules(v, errors) {
  if (!Array.isArray(v)) return errors.push("Les regles han de ser una llista"), [];
  if (v.length > LIMITS.rules) return errors.push(`Com a màxim ${LIMITS.rules} regles`), [];
  const seen = new Set();
  return v.map((r, i) => {
    const label = `Regla ${i + 1}`;
    const id = validId(r?.id, seen) ? r.id : crypto.randomUUID();
    seen.add(id);
    if (!idRef(r?.verb)) errors.push(`${label}: falta el verb`);
    const conditions = Array.isArray(r?.conditions) ? r.conditions : [];
    const actions = Array.isArray(r?.actions) ? r.actions : [];
    if (conditions.length > LIMITS.conditions) errors.push(`${label}: com a màxim ${LIMITS.conditions} condicions`);
    if (actions.length > LIMITS.actions) errors.push(`${label}: com a màxim ${LIMITS.actions} accions`);
    return {
      id,
      verb: r?.verb,
      target: cleanRef(r?.target, `${label}: la cosa`, errors),
      with: r?.with == null ? null : cleanRef(r.with, `${label}: el segon objecte`, errors),
      conditions: conditions.slice(0, LIMITS.conditions).map((c, j) => cleanCondition(c, `${label}, condició ${j + 1}`, errors)),
      actions: actions.slice(0, LIMITS.actions).map((a, j) => cleanAction(a, `${label}, acció ${j + 1}`, errors)),
    };
  });
}

function cleanHotspot(h, i, adventure, errors, seen) {
  const label = `Punt calent ${i + 1}`;
  const id = typeof h?.id === "string" && /^[\w-]{1,64}$/.test(h.id) && !seen.has(h.id) ? h.id : crypto.randomUUID();
  seen.add(id);
  const hotspot = {
    id,
    name: textField(h, "name", `${label}: el nom`, errors, true),
    description: textField(h, "description", `${label}: la descripció`, errors),
    polygon: polygon(h?.polygon, label, errors),
    exit: null,
  };
  if (h?.exit) {
    // Una sortida pot no tenir destinació (si s'ha esborrat l'escenari de destí): l'editor ho marca com a avís
    const sceneId = h.exit.sceneId ?? null;
    if (sceneId !== null && !adventure.scenes.some((s) => s.id === sceneId)) errors.push(`${label}: l'escenari de destinació no existeix`);
    const arrival = h.exit.arrival == null ? null : point(h.exit.arrival);
    if (h.exit.arrival != null && !arrival) errors.push(`${label}: el punt d'arribada no és vàlid`);
    const conditions = Array.isArray(h.exit.conditions) ? h.exit.conditions.slice(0, LIMITS.conditions) : [];
    hotspot.exit = {
      sceneId, arrival,
      // Només s'hi pot passar si es compleixen totes; si no, el protagonista diu «blocked»
      conditions: conditions.map((c, i) => cleanCondition(c, `${label}, condició ${i + 1}`, errors)),
      blocked: textField(h.exit, "blocked", `${label}: el que diu si no pot passar`, errors),
    };
  }
  return hotspot;
}

// Coses de la biblioteca (objectes o personatges) col·locades en un escenari: posició i on es posa el protagonista
function placements(v, library, idKey, what, errors) {
  const seen = new Set();
  return list(v, `${what}s de l'escenari`, errors).map((p, i) => {
    const label = `${what} ${i + 1} de l'escenari`;
    const id = p?.[idKey];
    if (!library.some((x) => x.id === id)) errors.push(`${label}: no existeix`);
    else if (seen.has(id)) errors.push(`${label}: hi és repetit`);
    seen.add(id);
    const position = point(p?.position);
    if (!position) errors.push(`${label}: la posició no és vàlida`);
    const walkTo = p?.walkTo == null ? null : point(p.walkTo);
    if (p?.walkTo != null && !walkTo) errors.push(`${label}: el punt on es posa el protagonista no és vàlid`);
    return { p, [idKey]: id, position, walkTo };
  });
}

function cleanScene(input, adventure, errors) {
  const data = {
    name: textField(input, "name", "El nom", errors, true),
    description: textField(input, "description", "La descripció", errors),
  };
  if ("walkable" in input) {
    data.walkable = list(input.walkable, "Les zones caminables", errors)
      .map((p, i) => polygon(p, `Zona caminable ${i + 1}`, errors));
  }
  if ("hotspots" in input) {
    const seen = new Set();
    data.hotspots = list(input.hotspots, "Els punts calents", errors)
      .map((h, i) => cleanHotspot(h, i, adventure, errors, seen));
  }
  if ("actorHeight" in input) {
    const h = input.actorHeight;
    const size = (v) => Number.isFinite(v) && v >= 1 && v <= 10000 ? Math.round(v) : null;
    data.actorHeight = h == null ? null : { near: size(h.near), far: size(h.far) };
    if (data.actorHeight && (data.actorHeight.near === null || data.actorHeight.far === null)) {
      errors.push("L'alçada del personatge ha de ser un número entre 1 i 10000");
    }
  }
  if ("objects" in input) {
    data.objects = placements(input.objects, adventure.objects, "objectId", "Objecte", errors)
      .map(({ p, ...base }) => ({
        ...base,
        facing: FACINGS.includes(p?.facing) ? p.facing : "auto",
        layer: LAYERS.includes(p?.layer) ? p.layer : "auto",
      }));
  }
  if ("characters" in input) {
    // «facing» d'un personatge és cap on mira ell mateix mentre és a l'escenari
    data.characters = placements(input.characters, adventure.characters, "characterId", "Personatge", errors)
      .map(({ p, ...base }) => ({ ...base, facing: CHARACTER_FACINGS.includes(p?.facing) ? p.facing : "down" }));
  }
  if ("music" in input) data.music = idRef(input.music) ? input.music : null;
  if ("transition" in input) data.transition = TRANSITIONS.includes(input.transition) ? input.transition : "fade";
  if ("onEnter" in input) {
    const o = input.onEnter;
    data.onEnter = o && idRef(o.cutsceneId) ? { cutsceneId: o.cutsceneId, once: o.once !== false } : null;
  }
  if ("mapPosition" in input) {
    data.mapPosition = input.mapPosition == null ? null : point(input.mapPosition);
    if (input.mapPosition != null && !data.mapPosition) errors.push("La posició al mapa no és vàlida");
  }
  return data;
}

// Fitxers que arriben dins del JSON: el nom d'un fitxer que la cosa ja tenia, un fitxer nou en data URL, o null.
// Els nous s'afegeixen a «uploads» i només s'escriuen al disc si tot és vàlid.
const DATA_URL = /^data:([\w/.+-]+);base64,([A-Za-z0-9+/=]+)$/;

function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function dataFile(v, owned, label, errors, uploads, prefix, kinds, maxBytes) {
  if (v == null) return null;
  if (typeof v === "string" && owned.has(v)) return v;
  const m = typeof v === "string" && v.match(DATA_URL);
  if (!m || !kinds[m[1]]) {
    const names = kinds === IMAGE_EXT ? "PNG, JPG, GIF o WebP" : "MP3, OGG, WAV o WebM";
    return errors.push(`${label}: ha de ser ${names}`), null;
  }
  const bytes = fromBase64(m[2]);
  if (!bytes.length || bytes.length > maxBytes) return errors.push(`${label}: ha de fer menys de ${maxBytes / 1024 / 1024} MB`), null;
  const file = `${prefix}-${crypto.randomUUID().slice(0, 8)}${kinds[m[1]]}`;
  uploads.push({ file, bytes });
  return file;
}

const objectImage = (v, owned, label, errors, uploads, prefix) => dataFile(v, owned, label, errors, uploads, prefix, IMAGE_EXT, MAX_SPRITE);

function cleanSound(input, existing, errors, uploads) {
  const id = existing?.id ?? crypto.randomUUID();
  const file = dataFile(input.file, new Set(existing ? [existing.file] : []), "El so", errors, uploads, id, AUDIO_EXT, MAX_AUDIO);
  if (!file && !errors.length) errors.push("Falta el fitxer de so");
  return { id, name: textField(input, "name", "El nom", errors, true), file };
}

const objectFiles = (o) => [...o.states.map((s) => s.image), o.icon].filter(Boolean);
const characterFiles = (c) => [c.sheet].filter(Boolean);

const intIn = (v, min, max, fallback) => (Number.isInteger(Number(v)) && Number(v) >= min && Number(v) <= max ? Number(v) : fallback);

function cleanCharacter(input, existing, errors, uploads) {
  const id = existing?.id ?? crypto.randomUUID();
  const animations = {};
  for (const key of ANIMATION_KEYS) {
    const anim = input.animations?.[key];
    const frames = Array.isArray(anim?.frames) ? anim.frames.filter((f) => Number.isInteger(f) && f >= 0 && f < 10000).slice(0, LIMITS.frames) : [];
    // Les animacions buides no es guarden: el reproductor en fa servir una de semblant
    const fps = Number(anim?.fps);
    if (frames.length) animations[key] = { frames, fps: Number.isFinite(fps) ? Math.min(30, Math.max(1, Math.round(fps))) : 8 };
  }
  return {
    id,
    name: textField(input, "name", "El nom", errors, true),
    description: textField(input, "description", "La descripció", errors),
    color: typeof input.color === "string" && /^#[0-9a-f]{6}$/i.test(input.color) ? input.color.toLowerCase() : "#ffffff",
    sheet: objectImage(input.sheet, new Set(existing ? characterFiles(existing) : []), "El full de sprites", errors, uploads, id),
    frameWidth: intIn(input.frameWidth, 1, 2048, 32),
    frameHeight: intIn(input.frameHeight, 1, 2048, 48),
    animations,
  };
}

function cleanObject(input, existing, errors, uploads) {
  const id = existing?.id ?? crypto.randomUUID();
  const owned = new Set(existing ? objectFiles(existing) : []);
  const states = Array.isArray(input.states) ? input.states : [];
  if (!states.length) errors.push("Cal almenys un estat");
  if (states.length > LIMITS.states) errors.push(`Com a màxim ${LIMITS.states} estats`);
  const seen = new Set();
  const cleanStates = states.slice(0, LIMITS.states).map((st, i) => {
    const sid = validId(st?.id, seen) ? st.id : crypto.randomUUID();
    seen.add(sid);
    return {
      id: sid,
      name: textField(st, "name", `Estat ${i + 1}: el nom`, errors, true),
      image: objectImage(st?.image, owned, `Estat ${i + 1}`, errors, uploads, id),
    };
  });
  return {
    id,
    name: textField(input, "name", "El nom", errors, true),
    description: textField(input, "description", "La descripció", errors),
    pickable: input.pickable === true,
    states: cleanStates,
    initialState: seen.has(input.initialState) ? input.initialState : cleanStates[0]?.id ?? null,
    icon: objectImage(input.icon, owned, "La icona", errors, uploads, id),
  };
}

/* ---------- API ---------- */

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(typeof body === "string" || body instanceof Uint8Array ? body : JSON.stringify(body));
}

// «req» és { method, headers, read(limit) }: read() torna tot el cos (Uint8Array) o llança un error 413 si passa del límit
const readRaw = (req, limit) => req.read(limit);

async function readBody(req, limit = 2_000_000) {
  const body = JSON.parse(new TextDecoder().decode(await readRaw(req, limit)) || "{}");
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new SyntaxError("cal un objecte");
  return body;
}

const notFound = (res, what) => send(res, 404, { error: `Aquest ${what} no existeix` });
const invalid = (res, errors) => send(res, 400, { error: errors.join(". ") });

async function adventuresApi(req, res, id) {
  const now = new Date().toISOString();
  if (!id) {
    if (req.method === "GET") return send(res, 200, (await store.list()).map(upgrade));
    if (req.method === "POST") {
      const errors = [];
      const data = cleanAdventure(await readBody(req), { scenes: [] }, errors);
      if (errors.length) return invalid(res, errors);
      const adventure = upgrade({ id: crypto.randomUUID(), ...data, scenes: [], createdAt: now, updatedAt: now });
      await store.save(adventure);
      return send(res, 201, adventure);
    }
    return send(res, 405, { error: "Mètode no permès" });
  }

  const adventure = await loadAdventure(id);
  if (!adventure) return notFound(res, "aventura");

  if (req.method === "GET") return send(res, 200, adventure);

  if (req.method === "PUT") {
    const errors = [], uploads = [];
    const data = cleanAdventure(await readBody(req, 20_000_000), adventure, errors, uploads);
    if (errors.length) return invalid(res, errors);
    if (uploads.length) {
      await Promise.all(uploads.map((u) => store.putFile(adventure.id, u.file, u.bytes)));
    }
    const oldTitle = adventure.titleScreen?.image;
    Object.assign(adventure, data, { updatedAt: now });
    await store.save(adventure);
    if (data.titleScreen && oldTitle && oldTitle !== data.titleScreen.image) await removeFile(adventure.id, oldTitle);
    return send(res, 200, adventure);
  }

  if (req.method === "DELETE") {
    await store.remove(id);
    return send(res, 204, "");
  }

  send(res, 405, { error: "Mètode no permès" });
}

async function scenesApi(req, res, adventureId, sceneId, sub) {
  const adventure = await loadAdventure(adventureId);
  if (!adventure) return notFound(res, "aventura");
  const index = sceneId ? adventure.scenes.findIndex((s) => s.id === sceneId) : -1;
  if (sceneId && index === -1) return notFound(res, "escenari");
  const now = new Date().toISOString();
  const touch = () => { adventure.updatedAt = now; };

  if (sub === "background") {
    const scene = adventure.scenes[index];
    if (req.method === "PUT") {
      const ext = IMAGE_EXT[req.headers["content-type"]];
      if (!ext) return send(res, 415, { error: "El fons ha de ser una imatge PNG, JPG, GIF o WebP" });
      const bytes = await readRaw(req, MAX_IMAGE);
      if (!bytes.length) return send(res, 400, { error: "La imatge és buida" });
      // Nom nou a cada pujada perquè el navegador no mostri la imatge antiga de la memòria cau
      const file = `${scene.id}-${Date.now()}${ext}`;
      await store.putFile(adventure.id, file, bytes);
      const old = scene.background;
      Object.assign(scene, { background: file, updatedAt: now });
      touch();
      await store.save(adventure);
      await removeFile(adventure.id, old);
      return send(res, 200, scene);
    }
    if (req.method === "DELETE") {
      const old = scene.background;
      Object.assign(scene, { background: null, updatedAt: now });
      touch();
      await store.save(adventure);
      await removeFile(adventure.id, old);
      return send(res, 200, scene);
    }
    return send(res, 405, { error: "Mètode no permès" });
  }

  if (req.method === "GET") return send(res, 200, sceneId ? adventure.scenes[index] : adventure.scenes);

  if (req.method === "POST" && !sceneId) {
    const errors = [];
    const data = cleanScene(await readBody(req), adventure, errors);
    if (errors.length) return invalid(res, errors);
    const scene = { id: crypto.randomUUID(), background: null, walkable: [], hotspots: [], objects: [], characters: [], mapPosition: null, actorHeight: null, music: null, transition: "fade", onEnter: null, ...data, createdAt: now, updatedAt: now };
    adventure.scenes.push(scene);
    touch();
    await store.save(adventure);
    return send(res, 201, scene);
  }

  if (req.method === "PUT" && sceneId) {
    const errors = [];
    const data = cleanScene(await readBody(req), adventure, errors);
    if (errors.length) return invalid(res, errors);
    adventure.scenes[index] = { ...adventure.scenes[index], ...data, updatedAt: now };
    // Un objecte o un personatge només pot ser en un escenari: si s'ha col·locat aquí, es treu dels altres
    for (const [key, idKey] of [["objects", "objectId"], ["characters", "characterId"]]) {
      if (!data[key]) continue;
      const here = new Set(data[key].map((p) => p[idKey]));
      for (const s of adventure.scenes) {
        if (s.id !== sceneId) s[key] = s[key].filter((p) => !here.has(p[idKey]));
      }
    }
    touch();
    await store.save(adventure);
    return send(res, 200, adventure.scenes[index]);
  }

  if (req.method === "DELETE" && sceneId) {
    const [removed] = adventure.scenes.splice(index, 1);
    // Les sortides que hi portaven es queden sense destinació, i l'editor les marca perquè les arreglis
    for (const s of adventure.scenes) {
      for (const h of s.hotspots) if (h.exit?.sceneId === removed.id) h.exit = { ...h.exit, sceneId: null, arrival: null };
    }
    if (adventure.startSceneId === removed.id) adventure.startSceneId = null;
    touch();
    await store.save(adventure);
    await removeFile(adventure.id, removed.background);
    return send(res, 204, "");
  }

  send(res, 405, { error: "Mètode no permès" });
}

// Biblioteques de l'aventura (objectes, personatges i sons): mateix funcionament, fitxers dins del JSON.
// «onDelete» treu les referències que ja no tenen sentit quan se n'esborra un.
const removePlacements = (key, idKey) => (adventure, removed) => {
  for (const s of adventure.scenes) s[key] = s[key].filter((p) => p[idKey] !== removed.id);
};
const LIBRARIES = {
  objects: { what: "objecte", plural: "objectes", limit: LIMITS.objects, clean: cleanObject, files: objectFiles, onDelete: removePlacements("objects", "objectId") },
  characters: {
    what: "personatge", plural: "personatges", limit: LIMITS.characters, clean: cleanCharacter, files: characterFiles,
    onDelete(adventure, removed) {
      removePlacements("characters", "characterId")(adventure, removed);
      if (adventure.playerId === removed.id) adventure.playerId = null;
    },
  },
  sounds: {
    what: "so", plural: "sons", limit: LIMITS.sounds, clean: cleanSound, files: (s) => [s.file].filter(Boolean),
    onDelete(adventure, removed) {
      for (const s of adventure.scenes) if (s.music === removed.id) s.music = null;
      if (adventure.titleScreen.music === removed.id) adventure.titleScreen.music = null;
    },
  },
};

async function libraryApi(req, res, adventureId, key, objectId) {
  const lib = LIBRARIES[key];
  const adventure = await loadAdventure(adventureId);
  if (!adventure) return notFound(res, "aventura");
  const items = adventure[key];
  const index = objectId ? items.findIndex((o) => o.id === objectId) : -1;
  if (objectId && index === -1) return notFound(res, lib.what);
  const now = new Date().toISOString();

  async function writeUploads(uploads) {
    if (!uploads.length) return;
    await Promise.all(uploads.map((u) => store.putFile(adventure.id, u.file, u.bytes)));
  }

  if (req.method === "GET") return send(res, 200, objectId ? items[index] : items);

  if (req.method === "POST" && !objectId) {
    if (items.length >= lib.limit) return invalid(res, [`Com a màxim ${lib.limit} ${lib.plural}`]);
    const errors = [], uploads = [];
    const object = lib.clean(await readBody(req, 40_000_000), null, errors, uploads);
    if (errors.length) return invalid(res, errors);
    await writeUploads(uploads);
    Object.assign(object, { createdAt: now, updatedAt: now });
    items.push(object);
    adventure.updatedAt = now;
    await store.save(adventure);
    return send(res, 201, object);
  }

  if (req.method === "PUT" && objectId) {
    const old = items[index];
    const errors = [], uploads = [];
    const object = lib.clean(await readBody(req, 40_000_000), old, errors, uploads);
    if (errors.length) return invalid(res, errors);
    await writeUploads(uploads);
    items[index] = { ...object, createdAt: old.createdAt, updatedAt: now };
    adventure.updatedAt = now;
    await store.save(adventure);
    const kept = new Set(lib.files(object));
    await Promise.all(lib.files(old).filter((f) => !kept.has(f)).map((f) => removeFile(adventure.id, f)));
    return send(res, 200, items[index]);
  }

  if (req.method === "DELETE" && objectId) {
    const [removed] = items.splice(index, 1);
    lib.onDelete(adventure, removed);
    adventure.updatedAt = now;
    await store.save(adventure);
    await Promise.all(lib.files(removed).map((f) => removeFile(adventure.id, f)));
    return send(res, 204, "");
  }

  send(res, 405, { error: "Mètode no permès" });
}

/* ---------- Exportar i importar ---------- */

// El joc a punt per jugar, en un zip que també es pot tornar a importar
async function exportApi(res, adventureId) {
  const adventure = await loadAdventure(adventureId);
  if (!adventure) return notFound(res, "aventura");
  const body = await platform.zip(await platform.exportFiles(adventure, await store.files(adventure.id)));
  res.writeHead(200, {
    "content-type": "application/zip",
    "content-disposition": `attachment; filename="${platform.zipName(adventure.title)}"`,
    "cache-control": "no-store",
  });
  res.end(body);
}

// Un zip exportat (o una còpia de seguretat) torna a ser una aventura: sempre una de nova, amb un id nou
async function importApi(req, res) {
  let entries;
  try {
    entries = await platform.unzip(await readRaw(req, MAX_IMPORT));
  } catch (err) {
    if (err.status) throw err;
    return invalid(res, [err.message]);
  }
  const json = entries.find((e) => e.name === "adventure.json" || e.name.endsWith("/adventure.json"));
  if (!json) return invalid(res, ["El zip no té cap adventure.json: no és una aventura exportada"]);
  // Si el zip es va fer comprimint una carpeta, tot hi és a dins: els fitxers es busquen al costat d'adventure.json
  const base = json.name.slice(0, -"adventure.json".length);
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(json.data));
  } catch {
    return invalid(res, ["L'adventure.json no és vàlid"]);
  }
  if (!data || typeof data.title !== "string" || !Array.isArray(data.scenes)) return invalid(res, ["L'adventure.json no és d'una aventura"]);
  const now = new Date().toISOString();
  const adventure = upgrade({ ...data, id: crypto.randomUUID(), createdAt: data.createdAt ?? now, updatedAt: now });
  // Només fitxers de la carpeta files/, amb noms senzills: res de camins que surtin de la carpeta de l'aventura
  const files = entries
    .filter((e) => e.name.startsWith(`${base}files/`))
    .map((e) => ({ name: e.name.slice(base.length + "files/".length), data: e.data }))
    .filter((f) => /^[\w.-]+$/.test(f.name) && !f.name.startsWith("."));
  await Promise.all(files.map((f) => store.putFile(adventure.id, f.name, f.data)));
  await store.save(adventure);
  return send(res, 201, adventure);
}

/* ---------- Rutes ---------- */

const extname = (name) => name.match(/\.[^.]*$/)?.[0] ?? "";

// Respon les peticions a /api/... i /files/... «pathname» ja no porta el prefix de la web.
// Retorna false si la ruta no és de l'API (llavors toca servir un fitxer de la interfície).
async function handle(req, res, pathname) {
  try {
    let m = pathname.match(/^\/api\/adventures\/([\w-]+)\/scenes(?:\/([\w-]+)(?:\/(background))?)?\/?$/);
    if (m) return await locked(() => scenesApi(req, res, m[1], m[2], m[3])), true;
    m = pathname.match(/^\/api\/adventures\/([\w-]+)\/export\/?$/);
    if (m && req.method === "GET") return await exportApi(res, m[1]), true;
    if (pathname === "/api/import" && req.method === "POST") return await locked(() => importApi(req, res)), true;
    m = pathname.match(/^\/api\/adventures\/([\w-]+)\/(objects|characters|sounds)(?:\/([\w-]+))?\/?$/);
    if (m) return await locked(() => libraryApi(req, res, m[1], m[2], m[3])), true;
    m = pathname.match(/^\/api\/adventures(?:\/([\w-]+))?\/?$/);
    if (m) return await locked(() => adventuresApi(req, res, m[1])), true;
    if (pathname.startsWith("/api/")) return send(res, 404, { error: "Aquesta adreça no existeix" }), true;
    m = pathname.match(/^\/files\/([\w-]+)\/([\w.-]+)$/);
    if (m && req.method === "GET") {
      const data = await store.getFile(m[1], decodeURIComponent(m[2]));
      if (!data) send(res, 404, "No trobat", "text/plain; charset=utf-8");
      else send(res, 200, data, TYPES[extname(m[2])] || "application/octet-stream");
      return true;
    }
    return false;
  } catch (err) {
    const status = err.status || (err instanceof SyntaxError ? 400 : 500);
    send(res, status, { error: err instanceof SyntaxError ? "JSON invàlid" : err.message });
    return true;
  }
}

return { configure, TYPES, FORMAT_VERSION, upgrade, send, handle };
})();

// backend/zip.js
modules["backend/zip.js"] = (() => {

// Zips al navegador, amb CompressionStream: el mateix format que escriu i llegeix export.mjs amb el zlib de Node.
// Els fitxers són Uint8Array.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const through = async (bytes, stream) =>
  new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

function dosDateTime(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

// entries: [{ name, data }] → un zip (Uint8Array). Els fitxers es comprimeixen si en surten més petits.
async function zip(entries) {
  const { time, date } = dosDateTime();
  const parts = [], centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBytes = new TextEncoder().encode(name);
    const deflated = await through(data, new CompressionStream("deflate-raw"));
    const [method, body] = deflated.length < data.length ? [8, deflated] : [0, data];
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);           // noms en UTF-8
    local.setUint16(8, method, true);
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, body.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, body);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, method, true);
    central.setUint16(12, time, true);
    central.setUint16(14, date, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, body.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint32(42, offset, true);
    centrals.push(new Uint8Array(central.buffer), nameBytes);
    offset += 30 + nameBytes.length + body.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Uint8Array(await new Blob([...parts, ...centrals, new Uint8Array(end.buffer)]).arrayBuffer());
}

// Llegeix un zip i en retorna els fitxers: [{ name, data }]. Llança un error si no és un zip que s'entengui.
async function unzip(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end === -1) throw new Error("No és un fitxer zip");
  const count = v.getUint16(end + 10, true);
  let p = v.getUint32(end + 16, true);
  const out = [];
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error("El zip està malmès");
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), commentLen = v.getUint16(p + 32, true);
    const offset = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;   // carpetes
    const start = offset + 30 + v.getUint16(offset + 26, true) + v.getUint16(offset + 28, true);
    const body = bytes.subarray(start, start + size);
    if (method !== 0 && method !== 8) throw new Error(`«${name}» està comprimit d'una manera que no s'entén`);
    out.push({ name, data: method === 8 ? await through(body, new DecompressionStream("deflate-raw")) : body.slice() });
  }
  return out;
}

return { crc32, zip, unzip };
})();

// backend/game-files.js
modules["backend/game-files.js"] = (() => {

// Els fitxers del joc exportat (index.html, el reproductor, les dades i els fitxers de l'aventura), comuns al
// servidor local i a la versió web. No fa servir res de Node: els fitxers són Uint8Array.

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const GAME_JS = `
const { createPlayer } = window.AventuraPlayer;
const adventure = window.ADVENTURE;
const player = createPlayer(document.querySelector(".play-stage"), adventure, {
  imageUrl: (file) => "files/" + encodeURIComponent(file),
  startSceneId: adventure.startSceneId ?? adventure.scenes[0]?.id,
  title: true,
});
// Maj+M silencia el so (les lletres soles són les dreceres dels verbs)
let muted = false;
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m" && e.shiftKey && !e.metaKey && !e.ctrlKey) player.setMuted((muted = !muted));
});
`;

function gameHtml(adventure) {
  const title = escapeHtml(adventure.title);
  return `<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="player.css">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: #000; }
</style>
</head>
<body>
<div class="play-stage"></div>
<script src="adventure.js"></script>
<script src="game.js"></script>
</body>
</html>
`;
}

const README = (adventure) => `${adventure.title}
${"=".repeat(adventure.title.length)}

Per jugar: obre index.html amb el navegador.
Per penjar-lo a internet: puja tota aquesta carpeta (index.html, game.js, adventure.js, player.css i files/) a qualsevol web.
Les partides es desen al navegador de qui juga.

Per tornar a editar-la: a l'Editor d'aventures, «Importa» aquest mateix zip.
`;

const encode = (s) => new TextEncoder().encode(s);

// Tots els fitxers del zip d'una aventura. «files» són els fitxers de l'aventura (imatges i sons): [{ name, data }].
// «player» és el reproductor ja empaquetat en un script (text) i «css», els seus estils.
function gameEntries(adventure, files, { player, css }) {
  return [
    { name: "index.html", data: encode(gameHtml(adventure)) },
    { name: "game.js", data: encode(player + GAME_JS) },
    { name: "adventure.js", data: encode(`window.ADVENTURE = ${JSON.stringify(adventure)};\n`) },
    { name: "adventure.json", data: encode(JSON.stringify(adventure, null, 2) + "\n") },
    { name: "player.css", data: typeof css === "string" ? encode(css) : css },
    { name: "LLEGEIX-ME.txt", data: encode(README(adventure)) },
    ...files.map((f) => ({ name: `files/${f.name}`, data: f.data })),
  ];
}

// Un nom de fitxer per al zip a partir del títol: «El secret de l'illa» → «el-secret-de-l-illa.zip»
const zipName = (title) =>
  `${title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aventura"}.zip`;

return { gameEntries, zipName };
})();

// backend/idb-store.js
modules["backend/idb-store.js"] = (() => {

// On guarda les aventures la versió web: a IndexedDB, al navegador de qui fa servir l'editor.
// Té la mateixa forma que el «store» de server.mjs (que les guarda en carpetes).

function idbStore(name = "aventura-editor") {
  const db = new Promise((resolve, reject) => {
    const open = indexedDB.open(name, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore("adventures", { keyPath: "id" });
      open.result.createObjectStore("files");   // clau: «idAventura/nomFitxer»
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });

  // Una operació en una transacció; torna el resultat quan la transacció s'ha completat
  async function run(storeName, mode, fn) {
    const tx = (await db).transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = tx.onabort = () => reject(tx.error ?? new Error("No s'ha pogut desar al navegador"));
    });
  }

  const key = (id, file) => `${id}/${file}`;
  const filesOf = (id) => IDBKeyRange.bound(`${id}/`, `${id}/￿`);

  return {
    list: () => run("adventures", "readonly", (s) => s.getAll()),
    load: async (id) => (await run("adventures", "readonly", (s) => s.get(id))) ?? null,
    save: (a) => run("adventures", "readwrite", (s) => s.put(a)),
    async remove(id) {
      await run("adventures", "readwrite", (s) => s.delete(id));
      await run("files", "readwrite", (s) => s.delete(filesOf(id)));
    },
    putFile: (id, file, bytes) => run("files", "readwrite", (s) => s.put(bytes, key(id, file))),
    getFile: async (id, file) => (await run("files", "readonly", (s) => s.get(key(id, file)))) ?? null,
    removeFile: (id, file) => run("files", "readwrite", (s) => s.delete(key(id, file))),
    async files(id) {
      const [keys, values] = await Promise.all([
        run("files", "readonly", (s) => s.getAllKeys(filesOf(id))),
        run("files", "readonly", (s) => s.getAll(filesOf(id))),
      ]);
      return keys.map((k, i) => ({ name: k.slice(id.length + 1), data: values[i] }));
    },
  };
}

return { idbStore };
})();

// backend/sw.js
modules["backend/sw.js"] = (() => {
const { configure, handle } = modules["backend/core.js"];
const { zip, unzip } = modules["backend/zip.js"];
const { gameEntries, zipName } = modules["backend/game-files.js"];
const { idbStore } = modules["backend/idb-store.js"];
// El service worker de la versió web: fa de servidor dins del navegador. Respon les peticions a api/... i files/...
// amb el mateix codi que server.mjs (core.js), però guardant-ho tot a IndexedDB.
// Per publicar-lo, tools/web/build.mjs l'empaqueta en un sol script (sw.js), perquè no tots els navegadors
// accepten service workers fets de mòduls.





const base = new URL(self.registration.scope).pathname;   // «/aventura-editor/» a GitHub Pages

const fetchText = async (path) => (await fetch(base + path)).text();

configure(idbStore(), {
  zip, unzip, zipName,
  // El reproductor ja ve empaquetat de la publicació (player.js), amb els seus estils
  exportFiles: async (adventure, files) =>
    gameEntries(adventure, files, { player: await fetchText("player.js"), css: await fetchText("css/player.css") }),
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(base)) return;
  const path = "/" + url.pathname.slice(base.length);
  if (/^\/(api|files)\//.test(path)) e.respondWith(respond(e.request, path));
});

async function respond(request, path) {
  const body = ["GET", "HEAD"].includes(request.method) ? new Uint8Array() : new Uint8Array(await request.arrayBuffer());
  const req = {
    method: request.method,
    headers: { "content-type": request.headers.get("content-type") },
    async read(limit) {
      if (body.length > limit) throw Object.assign(new Error("El contingut és massa gran"), { status: 413 });
      return body;
    },
  };
  let status = 200, headers = {}, out = null;
  const res = { writeHead(s, h) { status = s; headers = h; }, end(b) { out = b; } };
  await handle(req, res, path);
  return new Response(status === 204 ? null : out, { status, headers });
}

return {  };
})();

globalThis.AventuraPlayer = modules["backend/sw.js"];
})();
