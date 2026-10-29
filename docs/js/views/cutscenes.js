// Seqüències: llistes d'accions que passen sense que el jugador pugui fer res (escenes animades, presentacions…)
import { saveAdventure } from "../api.js";
import { $, el, toast, confirmDelete, plural } from "../ui.js";
import { actionsEditor, actionProblems } from "../logic-fields.js";

// On es fa servir una seqüència: a l'inici, en entrar a escenaris, o des de regles, opcions i altres seqüències
function usesOf(a, id) {
  const out = [];
  if (a.introCutsceneId === id) out.push("en començar el joc");
  for (const s of a.scenes) if (s.onEnter?.cutsceneId === id) out.push(`en entrar a «${s.name}»${s.onEnter.once ? " (la primera vegada)" : ""}`);
  const mentions = (actions) => actions.some((x) => x?.type === "cutscene" && x.cutsceneId === id);
  const rules = a.rules.filter((r) => mentions(r.actions)).length;
  if (rules) out.push(`des de ${plural(rules, "regla", "regles")}`);
  const options = a.dialogues.flatMap((d) => d.nodes.flatMap((n) => n.options)).filter((o) => mentions(o.actions)).length;
  if (options) out.push(`des de ${plural(options, "opció de diàleg", "opcions de diàleg")}`);
  const others = a.cutscenes.filter((c) => c.id !== id && mentions(c.actions)).length;
  if (others) out.push(others === 1 ? "des d'una altra seqüència" : `des de ${others} seqüències més`);
  return out;
}

export function renderCutscenes(view, a, { refresh }) {
  const base = `#/aventura/${a.id}`;
  document.title = `Seqüències · ${a.title} · Editor d'aventures`;
  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Seqüències</h2><p>Accions que passen soles, sense que el jugador pugui fer res: els personatges caminen i parlen, sona música… Es poden fer en començar el joc, en entrar a un escenari, o des de regles i diàlegs. Al joc, Esc salta la seqüència sencera (però els seus efectes es fan igualment).</p></div>
      <div class="actions"><button class="primary" id="new-cutscene">+ Nova seqüència</button></div>
    </div>
    <div id="cutscenes"></div>`;
  $(".back", view).textContent = `← ${a.title}`;

  $("#new-cutscene").onclick = async () => {
    const cutscene = { id: crypto.randomUUID(), name: `Seqüència ${a.cutscenes.length + 1}`, actions: [] };
    try {
      await saveAdventure(a, { cutscenes: [...a.cutscenes, cutscene] });
      location.hash = `${base}/sequencies/${cutscene.id}`;
    } catch (err) {
      toast(err.message);
    }
  };

  const box = $("#cutscenes");
  if (!a.cutscenes.length) {
    box.innerHTML = `<div class="empty-state"><strong>Encara no hi ha seqüències</strong>Per exemple, una presentació en començar el joc, o el que passa la primera vegada que s'entra a un lloc.</div>`;
    return;
  }
  const grid = el(`<div class="grid"></div>`);
  for (const c of a.cutscenes) {
    const card = el(`<article class="card"><div class="body"><h3><a></a></h3><p></p><span class="meta"></span>
      <footer><span></span><div class="actions"><button class="small danger">Esborra</button></div></footer></div></article>`);
    const link = $("h3 a", card);
    link.href = `${base}/sequencies/${c.id}`;
    link.textContent = c.name;
    const uses = usesOf(a, c.id);
    const p = $("p", card);
    p.textContent = uses.length ? `Es fa ${uses.join(", ")}.` : "Encara no la comença res.";
    p.classList.toggle("empty-text", !uses.length);
    $(".meta", card).textContent = plural(c.actions.length, "acció", "accions");
    $("button", card).onclick = async () => {
      if (!await confirmDelete("Esborrar la seqüència", `Segur que vols esborrar «${c.name}»?`)) return;
      try {
        await saveAdventure(a, { cutscenes: a.cutscenes.filter((x) => x.id !== c.id) });
        toast("Seqüència esborrada");
        refresh();
      } catch (err) {
        toast(err.message);
      }
    };
    grid.append(card);
  }
  box.replaceChildren(grid);
}

export function renderCutscene(view, a, original) {
  const base = `#/aventura/${a.id}`;
  let c = structuredClone(original);
  let dirty = false;
  document.title = `${c.name} · Editor d'aventures`;
  view.innerHTML = `
    <a class="back" href="${base}/sequencies">← Seqüències</a>
    <div class="page-head">
      <div><h2></h2><p class="meta"></p></div>
      <div class="actions"><span class="meta" id="cs-status"></span><button class="primary" id="save-cs">Desa</button></div>
    </div>
    <label class="cs-name">Nom <input maxlength="120" autocomplete="off"></label>
    <fieldset class="cs-actions"><legend>Què passa, en ordre</legend></fieldset>
    <p class="error"></p>`;
  const status = $("#cs-status");
  const markDirty = () => { dirty = true; status.textContent = "Canvis sense desar"; };
  const showName = () => { $(".page-head h2", view).textContent = c.name || "(sense nom)"; };
  showName();
  const uses = usesOf(a, c.id);
  $(".page-head p", view).textContent = uses.length ? `Es fa ${uses.join(", ")}.` : "Encara no la comença res: tria-la a la Presentació, a l'editor d'un escenari o en una acció.";
  const name = $(".cs-name input", view);
  name.value = c.name;
  name.oninput = () => { c.name = name.value; showName(); markDirty(); };
  $(".cs-actions", view).append(actionsEditor(a, c.actions, markDirty, { emptyText: "Encara no fa res." }));

  $("#save-cs").onclick = async () => {
    const missing = [...(c.name.trim() ? [] : ["posa-li un nom"]), ...actionProblems(c.actions)];
    if (missing.length) {
      $(".error", view).textContent = missing.join(". ");
      return;
    }
    try {
      const saved = await saveAdventure(a, { cutscenes: a.cutscenes.map((x) => (x.id === c.id ? c : x)) });
      a.cutscenes = saved.cutscenes;
      dirty = false;
      status.textContent = "Desat";
      $(".error", view).textContent = "";
      toast("Seqüència desada");
    } catch (err) {
      $(".error", view).textContent = err.message;
    }
  };

  function onBeforeUnload(e) {
    if (dirty) e.preventDefault();
  }
  window.addEventListener("beforeunload", onBeforeUnload);
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}
