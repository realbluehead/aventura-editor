// Menú lateral de l'aventura: totes les seccions a mà, en lloc d'una fila de botons a la pàgina de l'aventura
import { $, el } from "./ui.js";

// [clau de la ruta, nom]; la clau buida és la pàgina de l'aventura (els escenaris)
const GROUPS = [
  ["Món", [["", "Escenaris"], ["mapa", "Mapa"], ["objectes", "Objectes"], ["personatges", "Personatges"]]],
  ["Història", [["dialegs", "Diàlegs"], ["sequencies", "Seqüències"], ["regles", "Regles"], ["verbs", "Verbs"]]],
  ["So i aspecte", [["sons", "Sons"], ["presentacio", "Presentació"]]],
  ["Provar", [["puzles", "Puzles"], ["juga", "▶ Juga"]]],
];
// Pàgines de dins d'una secció que han de marcar-la al menú
const SECTION_OF = { escenari: "" };

export function renderSidebar(adventure, sub) {
  const nav = $("#sidebar");
  const base = `#/aventura/${adventure.id}`;
  const current = SECTION_OF[sub] ?? sub ?? "";
  nav.replaceChildren();
  const head = el(`<div class="side-head"><a class="side-all" href="#/">← Totes les aventures</a><a class="side-title"></a></div>`);
  const title = $(".side-title", head);
  title.href = base;
  title.textContent = adventure.title;
  nav.append(head);
  for (const [label, items] of GROUPS) {
    const group = el(`<div class="side-group"><div class="side-label"></div><ul></ul></div>`);
    $(".side-label", group).textContent = label;
    for (const [key, name] of items) {
      const li = el(`<li><a></a></li>`);
      const a = $("a", li);
      a.href = key ? `${base}/${key}` : base;
      a.textContent = name;
      if (key === current) a.setAttribute("aria-current", "page");
      $("ul", group).append(li);
    }
    nav.append(group);
  }
  const exp = el(`<a class="button small side-export" download title="Un zip amb el joc a punt per jugar (obre index.html), que també es pot tornar a importar">Exporta el joc…</a>`);
  exp.href = `api/adventures/${adventure.id}/export`;
  nav.append(exp);
  nav.hidden = false;
}

export function hideSidebar() {
  $("#sidebar").hidden = true;
}
