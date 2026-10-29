// Biblioteca d'objectes de l'aventura
import { request, imageUrl } from "../api.js";
import { $, el, toast, confirmDelete, plural } from "../ui.js";
import { openObjectDialog } from "../object-dialog.js";
import { spriteFile } from "../player/objects.js";

export function renderObjects(view, a, { refresh }) {
  const base = `#/aventura/${a.id}`;
  document.title = `Objectes · ${a.title} · Editor d'aventures`;
  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Objectes</h2><p>Les coses amb què el jugador pot interactuar. Un cop creats, col·loca'ls als escenaris des de l'editor de cada escenari.</p></div>
      <div class="actions"><button class="primary" id="new-object">+ Nou objecte</button></div>
    </div>
    <div id="objects"></div>`;
  $(".back", view).textContent = `← ${a.title}`;
  $("#new-object").onclick = () => openObjectDialog(a, null, refresh);

  const box = $("#objects");
  if (!a.objects.length) {
    box.innerHTML = `<div class="empty-state"><strong>Encara no hi ha objectes</strong>Una clau, una porta, un barril… Cada objecte pot tenir diversos estats amb la seva imatge.</div>`;
    return;
  }

  const sceneOf = (id) => a.scenes.find((s) => s.objects.some((p) => p.objectId === id));
  const grid = el(`<div class="grid"></div>`);
  for (const o of [...a.objects].sort((x, y) => x.name.localeCompare(y.name, "ca"))) {
    const card = el(`<article class="card">
      <div class="sprite-cover"></div>
      <div class="body"><h3></h3><p></p>
        <span class="meta"></span>
        <footer><span></span><div class="actions">
          <button class="small" data-act="edit">Edita</button>
          <button class="small danger" data-act="delete">Esborra</button>
        </div></footer>
      </div></article>`);
    const file = spriteFile(o);
    if (file) {
      const img = el(`<img alt="">`);
      img.src = imageUrl(a.id, file);
      $(".sprite-cover", card).append(img);
    } else {
      $(".sprite-cover", card).textContent = "Sense imatge";
    }
    $("h3", card).textContent = o.name;
    const p = $("p", card);
    p.textContent = o.description || "Sense descripció";
    p.classList.toggle("empty-text", !o.description);
    const scene = sceneOf(o.id);
    $(".meta", card).textContent = [
      scene ? `A «${scene.name}»` : "Sense col·locar",
      plural(o.states.length, "estat", "estats"),
      ...(o.pickable ? ["Es pot agafar"] : []),
    ].join(" · ");
    $("[data-act=edit]", card).onclick = () => openObjectDialog(a, o, refresh);
    $("[data-act=delete]", card).onclick = async () => {
      const extra = scene ? ` També es traurà de «${scene.name}».` : "";
      if (!await confirmDelete("Esborrar objecte", `Segur que vols esborrar «${o.name}»?${extra} No es pot desfer.`)) return;
      try {
        await request("DELETE", `/api/adventures/${a.id}/objects/${o.id}`);
        toast("Objecte esborrat");
        refresh();
      } catch (err) {
        toast(err.message);
      }
    };
    grid.append(card);
  }
  box.replaceChildren(grid);
}
