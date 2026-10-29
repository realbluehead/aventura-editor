// Les quatre propostes de cada decorat (un estil per proposta) i una pàgina per triar-les.
// Ús: node eines/propostes.mjs [escenari ...]   → propostes/<escenari>-<A|B|C|D>.png i propostes/index.html
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url)), OUT = join(HERE, "../propostes");
const K = await import(new URL("../../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const { Canvas, characterSheet, zoomed } = K;
const T = await import(new URL("../textura.mjs", import.meta.url));
const CA = await import(new URL("../castell.mjs", import.meta.url));
const FO = await import(new URL("../fora.mjs", import.meta.url));
const F = await import(new URL("../figures.mjs", import.meta.url));
const NOMS = { dormitori: "Dormitori de Gryffindor", comuna: "Sala comuna", escala: "Escala Gran", vestibul: "Vestíbul", gransalo: "Gran Saló", biblioteca: "Biblioteca", masmorra: "Masmorra de Pocions", lavabo: "Lavabo de la Myrtle", cuines: "Cuines", gargola: "Passadís de la gàrgola", despatx: "Despatx de Dumbledore", astronomia: "Torre d'Astronomia", setena: "Passadís del setè pis", sala: "Sala dels Menesters", jardins: "Jardins", cabana: "Cabana d'en Hagrid", hivernacle: "Hivernacle", quidditch: "Camp de Quidditch", bosc: "Bosc Prohibit", llac: "Riba del llac" };
const FNS = { ...CA, ...FO };
const only = process.argv.slice(2);
const keys = Object.keys(NOMS).filter((k) => !only.length || only.includes(k));
mkdirSync(OUT, { recursive: true });
const harry = characterSheet(F.LOOKS.harry);
for (const k of keys) {
  for (const e of T.ESTILS) {
    const sc = T.render(FNS[k], e, { outdoor: T.OUTDOOR.has(k) });
    const c = new Canvas(320, 200); c.draw(sc.bg, 0, 0);
    for (const o of Object.values(sc.objs ?? {})) { const img = o.imgs.find(Boolean); c.draw(img, Math.round(o.pos[0] - img.w / 2), o.pos[1] - img.h); }
    // en Harry a primer terme, per veure l'escala
    const ys = sc.walk.flat().map((p) => p[1]), yb = Math.max(...ys) - 6, h = Math.round(sc.ah.far + (sc.ah.near - sc.ah.far) * (yb - Math.min(...ys)) / (Math.max(...ys) - Math.min(...ys)));
    const fig = F.resize(F.frame(harry, 4), h); c.draw(fig, 200 - Math.round(fig.w / 2), yb - h);
    writeFileSync(join(OUT, `${k}-${e.id}.png`), zoomed(c, 2).png());
  }
  console.log(k);
}
import { readFileSync } from "node:fs";
const src = (k, e) => `data:image/png;base64,${readFileSync(join(OUT, `${k}-${e.id}.png`)).toString("base64")}`;
const card = (k, e) => `<label class="card"><input type="radio" name="${k}" value="${e.id}"><img src="${k}-${e.id}.png" alt="${NOMS[k]}, proposta ${e.id}" loading="lazy"><span><b>${e.id}</b> ${e.nom}</span></label>`;
writeFileSync(join(OUT, "index.html"), `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tria els decorats</title>
<style>
:root{--bg:#15131c;--fg:#ece8f4;--mut:#a49fb4;--acc:#ffd23f;--card:#221f2c}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
header{position:sticky;top:0;z-index:2;background:#1c1925ee;border-bottom:1px solid #333;padding:10px 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
header h1{font-size:17px;margin:0} #tria{font:13px ui-monospace,monospace;color:var(--acc);word-break:break-all;flex:1;min-width:200px}
button{background:var(--acc);color:#222;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer}
main{padding:0 16px 60px;max-width:1500px;margin:auto} .estils{color:var(--mut);margin:12px 0} .estils b{color:var(--fg)}
section{margin-top:26px} h2{font-size:16px;margin:0 0 8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr));gap:10px}
.card{background:var(--card);border:2px solid transparent;border-radius:8px;padding:6px;cursor:pointer;display:block}
.card img{width:100%;image-rendering:pixelated;display:block;border-radius:4px}
.card span{display:block;padding:4px 2px 0;color:var(--mut)} .card b{color:var(--fg)}
.card input{position:absolute;opacity:0} .card:has(input:checked){border-color:var(--acc)} .card:has(input:checked) span{color:var(--acc)}
</style></head><body>
<header><h1>Tria els decorats</h1><div id="tria">Encara no n'has triat cap.</div><button id="copia" type="button">Copia la tria</button></header>
<main><p class="estils">${T.ESTILS.map((e) => `<b>${e.id} · ${e.nom}</b>: ${e.desc}`).join("<br>")}</p>
${keys.map((k) => `<section><h2>${NOMS[k]}</h2><div class="grid">${T.ESTILS.map((e) => card(k, e)).join("")}</div></section>`).join("\n")}
</main>
<script>
const keys=${JSON.stringify(keys)};
function upd(){const t=keys.map(k=>{const v=document.querySelector('input[name="'+k+'"]:checked');return v?k+":"+v.value:null}).filter(Boolean);
document.getElementById("tria").textContent=t.length?t.length+"/"+keys.length+" — "+t.join(" "):"Encara no n'has triat cap.";
try{localStorage.setItem("tria",JSON.stringify(t))}catch(e){}}
try{for(const s of JSON.parse(localStorage.getItem("tria")||"[]")){const[k,v]=s.split(":");const i=document.querySelector('input[name="'+k+'"][value="'+v+'"]');if(i)i.checked=true}}catch(e){}
document.addEventListener("change",upd);upd();
document.getElementById("copia").onclick=()=>navigator.clipboard?.writeText(document.getElementById("tria").textContent);
</script></body></html>`);
console.log("propostes/index.html");
