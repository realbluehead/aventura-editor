// Pàgina «Juga»: el reproductor amb una barra per tornar a l'editor, ajudes de depuració
// i un panell de proves per saltar a qualsevol escenari i canviar l'inventari, els estats i les variables en directe.
import { imageUrl } from "../api.js";
import { $, el, toast, plural } from "../ui.js";
import { createPlayer } from "../player/player.js";

// La situació de prova desada és de cada navegador: és una comoditat per a qui prova, no part de l'aventura
const storageKey = (id) => `aventura-proves:${id}`;
function loadTesting(id) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(id))) ?? { setup: null, use: false };
  } catch {
    return { setup: null, use: false };
  }
}
function storeTesting(id, value) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(value));
  } catch {
    // Sense emmagatzematge (navegació privada…): la situació només dura fins que es tanca la pàgina
  }
}

export function renderPlay(view, adventure, { sceneId }) {
  const base = `#/aventura/${adventure.id}`;
  document.title = `Juga · ${adventure.title} · Editor d'aventures`;

  if (!adventure.scenes.length) {
    view.innerHTML = `
      <div style="flex:1;max-width:960px;margin:0 auto;padding:24px 16px">
        <a class="back" href="${base}">← Aventura</a>
        <div class="empty-state"><strong>No hi ha res per jugar</strong>Aquesta aventura encara no té escenaris.</div>
      </div>`;
    return;
  }

  view.innerHTML = `
    <div class="play">
      <div class="editor-bar">
        <a class="back" href="${base}">← Aventura</a>
        <span class="editor-title"></span>
        <span class="meta" id="scene-name"></span>
        <div class="tools">
          <button id="debug" aria-pressed="false" title="Mostra les zones caminables, els punts calents i el camí (Maj+D)">Mostra zones</button>
          <button id="testing" aria-pressed="false" title="Canvia l'escenari, l'inventari, els estats i les variables (Maj+T)">Proves</button>
          <button id="mute" aria-pressed="false" title="Silencia la música i els sons (Maj+M)">So</button>
          <button id="restart" title="Torna a començar">Reinicia</button>
          <a class="button small" id="edit-scene">Edita l'escenari</a>
        </div>
      </div>
      <div class="play-body">
        <div class="play-stage"></div>
        <aside class="panel play-testing" hidden></aside>
      </div>
    </div>`;
  $(".editor-title", view).textContent = adventure.title;
  const panel = $(".play-testing", view);

  let testing = loadTesting(adventure.id);
  // Si s'obre des de l'editor d'un escenari, es comença allà; si no, a l'escenari inicial.
  // Amb una situació de prova activa, en surt l'inventari, els estats i les variables (i l'escenari, si no se n'ha triat cap).
  const startSceneId = sceneId ?? adventure.startSceneId ?? adventure.scenes[0].id;
  const setupNow = () => (testing.use && testing.setup ? { ...testing.setup, ...(sceneId ? { sceneId } : {}) } : null);

  let refreshQueued = false;
  const player = createPlayer($(".play-stage", view), adventure, {
    imageUrl: (file) => imageUrl(adventure.id, file),
    startSceneId,
    setup: setupNow(),
    // La pantalla de títol, només quan es juga des del principi (ni des d'un escenari concret ni amb una situació de prova)
    title: !sceneId && !setupNow(),
    // El botó «So» de la barra segueix el del joc
    onMuteChange(muted) {
      $("#mute").setAttribute("aria-pressed", String(muted));
      $("#mute").textContent = muted ? "Sense so" : "So";
    },
    onSceneChange(s) {
      $("#scene-name").textContent = s.name;
      $("#edit-scene").href = `${base}/escenari/${s.id}`;
    },
    // Els canvis de la partida es veuen al panell (un cop per fotograma, i mai mentre s'hi escriu)
    onStateChange() {
      if (panel.hidden || refreshQueued) return;
      refreshQueued = true;
      requestAnimationFrame(() => { refreshQueued = false; renderPanel(); });
    },
  });

  /* ---------- Panell de proves ---------- */

  function section(title) {
    const s = el(`<section><h4></h4></section>`);
    $("h4", s).textContent = title;
    return s;
  }

  function renderPanel() {
    if (panel.hidden || panel.contains(document.activeElement)) return;
    const dbg = player.debug, game = dbg.game;
    const out = [];

    const where = section("Escenari");
    const scenes = el(`<select aria-label="Escenari"></select>`);
    for (const s of adventure.scenes) scenes.append(new Option(s.name, s.id));
    scenes.value = dbg.sceneId() ?? "";
    scenes.onchange = () => { dbg.goto(scenes.value); scenes.blur(); };
    where.append(scenes);
    out.push(where);

    const inv = section("Inventari");
    if (!adventure.objects.length) inv.append(el(`<p class="muted">No hi ha objectes.</p>`));
    for (const o of adventure.objects) {
      const row = el(`<label class="check"><input type="checkbox"> <span></span></label>`);
      $("span", row).textContent = o.name;
      const cb = $("input", row);
      cb.checked = game.inventory.includes(o.id);
      cb.onchange = () => { dbg.setHas(o.id, cb.checked); cb.blur(); };
      inv.append(row);
    }
    out.push(inv);

    const withStates = adventure.objects.filter((o) => o.states.length > 1);
    if (withStates.length) {
      const states = section("Estats");
      for (const o of withStates) {
        const row = el(`<label><span></span><select></select></label>`);
        $("span", row).textContent = o.name;
        const s = $("select", row);
        for (const st of o.states) s.append(new Option(st.name, st.id));
        s.value = game.states.get(o.id);
        s.onchange = () => { dbg.setState(o.id, s.value); s.blur(); };
        states.append(row);
      }
      out.push(states);
    }

    if (adventure.variables.length) {
      const vars = section("Variables");
      for (const v of adventure.variables) {
        const row = el(`<label><span></span></label>`);
        $("span", row).textContent = v.name;
        const value = game.vars.get(v.id);
        let input;
        if (v.type === "bool") {
          input = el(`<select><option value="false">no</option><option value="true">sí</option></select>`);
          input.value = String(value === true);
          input.onchange = () => { dbg.setVar(v.id, input.value === "true"); input.blur(); };
        } else {
          input = el(`<input>`);
          if (v.type === "number") input.type = "number";
          input.value = value;
          // Es desa en sortir del camp, perquè el panell no es refaci mentre s'escriu
          input.onchange = () => dbg.setVar(v.id, v.type === "number" ? Number(input.value) || 0 : input.value);
        }
        row.append(input);
        vars.append(row);
      }
      out.push(vars);
    }

    if (adventure.dialogues.length) {
      const said = section("Diàlegs");
      const p = el(`<p class="muted"></p>`);
      p.textContent = game.said.size ? `${game.said.size} opcions ja dites.` : "Encara no s'ha dit cap opció.";
      const forget = el(`<button type="button" class="small">Oblida-les</button>`);
      forget.disabled = !game.said.size;
      forget.onclick = () => dbg.forgetSaid();
      said.append(p, forget);
      out.push(said);
    }

    const start = section("Punt de partida de proves");
    const info = el(`<p class="muted"></p>`);
    const s = testing.setup;
    info.textContent = s
      ? `Desat: ${adventure.scenes.find((x) => x.id === s.sceneId)?.name ?? "?"}, ${plural(s.inventory.length, "objecte", "objectes")} a l'inventari.`
      : "Desa la situació d'ara per tornar-hi sempre que vulguis, sense haver de jugar fins aquí.";
    const use = el(`<label class="check"><input type="checkbox"> Comença sempre així (també en reiniciar)</label>`);
    const useBox = $("input", use);
    useBox.checked = testing.use;
    useBox.disabled = !s;
    useBox.onchange = () => { testing.use = useBox.checked; storeTesting(adventure.id, testing); useBox.blur(); };
    const buttons = el(`<div class="actions"></div>`);
    const saveBtn = el(`<button type="button" class="small">Desa la situació d'ara</button>`);
    saveBtn.onclick = () => {
      testing = { setup: player.debug.snapshot(), use: true };
      storeTesting(adventure.id, testing);
      toast("Situació de prova desada");
      renderPanel();
    };
    const clearBtn = el(`<button type="button" class="small danger">Esborra-la</button>`);
    clearBtn.disabled = !s;
    clearBtn.onclick = () => {
      testing = { setup: null, use: false };
      storeTesting(adventure.id, testing);
      renderPanel();
    };
    buttons.append(saveBtn, clearBtn);
    start.append(info, use, buttons);
    out.push(start);

    panel.replaceChildren(...out);
  }
  // Quan se surt d'un camp del panell, ja es pot refer amb els valors nous
  panel.addEventListener("focusout", () => requestAnimationFrame(renderPanel));

  const toggleTesting = () => {
    panel.hidden = !panel.hidden;
    $("#testing").setAttribute("aria-pressed", String(!panel.hidden));
    renderPanel();
  };
  $("#testing").onclick = toggleTesting;

  let debug = false;
  const toggleDebug = () => {
    debug = !debug;
    player.setDebug(debug);
    $("#debug").setAttribute("aria-pressed", String(debug));
  };
  $("#debug").onclick = toggleDebug;
  $("#restart").onclick = () => player.restart(setupNow());
  const toggleMute = () => player.setMuted(!player.isMuted());
  $("#mute").onclick = toggleMute;

  // Les eines de prova van amb Maj, perquè les lletres soles són les dreceres dels verbs del joc
  function onKey(e) {
    if (e.target.closest?.("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey || !e.shiftKey) return;
    const k = e.key.toLowerCase();
    if (k === "d") toggleDebug();
    else if (k === "t") toggleTesting();
    else if (k === "m") toggleMute();
  }
  window.addEventListener("keydown", onKey);

  return () => {
    window.removeEventListener("keydown", onKey);
    player.destroy();
  };
}
