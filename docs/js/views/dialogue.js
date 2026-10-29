// Editor d'un diàleg en forma de graf. Cada node és una caixa amb les frases que es diuen i les opcions del jugador;
// cada opció té una fletxa cap al node on porta. A la dreta s'edita el node triat. Es desa sol.
import { saveAdventure } from "../api.js";
import { $, el, toast } from "../ui.js";
import { select, speakerOptions, conditionsEditor, actionsEditor, conditionProblems, actionProblems } from "../logic-fields.js";

const NW = 230;                 // amplada de cada node al graf
const HEAD = 34, ROW = 20;      // alçada de la capçalera i de cada fila d'opció
const GAP_X = 320, GAP_Y = 40, PAD = 50;
const SAVE_DELAY = 700;
const NS = "http://www.w3.org/2000/svg";
const NEW_NODE = "__new";

function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.append(n);
  return n;
}
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function renderDialogue(view, a, original) {
  const base = `#/aventura/${a.id}`;
  let d = structuredClone(original);
  let selected = d.start;
  const npcs = a.characters.filter((c) => c.id !== a.playerId);
  const nameOf = (id) => (id ? a.characters.find((c) => c.id === id)?.name ?? "?" : a.characters.find((c) => c.id === a.playerId)?.name ?? "Protagonista");
  const colorOf = (id) => a.characters.find((c) => c.id === (id ?? a.playerId))?.color ?? "#ffffff";
  const nodeOf = (id) => d.nodes.find((n) => n.id === id);
  const titleOf = (n) => (n.lines[0]?.text ? short(n.lines[0].text, 34) : `Node ${d.nodes.indexOf(n) + 1}`);
  const sceneOfCharacter = a.scenes.find((s) => s.characters.some((p) => p.characterId === d.characterId));

  document.title = `${d.name} · Editor d'aventures`;
  view.innerHTML = `
    <div class="editor">
      <div class="editor-bar">
        <a class="back" href="${base}/dialegs">← Diàlegs</a>
        <input class="dlg-name" maxlength="120" aria-label="Nom del diàleg">
        <label class="filter">Amb <select id="dlg-character"></select></label>
        <button class="small" id="add-node">+ Node</button>
        <a class="button small" id="try" title="Juga a l'escenari del personatge">▶ Prova</a>
        <span class="save-status" id="save-status" role="status"></span>
      </div>
      <div class="editor-main">
        <div class="stage dlg-graph"><svg role="img" aria-label="Graf del diàleg"></svg></div>
        <aside class="panel dlg-panel"></aside>
      </div>
    </div>`;

  const nameInput = $(".dlg-name", view);
  nameInput.value = d.name;
  nameInput.oninput = () => { d.name = nameInput.value; changed(false); };
  const chSelect = $("#dlg-character", view);
  chSelect.append(new Option("— ningú (només des de regles) —", ""));
  for (const c of npcs) chSelect.append(new Option(c.name, c.id));
  chSelect.value = d.characterId ?? "";
  chSelect.onchange = () => { d.characterId = chSelect.value || null; changed(); };
  const tryLink = $("#try", view);
  tryLink.hidden = !sceneOfCharacter;
  if (sceneOfCharacter) tryLink.href = `${base}/juga/${sceneOfCharacter.id}`;

  /* ---------- Desat automàtic ---------- */

  const status = $("#save-status");
  let timer = null, inflight = null;

  // Mentre hi hagi frases o opcions sense text, no es desa (el servidor les rebutjaria)
  function problems() {
    const out = [];
    if (!d.name.trim()) out.push("el diàleg no té nom");
    d.nodes.forEach((n) => {
      const where = `«${titleOf(n)}»`;
      if (n.lines.some((l) => !l.text.trim())) out.push(`hi ha una frase buida a ${where}`);
      n.options.forEach((o, i) => {
        if (!o.text.trim()) out.push(`l'opció ${i + 1} de ${where} no té text`);
        out.push(...conditionProblems(o.conditions, `opció ${i + 1}, condició`), ...actionProblems(o.actions, `opció ${i + 1}, acció`));
      });
    });
    return out;
  }

  function save() {
    clearTimeout(timer);
    timer = null;
    const missing = problems();
    if (missing.length) {
      status.textContent = "Sense desar";
      status.title = `Falta: ${missing.join("; ")}`;
      status.classList.add("error");
      return Promise.resolve();
    }
    status.textContent = "Desant…";
    status.title = "";
    status.classList.remove("error");
    const dialogues = a.dialogues.map((x) => (x.id === d.id ? d : x));
    inflight = saveAdventure(a, { dialogues })
      .then((saved) => {
        a.dialogues = saved.dialogues;
        status.textContent = timer ? "Canvis sense desar" : "Desat";
      })
      .catch((err) => {
        status.textContent = "No s'ha pogut desar";
        status.title = err.message;
        status.classList.add("error");
        toast(`No s'ha pogut desar: ${err.message}`);
      })
      .finally(() => { inflight = null; });
    return inflight;
  }

  // structural: cal refer el panell (s'ha afegit o tret alguna cosa); si no, només el graf
  function changed(structural = true) {
    status.textContent = "Canvis sense desar";
    status.classList.remove("error");
    clearTimeout(timer);
    timer = setTimeout(save, SAVE_DELAY);
    renderGraph();
    if (structural) renderPanel();
  }

  function onBeforeUnload(e) {
    if (timer || inflight) e.preventDefault();
  }
  window.addEventListener("beforeunload", onBeforeUnload);

  /* ---------- Graf ---------- */

  const root = $("svg", view);
  const defs = svg("defs", {}, root);
  const marker = svg("marker", { id: "dlg-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
  svg("path", { d: "M0,0 L10,5 L0,10 z", style: "fill: var(--accent)" }, marker);
  const edgeLayer = svg("g", {}, root), nodeLayer = svg("g", {}, root);
  const heightOf = (n) => HEAD + ROW * Math.max(1, n.options.length) + 6;

  // Els nodes sense posició es col·loquen per columnes segons la distància (en opcions) des del node inicial
  function autoLayout() {
    const depth = new Map([[d.start, 0]]);
    const queue = [d.start];
    while (queue.length) {
      const id = queue.shift();
      for (const o of nodeOf(id)?.options ?? []) {
        if (o.next && !depth.has(o.next)) { depth.set(o.next, depth.get(id) + 1); queue.push(o.next); }
      }
    }
    const maxDepth = Math.max(0, ...depth.values());
    const colY = new Map();
    for (const n of d.nodes) {
      if (n.position) continue;
      const col = depth.get(n.id) ?? maxDepth + 1;
      const y = colY.get(col) ?? 0;
      n.position = [col * GAP_X, y];
      colY.set(col, y + heightOf(n) + GAP_Y);
    }
  }

  function fitViewBox() {
    const xs = d.nodes.map((n) => n.position[0]), ys = d.nodes.map((n) => n.position[1]);
    let minX = Math.min(...xs) - PAD, minY = Math.min(...ys) - PAD;
    let w = Math.max(...d.nodes.map((n) => n.position[0] + NW)) + PAD - minX;
    // A baix es deixa més marge per a les fletxes que tornen enrere per sota dels nodes
    let h = Math.max(...d.nodes.map((n) => n.position[1] + heightOf(n))) + PAD + 40 - minY;
    if (w < 700) { minX -= (700 - w) / 2; w = 700; }
    if (h < 420) { minY -= (420 - h) / 2; h = 420; }
    root.setAttribute("viewBox", `${minX} ${minY} ${w} ${h}`);
  }

  let drag = null;
  const toSvg = (e) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(root.getScreenCTM().inverse());
    return [p.x, p.y];
  };

  function renderGraph() {
    autoLayout();
    edgeLayer.replaceChildren();
    nodeLayer.replaceChildren();
    for (const n of d.nodes) {
      const [x, y] = n.position;
      n.options.forEach((o, i) => {
        const target = o.next && o.next !== n.id ? nodeOf(o.next) : null;
        if (!target) return;
        const sx = x + NW, sy = y + HEAD + ROW * i + ROW / 2;
        const [tx, ty] = [target.position[0], target.position[1] + HEAD / 2];
        let path;
        if (tx > sx + 20) {
          const bend = Math.max(40, (tx - sx) / 2);
          path = `M${sx},${sy} C${sx + bend},${sy} ${tx - bend},${ty} ${tx - 2},${ty}`;
        } else {
          // Les fletxes que tornen enrere passen per sota dels dos nodes, en lloc de creuar-los
          const low = Math.max(y + heightOf(n), target.position[1] + heightOf(target)) + 30;
          const mid = (sx + tx) / 2;
          path = `M${sx},${sy} C${sx + 70},${sy} ${sx + 70},${low} ${mid},${low} C${tx - 70},${low} ${tx - 70},${ty} ${tx - 2},${ty}`;
        }
        svg("path", { class: "dlg-edge", d: path, "marker-end": "url(#dlg-arrow)" }, edgeLayer);
      });

      const g = svg("g", { class: "dlg-node", transform: `translate(${x},${y})`, tabindex: 0 }, nodeLayer);
      g.classList.toggle("selected", n.id === selected);
      g.classList.toggle("start", n.id === d.start);
      svg("rect", { class: "frame", width: NW, height: heightOf(n), rx: 8 }, g);
      svg("rect", { class: "head", width: NW, height: HEAD - 4, rx: 8 }, g);
      const title = svg("text", { x: 10, y: 20, class: "dlg-title" }, g);
      title.textContent = (n.id === d.start ? "★ " : "") + titleOf(n);
      if (n.lines[0]) title.style.fill = colorOf(n.lines[0].by);
      if (!n.options.length) {
        svg("text", { x: 10, y: HEAD + 14, class: "dlg-opt muted" }, g).textContent = "(s'acaba la conversa)";
      }
      n.options.forEach((o, i) => {
        const t = svg("text", { x: 10, y: HEAD + ROW * i + 14, class: "dlg-opt" }, g);
        const where = !o.next ? " → fi" : o.next === n.id ? " ↺" : "";
        t.textContent = `${o.once ? "¹ " : "• "}${short(o.text || "(sense text)", 30)}${where}`;
        if (o.conditions.length) t.classList.add("conditional");
      });

      g.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        g.setPointerCapture(e.pointerId);
        drag = { id: n.id, start: toSvg(e), orig: [...n.position], moved: false };
      });
      g.addEventListener("pointermove", (e) => {
        if (drag?.id !== n.id) return;
        const [px, py] = toSvg(e);
        const dx = px - drag.start[0], dy = py - drag.start[1];
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        n.position = [Math.round(drag.orig[0] + dx), Math.round(drag.orig[1] + dy)];
        renderGraph();
      });
      g.addEventListener("pointerup", () => {
        if (drag?.id !== n.id) return;
        const moved = drag.moved;
        drag = null;
        if (moved) { fitViewBox(); changed(false); return; }
        selected = n.id;
        renderGraph();
        renderPanel();
      });
      g.addEventListener("keydown", (e) => { if (e.key === "Enter") { selected = n.id; renderGraph(); renderPanel(); } });
    }
  }

  /* ---------- Panell del node ---------- */

  function addNode(from) {
    const anchor = nodeOf(from ?? selected) ?? d.nodes[0];
    const node = {
      id: crypto.randomUUID(),
      position: anchor ? [anchor.position[0] + GAP_X, anchor.position[1]] : null,
      lines: [{ by: d.characterId, text: "" }],
      options: [],
    };
    d.nodes.push(node);
    return node;
  }
  $("#add-node", view).onclick = () => {
    selected = addNode().id;
    fitViewBox();
    changed();
  };

  function moveButtons(list, i) {
    return [-1, 1].map((dir) => {
      const b = el(`<button type="button" class="small"></button>`);
      b.textContent = dir < 0 ? "↑" : "↓";
      b.setAttribute("aria-label", dir < 0 ? "Puja" : "Baixa");
      b.disabled = i + dir < 0 || i + dir >= list.length;
      b.onclick = () => { list.splice(i + dir, 0, list.splice(i, 1)[0]); changed(); };
      return b;
    });
  }

  function linesSection(n) {
    const sec = el(`<section><h4>El que es diu</h4><div class="dlg-lines"></div><button type="button" class="small">+ Frase</button></section>`);
    const box = $(".dlg-lines", sec);
    if (!n.lines.length) box.append(el(`<p class="muted">Cap frase: es passa directament a les opcions.</p>`));
    n.lines.forEach((l, i) => {
      const r = el(`<div class="dlg-line"><div class="actions"></div></div>`);
      const who = select(speakerOptions(a), l.by ?? "", (v) => { l.by = v || null; changed(); });
      who.style.borderLeft = `6px solid ${colorOf(l.by)}`;
      const text = el(`<textarea rows="2" maxlength="500" placeholder="Què diu?"></textarea>`);
      text.value = l.text;
      text.oninput = () => { l.text = text.value; changed(false); };
      const del = el(`<button type="button" class="small danger">Treu</button>`);
      del.onclick = () => { n.lines.splice(i, 1); changed(); };
      $(".actions", r).append(...moveButtons(n.lines, i), del);
      r.prepend(who, text);
      box.append(r);
    });
    $(":scope > button", sec).onclick = () => {
      // Les frases es van alternant: si l'última la diu el personatge, la següent la diu el protagonista
      const last = n.lines.at(-1);
      n.lines.push({ by: last ? (last.by ? null : d.characterId) : d.characterId, text: "" });
      changed();
      sec.querySelector(".dlg-line:last-child textarea")?.focus();
    };
    return sec;
  }

  function nextSelect(n, o) {
    const choices = [
      ["", "Acaba la conversa"],
      [n.id, "↺ Torna a mostrar aquestes opcions"],
      ...d.nodes.filter((x) => x.id !== n.id).map((x) => [x.id, `→ ${titleOf(x)}`]),
      [NEW_NODE, "+ Un node nou"],
    ];
    return select(choices, o.next ?? "", (v) => {
      if (v === NEW_NODE) {
        const node = addNode(n.id);
        node.position = [n.position[0] + GAP_X, n.position[1] + n.options.indexOf(o) * 80];
        o.next = node.id;
        fitViewBox();
      } else o.next = v || null;
      changed();
    });
  }

  function optionsSection(n) {
    const sec = el(`<section><h4>Opcions del jugador</h4><div class="dlg-options"></div><button type="button" class="small">+ Opció</button></section>`);
    const box = $(".dlg-options", sec);
    if (!n.options.length) box.append(el(`<p class="muted">Sense opcions: després de les frases, la conversa s'acaba.</p>`));
    n.options.forEach((o, i) => {
      const card = el(`<div class="dlg-option">
        <div class="dlg-option-head"><span class="meta"></span><div class="actions"></div></div>
        <input maxlength="500" placeholder="El que diu el protagonista">
        <label class="inline">Després <span class="next"></span></label>
        <label class="check"><input type="checkbox"> Només una vegada (després desapareix)</label>
        <details class="cond"><summary></summary></details>
        <details class="acts"><summary></summary></details>
      </div>`);
      $(".meta", card).textContent = `Opció ${i + 1}`;
      const del = el(`<button type="button" class="small danger">Treu</button>`);
      del.onclick = () => { n.options.splice(i, 1); changed(); };
      $(".actions", card).append(...moveButtons(n.options, i), del);
      const text = $("input[maxlength]", card);
      text.value = o.text;
      text.oninput = () => { o.text = text.value; changed(false); };
      $(".next", card).append(nextSelect(n, o));
      const once = $("input[type=checkbox]", card);
      once.checked = o.once;
      once.onchange = () => { o.once = once.checked; changed(false); };
      // Condicions i accions plegades, amb el recompte a la vista
      const cond = $(".cond", card), acts = $(".acts", card);
      const counts = () => {
        $("summary", cond).textContent = `Condicions (${o.conditions.length}): només surt si…`;
        $("summary", acts).textContent = `Accions (${o.actions.length}): què passa en triar-la`;
      };
      counts();
      cond.open = o.conditions.length > 0;
      acts.open = o.actions.length > 0;
      cond.append(conditionsEditor(a, o.conditions, () => { counts(); changed(false); }, { emptyText: "Sense condicions: surt sempre." }));
      acts.append(actionsEditor(a, o.actions, () => { counts(); changed(false); }, { emptyText: "Sense accions: només el diu." }));
      box.append(card);
    });
    $(":scope > button", sec).onclick = () => {
      n.options.push({ id: crypto.randomUUID(), text: "", once: false, conditions: [], actions: [], next: null });
      changed();
      sec.querySelector(".dlg-option:last-child input[maxlength]")?.focus();
    };
    return sec;
  }

  function renderPanel() {
    const panel = $(".dlg-panel", view);
    const n = nodeOf(selected) ?? d.nodes[0];
    selected = n.id;
    const head = el(`<section class="props"><h4>Node</h4><p class="muted"></p><div class="actions"></div></section>`);
    $("p", head).textContent = n.id === d.start
      ? "★ La conversa comença aquí."
      : "El personatge diu les frases i després el jugador tria una opció.";
    if (n.id !== d.start) {
      const startHere = el(`<button type="button" class="small">Fes que comenci aquí</button>`);
      startHere.onclick = () => { d.start = n.id; changed(); };
      const del = el(`<button type="button" class="small danger">Esborra el node</button>`);
      // Les opcions que hi portaven passen a acabar la conversa
      del.onclick = () => {
        d.nodes = d.nodes.filter((x) => x.id !== n.id);
        for (const x of d.nodes) for (const o of x.options) if (o.next === n.id) o.next = null;
        selected = d.start;
        changed();
      };
      $(".actions", head).append(startHere, del);
    }
    panel.replaceChildren(head, linesSection(n), optionsSection(n));
  }

  autoLayout();
  fitViewBox();
  renderGraph();
  renderPanel();
  status.textContent = "";

  return async () => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    if (timer) await save();
    else if (inflight) await inflight;
  };
}
