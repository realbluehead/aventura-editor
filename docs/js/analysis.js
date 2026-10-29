// Anàlisi d'una aventura: què pot arribar a fer el jugador, si el joc es pot acabar, el mapa de puzles i els avisos.
//
// Es fa amb una aproximació optimista. Es comença amb el que hi ha al principi (l'escenari inicial, els estats i els
// valors inicials) i es van afegint «fets» (ser a un escenari, tenir un objecte, un estat, un valor, haver dit una opció…)
// amb tots els passos que ja es poden fer, fins que no n'apareix cap de nou. No es té en compte el que es perd (objectes
// que es donen, estats que tornen enrere, opcions d'un sol ús), així que:
//   - si diu que una cosa no es pot fer mai, és segur;
//   - si diu que es pot fer, és molt probable, però no ho garanteix.
// No depèn del navegador: es prova des de Node.
import { catalog, describeTrigger, ruleProblems, logicProblems } from "./rules-text.js";
import { PICKUP } from "./defaults.js";

export const F = {
  scene: (id) => `scene:${id}`,
  has: (id) => `has:${id}`,
  state: (o, s) => `state:${o}:${s}`,
  value: (v, x) => `var:${v}:${JSON.stringify(x)}`,
  changes: (v) => `varany:${v}`,          // la variable es va sumant: pot prendre molts valors
  said: (d, o) => `said:${d}:${o}`,
  dialogue: (d) => `dialogue:${d}`,
  node: (d, n) => `node:${d}:${n}`,
  cutscene: (c) => `cutscene:${c}`,
  end: "end",
};

function compare(a, op, b) {
  switch (op) {
    case "!=": return a !== b;
    case "<": return Number(a) < Number(b);
    case ">": return Number(a) > Number(b);
    case "<=": return Number(a) <= Number(b);
    case ">=": return Number(a) >= Number(b);
    default: return a === b;
  }
}

const q = (s) => `«${s}»`;

// Frase curta per a un fet, per als avisos i el mapa de puzles
export function describeFact(cat, fact) {
  const [kind, a, b] = fact.split(":");
  switch (kind) {
    case "scene": return `ser a ${q(cat.scene(a)?.name ?? "?")}`;
    case "has": return `tenir ${q(cat.object(a)?.name ?? "?")}`;
    case "state": return `${q(cat.object(a)?.name ?? "?")} ${(cat.state(a, b)?.name ?? "?").toLowerCase()}`;
    case "var": return `${q(cat.variable(a)?.name ?? "?")} = ${fact.slice(kind.length + a.length + 2)}`;
    case "varany": return `que ${q(cat.variable(a)?.name ?? "?")} canviï`;
    case "said": return `haver dit ${q(cat.option(a, b)?.text ?? "?")}`;
    case "dialogue": return `parlar: ${q(cat.dialogue(a)?.name ?? "?")}`;
    case "node": return `arribar a un punt de ${q(cat.dialogue(a)?.name ?? "?")}`;
    case "cutscene": return `veure ${q(cat.cutscene(a)?.name ?? "?")}`;
    case "end": return "el final";
    default: return fact;
  }
}

// Avisos de cada escenari que no depenen de les regles: sense fons, sense zona caminable, sortides a mitges
export function sceneWarnings(adventure) {
  const out = [];
  for (const s of adventure.scenes) {
    if (!s.background) out.push({ scene: s, text: `«${s.name}» no té imatge de fons.` });
    else if (!s.walkable.length) out.push({ scene: s, text: `«${s.name}» no té zona caminable.` });
    for (const h of s.hotspots) {
      if (!h.exit) continue;
      if (!h.exit.sceneId) out.push({ scene: s, text: `La sortida «${h.name}» de «${s.name}» no porta enlloc.` });
      else if (!h.exit.arrival) out.push({ scene: s, text: `La sortida «${h.name}» de «${s.name}» no té punt d'arribada.` });
    }
  }
  return out;
}

export function analyze(adventure) {
  const a = adventure;
  const cat = catalog(a);
  const startId = a.startSceneId ?? a.scenes[0]?.id ?? null;

  // On és cada cosa al principi
  const objectScene = new Map(), characterScene = new Map(), hotspotScene = new Map();
  for (const s of a.scenes) {
    for (const p of s.objects) objectScene.set(p.objectId, s.id);
    for (const p of s.characters) characterScene.set(p.characterId, s.id);
    for (const h of s.hotspots) hotspotScene.set(h.id, s.id);
  }

  // Una «clàusula» és una llista de fets dels quals n'hi ha prou amb un; si és buida, no es pot complir mai (i «why» diu per què)
  const clause = (any, why) => ({ any, why });
  function access(ref) {
    if (!ref) return clause([], "falta la cosa");
    const name = cat.thing(ref);
    if (!name) return clause([], "la cosa ja no existeix");
    if (ref.kind === "object") {
      const where = objectScene.get(ref.id);
      return clause([F.has(ref.id), ...(where ? [F.scene(where)] : [])]);
    }
    if (ref.kind === "hotspot") return clause([F.scene(hotspotScene.get(ref.id))]);
    if (ref.id === a.playerId) return clause([], `${q(name)} és el protagonista`);
    const where = characterScene.get(ref.id);
    return where ? clause([F.scene(where)]) : clause([], `${q(name)} no és a cap escenari`);
  }

  // Condicions: les positives són fets que cal tenir; les negatives es poden complir (al principi no es té res);
  // les de variables es comproven amb els valors que pot tenir cada variable
  function conditionParts(conditions) {
    const clauses = [], checks = [];
    for (const c of conditions) {
      if (!c) { clauses.push(clause([], "una condició no és vàlida")); continue; }
      if (c.not) continue;
      if (c.type === "has") clauses.push(clause([F.has(c.objectId)]));
      else if (c.type === "state") clauses.push(clause([F.state(c.objectId, c.stateId)]));
      else if (c.type === "said") clauses.push(clause([F.said(c.dialogueId, c.optionId)]));
      else if (c.type === "var") checks.push(c);
    }
    return { clauses, checks };
  }

  function effects(actions) {
    const out = [];
    for (const x of actions) {
      if (!x) continue;
      if (x.type === "take" && cat.object(x.objectId)) out.push(F.has(x.objectId));
      else if (x.type === "setState" && cat.state(x.objectId, x.stateId)) out.push(F.state(x.objectId, x.stateId));
      else if (x.type === "setVar" && cat.variable(x.varId)) out.push(x.op === "add" ? F.changes(x.varId) : F.value(x.varId, x.value));
      else if (x.type === "goto" && cat.scene(x.sceneId)) out.push(F.scene(x.sceneId));
      else if (x.type === "dialogue" && cat.dialogue(x.dialogueId)) out.push(F.dialogue(x.dialogueId));
      else if (x.type === "cutscene" && cat.cutscene(x.cutsceneId)) out.push(F.cutscene(x.cutsceneId));
      else if (x.type === "end") out.push(F.end);
    }
    return out;
  }

  /* ---------- Els passos possibles ---------- */

  const steps = [];
  const add = (step) => steps.push({ clauses: [], checks: [], round: null, internal: false, ...step });

  if (startId) {
    add({
      id: "start", kind: "start", label: `Comença a «${cat.scene(startId)?.name}»`, link: { scene: startId },
      produces: [
        F.scene(startId),
        ...a.objects.map((o) => F.state(o.id, o.initialState)),
        ...a.variables.map((v) => F.value(v.id, v.initial)),
        // La seqüència d'inici es fa en començar
        ...(a.introCutsceneId && cat.cutscene(a.introCutsceneId) ? [F.cutscene(a.introCutsceneId)] : []),
      ],
    });
  }

  // Seqüències: es fan quan alguna cosa les comença (l'inici, entrar a un escenari, una regla o una opció)
  for (const c of a.cutscenes ?? []) {
    add({ id: `cutscene:${c.id}`, kind: "cutscene", label: `Seqüència «${c.name}»`, link: { cutscene: c.id }, clauses: [clause([F.cutscene(c.id)])], produces: effects(c.actions) });
  }

  for (const s of a.scenes) {
    for (const h of s.hotspots) {
      if (!h.exit?.sceneId || !cat.scene(h.exit.sceneId)) continue;
      // Les sortides amb condicions només es poden fer servir quan es compleixen
      const { clauses: cc, checks } = conditionParts(h.exit.conditions ?? []);
      add({
        id: `exit:${h.id}`, kind: "exit", label: `${h.name}: cap a «${cat.scene(h.exit.sceneId).name}»`, link: { scene: s.id },
        clauses: [clause([F.scene(s.id)]), ...cc], checks, produces: [F.scene(h.exit.sceneId)], from: s.id, to: h.exit.sceneId,
      });
    }
    // Entrar a l'escenari pot començar una seqüència
    if (s.onEnter?.cutsceneId && cat.cutscene(s.onEnter.cutsceneId)) {
      add({ id: `onenter:${s.id}`, kind: "onenter", internal: true, label: s.name, clauses: [clause([F.scene(s.id)])], produces: [F.cutscene(s.onEnter.cutsceneId)] });
    }
    // «Agafa» funciona sol amb els objectes que es poden agafar
    for (const p of s.objects) {
      const o = cat.object(p.objectId);
      if (!o?.pickable || !cat.verb(PICKUP)) continue;
      add({
        id: `pickup:${o.id}`, kind: "pickup", label: `Agafa «${o.name}»`, link: { scene: s.id },
        clauses: [clause([F.scene(s.id)])], produces: [F.has(o.id)],
      });
    }
  }

  a.rules.forEach((r, i) => {
    const clauses = [];
    if (!cat.verb(r.verb)) clauses.push(clause([], "el verb ja no existeix"));
    clauses.push(access(r.target));
    if (r.with) {
      // Amb dos objectes, el primer s'ha de tenir a l'inventari (la regla també serveix a l'inrevés)
      clauses.push(access(r.with));
      const inHand = [r.target, r.with].filter((t) => t?.kind === "object").map((t) => F.has(t.id));
      clauses.push(clause(inHand, "cap dels dos és un objecte que es pugui tenir"));
    }
    const { clauses: cc, checks } = conditionParts(r.conditions);
    add({
      id: `rule:${r.id}`, kind: "rule", label: describeTrigger(cat, r), link: { rule: r.target?.id ?? null },
      clauses: [...clauses, ...cc], checks, produces: effects(r.actions), index: i,
    });
  });

  for (const d of a.dialogues) {
    if (d.characterId && cat.character(d.characterId) && d.characterId !== a.playerId) {
      add({
        id: `talk:${d.id}`, kind: "talk", label: `Parla amb «${cat.character(d.characterId).name}»`, link: { dialogue: d.id },
        clauses: [access({ kind: "character", id: d.characterId })], produces: [F.dialogue(d.id)],
      });
    }
    if (d.start) {
      add({ id: `enter:${d.id}`, kind: "enter", internal: true, label: d.name, clauses: [clause([F.dialogue(d.id)])], produces: [F.node(d.id, d.start)] });
    }
    for (const n of d.nodes) {
      for (const o of n.options) {
        const { clauses: cc, checks } = conditionParts(o.conditions);
        add({
          id: `option:${d.id}:${o.id}`, kind: "option", label: `«${d.name}»: «${o.text}»`, link: { dialogue: d.id },
          clauses: [clause([F.node(d.id, n.id)]), ...cc], checks,
          produces: [F.said(d.id, o.id), ...(o.next ? [F.node(d.id, o.next)] : []), ...effects(o.actions)],
          dialogueId: d.id, nodeId: n.id,
        });
      }
    }
  }

  /* ---------- Fins que no aparegui res de nou ---------- */

  const facts = new Set();
  const producer = new Map();   // fet → el primer pas que l'ha aconseguit
  const valuesOf = (varId) => [...facts].filter((f) => f.startsWith(`var:${varId}:`)).map((f) => JSON.parse(f.slice(`var:${varId}:`.length)));
  function checkVar(c) {
    const v = cat.variable(c.varId);
    if (!v) return false;
    if (v.type === "number" && facts.has(F.changes(c.varId))) return true;
    return valuesOf(c.varId).some((x) => compare(x, c.op, c.value));
  }
  const ready = (s) => s.clauses.every((c) => c.any.some((f) => facts.has(f))) && s.checks.every(checkVar);

  for (let round = 0; ; round++) {
    const now = steps.filter((s) => s.round === null && ready(s));
    if (!now.length) break;
    for (const s of now) {
      s.round = round;
      for (const f of s.produces) {
        if (!facts.has(f)) { facts.add(f); producer.set(f, s); }
      }
    }
  }

  // Per què un pas no es pot fer: la primera cosa que li falta
  function whyNot(s) {
    for (const c of s.clauses) {
      if (c.any.some((f) => facts.has(f))) continue;
      if (!c.any.length) return c.why;
      return `cal ${c.any.map((f) => describeFact(cat, f)).join(" o ")}`;
    }
    const v = s.checks.find((c) => !checkVar(c));
    if (v) return `${q(cat.variable(v.varId)?.name ?? "?")} no arriba mai a complir la condició`;
    return "";
  }

  /* ---------- Mapa de puzles ---------- */

  // El pas visible que ha aconseguit un fet (es passa per sobre dels passos interns, com entrar a un diàleg)
  function visibleProducer(fact, seen = new Set()) {
    const p = producer.get(fact);
    if (!p || !p.internal || seen.has(p)) return p ?? null;
    seen.add(p);
    const c = p.clauses[0];
    const f = c?.any.find((x) => facts.has(x));
    return f ? visibleProducer(f, seen) : null;
  }
  // Per a cada clàusula d'un pas fet, el fet que la va complir primer
  const satisfiedBy = (s) => s.clauses.map((c) => c.any.filter((f) => facts.has(f)).sort((x, y) => producer.get(x).round - producer.get(y).round)[0]);

  const fired = steps.filter((s) => s.round !== null && !s.internal);
  const edges = [];
  for (const s of fired) {
    for (const f of satisfiedBy(s)) {
      const p = f && visibleProducer(f);
      if (p && p !== s && !edges.some(([x, y]) => x === p.id && y === s.id)) edges.push([p.id, s.id]);
    }
  }
  // El camí cap al final: des del primer pas que acaba el joc, enrere pels passos que li van donar el que necessitava
  const critical = new Set();
  const ending = fired.filter((s) => s.produces.includes(F.end)).sort((x, y) => x.round - y.round)[0];
  (function back(s) {
    if (!s || critical.has(s.id)) return;
    critical.add(s.id);
    for (const f of satisfiedBy(s)) back(f && visibleProducer(f));
  })(ending);

  /* ---------- Avisos ---------- */

  const issues = [];
  const issue = (level, text, link) => issues.push({ level, text, link });
  const hasEnding = steps.some((s) => s.produces.includes(F.end));
  const canFinish = facts.has(F.end);

  if (!startId) issue("error", "L'aventura no té escenaris.", null);
  if (!hasEnding) issue("error", "Cap regla, opció de diàleg ni seqüència acaba el joc: falta una acció «Acaba el joc».", { rules: true });
  else if (!canFinish) {
    for (const s of steps.filter((x) => x.produces.includes(F.end))) {
      issue("error", `No es pot arribar al final (${s.label}): ${whyNot(s)}.`, s.link);
    }
  }

  const reachableScenes = new Set(a.scenes.filter((s) => facts.has(F.scene(s.id))).map((s) => s.id));
  for (const s of a.scenes) if (!reachableScenes.has(s.id)) issue("warn", `No es pot arribar mai a «${s.name}».`, { scene: s.id });

  // Les regles que acaben el joc ja surten com a error a dalt
  for (const s of steps.filter((x) => x.round === null && x.kind === "rule" && !x.produces.includes(F.end))) {
    issue("warn", `La regla «${s.label}» no es pot fer mai: ${whyNot(s)}.`, s.link);
  }
  for (const d of a.dialogues) {
    if (!facts.has(F.dialogue(d.id))) {
      issue("warn", `El diàleg «${d.name}» no es pot començar mai: ${d.characterId ? whyNot(steps.find((s) => s.id === `talk:${d.id}`) ?? { clauses: [clause([], "el personatge no existeix")], checks: [] }) : "no és de cap personatge i cap regla no el comença"}.`, { dialogue: d.id });
      continue;
    }
    for (const n of d.nodes) {
      if (!facts.has(F.node(d.id, n.id))) {
        issue("warn", `Al diàleg «${d.name}» no s'arriba mai al node «${n.lines[0]?.text ?? "sense frases"}».`, { dialogue: d.id });
        continue;
      }
      for (const o of n.options) {
        const s = steps.find((x) => x.id === `option:${d.id}:${o.id}`);
        if (s.round === null) issue("warn", `L'opció «${o.text}» de «${d.name}» no surt mai: ${whyNot(s)}.`, { dialogue: d.id });
      }
    }
  }

  // Objectes que bloquegen passos que no es poden fer mai perquè no es poden aconseguir
  const blocking = new Set();
  for (const s of steps.filter((x) => x.round === null)) {
    for (const c of s.clauses) {
      if (c.any.some((f) => facts.has(f))) continue;
      for (const f of c.any) if (f.startsWith("has:") && cat.object(f.slice(4))) blocking.add(f.slice(4));
    }
  }
  for (const id of blocking) issue("warn", `Hi ha coses que necessiten tenir «${cat.object(id).name}», però no es pot aconseguir mai.`, { objects: true });

  // Variables: les que es miren però no canvien mai, les que canvien però no mira ningú, i les que no surten enlloc
  const allConditions = [...a.rules.flatMap((r) => r.conditions), ...a.dialogues.flatMap((d) => d.nodes.flatMap((n) => n.options.flatMap((o) => o.conditions)))];
  for (const v of a.variables) {
    const read = allConditions.some((c) => c?.type === "var" && c.varId === v.id);
    // El valor inicial (el pas «start») no compta com a canvi
    const changed = steps.some((s) => s.kind !== "start" && s.produces.some((f) => f.startsWith(`var:${v.id}:`) || f === F.changes(v.id)));
    if (!read && !changed) issue("info", `Ningú no fa servir la variable «${v.name}».`, { rules: true });
    else if (!read) issue("info", `La variable «${v.name}» canvia, però cap condició no la mira.`, { rules: true });
    else if (!changed) issue("warn", `La variable «${v.name}» no canvia mai: les condicions sobre ella sempre donen el mateix.`, { rules: true });
  }

  // Referències trencades
  for (const c of a.cutscenes ?? []) {
    const problems = logicProblems(cat, [], c.actions);
    if (problems.length) issue("error", `La seqüència «${c.name}» està trencada: ${problems.join("; ")}.`, { cutscene: c.id });
    else if (!facts.has(F.cutscene(c.id))) issue("info", `La seqüència «${c.name}» no es fa mai: res no la comença.`, { cutscene: c.id });
  }
  for (const r of a.rules) {
    const problems = ruleProblems(cat, r);
    if (problems.length) issue("error", `La regla «${describeTrigger(cat, r)}» està trencada: ${problems.join("; ")}.`, { rule: r.target?.id ?? null });
  }
  for (const d of a.dialogues) {
    for (const n of d.nodes) {
      for (const o of n.options) {
        const problems = logicProblems(cat, o.conditions, o.actions);
        if (problems.length) issue("error", `L'opció «${o.text}» de «${d.name}» està trencada: ${problems.join("; ")}.`, { dialogue: d.id });
      }
    }
  }

  // Atzucacs: escenaris on, si s'hi arriba, ja no es pot tornar on s'acaba el joc
  if (canFinish && ending) {
    // On es pot fer el final: un escenari on hi pugui ser tot el que cal alhora (cada cosa, o a l'inventari o en aquell escenari)
    const sceneIds = new Set(ending.clauses.flatMap((c) => c.any).filter((f) => f.startsWith("scene:")).map((f) => f.slice(6)));
    const goals = new Set([...sceneIds].filter((sid) => facts.has(F.scene(sid)) && ending.clauses.every((c) =>
      c.any.includes(F.scene(sid)) || c.any.some((f) => !f.startsWith("scene:") && facts.has(f)))));
    if (goals.size) {
      const next = new Map();   // escenari → escenaris on es pot anar des d'allà
      for (const s of steps.filter((x) => x.round !== null)) {
        const froms = s.kind === "exit" ? [s.from] : s.clauses.flatMap((c) => c.any).filter((f) => f.startsWith("scene:")).map((f) => f.slice(6));
        const tos = s.produces.filter((f) => f.startsWith("scene:")).map((f) => f.slice(6));
        for (const x of froms) for (const y of tos) next.set(x, [...(next.get(x) ?? []), y]);
      }
      for (const sid of reachableScenes) {
        const seen = new Set([sid]);
        const queue = [sid];
        while (queue.length) for (const y of next.get(queue.shift()) ?? []) if (!seen.has(y)) { seen.add(y); queue.push(y); }
        if (![...goals].some((g) => seen.has(g))) {
          issue("warn", `Si el jugador arriba a «${cat.scene(sid).name}», ja no pot tornar on s'acaba el joc.`, { scene: sid });
        }
      }
    }
  }

  for (const w of sceneWarnings(a)) issue("warn", w.text, { scene: w.scene.id });

  return { steps, facts, producer, canFinish, hasEnding, reachableScenes, chart: { steps: fired, edges, critical }, issues, whyNot };
}
