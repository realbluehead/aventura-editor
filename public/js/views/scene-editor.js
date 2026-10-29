// Editor visual d'un escenari: zones caminables, punts calents i sortides dibuixats sobre la imatge de fons.
// Tot es guarda en píxels de la imatge original, així no depèn del zoom ni de la mida de la finestra.
import { saveScene, imageUrl, request, sceneUrl } from "../api.js";
import { openPaintEditor } from "../paint/editor.js";
import { $, el, loadImage, toast, colorSwatch } from "../ui.js";
import { openSceneDialog } from "../dialogs.js";
import { pointInPolygon, distToSegment, isSelfIntersecting, centroid, bounds } from "../geometry.js";
import { autoActorHeight, actorHeightAt } from "../player/actor.js";
import { nearestWalkable } from "../player/navmesh.js";
import { spriteFile, spriteRect, opaqueAt } from "../player/objects.js";
import { openObjectDialog } from "../object-dialog.js";
import { conditionsEditor } from "../logic-fields.js";
import { characterRect, characterHit, drawCharacter, facingToDir, defaultApproach } from "../player/characters.js";

const COLORS = { walkable: "#4ade80", hotspot: "#f5b942", exit: "#60a5fa", object: "#e879f9", character: "#38bdf8", bad: "#e5566b" };
const CHARACTER_FACING_LABELS = { down: "De cara", left: "A l'esquerra", right: "A la dreta", up: "D'esquena" };
const FACING_LABELS = { auto: "Cap a l'objecte", left: "A l'esquerra", right: "A la dreta" };
const LAYER_LABELS = { auto: "Segons la profunditat", back: "Sempre darrere del personatge", front: "Sempre davant del personatge" };
const LAYER_ORDER = { back: 0, auto: 1, front: 2 };
const HANDLE = 5;          // radi dels vèrtexs, en píxels de pantalla
const HIT = 8;             // distància a la qual s'encerta un vèrtex o una vora
const MAX_HISTORY = 200;
const MIN_ZOOM = 0.1, MAX_ZOOM = 16;
const SAVE_DELAY = 600;
const DOUBLE_CLICK_MS = 350;
const DRAG_THRESHOLD = 3;  // píxels de pantalla que cal moure abans no comenci a arrossegar (un clic no ha de moure res)

// Les dreceres no s'apliquen mentre s'escriu en un camp
const isTyping = (e) => e.target.closest?.("input, textarea, select") || document.querySelector("dialog[open]");
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export async function renderSceneEditor(view, adventure, scene, { refresh }) {
  const back = `#/aventura/${adventure.id}`;
  document.title = `${scene.name} · Editor d'aventures`;

  if (!scene.background) {
    view.innerHTML = `
      <div style="flex:1;max-width:960px;margin:0 auto;padding:24px 16px">
        <a class="back" href="${back}">← Aventura</a>
        <div class="empty-state"><strong>Aquest escenari no té fons</strong>
          Per dibuixar-hi zones i punts calents cal una imatge de fons.<br><br>
          <button class="primary" id="upload">Puja un fons</button> <button id="paint">🎨 Dibuixa'l</button>
        </div>
      </div>`;
    $("#upload").onclick = () => openSceneDialog(adventure, scene, refresh);
    $("#paint").onclick = () => paintBackground(adventure, scene, null, refresh);
    return;
  }

  const img = await loadImage(imageUrl(adventure.id, scene.background));
  const W = img.naturalWidth, H = img.naturalHeight;
  const otherScenes = adventure.scenes.filter((s) => s.id !== scene.id);
  const sceneName = (id) => adventure.scenes.find((s) => s.id === id)?.name;
  // Punts on apareix el personatge quan arriba des d'altres escenaris (els d'aquest es calculen en viu)
  const incoming = otherScenes.flatMap((s) => s.hotspots
    .filter((h) => h.exit?.sceneId === scene.id && h.exit.arrival)
    .map((h) => ({ point: h.exit.arrival, label: `Arribada des de ${s.name}` })));

  // Estat editable: és el que es desa i el que desfà/refà
  let doc = {
    walkable: structuredClone(scene.walkable),
    hotspots: structuredClone(scene.hotspots),
    objects: structuredClone(scene.objects),
    characters: structuredClone(scene.characters),
    actorHeight: structuredClone(scene.actorHeight),
    music: scene.music,
    transition: scene.transition,
    onEnter: structuredClone(scene.onEnter),
  };
  const undoStack = [], redoStack = [];
  let sel = null;    // { kind: "walkable" | "hotspot" | "object" | "character", index, vertex: número o null }
  let tool = "select";
  let draft = null;  // punts del polígon que s'està dibuixant
  let mouse = null;  // posició del ratolí en coordenades de la imatge
  let drag = null;   // arrossegament en curs: vista, vèrtex o forma sencera
  let spaceDown = false;
  let lastDown = { t: 0, x: 0, y: 0 };
  const cam = { scale: 1, x: 0, y: 0 };
  let cssW = 0, cssH = 0, fitted = false;
  let showGhosts = false;   // figures de mostra mentre s'ajusta l'alçada del personatge

  // Objectes de la biblioteca i la imatge del seu estat inicial (es carreguen a poc a poc i es redibuixa)
  const library = new Map(adventure.objects.map((o) => [o.id, o]));
  const sprites = new Map();   // nom de fitxer → imatge
  function loadSprites() {
    for (const o of library.values()) {
      const file = spriteFile(o);
      if (!file || sprites.has(file)) continue;
      sprites.set(file, null);
      loadImage(imageUrl(adventure.id, file)).then((im) => { sprites.set(file, im); draw(); }).catch(() => {});
    }
  }
  loadSprites();
  const spriteOf = (p) => {
    const file = spriteFile(library.get(p.objectId));
    return file ? sprites.get(file) ?? null : null;
  };

  // Personatges i el seu full de sprites. Tots fan servir la mateixa escala per profunditat que el protagonista:
  // si el protagonista té sprites, la seva alçada de fotograma és la referència, i així un personatge més alt es veu més alt.
  const cast = new Map(adventure.characters.map((c) => [c.id, c]));
  const player = cast.get(adventure.playerId) ?? null;
  const sheets = new Map();   // nom de fitxer → imatge
  for (const c of cast.values()) {
    if (!c.sheet || sheets.has(c.sheet)) continue;
    sheets.set(c.sheet, null);
    loadImage(imageUrl(adventure.id, c.sheet)).then((im) => { sheets.set(c.sheet, im); draw(); }).catch(() => {});
  }
  const sheetOf = (c) => (c?.sheet ? sheets.get(c.sheet) ?? null : null);
  const sceneHeightAt = () => actorHeightAt({ walkable: doc.walkable, actorHeight: doc.actorHeight }, H);
  const heightFor = (c, y, heightAt = sceneHeightAt()) =>
    heightAt(y) * (c && sheetOf(c) && player && sheetOf(player) ? c.frameHeight / player.frameHeight : 1);
  const poseOf = (p) => ({ x: p.position[0], y: p.position[1], height: heightFor(cast.get(p.characterId), p.position[1]), ...facingToDir(p.facing) });

  // El protagonista (o la figura provisional) a una posició: per a les figures de mostra
  function drawPlayerFigure(x, y, height, facing = 1) {
    drawCharacter(ctx, player, sheetOf(player), { x, y, height, dir: "side", flip: facing });
  }

  // Coses col·locades a l'escenari: objectes i personatges, amb el que tenen de diferent
  const PLACED = {
    object: { list: () => doc.objects, idKey: "objectId", color: COLORS.object, name: (p) => library.get(p.objectId)?.name },
    character: { list: () => doc.characters, idKey: "characterId", color: COLORS.character, name: (p) => cast.get(p.characterId)?.name },
  };
  const isPlaced = (s) => !!s && s.kind in PLACED;
  const placedOf = (s) => PLACED[s.kind].list()[s.index];
  const rectOf = (kind, p) => kind === "object"
    ? spriteRect(p.position, spriteOf(p))
    : characterRect(cast.get(p.characterId), sheetOf(cast.get(p.characterId)), p.position[0], p.position[1], poseOf(p).height);
  // Ordre de dibuix: primer els objectes que van sempre darrere, després tot per profunditat, i al final els de davant
  const drawOrder = () => [
    ...doc.objects.map((p, index) => ({ kind: "object", p, index, layer: LAYER_ORDER[p.layer] })),
    ...doc.characters.map((p, index) => ({ kind: "character", p, index, layer: LAYER_ORDER.auto })),
  ].sort((a, b) => a.layer - b.layer || a.p.position[1] - b.p.position[1]);
  const walkToOf = (kind, p) => p.walkTo ?? nearestWalkable(doc.walkable,
    kind === "object" ? p.position : defaultApproach(p.position, p.facing, poseOf(p).height));

  view.innerHTML = `
    <div class="editor">
      <div class="editor-bar">
        <a class="back" href="${back}">← Aventura</a>
        <span class="editor-title"></span>
        <div class="tools" role="toolbar" aria-label="Eines">
          <button data-tool="select" title="Selecciona i mou (V)">Selecciona</button>
          <button data-tool="walkable" title="Dibuixa una zona caminable (W)"><span class="swatch" style="background:var(--walkable)"></span>Zona caminable</button>
          <button data-tool="hotspot" title="Dibuixa un punt calent o una sortida (H)"><span class="swatch" style="background:#f5b942"></span>Punt calent</button>
        </div>
        <div class="tools">
          <button id="undo" title="Desfés (⌘Z)" aria-label="Desfés">↶</button>
          <button id="redo" title="Refés (⇧⌘Z)" aria-label="Refés">↷</button>
        </div>
        <div class="tools">
          <button id="zoom-out" title="Allunya (−)" aria-label="Allunya">−</button>
          <span class="zoom-label" id="zoom-label"></span>
          <button id="zoom-in" title="Apropa (+)" aria-label="Apropa">+</button>
          <button id="zoom-fit" title="Ajusta a la finestra (0)">Ajusta</button>
        </div>
        <button class="small" id="paint-bg" title="Obre el fons a l'editor de dibuix">🎨 Pinta el fons</button>
        <a class="button small" href="#/aventura/${adventure.id}/juga/${scene.id}" title="Juga des d'aquest escenari">▶ Prova</a>
        <span class="save-status" id="save-status" role="status"></span>
      </div>
      <div class="editor-main">
        <div class="stage" id="stage"><canvas></canvas><div class="hint"><span id="hint"></span></div></div>
        <aside class="panel"><div id="props"></div><div id="lists" style="display:flex;flex-direction:column;gap:20px"></div>
          <section class="keys"><h4>Dreceres</h4>
            <kbd>V</kbd> selecciona · <kbd>W</kbd> zona caminable · <kbd>H</kbd> punt calent<br>
            <kbd>Enter</kbd> tanca la forma · <kbd>Esc</kbd> cancel·la<br>
            <kbd>Supr</kbd> esborra el punt o la forma seleccionats<br>
            Doble clic a una vora: afegeix un punt<br>
            Arrossega el fons o <kbd>Espai</kbd>+arrossega: mou la vista<br>
            Pessic o <kbd>⌘</kbd>+roda: zoom · <kbd>0</kbd> ajusta<br>
            <kbd>⌘Z</kbd> desfés · <kbd>⇧⌘Z</kbd> refés
          </section>
        </aside>
      </div>
    </div>`;
  $(".editor-title").textContent = scene.name;
  const stage = $("#stage"), canvas = $("canvas", stage), ctx = canvas.getContext("2d");

  /* ---------- Coordenades i vista ---------- */

  const toScreen = ([x, y]) => [x * cam.scale + cam.x, y * cam.scale + cam.y];
  function screenPoint(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  function toImage(e) {
    const [sx, sy] = screenPoint(e);
    return [(sx - cam.x) / cam.scale, (sy - cam.y) / cam.scale];
  }
  const clampPt = ([x, y]) => [Math.round(clamp(x, 0, W)), Math.round(clamp(y, 0, H))];

  function fit() {
    const s = Math.min((cssW - 48) / W, (cssH - 48) / H);
    // Si l'escenari hi cap ampliat, fem servir un zoom enter perquè el pixel art es vegi net
    cam.scale = clamp(s >= 1 ? Math.floor(s) : s, MIN_ZOOM, MAX_ZOOM);
    cam.x = (cssW - W * cam.scale) / 2;
    cam.y = (cssH - H * cam.scale) / 2;
    zoomChanged();
  }

  function zoomAt(factor, sx = cssW / 2, sy = cssH / 2) {
    const s = clamp(cam.scale * factor, MIN_ZOOM, MAX_ZOOM);
    cam.x = sx - (sx - cam.x) * (s / cam.scale);
    cam.y = sy - (sy - cam.y) * (s / cam.scale);
    cam.scale = s;
    zoomChanged();
  }

  function zoomChanged() {
    $("#zoom-label").textContent = `${Math.round(cam.scale * 100)}%`;
    draw();
  }

  const ro = new ResizeObserver(() => {
    const r = stage.getBoundingClientRect();
    cssW = r.width;
    cssH = r.height;
    const dpr = devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    if (!fitted && cssW && cssH) { fitted = true; fit(); }
    draw();
  });
  ro.observe(stage);

  /* ---------- Dibuix ---------- */

  const shapes = (kind) => (kind === "walkable" ? doc.walkable : kind === "hotspot" ? doc.hotspots : PLACED[kind].list());
  const isShape = (s) => !!s && !isPlaced(s);
  const shapeOf = (s) => (s.kind === "walkable" ? doc.walkable[s.index] : doc.hotspots[s.index].polygon);
  const isSelected = (kind, index) => sel?.kind === kind && sel.index === index;

  function hotspotLabel(h) {
    if (!h.exit) return h.name;
    return `${h.name} → ${sceneName(h.exit.sceneId) ?? "?"}`;
  }

  function arrivals() {
    const own = doc.hotspots
      .filter((h) => h.exit?.sceneId === scene.id && h.exit.arrival)
      .map((h) => ({ point: h.exit.arrival, label: `Arribada des de ${h.name}` }));
    return [...incoming, ...own];
  }

  function tracePath(poly, close = true) {
    ctx.beginPath();
    poly.forEach((p, i) => {
      const [x, y] = toScreen(p);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    if (close) ctx.closePath();
  }

  function drawLabel(text, [x, y], color, size = 12) {
    ctx.font = `600 ${size}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(13, 11, 22, .9)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function drawShape(poly, color, selected, label) {
    const bad = isSelfIntersecting(poly);
    tracePath(poly);
    ctx.globalAlpha = selected ? 0.35 : 0.2;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = bad ? COLORS.bad : color;
    ctx.setLineDash(bad ? [6, 4] : []);
    ctx.stroke();
    ctx.setLineDash([]);
    if (label) drawLabel(label, toScreen(centroid(poly)), color);
  }

  function drawHandle([x, y], active, big = false) {
    ctx.beginPath();
    ctx.arc(x, y, big || active ? HANDLE + 2 : HANDLE, 0, Math.PI * 2);
    ctx.fillStyle = active ? COLORS.hotspot : "#fff";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#0d0b16";
    ctx.stroke();
  }

  function drawArrival({ point, label }) {
    const [x, y] = toScreen(point);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.exit;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    drawLabel(label, [x, y - 16], "#fff", 11);
  }

  function drawDraft() {
    const color = tool === "walkable" ? COLORS.walkable : COLORS.hotspot;
    const pts = mouse ? [...draft, clampPt(mouse)] : draft;
    tracePath(pts, false);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    const closable = draft.length >= 3 && mouse && nearFirstDraftPoint(toScreen(mouse));
    draft.forEach((p, i) => drawHandle(toScreen(p), false, i === 0 && closable));
  }

  // El personatge al punt més baix i al més alt de la zona caminable, a la mida que hi farà
  function drawGhosts() {
    const pts = doc.walkable.flat();
    if (!pts.length) return;
    const heightAt = actorHeightAt({ walkable: doc.walkable, actorHeight: doc.actorHeight }, H);
    const lowest = pts.reduce((a, p) => (p[1] > a[1] ? p : a));
    const highest = pts.reduce((a, p) => (p[1] < a[1] ? p : a));
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.scale, cam.scale);
    for (const [x, y] of [lowest, highest]) drawPlayerFigure(x, y, heightAt(y));
    ctx.restore();
  }

  function drawPlaced() {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.scale, cam.scale);
    ctx.imageSmoothingEnabled = cam.scale < 1;
    for (const { kind, p } of drawOrder()) {
      if (kind === "character") {
        const c = cast.get(p.characterId);
        drawCharacter(ctx, c, sheetOf(c), poseOf(p));
        continue;
      }
      const im = spriteOf(p), r = rectOf(kind, p);
      if (im) ctx.drawImage(im, r.x, r.y);
      else {
        // Sense imatge (o encara carregant): un requadre perquè es pugui seleccionar igualment
        ctx.fillStyle = "rgba(232, 121, 249, .25)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
    }
    ctx.restore();
  }

  // L'objecte o personatge seleccionat: el seu requadre, el nom i on es posarà el protagonista per fer-hi coses
  function drawPlacedSelection() {
    const p = placedOf(sel), kind = PLACED[sel.kind];
    const r = rectOf(sel.kind, p);
    const [x0, y0] = toScreen([r.x, r.y]), [x1, y1] = toScreen([r.x + r.w, r.y + r.h]);
    ctx.strokeStyle = kind.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
    ctx.setLineDash([]);
    drawLabel(kind.name(p) ?? "?", [(x0 + x1) / 2, y0 - 12], kind.color);
    const w = walkToOf(sel.kind, p);
    if (!w) return;
    const heightAt = sceneHeightAt();
    // Els personatges no tenen «cap on mira el protagonista»: sempre els mira a ells
    const facing = p.facing === "left" && sel.kind === "object" ? -1
      : p.facing === "right" && sel.kind === "object" ? 1
      : p.position[0] >= w[0] ? 1 : -1;
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.scale, cam.scale);
    ctx.globalAlpha = 0.6;
    drawPlayerFigure(w[0], w[1], heightFor(player, w[1], heightAt), facing);
    ctx.restore();
    const ws = toScreen(w);
    ctx.beginPath();
    ctx.moveTo(...ws);
    ctx.lineTo(...toScreen(p.position));
    ctx.strokeStyle = "rgba(255, 255, 255, .5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    drawHandle(ws, !!p.walkTo);
  }

  function draw() {
    if (!cssW) return;
    const dpr = devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.scale, cam.scale);
    ctx.imageSmoothingEnabled = cam.scale < 1;
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    ctx.strokeStyle = "rgba(255, 255, 255, .15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cam.x - 0.5, cam.y - 0.5, W * cam.scale + 1, H * cam.scale + 1);

    doc.walkable.forEach((p, i) => drawShape(p, COLORS.walkable, isSelected("walkable", i)));
    doc.hotspots.forEach((h, i) => drawShape(h.polygon, h.exit ? COLORS.exit : COLORS.hotspot, isSelected("hotspot", i), hotspotLabel(h)));
    drawPlaced();
    arrivals().forEach(drawArrival);
    if (isShape(sel)) shapeOf(sel).forEach((p, i) => drawHandle(toScreen(p), i === sel.vertex));
    if (isPlaced(sel)) drawPlacedSelection();
    if (showGhosts) drawGhosts();
    if (draft) drawDraft();
  }

  /* ---------- Encerts ---------- */

  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const vertexAt = (poly, sp) => poly.findIndex((p) => dist(toScreen(p), sp) <= HIT);
  const edgeAt = (poly, sp) => poly.findIndex((p, i) => distToSegment(sp, toScreen(p), toScreen(poly[(i + 1) % poly.length])) <= HIT);
  const nearFirstDraftPoint = (sp) => dist(toScreen(draft[0]), sp) <= HIT;
  const onWalkToHandle = (sp) => {
    const w = walkToOf(sel.kind, placedOf(sel));
    return !!w && dist(toScreen(w), sp) <= HIT;
  };

  // Objectes i personatges queden per sobre de tot; d'entre ells, el que es dibuixa a sobre
  function placedAt(ip) {
    for (const { kind, p, index } of drawOrder().reverse()) {
      if (kind === "character") {
        const c = cast.get(p.characterId);
        if (characterHit(c, sheetOf(c), poseOf(p), ip)) return { kind, index };
        continue;
      }
      const r = rectOf(kind, p), im = spriteOf(p);
      if (ip[0] >= r.x && ip[0] < r.x + r.w && ip[1] >= r.y && ip[1] < r.y + r.h && opaqueAt(im, ip[0] - r.x, ip[1] - r.y)) {
        return { kind, index };
      }
    }
    return null;
  }

  // Els punts calents queden per sobre de les zones caminables, i els últims dibuixats per sobre dels primers
  function shapeAt(ip) {
    for (let i = doc.hotspots.length - 1; i >= 0; i--) if (pointInPolygon(ip, doc.hotspots[i].polygon)) return { kind: "hotspot", index: i };
    for (let i = doc.walkable.length - 1; i >= 0; i--) if (pointInPolygon(ip, doc.walkable[i])) return { kind: "walkable", index: i };
    return null;
  }

  /* ---------- Historial ---------- */

  const snapshot = () => structuredClone(doc);

  function pushUndo(snap) {
    undoStack.push(snap);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
    updateUndo();
  }

  function commit(mutate) {
    pushUndo(snapshot());
    mutate();
    changed();
  }

  function changed() {
    draw();
    renderPanel();
    updateUndo();
    scheduleSave();
  }

  // Després de desfer, la selecció pot apuntar a una forma o un vèrtex que ja no hi és
  function fixSelection() {
    if (!sel) return;
    if (!shapes(sel.kind)[sel.index]) sel = null;
    else if (isShape(sel) && sel.vertex != null && sel.vertex >= shapeOf(sel).length) sel.vertex = null;
  }

  function undo() {
    if (draft) { cancelDraft(); return; }
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    doc = undoStack.pop();
    fixSelection();
    changed();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    doc = redoStack.pop();
    fixSelection();
    changed();
  }

  function updateUndo() {
    $("#undo").disabled = !undoStack.length && !draft;
    $("#redo").disabled = !redoStack.length;
  }

  /* ---------- Eines ---------- */

  function setTool(t) {
    if (t !== tool) draft = null;
    tool = t;
    for (const b of view.querySelectorAll("[data-tool]")) b.setAttribute("aria-pressed", String(b.dataset.tool === tool));
    renderHint();
    updateCursor();
    updateUndo();
    draw();
  }

  function renderHint() {
    $("#hint").textContent = tool === "select"
      ? "Clica una forma per seleccionar-la. Arrossega-la sencera o pels punts. Doble clic a una vora afegeix un punt."
      : draft
        ? "Clica per afegir punts. Tanca la forma clicant el primer punt, amb doble clic o amb Enter. Esc cancel·la."
        : `Clica sobre el fons per començar ${tool === "walkable" ? "la zona caminable" : "el punt calent"}.`;
  }

  function cancelDraft() {
    draft = null;
    renderHint();
    updateUndo();
    draw();
  }

  function nextHotspotName() {
    const names = new Set(doc.hotspots.map((h) => h.name));
    let n = doc.hotspots.length + 1;
    while (names.has(`Punt calent ${n}`)) n++;
    return `Punt calent ${n}`;
  }

  function finishDraft() {
    if (!draft) return;
    if (draft.length < 3) { toast("Calen almenys 3 punts per tancar la forma"); return; }
    const pts = draft;
    const kind = tool;
    draft = null;
    commit(() => {
      if (kind === "walkable") doc.walkable.push(pts);
      else doc.hotspots.push({ id: crypto.randomUUID(), name: nextHotspotName(), description: "", polygon: pts, exit: null });
      sel = { kind, index: shapes(kind).length - 1, vertex: null };
    });
    setTool("select");
    // Un punt calent nou demana un nom de seguida
    if (kind === "hotspot") {
      const input = $("#prop-name");
      input?.focus();
      input?.select();
    }
  }

  function addDraftPoint(ip, isDouble) {
    const p = clampPt(ip);
    if (!draft) {
      draft = [p];
      renderHint();
      updateUndo();
      draw();
      return;
    }
    // El doble clic tanca la forma: el primer dels dos clics ja ha afegit el punt
    if (isDouble || (draft.length >= 3 && nearFirstDraftPoint(toScreen(p)))) return finishDraft();
    const last = draft[draft.length - 1];
    if (last[0] !== p[0] || last[1] !== p[1]) draft.push(p);
    draw();
  }

  function deleteSelection() {
    if (!sel) return;
    if (isPlaced(sel)) {
      commit(() => { PLACED[sel.kind].list().splice(sel.index, 1); sel = null; });
      return;
    }
    const poly = shapeOf(sel);
    if (sel.vertex != null) {
      if (poly.length <= 3) {
        toast("Una forma necessita almenys 3 punts. Torna a prémer Supr per esborrar-la sencera.");
        sel.vertex = null;
        draw();
        return;
      }
      commit(() => { shapeOf(sel).splice(sel.vertex, 1); sel.vertex = null; });
      return;
    }
    commit(() => { shapes(sel.kind).splice(sel.index, 1); sel = null; });
  }

  function setShape(s, pts) {
    if (s.kind === "walkable") doc.walkable[s.index] = pts;
    else doc.hotspots[s.index].polygon = pts;
  }

  /* ---------- Ratolí ---------- */

  function updateCursor(e) {
    let c = "default";
    if (drag?.type === "pan") c = "grabbing";
    else if (spaceDown) c = "grab";
    else if (tool !== "select") c = "crosshair";
    else if (drag) c = "move";
    else if (e) {
      const sp = screenPoint(e);
      if (isShape(sel) && vertexAt(shapeOf(sel), sp) !== -1) c = "move";
      else if (isPlaced(sel) && onWalkToHandle(sp)) c = "move";
      else if (placedAt(toImage(e)) || shapeAt(toImage(e))) c = "pointer";
    }
    canvas.style.cursor = c;
  }

  function startPan(e) {
    drag = { type: "pan", sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y };
    updateCursor();
  }

  // Els PointerEvent no porten el recompte de clics, així que el doble clic el detectem nosaltres
  function isDoubleClick(e) {
    const now = performance.now();
    const double = now - lastDown.t < DOUBLE_CLICK_MS && Math.hypot(e.clientX - lastDown.x, e.clientY - lastDown.y) < 6;
    lastDown = double ? { t: 0, x: 0, y: 0 } : { t: now, x: e.clientX, y: e.clientY };
    return double;
  }

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    if (e.button === 1 || (e.button === 0 && spaceDown)) return startPan(e);
    if (e.button !== 0) return;
    const sp = screenPoint(e), ip = toImage(e);
    const isDouble = isDoubleClick(e);

    if (tool !== "select") return addDraftPoint(ip, isDouble);

    if (isPlaced(sel) && onWalkToHandle(sp)) {
      drag = { type: "walkto", before: snapshot(), moved: false, sx: e.clientX, sy: e.clientY };
      return;
    }

    const hitPlaced = placedAt(ip);
    if (hitPlaced) {
      if (!isSelected(hitPlaced.kind, hitPlaced.index)) {
        sel = { ...hitPlaced, vertex: null };
        renderPanel();
        draw();
      }
      drag = { type: "place", before: snapshot(), start: ip, orig: [...placedOf(hitPlaced).position], moved: false, sx: e.clientX, sy: e.clientY };
      return;
    }

    if (isShape(sel)) {
      const poly = shapeOf(sel);
      const v = vertexAt(poly, sp);
      if (v !== -1) {
        sel.vertex = v;
        drag = { type: "vertex", before: snapshot(), moved: false, sx: e.clientX, sy: e.clientY };
        draw();
        return;
      }
      const edge = edgeAt(poly, sp);
      if (edge !== -1 && isDouble) {
        commit(() => { shapeOf(sel).splice(edge + 1, 0, clampPt(ip)); sel.vertex = edge + 1; });
        drag = { type: "vertex", before: snapshot(), moved: false, sx: e.clientX, sy: e.clientY };
        return;
      }
      if (edge !== -1 || pointInPolygon(ip, poly)) {
        drag = { type: "shape", before: snapshot(), start: ip, orig: structuredClone(poly), moved: false, sx: e.clientX, sy: e.clientY };
        return;
      }
    }

    const hit = shapeAt(ip);
    if (hit) {
      sel = { ...hit, vertex: null };
      drag = { type: "shape", before: snapshot(), start: ip, orig: structuredClone(shapeOf(sel)), moved: false, sx: e.clientX, sy: e.clientY };
      renderPanel();
      draw();
      return;
    }
    if (sel) {
      sel = null;
      renderPanel();
      draw();
    }
    startPan(e);
  });

  canvas.addEventListener("pointermove", (e) => {
    mouse = toImage(e);
    if (drag?.type === "pan") {
      cam.x = drag.cx + e.clientX - drag.sx;
      cam.y = drag.cy + e.clientY - drag.sy;
      draw();
      return;
    }
    if (drag && drag.type !== "pan" && !drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < DRAG_THRESHOLD) return;
    if (drag?.type === "vertex") {
      const p = clampPt(mouse);
      const poly = shapeOf(sel);
      const old = poly[sel.vertex];
      if (old[0] === p[0] && old[1] === p[1]) return;
      if (!drag.moved) { pushUndo(drag.before); drag.moved = true; }
      poly[sel.vertex] = p;
      draw();
      return;
    }
    if (drag?.type === "place" || drag?.type === "walkto") {
      const p = placedOf(sel);
      const next = drag.type === "place"
        ? clampPt([drag.orig[0] + mouse[0] - drag.start[0], drag.orig[1] + mouse[1] - drag.start[1]])
        : clampPt(mouse);
      const key = drag.type === "place" ? "position" : "walkTo";
      if (p[key] && p[key][0] === next[0] && p[key][1] === next[1]) return;
      if (!drag.moved) { pushUndo(drag.before); drag.moved = true; }
      p[key] = next;
      draw();
      return;
    }
    if (drag?.type === "shape") {
      // La forma es mou sencera sense sortir de la imatge
      const b = bounds(drag.orig);
      const dx = clamp(Math.round(mouse[0] - drag.start[0]), -b.minX, W - b.maxX);
      const dy = clamp(Math.round(mouse[1] - drag.start[1]), -b.minY, H - b.maxY);
      if (!drag.moved && !dx && !dy) return;
      if (!drag.moved) { pushUndo(drag.before); drag.moved = true; }
      setShape(sel, drag.orig.map(([x, y]) => [x + dx, y + dy]));
      draw();
      return;
    }
    updateCursor(e);
    if (draft) draw();
  });

  function endDrag(e) {
    if (drag?.moved) changed();
    drag = null;
    updateCursor(e);
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { mouse = null; if (draft) draw(); });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const k = e.deltaMode === 1 ? 16 : 1;
    // Al trackpad, el pessic arriba com a roda amb ctrlKey
    if (e.ctrlKey || e.metaKey) {
      const [sx, sy] = screenPoint(e);
      zoomAt(Math.exp(-e.deltaY * k * 0.01), sx, sy);
    } else {
      cam.x -= e.deltaX * k;
      cam.y -= e.deltaY * k;
      draw();
    }
  }, { passive: false });

  /* ---------- Teclat ---------- */

  function onKeyDown(e) {
    if (isTyping(e)) return;
    if (e.key === " ") {
      e.preventDefault();
      if (!spaceDown) { spaceDown = true; updateCursor(); }
      return;
    }
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key.toLowerCase();
    if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === "y") { e.preventDefault(); redo(); return; }
    if (mod || e.altKey) return;
    if (k === "v") setTool("select");
    else if (k === "w") setTool("walkable");
    else if (k === "h") setTool("hotspot");
    else if (e.key === "Escape") {
      if (draft) cancelDraft();
      else if (sel) { sel = null; renderPanel(); draw(); }
      else if (tool !== "select") setTool("select");
    }
    else if (e.key === "Enter") finishDraft();
    else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      if (draft) {
        draft.pop();
        if (!draft.length) cancelDraft(); else draw();
      } else deleteSelection();
    }
    else if (e.key === "+" || e.key === "=") zoomAt(2);
    else if (e.key === "-") zoomAt(0.5);
    else if (e.key === "0") fit();
  }
  function onKeyUp(e) {
    if (e.key === " ") { spaceDown = false; updateCursor(); }
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  /* ---------- Panell lateral ---------- */

  function renderPanel() {
    // Treure el focus abans de refer el panell fa saltar el «change» del camp que s'estava editant
    if ($(".panel").contains(document.activeElement)) document.activeElement.blur();
    renderProps();
    renderLists();
  }

  function shapeList(items) {
    const ul = el(`<ul class="shape-list"></ul>`);
    for (const it of items) {
      const li = el(`<li><button type="button"><span class="dot"></span><span class="name"></span><span class="sub"></span></button></li>`);
      $(".dot", li).style.background = it.color;
      $(".name", li).textContent = it.name;
      $(".sub", li).textContent = it.sub;
      const b = $("button", li);
      if (isSelected(it.kind, it.index)) b.setAttribute("aria-current", "true");
      b.onclick = () => {
        sel = { kind: it.kind, index: it.index, vertex: null };
        setTool("select");
        renderPanel();
      };
      ul.append(li);
    }
    return ul;
  }

  function renderLists() {
    const walk = el(`<section><h4>Zones caminables</h4></section>`);
    if (!doc.walkable.length) walk.append(el(`<p class="muted">On pot caminar el personatge. Dibuixa-la amb l'eina «Zona caminable» (W).</p>`));
    else walk.append(shapeList(doc.walkable.map((p, i) => ({
      kind: "walkable", index: i, name: `Zona ${i + 1}`, color: COLORS.walkable, sub: isSelfIntersecting(p) ? "es creua" : "",
    }))));

    const hot = el(`<section><h4>Punts calents i sortides</h4></section>`);
    if (!doc.hotspots.length) hot.append(el(`<p class="muted">Zones del fons on el jugador pot fer clic. Si porten a un altre escenari, són sortides. Dibuixa-les amb l'eina «Punt calent» (H).</p>`));
    else hot.append(shapeList(doc.hotspots.map((h, i) => ({
      kind: "hotspot", index: i, name: h.name || "(sense nom)", color: h.exit ? COLORS.exit : COLORS.hotspot,
      sub: h.exit ? `→ ${sceneName(h.exit.sceneId) ?? "sense destinació"}` : "",
    }))));
    $("#lists").replaceChildren(objectsSection(), charactersSection(), walk, hot);
  }

  // Objectes col·locats aquí i un desplegable per col·locar-ne més de la biblioteca
  function objectsSection() {
    const box = el(`<section><h4>Objectes</h4></section>`);
    const libraryHref = `#/aventura/${adventure.id}/objectes`;
    if (!library.size) {
      const p = el(`<p class="muted">Encara no hi ha objectes a l'aventura. <a>Crea'n a la biblioteca</a>.</p>`);
      $("a", p).href = libraryHref;
      box.append(p);
      return box;
    }
    if (doc.objects.length) {
      box.append(shapeList(doc.objects.map((p, i) => ({
        kind: "object", index: i, name: library.get(p.objectId)?.name ?? "?", color: COLORS.object,
        sub: spriteFile(library.get(p.objectId)) ? "" : "sense imatge",
      }))));
    }
    const here = new Set(doc.objects.map((p) => p.objectId));
    const available = [...library.values()].filter((o) => !here.has(o.id)).sort((a, b) => a.name.localeCompare(b.name, "ca"));
    if (available.length) {
      const select = el(`<select aria-label="Col·loca un objecte"><option value="">+ Col·loca un objecte…</option></select>`);
      for (const o of available) {
        const elsewhere = adventure.scenes.find((s) => s.id !== scene.id && s.objects.some((p) => p.objectId === o.id));
        const opt = el(`<option></option>`);
        opt.value = o.id;
        opt.textContent = elsewhere ? `${o.name} (ara és a «${elsewhere.name}»)` : o.name;
        select.append(opt);
      }
      select.onchange = () => placeObject(select.value);
      box.append(select);
    }
    const manage = el(`<a class="back" style="margin:8px 0 0">Gestiona els objectes →</a>`);
    manage.href = libraryHref;
    box.append(manage);
    return box;
  }

  // Personatges col·locats aquí (el protagonista no: el porta el jugador)
  function charactersSection() {
    const box = el(`<section><h4>Personatges</h4></section>`);
    const href = `#/aventura/${adventure.id}/personatges`;
    const others = [...cast.values()].filter((c) => c.id !== adventure.playerId);
    if (!others.length) {
      const p = el(`<p class="muted">No hi ha altres personatges a part del protagonista. <a>Crea'n</a>.</p>`);
      $("a", p).href = href;
      box.append(p);
      return box;
    }
    if (doc.characters.length) {
      box.append(shapeList(doc.characters.map((p, i) => ({
        kind: "character", index: i, name: cast.get(p.characterId)?.name ?? "?", color: COLORS.character,
        sub: p.characterId === adventure.playerId ? "protagonista" : "",
      }))));
    }
    const here = new Set(doc.characters.map((p) => p.characterId));
    const available = others.filter((c) => !here.has(c.id)).sort((a, b) => a.name.localeCompare(b.name, "ca"));
    if (available.length) {
      const select = el(`<select aria-label="Col·loca un personatge"><option value="">+ Col·loca un personatge…</option></select>`);
      for (const c of available) {
        const elsewhere = adventure.scenes.find((s) => s.id !== scene.id && s.characters.some((p) => p.characterId === c.id));
        select.append(new Option(elsewhere ? `${c.name} (ara és a «${elsewhere.name}»)` : c.name, c.id));
      }
      select.onchange = () => placeAtCenter("character", { characterId: select.value, walkTo: null, facing: "down" });
      box.append(select);
    }
    const manage = el(`<a class="back" style="margin:8px 0 0">Gestiona els personatges →</a>`);
    manage.href = href;
    box.append(manage);
    return box;
  }

  // L'objecte nou apareix al mig del que s'està veient, perquè es trobi sense buscar-lo
  function placeObject(objectId) {
    if (!objectId) return;
    placeAtCenter("object", { objectId, walkTo: null, facing: "auto", layer: "auto" });
  }

  function placeAtCenter(kind, item) {
    if (!item[PLACED[kind].idKey]) return;
    // La mida es llegeix ara mateix: si la vista encara no s'ha mesurat, va al centre de la imatge
    const r = stage.getBoundingClientRect();
    const center = fitted
      ? clampPt([(r.width / 2 - cam.x) / cam.scale, (r.height / 2 - cam.y) / cam.scale])
      : [Math.round(W / 2), Math.round(H / 2)];
    commit(() => {
      const list = PLACED[kind].list();
      list.push({ ...item, position: center });
      sel = { kind, index: list.length - 1, vertex: null };
    });
  }

  // Camp de text: canvia les dades mentre s'escriu, i deixa un sol pas a l'historial en sortir del camp
  function bindText(input, get, set) {
    input.value = get();
    let before = null;
    input.addEventListener("focus", () => { before = snapshot(); });
    input.addEventListener("input", () => {
      set(input.value);
      draw();
      renderLists();
      scheduleSave();
    });
    input.addEventListener("change", () => {
      if (before) pushUndo(before);
      before = null;
    });
  }

  function selfIntersectWarning(poly) {
    return isSelfIntersecting(poly) ? el(`<p class="warn bad">Les vores es creuen. Mou els punts perquè la forma no faci un 8.</p>`) : "";
  }

  function renderProps() {
    const slot = $("#props");
    if (!sel) { slot.replaceChildren(sceneProps(), actorProps()); return; }
    showGhosts = false;
    const box = el(`<section class="props"><h4></h4></section>`);

    if (sel.kind === "object") {
      slot.replaceChildren(objectProps(box));
      return;
    }
    if (sel.kind === "character") {
      slot.replaceChildren(characterProps(box));
      return;
    }

    if (sel.kind === "walkable") {
      const poly = doc.walkable[sel.index];
      $("h4", box).textContent = `Zona caminable ${sel.index + 1}`;
      box.append(el(`<p class="muted">${poly.length} punts. El personatge podrà caminar per dins d'aquesta zona.</p>`));
      box.append(selfIntersectWarning(poly));
      const del = el(`<button type="button" class="small danger">Esborra la zona</button>`);
      del.onclick = deleteSelection;
      box.append(del);
      slot.replaceChildren(box);
      return;
    }

    const h = doc.hotspots[sel.index];
    $("h4", box).textContent = h.exit ? "Sortida" : "Punt calent";

    const name = el(`<label>Nom <input id="prop-name" maxlength="120" autocomplete="off"></label>`);
    bindText($("input", name), () => h.name, (v) => { h.name = v; });
    const desc = el(`<label>Descripció <textarea maxlength="5000" placeholder="Què és? Més endavant, el que diu el personatge quan el mira."></textarea></label>`);
    bindText($("textarea", desc), () => h.description, (v) => { h.description = v; });
    box.append(name, desc);
    if (!h.name.trim()) box.append(el(`<p class="warn bad">Posa-li un nom: sense nom no es pot desar.</p>`));

    const isExit = el(`<label class="check"><input type="checkbox"> És una sortida cap a un altre escenari</label>`);
    const cb = $("input", isExit);
    cb.checked = !!h.exit;
    // Si només hi ha un altre escenari, ja el posem de destinació
    cb.onchange = () => commit(() => {
      h.exit = cb.checked ? { sceneId: otherScenes.length === 1 ? otherScenes[0].id : null, arrival: null, conditions: [], blocked: "" } : null;
    });
    box.append(isExit);

    if (h.exit) box.append(...exitFields(h));

    box.append(rulesLink(h.id));
    box.append(el(`<p class="muted">${h.polygon.length} punts</p>`), selfIntersectWarning(h.polygon));
    const del = el(`<button type="button" class="small danger"></button>`);
    del.textContent = h.exit ? "Esborra la sortida" : "Esborra el punt calent";
    del.onclick = deleteSelection;
    box.append(del);
    slot.replaceChildren(box);
  }

  function objectProps(box) {
    const p = doc.objects[sel.index];
    const o = library.get(p.objectId);
    $("h4", box).textContent = "Objecte";
    const title = el(`<p style="margin:0;font-weight:600"></p>`);
    title.textContent = o?.name ?? "?";
    const edit = el(`<button type="button" class="small">Edita l'objecte…</button>`);
    // Els canvis a la biblioteca (nom, imatges…) es veuen de seguida aquí
    edit.onclick = () => openObjectDialog(adventure, o, (saved) => {
      library.set(saved.id, saved);
      const i = adventure.objects.findIndex((x) => x.id === saved.id);
      if (i !== -1) adventure.objects[i] = saved;
      loadSprites();
      renderPanel();
      draw();
    });
    box.append(title, edit);
    const state = o?.states.find((st) => st.id === o.initialState);
    if (state) box.append(el(`<p class="muted">Estat inicial: ${escapeHtml(state.name)}</p>`));
    if (!spriteFile(o)) box.append(el(`<p class="warn">En l'estat inicial no té imatge: al joc no es veurà ni s'hi podrà fer clic.</p>`));

    const walk = el(`<div class="field">On es posa el personatge <small></small></div>`);
    $("small", walk).textContent = !doc.walkable.length
      ? "Dibuixa una zona caminable per poder-hi caminar."
      : p.walkTo ? "Arrossega la figura per canviar-ho." : "Automàtic: el punt de la zona caminable més proper. Arrossega la figura per triar-lo tu.";
    if (p.walkTo) {
      const auto = el(`<button type="button" class="small" style="align-self:flex-start">Torna a l'automàtic</button>`);
      auto.onclick = () => commit(() => { p.walkTo = null; });
      walk.append(auto);
    }
    box.append(walk);

    const choice = (label, labels, key) => {
      const field = el(`<label>${label} <select></select></label>`);
      const select = $("select", field);
      for (const [value, text] of Object.entries(labels)) {
        const opt = el(`<option></option>`);
        opt.value = value;
        opt.textContent = text;
        select.append(opt);
      }
      select.value = p[key];
      select.onchange = () => commit(() => { p[key] = select.value; });
      return field;
    };
    box.append(choice("Cap on mira el personatge", FACING_LABELS, "facing"), choice("Capa", LAYER_LABELS, "layer"));

    box.append(rulesLink(p.objectId));
    const del = el(`<button type="button" class="small danger">Treu de l'escenari</button>`);
    del.onclick = deleteSelection;
    box.append(del);
    return box;
  }

  function characterProps(box) {
    const p = doc.characters[sel.index];
    const c = cast.get(p.characterId);
    $("h4", box).textContent = "Personatge";
    const title = el(`<p style="margin:0;font-weight:600"></p>`);
    title.textContent = c?.name ?? "?";
    if (c) title.prepend(colorSwatch(c.color));
    const edit = el(`<a class="back" style="margin:0">Edita el personatge →</a>`);
    edit.href = `#/aventura/${adventure.id}/personatges/${p.characterId}`;
    box.append(title, edit);
    if (p.characterId === adventure.playerId) box.append(el(`<p class="warn">És el protagonista: al joc no sortirà aquí, perquè el porta el jugador.</p>`));

    const facing = el(`<label>Cap on mira <select></select></label>`);
    const select = $("select", facing);
    for (const [value, text] of Object.entries(CHARACTER_FACING_LABELS)) select.append(new Option(text, value));
    select.value = p.facing;
    select.onchange = () => commit(() => { p.facing = select.value; });
    box.append(facing);

    const walk = el(`<div class="field">On es posa el protagonista per parlar-hi <small></small></div>`);
    $("small", walk).textContent = !doc.walkable.length
      ? "Dibuixa una zona caminable per poder-hi caminar."
      : p.walkTo ? "Arrossega la figura per canviar-ho." : "Automàtic: al costat cap on mira. Arrossega la figura per triar-lo tu.";
    if (p.walkTo) {
      const auto = el(`<button type="button" class="small" style="align-self:flex-start">Torna a l'automàtic</button>`);
      auto.onclick = () => commit(() => { p.walkTo = null; });
      walk.append(auto);
    }
    box.append(walk, rulesLink(p.characterId));
    const del = el(`<button type="button" class="small danger">Treu de l'escenari</button>`);
    del.onclick = deleteSelection;
    box.append(del);
    return box;
  }

  // Enllaç a les regles on surt aquesta cosa (per desar abans, la ruta nova fa saltar el desat pendent)
  function rulesLink(id) {
    const n = adventure.rules.filter((r) => r.target?.id === id || r.with?.id === id).length;
    const a = el(`<a class="back" style="margin:0"></a>`);
    a.href = `#/aventura/${adventure.id}/regles/${id}`;
    a.textContent = n ? `${n === 1 ? "1 regla" : `${n} regles`} →` : "Afegeix-hi regles →";
    return a;
  }

  // Sense res seleccionat: la música, com s'hi entra i la seqüència d'entrada
  function sceneProps() {
    const box = el(`<section class="props"><h4>Escenari</h4></section>`);
    const choice = (label, options, value, onChange, empty) => {
      const field = el(`<label></label>`);
      field.textContent = label;
      const s = el(`<select></select>`);
      if (empty) s.append(new Option(empty, ""));
      for (const [v, t] of options) s.append(new Option(t, v));
      s.value = value ?? "";
      s.onchange = () => onChange(s.value);
      field.append(s);
      return field;
    };
    box.append(
      choice("Música", adventure.sounds.map((x) => [x.id, x.name]), doc.music, (v) => commit(() => { doc.music = v || null; }), "— Continua la que soni —"),
      choice("Com s'hi entra", [["fade", "Fos a negre"], ["iris", "Cercle que es tanca"], ["cut", "Tall sec"]], doc.transition, (v) => commit(() => { doc.transition = v; })),
      choice("Seqüència en entrar", adventure.cutscenes.map((c) => [c.id, c.name]), doc.onEnter?.cutsceneId, (v) => commit(() => {
        doc.onEnter = v ? { cutsceneId: v, once: doc.onEnter?.once ?? true } : null;
      }), "— Cap —"),
    );
    if (doc.onEnter) {
      const once = el(`<label class="check"><input type="checkbox"> Només la primera vegada</label>`);
      const cb = $("input", once);
      cb.checked = doc.onEnter.once;
      cb.onchange = () => commit(() => { doc.onEnter.once = cb.checked; });
      box.append(once);
    }
    if (!adventure.sounds.length || !adventure.cutscenes.length) {
      const hint = el(`<p class="muted">Els sons i les seqüències es creen a les pàgines <a>Sons</a> i <a>Seqüències</a> de l'aventura.</p>`);
      const [s1, s2] = hint.querySelectorAll("a");
      s1.href = `#/aventura/${adventure.id}/sons`;
      s2.href = `#/aventura/${adventure.id}/sequencies`;
      box.append(hint);
    }
    return box;
  }

  // Sense res seleccionat: l'alçada del personatge en aquest escenari (buida = automàtica)
  function actorProps() {
    const box = el(`<section class="props"><h4>Personatge en aquest escenari</h4>
      <p class="muted">Alçada en píxels de la imatge. Passa el ratolí per aquí per veure'l a l'escenari.</p>
      <div class="pair">
        <label>A prop <small>a baix de la zona</small><input type="number" min="1" max="10000" name="near"></label>
        <label>Lluny <small>a dalt de la zona</small><input type="number" min="1" max="10000" name="far"></label>
      </div>
      <button type="button" class="small">Torna a l'automàtic</button>
    </section>`);
    const auto = autoActorHeight({ walkable: doc.walkable }, H);
    const near = $("[name=near]", box), far = $("[name=far]", box), reset = $("button", box);
    near.placeholder = auto.near;
    far.placeholder = auto.far;
    near.value = doc.actorHeight?.near ?? "";
    far.value = doc.actorHeight?.far ?? "";
    reset.disabled = !doc.actorHeight;
    if (!doc.walkable.length) box.append(el(`<p class="warn">Dibuixa una zona caminable per veure'l a la seva mida.</p>`));

    const valid = (v) => Number.isFinite(v) && v >= 1 && v <= 10000;
    for (const input of [near, far]) {
      let before = null;
      input.addEventListener("focus", () => { before = snapshot(); });
      // Si només n'hi ha un d'omplert, l'altre fa servir el valor automàtic
      input.addEventListener("input", () => {
        if (!near.value && !far.value) doc.actorHeight = null;
        else {
          const n = near.value ? Number(near.value) : auto.near, f = far.value ? Number(far.value) : auto.far;
          if (!valid(n) || !valid(f)) return;
          doc.actorHeight = { near: Math.round(n), far: Math.round(f) };
        }
        reset.disabled = !doc.actorHeight;
        draw();
        scheduleSave();
      });
      input.addEventListener("change", () => {
        if (before) pushUndo(before);
        before = null;
      });
    }
    reset.onclick = () => commit(() => { doc.actorHeight = null; });

    const show = (on) => { showGhosts = on; draw(); };
    box.addEventListener("pointerenter", () => show(true));
    box.addEventListener("pointerleave", () => show(box.contains(document.activeElement)));
    box.addEventListener("focusin", () => show(true));
    box.addEventListener("focusout", (e) => show(box.contains(e.relatedTarget) || box.matches(":hover")));
    return box;
  }

  // Sortida tancada: només s'hi passa si es compleixen les condicions (com a les regles); si no, el protagonista diu «blocked»
  function exitLock(h) {
    h.exit.conditions ??= [];
    const box = el(`<details class="exit-lock"><summary></summary></details>`);
    const summary = $("summary", box);
    const count = () => {
      summary.textContent = h.exit.conditions.length
        ? `Tancada: ${h.exit.conditions.length === 1 ? "1 condició" : `${h.exit.conditions.length} condicions`}`
        : "Sempre oberta (afegeix condicions per tancar-la)";
    };
    count();
    box.open = h.exit.conditions.length > 0;
    box.append(conditionsEditor(adventure, h.exit.conditions, () => { count(); scheduleSave(); }, { emptyText: "Sense condicions: s'hi passa sempre." }));
    const blocked = el(`<label>Què diu si no hi pot passar <input maxlength="500" placeholder="Ara no hi puc passar."></label>`);
    bindText($("input", blocked), () => h.exit.blocked ?? "", (v) => { h.exit.blocked = v; });
    box.append(blocked);
    return box;
  }

  function exitFields(h) {
    const out = [];
    if (!otherScenes.length) {
      out.push(el(`<p class="warn">Encara no hi ha cap altre escenari. Crea'n un des de la pàgina de l'aventura.</p>`));
      return out;
    }
    const field = el(`<label>Porta a <select><option value="">— Tria un escenari —</option></select></label>`);
    const select = $("select", field);
    for (const s of otherScenes) {
      const o = el(`<option></option>`);
      o.value = s.id;
      o.textContent = s.name;
      select.append(o);
    }
    select.value = h.exit.sceneId ?? "";
    // El punt d'arribada és de l'escenari antic, així que en canviar de destinació es perd
    select.onchange = () => commit(() => { h.exit = { ...h.exit, sceneId: select.value || null, arrival: null }; });
    out.push(field, exitLock(h));

    const target = adventure.scenes.find((s) => s.id === h.exit.sceneId);
    if (!target) {
      out.push(el(`<p class="warn bad">Tria a quin escenari porta aquesta sortida.</p>`));
      return out;
    }
    if (!target.background) {
      out.push(el(`<p class="warn">«${escapeHtml(target.name)}» no té fons. Afegeix-n'hi un per triar on apareix el personatge.</p>`));
      return out;
    }

    const pick = el(`<div class="field">Punt d'arribada <small>Fes clic on ha d'aparèixer el personatge en entrar.</small><div class="arrival"><img alt=""></div></div>`);
    const box = $(".arrival", pick), timg = $("img", box);
    timg.src = imageUrl(adventure.id, target.background);
    timg.onload = () => {
      if (!h.exit.arrival) return;
      const m = el(`<span class="marker"></span>`);
      m.style.left = `${(h.exit.arrival[0] / timg.naturalWidth) * 100}%`;
      m.style.top = `${(h.exit.arrival[1] / timg.naturalHeight) * 100}%`;
      box.append(m);
    };
    box.onclick = (e) => {
      const r = timg.getBoundingClientRect();
      const x = Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * timg.naturalWidth);
      const y = Math.round(clamp((e.clientY - r.top) / r.height, 0, 1) * timg.naturalHeight);
      commit(() => { h.exit.arrival = [x, y]; });
    };
    out.push(pick);
    if (!h.exit.arrival) out.push(el(`<p class="warn">Encara no has triat on apareix el personatge.</p>`));
    const go = el(`<a class="back" style="margin:0"></a>`);
    go.href = `#/aventura/${adventure.id}/escenari/${target.id}`;
    go.textContent = `Obre «${target.name}» →`;
    out.push(go);
    return out;
  }

  /* ---------- Desat automàtic ---------- */

  const status = $("#save-status");
  const STATUS = { idle: "", dirty: "Canvis sense desar", saving: "Desant…", saved: "Desat", error: "No s'ha pogut desar" };
  function setStatus(state, detail = "") {
    status.textContent = STATUS[state];
    status.title = detail;
    status.classList.toggle("error", state === "error");
  }

  let timer = null, inflight = null, again = false;

  function save() {
    clearTimeout(timer);
    timer = null;
    if (inflight) { again = true; return inflight; }
    setStatus("saving");
    inflight = saveScene(adventure.id, scene, { walkable: doc.walkable, hotspots: doc.hotspots, objects: doc.objects, characters: doc.characters, actorHeight: doc.actorHeight,
      music: doc.music, transition: doc.transition, onEnter: doc.onEnter })
      .then(() => setStatus(again ? "saving" : "saved"))
      .catch((err) => {
        setStatus("error", err.message);
        toast(`No s'ha pogut desar: ${err.message}`);
      })
      .finally(() => {
        inflight = null;
        if (again) { again = false; save(); }
      });
    return inflight;
  }

  function scheduleSave() {
    setStatus("dirty");
    clearTimeout(timer);
    timer = setTimeout(save, SAVE_DELAY);
  }

  function onBeforeUnload(e) {
    if (timer || inflight) e.preventDefault();
  }
  window.addEventListener("beforeunload", onBeforeUnload);

  /* ---------- Botons i arrencada ---------- */

  for (const b of view.querySelectorAll("[data-tool]")) b.onclick = () => setTool(b.dataset.tool);
  $("#undo").onclick = undo;
  $("#redo").onclick = redo;
  $("#zoom-in").onclick = () => zoomAt(2);
  $("#zoom-out").onclick = () => zoomAt(0.5);
  $("#zoom-fit").onclick = fit;
  $("#paint-bg").onclick = async () => {
    // Primer es desa el que quedi pendent: en acabar de pintar es torna a carregar l'escenari
    if (timer) await save();
    else if (inflight) await inflight;
    const hasShapes = doc.walkable.length || doc.hotspots.length || doc.objects.length || doc.characters.length;
    paintBackground(adventure, scene, hasShapes ? "Compte: les zones, els punts calents i les posicions van en píxels del fons; si en canvies la mida, quedaran desplaçades." : "", refresh);
  };

  setTool("select");
  renderPanel();
  setStatus("idle");

  // En sortir de l'editor: desa el que quedi pendent i treu els escoltadors globals
  return async () => {
    ro.disconnect();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("beforeunload", onBeforeUnload);
    if (timer) await save();
    else if (inflight) await inflight;
  };
}

// Obre el fons de l'escenari a l'editor de dibuix i, si s'accepta, el puja
async function paintBackground(adventure, scene, sizeNote, refresh) {
  try {
    const blob = await openPaintEditor({
      title: `Fons · ${scene.name}`,
      src: scene.background ? imageUrl(adventure.id, scene.background) : null,
      width: 320, height: 200, sizeNote: sizeNote ?? "",
    });
    if (!blob) return;
    await request("PUT", `${sceneUrl(adventure.id, scene.id)}/background`, blob, "image/png");
    toast("Fons desat");
    refresh();
  } catch (err) {
    toast(`No s'ha pogut desar el fons: ${err.message}`);
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
