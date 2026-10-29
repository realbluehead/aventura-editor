// Pàgina de la lògica de l'aventura: les variables i les regles («Quan… si… llavors…»)
import { saveAdventure } from "../api.js";
import { $, el, toast, confirmDelete, plural } from "../ui.js";
import { openRuleDialog } from "../rule-dialog.js";
import { catalog, describeTrigger, describeCondition, describeAction, ruleProblems, mentions } from "../rules-text.js";

const TYPE_LABELS = { bool: "Sí / no", number: "Número", text: "Text" };

export function renderRules(view, a, { filter }) {
  const base = `#/aventura/${a.id}`;
  document.title = `Regles · ${a.title} · Editor d'aventures`;
  let cat = catalog(a);
  let only = filter && cat.thing({ kind: "object", id: filter }) ? { kind: "object", id: filter }
    : filter && cat.thing({ kind: "hotspot", id: filter }) ? { kind: "hotspot", id: filter } : null;

  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Regles</h2><p>El que passa quan el jugador fa servir un verb amb una cosa. Si n'hi ha diverses que encaixen, es fa la primera de la llista que compleixi les condicions. Si no n'hi ha cap, el personatge diu la resposta per defecte del verb (i «Agafa» agafa els objectes que es poden agafar).</p></div>
    </div>
    <section class="logic-section">
      <div class="section-head"><h3>Variables</h3><button class="small" id="add-var">+ Afegeix una variable</button></div>
      <p class="meta">Per recordar coses de la partida: si ja has parlat amb algú, quantes monedes tens… Les regles les poden mirar i canviar.</p>
      <div class="var-list"></div>
      <p class="error" id="var-error"></p>
    </section>
    <section class="logic-section">
      <div class="section-head">
        <h3>Regles</h3>
        <div class="actions"><label class="filter">Mostra <select id="rule-filter"></select></label><button class="primary" id="add-rule">+ Nova regla</button></div>
      </div>
      <div class="rule-list"></div>
    </section>`;
  $(".back", view).textContent = `← ${a.title}`;

  /* ---------- Desar ---------- */

  async function save(changes) {
    const saved = await saveAdventure(a, changes);
    a.variables = saved.variables;
    a.rules = saved.rules;
    cat = catalog(a);
  }

  /* ---------- Variables ---------- */

  function renderVariables() {
    const list = $(".var-list", view);
    list.replaceChildren();
    if (!a.variables.length) {
      list.append(el(`<p class="muted">Encara no n'hi ha cap.</p>`));
      return;
    }
    list.append(el(`<div class="var-row verb-head"><span>Nom</span><span>Tipus</span><span>Valor inicial</span><span></span></div>`));
    a.variables.forEach((v, i) => {
      const r = el(`<div class="var-row">
        <input maxlength="120" aria-label="Nom de la variable">
        <select aria-label="Tipus"></select>
        <span class="initial"></span>
        <button type="button" class="small danger">Treu</button>
      </div>`);
      const name = $("input", r);
      name.value = v.name;
      name.onchange = () => { v.name = name.value; persistVariables(); };
      const type = $("select", r);
      for (const [k, t] of Object.entries(TYPE_LABELS)) type.append(new Option(t, k));
      type.value = v.type;
      type.onchange = () => {
        v.type = type.value;
        v.initial = v.type === "bool" ? false : v.type === "number" ? 0 : "";
        persistVariables();
      };
      const initial = $(".initial", r);
      if (v.type === "bool") {
        const s = el(`<select aria-label="Valor inicial"><option value="false">no</option><option value="true">sí</option></select>`);
        s.value = String(v.initial === true);
        s.onchange = () => { v.initial = s.value === "true"; persistVariables(); };
        initial.append(s);
      } else {
        const inp = el(`<input aria-label="Valor inicial">`);
        if (v.type === "number") inp.type = "number";
        inp.value = v.initial;
        inp.onchange = () => { v.initial = v.type === "number" ? Number(inp.value) || 0 : inp.value; persistVariables(); };
        initial.append(inp);
      }
      const uses = a.rules.filter((rule) => JSON.stringify(rule).includes(`"${v.id}"`)).length;
      $("button", r).onclick = async () => {
        const extra = uses ? ` Hi ha ${plural(uses, "regla", "regles")} que la fan servir i quedaran trencades.` : "";
        if (!await confirmDelete("Treure la variable", `Segur que vols treure «${v.name}»?${extra}`)) return;
        a.variables.splice(i, 1);
        persistVariables();
      };
      list.append(r);
    });
  }

  async function persistVariables() {
    try {
      await save({ variables: a.variables });
      $("#var-error").textContent = "";
    } catch (err) {
      $("#var-error").textContent = err.message;
    }
    renderVariables();
    renderList();
  }

  $("#add-var").onclick = () => {
    const names = new Set(a.variables.map((v) => v.name.toLowerCase()));
    let n = a.variables.length + 1;
    while (names.has(`variable ${n}`)) n++;
    a.variables.push({ id: crypto.randomUUID(), name: `variable ${n}`, type: "bool", initial: false });
    persistVariables().then(() => $(".var-row:last-child input", view)?.select());
  };

  /* ---------- Regles ---------- */

  function renderFilter() {
    const s = $("#rule-filter");
    s.replaceChildren(new Option("Totes", ""));
    const used = new Map();
    for (const r of a.rules) for (const ref of [r.target, r.with]) if (ref && cat.thing(ref)) used.set(ref.id, cat.thing(ref));
    if (only && !used.has(only.id)) used.set(only.id, cat.thing(only));
    for (const [id, name] of [...used].sort((x, y) => x[1].localeCompare(y[1], "ca"))) s.append(new Option(name, id));
    s.value = only?.id ?? "";
    s.onchange = () => {
      location.hash = s.value ? `${base}/regles/${s.value}` : `${base}/regles`;
    };
  }

  function editRule(rule, index) {
    openRuleDialog(a, rule, async (saved) => {
      const rules = structuredClone(a.rules);
      if (index == null) rules.push(saved);
      else rules[index] = saved;
      await save({ rules });
      toast("Regla desada");
      renderList();
    });
  }

  function newRule() {
    const use = a.verbs.find((v) => v.id === "use") ?? a.verbs[0];
    const firstThing = a.objects[0] ? { kind: "object", id: a.objects[0].id }
      : a.scenes.flatMap((s) => s.hotspots).map((h) => ({ kind: "hotspot", id: h.id }))[0] ?? null;
    editRule({ verb: use.id, target: only ?? firstThing, with: null, conditions: [], actions: [{ type: "say", text: "" }] }, null);
  }
  $("#add-rule").onclick = newRule;

  async function changeRules(mutate, message) {
    const rules = structuredClone(a.rules);
    mutate(rules);
    try {
      await save({ rules });
      if (message) toast(message);
    } catch (err) {
      toast(err.message);
    }
    renderList();
  }

  function renderList() {
    renderFilter();
    const list = $(".rule-list", view);
    list.replaceChildren();
    const shown = a.rules.map((r, i) => ({ r, i })).filter(({ r }) => !only || mentions(r, only.id));
    if (!a.objects.length && !a.scenes.some((s) => s.hotspots.length)) {
      list.append(el(`<div class="empty-state">Per fer regles cal tenir objectes o punts calents.</div>`));
      $("#add-rule").disabled = true;
      return;
    }
    if (!shown.length) {
      list.append(el(`<div class="empty-state"><strong>Encara no hi ha regles</strong>Per exemple: quan el jugador fa servir la clau amb la porta, la porta s'obre.</div>`));
      return;
    }
    for (const { r, i } of shown) {
      const card = el(`<article class="rule-card">
        <div class="rule-text"><p class="rule-when"></p><ul></ul><p class="warn bad"></p></div>
        <div class="actions">
          <button type="button" class="small" data-act="up" aria-label="Puja">↑</button>
          <button type="button" class="small" data-act="down" aria-label="Baixa">↓</button>
          <button type="button" class="small" data-act="edit">Edita</button>
          <button type="button" class="small" data-act="copy">Duplica</button>
          <button type="button" class="small danger" data-act="delete">Esborra</button>
        </div>
      </article>`);
      $(".rule-when", card).textContent = `Quan fa ${describeTrigger(cat, r)}`;
      const ul = $("ul", card);
      for (const c of r.conditions) {
        const li = el(`<li class="cond"></li>`);
        li.textContent = `si ${describeCondition(cat, c)}`;
        ul.append(li);
      }
      for (const act of r.actions) {
        const li = el(`<li></li>`);
        li.textContent = `→ ${describeAction(cat, act)}`;
        ul.append(li);
      }
      if (!r.actions.length) ul.append(el(`<li class="muted">→ res</li>`));
      const problems = ruleProblems(cat, r);
      $(".warn", card).textContent = problems.length ? `Trencada: ${problems.join("; ")}` : "";
      card.classList.toggle("broken", problems.length > 0);
      // Pujar i baixar canvia la prioritat respecte a les regles del costat (de totes, no només de les filtrades)
      $("[data-act=up]", card).disabled = i === 0;
      $("[data-act=down]", card).disabled = i === a.rules.length - 1;
      $("[data-act=up]", card).onclick = () => changeRules((rules) => rules.splice(i - 1, 0, rules.splice(i, 1)[0]));
      $("[data-act=down]", card).onclick = () => changeRules((rules) => rules.splice(i + 1, 0, rules.splice(i, 1)[0]));
      $("[data-act=edit]", card).onclick = () => editRule(r, i);
      $("[data-act=copy]", card).onclick = () => changeRules((rules) => rules.splice(i + 1, 0, { ...structuredClone(r), id: crypto.randomUUID() }), "Regla duplicada");
      $("[data-act=delete]", card).onclick = async () => {
        if (!await confirmDelete("Esborrar la regla", `Segur que vols esborrar «${describeTrigger(cat, r)}»?`)) return;
        changeRules((rules) => rules.splice(i, 1), "Regla esborrada");
      };
      list.append(card);
    }
  }

  renderVariables();
  renderList();
}

