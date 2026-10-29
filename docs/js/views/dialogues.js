// Llista de diàlegs de l'aventura
import { saveAdventure } from "../api.js";
import { $, el, toast, confirmDelete, plural, colorSwatch } from "../ui.js";

export function renderDialogues(view, a, { refresh }) {
  const base = `#/aventura/${a.id}`;
  document.title = `Diàlegs · ${a.title} · Editor d'aventures`;
  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Diàlegs</h2><p>Converses amb opcions. Si un diàleg és d'un personatge, «Parla amb» aquell personatge el comença (si cap regla no diu una altra cosa). Des de les regles també es pot començar qualsevol diàleg.</p></div>
      <div class="actions"><button class="primary" id="new-dialogue">+ Nou diàleg</button></div>
    </div>
    <div id="dialogues"></div>`;
  $(".back", view).textContent = `← ${a.title}`;
  const npcs = a.characters.filter((c) => c.id !== a.playerId);

  $("#new-dialogue").onclick = async () => {
    // Un diàleg nou ja ve amb el primer node, i és del primer personatge que encara no en tingui cap
    const free = npcs.find((c) => !a.dialogues.some((d) => d.characterId === c.id));
    const node = { id: crypto.randomUUID(), position: null, lines: [], options: [] };
    const dialogue = {
      id: crypto.randomUUID(),
      name: free ? `Conversa amb ${free.name}` : `Diàleg ${a.dialogues.length + 1}`,
      characterId: free?.id ?? null,
      start: node.id,
      nodes: [node],
    };
    try {
      await saveAdventure(a, { dialogues: [...a.dialogues, dialogue] });
      location.hash = `${base}/dialegs/${dialogue.id}`;
    } catch (err) {
      toast(err.message);
    }
  };

  const box = $("#dialogues");
  if (!a.dialogues.length) {
    box.innerHTML = `<div class="empty-state"><strong>Encara no hi ha diàlegs</strong>Un diàleg té nodes amb el que diuen els personatges i les opcions que pot triar el jugador.</div>`;
    return;
  }
  const grid = el(`<div class="grid"></div>`);
  for (const d of a.dialogues) {
    const href = `${base}/dialegs/${d.id}`;
    const ch = a.characters.find((c) => c.id === d.characterId);
    // Si un personatge té més d'un diàleg, «Parla amb» només comença el primer
    const shadowed = ch && a.dialogues.find((x) => x.characterId === ch.id) !== d;
    const card = el(`<article class="card"><div class="body"><h3><a></a></h3><p></p><span class="meta"></span><p class="warn"></p>
      <footer><span></span><div class="actions"><button class="small danger" data-act="delete">Esborra</button></div></footer></div></article>`);
    const link = $("h3 a", card);
    link.href = href;
    link.textContent = d.name;
    const p = $("p", card);
    p.textContent = ch ? `Amb ${ch.name}` : "No és de cap personatge: es comença des d'una regla";
    if (ch) p.prepend(colorSwatch(ch.color));
    const options = d.nodes.reduce((n, node) => n + node.options.length, 0);
    $(".meta", card).textContent = `${plural(d.nodes.length, "node", "nodes")} · ${plural(options, "opció", "opcions")}`;
    $(".warn", card).textContent = shadowed ? `«Parla amb ${ch.name}» comença un altre diàleg seu.` : "";
    $("[data-act=delete]", card).onclick = async () => {
      if (!await confirmDelete("Esborrar el diàleg", `Segur que vols esborrar «${d.name}»? No es pot desfer.`)) return;
      try {
        await saveAdventure(a, { dialogues: a.dialogues.filter((x) => x.id !== d.id) });
        toast("Diàleg esborrat");
        refresh();
      } catch (err) {
        toast(err.message);
      }
    };
    grid.append(card);
  }
  box.replaceChildren(grid);
}
