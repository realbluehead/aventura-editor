// Navegació de l'editor. Rutes:
//   #/                                llista d'aventures
//   #/aventura/<id>                   una aventura i els seus escenaris
//   #/aventura/<id>/mapa              mapa d'escenaris i sortides
//   #/aventura/<id>/escenari/<id>     editor visual d'un escenari
//   #/aventura/<id>/juga[/<id>]       reproductor (des de l'escenari inicial o des d'un escenari concret)
//   #/aventura/<id>/objectes          biblioteca d'objectes
//   #/aventura/<id>/verbs             verbs del joc
//   #/aventura/<id>/regles[/<id>]     variables i regles (totes, o només les d'un objecte o punt calent)
//   #/aventura/<id>/personatges[/<id>] personatges, i l'editor d'un personatge
//   #/aventura/<id>/dialegs[/<id>]    diàlegs, i l'editor (en graf) d'un diàleg
//   #/aventura/<id>/puzles            si es pot acabar, mapa de puzles i problemes
//   #/aventura/<id>/sons              sons i músiques
//   #/aventura/<id>/sequencies[/<id>] seqüències, i l'editor d'una seqüència
//   #/aventura/<id>/presentacio       pantalla de títol, inici, crèdits i cursor
import { request, adventureUrl } from "./api.js";
import { $ } from "./ui.js";
import { renderList } from "./views/list.js";
import { renderAdventure } from "./views/adventure.js";
import { renderMap } from "./views/map.js";
import { renderSceneEditor } from "./views/scene-editor.js";
import { renderPlay } from "./views/play.js";
import { renderObjects } from "./views/objects.js";
import { renderVerbs } from "./views/verbs.js";
import { renderRules } from "./views/rules.js";
import { renderCharacters } from "./views/characters.js";
import { renderCharacter } from "./views/character.js";
import { renderDialogues } from "./views/dialogues.js";
import { renderDialogue } from "./views/dialogue.js";
import { renderPuzzles } from "./views/puzzles.js";
import { renderSounds } from "./views/sounds.js";
import { renderCutscenes, renderCutscene } from "./views/cutscenes.js";
import { renderPresentation } from "./views/presentation.js";
import { renderSidebar, hideSidebar } from "./sidebar.js";

let cleanup = null;   // la vista activa pot deixar una funció per tancar-se (l'editor desa el que tingui pendent)
let routeId = 0;

async function route() {
  const id = ++routeId;
  if (cleanup) {
    const done = cleanup;
    cleanup = null;
    await done();
  }
  if (id !== routeId) return;

  const view = $("#view");
  const [section, adventureId, sub, subId] = location.hash.replace(/^#\/?/, "").split("/");
  const refresh = () => route();
  const layout = (cls = "", fullscreen = false) => {
    view.className = cls;
    document.body.classList.toggle("fullscreen", fullscreen);
  };

  try {
    if (section === "aventura" && adventureId) {
      const adventure = await request("GET", adventureUrl(adventureId));
      if (id !== routeId) return;
      renderSidebar(adventure, sub);
      if (sub === "mapa") {
        layout("map-page");
        renderMap(view, adventure, { refresh });
      } else if (sub === "objectes") {
        layout();
        renderObjects(view, adventure, { refresh });
      } else if (sub === "verbs") {
        layout();
        cleanup = renderVerbs(view, adventure, { refresh }) ?? null;
      } else if (sub === "sons") {
        layout();
        renderSounds(view, adventure, { refresh });
      } else if (sub === "sequencies" && subId) {
        const cutscene = adventure.cutscenes.find((c) => c.id === subId);
        if (!cutscene) throw new Error("Aquesta seqüència no existeix");
        layout();
        cleanup = renderCutscene(view, adventure, cutscene) ?? null;
      } else if (sub === "sequencies") {
        layout();
        renderCutscenes(view, adventure, { refresh });
      } else if (sub === "presentacio") {
        layout("map-page");
        cleanup = renderPresentation(view, adventure) ?? null;
      } else if (sub === "puzles") {
        layout("map-page");
        renderPuzzles(view, adventure);
      } else if (sub === "dialegs" && subId) {
        const dialogue = adventure.dialogues.find((x) => x.id === subId);
        if (!dialogue) throw new Error("Aquest diàleg no existeix");
        layout("wide", true);
        cleanup = renderDialogue(view, adventure, dialogue) ?? null;
      } else if (sub === "dialegs") {
        layout();
        renderDialogues(view, adventure, { refresh });
      } else if (sub === "personatges" && subId) {
        const ch = adventure.characters.find((c) => c.id === subId);
        if (!ch) throw new Error("Aquest personatge no existeix");
        layout("map-page");
        const close = await renderCharacter(view, adventure, ch);
        if (id !== routeId) close?.();
        else cleanup = close ?? null;
      } else if (sub === "personatges") {
        layout();
        renderCharacters(view, adventure, { refresh });
      } else if (sub === "regles") {
        layout();
        renderRules(view, adventure, { filter: subId ?? null });
      } else if (sub === "juga") {
        layout("wide", true);
        cleanup = renderPlay(view, adventure, { sceneId: adventure.scenes.some((s) => s.id === subId) ? subId : null }) ?? null;
      } else if (sub === "escenari" && subId) {
        const scene = adventure.scenes.find((s) => s.id === subId);
        if (!scene) throw new Error("Aquest escenari no existeix");
        layout("wide", true);
        const close = await renderSceneEditor(view, adventure, scene, { refresh });
        if (id !== routeId) close?.();
        else cleanup = close ?? null;
      } else {
        layout();
        renderAdventure(view, adventure, { refresh });
      }
      // Amb el menú lateral, els enllaços «← tornar a l'aventura» de cada pàgina sobren
      for (const back of view.querySelectorAll("a.back")) if (back.getAttribute("href") === `#/aventura/${adventureId}`) back.remove();
    } else {
      layout();
      hideSidebar();
      document.title = "Editor d'aventures";
      await renderList(view);
    }
  } catch (err) {
    if (id !== routeId) return;
    layout();
    hideSidebar();
    view.innerHTML = `<a class="back" href="#/">← Totes les aventures</a><div class="empty-state"></div>`;
    $(".empty-state", view).textContent = `No s'ha pogut carregar: ${err.message}`;
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
