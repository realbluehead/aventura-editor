// Finestra per crear i editar una regla: «Quan [verb] [cosa] (amb [cosa]), si [condicions], llavors [accions]».
// Tot són desplegables i camps; a dalt hi ha la regla escrita en una frase que s'actualitza mentre s'edita.
import { $, el } from "./ui.js";
import { catalog, describeTrigger, describeCondition, describeAction } from "./rules-text.js";
import { select, objectOptions, conditionsEditor, actionsEditor, conditionProblems, actionProblems } from "./logic-fields.js";

const dialog = el(`
  <dialog id="rule-editor" class="wide-dialog rule-dialog">
    <form>
      <h3></h3>
      <p class="rule-preview"></p>
      <fieldset class="rule-when"><legend>Quan el jugador fa</legend><div class="rule-trigger"></div></fieldset>
      <fieldset><legend>Si es compleix tot això</legend><div class="rule-conditions"></div></fieldset>
      <fieldset><legend>Llavors</legend><div class="rule-actions"></div></fieldset>
      <p class="error"></p>
      <div class="row-end">
        <button type="button" data-act="cancel">Cancel·la</button>
        <button type="submit" class="primary">Desa</button>
      </div>
    </form>
  </dialog>`);
document.body.append(dialog);
const form = $("form", dialog);

let adventure = null, cat = null, draft = null, onSave = null;

// Objectes, personatges i punts calents en un sol desplegable; el valor és «object:id», «character:id» o «hotspot:id»
function thingSelect(ref, onChange, empty) {
  const groups = [{ group: "Objectes", items: objectOptions(adventure).map(([id, name]) => [`object:${id}`, name]) }];
  // El protagonista no hi surt: no es pot clicar
  const npcs = adventure.characters.filter((c) => c.id !== adventure.playerId);
  groups.push({ group: "Personatges", items: npcs.map((c) => [`character:${c.id}`, c.name]) });
  for (const s of adventure.scenes) {
    if (s.hotspots.length) groups.push({ group: `Punts calents · ${s.name}`, items: s.hotspots.map((h) => [`hotspot:${h.id}`, h.name]) });
  }
  const value = ref ? `${ref.kind}:${ref.id}` : "";
  return select(groups.filter((g) => g.items.length), value, (v) => {
    const [kind, id] = v.split(":");
    onChange(v ? { kind, id } : null);
  }, { empty });
}

function renderTrigger() {
  const box = $(".rule-trigger", dialog);
  const verb = cat.verb(draft.verb);
  const verbs = select(adventure.verbs.map((v) => [v.id, v.name]), draft.verb, (v) => {
    draft.verb = v;
    // Si el verb nou no uneix dos objectes, el segon sobra
    if (!cat.verb(v)?.preposition) draft.with = null;
    renderTrigger();
    preview();
  });
  const fields = [verbs, thingSelect(draft.target, (r) => { draft.target = r; preview(); }, "— Tria què —")];
  if (verb?.preposition) {
    const prep = el(`<span class="rule-prep"></span>`);
    prep.textContent = verb.preposition;
    fields.push(prep, thingSelect(draft.with, (r) => { draft.with = r; preview(); }, "— (res més) —"));
  }
  box.replaceChildren(...fields);
}

function preview() {
  const when = describeTrigger(cat, draft);
  const conds = draft.conditions.map((c) => describeCondition(cat, c));
  const acts = draft.actions.map((a) => describeAction(cat, a));
  $(".rule-preview", dialog).textContent =
    `Quan el jugador fa ${when}${conds.length ? `, si ${conds.join(" i ")}` : ""} → ${acts.length ? acts.join(", ") : "res"}.`;
}

/* ---------- Obrir i desar ---------- */

// onSaved(regla) ha de retornar una promesa; si falla, l'error es mostra a la finestra
export function openRuleDialog(adv, rule, saved) {
  adventure = adv;
  cat = catalog(adv);
  onSave = saved;
  draft = structuredClone(rule);
  $("h3", dialog).textContent = rule.id ? "Edita la regla" : "Nova regla";
  $(".error", form).textContent = "";
  renderTrigger();
  $(".rule-conditions", dialog).replaceChildren(conditionsEditor(adventure, draft.conditions, preview, { emptyText: "Sense condicions: la regla es fa sempre." }));
  $(".rule-actions", dialog).replaceChildren(actionsEditor(adventure, draft.actions, preview, { emptyText: "Sense accions, la regla no fa res (però evita la resposta per defecte del verb)." }));
  preview();
  dialog.showModal();
}

// Comprovacions abans d'enviar, perquè l'error digui exactament què falta
function problems() {
  const out = [];
  if (!cat.verb(draft.verb)) out.push("Tria un verb");
  if (!draft.target) out.push("Tria sobre què es fa");
  return [...out, ...conditionProblems(draft.conditions), ...actionProblems(draft.actions)];
}

$("[data-act=cancel]", dialog).onclick = () => dialog.close();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const missing = problems();
  if (missing.length) {
    $(".error", form).textContent = missing.join(". ");
    return;
  }
  const save = $("[type=submit]", form);
  save.disabled = true;
  try {
    await onSave(draft);
    dialog.close();
  } catch (err) {
    $(".error", form).textContent = err.message;
  } finally {
    save.disabled = false;
  }
});
