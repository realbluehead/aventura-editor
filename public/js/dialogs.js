// Finestres per crear i editar aventures i escenaris (nom, descripció i imatge de fons)
import { request, scenesUrl, sceneUrl, saveAdventure, saveScene } from "./api.js";
import { $, el, toast, background } from "./ui.js";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_IMAGE = 10 * 1024 * 1024;

/* ---------- Aventures ---------- */

let editingAdventure = null;
let onAdventureSaved = null;

// onSaved(aventura, creada) es crida quan s'ha desat
export function openAdventureDialog(a, onSaved) {
  editingAdventure = a;
  onAdventureSaved = onSaved;
  const form = $("#adventure-form");
  form.title.value = a?.title ?? "";
  form.description.value = a?.description ?? "";
  $("#adventure-form-title").textContent = a ? "Edita l'aventura" : "Nova aventura";
  $(".error", form).textContent = "";
  $("#adventure-editor").showModal();
  form.title.focus();
}

$("#adventure-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = { title: form.title.value, description: form.description.value };
  const save = $("[type=submit]", form);
  save.disabled = true;
  try {
    const saved = editingAdventure
      ? await saveAdventure({ ...editingAdventure, ...body })
      : await request("POST", "/api/adventures", body);
    $("#adventure-editor").close();
    toast(editingAdventure ? "Aventura desada" : "Aventura creada");
    onAdventureSaved?.(saved, !editingAdventure);
  } catch (err) {
    $(".error", form).textContent = err.message;
  } finally {
    save.disabled = false;
  }
});

/* ---------- Escenaris ---------- */

let sceneAdventure = null;
let editingScene = null;
let onSceneSaved = null;
let pendingFile = null;     // imatge triada però encara no pujada
let clearBackground = false;

function renderDrop() {
  const drop = $("#drop");
  const existing = !clearBackground && editingScene?.background;
  if (pendingFile) {
    const img = el(`<img class="bg" alt="">`);
    img.src = URL.createObjectURL(pendingFile);
    img.onload = () => URL.revokeObjectURL(img.src);
    drop.replaceChildren(img);
  } else {
    drop.replaceChildren(background(sceneAdventure.id, existing, "Fes clic o arrossega una imatge"));
  }
  $("#clear-bg").hidden = !pendingFile && !existing;
}

export function pickFile(file) {
  const error = $("#scene-form .error");
  if (!file) return;
  if (!IMAGE_TYPES.includes(file.type)) { error.textContent = "El fons ha de ser una imatge PNG, JPG, GIF o WebP"; return; }
  if (file.size > MAX_IMAGE) { error.textContent = "La imatge no pot passar de 10 MB"; return; }
  error.textContent = "";
  pendingFile = file;
  clearBackground = false;
  renderDrop();
}

// onSaved(escenari) es crida quan s'ha desat; si falla la pujada de la imatge també es crida amb l'escenari ja creat
export function openSceneDialog(adventure, s, onSaved) {
  sceneAdventure = adventure;
  editingScene = s;
  onSceneSaved = onSaved;
  pendingFile = null;
  clearBackground = false;
  const form = $("#scene-form");
  form.name.value = s?.name ?? "";
  form.description.value = s?.description ?? "";
  $("#scene-form-title").textContent = s ? "Edita l'escenari" : "Nou escenari";
  $(".error", form).textContent = "";
  $("#file").value = "";
  renderDrop();
  $("#scene-editor").showModal();
  form.name.focus();
}

const drop = $("#drop");
drop.onclick = () => $("#file").click();
drop.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#file").click(); } };
drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
drop.ondragleave = () => drop.classList.remove("over");
drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("over"); pickFile(e.dataTransfer.files[0]); };
$("#pick").onclick = () => $("#file").click();
$("#file").onchange = (e) => pickFile(e.target.files[0]);
$("#clear-bg").onclick = () => { pendingFile = null; clearBackground = true; $("#file").value = ""; renderDrop(); };

$("#scene-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = { name: form.name.value, description: form.description.value };
  const base = scenesUrl(sceneAdventure.id);
  const save = $("[type=submit]", form);
  save.disabled = true;
  try {
    let scene = editingScene
      ? await saveScene(sceneAdventure.id, { ...editingScene, ...body })
      : await request("POST", base, body);
    // Si la imatge falla, l'escenari ja existeix: el passem a mode edició perquè tornar a desar no el dupliqui
    editingScene = scene;
    if (pendingFile) scene = await request("PUT", `${sceneUrl(sceneAdventure.id, scene.id)}/background`, pendingFile, pendingFile.type);
    else if (clearBackground && scene.background) scene = await request("DELETE", `${sceneUrl(sceneAdventure.id, scene.id)}/background`);
    $("#scene-editor").close();
    toast("Escenari desat");
    onSceneSaved?.(scene);
  } catch (err) {
    $(".error", form).textContent = err.message;
    if (editingScene) onSceneSaved?.(editingScene);
  } finally {
    save.disabled = false;
  }
});

for (const btn of document.querySelectorAll("[data-close]")) btn.onclick = () => btn.closest("dialog").close();
