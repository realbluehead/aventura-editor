// Mapa de l'aventura: els escenaris com a caixes que es poden arrossegar i les sortides com a fletxes.
// També avisa del que impedirà jugar: sortides que no porten enlloc o escenaris on no es pot arribar.
import { saveAdventure, saveScene, imageUrl } from "../api.js";
import { $, el, toast, plural } from "../ui.js";
import { sceneWarnings } from "../analysis.js";

const NW = 176, NH = 110;            // mida de cada escenari al mapa (16:10)
const GAP_X = 340, GAP_Y = 210;      // separació de la graella inicial (deixa lloc per als noms de les sortides)
const PAD = 60;
const NS = "http://www.w3.org/2000/svg";

function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.append(n);
  return n;
}

const short = (s, max) => (s.length > max ? s.slice(0, max - 1) + "…" : s);

// Punt on la recta des del centre d'una caixa cap a «toward» en travessa la vora
function boxEdge([cx, cy], [tx, ty], pad = 6) {
  const dx = tx - cx, dy = ty - cy;
  const t = Math.min(dx ? (NW / 2 + pad) / Math.abs(dx) : Infinity, dy ? (NH / 2 + pad) / Math.abs(dy) : Infinity);
  return Number.isFinite(t) ? [cx + dx * t, cy + dy * t] : [cx, cy];
}

export function renderMap(view, a, { refresh }) {
  const base = `#/aventura/${a.id}`;
  const sceneHref = (id) => `${base}/escenari/${id}`;
  document.title = `Mapa · ${a.title} · Editor d'aventures`;
  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head"><div><h2>Mapa</h2><p></p></div></div>
    <div id="map-body"></div>`;
  $(".back", view).textContent = `← ${a.title}`;

  if (!a.scenes.length) {
    $(".page-head p", view).textContent = "Aquí veuràs com es connecten els escenaris.";
    $("#map-body").innerHTML = `<div class="empty-state"><strong>Encara no hi ha escenaris</strong>Crea'n des de la pàgina de l'aventura.</div>`;
    return;
  }

  const startId = a.startSceneId ?? a.scenes[0].id;
  const exitCount = a.scenes.reduce((n, s) => n + s.hotspots.filter((h) => h.exit).length, 0);
  $(".page-head p", view).textContent =
    `${plural(a.scenes.length, "escenari", "escenaris")} · ${plural(exitCount, "sortida", "sortides")}. Arrossega els escenaris per endreçar el mapa i fes-hi clic per obrir-los.`;

  $("#map-body").innerHTML = `
    <div class="map-tools">
      <label>Escenari inicial <select id="start"></select></label>
      <a class="button" href="${base}/juga">▶ Juga</a>
      <div class="legend"><span class="l-start">Escenari inicial</span><span class="l-exit">Sortida</span><span class="l-unreach">No s'hi pot arribar</span></div>
    </div>
    <div class="map-box"></div>
    <section class="warnings"></section>`;

  const start = $("#start");
  for (const s of a.scenes) {
    const o = el(`<option></option>`);
    o.value = s.id;
    o.textContent = s.name;
    start.append(o);
  }
  start.value = startId;
  start.onchange = async () => {
    try {
      await saveAdventure(a, { startSceneId: start.value });
      toast("Escenari inicial desat");
      refresh();
    } catch (err) {
      toast(err.message);
    }
  };

  /* ---------- Connexions ---------- */

  // Totes les sortides d'un escenari a un altre es dibuixen com una sola fletxa amb els noms junts
  const edges = new Map();
  for (const s of a.scenes) {
    for (const h of s.hotspots) {
      const to = h.exit?.sceneId;
      if (!to || to === s.id) continue;
      const key = `${s.id}>${to}`;
      if (!edges.has(key)) edges.set(key, { from: s.id, to, names: [] });
      edges.get(key).names.push(h.name);
    }
  }

  const reachable = new Set([startId]);
  const pending = [startId];
  while (pending.length) {
    const id = pending.pop();
    for (const e of edges.values()) {
      if (e.from === id && !reachable.has(e.to)) { reachable.add(e.to); pending.push(e.to); }
    }
  }

  /* ---------- Posicions ---------- */

  // Els escenaris que encara no s'han col·locat van en graella per sota dels que sí
  const placed = a.scenes.filter((s) => s.mapPosition);
  const belowY = placed.length ? Math.max(...placed.map((s) => s.mapPosition[1])) + GAP_Y : 0;
  const leftX = placed.length ? Math.min(...placed.map((s) => s.mapPosition[0])) : 0;
  let j = 0;
  const pos = new Map(a.scenes.map((s) => {
    if (s.mapPosition) return [s.id, [...s.mapPosition]];
    const p = [leftX + (j % 4) * GAP_X, belowY + Math.floor(j / 4) * GAP_Y];
    j++;
    return [s.id, p];
  }));
  const center = (id) => [pos.get(id)[0] + NW / 2, pos.get(id)[1] + NH / 2];

  /* ---------- SVG ---------- */

  const root = svg("svg", { role: "img", "aria-label": "Mapa d'escenaris i sortides" }, $(".map-box"));
  const defs = svg("defs", {}, root);
  const marker = svg("marker", { id: "arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
  svg("path", { d: "M0,0 L10,5 L0,10 z", style: "fill: var(--exit)" }, marker);
  const clip = svg("clipPath", { id: "node-clip" }, defs);
  svg("rect", { x: 1, y: 1, width: NW - 2, height: NH - 2, rx: 7 }, clip);
  const edgeLayer = svg("g", {}, root);
  const nodeLayer = svg("g", {}, root);
  const labelLayer = svg("g", {}, root);   // els noms de les sortides per sobre dels escenaris perquè no quedin tapats

  let box = null;
  function fitViewBox(growOnly = false) {
    const xs = [...pos.values()].map((p) => p[0]), ys = [...pos.values()].map((p) => p[1]);
    let minX = Math.min(...xs) - PAD, minY = Math.min(...ys) - PAD;
    let w = Math.max(...xs) + NW + PAD - minX, h = Math.max(...ys) + NH + PAD - minY;
    // Amb pocs escenaris, que no surtin gegants
    if (w < 760) { minX -= (760 - w) / 2; w = 760; }
    if (h < 320) { minY -= (320 - h) / 2; h = 320; }
    if (growOnly && box) {
      const maxX = Math.max(minX + w, box.x + box.w), maxY = Math.max(minY + h, box.y + box.h);
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      w = maxX - minX;
      h = maxY - minY;
    }
    box = { x: minX, y: minY, w, h };
    root.setAttribute("viewBox", `${minX} ${minY} ${w} ${h}`);
  }

  function renderEdges() {
    edgeLayer.replaceChildren();
    labelLayer.replaceChildren();
    for (const e of edges.values()) {
      const ca = center(e.from), cb = center(e.to);
      const dx = cb[0] - ca[0], dy = cb[1] - ca[1], len = Math.hypot(dx, dy);
      if (len < 1) continue;
      // Si també hi ha camí de tornada, cada sentit es corba cap a un costat perquè no se superposin
      const bend = edges.has(`${e.to}>${e.from}`) ? 30 : 0;
      const c = [(ca[0] + cb[0]) / 2 - (dy / len) * bend, (ca[1] + cb[1]) / 2 + (dx / len) * bend];
      const p0 = boxEdge(ca, c), p2 = boxEdge(cb, c);
      svg("path", { class: "map-edge", d: `M${p0} Q${c} ${p2}`, "marker-end": "url(#arrow)" }, edgeLayer);
      const mid = [0.25 * p0[0] + 0.5 * c[0] + 0.25 * p2[0], 0.25 * p0[1] + 0.5 * c[1] + 0.25 * p2[1]];
      const label = svg("text", { class: "map-edge-label", x: mid[0], y: mid[1] - 6, "text-anchor": "middle" }, labelLayer);
      label.textContent = short(e.names.join(", "), 28);
    }
  }

  let drag = null;
  const toSvg = (e) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(root.getScreenCTM().inverse());
    return [p.x, p.y];
  };

  // Desa la posició de l'escenari arrossegat i també la dels que encara no en tenien, perquè no es moguin en tornar
  async function savePositions(movedId) {
    const toSave = a.scenes.filter((s) => s.id === movedId || !s.mapPosition);
    try {
      await Promise.all(toSave.map(async (s) => {
        const saved = await saveScene(a.id, s, { mapPosition: pos.get(s.id) });
        s.mapPosition = saved.mapPosition;
      }));
    } catch (err) {
      toast(`No s'ha pogut desar la posició: ${err.message}`);
    }
  }

  for (const s of a.scenes) {
    const g = svg("g", { class: "map-node", tabindex: 0, role: "link" }, nodeLayer);
    g.classList.toggle("start", s.id === startId);
    g.classList.toggle("unreachable", !reachable.has(s.id));
    const place = () => g.setAttribute("transform", `translate(${pos.get(s.id)})`);
    place();
    svg("title", {}, g).textContent = s.name;
    svg("rect", { class: "frame", width: NW, height: NH, rx: 8 }, g);
    if (s.background) {
      svg("image", { href: imageUrl(a.id, s.background), x: 1, y: 1, width: NW - 2, height: NH - 2, preserveAspectRatio: "xMidYMid slice", "clip-path": "url(#node-clip)" }, g);
    }
    svg("rect", { class: "label-bg", x: 1, y: NH - 25, width: NW - 2, height: 24, "clip-path": "url(#node-clip)" }, g);
    svg("text", { x: 10, y: NH - 9 }, g).textContent = short(s.name, 24);
    if (s.id === startId) {
      svg("rect", { class: "label-bg", x: 6, y: 6, width: 52, height: 18, rx: 4 }, g);
      svg("text", { class: "badge", x: 12, y: 19 }, g).textContent = "INICI";
    }

    g.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      g.setPointerCapture(e.pointerId);
      drag = { id: s.id, start: toSvg(e), orig: [...pos.get(s.id)], moved: false };
    });
    g.addEventListener("pointermove", (e) => {
      if (drag?.id !== s.id) return;
      const [x, y] = toSvg(e);
      const dx = x - drag.start[0], dy = y - drag.start[1];
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      g.classList.add("dragging");
      pos.set(s.id, [Math.round(drag.orig[0] + dx), Math.round(drag.orig[1] + dy)]);
      place();
      renderEdges();
    });
    g.addEventListener("pointerup", () => {
      if (drag?.id !== s.id) return;
      const moved = drag.moved;
      drag = null;
      g.classList.remove("dragging");
      if (!moved) { location.hash = sceneHref(s.id); return; }
      fitViewBox(true);
      savePositions(s.id);
    });
    g.addEventListener("keydown", (e) => { if (e.key === "Enter") location.hash = sceneHref(s.id); });
  }

  fitViewBox();
  renderEdges();

  /* ---------- Avisos ---------- */

  // Aquí només es miren les sortides; la pàgina de puzles té en compte també les regles i els diàlegs
  const warnings = [
    ...a.scenes.filter((s) => !reachable.has(s.id)).map((s) => [s, `No es pot arribar a «${s.name}» des de l'escenari inicial per cap sortida.`]),
    ...sceneWarnings(a).map((w) => [w.scene, w.text]),
  ];
  const section = $(".warnings");
  if (!warnings.length) {
    section.innerHTML = `<p class="meta">Cap avís: s'arriba a tots els escenaris i totes les sortides porten a algun lloc.</p>`;
    return;
  }
  section.innerHTML = `<div class="section-head"><h3>Avisos</h3></div><ul></ul>`;
  for (const [s, text] of warnings) {
    const li = el(`<li><span></span> <a>Obre</a></li>`);
    $("span", li).textContent = text;
    $("a", li).href = sceneHref(s.id);
    $("ul", section).append(li);
  }
}
