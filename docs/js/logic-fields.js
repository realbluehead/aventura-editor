// Editors de condicions i d'accions, compartits per les regles i les opcions dels diàlegs.
// Cada editor modifica directament la llista que rep i crida onChange() després de cada canvi.
import { imageUrl } from "./api.js";
import { $, el } from "./ui.js";
import { catalog } from "./rules-text.js";

const CONDITION_KINDS = [
  ["has", "Té l'objecte"],
  ["hasnot", "No té l'objecte"],
  ["state", "Estat d'un objecte"],
  ["var", "Variable"],
  ["said", "Ha triat una opció d'un diàleg"],
];
const ACTION_KINDS = [
  ["say", "Diu una frase"],
  ["take", "Rep un objecte (a l'inventari)"],
  ["lose", "Perd un objecte"],
  ["setState", "Canvia l'estat d'un objecte"],
  ["setVar", "Canvia una variable"],
  ["goto", "Va a un escenari"],
  ["wait", "Espera"],
  ["dialogue", "Comença un diàleg"],
  ["walk", "Camina fins a un punt"],
  ["sound", "Fa sonar un so"],
  ["music", "Canvia la música"],
  ["cutscene", "Fa una seqüència"],
  ["end", "Acaba el joc"],
];

/* ---------- Petits constructors de camps ---------- */

export function select(options, value, onChange, { empty } = {}) {
  const s = el(`<select></select>`);
  if (empty) s.append(new Option(empty, ""));
  for (const o of options) {
    if (o.group) {
      const g = el(`<optgroup></optgroup>`);
      g.label = o.group;
      for (const [v, t] of o.items) g.append(new Option(t, v));
      s.append(g);
    } else s.append(new Option(o[1], o[0]));
  }
  s.value = value ?? "";
  s.onchange = () => onChange(s.value);
  return s;
}

export const objectOptions = (adventure) =>
  [...adventure.objects].sort((a, b) => a.name.localeCompare(b.name, "ca")).map((o) => [o.id, o.name]);

// Qui pot dir una frase: el protagonista o un altre personatge
export const speakerOptions = (adventure) =>
  [["", "El protagonista"], ...adventure.characters.filter((c) => c.id !== adventure.playerId).map((c) => [c.id, c.name])];

const short = (s, n = 40) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// Totes les opcions d'un diàleg, de tots els nodes, per triar-ne una
export const dialogueOptionChoices = (dialogue) =>
  (dialogue?.nodes ?? []).flatMap((n) => n.options.map((o) => [o.id, short(o.text || "(opció sense text)")]));

function valueField(type, value, onChange) {
  if (type === "bool") return select([["true", "cert"], ["false", "fals"]], String(value === true), (v) => onChange(v === "true"));
  const i = el(`<input>`);
  if (type === "number") { i.type = "number"; i.step = "any"; }
  i.value = value ?? "";
  i.oninput = () => onChange(type === "number" ? Number(i.value) || 0 : i.value);
  return i;
}

const defaultValue = (type) => (type === "bool" ? true : type === "number" ? 0 : "");

function row(fields, onDelete, move) {
  const r = el(`<div class="rule-row"><div class="rule-fields"></div><div class="actions"></div></div>`);
  $(".rule-fields", r).append(...fields.filter(Boolean));
  const tools = $(".actions", r);
  if (move) {
    for (const [d, label] of [[-1, "↑"], [1, "↓"]]) {
      const b = el(`<button type="button" class="small"></button>`);
      b.textContent = label;
      b.setAttribute("aria-label", d < 0 ? "Puja" : "Baixa");
      b.disabled = !move(d, true);
      b.onclick = () => move(d);
      tools.append(b);
    }
  }
  const del = el(`<button type="button" class="small danger">Treu</button>`);
  del.onclick = onDelete;
  tools.append(del);
  return r;
}

/* ---------- Condicions ---------- */

const conditionKind = (c) => (c.type === "has" && c.not ? "hasnot" : c.type);

export function conditionsEditor(adventure, list, onChange, { emptyText = "Sense condicions." } = {}) {
  const cat = catalog(adventure);
  const box = el(`<div class="logic-editor"><div class="logic-rows"></div><button type="button" class="small">+ Afegeix una condició</button></div>`);
  const rows = $(".logic-rows", box);
  const changed = () => onChange();
  const rerender = () => { render(); onChange(); };

  function fieldsFor(c) {
    if (c.type === "has") return [select(objectOptions(adventure), c.objectId, (v) => { c.objectId = v; changed(); }, { empty: "— Tria l'objecte —" })];
    if (c.type === "state") {
      const states = cat.object(c.objectId)?.states ?? [];
      return [
        select(objectOptions(adventure), c.objectId, (v) => { c.objectId = v; c.stateId = cat.object(v)?.states[0]?.id ?? ""; rerender(); }, { empty: "— Tria l'objecte —" }),
        select([["is", "està"], ["not", "no està"]], c.not ? "not" : "is", (v) => { c.not = v === "not"; changed(); }),
        select(states.map((s) => [s.id, s.name]), c.stateId, (v) => { c.stateId = v; changed(); }, { empty: "— Tria l'estat —" }),
      ];
    }
    if (c.type === "said") {
      const dialogue = adventure.dialogues.find((d) => d.id === c.dialogueId);
      return [
        select([["yes", "ja ha dit"], ["no", "encara no ha dit"]], c.not ? "no" : "yes", (v) => { c.not = v === "no"; changed(); }),
        select(adventure.dialogues.map((d) => [d.id, d.name]), c.dialogueId, (v) => { c.dialogueId = v; c.optionId = ""; rerender(); }, { empty: "— Tria el diàleg —" }),
        select(dialogueOptionChoices(dialogue), c.optionId, (v) => { c.optionId = v; changed(); }, { empty: "— Tria l'opció —" }),
      ];
    }
    if (!adventure.variables.length) return [el(`<span class="muted">Primer crea una variable a la pàgina de regles.</span>`)];
    const v = cat.variable(c.varId);
    const fields = [select(adventure.variables.map((x) => [x.id, x.name]), c.varId, (id) => {
      c.varId = id;
      c.op = "==";
      c.value = defaultValue(cat.variable(id)?.type);
      rerender();
    }, { empty: "— Tria la variable —" })];
    if (v) {
      const ops = v.type === "number"
        ? [["==", "és"], ["!=", "no és"], ["<", "<"], [">", ">"], ["<=", "≤"], [">=", "≥"]]
        : [["==", "és"], ["!=", "no és"]];
      fields.push(select(ops, c.op, (op) => { c.op = op; changed(); }), valueField(v.type, c.value, (val) => { c.value = val; changed(); }));
    }
    return fields;
  }

  function render() {
    rows.replaceChildren();
    if (!list.length) rows.append(Object.assign(el(`<p class="muted"></p>`), { textContent: emptyText }));
    list.forEach((c, i) => {
      const kind = select(CONDITION_KINDS, conditionKind(c), (k) => {
        list[i] = k === "var" ? { type: "var", varId: adventure.variables[0]?.id ?? "", op: "==", value: defaultValue(adventure.variables[0]?.type) }
          : k === "state" ? { type: "state", objectId: "", stateId: "", not: false }
          : k === "said" ? { type: "said", dialogueId: adventure.dialogues[0]?.id ?? "", optionId: "", not: false }
          : { type: "has", objectId: c.objectId ?? "", not: k === "hasnot" };
        rerender();
      });
      rows.append(row([kind, ...fieldsFor(c)], () => { list.splice(i, 1); rerender(); }));
    });
  }

  $("button", box).onclick = () => {
    list.push({ type: "has", objectId: "", not: false });
    rerender();
  };
  render();
  return box;
}

/* ---------- Accions ---------- */

// Un punt sobre la imatge d'un escenari: «key» és el camp de l'acció on es guarda (arrival per anar-hi, point per caminar-hi)
function arrivalPicker(adventure, a, rerender, key = "arrival", hint = "Fes clic on ha d'aparèixer (opcional)") {
  const scene = adventure.scenes.find((s) => s.id === a.sceneId);
  if (!scene?.background) return null;
  const pick = el(`<div class="field rule-arrival"><small></small><div class="arrival"><img alt=""></div></div>`);
  $("small", pick).textContent = hint;
  const box = $(".arrival", pick), img = $("img", box);
  img.src = imageUrl(adventure.id, scene.background);
  img.onload = () => {
    if (!a[key]) return;
    const m = el(`<span class="marker"></span>`);
    m.style.left = `${(a[key][0] / img.naturalWidth) * 100}%`;
    m.style.top = `${(a[key][1] / img.naturalHeight) * 100}%`;
    box.append(m);
  };
  box.onclick = (e) => {
    const r = img.getBoundingClientRect();
    a[key] = [Math.round(((e.clientX - r.left) / r.width) * img.naturalWidth), Math.round(((e.clientY - r.top) / r.height) * img.naturalHeight)];
    rerender();
  };
  return pick;
}

export function actionsEditor(adventure, list, onChange, { emptyText = "Sense accions." } = {}) {
  const cat = catalog(adventure);
  const box = el(`<div class="logic-editor"><div class="logic-rows"></div><button type="button" class="small">+ Afegeix una acció</button></div>`);
  const rows = $(".logic-rows", box);
  const changed = () => onChange();
  const rerender = () => { render(); onChange(); };

  function fieldsFor(a) {
    const fields = [];
    if (a.type === "say") fields.push(select(speakerOptions(adventure), a.by ?? "", (v) => { a.by = v || null; changed(); }));
    if (a.type === "say" || a.type === "end") {
      const t = el(`<input maxlength="500">`);
      t.placeholder = a.type === "say" ? "El que diu el personatge" : "Text de la pantalla final (opcional)";
      t.value = a.text;
      t.oninput = () => { a.text = t.value; changed(); };
      fields.push(t);
    } else if (a.type === "take" || a.type === "lose") {
      fields.push(select(objectOptions(adventure), a.objectId, (v) => { a.objectId = v; changed(); }, { empty: "— Tria l'objecte —" }));
    } else if (a.type === "setState") {
      const states = cat.object(a.objectId)?.states ?? [];
      fields.push(
        select(objectOptions(adventure), a.objectId, (v) => { a.objectId = v; a.stateId = cat.object(v)?.states[0]?.id ?? ""; rerender(); }, { empty: "— Tria l'objecte —" }),
        select(states.map((s) => [s.id, s.name]), a.stateId, (v) => { a.stateId = v; changed(); }, { empty: "— Tria l'estat —" }),
      );
    } else if (a.type === "setVar") {
      if (!adventure.variables.length) fields.push(el(`<span class="muted">Primer crea una variable a la pàgina de regles.</span>`));
      else {
        const v = cat.variable(a.varId);
        fields.push(select(adventure.variables.map((x) => [x.id, x.name]), a.varId, (id) => {
          a.varId = id;
          a.op = "set";
          a.value = defaultValue(cat.variable(id)?.type);
          rerender();
        }, { empty: "— Tria la variable —" }));
        if (v) {
          const ops = v.type === "number" ? [["set", "posa a"], ["add", "suma"]] : [["set", "posa a"]];
          fields.push(select(ops, a.op, (op) => { a.op = op; changed(); }), valueField(v.type, a.value, (val) => { a.value = val; changed(); }));
        }
      }
    } else if (a.type === "goto") {
      fields.push(
        select(adventure.scenes.map((s) => [s.id, s.name]), a.sceneId, (v) => { a.sceneId = v; a.arrival = null; rerender(); }, { empty: "— Tria l'escenari —" }),
        arrivalPicker(adventure, a, rerender),
      );
    } else if (a.type === "wait") {
      const n = el(`<input type="number" min="0" max="60" step="0.5" style="max-width:90px">`);
      n.value = a.seconds;
      n.oninput = () => { a.seconds = Number(n.value) || 0; changed(); };
      fields.push(n, el(`<span class="muted">segons</span>`));
    } else if (a.type === "dialogue") {
      fields.push(select(adventure.dialogues.map((d) => [d.id, d.name]), a.dialogueId, (v) => { a.dialogueId = v; changed(); }, { empty: "— Tria el diàleg —" }));
    } else if (a.type === "walk") {
      // Es camina a l'escenari on s'és; l'escenari d'aquí només serveix per triar el punt sobre la seva imatge
      fields.push(
        select(speakerOptions(adventure), a.by ?? "", (v) => { a.by = v || null; changed(); }),
        select(adventure.scenes.map((s) => [s.id, s.name]), a.sceneId, (v) => { a.sceneId = v; rerender(); }, { empty: "— Escenari per triar el punt —" }),
        arrivalPicker(adventure, a, rerender, "point", "Fes clic on ha d'anar"),
      );
      if (!a.point) fields.push(el(`<span class="warn">Encara no has triat el punt.</span>`));
    } else if (a.type === "sound" || a.type === "music") {
      const empty = a.type === "music" ? "— Atura la música —" : "— Tria el so —";
      fields.push(select(adventure.sounds.map((x) => [x.id, x.name]), a.soundId ?? "", (v) => { a.soundId = v || null; changed(); }, { empty }));
      const play = el(`<button type="button" class="small" title="Escolta'l">▶</button>`);
      play.onclick = () => {
        const sound = adventure.sounds.find((x) => x.id === a.soundId);
        if (sound) new Audio(imageUrl(adventure.id, sound.file)).play().catch(() => {});
      };
      fields.push(play);
    } else if (a.type === "cutscene") {
      fields.push(select(adventure.cutscenes.map((c) => [c.id, c.name]), a.cutsceneId, (v) => { a.cutsceneId = v; changed(); }, { empty: "— Tria la seqüència —" }));
    }
    return fields;
  }

  function render() {
    rows.replaceChildren();
    if (!list.length) rows.append(Object.assign(el(`<p class="muted"></p>`), { textContent: emptyText }));
    list.forEach((a, i) => {
      const kind = select(ACTION_KINDS, a.type, (k) => {
        list[i] = {
          say: { type: "say", text: "", by: null },
          take: { type: "take", objectId: "" },
          lose: { type: "lose", objectId: "" },
          setState: { type: "setState", objectId: "", stateId: "" },
          setVar: { type: "setVar", varId: adventure.variables[0]?.id ?? "", op: "set", value: defaultValue(adventure.variables[0]?.type) },
          goto: { type: "goto", sceneId: "", arrival: null },
          wait: { type: "wait", seconds: 1 },
          dialogue: { type: "dialogue", dialogueId: adventure.dialogues[0]?.id ?? "" },
          walk: { type: "walk", point: null, by: null, sceneId: adventure.scenes[0]?.id ?? null },
          sound: { type: "sound", soundId: adventure.sounds[0]?.id ?? "" },
          music: { type: "music", soundId: adventure.sounds[0]?.id ?? null },
          cutscene: { type: "cutscene", cutsceneId: adventure.cutscenes[0]?.id ?? "" },
          end: { type: "end", text: "" },
        }[k];
        rerender();
      });
      const move = (d, test) => {
        const j = i + d;
        if (j < 0 || j >= list.length) return false;
        if (!test) {
          list.splice(j, 0, list.splice(i, 1)[0]);
          rerender();
        }
        return true;
      };
      rows.append(row([kind, ...fieldsFor(a)], () => { list.splice(i, 1); rerender(); }, move));
    });
  }

  $("button", box).onclick = () => {
    list.push({ type: "say", text: "", by: null });
    rerender();
  };
  render();
  return box;
}

/* ---------- Comprovacions abans de desar ---------- */

export function conditionProblems(list, prefix = "Condició") {
  const out = [];
  list.forEach((c, i) => {
    const p = `${prefix} ${i + 1}`;
    if ((c.type === "has" || c.type === "state") && !c.objectId) out.push(`${p}: tria l'objecte`);
    if (c.type === "state" && !c.stateId) out.push(`${p}: tria l'estat`);
    if (c.type === "var" && !c.varId) out.push(`${p}: tria la variable`);
    if (c.type === "said" && (!c.dialogueId || !c.optionId)) out.push(`${p}: tria el diàleg i l'opció`);
  });
  return out;
}

export function actionProblems(list, prefix = "Acció") {
  const out = [];
  list.forEach((a, i) => {
    const p = `${prefix} ${i + 1}`;
    if (a.type === "say" && !a.text.trim()) out.push(`${p}: escriu què diu`);
    if (["take", "lose", "setState"].includes(a.type) && !a.objectId) out.push(`${p}: tria l'objecte`);
    if (a.type === "setState" && !a.stateId) out.push(`${p}: tria l'estat`);
    if (a.type === "setVar" && !a.varId) out.push(`${p}: tria la variable`);
    if (a.type === "goto" && !a.sceneId) out.push(`${p}: tria l'escenari`);
    if (a.type === "dialogue" && !a.dialogueId) out.push(`${p}: tria el diàleg`);
    if (a.type === "walk" && !a.point) out.push(`${p}: tria on ha d'anar`);
    if (a.type === "sound" && !a.soundId) out.push(`${p}: tria el so`);
    if (a.type === "cutscene" && !a.cutsceneId) out.push(`${p}: tria la seqüència`);
  });
  return out;
}
