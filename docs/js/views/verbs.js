// Verbs de l'aventura: el nom que surt a la graella del joc i la resposta quan no tenen cap efecte
import { saveAdventure } from "../api.js";
import { $, el, toast } from "../ui.js";
import { DEFAULT_VERBS, LOOK } from "../defaults.js";

export function renderVerbs(view, a, { refresh }) {
  const base = `#/aventura/${a.id}`;
  document.title = `Verbs · ${a.title} · Editor d'aventures`;
  let verbs = structuredClone(a.verbs);
  let dirty = false;

  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Verbs</h2><p>Les accions que el jugador pot triar. Al joc surten en una graella de 3 columnes, en aquest ordre. La resposta és el que diu el personatge quan el verb no fa res amb aquella cosa. La preposició permet unir dos objectes de l'inventari amb una altra cosa: «Fes servir la clau <em>amb</em> la porta». «Mira» és especial: amb un objecte o un punt calent, el personatge en diu la descripció.</p></div>
    </div>
    <div class="verb-list"></div>
    <div class="toolbar" style="margin-top:16px">
      <button id="add-verb">+ Afegeix un verb</button>
      <button id="reset-verbs">Torna als 9 clàssics</button>
      <span style="flex:1"></span>
      <span class="meta" id="verbs-status"></span>
      <button class="primary" id="save-verbs">Desa</button>
    </div>
    <p class="error" id="verbs-error"></p>`;
  $(".back", view).textContent = `← ${a.title}`;

  const markDirty = () => {
    dirty = true;
    $("#verbs-status").textContent = "Canvis sense desar";
  };

  function render() {
    const list = $(".verb-list", view);
    list.replaceChildren(el(`<div class="verb-row verb-head"><span>Nom</span><span>Resposta per defecte</span><span>Preposició</span><span></span></div>`));
    verbs.forEach((v, i) => {
      const row = el(`<div class="verb-row">
        <input maxlength="120" required aria-label="Nom del verb">
        <input maxlength="500" aria-label="Resposta per defecte">
        <input maxlength="20" aria-label="Preposició" placeholder="(cap)">
        <div class="actions">
          <button type="button" class="small" data-act="up" aria-label="Puja">↑</button>
          <button type="button" class="small" data-act="down" aria-label="Baixa">↓</button>
          <button type="button" class="small danger" data-act="delete">Treu</button>
        </div>
      </div>`);
      const [name, response, preposition] = row.querySelectorAll("input");
      name.value = v.name;
      response.value = v.response;
      preposition.value = v.preposition ?? "";
      preposition.oninput = () => { v.preposition = preposition.value; markDirty(); };
      name.oninput = () => { v.name = name.value; markDirty(); };
      response.oninput = () => { v.response = response.value; markDirty(); };
      const move = (d) => {
        verbs.splice(i + d, 0, verbs.splice(i, 1)[0]);
        markDirty();
        render();
      };
      $("[data-act=up]", row).disabled = i === 0;
      $("[data-act=down]", row).disabled = i === verbs.length - 1;
      $("[data-act=up]", row).onclick = () => move(-1);
      $("[data-act=down]", row).onclick = () => move(1);
      const del = $("[data-act=delete]", row);
      // «Mira» el necessita el reproductor per mostrar les descripcions
      del.disabled = v.id === LOOK;
      if (v.id === LOOK) del.title = "«Mira» no es pot treure: és el que mostra les descripcions";
      del.onclick = () => { verbs.splice(i, 1); markDirty(); render(); };
      list.append(row);
    });
    $("#add-verb").disabled = verbs.length >= 20;
  }

  $("#add-verb").onclick = () => {
    verbs.push({ id: crypto.randomUUID(), name: "", response: "", preposition: "" });
    markDirty();
    render();
    $(".verb-row:last-child input", view).focus();
  };
  $("#reset-verbs").onclick = () => {
    verbs = structuredClone(DEFAULT_VERBS);
    markDirty();
    render();
  };
  $("#save-verbs").onclick = async () => {
    try {
      const saved = await saveAdventure(a, { verbs });
      a.verbs = saved.verbs;
      verbs = structuredClone(saved.verbs);
      dirty = false;
      $("#verbs-status").textContent = "";
      $("#verbs-error").textContent = "";
      toast("Verbs desats");
      render();
    } catch (err) {
      $("#verbs-error").textContent = err.message;
    }
  };

  // Avisa si es surt amb canvis sense desar
  function onBeforeUnload(e) {
    if (dirty) e.preventDefault();
  }
  window.addEventListener("beforeunload", onBeforeUnload);

  render();
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}
