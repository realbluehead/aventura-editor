// Vista principal: totes les aventures
import { request, adventureUrl } from "../api.js";
import { $, el, toast, confirmDelete, fmt, plural, background } from "../ui.js";
import { openAdventureDialog } from "../dialogs.js";

let search = "";

export async function renderList(view) {
  let adventures = await request("GET", "api/adventures");
  view.innerHTML = `
    <div class="toolbar">
      <input id="search" type="search" placeholder="Cerca per títol o descripció…" aria-label="Cerca">
      <span class="count" id="count"></span>
      <button id="import-adventure" title="Un zip exportat des d'aquí (o una còpia de seguretat)">Importa…</button>
      <button class="primary" id="new-adventure">+ Nova aventura</button>
      <input type="file" accept=".zip,application/zip" id="import-file" hidden>
    </div>
    <p class="web-note" hidden>Versió web: les aventures es guarden en aquest navegador. Fes servir «Exporta el joc…» per tenir-ne una còpia (el zip es pot tornar a importar).</p>
    <div id="list"></div>`;
  $(".web-note").hidden = !window.EDITOR_WEB;
  const input = $("#search");
  input.value = search;
  input.oninput = () => { search = input.value; renderCards(); };
  $("#new-adventure").onclick = () => openAdventureDialog(null, (created) => { location.hash = `#/aventura/${created.id}`; });
  // Importar un zip exportat: sempre crea una aventura nova
  $("#import-adventure").onclick = () => $("#import-file").click();
  $("#import-file").onchange = async () => {
    const file = $("#import-file").files[0];
    if (!file) return;
    try {
      const imported = await request("POST", "api/import", file, "application/zip");
      toast(`«${imported.title}» importada`);
      location.hash = `#/aventura/${imported.id}`;
    } catch (err) {
      toast(err.message);
    }
  };

  async function remove(a) {
    const extra = a.scenes.length ? ` També s'esborraran ${plural(a.scenes.length, "escenari", "escenaris")}.` : "";
    if (!await confirmDelete("Esborrar aventura", `Segur que vols esborrar «${a.title}»?${extra} No es pot desfer.`)) return;
    try {
      await request("DELETE", adventureUrl(a.id));
      adventures = adventures.filter((x) => x.id !== a.id);
      renderCards();
      toast("Aventura esborrada");
    } catch (err) {
      toast(err.message);
    }
  }

  function renderCards() {
    const q = search.trim().toLowerCase();
    const items = adventures
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const list = $("#list");
    $("#count").textContent = q ? `${items.length} de ${adventures.length}` : plural(adventures.length, "aventura", "aventures");

    if (!adventures.length) {
      list.innerHTML = `<div class="empty-state"><strong>Encara no hi ha cap aventura</strong>Crea la primera amb el botó «Nova aventura».</div>`;
      return;
    }
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">Cap aventura coincideix amb la cerca.</div>`;
      return;
    }
    const grid = el(`<div class="grid"></div>`);
    for (const a of items) {
      const href = `#/aventura/${a.id}`;
      const card = el(`<article class="card">
        <a class="cover" tabindex="-1"></a>
        <div class="body"><h2><a></a></h2><p></p>
          <footer><span class="meta"></span><div class="actions">
            <button class="small" data-act="edit">Edita</button>
            <button class="small danger" data-act="delete">Esborra</button>
          </div></footer>
        </div></article>`);
      const cover = $(".cover", card);
      cover.href = href;
      // L'escenari inicial fa de portada; si no té fons, el primer que en tingui
      const start = a.scenes.find((s) => s.id === a.startSceneId && s.background) ?? a.scenes.find((s) => s.background);
      cover.append(background(a.id, start?.background, plural(a.scenes.length, "escenari", "escenaris")));
      const link = $("h2 a", card);
      link.href = href;
      link.textContent = a.title;
      const p = $("p", card);
      p.textContent = a.description || "Sense descripció";
      p.classList.toggle("empty-text", !a.description);
      $(".meta", card).textContent = `${plural(a.scenes.length, "escenari", "escenaris")} · ${fmt.format(new Date(a.updatedAt))}`;
      $("[data-act=edit]", card).onclick = () => openAdventureDialog(a, (saved) => {
        adventures = adventures.map((x) => (x.id === saved.id ? saved : x));
        renderCards();
      });
      $("[data-act=delete]", card).onclick = () => remove(a);
      grid.append(card);
    }
    list.replaceChildren(grid);
  }

  renderCards();
}
