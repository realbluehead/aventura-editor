// Biblioteca de sons de l'aventura: músiques i efectes. Es pugen arrossegant fitxers o triant-los.
import { request, imageUrl } from "../api.js";
import { $, el, toast, confirmDelete } from "../ui.js";

const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/x-wav", "audio/wave", "audio/webm"];
const MAX_AUDIO = 10 * 1024 * 1024;

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error("No s'ha pogut llegir el fitxer"));
  r.readAsDataURL(file);
});

export function renderSounds(view, a, { refresh }) {
  const base = `#/aventura/${a.id}`;
  document.title = `Sons · ${a.title} · Editor d'aventures`;
  view.innerHTML = `
    <a class="back" href="${base}"></a>
    <div class="page-head">
      <div><h2>Sons</h2><p>Músiques i efectes de l'aventura. Cada escenari pot tenir la seva música, i les regles, els diàlegs i les seqüències poden fer sonar efectes o canviar la música.</p></div>
    </div>
    <div class="sound-drop" tabindex="0" role="button">Arrossega aquí fitxers MP3, OGG o WAV (fins a 10 MB), o fes clic per triar-ne.</div>
    <input type="file" accept="audio/*" multiple hidden>
    <div class="sound-list"></div>`;
  $(".back", view).textContent = `← ${a.title}`;

  const usedBy = (id) => {
    const where = a.scenes.filter((s) => s.music === id).map((s) => `música de «${s.name}»`);
    if (a.titleScreen.music === id) where.push("música del títol");
    const json = JSON.stringify([a.rules, a.dialogues, a.cutscenes]);
    if (json.includes(`"soundId":"${id}"`)) where.push("accions");
    return where;
  };

  async function upload(files) {
    let added = 0;
    for (const file of files) {
      if (!AUDIO_TYPES.includes(file.type)) { toast(`«${file.name}» no és un MP3, OGG, WAV o WebM`); continue; }
      if (file.size > MAX_AUDIO) { toast(`«${file.name}» fa més de 10 MB`); continue; }
      try {
        // El nom del fitxer, sense extensió, fa de nom del so
        await request("POST", `api/adventures/${a.id}/sounds`, { name: file.name.replace(/\.[^.]+$/, "").slice(0, 120), file: await readAsDataUrl(file) });
        added++;
      } catch (err) {
        toast(err.message);
      }
    }
    if (added) {
      toast(added === 1 ? "So afegit" : `${added} sons afegits`);
      refresh();
    }
  }

  const drop = $(".sound-drop", view), input = $("input[type=file]", view);
  drop.onclick = () => input.click();
  drop.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } };
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = () => drop.classList.remove("over");
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("over"); upload([...e.dataTransfer.files]); };
  input.onchange = () => upload([...input.files]);

  const list = $(".sound-list", view);
  if (!a.sounds.length) {
    list.innerHTML = `<div class="empty-state"><strong>Encara no hi ha sons</strong>Per exemple, una música per a cada escenari i uns quants efectes.</div>`;
    return;
  }
  for (const snd of a.sounds) {
    const row = el(`<div class="sound-row">
      <input maxlength="120" aria-label="Nom del so">
      <audio controls preload="none"></audio>
      <span class="meta"></span>
      <button type="button" class="small danger">Esborra</button>
    </div>`);
    const name = $("input", row);
    name.value = snd.name;
    // Es reanomena en sortir del camp; el fitxer no canvia
    name.onchange = async () => {
      try {
        await request("PUT", `api/adventures/${a.id}/sounds/${snd.id}`, { name: name.value, file: snd.file });
        snd.name = name.value;
        toast("Nom desat");
      } catch (err) {
        toast(err.message);
        name.value = snd.name;
      }
    };
    $("audio", row).src = imageUrl(a.id, snd.file);
    const uses = usedBy(snd.id);
    $(".meta", row).textContent = uses.length ? uses.join(", ") : "no es fa servir";
    $("button", row).onclick = async () => {
      const extra = uses.length ? ` Es fa servir a: ${uses.join(", ")}.` : "";
      if (!await confirmDelete("Esborrar el so", `Segur que vols esborrar «${snd.name}»?${extra}`)) return;
      try {
        await request("DELETE", `api/adventures/${a.id}/sounds/${snd.id}`);
        toast("So esborrat");
        refresh();
      } catch (err) {
        toast(err.message);
      }
    };
    list.append(row);
  }
}
