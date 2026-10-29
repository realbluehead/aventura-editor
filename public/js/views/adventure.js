// Vista d'una aventura: les dades i la llista d'escenaris
import { request, adventureUrl, sceneUrl } from "../api.js";
import { $, el, toast, confirmDelete, fmt, plural, background, sceneSummary } from "../ui.js";
import { openAdventureDialog, openSceneDialog } from "../dialogs.js";

export function renderAdventure(view, a, { refresh }) {
  const base = `#/aventura/${a.id}`;
  view.innerHTML = `
    <div class="page-head">
      <div><h2></h2><p></p></div>
      <div class="actions">
        <button id="edit-adventure">Edita</button>
        <button class="danger" id="delete-adventure">Esborra</button>
      </div>
    </div>
    <div class="section-head">
      <h3>Escenaris</h3>
      <button class="primary" id="new-scene">+ Nou escenari</button>
    </div>
    <div id="scenes"></div>`;
  $(".page-head h2").textContent = a.title;
  const p = $(".page-head p");
  p.textContent = a.description || "Sense descripció";
  p.classList.toggle("empty-text", !a.description);
  document.title = `${a.title} · Editor d'aventures`;

  $("#edit-adventure").onclick = () => openAdventureDialog(a, refresh);
  $("#delete-adventure").onclick = async () => {
    const extra = a.scenes.length ? ` També s'esborraran ${plural(a.scenes.length, "escenari", "escenaris")}.` : "";
    if (!await confirmDelete("Esborrar aventura", `Segur que vols esborrar «${a.title}»?${extra} No es pot desfer.`)) return;
    try {
      await request("DELETE", adventureUrl(a.id));
      toast("Aventura esborrada");
      location.hash = "#/";
    } catch (err) {
      toast(err.message);
    }
  };
  // Un escenari nou s'obre directament a l'editor visual si ja té fons
  $("#new-scene").onclick = () => openSceneDialog(a, null, (s) => {
    if (s.background) location.hash = `${base}/escenari/${s.id}`;
    else refresh();
  });

  const box = $("#scenes");
  if (!a.scenes.length) {
    box.innerHTML = `<div class="empty-state"><strong>Encara no hi ha escenaris</strong>Cada escenari és un lloc de l'aventura amb la seva imatge de fons.</div>`;
    return;
  }
  const grid = el(`<div class="grid"></div>`);
  for (const s of a.scenes) {
    const href = `${base}/escenari/${s.id}`;
    const card = el(`<article class="card">
      <a class="cover" tabindex="-1"></a>
      <div class="body"><h3><a></a></h3><p></p>
        <span class="meta summary"></span>
        <footer><span class="meta date"></span><div class="actions">
          <button class="small" data-act="edit">Nom i fons</button>
          <button class="small danger" data-act="delete">Esborra</button>
        </div></footer>
      </div></article>`);
    const cover = $(".cover", card);
    cover.href = href;
    cover.append(background(a.id, s.background));
    const link = $("h3 a", card);
    link.href = href;
    link.textContent = s.name;
    const desc = $("p", card);
    desc.textContent = s.description || "Sense descripció";
    desc.classList.toggle("empty-text", !s.description);
    $(".summary", card).textContent = (s.id === (a.startSceneId ?? a.scenes[0].id) ? "▶ Inicial · " : "") + sceneSummary(s);
    $(".date", card).textContent = fmt.format(new Date(s.updatedAt));
    $("[data-act=edit]", card).onclick = () => openSceneDialog(a, s, refresh);
    $("[data-act=delete]", card).onclick = async () => {
      const incoming = a.scenes.flatMap((o) => o.hotspots).filter((h) => h.exit?.sceneId === s.id).length;
      const extra = incoming ? ` Hi ha ${plural(incoming, "sortida", "sortides")} que hi porten i es quedaran sense destinació.` : "";
      if (!await confirmDelete("Esborrar escenari", `Segur que vols esborrar «${s.name}»?${extra} No es pot desfer.`)) return;
      try {
        await request("DELETE", sceneUrl(a.id, s.id));
        toast("Escenari esborrat");
        refresh();
      } catch (err) {
        toast(err.message);
      }
    };
    grid.append(card);
  }
  box.replaceChildren(grid);
}
