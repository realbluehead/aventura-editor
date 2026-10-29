// Llista de personatges de l'aventura, i quin és el protagonista
import { request, imageUrl, saveAdventure } from "../api.js";
import { $, el, toast, confirmDelete, loadImage, colorSwatch } from "../ui.js";
import { drawCharacter } from "../player/characters.js";

// Miniatura: el primer fotograma de quiet (de cara si en té), o la figura provisional
export async function characterThumb(adventureId, ch, size = 112) {
  const c = el(`<canvas class="character-thumb"></canvas>`);
  c.width = size;
  c.height = size;
  const sheet = ch.sheet ? await loadImage(imageUrl(adventureId, ch.sheet)).catch(() => null) : null;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const height = sheet ? Math.min(size - 8, ((size - 8) * ch.frameHeight) / Math.max(ch.frameWidth, ch.frameHeight)) : size - 12;
  drawCharacter(ctx, ch, sheet, { x: size / 2, y: size - 4, height, dir: "down" });
  return c;
}

export function renderCharacters(view, a, { refresh }) {
  const base = `#/aventura/${a.id}`;
  document.title = `Personatges · ${a.title} · Editor d'aventures`;
  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Personatges</h2><p>El protagonista és el que controla el jugador. La resta es col·loquen als escenaris des de l'editor de cada escenari, com els objectes.</p></div>
      <div class="actions"><button class="primary" id="new-character">+ Nou personatge</button></div>
    </div>
    <div id="characters"></div>`;
  $(".back", view).textContent = `← ${a.title}`;

  $("#new-character").onclick = async () => {
    try {
      const n = a.characters.length + 1;
      const ch = await request("POST", `api/adventures/${a.id}/characters`, { name: `Personatge ${n}` });
      // El primer personatge que es crea fa de protagonista, que és el que gairebé sempre es vol
      if (!a.playerId) await saveAdventure(a, { playerId: ch.id });
      location.hash = `${base}/personatges/${ch.id}`;
    } catch (err) {
      toast(err.message);
    }
  };

  const box = $("#characters");
  if (!a.characters.length) {
    box.innerHTML = `<div class="empty-state"><strong>Encara no hi ha personatges</strong>Mentre no n'hi hagi, el protagonista és la figura provisional.</div>`;
    return;
  }
  const sceneOf = (id) => a.scenes.find((s) => s.characters.some((p) => p.characterId === id));
  const grid = el(`<div class="grid"></div>`);
  for (const ch of a.characters) {
    const href = `${base}/personatges/${ch.id}`;
    const card = el(`<article class="card">
      <a class="sprite-cover" tabindex="-1"></a>
      <div class="body"><h3><a></a></h3><p></p><span class="meta"></span>
        <footer><span></span><div class="actions">
          <button class="small" data-act="player">Fes-lo protagonista</button>
          <button class="small danger" data-act="delete">Esborra</button>
        </div></footer>
      </div></article>`);
    $(".sprite-cover", card).href = href;
    characterThumb(a.id, ch).then((c) => $(".sprite-cover", card).append(c));
    const link = $("h3 a", card);
    link.href = href;
    link.textContent = ch.name;
    link.before(colorSwatch(ch.color));
    const p = $("p", card);
    p.textContent = ch.description || "Sense descripció";
    p.classList.toggle("empty-text", !ch.description);
    const isPlayer = a.playerId === ch.id;
    const scene = sceneOf(ch.id);
    $(".meta", card).textContent = isPlayer ? "★ Protagonista" : scene ? `A «${scene.name}»` : "Sense col·locar";
    const makePlayer = $("[data-act=player]", card);
    makePlayer.hidden = isPlayer;
    makePlayer.onclick = async () => {
      try {
        await saveAdventure(a, { playerId: ch.id });
        toast(`${ch.name} és el protagonista`);
        refresh();
      } catch (err) {
        toast(err.message);
      }
    };
    $("[data-act=delete]", card).onclick = async () => {
      const extra = isPlayer ? " És el protagonista: tornarà a ser la figura provisional." : scene ? ` També es traurà de «${scene.name}».` : "";
      if (!await confirmDelete("Esborrar personatge", `Segur que vols esborrar «${ch.name}»?${extra} No es pot desfer.`)) return;
      try {
        await request("DELETE", `api/adventures/${a.id}/characters/${ch.id}`);
        toast("Personatge esborrat");
        refresh();
      } catch (err) {
        toast(err.message);
      }
    };
    grid.append(card);
  }
  box.replaceChildren(grid);
}
