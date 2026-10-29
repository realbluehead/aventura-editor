// La versió web de l'editor (GitHub Pages): no hi ha servidor, i el fa el service worker dins del navegador.
// Aquí s'arrenca i, la primera vegada, s'hi carrega l'aventura d'exemple.
import { request } from "./api.js";

const EXAMPLE = "exemples/la-rosa-de-sant-jordi.zip";
const SEEDED = "aventura-editor:exemple-carregat";

export async function startWeb() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Aquest navegador no pot fer anar l'editor sense servidor. Prova-ho amb un navegador actual.");
  }
  await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    // La primera visita: el service worker pren el control de la pàgina en activar-se.
    // Si no ho fa (per exemple, amb una recàrrega forçada que se'l salta), es torna a carregar.
    const claimed = await Promise.race([
      new Promise((r) => navigator.serviceWorker.addEventListener("controllerchange", () => r(true), { once: true })),
      new Promise((r) => setTimeout(() => r(false), 2000)),
    ]);
    if (!claimed) {
      location.reload();
      await new Promise(() => {});
    }
  }
  await seedExample();
}

// Només una vegada per navegador: si després s'esborra l'aventura d'exemple, no torna a aparèixer
async function seedExample() {
  let seeded = false;
  try { seeded = localStorage.getItem(SEEDED) === "1"; } catch {}
  if (seeded) return;
  const list = await request("GET", "api/adventures");
  if (!list.length) {
    const res = await fetch(EXAMPLE);
    if (res.ok) await request("POST", "api/import", await res.arrayBuffer(), "application/zip");
  }
  try { localStorage.setItem(SEEDED, "1"); } catch {}
}
