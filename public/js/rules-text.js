// Noms i frases llegibles per a les regles: «Quan fas servir «Clau» amb «Porta», si té «Clau» → «Porta» passa a «Oberta»».
// També detecta les referències trencades (coses que s'han esborrat després de fer la regla).

const q = (s) => `«${s}»`;
const MISSING = "?";

export function catalog(adventure) {
  const hotspots = new Map();
  for (const s of adventure.scenes) for (const h of s.hotspots) hotspots.set(h.id, { hotspot: h, scene: s });
  const cat = {
    verb: (id) => adventure.verbs.find((v) => v.id === id),
    object: (id) => adventure.objects.find((o) => o.id === id),
    hotspot: (id) => hotspots.get(id),
    variable: (id) => adventure.variables.find((v) => v.id === id),
    scene: (id) => adventure.scenes.find((s) => s.id === id),
    character: (id) => adventure.characters.find((c) => c.id === id),
    dialogue: (id) => adventure.dialogues.find((d) => d.id === id),
    sound: (id) => adventure.sounds?.find((x) => x.id === id),
    cutscene: (id) => adventure.cutscenes?.find((x) => x.id === id),
    option: (dialogueId, optionId) => cat.dialogue(dialogueId)?.nodes.flatMap((n) => n.options).find((o) => o.id === optionId),
    state: (objectId, stateId) => cat.object(objectId)?.states.find((s) => s.id === stateId),
    // Nom d'una cosa (objecte o punt calent); null si ja no existeix
    thing(ref) {
      if (!ref) return null;
      if (ref.kind === "object") return cat.object(ref.id)?.name ?? null;
      if (ref.kind === "character") return cat.character(ref.id)?.name ?? null;
      const h = cat.hotspot(ref.id);
      return h ? `${h.hotspot.name} (${h.scene.name})` : null;
    },
  };
  return cat;
}

export function formatValue(v) {
  if (v === true) return "cert";
  if (v === false) return "fals";
  if (typeof v === "string") return q(v);
  return String(v ?? "");
}

const OP_TEXT = { "==": "és", "!=": "no és", "<": "<", ">": ">", "<=": "≤", ">=": "≥" };

export function describeTrigger(cat, rule) {
  const verb = cat.verb(rule.verb);
  const parts = [verb ? verb.name : MISSING, q(cat.thing(rule.target) ?? MISSING)];
  if (rule.with) parts.push(verb?.preposition || "amb", q(cat.thing(rule.with) ?? MISSING));
  return parts.join(" ");
}

export function describeCondition(cat, c) {
  if (c.type === "has") return `${c.not ? "no té" : "té"} ${q(cat.object(c.objectId)?.name ?? MISSING)}`;
  if (c.type === "state") {
    return `${q(cat.object(c.objectId)?.name ?? MISSING)} ${c.not ? "no està" : "està"} ${q(cat.state(c.objectId, c.stateId)?.name ?? MISSING)}`;
  }
  if (c.type === "said") {
    return `${c.not ? "encara no ha dit" : "ja ha dit"} ${q(cat.option(c.dialogueId, c.optionId)?.text ?? MISSING)}`;
  }
  if (c.type === "var") return `${q(cat.variable(c.varId)?.name ?? MISSING)} ${OP_TEXT[c.op] ?? c.op} ${formatValue(c.value)}`;
  return MISSING;
}

export function describeAction(cat, a) {
  switch (a.type) {
    case "say": return a.by ? `${q(cat.character(a.by)?.name ?? MISSING)} diu ${q(a.text)}` : `diu ${q(a.text)}`;
    case "take": return `rep ${q(cat.object(a.objectId)?.name ?? MISSING)}`;
    case "lose": return `perd ${q(cat.object(a.objectId)?.name ?? MISSING)}`;
    case "setState": return `${q(cat.object(a.objectId)?.name ?? MISSING)} passa a ${q(cat.state(a.objectId, a.stateId)?.name ?? MISSING)}`;
    case "setVar": {
      const name = q(cat.variable(a.varId)?.name ?? MISSING);
      return a.op === "add" ? `suma ${formatValue(a.value)} a ${name}` : `posa ${name} a ${formatValue(a.value)}`;
    }
    case "goto": return `va a ${q(cat.scene(a.sceneId)?.name ?? MISSING)}`;
    case "wait": return `espera ${a.seconds} s`;
    case "dialogue": return `comença el diàleg ${q(cat.dialogue(a.dialogueId)?.name ?? MISSING)}`;
    case "walk": return `${a.by ? q(cat.character(a.by)?.name ?? MISSING) : "el protagonista"} camina fins a (${a.point?.join(", ")})`;
    case "sound": return `fa sonar ${q(cat.sound(a.soundId)?.name ?? MISSING)}`;
    case "music": return a.soundId ? `posa la música ${q(cat.sound(a.soundId)?.name ?? MISSING)}` : "atura la música";
    case "cutscene": return `fa la seqüència ${q(cat.cutscene(a.cutsceneId)?.name ?? MISSING)}`;
    case "end": return a.text ? `s'acaba el joc: ${q(a.text)}` : "s'acaba el joc";
    default: return MISSING;
  }
}

// Referències trencades dins de condicions i accions (de regles o d'opcions de diàleg)
export function logicProblems(cat, conditions, actions) {
  const out = [];
  const check = (item, what) => {
    if (!item) return;
    if (item.objectId && !cat.object(item.objectId)) out.push(`${what}: l'objecte ja no existeix`);
    else if (item.stateId && !cat.state(item.objectId, item.stateId)) out.push(`${what}: l'estat ja no existeix`);
    if (item.varId && !cat.variable(item.varId)) out.push(`${what}: la variable ja no existeix`);
    if (item.sceneId && !cat.scene(item.sceneId)) out.push(`${what}: l'escenari ja no existeix`);
    if (item.by && !cat.character(item.by)) out.push(`${what}: el personatge que parla ja no existeix`);
    if (item.soundId && !cat.sound(item.soundId)) out.push(`${what}: el so ja no existeix`);
    if (item.cutsceneId && !cat.cutscene(item.cutsceneId)) out.push(`${what}: la seqüència ja no existeix`);
    if (item.dialogueId && !cat.dialogue(item.dialogueId)) out.push(`${what}: el diàleg ja no existeix`);
    else if (item.optionId && !cat.option(item.dialogueId, item.optionId)) out.push(`${what}: l'opció del diàleg ja no existeix`);
  };
  conditions.forEach((c, i) => check(c, `condició ${i + 1}`));
  actions.forEach((a, i) => check(a, `acció ${i + 1}`));
  return out;
}

// Llista de coses que fallen en una regla: verbs, objectes, estats, variables o escenaris que ja no existeixen
export function ruleProblems(cat, rule) {
  const out = [];
  if (!cat.verb(rule.verb)) out.push("el verb ja no existeix");
  if (!cat.thing(rule.target)) out.push("la cosa ja no existeix");
  if (rule.with && !cat.thing(rule.with)) out.push("el segon objecte ja no existeix");
  return [...out, ...logicProblems(cat, rule.conditions, rule.actions)];
}

export const mentions = (rule, id) => rule.target?.id === id || rule.with?.id === id;
