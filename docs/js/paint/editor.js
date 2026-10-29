// Editor de dibuix de píxels, per als fons dels escenaris, els sprites dels objectes, els fulls de sprites dels
// personatges i la pantalla de títol. S'obre a sobre de tot amb openPaintEditor() i torna la imatge en PNG.
// Eines: llapis, goma, pot de pintura, línia, rectangle, el·lipse, comptagotes i selecció (moure, copiar, enganxar).
import { $, $$, el, loadImage } from "../ui.js";
import * as ops from "./image-ops.js";
import { PALETTES } from "./palettes.js";
import { openPixelate } from "./pixelate-dialog.js";

const MAX_SIDE = 2048;
const MAX_IMPORT = 1024;           // les imatges importades més grans es redueixen abans de pixelar-les
const HISTORY_BYTES = 200 * 1024 * 1024;
const MIN_ZOOM = 0.25, MAX_ZOOM = 64;
const TRANSPARENT = [0, 0, 0, 0];
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const TOOLS = [
  { id: "pencil", label: "Llapis", icon: "✎", key: "b" },
  { id: "eraser", label: "Goma", icon: "⌫", key: "e" },
  { id: "fill", label: "Pot de pintura", icon: "◧", key: "g" },
  { id: "line", label: "Línia", icon: "╱", key: "l" },
  { id: "rect", label: "Rectangle", icon: "▭", key: "r" },
  { id: "ellipse", label: "El·lipse", icon: "◯", key: "o" },
  { id: "picker", label: "Comptagotes", icon: "⊙", key: "i" },
  { id: "select", label: "Selecció", icon: "⬚", key: "m" },
];
const OPTIONS_FOR = {
  pencil: ["size", "mirror", "pattern"], eraser: ["size", "mirror", "pattern"], fill: ["tolerance", "contiguous"],
  line: ["size", "mirror"], rect: ["size", "filled", "mirror"], ellipse: ["size", "filled", "mirror"], picker: [], select: [],
};

const dialog = el(`
  <dialog class="paint-dialog" aria-label="Editor de dibuix">
    <div class="paint-win">
      <h3 class="paint-title"></h3>
      <div class="paint-bar">
        <div class="tools">
          <button type="button" data-act="new" title="Un dibuix en blanc">Nou…</button>
          <button type="button" data-act="open" title="Importa una imatge o una foto i pixela-la (també pots arrossegar-la o enganxar-la)">Importa…</button>
          <button type="button" data-act="pixelate" title="Redueix la resolució, els colors, hi posa tramat, contorn…">Pixela i filtres…</button>
        </div>
        <div class="tools">
          <button type="button" data-act="size" title="Canvia la mida del dibuix o del llenç">Mida…</button>
          <button type="button" data-act="flip-h" title="Mirall horitzontal" aria-label="Mirall horitzontal">⇋</button>
          <button type="button" data-act="flip-v" title="Mirall vertical" aria-label="Mirall vertical">⇵</button>
          <button type="button" data-act="rot-l" title="Gira a l'esquerra" aria-label="Gira a l'esquerra">⟲</button>
          <button type="button" data-act="rot-r" title="Gira a la dreta" aria-label="Gira a la dreta">⟳</button>
          <button type="button" data-act="outline" title="Contorn d'un píxel amb el color principal">Contorn</button>
          <button type="button" data-act="remove-bg" title="Fa transparent el color de les cantonades i el que s'hi toca">Treu el fons</button>
        </div>
        <div class="tools">
          <button type="button" data-act="undo" title="Desfés (⌘Z)" aria-label="Desfés">↶</button>
          <button type="button" data-act="redo" title="Refés (⇧⌘Z)" aria-label="Refés">↷</button>
        </div>
        <div class="tools">
          <button type="button" data-act="zoom-out" title="Allunya (−)" aria-label="Allunya">−</button>
          <span class="zoom-label"></span>
          <button type="button" data-act="zoom-in" title="Apropa (+)" aria-label="Apropa">+</button>
          <button type="button" data-act="fit" title="Ajusta a la finestra (0)">Ajusta</button>
          <label class="check"><input type="checkbox" name="grid" checked> Graella</label>
          <label class="check frames-toggle"><input type="checkbox" name="frames" checked> Fotogrames</label>
        </div>
      </div>
      <div class="paint-main">
        <aside class="paint-left">
          <div class="paint-tools" role="toolbar" aria-label="Eines"></div>
          <div class="paint-options">
            <label data-opt="size">Gruix <span class="range"><input type="range" name="size" min="1" max="16" value="1"><output></output></span></label>
            <label class="check" data-opt="filled"><input type="checkbox" name="filled"> Plena</label>
            <label data-opt="tolerance">Tolerància <span class="range"><input type="range" name="tolerance" min="0" max="128" value="0"><output></output></span></label>
            <label class="check" data-opt="contiguous"><input type="checkbox" name="contiguous" checked> Només el que es toca</label>
            <label class="check" data-opt="mirror" title="Pinta també a l'altra banda, com un mirall vertical al mig"><input type="checkbox" name="mirror"> Simetria</label>
            <label class="check" data-opt="pattern" title="Pinta només un píxel de cada dos, en escaquer"><input type="checkbox" name="pattern"> Tramat</label>
          </div>
        </aside>
        <div class="paint-stage" tabindex="0"><canvas></canvas><div class="paint-drop">Deixa-la anar per importar-la</div></div>
        <aside class="paint-right">
          <div class="paint-colors">
            <button type="button" class="color-well fg" title="Color principal (clic esquerre)"><input type="color" tabindex="-1"></button>
            <button type="button" class="color-well bg" title="Color secundari (clic dret)"><input type="color" tabindex="-1"></button>
            <button type="button" class="small" data-act="swap" title="Intercanvia els colors (X)">⇄</button>
          </div>
          <label>Paleta <select name="palette"></select></label>
          <div class="paint-palette" title="Clic: color principal · clic dret: secundari"></div>
          <h4>Vista prèvia</h4>
          <div class="paint-preview"><canvas></canvas></div>
          <section class="keys">
            <kbd>B</kbd> llapis · <kbd>E</kbd> goma · <kbd>G</kbd> pot · <kbd>L</kbd> línia · <kbd>R</kbd> rectangle · <kbd>O</kbd> el·lipse · <kbd>I</kbd> comptagotes · <kbd>M</kbd> selecció<br>
            Clic dret: color secundari · <kbd>Alt</kbd>+clic: agafa el color<br>
            <kbd>X</kbd> intercanvia colors · <kbd>[</kbd> <kbd>]</kbd> gruix<br>
            <kbd>Maj</kbd>: línies rectes i quadrats<br>
            <kbd>⌘C</kbd> <kbd>⌘X</kbd> <kbd>⌘V</kbd> <kbd>⌘A</kbd> · <kbd>Supr</kbd> esborra la selecció<br>
            <kbd>Espai</kbd>+arrossega o roda: mou la vista · <kbd>⌘</kbd>+roda: zoom
          </section>
        </aside>
      </div>
      <div class="paint-foot">
        <span class="paint-status"></span>
        <span class="paint-size"></span>
        <p class="paint-warn" hidden></p>
        <button type="button" data-act="cancel">Cancel·la</button>
        <button type="button" class="primary" data-act="done">Fet</button>
      </div>
    </div>
    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
  </dialog>`);
document.body.append(dialog);

const stage = $(".paint-stage", dialog), canvas = $("canvas", stage), ctx = canvas.getContext("2d");
const previewCanvas = $(".paint-preview canvas", dialog);
const fileInput = $("input[type=file]", dialog);
const opt = (name) => $(`[name=${name}]`, dialog);
const buf = document.createElement("canvas"), bctx = buf.getContext("2d");          // el dibuix a mida real
const fbuf = document.createElement("canvas"), fctx = fbuf.getContext("2d");        // la selecció flotant

// Un petit diàleg de preguntes (mida nova, descartar canvis…): torna el formulari o null
function ask(title, body, okText = "D'acord") {
  const d = el(`<dialog class="paint-ask"><form method="dialog"><h3></h3><div class="ask-body"></div>
    <div class="row-end"><button value="no" formnovalidate>Cancel·la</button><button value="ok" class="primary"></button></div></form></dialog>`);
  $("h3", d).textContent = title;
  $(".ask-body", d).innerHTML = body;
  $(".primary", d).textContent = okText;
  dialog.append(d);
  d.showModal();
  // Es respon en enviar el formulari o amb Esc, sense esperar l'esdeveniment «close», que no tots els navegadors envien a temps
  const form = $("form", d);
  return new Promise((resolve) => {
    const finish = (ok) => {
      d.close();
      d.remove();
      resolve(ok ? form : null);
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); finish(e.submitter?.value === "ok"); });
    d.addEventListener("cancel", (e) => { e.preventDefault(); finish(false); });
  });
}

let S = null;   // l'estat de l'edició en curs (vegeu openPaintEditor)

/* ---------- Obrir i tancar ---------- */

// Obre l'editor i torna un Blob PNG amb el resultat, o null si es cancel·la.
//   src: la imatge a editar (adreça o data URL), o res per començar en blanc;
//   width, height: la mida del dibuix en blanc;
//   grid: { w, h } per mostrar la graella de fotogrames d'un full de sprites;
//   sizeNote: un avís per si es canvia la mida (per exemple, que les zones de l'escenari van en píxels).
export async function openPaintEditor({ title = "Dibuix", src = null, width = 320, height = 200, grid = null, sizeNote = "" } = {}) {
  let img = ops.blank(width, height);
  if (src) {
    const im = await loadImage(src);
    img = imageToPixels(im, im.naturalWidth, im.naturalHeight);
  }
  S = {
    img, undo: [], redo: [], dirty: false, original: [img.width, img.height],
    tool: "pencil", fg: [26, 28, 44, 255], bg: [255, 255, 255, 255],
    zoom: 1, panX: 0, panY: 0, mouse: null, action: null, space: false,
    sel: null,          // { x, y, w, h, float: imatge o null } en píxels del dibuix
    clipboard: null, grid, sizeNote, resolve: null,
  };
  $(".paint-title", dialog).textContent = title;
  $(".frames-toggle", dialog).hidden = !grid;
  renderTools();
  renderPalette();
  renderColors();
  showOptions();
  sync();
  dialog.showModal();
  requestAnimationFrame(() => { fit(); drawPreview(); stage.focus(); });
  return new Promise((resolve) => { S.resolve = resolve; });
}

function imageToPixels(source, w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const cx = c.getContext("2d");
  cx.imageSmoothingQuality = "high";
  cx.drawImage(source, 0, 0, w, h);
  const d = cx.getImageData(0, 0, w, h);
  return { width: w, height: h, data: d.data };
}

async function close(save) {
  if (!S) return;
  if (!save && S.dirty && !(await ask("Vols descartar els canvis?", "<p>Perdràs tot el que has dibuixat des que has obert l'editor.</p>", "Descarta'ls"))) return;
  commitFloat();
  let result = null;
  if (save) {
    sync();
    result = await new Promise((r) => buf.toBlob(r, "image/png"));
  }
  const resolve = S.resolve;
  S = null;
  dialog.close();
  resolve(result);
}

dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  if (S?.sel) { commitFloat(); S.sel = null; draw(); return; }
  close(false);
});
$("[data-act=cancel]", dialog).onclick = () => close(false);
$("[data-act=done]", dialog).onclick = () => close(true);

/* ---------- Història ---------- */

function pushUndo() {
  S.undo.push({ width: S.img.width, height: S.img.height, data: new Uint8ClampedArray(S.img.data) });
  S.redo = [];
  let bytes = S.undo.reduce((n, u) => n + u.data.length, 0);
  while (S.undo.length > 1 && bytes > HISTORY_BYTES) bytes -= S.undo.shift().data.length;
  S.dirty = true;
}
function undo() {
  commitFloat();
  if (!S.undo.length) return;
  S.redo.push(S.img);
  S.img = S.undo.pop();
  S.sel = null;
  sync();
}
function redo() {
  commitFloat();
  if (!S.redo.length) return;
  S.undo.push(S.img);
  S.img = S.redo.pop();
  S.sel = null;
  sync();
}
// Canvia tot el dibuix (filtres, girs, mida…) deixant-ho a la història
function replaceImage(next) {
  commitFloat();
  pushUndo();
  S.img = next;
  S.sel = null;
  sync();
}

/* ---------- Dibuix a pantalla ---------- */

// Passa el dibuix al llenç intern i ho torna a pintar tot
function sync() {
  const { img } = S;
  if (buf.width !== img.width || buf.height !== img.height) { buf.width = img.width; buf.height = img.height; }
  bctx.putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
  if (S.sel?.float) {
    const f = S.sel.float;
    fbuf.width = f.width;
    fbuf.height = f.height;
    fctx.putImageData(new ImageData(f.data, f.width, f.height), 0, 0);
  }
  drawPreview();
  draw();
  const changed = img.width !== S.original[0] || img.height !== S.original[1];
  const warn = $(".paint-warn", dialog);
  warn.hidden = !(changed && S.sizeNote);
  warn.textContent = S.sizeNote;
  $(".paint-size", dialog).textContent = `${img.width} × ${img.height} px`;
  $("[data-act=undo]", dialog).disabled = !S.undo.length;
  $("[data-act=redo]", dialog).disabled = !S.redo.length;
}

let checker = null;
function draw() {
  if (!S) return;
  const dpr = devicePixelRatio || 1;
  const cw = stage.clientWidth, ch = stage.clientHeight;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, cw, ch);
  const { img, zoom: z, panX, panY } = S;
  const w = img.width * z, h = img.height * z;
  // Escaquer sota el dibuix, perquè es vegi què és transparent
  if (!checker) {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const cx = c.getContext("2d");
    cx.fillStyle = "#fff"; cx.fillRect(0, 0, 16, 16);
    cx.fillStyle = "#d6d6d6"; cx.fillRect(0, 0, 8, 8); cx.fillRect(8, 8, 8, 8);
    checker = ctx.createPattern(c, "repeat");
  }
  ctx.fillStyle = checker;
  ctx.fillRect(panX, panY, w, h);
  ctx.imageSmoothingEnabled = z < 1;
  ctx.drawImage(buf, panX, panY, w, h);
  if (S.sel?.float) ctx.drawImage(fbuf, panX + S.sel.x * z, panY + S.sel.y * z, S.sel.float.width * z, S.sel.float.height * z);

  const x0 = Math.max(0, Math.floor(-panX / z)), x1 = Math.min(img.width, Math.ceil((cw - panX) / z));
  const y0 = Math.max(0, Math.floor(-panY / z)), y1 = Math.min(img.height, Math.ceil((ch - panY) / z));
  const lines = (step, style) => {
    ctx.beginPath();
    for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) { ctx.moveTo(panX + x * z + 0.5, panY + y0 * z); ctx.lineTo(panX + x * z + 0.5, panY + y1 * z); }
    for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) { ctx.moveTo(panX + x0 * z, panY + y * z + 0.5); ctx.lineTo(panX + x1 * z, panY + y * z + 0.5); }
    ctx.strokeStyle = style;
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  if (opt("grid").checked && z >= 6) lines(1, "rgb(0 0 0 / .12)");
  if (S.grid && opt("frames").checked) {
    ctx.beginPath();
    for (let x = 0; x <= img.width; x += S.grid.w) { ctx.moveTo(panX + x * z + 0.5, panY); ctx.lineTo(panX + x * z + 0.5, panY + h); }
    for (let y = 0; y <= img.height; y += S.grid.h) { ctx.moveTo(panX, panY + y * z + 0.5); ctx.lineTo(panX + w, panY + y * z + 0.5); }
    ctx.strokeStyle = "rgb(220 0 140 / .7)";
    ctx.stroke();
  }
  ctx.strokeStyle = "#000";
  ctx.strokeRect(panX - 0.5, panY - 0.5, w + 1, h + 1);

  // La selecció, amb vora de formigues (blanc i negre)
  if (S.sel) {
    const r = [panX + S.sel.x * z + 0.5, panY + S.sel.y * z + 0.5, S.sel.w * z - 1, S.sel.h * z - 1];
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#fff"; ctx.strokeRect(...r);
    ctx.lineDashOffset = 4;
    ctx.strokeStyle = "#000"; ctx.strokeRect(...r);
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }
  // On pintarà el pinzell
  if (S.mouse && ["pencil", "eraser", "line", "rect", "ellipse"].includes(S.tool) && !S.space) {
    const s = Number(opt("size").value), o = Math.floor((s - 1) / 2);
    ctx.strokeStyle = "rgb(0 0 0 / .7)";
    ctx.strokeRect(panX + (S.mouse.x - o) * z + 0.5, panY + (S.mouse.y - o) * z + 0.5, s * z - 1, s * z - 1);
    ctx.strokeStyle = "rgb(255 255 255 / .7)";
    ctx.strokeRect(panX + (S.mouse.x - o) * z - 0.5, panY + (S.mouse.y - o) * z - 0.5, s * z + 1, s * z + 1);
  }
  $(".zoom-label", dialog).textContent = `${Math.round(z * 100)}%`;
}

function drawPreview() {
  const { img } = S, box = previewCanvas.parentElement;
  let s = Math.min(box.clientWidth / img.width, 160 / img.height);
  if (s >= 1) s = Math.floor(s);
  previewCanvas.width = Math.max(1, Math.round(img.width * s));
  previewCanvas.height = Math.max(1, Math.round(img.height * s));
  const pc = previewCanvas.getContext("2d");
  pc.imageSmoothingEnabled = s < 1;
  pc.drawImage(buf, 0, 0, previewCanvas.width, previewCanvas.height);
}

function fit() {
  if (!S || stage.clientWidth < 40 || stage.clientHeight < 40) return draw();
  S.userView = false;
  const { img } = S, cw = stage.clientWidth - 24, ch = stage.clientHeight - 24;
  let z = Math.min(cw / img.width, ch / img.height);
  z = z >= 1 ? Math.floor(z) : z;
  S.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
  S.panX = Math.round((stage.clientWidth - img.width * S.zoom) / 2);
  S.panY = Math.round((stage.clientHeight - img.height * S.zoom) / 2);
  draw();
}
// Zoom mantenint quiet el punt (sx, sy) de la pantalla
function zoomAt(factor, sx = stage.clientWidth / 2, sy = stage.clientHeight / 2) {
  S.userView = true;
  const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, S.zoom * factor));
  const nz = z >= 1 ? Math.round(z) : z;
  S.panX = sx - (sx - S.panX) * nz / S.zoom;
  S.panY = sy - (sy - S.panY) * nz / S.zoom;
  S.zoom = nz;
  draw();
}
// Mentre no s'hagi tocat la vista, en canviar la mida de la finestra el dibuix s'hi torna a ajustar
new ResizeObserver(() => S && (S.userView ? draw() : fit())).observe(stage);

/* ---------- Eines ---------- */

function renderTools() {
  const box = $(".paint-tools", dialog);
  box.replaceChildren(...TOOLS.map((t) => {
    const b = el(`<button type="button" class="paint-tool"></button>`);
    b.textContent = t.icon;
    b.title = `${t.label} (${t.key.toUpperCase()})`;
    b.setAttribute("aria-label", t.label);
    b.setAttribute("aria-pressed", String(S.tool === t.id));
    b.onclick = () => setTool(t.id);
    return b;
  }));
}
function setTool(id) {
  if (id !== "select") { commitFloat(); S.sel = null; }
  S.tool = id;
  renderTools();
  showOptions();
  draw();
}
function showOptions() {
  for (const n of $$("[data-opt]", dialog)) n.hidden = !OPTIONS_FOR[S.tool].includes(n.dataset.opt);
  for (const out of $$(".paint-options output", dialog)) out.textContent = out.previousElementSibling.value;
}
$(".paint-options", dialog).addEventListener("input", () => { showOptions(); draw(); });
for (const name of ["grid", "frames"]) opt(name).onchange = () => draw();

// Pinta un punt amb el pinzell (gruix, simetria i tramat)
function plot(img, x, y, color) {
  const s = Number(opt("size").value), o = Math.floor((s - 1) / 2);
  const mirror = OPTIONS_FOR[S.tool].includes("mirror") && opt("mirror").checked;
  const pattern = OPTIONS_FOR[S.tool].includes("pattern") && opt("pattern").checked;
  for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) {
    const px = x - o + dx, py = y - o + dy;
    if (pattern && (px + py) % 2) continue;
    ops.setPixel(img, px, py, color);
    if (mirror) ops.setPixel(img, img.width - 1 - px, py, color);
  }
}

const toImage = (e) => {
  const r = canvas.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  return { sx, sy, x: Math.floor((sx - S.panX) / S.zoom), y: Math.floor((sy - S.panY) / S.zoom) };
};
const inside = (p) => p.x >= 0 && p.y >= 0 && p.x < S.img.width && p.y < S.img.height;
const inSel = (p) => S.sel && p.x >= S.sel.x && p.y >= S.sel.y && p.x < S.sel.x + S.sel.w && p.y < S.sel.y + S.sel.h;

// Amb Maj: les línies van rectes o a 45° i els rectangles i les el·lipses són quadrats i cercles
function constrain(a, b, kind) {
  if (kind === "line") {
    const dx = b.x - a.x, dy = b.y - a.y, adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx > ady * 2) return { x: b.x, y: a.y };
    if (ady > adx * 2) return { x: a.x, y: b.y };
    const d = Math.max(adx, ady);
    return { x: a.x + Math.sign(dx) * d, y: a.y + Math.sign(dy) * d };
  }
  const d = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  return { x: a.x + Math.sign(b.x - a.x || 1) * d, y: a.y + Math.sign(b.y - a.y || 1) * d };
}

function pickColor(p, secondary) {
  if (!inside(p)) return;
  const c = ops.getPixel(S.img, p.x, p.y);
  if (c[3] === 0) return;
  S[secondary ? "bg" : "fg"] = [c[0], c[1], c[2], 255];
  renderColors();
}

// Treu el contingut de la selecció del dibuix perquè es pugui moure
function liftSelection() {
  const s = S.sel;
  if (!s || s.float) return;
  pushUndo();
  s.float = ops.crop(S.img, s.x, s.y, s.w, s.h);
  ops.fillRect(S.img, s.x, s.y, s.w, s.h, TRANSPARENT);
  sync();
}
// Deixa la selecció flotant enganxada al dibuix
function commitFloat() {
  if (!S?.sel?.float) return;
  ops.paste(S.img, S.sel.float, S.sel.x, S.sel.y);
  S.sel.float = null;
  sync();
}
function floatImage(image, x, y) {
  commitFloat();
  pushUndo();
  S.sel = { x, y, w: image.width, h: image.height, float: image };
  if (S.tool !== "select") { S.tool = "select"; renderTools(); showOptions(); }
  sync();
}

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  if (!S) return;
  stage.focus();
  canvas.setPointerCapture(e.pointerId);
  const p = toImage(e);
  const secondary = e.button === 2;
  if (e.button === 1 || S.space) {
    S.userView = true;
    S.action = { kind: "pan", sx: p.sx, sy: p.sy, panX: S.panX, panY: S.panY };
    return;
  }
  if (e.button > 2) return;
  const tool = e.altKey && S.tool !== "select" ? "picker" : S.tool;
  const color = tool === "eraser" ? TRANSPARENT : secondary ? S.bg : S.fg;
  if (tool === "picker") return pickColor(p, secondary);
  if (tool === "fill") {
    if (!inside(p)) return;
    pushUndo();
    if (!ops.floodFill(S.img, p.x, p.y, color, { tolerance: Number(opt("tolerance").value), contiguous: opt("contiguous").checked })) S.undo.pop();
    return sync();
  }
  if (tool === "pencil" || tool === "eraser") {
    pushUndo();
    plot(S.img, p.x, p.y, color);
    S.action = { kind: "stroke", last: p, color };
    return sync();
  }
  if (tool === "line" || tool === "rect" || tool === "ellipse") {
    pushUndo();
    S.action = { kind: "shape", tool, start: p, base: new Uint8ClampedArray(S.img.data), color };
    return shapeTo(p, e.shiftKey);
  }
  if (tool === "select") {
    if (inSel(p)) {
      liftSelection();
      S.action = { kind: "move", from: p, x: S.sel.x, y: S.sel.y };
    } else {
      commitFloat();
      S.sel = null;
      S.action = { kind: "select", start: p };
    }
    draw();
  }
});

function shapeTo(p, straight) {
  const a = S.action;
  S.img.data.set(a.base);
  const end = straight ? constrain(a.start, p, a.tool) : p;
  const pts = a.tool === "line"
    ? ops.linePoints(a.start.x, a.start.y, end.x, end.y)
    : ops.shapePoints(a.tool, a.start.x, a.start.y, end.x, end.y, opt("filled").checked);
  for (const [x, y] of pts) plot(S.img, x, y, a.color);
  sync();
}

canvas.addEventListener("pointermove", (e) => {
  if (!S) return;
  const p = toImage(e);
  S.mouse = inside(p) ? p : null;
  const a = S.action;
  status(p);
  if (!a) return draw();
  if (a.kind === "pan") { S.panX = a.panX + p.sx - a.sx; S.panY = a.panY + p.sy - a.sy; return draw(); }
  if (a.kind === "stroke") {
    for (const [x, y] of ops.linePoints(a.last.x, a.last.y, p.x, p.y)) plot(S.img, x, y, a.color);
    a.last = p;
    return sync();
  }
  if (a.kind === "shape") return shapeTo(p, e.shiftKey);
  if (a.kind === "move") { S.sel.x = a.x + p.x - a.from.x; S.sel.y = a.y + p.y - a.from.y; return draw(); }
  if (a.kind === "select") {
    const cx = (v, max) => Math.max(0, Math.min(max, v));
    const x0 = cx(Math.min(a.start.x, p.x), S.img.width - 1), y0 = cx(Math.min(a.start.y, p.y), S.img.height - 1);
    const x1 = cx(Math.max(a.start.x, p.x), S.img.width - 1), y1 = cx(Math.max(a.start.y, p.y), S.img.height - 1);
    S.sel = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, float: null };
    draw();
  }
});
const endAction = () => {
  if (!S?.action) return;
  // Un clic sense arrossegar amb la selecció no selecciona res
  if (S.action.kind === "select" && S.sel && S.sel.w === 1 && S.sel.h === 1) S.sel = null;
  S.action = null;
  draw();
};
canvas.addEventListener("pointerup", endAction);
canvas.addEventListener("pointercancel", endAction);
canvas.addEventListener("pointerleave", () => { if (S) { S.mouse = null; draw(); } });
canvas.addEventListener("wheel", (e) => {
  if (!S) return;
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    const r = canvas.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
  } else {
    S.userView = true;
    S.panX -= e.deltaX;
    S.panY -= e.deltaY;
    draw();
  }
}, { passive: false });

function status(p) {
  const st = $(".paint-status", dialog);
  if (!inside(p)) { st.textContent = ""; return; }
  const c = ops.getPixel(S.img, p.x, p.y);
  st.textContent = `${p.x}, ${p.y} · ${c[3] === 0 ? "transparent" : ops.rgbToHex(c[0], c[1], c[2])}` +
    (S.sel ? ` · selecció ${S.sel.w}×${S.sel.h}` : "");
}

/* ---------- Colors ---------- */

function renderColors() {
  for (const [cls, key] of [["fg", "fg"], ["bg", "bg"]]) {
    const well = $(`.color-well.${cls}`, dialog), hex = ops.rgbToHex(...S[key].slice(0, 3));
    well.style.background = hex;
    $("input", well).value = hex;
  }
  for (const s of $$(".paint-palette span", dialog)) {
    s.classList.toggle("is-fg", s.dataset.hex === ops.rgbToHex(...S.fg.slice(0, 3)));
    s.classList.toggle("is-bg", s.dataset.hex === ops.rgbToHex(...S.bg.slice(0, 3)));
  }
}
for (const cls of ["fg", "bg"]) {
  const well = $(`.color-well.${cls}`, dialog), input = $("input", well);
  well.onclick = () => input.click();
  input.oninput = () => { S[cls] = ops.hexToRgba(input.value); renderColors(); };
}
const swap = () => { [S.fg, S.bg] = [S.bg, S.fg]; renderColors(); };
$("[data-act=swap]", dialog).onclick = swap;

const paletteSelect = opt("palette");
paletteSelect.innerHTML = `<option value="image">Colors del dibuix</option>` + PALETTES.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
paletteSelect.value = "aventura";
paletteSelect.onchange = () => renderPalette();
function renderPalette() {
  const id = paletteSelect.value;
  const colors = id === "image"
    ? (ops.uniqueColors(S.img, 4096) ?? ops.choosePalette(S.img, 64)).slice(0, 128).map((c) => ops.rgbToHex(...c))
    : PALETTES.find((p) => p.id === id).colors;
  const box = $(".paint-palette", dialog);
  box.replaceChildren(...colors.map((hex) => {
    const s = el(`<span></span>`);
    s.dataset.hex = hex;
    s.title = hex;
    s.style.background = hex;
    return s;
  }));
  if (!colors.length) box.append(el(`<p class="muted">El dibuix encara no té colors.</p>`));
  renderColors();
}
$(".paint-palette", dialog).addEventListener("pointerdown", (e) => {
  const hex = e.target.dataset?.hex;
  if (!hex) return;
  S[e.button === 2 ? "bg" : "fg"] = ops.hexToRgba(hex);
  renderColors();
});
$(".paint-palette", dialog).addEventListener("contextmenu", (e) => e.preventDefault());

/* ---------- Ordres de la barra ---------- */

// Les transformacions s'apliquen a la selecció si n'hi ha, i si no, a tot el dibuix
function transform(fn) {
  if (S.sel) {
    liftSelection();
    S.sel.float = fn(S.sel.float);
    S.sel.w = S.sel.float.width;
    S.sel.h = S.sel.float.height;
    sync();
  } else replaceImage(fn(S.img));
}

const actions = {
  "flip-h": () => transform((im) => ops.flip(im, true)),
  "flip-v": () => transform((im) => ops.flip(im, false)),
  "rot-l": () => transform((im) => ops.rotate(im, false)),
  "rot-r": () => transform((im) => ops.rotate(im, true)),
  outline: () => transform((im) => ops.outline(im, S.fg)),
  "remove-bg": () => transform((im) => ops.removeBackground(im, Math.max(16, Number(opt("tolerance").value)))),
  undo, redo,
  "zoom-in": () => zoomAt(2),
  "zoom-out": () => zoomAt(0.5),
  fit,
  open: () => { fileInput.value = ""; fileInput.click(); },
  async new() {
    const f = await ask("Dibuix nou", `<p>Es comença de zero; el que hi ha ara es pot recuperar amb Desfés.</p>
      <div class="pair"><label>Amplada <input type="number" name="w" min="1" max="${MAX_SIDE}" value="${S.img.width}" required></label>
      <label>Alçada <input type="number" name="h" min="1" max="${MAX_SIDE}" value="${S.img.height}" required></label></div>
      <label>Fons <select name="fill"><option value="clear">Transparent</option><option value="bg">Color secundari</option><option value="fg">Color principal</option></select></label>`, "Crea'l");
    if (!f) return;
    const next = ops.blank(Number(f.w.value), Number(f.h.value));
    if (f.fill.value !== "clear") ops.floodFill(next, 0, 0, S[f.fill.value]);
    replaceImage(next);
    fit();
  },
  async size() {
    const f = await ask("Mida del dibuix", `
      <div class="pair"><label>Amplada <input type="number" name="w" min="1" max="${MAX_SIDE}" value="${S.img.width}" required></label>
      <label>Alçada <input type="number" name="h" min="1" max="${MAX_SIDE}" value="${S.img.height}" required></label></div>
      <label class="check"><input type="radio" name="mode" value="scale" checked> Escala el dibuix (amplia o redueix els píxels)</label>
      <label class="check"><input type="radio" name="mode" value="canvas"> Canvia només el llenç (afegeix o retalla vores)</label>
      <label>Si canvies el llenç, el dibuix queda
        <select name="anchor">
          <option value="0,0">a dalt a l'esquerra</option><option value="0.5,0">a dalt al mig</option><option value="1,0">a dalt a la dreta</option>
          <option value="0,0.5">a l'esquerra</option><option value="0.5,0.5" selected>al centre</option><option value="1,0.5">a la dreta</option>
          <option value="0,1">a baix a l'esquerra</option><option value="0.5,1">a baix al mig</option><option value="1,1">a baix a la dreta</option>
        </select></label>
      ${S.sizeNote ? `<p class="warn">${escapeHtml(S.sizeNote)}</p>` : ""}`, "Canvia-la");
    if (!f) return;
    const w = Math.min(MAX_SIDE, Number(f.w.value)), h = Math.min(MAX_SIDE, Number(f.h.value));
    const [ax, ay] = f.anchor.value.split(",").map(Number);
    replaceImage(f.mode.value === "scale" ? ops.resample(S.img, w, h, w >= S.img.width ? "nearest" : "dominant") : ops.resizeCanvas(S.img, w, h, ax, ay));
    fit();
  },
  async pixelate() {
    commitFloat();
    const target = S.sel ? ops.crop(S.img, S.sel.x, S.sel.y, S.sel.w, S.sel.h) : S.img;
    const r = await openPixelate(target, { mode: "filter" });
    if (!r) return;
    if (S.sel) {
      pushUndo();
      ops.fillRect(S.img, S.sel.x, S.sel.y, S.sel.w, S.sel.h, TRANSPARENT);
      ops.paste(S.img, r.image, S.sel.x, S.sel.y, true);
      S.sel = { ...S.sel, w: r.image.width, h: r.image.height };
      sync();
    } else {
      replaceImage(r.image);
      fit();
    }
    if (paletteSelect.value === "image") renderPalette();
  },
  done: () => close(true),
};
for (const b of $$("[data-act]", $(".paint-bar", dialog))) b.onclick = () => actions[b.dataset.act]();

// Importar: un fitxer, una imatge arrossegada o una d'enganxada. Primer es passa per «Pixela i filtres».
async function importFile(file) {
  if (!file?.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  try {
    const im = await loadImage(url);
    let w = im.naturalWidth, h = im.naturalHeight;
    const s = Math.min(1, MAX_IMPORT / Math.max(w, h));
    w = Math.max(1, Math.round(w * s));
    h = Math.max(1, Math.round(h * s));
    const source = imageToPixels(im, w, h);
    const r = await openPixelate(source, { mode: "import", canvasW: S.img.width, canvasH: S.img.height });
    if (!r) return;
    if (r.place === "paste") {
      floatImage(r.image, Math.round((S.img.width - r.image.width) / 2), Math.round((S.img.height - r.image.height) / 2));
    } else if (r.fit === "free") {
      replaceImage(r.image);
      fit();
    } else {
      // Al mateix llenç, centrada
      const next = ops.blank(S.img.width, S.img.height);
      ops.paste(next, r.image, Math.round((next.width - r.image.width) / 2), Math.round((next.height - r.image.height) / 2), true);
      replaceImage(next);
    }
    if (paletteSelect.value === "image") renderPalette();
  } finally {
    URL.revokeObjectURL(url);
  }
}
fileInput.onchange = () => importFile(fileInput.files[0]);
stage.addEventListener("dragover", (e) => { e.preventDefault(); stage.classList.add("over"); });
stage.addEventListener("dragleave", () => stage.classList.remove("over"));
stage.addEventListener("drop", (e) => { e.preventDefault(); stage.classList.remove("over"); importFile(e.dataTransfer.files[0]); });

/* ---------- Teclat i porta-retalls ---------- */

function copySelection(cut) {
  if (!S.sel) return;
  S.clipboard = S.sel.float ? ops.clone(S.sel.float) : ops.crop(S.img, S.sel.x, S.sel.y, S.sel.w, S.sel.h);
  if (cut) deleteSelection();
}
function deleteSelection() {
  if (!S.sel) return;
  if (S.sel.float) S.sel.float = null;
  else {
    pushUndo();
    ops.fillRect(S.img, S.sel.x, S.sel.y, S.sel.w, S.sel.h, TRANSPARENT);
  }
  S.sel = null;
  sync();
}

dialog.addEventListener("keydown", (e) => {
  if (!S || dialog.querySelector("dialog[open]") || document.querySelector(".pixelate-dialog[open]")) return;
  if (e.target.closest("input, select, textarea")) return;
  const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
  if (mod && k === "z") { e.preventDefault(); return e.shiftKey ? redo() : undo(); }
  if (mod && k === "y") { e.preventDefault(); return redo(); }
  if (mod && k === "a") {
    e.preventDefault();
    commitFloat();
    if (S.tool !== "select") setTool("select");
    S.sel = { x: 0, y: 0, w: S.img.width, h: S.img.height, float: null };
    return draw();
  }
  if (mod && k === "c") return copySelection(false);
  if (mod && k === "x") return copySelection(true);
  // El que s'ha copiat dins de l'editor s'enganxa aquí; si no n'hi ha, el navegador envia l'esdeveniment «paste»
  if (mod && k === "v" && S.clipboard) {
    e.preventDefault();
    return floatImage(ops.clone(S.clipboard), S.sel?.x ?? 0, S.sel?.y ?? 0);
  }
  if (mod) return;
  if (e.key === " ") { e.preventDefault(); S.space = true; stage.classList.add("panning"); return; }
  if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); return deleteSelection(); }
  if (e.key === "Enter" && S.sel) { commitFloat(); S.sel = null; return draw(); }
  if (S.sel?.float && e.key.startsWith("Arrow")) {
    e.preventDefault();
    const step = e.shiftKey ? 8 : 1;
    S.sel.x += e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
    S.sel.y += e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
    return draw();
  }
  const tool = TOOLS.find((t) => t.key === k);
  if (tool) return setTool(tool.id);
  if (k === "x") return swap();
  if (k === "[" || k === "]") {
    const s = opt("size");
    s.value = Math.max(1, Math.min(16, Number(s.value) + (k === "]" ? 1 : -1)));
    showOptions();
    return draw();
  }
  if (k === "+" || k === "=") return zoomAt(2);
  if (k === "-") return zoomAt(0.5);
  if (k === "0") return fit();
});
dialog.addEventListener("keyup", (e) => {
  if (e.key === " " && S) { S.space = false; stage.classList.remove("panning"); }
});
document.addEventListener("paste", async (e) => {
  if (!S || !dialog.open || dialog.querySelector("dialog[open]") || e.target.closest?.("input, textarea")) return;
  const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
  if (file) {
    e.preventDefault();
    // Una imatge copiada d'un altre programa: si és petita s'enganxa tal qual; si és gran, es pixela primer
    const url = URL.createObjectURL(file);
    try {
      const im = await loadImage(url);
      if (im.naturalWidth <= S.img.width && im.naturalHeight <= S.img.height) floatImage(imageToPixels(im, im.naturalWidth, im.naturalHeight), 0, 0);
      else await importFile(file);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
});
