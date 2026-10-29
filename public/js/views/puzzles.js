// Pàgina de puzles: si l'aventura es pot acabar, el mapa de dependències dels puzles i la llista de problemes
import { $, el, plural } from "../ui.js";
import { analyze } from "../analysis.js";

const NW = 210, NH = 46, GAP_X = 270, GAP_Y = 16, PAD = 30;
const NS = "http://www.w3.org/2000/svg";
const KIND = { start: "Inici", exit: "Sortida", pickup: "Agafa", rule: "Regla", talk: "Parla", option: "Opció de diàleg", cutscene: "Seqüència" };
const LEVELS = [["error", "Errors"], ["warn", "Avisos"], ["info", "Informació"]];

function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.append(n);
  return n;
}
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function renderPuzzles(view, a) {
  const base = `#/aventura/${a.id}`;
  document.title = `Puzles · ${a.title} · Editor d'aventures`;
  const result = analyze(a);

  const hrefFor = (link) => {
    if (!link) return null;
    if (link.scene) return `${base}/escenari/${link.scene}`;
    if (link.dialogue) return `${base}/dialegs/${link.dialogue}`;
    if (link.cutscene) return `${base}/sequencies/${link.cutscene}`;
    if ("rule" in link) return link.rule ? `${base}/regles/${link.rule}` : `${base}/regles`;
    if (link.objects) return `${base}/objectes`;
    if (link.rules) return `${base}/regles`;
    return null;
  };

  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Puzles</h2><p>Què pot arribar a fer el jugador i si l'aventura es pot acabar. La comprovació és optimista: no té en compte el que es perd pel camí (objectes que es donen, estats que tornen enrere). Si diu que una cosa no es pot fer, és segur; si diu que es pot acabar, és molt probable, però prova-ho jugant.</p></div>
      <div class="actions"><a class="button" href="${base}/juga">▶ Juga</a></div>
    </div>
    <div class="verdict"></div>
    <section class="puzzle-section">
      <div class="section-head">
        <h3>Mapa de puzles</h3>
        <label class="check filter"><input type="checkbox" id="only-critical"> Només el camí cap al final</label>
      </div>
      <p class="meta">Cada caixa és una cosa que el jugador pot fer, ordenades per quan es poden fer. Les fletxes van del que fa falta al que ho aprofita. En groc, el camí més curt fins al final. Clica una caixa per anar on es defineix.</p>
      <div class="puzzle-chart"></div>
    </section>
    <section class="puzzle-section issues"></section>`;
  $(".back", view).textContent = `← ${a.title}`;

  /* ---------- Veredicte ---------- */

  const counts = Object.fromEntries(LEVELS.map(([lv]) => [lv, result.issues.filter((i) => i.level === lv).length]));
  const verdict = $(".verdict", view);
  const [cls, title] = !result.hasEnding ? ["bad", "Aquesta aventura encara no té final"]
    : result.canFinish ? ["good", "✓ Es pot acabar"] : ["bad", "✗ No es pot acabar"];
  verdict.className = `verdict ${cls}`;
  verdict.innerHTML = `<strong></strong><span></span>`;
  $("strong", verdict).textContent = title;
  $("span", verdict).textContent = [
    plural(result.chart.steps.length, "cosa que es pot fer", "coses que es poden fer"),
    plural(counts.error, "error", "errors"),
    plural(counts.warn, "avís", "avisos"),
  ].join(" · ");

  /* ---------- Mapa ---------- */

  const box = $(".puzzle-chart", view);
  const only = $("#only-critical", view);
  only.checked = result.canFinish;
  only.disabled = !result.canFinish;

  function renderChart() {
    const steps = only.checked ? result.chart.steps.filter((s) => result.chart.critical.has(s.id)) : result.chart.steps;
    if (!steps.length) {
      box.innerHTML = `<p class="muted" style="padding:16px">No hi ha res per mostrar.</p>`;
      return;
    }
    // Columnes per ronda (quan es pot fer); si només es mostra el camí, sense columnes buides
    const rounds = [...new Set(steps.map((s) => s.round))].sort((x, y) => x - y);
    const colOf = new Map(rounds.map((r, i) => [r, i]));
    const pos = new Map();
    const perCol = new Map();
    for (const s of [...steps].sort((x, y) => Number(result.chart.critical.has(y.id)) - Number(result.chart.critical.has(x.id)))) {
      const col = colOf.get(s.round), row = perCol.get(col) ?? 0;
      pos.set(s.id, [col * GAP_X, row * (NH + GAP_Y)]);
      perCol.set(col, row + 1);
    }
    const width = rounds.length * GAP_X - (GAP_X - NW) + PAD * 2;
    const height = Math.max(...perCol.values()) * (NH + GAP_Y) - GAP_Y + PAD * 2;
    const root = svg("svg", { width, height, viewBox: `${-PAD} ${-PAD} ${width} ${height}`, role: "img", "aria-label": "Mapa de puzles" });
    const defs = svg("defs", {}, root);
    for (const [id, color] of [["pz-arrow", "var(--muted)"], ["pz-arrow-hot", "var(--accent)"]]) {
      const m = svg("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, defs);
      svg("path", { d: "M0,0 L10,5 L0,10 z", style: `fill: ${color}` }, m);
    }
    for (const [from, to] of result.chart.edges) {
      if (!pos.has(from) || !pos.has(to)) continue;
      const [x1, y1] = pos.get(from), [x2, y2] = pos.get(to);
      const sx = x1 + NW, sy = y1 + NH / 2, tx = x2, ty = y2 + NH / 2;
      const hot = result.chart.critical.has(from) && result.chart.critical.has(to);
      const bend = Math.max(30, (tx - sx) / 2);
      svg("path", {
        class: `pz-edge${hot ? " hot" : ""}`, d: `M${sx},${sy} C${sx + bend},${sy} ${tx - bend},${ty} ${tx - 2},${ty}`,
        "marker-end": `url(#${hot ? "pz-arrow-hot" : "pz-arrow"})`,
      }, root);
    }
    for (const s of steps) {
      const [x, y] = pos.get(s.id);
      const href = hrefFor(s.link);
      const g = svg(href ? "a" : "g", { transform: `translate(${x},${y})`, class: `pz-node ${s.kind}${result.chart.critical.has(s.id) ? " hot" : ""}` }, root);
      if (href) g.setAttribute("href", href);
      svg("title", {}, g).textContent = s.label;
      svg("rect", { width: NW, height: NH, rx: 7 }, g);
      svg("text", { x: 10, y: 17, class: "pz-kind" }, g).textContent = KIND[s.kind] ?? s.kind;
      svg("text", { x: 10, y: 35, class: "pz-label" }, g).textContent = short(s.label, 30);
    }
    box.replaceChildren(root);
  }
  only.onchange = renderChart;
  renderChart();

  /* ---------- Problemes ---------- */

  const issues = $(".issues", view);
  if (!result.issues.length) {
    issues.innerHTML = `<p class="meta">Cap problema trobat.</p>`;
    return;
  }
  for (const [level, title] of LEVELS) {
    const list = result.issues.filter((i) => i.level === level);
    if (!list.length) continue;
    const sec = el(`<div class="issue-group ${level}"><div class="section-head"><h3></h3></div><ul></ul></div>`);
    $("h3", sec).textContent = `${title} (${list.length})`;
    for (const i of list) {
      const li = el(`<li><span></span></li>`);
      $("span", li).textContent = i.text;
      const href = hrefFor(i.link);
      if (href) {
        const link = el(`<a>Obre</a>`);
        link.href = href;
        li.append(" ", link);
      }
      $("ul", sec).append(li);
    }
    issues.append(sec);
  }
}
