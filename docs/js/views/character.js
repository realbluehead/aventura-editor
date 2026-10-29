// Editor d'un personatge: les dades, el full de sprites tallat en fotogrames i les animacions.
// Es tria una animació (per exemple «Camina de costat») i es van clicant els fotogrames del full en ordre.
import { request, imageUrl } from "../api.js";
import { $, el, toast, loadImage, blobToDataUrl } from "../ui.js";
import { openPaintEditor } from "../paint/editor.js";
import { ANIMATIONS, DIRECTIONS } from "../defaults.js";
import { sheetGrid, frameSource, animationKeyFor, drawCharacter } from "../player/characters.js";

const ANIM_LABELS = { idle: "Quiet", walk: "Camina", talk: "Parla" };
const DIR_LABELS = { side: "De costat", down: "De cara", up: "D'esquena" };
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const slotLabel = (key) => {
  const [anim, dir] = key.split("-");
  return `${ANIM_LABELS[anim]} · ${DIR_LABELS[dir].toLowerCase()}`;
};

export async function renderCharacter(view, a, ch) {
  const base = `#/aventura/${a.id}`;
  document.title = `${ch.name} · Editor d'aventures`;
  let draft = structuredClone(ch);   // «sheet» pot ser el nom d'un fitxer o una imatge nova en data URL
  const sheetSrc = () => (draft.sheet?.startsWith("data:") ? draft.sheet : imageUrl(a.id, draft.sheet));
  let sheet = draft.sheet ? await loadImage(sheetSrc()).catch(() => null) : null;
  let slot = "idle-side";
  let dirty = false;
  let frame = 0;

  view.innerHTML = `
    <a class="back" href="${base}/personatges">← Personatges</a>
    <div class="page-head">
      <div><h2></h2><p class="meta" id="char-role"></p></div>
      <div class="actions"><span class="meta" id="char-status"></span><button class="primary" id="save-char">Desa</button></div>
    </div>
    <div class="char-layout">
      <section class="char-form">
        <label>Nom <input name="name" maxlength="120" autocomplete="off"></label>
        <label>Descripció <small>El que diu el protagonista quan el mira.</small><textarea name="description" maxlength="5000"></textarea></label>
        <label>Color de les frases <span class="color-row"><input type="color" name="color"><span class="color-sample">Hola, sóc jo!</span></span></label>
        <div class="field">Full de sprites <small>Una imatge amb tots els fotogrames en una graella de caselles iguals. Pots arrossegar-la aquí.</small>
          <div class="sheet-pick" tabindex="0" role="button"></div>
          <button type="button" class="small" data-act="paint-sheet" style="align-self:flex-start" title="Dibuixa el full o retoca'l, amb la graella dels fotogrames">🎨 Pinta el full…</button>
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
        </div>
        <div class="pair">
          <label>Amplada del fotograma <input type="number" name="fw" min="1" max="2048"></label>
          <label>Alçada del fotograma <input type="number" name="fh" min="1" max="2048"></label>
        </div>
        <p class="meta" id="grid-info"></p>
      </section>
      <section class="char-anims">
        <h4>Animacions</h4>
        <div class="anim-table"></div>
        <div class="anim-slot">
          <canvas class="anim-preview" width="160" height="160"></canvas>
          <div class="anim-detail">
            <p class="slot-title"></p>
            <div class="frames"></div>
            <label>Fotogrames per segon <input type="number" name="fps" min="1" max="30"></label>
            <div class="actions"><button type="button" class="small" data-act="clear">Buida</button></div>
          </div>
        </div>
      </section>
    </div>
    <section class="sheet-section">
      <h4>Full de sprites</h4>
      <p class="muted" id="sheet-hint"></p>
      <div class="sheet-view"><canvas></canvas></div>
    </section>`;

  const status = $("#char-status");
  const markDirty = () => { dirty = true; status.textContent = "Canvis sense desar"; };
  const role = () => (a.playerId === ch.id ? "★ Protagonista" : "Personatge no jugador");
  $("#char-role").textContent = role();

  /* ---------- Dades ---------- */

  const nameInput = $("[name=name]", view), desc = $("[name=description]", view), color = $("[name=color]", view);
  const fw = $("[name=fw]", view), fh = $("[name=fh]", view);
  nameInput.value = draft.name;
  desc.value = draft.description;
  color.value = draft.color;
  fw.value = draft.frameWidth;
  fh.value = draft.frameHeight;
  const showName = () => {
    $(".page-head h2", view).textContent = draft.name || "(sense nom)";
    document.title = `${draft.name || "(sense nom)"} · Editor d'aventures`;
  };
  const showColor = () => { $(".color-sample", view).style.color = draft.color; };
  showName();
  showColor();
  nameInput.oninput = () => { draft.name = nameInput.value; showName(); markDirty(); };
  desc.oninput = () => { draft.description = desc.value; markDirty(); };
  color.oninput = () => { draft.color = color.value; showColor(); markDirty(); };
  const sizeChanged = () => {
    draft.frameWidth = Math.max(1, Math.round(Number(fw.value)) || 1);
    draft.frameHeight = Math.max(1, Math.round(Number(fh.value)) || 1);
    markDirty();
    renderSheet();
    renderSlot();
  };
  fw.oninput = sizeChanged;
  fh.oninput = sizeChanged;

  /* ---------- Full de sprites ---------- */

  const pick = $(".sheet-pick", view), fileInput = $("input[type=file]", view);
  function renderPick() {
    pick.replaceChildren();
    if (sheet) {
      const img = el(`<img alt="">`);
      img.src = sheetSrc();
      pick.append(img);
      const info = el(`<span></span>`);
      info.textContent = `${sheet.naturalWidth} × ${sheet.naturalHeight} px · clica per canviar-lo`;
      pick.append(info);
    } else {
      pick.textContent = "Sense full de sprites: es fa servir la figura provisional amb una camisa del color de les frases. Clica per triar-ne un.";
    }
  }
  async function setSheet(file) {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast("El full ha de ser una imatge PNG, JPG, GIF o WebP");
    if (file.size > 5 * 1024 * 1024) return toast("El full ha de fer menys de 5 MB");
    draft.sheet = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
    sheet = await loadImage(draft.sheet);
    markDirty();
    renderPick();
    renderSheet();
  }
  pick.onclick = () => fileInput.click();
  pick.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } };
  pick.ondragover = (e) => { e.preventDefault(); pick.classList.add("over"); };
  pick.ondragleave = () => pick.classList.remove("over");
  pick.ondrop = (e) => { e.preventDefault(); pick.classList.remove("over"); setSheet(e.dataTransfer.files[0]); };
  fileInput.onchange = () => setSheet(fileInput.files[0]);
  // Un full nou en blanc té lloc per a 4 fotogrames de llarg i 3 files (quiet, caminar i parlar)
  $("[data-act=paint-sheet]", view).onclick = async () => {
    try {
      const blob = await openPaintEditor({
        title: `Full de sprites · ${draft.name || "personatge"}`,
        src: draft.sheet ? sheetSrc() : null,
        width: draft.frameWidth * 4, height: draft.frameHeight * 3,
        grid: { w: draft.frameWidth, h: draft.frameHeight },
      });
      if (!blob) return;
      draft.sheet = await blobToDataUrl(blob);
      sheet = await loadImage(draft.sheet);
      markDirty();
      renderPick();
      renderSheet();
      renderSlot();
    } catch (err) {
      toast(err.message);
    }
  };

  // El full ampliat, amb la graella i el número de cada fotograma; clicar-ne un l'afegeix a l'animació triada
  const sheetCanvas = $(".sheet-view canvas", view);
  let zoom = 1;
  function renderSheet() {
    const hint = $("#sheet-hint");
    $(".sheet-section", view).hidden = !sheet;
    if (!sheet) return;
    const grid = sheetGrid(draft, sheet);
    $("#grid-info").textContent = `${grid.cols} columnes × ${grid.rows} files = ${grid.count} fotogrames`;
    hint.textContent = `Clica els fotogrames per afegir-los, en ordre, a «${slotLabel(slot)}».`;
    zoom = Math.max(1, Math.min(8, Math.floor(860 / sheet.naturalWidth)));
    sheetCanvas.width = sheet.naturalWidth * zoom;
    sheetCanvas.height = sheet.naturalHeight * zoom;
    const ctx = sheetCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, 0, 0, sheetCanvas.width, sheetCanvas.height);
    const used = new Set(draft.animations[slot]?.frames ?? []);
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.textBaseline = "top";
    for (let i = 0; i < grid.count; i++) {
      const { sx, sy, sw, sh } = frameSource(draft, sheet, i);
      const x = sx * zoom, y = sy * zoom, w = sw * zoom, h = sh * zoom;
      if (used.has(i)) {
        ctx.fillStyle = "rgba(245, 185, 66, .25)";
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeStyle = used.has(i) ? "#f5b942" : "rgba(255, 255, 255, .35)";
      ctx.lineWidth = used.has(i) ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = "rgba(13, 11, 22, .8)";
      ctx.fillRect(x + 1, y + 1, 18, 14);
      ctx.fillStyle = "#fff";
      ctx.fillText(String(i), x + 3, y + 2);
    }
  }
  sheetCanvas.onclick = (e) => {
    if (!sheet) return;
    const r = sheetCanvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * sheet.naturalWidth;
    const py = ((e.clientY - r.top) / r.height) * sheet.naturalHeight;
    const { cols, rows } = sheetGrid(draft, sheet);
    const col = Math.floor(px / draft.frameWidth), row = Math.floor(py / draft.frameHeight);
    if (col >= cols || row >= rows) return;
    draft.animations[slot] ??= { frames: [], fps: 8 };
    draft.animations[slot].frames.push(row * cols + col);
    markDirty();
    renderSlot();
    renderSheet();
  };

  /* ---------- Animacions ---------- */

  function renderTable() {
    const t = $(".anim-table", view);
    t.replaceChildren(el(`<span></span>`), ...DIRECTIONS.map((d) => {
      const h = el(`<span class="anim-head"></span>`);
      h.textContent = DIR_LABELS[d];
      return h;
    }));
    for (const anim of ANIMATIONS) {
      const head = el(`<span class="anim-head"></span>`);
      head.textContent = ANIM_LABELS[anim];
      t.append(head);
      for (const dir of DIRECTIONS) {
        const key = `${anim}-${dir}`;
        const n = draft.animations[key]?.frames.length ?? 0;
        const b = el(`<button type="button" class="small"></button>`);
        b.textContent = n ? `${n} fotog.` : "—";
        b.title = slotLabel(key);
        b.setAttribute("aria-pressed", String(slot === key));
        b.onclick = () => { slot = key; renderTable(); renderSlot(); renderSheet(); };
        t.append(b);
      }
    }
  }

  function renderSlot() {
    const [anim, dir] = slot.split("-");
    const own = draft.animations[slot];
    const used = animationKeyFor(draft, anim, dir);
    const title = $(".slot-title", view);
    title.textContent = slotLabel(slot);
    if (!own?.frames.length) {
      // Explica què es veurà al joc si aquesta animació es queda buida
      title.textContent += used ? ` · buida: farà servir «${slotLabel(used)}»` : " · buida";
    }
    const frames = $(".frames", view);
    frames.replaceChildren();
    (own?.frames ?? []).forEach((f, i) => {
      const chip = el(`<button type="button" class="frame-chip" title="Treu aquest fotograma"></button>`);
      chip.textContent = `${f} ×`;
      chip.onclick = () => {
        own.frames.splice(i, 1);
        markDirty();
        renderSlot();
        renderSheet();
        renderTable();
      };
      frames.append(chip);
    });
    if (!own?.frames.length) frames.append(el(`<span class="muted">${sheet ? "Clica fotogrames al full de sota." : "Primer tria un full de sprites."}</span>`));
    const fps = $("[name=fps]", view);
    fps.value = own?.fps ?? 8;
    fps.disabled = !own?.frames.length;
    fps.oninput = () => {
      if (!own) return;
      own.fps = Math.max(1, Math.min(30, Math.round(Number(fps.value)) || 1));
      markDirty();
    };
    $("[data-act=clear]", view).disabled = !own?.frames.length;
    renderTable();
  }
  $("[data-act=clear]", view).onclick = () => {
    delete draft.animations[slot];
    markDirty();
    renderSlot();
    renderSheet();
  };

  // Previsualització en bucle de l'animació triada (la que es veurà al joc, encara que sigui la de reserva)
  const preview = $(".anim-preview", view);
  const pctx = preview.getContext("2d");
  const t0 = performance.now();
  function loop(t) {
    const [anim, dir] = slot.split("-");
    pctx.clearRect(0, 0, preview.width, preview.height);
    pctx.imageSmoothingEnabled = false;
    const height = sheet ? Math.min(140, (140 * draft.frameHeight) / Math.max(draft.frameWidth, draft.frameHeight)) : 130;
    const time = (t - t0) / 1000;
    drawCharacter(pctx, draft, sheet, { x: 80, y: 152, height, dir, anim, time, step: anim === "walk" ? time * 9 : 0 });
    frame = requestAnimationFrame(loop);
  }
  frame = requestAnimationFrame(loop);

  /* ---------- Desar ---------- */

  $("#save-char").onclick = async () => {
    try {
      const saved = await request("PUT", `api/adventures/${a.id}/characters/${ch.id}`, draft);
      Object.assign(ch, saved);
      draft = structuredClone(saved);
      dirty = false;
      status.textContent = "Desat";
      toast("Personatge desat");
      renderSlot();
    } catch (err) {
      status.textContent = "";
      toast(err.message);
    }
  };

  function onBeforeUnload(e) {
    if (dirty) e.preventDefault();
  }
  window.addEventListener("beforeunload", onBeforeUnload);

  renderPick();
  renderSheet();
  renderSlot();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("beforeunload", onBeforeUnload);
  };
}
