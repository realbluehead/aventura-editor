// Finestra «Pixela i filtres»: converteix una imatge (una foto importada o el dibuix actual) en pixel art,
// amb vista prèvia en viu. Tot el càlcul és a image-ops.js (pixelate).
import { $, $$, el } from "../ui.js";
import * as ops from "./image-ops.js";
import { PALETTES, paletteById } from "./palettes.js";

const METHODS = [["average", "Mitjana (fotos)"], ["dominant", "Color dominant (dibuixos)"], ["nearest", "Píxel més proper"]];
const DITHERS = [["none", "Cap"], ["floyd", "Floyd–Steinberg"], ["atkinson", "Atkinson"], ["bayer2", "Ordenat 2×2"], ["bayer4", "Ordenat 4×4"], ["bayer8", "Ordenat 8×8"]];
const options = (list, value) => list.map(([v, t]) => `<option value="${v}"${v === value ? " selected" : ""}>${t}</option>`).join("");

// Estils ràpids: només canvien els controls; després es pot afinar
const PRESETS = {
  sprite: { method: "dominant", palette: "auto", colors: 16, dither: "none", brightness: 0, contrast: 10, saturation: 10, alpha: 128, outline: true },
  photo: { method: "average", palette: "auto", colors: 32, dither: "floyd", ditherAmount: 60, brightness: 0, contrast: 10, saturation: 15, alpha: 128, outline: false },
  soft: { method: "average", palette: "auto", colors: 64, dither: "none", brightness: 0, contrast: 0, saturation: 0, alpha: 128, outline: false },
  ega: { method: "average", palette: "ega", dither: "bayer4", ditherAmount: 80, brightness: 0, contrast: 15, saturation: 20, alpha: 128, outline: false },
  pico8: { method: "average", palette: "pico8", dither: "atkinson", ditherAmount: 70, brightness: 0, contrast: 10, saturation: 10, alpha: 128, outline: false },
  gameboy: { method: "average", palette: "gameboy", dither: "bayer4", ditherAmount: 100, brightness: 5, contrast: 20, saturation: 0, alpha: 128, outline: false },
};

const dialog = el(`
  <dialog class="pixelate-dialog">
    <form>
      <h3>Pixela i filtres</h3>
      <div class="px-layout">
        <div class="px-preview-col">
          <div class="px-preview"><canvas></canvas></div>
          <div class="px-preview-bar">
            <button type="button" class="small" data-act="original" title="Mantén-lo premut per veure l'original">Mantén premut: original</button>
            <span class="meta" data-out="info"></span>
          </div>
        </div>
        <div class="px-controls">
          <label>Estil ràpid
            <select name="preset">
              <option value="">— Tria'n un per començar —</option>
              <option value="sprite">Sprite net (vores i contorn)</option>
              <option value="photo">Fons a partir d'una foto</option>
              <option value="soft">Suau, molts colors</option>
              <option value="ega">Retro EGA, 16 colors</option>
              <option value="pico8">PICO-8</option>
              <option value="gameboy">Game Boy</option>
            </select>
          </label>
          <fieldset><legend>Mida</legend>
            <div class="px-import-only">
              <label>Com encaixa al llenç
                <select name="fit">
                  <option value="cover">Omple el llenç (en retalla les vores)</option>
                  <option value="contain">Sencera dins el llenç</option>
                  <option value="free">Mida lliure (el llenç s'hi adapta)</option>
                </select>
              </label>
            </div>
            <div class="pair">
              <label>Amplada <input type="number" name="width" min="1" max="2048"></label>
              <label>Alçada <input type="number" name="height" min="1" max="2048"></label>
            </div>
            <label class="check"><input type="checkbox" name="ratio" checked> Mantén la proporció</label>
            <div class="px-blocks">Blocs de
              <button type="button" class="small" data-div="1">1</button><button type="button" class="small" data-div="2">2</button><button type="button" class="small" data-div="3">3</button><button type="button" class="small" data-div="4">4</button><button type="button" class="small" data-div="6">6</button><button type="button" class="small" data-div="8">8</button> px
            </div>
            <label class="check px-filter-only"><input type="checkbox" name="keep"> Torna a la mida original (els píxels queden com a blocs)</label>
            <label>Com es redueix <select name="method">${options(METHODS, "average")}</select></label>
          </fieldset>
          <fieldset><legend>Color</legend>
            <label>Brillantor <span class="range"><input type="range" name="brightness" min="-100" max="100" value="0"><output></output></span></label>
            <label>Contrast <span class="range"><input type="range" name="contrast" min="-100" max="100" value="0"><output></output></span></label>
            <label>Saturació <span class="range"><input type="range" name="saturation" min="-100" max="100" value="0"><output></output></span></label>
          </fieldset>
          <fieldset><legend>Paleta</legend>
            <label>Colors
              <select name="palette">
                <option value="keep">Els mateixos (no els redueix)</option>
                <option value="auto">Els millors per a la imatge…</option>
                ${PALETTES.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
              </select>
            </label>
            <label class="px-auto">Quants <span class="range"><input type="range" name="colors" min="2" max="64" value="16"><output></output></span></label>
            <label>Tramat <select name="dither">${options(DITHERS, "none")}</select></label>
            <label class="px-dither">Força del tramat <span class="range"><input type="range" name="ditherAmount" min="0" max="100" value="100"><output></output></span></label>
            <div class="px-swatches"></div>
          </fieldset>
          <fieldset><legend>Transparència i contorn</legend>
            <label>Opac a partir de <small>Els píxels més transparents que això desapareixen; a 0, tot queda opac.</small>
              <span class="range"><input type="range" name="alpha" min="0" max="255" value="128"><output></output></span></label>
            <label class="check"><input type="checkbox" name="removeBg"> Treu el fons (el color de les cantonades)</label>
            <label class="px-bg">Tolerància del fons <span class="range"><input type="range" name="bgTolerance" min="0" max="128" value="24"><output></output></span></label>
            <label class="check"><input type="checkbox" name="outline"> Contorn d'un píxel <input type="color" name="outlineColor" value="#1a1c2c"></label>
          </fieldset>
          <fieldset class="px-import-only"><legend>On va</legend>
            <label class="check"><input type="radio" name="place" value="replace" checked> Substitueix el dibuix</label>
            <label class="check"><input type="radio" name="place" value="paste"> Enganxa-la a sobre, per moure-la on vulguis</label>
          </fieldset>
        </div>
      </div>
      <div class="row-end">
        <button type="button" data-act="cancel">Cancel·la</button>
        <button type="submit" class="primary">Aplica</button>
      </div>
    </form>
  </dialog>`);
document.body.append(dialog);
const form = $("form", dialog);
const canvas = $(".px-preview canvas", dialog);

let state = null;   // { source, mode, canvasW, canvasH, result, resolve, showOriginal }

// La imatge d'entrada, ja retallada si s'ha triat «Omple el llenç»
function croppedSource() {
  const { source, mode, canvasW, canvasH } = state;
  if (mode !== "import" || form.fit.value !== "cover") return source;
  const target = canvasW / canvasH, have = source.width / source.height;
  if (Math.abs(target - have) < 0.01) return source;
  if (have > target) {
    const w = Math.round(source.height * target);
    return ops.crop(source, Math.round((source.width - w) / 2), 0, w, source.height);
  }
  const h = Math.round(source.width / target);
  return ops.crop(source, 0, Math.round((source.height - h) / 2), source.width, h);
}

// La mida que proposa cada manera d'encaixar
function suggestSize() {
  const { mode, canvasW, canvasH, source } = state;
  if (mode !== "import") return [source.width, source.height];
  const fit = form.fit.value;
  if (fit === "cover") return [canvasW, canvasH];
  const s = Math.min(canvasW / source.width, canvasH / source.height);
  if (fit === "contain") return [Math.max(1, Math.round(source.width * s)), Math.max(1, Math.round(source.height * s))];
  return [Math.min(2048, Math.max(1, Math.round(source.width * Math.min(1, s * 2)))), Math.min(2048, Math.max(1, Math.round(source.height * Math.min(1, s * 2))))];
}

function setSize([w, h]) {
  form.width.value = w;
  form.height.value = h;
}

function settings() {
  const pal = form.palette.value;
  return {
    width: Number(form.width.value) || 1,
    height: Number(form.height.value) || 1,
    method: form.method.value,
    keepSize: state.mode !== "import" && form.keep.checked,
    brightness: Number(form.brightness.value),
    contrast: Number(form.contrast.value),
    saturation: Number(form.saturation.value),
    palette: paletteById(pal)?.colors.map(ops.hexToRgba) ?? null,
    colors: pal === "auto" ? Number(form.colors.value) : 0,
    dither: form.dither.value,
    ditherAmount: Number(form.ditherAmount.value) / 100,
    alphaThreshold: Number(form.alpha.value),
    removeBg: form.removeBg.checked,
    bgTolerance: Number(form.bgTolerance.value),
    outlineColor: form.outline.checked ? ops.hexToRgba(form.outlineColor.value) : null,
  };
}

function showControls() {
  for (const out of $$("output", form)) out.textContent = out.previousElementSibling.value + (out.previousElementSibling.name === "ditherAmount" ? "%" : "");
  $(".px-auto", form).hidden = form.palette.value !== "auto";
  $(".px-dither", form).hidden = form.dither.value === "none";
  form.dither.disabled = form.palette.value === "keep";
  $(".px-bg", form).hidden = !form.removeBg.checked;
  for (const n of $$(".px-import-only", form)) n.hidden = state.mode !== "import";
  for (const n of $$(".px-filter-only", form)) n.hidden = state.mode === "import";
}

let timer = 0;
function schedule() {
  showControls();
  clearTimeout(timer);
  timer = setTimeout(compute, 60);
}

function compute() {
  const opts = settings();
  if (form.palette.value === "keep") opts.dither = "none";
  const { image, palette } = ops.pixelate(croppedSource(), opts);
  state.result = image;
  const swatches = $(".px-swatches", form);
  swatches.replaceChildren(...(palette ?? []).slice(0, 64).map((c) => {
    const s = el(`<span></span>`);
    s.style.background = ops.rgbToHex(...c.slice(0, 3));
    return s;
  }));
  const colors = ops.uniqueColors(image, 4096);
  $("[data-out=info]", dialog).textContent = `${image.width} × ${image.height} px · ${colors ? colors.length : "més de 4096"} colors`;
  draw();
}

function draw() {
  const img = state.showOriginal ? state.source : state.result;
  if (!img) return;
  const box = canvas.parentElement;
  const bw = box.clientWidth, bh = box.clientHeight;
  // Per veure els píxels nets: escala entera si hi cap, i sense suavitzar
  let s = Math.min(bw / img.width, bh / img.height);
  if (s >= 1) s = Math.floor(s);
  canvas.width = Math.max(1, Math.round(img.width * s));
  canvas.height = Math.max(1, Math.round(img.height * s));
  const tmp = document.createElement("canvas");
  tmp.width = img.width;
  tmp.height = img.height;
  tmp.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = s < 1;
  ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
}

// Obre la finestra. «mode» és "import" (una imatge nova que anirà al llenç) o "filter" (el dibuix actual).
// Torna { image, place } o null si es cancel·la.
export function openPixelate(source, { mode = "filter", canvasW = source.width, canvasH = source.height } = {}) {
  state = { source, mode, canvasW, canvasH, result: null, showOriginal: false };
  form.reset();
  form.fit.value = canvasW <= 128 && canvasH <= 128 ? "contain" : "cover";
  form.keep.checked = mode !== "import";
  setSize(suggestSize());
  if (mode === "import") applyPreset(canvasW <= 128 && canvasH <= 128 ? "sprite" : "photo");
  showControls();
  dialog.showModal();
  requestAnimationFrame(compute);
  return new Promise((resolve) => { state.resolve = resolve; });
}

function applyPreset(id) {
  const p = PRESETS[id];
  if (!p) return;
  form.method.value = p.method;
  form.palette.value = p.palette;
  if (p.colors) form.colors.value = p.colors;
  form.dither.value = p.dither;
  form.ditherAmount.value = p.ditherAmount ?? 100;
  form.brightness.value = p.brightness;
  form.contrast.value = p.contrast;
  form.saturation.value = p.saturation;
  form.alpha.value = p.alpha;
  form.outline.checked = p.outline;
  form.preset.value = id;
}

function finish(value) {
  clearTimeout(timer);
  const resolve = state.resolve;
  dialog.close();
  state = null;
  resolve(value);
}

form.addEventListener("input", (e) => {
  if (!state) return;
  const t = e.target;
  if (t.name === "preset") { applyPreset(t.value); return schedule(); }
  if (t.name === "fit") setSize(suggestSize());
  // Amb la proporció lligada, canviar un costat canvia l'altre
  if ((t.name === "width" || t.name === "height") && form.ratio.checked) {
    const src = croppedSource(), w = Number(form.width.value), h = Number(form.height.value);
    if (t.name === "width" && w > 0) form.height.value = Math.max(1, Math.round(w * src.height / src.width));
    if (t.name === "height" && h > 0) form.width.value = Math.max(1, Math.round(h * src.width / src.height));
  }
  if (t.name !== "width" && t.name !== "height" && t.name !== "fit" && t.type !== "radio") form.preset.value = "";
  schedule();
});
for (const b of $$("[data-div]", dialog)) {
  b.onclick = () => {
    const n = Number(b.dataset.div);
    const [w, h] = state.mode === "import" ? suggestSize() : [state.source.width, state.source.height];
    setSize([Math.max(1, Math.round(w / n)), Math.max(1, Math.round(h / n))]);
    if (state.mode !== "import") form.keep.checked = n > 1;
    schedule();
  };
}
const original = $("[data-act=original]", dialog);
const showOriginal = (v) => { if (state) { state.showOriginal = v; draw(); } };
original.onpointerdown = () => showOriginal(true);
original.onpointerup = original.onpointerleave = () => showOriginal(false);
$("[data-act=cancel]", dialog).onclick = () => finish(null);
dialog.addEventListener("cancel", (e) => { e.preventDefault(); finish(null); });
form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearTimeout(timer);
  compute();
  finish({ image: state.result, place: state.mode === "import" ? form.place.value : "replace", fit: form.fit.value });
});
