// Petites utilitats de la interfície compartides per totes les vistes
import { imageUrl } from "./api.js";

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
}

export function confirmDelete(title, text) {
  const dlg = $("#confirm");
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  dlg.returnValue = "";
  dlg.showModal();
  return new Promise((resolve) => dlg.addEventListener("close", () => resolve(dlg.returnValue === "yes"), { once: true }));
}

// Quadret amb el color de les frases d'un personatge (el text va en negre: un color clar no es llegiria sobre gris)
export function colorSwatch(color) {
  const s = el(`<span class="swatch-color" aria-hidden="true"></span>`);
  s.style.background = color;
  return s;
}

export const fmt = new Intl.DateTimeFormat("ca", { dateStyle: "medium", timeStyle: "short" });
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Fons d'un escenari per a les targetes, o un requadre buit si no en té
export function background(adventureId, file, emptyText = "Sense fons") {
  if (!file) {
    const empty = el(`<div class="bg bg-empty"></div>`);
    empty.textContent = emptyText;
    return empty;
  }
  const img = el(`<img class="bg" alt="" loading="lazy">`);
  img.src = imageUrl(adventureId, file);
  return img;
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No s'ha pogut carregar la imatge de fons"));
    img.src = url;
  });
}

// Recompte de punts calents i sortides d'un escenari, per a les targetes
export function sceneSummary(s) {
  const exits = s.hotspots.filter((h) => h.exit).length;
  const parts = [plural(s.hotspots.length - exits, "punt calent", "punts calents"), plural(exits, "sortida", "sortides")];
  if (!s.walkable.length) parts.push("sense zona caminable");
  return parts.join(" · ");
}
