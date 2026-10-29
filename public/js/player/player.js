// Motor del reproductor: dibuixa l'escenari a la seva resolució, mou el personatge on cliques
// (buscant camí per la zona caminable), executa els verbs sobre objectes, punts calents i l'inventari
// seguint les regles de l'aventura, i canvia d'escenari en passar per una sortida.
// No depèn de l'editor: rep l'aventura i una funció per trobar les imatges, perquè més endavant es pugui exportar sol.
import { pointInPolygon } from "../geometry.js";
import { createNavMesh } from "./navmesh.js";
import { actorHeightAt } from "./actor.js";
import { drawCharacter, characterRect, characterHit, facingToDir, defaultApproach } from "./characters.js";
import { spriteFile, stateFiles, spriteRect, opaqueAt } from "./objects.js";
import { createGameState, checkCondition, findRule, applyStateAction, runActions, startNode, availableOptions, markSaid, dialogueFor, serializeGame, restoreGame } from "./rules.js";
import { LOOK, PICKUP } from "../defaults.js";
import { createAudio } from "./audio.js";
import { createSaves } from "./saves.js";

const FALLBACK = { w: 320, h: 200 };   // mida d'un escenari sense fons
const WALK_SPEED = 1.6;                 // alçades del personatge per segon
const FADE_MS = 250;
const LAYER_ORDER = { back: 0, auto: 1, front: 2 };
const IRIS_MS = 450;

// Cursor clàssic: una creu de píxels; groga quan és sobre una cosa
const crossCursor = (color) => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='23' height='23' shape-rendering='crispEdges'><g fill='${color}' stroke='#000'>`
  + "<rect x='10' y='0' width='3' height='8'/><rect x='10' y='15' width='3' height='8'/>"
  + "<rect x='0' y='10' width='8' height='3'/><rect x='15' y='10' width='8' height='3'/></g></svg>",
)}") 11 11, crosshair`;
const CURSOR_STYLES = {
  cross: { normal: crossCursor("#ffffff"), hover: crossCursor("#f5b942"), wait: "wait" },
  system: { normal: "crosshair", hover: "pointer", wait: "wait" },
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const refOf = (t) => ({ kind: t.kind, id: t.id });

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// opcions: imageUrl(fitxer) → url, startSceneId, onSceneChange(escenari), onStateChange() quan canvia la partida
// (inventari, estats, variables…), setup: una situació de prova per començar (vegeu «applySetup»),
// title: si es mostra la pantalla de títol (només quan es juga des del principi), saves: on es desen les partides, i
// onMuteChange(silenciat) quan s'encén o s'apaga el so (amb el botó del joc o amb setMuted)
export function createPlayer(container, adventure, {
  imageUrl, startSceneId, onSceneChange, onStateChange, setup = null, title = false, saves = createSaves(adventure.id), onMuteChange,
}) {
  container.innerHTML = `
    <div class="player-screen">
      <canvas></canvas>
      <div class="player-overlay"></div>
      <div class="player-fade"></div>
      <div class="player-iris" hidden></div>
      <div class="player-title" hidden><div class="player-title-text"><strong></strong><span></span>
        <div class="player-title-buttons"><button type="button" data-act="start">Comença</button><button type="button" data-act="load" hidden>Carrega una partida</button></div>
      </div></div>
      <div class="player-menu" hidden role="dialog" aria-label="Partides">
        <h3>Partides</h3><ol></ol><p class="player-menu-msg" aria-live="polite"></p>
        <button type="button" data-act="close">Torna al joc</button>
      </div>
      <div class="player-end" hidden><p></p><small class="credits"></small><button type="button">Torna a començar</button></div>
    </div>
    <div class="player-ui">
      <div class="player-corner">
        <button type="button" class="player-hide-button" title="Amaga o mostra els verbs i l'inventari" aria-pressed="false">◐</button>
        <button type="button" class="player-sound-button" title="Encén o apaga el so (Maj+M)" aria-pressed="false">🔊</button>
        <button type="button" class="player-full-button" title="Pantalla completa">⛶</button>
        <button type="button" class="player-menu-button">Partides</button>
      </div>
      <div class="player-sentence" aria-live="polite"></div>
      <div class="player-panel">
        <div class="player-verbs" role="toolbar" aria-label="Verbs"></div>
        <div class="player-inventory" aria-label="Inventari"></div>
        <div class="player-options" role="list" aria-label="Què dius?" hidden></div>
      </div>
    </div>`;
  const screen = container.querySelector(".player-screen");
  const canvas = screen.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const overlay = screen.querySelector(".player-overlay");
  const fader = screen.querySelector(".player-fade");
  const endScreen = screen.querySelector(".player-end");
  const iris = screen.querySelector(".player-iris");
  const titleScreen = screen.querySelector(".player-title");
  const menu = screen.querySelector(".player-menu");
  let menuOpen = false;
  const ui = container.querySelector(".player-ui");
  const sentence = container.querySelector(".player-sentence");
  const verbBox = container.querySelector(".player-verbs");
  const inventoryBox = container.querySelector(".player-inventory");
  const optionsBox = container.querySelector(".player-options");

  const library = new Map(adventure.objects.map((o) => [o.id, o]));
  const cast = new Map(adventure.characters.map((c) => [c.id, c]));
  const playerCh = cast.get(adventure.playerId) ?? null;   // null: la figura provisional
  const lookVerb = adventure.verbs.find((v) => v.id === LOOK);
  let game = createGameState(adventure);
  const images = new Map();   // fitxer → imatge carregada (null mentre es carrega o si falla)
  const meshes = new Map();   // id d'escenari → navmesh
  let scene = null, img = null, mesh = null, heightAt = () => 60;
  let W = FALLBACK.w, H = FALLBACK.h, scale = 1;
  let hover = null;           // la cosa sota el ratolí (a l'escenari o a l'inventari)
  let verb = null;            // verb triat; null és «Camina»
  let first = null;           // primer objecte de «Fes servir X amb…», esperant el segon
  let pending = null;         // acció en curs mentre el personatge hi camina: { verb, target, with }
  let busy = true;            // durant les transicions no s'accepten clics
  let scripting = false;      // mentre s'executen les accions d'una regla, un clic només salta la frase
  let scriptDepth = 0;        // les regles i seqüències es poden encadenar (una seqüència que va a un escenari amb una altra…)
  let cutsceneDepth = 0;      // dins d'una seqüència no es veuen els verbs
  let skipping = false;       // Esc salta la seqüència: les frases, esperes i passeigs es fan a l'instant
  const audio = createAudio(adventure, imageUrl);
  const cursors = CURSOR_STYLES[adventure.cursor] ?? CURSOR_STYLES.cross;
  const setCursor = (kind) => { canvas.style.cursor = cursors[kind]; };
  let debug = false;
  let frame = 0, last = 0, destroyed = false;
  // El protagonista: «dir» és la direcció de l'animació (side, down, up) i «facing» si mira a la dreta (1) o a l'esquerra (-1)
  const actor = { ch: playerCh, x: 0, y: 0, path: [], facing: 1, dir: "side", step: 0, time: 0, onArrive: null };
  setCursor("normal");
  let npcs = [];              // personatges de l'escenari actual, amb la mateixa forma que «actor»
  let speech = null;          // { el, until, done, speaker }

  /* ---------- Mida i coordenades ---------- */

  // L'escenari s'amplia tant com hi càpiga; si es pot, per un factor enter perquè el pixel art quedi net.
  // Quan els verbs i l'inventari a sota el farien molt més petit (un mòbil de costat, una finestra baixa), l'escenari
  // ocupa tota l'alçada i els verbs i l'inventari hi queden a sobre, als costats i translúcids (mode «compact»).
  function layout() {
    container.classList.remove("compact");
    const fullW = container.clientWidth, fullH = container.clientHeight;
    const availW = fullW - 24, availH = fullH - ui.offsetHeight - 34;
    if (fullW <= 0 || fullH <= 0) return;
    const below = availW > 0 && availH > 0 ? Math.min(availW / W, availH / H) : 0, full = Math.min(fullW / W, fullH / H);
    const compact = full > below * 1.25;
    container.classList.toggle("compact", compact);
    const s = compact ? full : below;
    scale = s >= 1 && !compact ? Math.floor(s) : s;
    for (const node of [screen, canvas]) {
      node.style.width = `${W * scale}px`;
      node.style.height = `${H * scale}px`;
    }
    ui.style.width = compact ? "" : `${Math.max(W * scale, Math.min(availW, 360))}px`;
    canvas.style.imageRendering = scale >= 1 ? "pixelated" : "auto";
  }
  const ro = new ResizeObserver(layout);
  ro.observe(container);

  function toImage(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }

  /* ---------- Escenaris i objectes ---------- */

  function meshFor(s) {
    if (!meshes.has(s.id)) meshes.set(s.id, createNavMesh(s.walkable));
    return meshes.get(s.id);
  }

  async function imageFor(file) {
    if (!file) return null;
    if (!images.has(file)) {
      images.set(file, null);
      images.set(file, await loadImage(imageUrl(file)));
    }
    return images.get(file);
  }

  const sheetOf = (ch) => (ch?.sheet ? images.get(ch.sheet) ?? null : null);
  // Tots els personatges s'escalen igual segons la profunditat; l'alçada del fotograma del protagonista fa de referència
  const heightFor = (ch, y) => heightAt(y) * (ch && sheetOf(ch) && playerCh && sheetOf(playerCh) ? ch.frameHeight / playerCh.frameHeight : 1);
  const poseOf = (a) => ({
    x: a.x, y: a.y, height: heightFor(a.ch, a.y), dir: a.dir, flip: a.facing, time: a.time, step: a.step,
    anim: a.path?.length ? "walk" : speech?.speaker === a ? "talk" : "idle",
  });

  // Objectes que ara mateix són en aquest escenari, amb la imatge del seu estat i el rectangle que ocupen.
  // Si un canvi d'estat demana una imatge que encara no s'ha carregat, es carrega i surt al cap d'un moment.
  function sceneObjects() {
    if (!scene) return [];
    return scene.objects.flatMap((p) => {
      const object = library.get(p.objectId);
      if (!object || game.location.get(object.id) !== scene.id) return [];
      const file = spriteFile(object, game.states.get(object.id), performance.now() / 1000);
      if (!file) return [];
      if (!images.has(file)) imageFor(file);
      const sprite = images.get(file);
      return sprite ? [{ p, object, sprite, rect: spriteRect(p.position, sprite) }] : [];
    });
  }

  function fade(to) {
    fader.style.opacity = String(to);
    return new Promise((r) => setTimeout(r, FADE_MS));
  }

  // Canvia l'opacitat del fos a l'instant, sense l'animació
  function blackNow(on) {
    fader.style.transition = "none";
    fader.style.opacity = on ? "1" : "0";
    void fader.offsetWidth;
    fader.style.transition = "";
  }

  // El cercle que es tanca (o s'obre) sobre el protagonista: un forat rodó amb una ombra negra que ho tapa tot
  function irisTo(open, [cx, cy]) {
    const big = Math.hypot(W * scale, H * scale);
    const place = (r) => Object.assign(iris.style, { width: `${r * 2}px`, height: `${r * 2}px`, left: `${cx - r}px`, top: `${cy - r}px` });
    iris.style.transition = "none";
    iris.hidden = false;
    place(open ? 0 : big);
    void iris.offsetWidth;
    iris.style.transition = "";
    place(open ? big : 0);
    return new Promise((r) => setTimeout(r, IRIS_MS));
  }
  const actorOnScreen = () => [actor.x * scale, (actor.y - heightFor(actor.ch, actor.y) / 2) * scale];

  async function transitionOut(kind) {
    if (!scene || kind === "cut" || skipping) return blackNow(true);
    if (kind === "iris") {
      await irisTo(false, actorOnScreen());
      blackNow(true);
      iris.hidden = true;
      return;
    }
    await fade(1);
  }

  async function transitionIn(kind) {
    if (kind === "cut" || skipping) return blackNow(false);
    if (kind === "iris") {
      const opening = irisTo(true, actorOnScreen());
      blackNow(false);
      await opening;
      iris.hidden = true;
      return;
    }
    await fade(0);
  }

  // quiet: sense la seqüència d'entrada (en carregar una partida no s'ha de tornar a veure)
  async function enterScene(id, arrival, { quiet = false } = {}) {
    const next = adventure.scenes.find((s) => s.id === id);
    if (!next) { say("Aquest escenari ja no existeix."); return; }
    busy = true;
    hover = null;
    pending = null;
    verb = null;
    first = null;
    clearSpeech();
    await transitionOut(next.transition);
    if (destroyed) return;
    scene = next;
    img = await imageFor(scene.background);
    await Promise.all([
      ...scene.objects.map((p) => {
        const o = library.get(p.objectId);
        return o ? Promise.all(stateFiles(o, game.states.get(o.id)).map(imageFor)) : null;
      }),
      imageFor(playerCh?.sheet),
      ...scene.characters.map((p) => imageFor(cast.get(p.characterId)?.sheet)),
    ]);
    W = img?.naturalWidth ?? FALLBACK.w;
    H = img?.naturalHeight ?? FALLBACK.h;
    canvas.width = W;
    canvas.height = H;
    layout();
    mesh = meshFor(scene);
    heightAt = actorHeightAt(scene, H);
    // Sense punt d'arribada, el personatge surt al punt de la zona caminable més proper a baix al mig
    const target = arrival ?? [W / 2, H];
    const p = mesh.isEmpty ? [clamp(target[0], 0, W), clamp(target[1], 0, H)] : mesh.nearestPoint(target);
    Object.assign(actor, { x: p[0], y: p[1], path: [], onArrive: null });
    // El protagonista no surt mai com a personatge col·locat, encara que algú l'hagi deixat en un escenari
    npcs = scene.characters
      .filter((pl) => pl.characterId !== adventure.playerId && cast.has(pl.characterId))
      .map((pl) => ({ ch: cast.get(pl.characterId), placement: pl, x: pl.position[0], y: pl.position[1], path: [], step: 0, time: 0, onArrive: null, ...facingFields(pl.facing) }));
    // La música de l'escenari; si no en té, continua la que soni
    if (scene.music) audio.music(scene.music);
    renderVerbs();
    renderInventory();
    updateSentence();
    onSceneChange?.(scene);
    await transitionIn(scene.transition);
    busy = false;
    // La seqüència d'entrada (si n'hi ha); qui hagi cridat enterScene l'espera
    const enter = scene.onEnter;
    if (!quiet && enter?.cutsceneId && !(enter.once && game.seen.has(enter.cutsceneId))) {
      await script([{ type: "cutscene", cutsceneId: enter.cutsceneId }]);
    } else if (mesh.isEmpty && !cutsceneDepth) say("Aquí no hi ha on caminar.");
  }

  /* ---------- Coses: a l'escenari i a l'inventari ---------- */

  // Els objectes i personatges queden per sobre dels punts calents; d'entre ells, el que es dibuixa a sobre
  function targetAt(p) {
    if (!scene) return null;
    for (const d of drawables().reverse()) {
      if (d.kind === "object") {
        const o = d.item, { x, y, w, h } = o.rect;
        if (o.object.decor) continue;   // els objectes decoratius (llums, espelmes...) no es poden tocar
        if (p[0] >= x && p[0] < x + w && p[1] >= y && p[1] < y + h && opaqueAt(o.sprite, p[0] - x, p[1] - y)) {
          return {
            kind: "object", id: o.object.id, name: o.object.name, description: o.object.description, object: o.object,
            inScene: true, walkTo: o.p.walkTo ?? o.p.position, facing: o.p.facing, anchor: o.p.position,
          };
        }
      } else if (d.kind === "npc") {
        const n = d.item, pose = poseOf(n);
        if (characterHit(n.ch, sheetOf(n.ch), pose, p)) {
          return {
            kind: "character", id: n.ch.id, name: n.ch.name, description: n.ch.description, npc: n, inScene: true,
            walkTo: n.placement.walkTo ?? defaultApproach([n.x, n.y], n.placement.facing, pose.height),
            facing: "auto", anchor: [n.x, n.y],
          };
        }
      }
    }
    for (let i = scene.hotspots.length - 1; i >= 0; i--) {
      const h = scene.hotspots[i];
      if (pointInPolygon(p, h.polygon)) {
        return { kind: "hotspot", id: h.id, name: h.name, description: h.description, inScene: true, walkTo: p, facing: "auto", anchor: p, exit: h.exit };
      }
    }
    return null;
  }

  function facingFields(facing) {
    const { dir, flip } = facingToDir(facing);
    return { dir, facing: flip };
  }

  const inventoryTarget = (o) => ({ kind: "object", id: o.id, name: o.name, description: o.description, object: o, inScene: false });

  function renderInventory() {
    // Tot el que canvia la partida acaba refent l'inventari: és el moment d'avisar el mode de proves
    onStateChange?.();
    inventoryBox.replaceChildren();
    const items = game.inventory.map((id) => library.get(id)).filter(Boolean);
    if (!items.length) {
      const empty = document.createElement("span");
      empty.className = "inv-empty";
      empty.textContent = "Inventari buit";
      inventoryBox.append(empty);
      return;
    }
    for (const o of items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "inv-item";
      b.title = o.name;
      b.setAttribute("aria-label", o.name);
      b.classList.toggle("selected", first?.id === o.id);
      const file = o.icon ?? spriteFile(o, game.states.get(o.id));
      if (file) {
        const im = document.createElement("img");
        im.alt = "";
        im.src = imageUrl(file);
        b.append(im);
      } else {
        b.textContent = o.name;
      }
      const target = inventoryTarget(o);
      b.onpointerenter = () => { hover = target; updateSentence(); };
      b.onpointerleave = () => { hover = null; updateSentence(); };
      // Sense verb, un clic a l'inventari mira l'objecte
      b.onclick = () => (verb || first ? choose(target) : look(target));
      b.oncontextmenu = (e) => { e.preventDefault(); look(target); };
      inventoryBox.append(b);
    }
  }

  /* ---------- Verbs i frase ---------- */

  function pickVerb(v) {
    verb = verb?.id === v.id ? null : v;
    first = null;
    renderVerbs();
    renderInventory();
    updateSentence();
  }

  // Les tecles d'un verb: la seva drecera i, si cap verb no l'ha agafada, el número de la seva posició (1-9)
  function verbKeys(v) {
    const keys = v.key ? [v.key] : [];
    const n = String(adventure.verbs.indexOf(v) + 1);
    if (n.length === 1 && n !== "0" && !adventure.verbs.some((o) => o.key === n)) keys.push(n);
    return keys;
  }
  const verbForKey = (k) => adventure.verbs.find((v) => verbKeys(v).includes(k));

  function renderVerbs() {
    verbBox.replaceChildren();
    for (const v of adventure.verbs) {
      const b = document.createElement("button");
      b.type = "button";
      // La lletra de la drecera surt subratllada al nom, com als menús clàssics
      const at = v.key ? v.name.toLowerCase().indexOf(v.key) : -1;
      if (at >= 0) {
        const u = document.createElement("u");
        u.textContent = v.name[at];
        b.append(v.name.slice(0, at), u, v.name.slice(at + 1));
      } else b.textContent = v.name;
      b.setAttribute("aria-pressed", String(verb?.id === v.id));
      const keys = verbKeys(v);
      if (keys.length) {
        b.title = `Tecla ${keys.map((k) => k.toUpperCase()).join(" o ")}`;
        b.setAttribute("aria-keyshortcuts", keys.map((k) => k.toUpperCase()).join(" "));
      }
      b.onclick = () => {
        if (busy || scripting) return;
        pickVerb(v);
      };
      verbBox.append(b);
    }
  }

  // «Camina a Porta», «Mira Barril», «Fes servir Clau amb Porta»…
  // Mentre s'executa una acció, la frase queda fixada i ressaltada.
  function updateSentence() {
    let words;
    if (pending) {
      const v = pending.verb;
      words = [v ? v.name : "Camina a", pending.target.name, pending.with && v.preposition, pending.with?.name];
    } else if (first) {
      words = [verb.name, first.name, verb.preposition, hover?.id !== first.id && hover?.name];
    } else {
      words = verb || hover ? [verb ? verb.name : "Camina a", hover?.name] : ["Camina"];
    }
    sentence.textContent = words.filter(Boolean).join(" ");
    sentence.classList.toggle("active", !!pending);
  }

  function resetVerb() {
    verb = null;
    first = null;
    renderVerbs();
    renderInventory();
    updateSentence();
  }

  /* ---------- Accions ---------- */

  function useExit(exit) {
    if (!exit?.sceneId) { say("Per aquí no es va enlloc."); return; }
    // Una sortida tancada (per exemple, cal un bitllet): el protagonista diu per què no hi pot passar
    if (!(exit.conditions ?? []).every((c) => checkCondition(game, c))) { say(exit.blocked || "Ara no hi puc passar."); return; }
    enterScene(exit.sceneId, exit.arrival);
  }

  // Les accions de les regles: les frases esperen que s'acabin (o que el jugador cliqui per saltar-les)
  const fx = {
    say: (text, by) => say(text, speakerFor(by)),
    goto: (id, arrival) => enterScene(id, arrival),
    wait: (seconds) => wait(seconds),
    end: (text) => showEnd(text),
    changed: () => renderInventory(),
    dialogue: (id) => runDialogue(id),
    walk: (point, by) => walkTo(by, point),
    sound: (id) => { if (!skipping) audio.sound(id); },
    music: (id) => audio.music(id),
    cutscene: (id) => runCutscene(id),
  };

  /* ---------- Seqüències ---------- */

  // Mentre dura una seqüència, els verbs i l'inventari no es veuen i el jugador no pot fer res (un clic salta la frase)
  async function runCutscene(id) {
    const c = adventure.cutscenes.find((x) => x.id === id);
    if (!c) return;
    game.seen.add(id);
    cutsceneDepth++;
    ui.classList.add("cutscene");
    try {
      await runActions(adventure, game, c.actions, fx);
    } finally {
      cutsceneDepth--;
      if (!cutsceneDepth) {
        skipping = false;
        ui.classList.remove("cutscene");
      }
    }
  }

  // Esc: el que queda de la seqüència es fa a l'instant
  function skipCutscene() {
    if (!cutsceneDepth || skipping) return;
    skipping = true;
    for (const m of [actor, ...npcs]) finishWalk(m);
    clearSpeech();
    waitSkip?.();
  }

  // Un personatge (o el protagonista, amb «by» buit) camina fins a un punt; la promesa es compleix quan hi arriba
  function walkTo(by, point) {
    const who = !by || by === adventure.playerId ? actor : npcs.find((n) => n.ch.id === by);
    if (!who || !mesh) return;
    const target = mesh.isEmpty ? point : mesh.nearestPoint(point);
    const path = mesh.isEmpty ? null : mesh.findPath([who.x, who.y], target);
    if (skipping || !path) {
      Object.assign(who, { x: target[0], y: target[1], path: [] });
      return;
    }
    who.path = path.slice(1);
    return new Promise((resolve) => { who.onArrive = resolve; });
  }

  function finishWalk(m) {
    if (!m.path.length) return;
    const [x, y] = m.path.at(-1);
    Object.assign(m, { x, y, path: [] });
  }

  let waitSkip = null;
  function wait(seconds) {
    if (skipping) return;
    return new Promise((resolve) => {
      const t = setTimeout(done, seconds * 1000);
      function done() { clearTimeout(t); waitSkip = null; resolve(); }
      waitSkip = done;
    });
  }

  /* ---------- Diàlegs ---------- */

  // Mentre hi ha una conversa, les opcions ocupen el lloc dels verbs i l'inventari
  function showOptions(on) {
    optionsBox.hidden = !on;
    verbBox.hidden = on;
    inventoryBox.hidden = on;
    sentence.style.visibility = on ? "hidden" : "";
    layout();
  }

  // Mostra les opcions i espera que el jugador en triï una
  function chooseOption(options) {
    return new Promise((resolve) => {
      optionsBox.replaceChildren();
      for (const o of options) {
        const b = document.createElement("button");
        b.type = "button";
        b.role = "listitem";
        b.textContent = o.text;
        b.onclick = () => {
          optionsBox.replaceChildren();
          resolve(o);
        };
        optionsBox.append(b);
      }
      showOptions(true);
    });
  }

  // Una conversa: el node diu les seves frases, el jugador tria una opció, el protagonista la diu,
  // es fan les seves accions i es passa al node on porta. S'acaba quan no hi ha cap opció o una porta a «fi».
  async function runDialogue(id) {
    const d = adventure.dialogues.find((x) => x.id === id);
    let node = d && startNode(d);
    try {
      while (node && !game.ended && !destroyed) {
        for (const line of node.lines) {
          if (game.ended) return;
          await say(line.text, speakerFor(line.by));
        }
        const options = availableOptions(d, node, game);
        if (!options.length) break;
        const option = await chooseOption(options);
        showOptions(false);
        markSaid(game, d, option);
        onStateChange?.();
        await say(option.text, actor);
        await runActions(adventure, game, option.actions, fx);
        node = option.next ? d.nodes.find((n) => n.id === option.next) : null;
      }
    } finally {
      showOptions(false);
      renderInventory();
    }
  }

  async function script(actions) {
    scriptDepth++;
    scripting = true;
    setCursor("wait");
    try {
      await runActions(adventure, game, actions, fx);
    } finally {
      scriptDepth--;
      scripting = scriptDepth > 0;
      if (!scripting) setCursor("normal");
      updateSentence();
    }
  }

  // El que passa quan el personatge arriba: la primera regla que encaixa o, si no n'hi ha cap, el comportament per defecte
  function execute({ verb: v, target, with: w }) {
    if (!v) {
      if (target?.exit) useExit(target.exit);
      return;
    }
    const rule = findRule(adventure, game, v.id, refOf(target), w ? refOf(w) : null);
    if (rule) return script(rule.actions);
    if (v.id === LOOK && !w) return say(target.description || v.response);
    // Els objectes que es poden agafar s'agafen sense haver d'escriure cap regla
    if (v.id === PICKUP && !w && target.kind === "object") {
      if (game.inventory.includes(target.id)) return say("Ja ho tinc.");
      if (target.object.pickable) {
        applyStateAction(adventure, game, { type: "take", objectId: target.id });
        renderInventory();
        return;
      }
    }
    // «Parla amb» un personatge que té un diàleg el comença
    if (v.id === "talk" && !w && target.kind === "character") {
      const dialogue = dialogueFor(adventure, target.id);
      if (dialogue) return script([{ type: "dialogue", dialogueId: dialogue.id }]);
    }
    if (v.response) say(v.response);
  }

  function face(target) {
    actor.dir = "side";
    if (target.facing === "left") actor.facing = -1;
    else if (target.facing === "right") actor.facing = 1;
    else if (Math.abs(target.anchor[0] - actor.x) > 1) actor.facing = target.anchor[0] > actor.x ? 1 : -1;
    // Un personatge es gira cap al protagonista quan s'hi parla
    if (target.npc) {
      target.npc.dir = "side";
      target.npc.facing = actor.x > target.npc.x ? 1 : -1;
    }
  }

  // Camina fins a la cosa de l'escenari que hi intervé (si n'hi ha) i llavors executa l'acció
  function go(action, point) {
    const place = [action.with, action.target].find((t) => t?.inScene);
    if (!action.target) {
      // Clic al buit: només caminar
      const path = mesh.isEmpty ? null : mesh.findPath([actor.x, actor.y], point);
      if (path) { actor.path = path.slice(1); actor.onArrive = null; }
      else say(mesh.isEmpty ? "Aquí no hi ha on caminar." : "No hi puc arribar.");
      pending = null;
      resetVerb();
      return;
    }
    if (!place || mesh.isEmpty) {
      resetVerb();
      execute(action);
      return;
    }
    const path = mesh.findPath([actor.x, actor.y], place.walkTo);
    if (!path) {
      // Mirar es pot fer de lluny; la resta cal fer-ho de prop
      resetVerb();
      if (action.verb?.id === LOOK) execute(action);
      else say("No hi puc arribar.");
      return;
    }
    actor.path = path.slice(1);
    pending = action;
    verb = null;
    first = null;
    renderVerbs();
    renderInventory();
    updateSentence();
    actor.onArrive = () => {
      if (pending !== action) return;
      pending = null;
      face(place);
      updateSentence();
      execute(action);
    };
  }

  // El jugador ha clicat una cosa (o el buit, amb target null) amb el verb triat
  function choose(target, point) {
    if (busy) return;
    if (scripting) { clearSpeech(); return; }
    clearSpeech();
    // «Fes servir» o «Dóna» amb un objecte de l'inventari: falta el segon
    if (verb?.preposition && !first && target?.kind === "object" && !target.inScene) {
      first = target;
      renderInventory();
      updateSentence();
      return;
    }
    if (first) {
      if (!target || target.id === first.id) { resetVerb(); return; }
      const action = { verb, target: first, with: target };
      go(action, point);
      return;
    }
    go({ verb, target, with: null }, point);
  }

  function look(target) {
    if (busy) return;
    if (scripting) { clearSpeech(); return; }
    if (!lookVerb) return;
    clearSpeech();
    const keep = verb;
    go({ verb: lookVerb, target, with: null });
    verb = keep;
    renderVerbs();
    updateSentence();
  }

  // Doble clic en una sortida: s'hi passa de seguida, sense esperar que el protagonista hi arribi caminant
  let lastClick = { t: 0, id: null };
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || menuOpen) return;
    const p = toImage(e);
    const target = targetAt(p);
    const now = performance.now();
    const double = target?.exit && target.id === lastClick.id && now - lastClick.t < 400;
    lastClick = { t: now, id: target?.id ?? null };
    if (double && !verb && !first && !busy && !scripting) {
      Object.assign(actor, { path: [], onArrive: null });
      pending = null;
      updateSentence();
      useExit(target.exit);
      return;
    }
    choose(target, p);
  });

  // El clic dret mira la cosa, sense canviar el verb triat
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const target = targetAt(toImage(e));
    if (target) look(target);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (busy) return;
    const t = targetAt(toImage(e));
    if (t?.id !== hover?.id) {
      hover = t;
      updateSentence();
    }
    setCursor(scripting ? "wait" : t ? "hover" : "normal");
  });
  canvas.addEventListener("pointerleave", () => { hover = null; updateSentence(); });

  /* ---------- Frases i final ---------- */

  function clearSpeech() {
    if (!speech) return;
    speech.el.remove();
    const done = speech.done;
    speech = null;
    done?.();
  }

  // Qui diu una frase d'una regla: el protagonista (by buit), un personatge de l'escenari,
  // o una veu de fora si el personatge no hi és (surt a dalt de tot, amb el seu color)
  function speakerFor(by) {
    if (!by || by === adventure.playerId) return actor;
    return npcs.find((n) => n.ch.id === by) ?? { ch: cast.get(by) ?? null, offstage: true };
  }

  // Retorna una promesa que es compleix quan la frase desapareix (per temps, per un clic o per una altra frase)
  function say(text, speaker = actor) {
    clearSpeech();
    if (skipping) return Promise.resolve();
    const el = document.createElement("div");
    el.className = "speech";
    el.textContent = text;
    el.style.color = speaker.ch?.color ?? "#fff";
    overlay.append(el);
    const s = { el, until: performance.now() + 1500 + text.length * 60, done: null, speaker };
    speech = s;
    placeSpeech();
    return new Promise((resolve) => { s.done = resolve; });
  }

  // La frase va damunt del cap de qui parla, sense sortir de la pantalla
  function placeSpeech() {
    if (!speech) return;
    const el = speech.el, who = speech.speaker;
    const [x, top] = who.offstage ? [W / 2, 0] : [who.x, who.y - heightFor(who.ch, who.y) - 4];
    const headY = top * scale;
    const left = clamp(x * scale - el.offsetWidth / 2, 4, W * scale - el.offsetWidth - 4);
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(el.offsetHeight + 4, headY)}px`;
  }

  function showEnd(text) {
    busy = true;
    clearSpeech();
    endScreen.querySelector("p").textContent = text;
    endScreen.querySelector(".credits").textContent = adventure.credits ?? "";
    endScreen.hidden = false;
  }
  endScreen.querySelector("button").onclick = () => (title ? showTitle() : restart());

  /* ---------- Pantalla de títol ---------- */

  // Surt abans de començar; el clic de «Comença» també és el que deixa sonar la música
  function showTitle() {
    const t = adventure.titleScreen ?? {};
    endScreen.hidden = true;
    blackNow(true);
    titleScreen.style.backgroundImage = t.image ? `url("${imageUrl(t.image)}")` : "";
    titleScreen.querySelector("strong").textContent = adventure.title;
    titleScreen.querySelector("span").textContent = t.subtitle ?? "";
    titleScreen.querySelector("[data-act=load]").hidden = !saves.any();
    titleScreen.hidden = false;
    busy = true;
    audio.stop();
    if (t.music) audio.music(t.music);
  }
  titleScreen.querySelector("[data-act=start]").onclick = () => {
    titleScreen.hidden = true;
    audio.unlock();
    restart(setup);
  };
  titleScreen.querySelector("[data-act=load]").onclick = () => openMenu();

  /* ---------- Partides desades ---------- */

  // Només es pot desar quan no passa res: ni seqüències, ni converses, ni transicions, ni el títol o el final
  const canSave = () => !!scene && !busy && !scripting && optionsBox.hidden && endScreen.hidden && titleScreen.hidden;
  const formatDate = (iso) => new Date(iso).toLocaleString("ca", { dateStyle: "short", timeStyle: "short" });

  function openMenu() {
    menuOpen = true;
    menu.querySelector(".player-menu-msg").textContent = canSave() ? "" : "Ara no es pot desar: espera que acabi el que està passant.";
    renderMenu();
    menu.hidden = false;
    menu.querySelector("button").focus();
  }

  function closeMenu() {
    menuOpen = false;
    menu.hidden = true;
  }

  function renderMenu() {
    const list = menu.querySelector("ol");
    list.replaceChildren();
    saves.list().forEach((slot, i) => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = slot ? `${slot.sceneName} · ${formatDate(slot.savedAt)}` : "Buida";
      li.append(label);
      const button = (text, act, disabled) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.disabled = disabled;
        b.onclick = act;
        li.append(b);
      };
      button("Desa", () => {
        const ok = saves.save(i, snapshot());
        menu.querySelector(".player-menu-msg").textContent = ok ? `Desat a la ranura ${i + 1}.` : "Aquest navegador no deixa desar partides.";
        renderMenu();
      }, !canSave());
      button("Carrega", () => loadGame(slot), !slot);
      button("Esborra", () => { saves.remove(i); renderMenu(); }, !slot);
      list.append(li);
    });
  }

  function snapshot() {
    return {
      version: 1,
      sceneId: scene.id,
      sceneName: scene.name,
      position: [Math.round(actor.x), Math.round(actor.y)],
      facing: actor.facing,
      dir: actor.dir,
      musicId: audio.musicId,
      game: serializeGame(game),
    };
  }

  async function loadGame(data) {
    closeMenu();
    game = restoreGame(adventure, data.game ?? {});
    endScreen.hidden = true;
    titleScreen.hidden = true;
    scripting = false;
    scriptDepth = 0;
    cutsceneDepth = 0;
    skipping = false;
    ui.classList.remove("cutscene");
    showOptions(false);
    audio.unlock();
    const sceneId = adventure.scenes.some((x) => x.id === data.sceneId) ? data.sceneId : startSceneId;
    await enterScene(sceneId, data.position, { quiet: true });
    actor.facing = data.facing ?? 1;
    actor.dir = data.dir ?? "side";
    // La música que sonava en desar (l'escenari pot no tenir-ne i heretar la d'un altre)
    if (data.musicId) audio.music(data.musicId);
    renderInventory();
  }

  ui.querySelector(".player-menu-button").onclick = () => (menuOpen ? closeMenu() : openMenu());
  // Amagar els verbs i l'inventari (en mode compact tapen una mica l'escenari)
  const hideButton = ui.querySelector(".player-hide-button");
  hideButton.onclick = () => hideButton.setAttribute("aria-pressed", String(container.classList.toggle("ui-hidden")));
  // Pantalla completa: amb l'API del navegador si n'hi ha (i girant el mòbil de costat), i si no (iPhone), ocupant
  // tota la pàgina
  ui.querySelector(".player-full-button").onclick = async () => {
    const on = !container.classList.contains("player-fullpage");
    container.classList.toggle("player-fullpage", on);
    try {
      if (on && !document.fullscreenElement) { await container.requestFullscreen?.(); await window.screen.orientation?.lock?.("landscape"); }
      else if (!on && document.fullscreenElement) await document.exitFullscreen();
    } catch { /* el navegador no ho permet: es queda a tota la pàgina */ }
  };
  // Encendre i apagar el so (també des de fora, amb setMuted: el botó «So» de l'editor, Maj+M)
  const soundButton = ui.querySelector(".player-sound-button");
  let muted = false;
  function setMuted(on) {
    muted = !!on;
    audio.setMuted(muted);
    soundButton.textContent = muted ? "🔇" : "🔊";
    soundButton.setAttribute("aria-pressed", String(muted));
    onMuteChange?.(muted);
  }
  soundButton.onclick = () => setMuted(!muted);
  const onFullscreen = () => { if (!document.fullscreenElement) container.classList.remove("player-fullpage"); };
  document.addEventListener("fullscreenchange", onFullscreen);
  menu.querySelector("[data-act=close]").onclick = closeMenu;
  // Qualsevol clic al joc torna a provar la música si el navegador l'havia aturat
  container.addEventListener("pointerdown", () => audio.unlock());

  function onKey(e) {
    if (e.key === "Escape") {
      if (menuOpen) closeMenu();
      else skipCutscene();
      return;
    }
    // Les dreceres dels verbs (i els números 1-9, per posició): tornar a prémer el mateix el desfà
    if (e.key.length !== 1 || e.target.closest?.("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const v = verbForKey(e.key.toLowerCase());
    if (!v || busy || scripting || menuOpen || !optionsBox.hidden) return;
    e.preventDefault();
    pickVerb(v);
  }
  window.addEventListener("keydown", onKey);

  /* ---------- Bucle ---------- */

  // Mou un personatge (o el protagonista) pel seu camí i avisa quan arriba
  function move(m, dt) {
    if (m.path.length) {
      const [tx, ty] = m.path[0];
      const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
      const stepLen = heightAt(m.y) * WALK_SPEED * dt;
      if (Math.abs(dx) > 0.5) m.facing = dx > 0 ? 1 : -1;
      // De costat, de cara o d'esquena segons cap on va més. A l'últim tros (gairebé zero) no es toca,
      // perquè quedi mirant cap on caminava i no es giri de costat en arribar.
      if (d > 0.5) m.dir = Math.abs(dy) > Math.abs(dx) * 1.2 ? (dy > 0 ? "down" : "up") : "side";
      if (stepLen >= d) {
        m.x = tx;
        m.y = ty;
        m.path.shift();
      } else {
        m.x += (dx / d) * stepLen;
        m.y += (dy / d) * stepLen;
      }
      // Una passa cada mitja alçada de personatge, més o menys
      m.step += (Math.min(stepLen, d) / heightAt(m.y)) * 9;
    } else {
      m.step = 0;
    }
    m.time += dt;
    if (!m.path.length && m.onArrive) {
      const f = m.onArrive;
      m.onArrive = null;
      f();
    }
  }

  function update(dt) {
    for (const m of [actor, ...npcs]) move(m, dt);
    if (speech && performance.now() > speech.until) clearSpeech();
  }

  // Tot el que es dibuixa sobre el fons, en ordre: objectes, personatges i el protagonista.
  // Els personatges van entre els objectes «automàtics» segons on tenen els peus.
  function drawables() {
    const items = [
      ...sceneObjects().map((o) => ({ kind: "object", item: o, layer: LAYER_ORDER[o.p.layer], y: o.p.position[1] })),
      ...npcs.map((n) => ({ kind: "npc", item: n, layer: LAYER_ORDER.auto, y: n.y })),
      { kind: "player", item: actor, layer: LAYER_ORDER.auto, y: actor.y },
    ];
    return items.sort((a, b) => a.layer - b.layer || a.y - b.y);
  }

  function strokePolygon(poly, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
  }

  function drawDebug(objects) {
    ctx.lineWidth = Math.max(1, W / 640);
    for (const p of mesh.polygons) strokePolygon(p, "#4ade80");
    for (const h of scene.hotspots) strokePolygon(h.polygon, h.exit ? "#60a5fa" : "#f5b942");
    ctx.strokeStyle = "#e879f9";
    for (const o of objects) ctx.strokeRect(o.rect.x + 0.5, o.rect.y + 0.5, o.rect.w - 1, o.rect.h - 1);
    ctx.strokeStyle = "#38bdf8";
    for (const n of npcs) {
      const r = characterRect(n.ch, sheetOf(n.ch), n.x, n.y, heightFor(n.ch, n.y));
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    }
    ctx.fillStyle = "#fff";
    for (const [x, y] of mesh.nodes) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    if (actor.path.length) {
      ctx.strokeStyle = "#fff";
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(actor.x, actor.y);
      for (const [x, y] of actor.path) ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function draw() {
    ctx.imageSmoothingEnabled = false;
    if (img) ctx.drawImage(img, 0, 0);
    else {
      ctx.fillStyle = "#14121f";
      ctx.fillRect(0, 0, W, H);
    }
    if (!scene) return;
    for (const d of drawables()) {
      if (d.kind === "object") ctx.drawImage(d.item.sprite, d.item.rect.x, d.item.rect.y);
      else drawCharacter(ctx, d.item.ch, sheetOf(d.item.ch), poseOf(d.item));
    }
    if (debug) drawDebug(sceneObjects());
  }

  function loop(t) {
    if (destroyed) return;
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    update(dt);
    draw();
    placeSpeech();
    frame = requestAnimationFrame(loop);
  }

  /* ---------- Mode de proves ---------- */

  // On era cada objecte al principi, per tornar-lo al seu lloc si el mode de proves el treu de l'inventari
  const homeScene = new Map(adventure.scenes.flatMap((s) => s.objects.map((p) => [p.objectId, s.id])));

  function setHas(id, on) {
    if (!library.has(id)) return;
    if (on) applyStateAction(adventure, game, { type: "take", objectId: id });
    else {
      game.inventory = game.inventory.filter((x) => x !== id);
      if (homeScene.has(id)) game.location.set(id, homeScene.get(id));
      else game.location.delete(id);
    }
  }

  // Una situació de prova: { sceneId, inventory: [ids], states: {obj: estat}, vars: {var: valor}, said: ["diàleg:opció"] }
  function applySetup(st) {
    if (!st) return;
    for (const id of st.inventory ?? []) setHas(id, true);
    for (const [id, state] of Object.entries(st.states ?? {})) {
      if (library.get(id)?.states.some((x) => x.id === state)) game.states.set(id, state);
    }
    for (const [id, value] of Object.entries(st.vars ?? {})) if (game.vars.has(id)) game.vars.set(id, value);
    for (const key of st.said ?? []) game.said.add(key);
  }

  async function restart(st = null) {
    game = createGameState(adventure);
    applySetup(st);
    endScreen.hidden = true;
    titleScreen.hidden = true;
    scripting = false;
    scriptDepth = 0;
    cutsceneDepth = 0;
    skipping = false;
    ui.classList.remove("cutscene");
    showOptions(false);
    const sceneId = st?.sceneId && adventure.scenes.some((x) => x.id === st.sceneId) ? st.sceneId : startSceneId;
    await enterScene(sceneId);
    // La seqüència d'inici, només quan es comença de veritat: ni en una situació de prova ni provant un altre escenari
    const realStart = adventure.startSceneId ?? adventure.scenes[0]?.id;
    if (!st && adventure.introCutsceneId && sceneId === startSceneId && sceneId === realStart) {
      await script([{ type: "cutscene", cutsceneId: adventure.introCutsceneId }]);
    }
  }

  fader.style.opacity = "1";
  frame = requestAnimationFrame(loop);
  if (title) showTitle();
  else restart(setup);

  return {
    restart: (st) => (title && !st ? showTitle() : restart(st)),
    setDebug(on) { debug = on; },
    setMuted,
    isMuted: () => muted,
    // Per al panell de proves: llegir la partida i canviar-la en directe
    debug: {
      get game() { return game; },
      sceneId: () => scene?.id ?? null,
      goto: (id) => enterScene(id),
      setHas(id, on) { setHas(id, on); renderInventory(); },
      setState(id, state) { game.states.set(id, state); renderInventory(); },
      setVar(id, value) { game.vars.set(id, value); renderInventory(); },
      forgetSaid() { game.said.clear(); renderInventory(); },
      snapshot: () => ({
        sceneId: scene?.id ?? null,
        inventory: [...game.inventory],
        states: Object.fromEntries(game.states),
        vars: Object.fromEntries(game.vars),
        said: [...game.said],
      }),
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      document.removeEventListener("fullscreenchange", onFullscreen);
      clearSpeech();
      audio.stop();
      window.removeEventListener("keydown", onKey);
    },
  };
}
