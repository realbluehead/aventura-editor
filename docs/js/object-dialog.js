// Finestra per crear i editar un objecte de la biblioteca: nom, descripció, estats amb la seva imatge,
// si es pot agafar i la icona d'inventari. Les imatges noves s'envien com a data URL dins del mateix JSON.
import { request, imageUrl } from "./api.js";
import { $, el, toast, blobToDataUrl } from "./ui.js";
import { openPaintEditor } from "./paint/editor.js";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_SPRITE = 5 * 1024 * 1024;

const dialog = el(`
  <dialog id="object-editor" class="wide-dialog">
    <form>
      <h3></h3>
      <label>Nom <input name="name" maxlength="120" required autocomplete="off" placeholder="Ex: Clau rovellada"></label>
      <label>Descripció <small>El que diu el personatge quan el mira.</small>
        <textarea name="description" maxlength="5000" style="min-height:70px"></textarea>
      </label>
      <div class="field">Estats <small>Cada estat té la seva imatge (per exemple, porta oberta i tancada). L'inicial és com comença el joc.</small>
        <div class="states"></div>
        <button type="button" class="small" data-act="add-state" style="align-self:flex-start">+ Afegeix un estat</button>
      </div>
      <label class="check"><input type="checkbox" name="pickable"> Es pot agafar i guardar a l'inventari</label>
      <div class="field icon-field">Icona d'inventari <small>Opcional. Si no en té, l'inventari farà servir la imatge de l'estat inicial.</small>
        <div class="icon-slot"></div>
      </div>
      <p class="error"></p>
      <div class="row-end">
        <button type="button" data-act="cancel">Cancel·la</button>
        <button type="submit" class="primary">Desa</button>
      </div>
    </form>
    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
  </dialog>`);
document.body.append(dialog);
const form = $("form", dialog);
const fileInput = $("input[type=file]", dialog);

let adventure = null, editing = null, onSaved = null;
let draft = null;   // { states: [{ id, name, image }], initialState, icon }: image és un nom de fitxer, un data URL o null
let pickTarget = null;

const preview = (value) => (value?.startsWith("data:") ? value : imageUrl(adventure.id, value));

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!IMAGE_TYPES.includes(file.type)) return reject(new Error("La imatge ha de ser PNG, JPG, GIF o WebP"));
    if (file.size > MAX_SPRITE) return reject(new Error("La imatge ha de fer menys de 5 MB"));
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("No s'ha pogut llegir la imatge"));
    r.readAsDataURL(file);
  });
}

// Un requadre amb la imatge (o buit) on es fa clic o s'hi arrossega una imatge
function picker(value, onChange, emptyText) {
  const box = el(`<div class="sprite-pick" tabindex="0" role="button" title="Tria una imatge o arrossega-la aquí"></div>`);
  if (value) {
    const img = el(`<img alt="">`);
    img.src = preview(value);
    const clear = el(`<button type="button" class="clear" title="Treu la imatge" aria-label="Treu la imatge">×</button>`);
    clear.onclick = (e) => { e.stopPropagation(); onChange(null); };
    box.append(img, clear);
  } else {
    box.textContent = emptyText;
  }
  // Dibuixar-la (o retocar-la) a l'editor de dibuix
  const paint = el(`<button type="button" class="paint-btn" title="Dibuixa-la o retoca-la" aria-label="Dibuixa la imatge">🎨</button>`);
  paint.onclick = async (e) => {
    e.stopPropagation();
    try {
      const blob = await openPaintEditor({ title: `Imatge · ${form.name.value || "objecte nou"}`, src: value ? preview(value) : null, width: 32, height: 32 });
      if (blob) onChange(await blobToDataUrl(blob));
    } catch (err) {
      $(".error", form).textContent = err.message;
    }
  };
  box.append(paint);
  const pick = () => { pickTarget = onChange; fileInput.value = ""; fileInput.click(); };
  box.onclick = pick;
  box.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } };
  box.ondragover = (e) => { e.preventDefault(); box.classList.add("over"); };
  box.ondragleave = () => box.classList.remove("over");
  box.ondrop = async (e) => {
    e.preventDefault();
    box.classList.remove("over");
    const file = e.dataTransfer.files[0];
    if (file) setImage(onChange, file);
  };
  return box;
}

async function setImage(onChange, file) {
  try {
    onChange(await readImage(file));
    $(".error", form).textContent = "";
  } catch (err) {
    $(".error", form).textContent = err.message;
  }
}

fileInput.onchange = () => {
  if (fileInput.files[0] && pickTarget) setImage(pickTarget, fileInput.files[0]);
};

function render() {
  const list = $(".states", dialog);
  list.replaceChildren();
  draft.states.forEach((st, i) => {
    const row = el(`<div class="state-row">
      <span class="slot"></span>
      <input maxlength="120" required placeholder="Nom de l'estat" aria-label="Nom de l'estat">
      <label class="check"><input type="radio" name="initial"> Inicial</label>
      <button type="button" class="small danger">Treu</button>
    </div>`);
    // Canviar la imatge d'un estat animat en treu l'animació (els fotogrames eren de l'antiga)
    $(".slot", row).append(picker(st.image, (v) => { st.image = v; delete st.frames; delete st.fps; render(); }, "+ imatge"));
    const name = $("input[maxlength]", row);
    name.value = st.name;
    name.oninput = () => { st.name = name.value; };
    const radio = $("input[type=radio]", row);
    radio.checked = draft.initialState === st.id;
    radio.onchange = () => { draft.initialState = st.id; };
    const remove = $("button.danger", row);
    remove.disabled = draft.states.length === 1;
    remove.onclick = () => {
      draft.states.splice(i, 1);
      if (draft.initialState === st.id) draft.initialState = draft.states[0].id;
      render();
    };
    list.append(row);
  });
  $(".icon-field", dialog).hidden = !form.pickable.checked;
  $(".icon-slot", dialog).replaceChildren(picker(draft.icon, (v) => { draft.icon = v; render(); }, "+ icona"));
}

// onSaved(objecte, creat) es crida quan s'ha desat
export function openObjectDialog(adv, object, saved) {
  adventure = adv;
  editing = object;
  onSaved = saved;
  draft = object
    ? { states: structuredClone(object.states), initialState: object.initialState, icon: object.icon }
    : { states: [{ id: crypto.randomUUID(), name: "Normal", image: null }], initialState: null, icon: null };
  draft.initialState ??= draft.states[0].id;
  $("h3", dialog).textContent = object ? "Edita l'objecte" : "Nou objecte";
  form.name.value = object?.name ?? "";
  form.description.value = object?.description ?? "";
  form.pickable.checked = object?.pickable ?? false;
  $(".error", form).textContent = "";
  render();
  dialog.showModal();
  form.name.focus();
}

form.pickable.onchange = render;
$("[data-act=add-state]", dialog).onclick = () => {
  draft.states.push({ id: crypto.randomUUID(), name: "", image: null });
  render();
  $(".state-row:last-child input[maxlength]", dialog).focus();
};
$("[data-act=cancel]", dialog).onclick = () => dialog.close();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: form.name.value,
    description: form.description.value,
    pickable: form.pickable.checked,
    states: draft.states,
    initialState: draft.initialState,
    icon: form.pickable.checked ? draft.icon : null,
  };
  const save = $("[type=submit]", form);
  save.disabled = true;
  try {
    const url = `api/adventures/${adventure.id}/objects`;
    const object = editing ? await request("PUT", `${url}/${editing.id}`, body) : await request("POST", url, body);
    dialog.close();
    toast(editing ? "Objecte desat" : "Objecte creat");
    onSaved?.(object, !editing);
  } catch (err) {
    $(".error", form).textContent = err.message;
  } finally {
    save.disabled = false;
  }
});
