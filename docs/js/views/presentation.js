// Presentació de l'aventura: la pantalla de títol, la seqüència d'inici, els crèdits del final i el cursor
import { saveAdventure, imageUrl } from "../api.js";
import { $, el, toast } from "../ui.js";
import { select } from "../logic-fields.js";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export function renderPresentation(view, a) {
  const base = `#/aventura/${a.id}`;
  document.title = `Presentació · ${a.title} · Editor d'aventures`;
  // «image» pot ser el nom del fitxer que ja hi ha o una imatge nova en data URL
  const draft = { titleScreen: structuredClone(a.titleScreen), introCutsceneId: a.introCutsceneId, credits: a.credits, cursor: a.cursor };
  let dirty = false;

  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Presentació</h2><p>Com comença i com s'acaba l'aventura. La pantalla de títol surt quan es juga des del principi; a més, és el clic que permet que el navegador faci sonar la música.</p></div>
      <div class="actions"><span class="meta" id="pres-status"></span><button class="primary" id="save-pres">Desa</button></div>
    </div>
    <div class="pres-layout">
      <section class="pres-form">
        <h3>Pantalla de títol</h3>
        <div class="field">Imatge <small>Opcional. Si no n'hi ha, el títol surt sobre negre.</small>
          <div class="sheet-pick title-pick" tabindex="0" role="button"></div>
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
        </div>
        <label>Subtítol <input name="subtitle" maxlength="200" placeholder="Per exemple: Una aventura de pirates"></label>
        <label>Música del títol <span class="slot-music"></span></label>
        <h3>Començament</h3>
        <label>Seqüència en començar <small>Es fa després de la pantalla de títol, a l'escenari inicial.</small><span class="slot-intro"></span></label>
        <h3>Final</h3>
        <label>Crèdits <small>Surten a la pantalla final, sota el text de l'acció «Acaba el joc».</small><textarea name="credits" maxlength="3000"></textarea></label>
        <h3>Cursor</h3>
        <label><span class="slot-cursor"></span></label>
      </section>
      <section>
        <h3>Com es veurà</h3>
        <div class="title-preview"><div class="tp-text"><strong></strong><span></span><button type="button" tabindex="-1">Comença</button></div></div>
      </section>
    </div>
    <p class="error"></p>`;
  $(".back", view).textContent = `← ${a.title}`;
  const status = $("#pres-status");
  const markDirty = () => { dirty = true; status.textContent = "Canvis sense desar"; renderPreview(); };

  const imageSrc = () => (draft.titleScreen.image?.startsWith("data:") ? draft.titleScreen.image : imageUrl(a.id, draft.titleScreen.image));
  const pick = $(".title-pick", view), file = $("input[type=file]", view);
  function renderPick() {
    pick.replaceChildren();
    if (draft.titleScreen.image) {
      const img = el(`<img alt="">`);
      img.src = imageSrc();
      const clear = el(`<button type="button" class="small danger">Treu la imatge</button>`);
      clear.onclick = (e) => { e.stopPropagation(); draft.titleScreen.image = null; renderPick(); markDirty(); };
      pick.append(img, clear);
    } else pick.textContent = "Clica o arrossega una imatge";
  }
  async function setImage(f) {
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) return toast("Ha de ser PNG, JPG, GIF o WebP");
    if (f.size > 10 * 1024 * 1024) return toast("Ha de fer menys de 10 MB");
    draft.titleScreen.image = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(f); });
    renderPick();
    markDirty();
  }
  pick.onclick = () => file.click();
  pick.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.click(); } };
  pick.ondragover = (e) => { e.preventDefault(); pick.classList.add("over"); };
  pick.ondragleave = () => pick.classList.remove("over");
  pick.ondrop = (e) => { e.preventDefault(); pick.classList.remove("over"); setImage(e.dataTransfer.files[0]); };
  file.onchange = () => setImage(file.files[0]);

  const subtitle = $("[name=subtitle]", view);
  subtitle.value = draft.titleScreen.subtitle;
  subtitle.oninput = () => { draft.titleScreen.subtitle = subtitle.value; markDirty(); };
  const credits = $("[name=credits]", view);
  credits.value = draft.credits;
  credits.oninput = () => { draft.credits = credits.value; markDirty(); };
  $(".slot-music", view).append(select(a.sounds.map((s) => [s.id, s.name]), draft.titleScreen.music ?? "", (v) => { draft.titleScreen.music = v || null; markDirty(); }, { empty: "— Sense música —" }));
  $(".slot-intro", view).append(select(a.cutscenes.map((c) => [c.id, c.name]), draft.introCutsceneId ?? "", (v) => { draft.introCutsceneId = v || null; markDirty(); }, { empty: "— Cap —" }));
  $(".slot-cursor", view).append(select([["cross", "Creu clàssica (de píxels)"], ["system", "El del sistema"]], draft.cursor, (v) => { draft.cursor = v; markDirty(); }));

  function renderPreview() {
    const p = $(".title-preview", view);
    p.style.backgroundImage = draft.titleScreen.image ? `url("${imageSrc()}")` : "";
    $("strong", p).textContent = a.title;
    $("span", p).textContent = draft.titleScreen.subtitle;
  }

  $("#save-pres").onclick = async () => {
    try {
      const saved = await saveAdventure(a, draft);
      Object.assign(a, { titleScreen: saved.titleScreen, introCutsceneId: saved.introCutsceneId, credits: saved.credits, cursor: saved.cursor });
      draft.titleScreen = structuredClone(saved.titleScreen);
      dirty = false;
      status.textContent = "Desat";
      $(".error", view).textContent = "";
      toast("Presentació desada");
      renderPick();
    } catch (err) {
      $(".error", view).textContent = err.message;
    }
  };

  function onBeforeUnload(e) {
    if (dirty) e.preventDefault();
  }
  window.addEventListener("beforeunload", onBeforeUnload);
  renderPick();
  renderPreview();
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}
