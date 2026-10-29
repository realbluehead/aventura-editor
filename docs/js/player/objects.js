// Ajudes sobre els objectes compartides per l'editor i el reproductor

// Fitxer de la imatge d'un objecte en un estat (per defecte, l'inicial), o null si en aquest estat no té imatge.
// Si l'estat és animat (frames, fps), el del fotograma que toca a l'instant «time» (en segons).
export function spriteFile(object, stateId = object.initialState, time = 0) {
  const st = object.states.find((s) => s.id === stateId);
  if (!st) return null;
  if (st.frames?.length > 1) return st.frames[Math.floor(time * (st.fps || 8)) % st.frames.length];
  return st.image ?? null;
}

// Tots els fitxers que pot mostrar un estat (per carregar-los abans)
export const stateFiles = (object, stateId = object.initialState) => {
  const st = object.states.find((s) => s.id === stateId);
  return st ? [st.image, ...(st.frames ?? [])].filter(Boolean) : [];
};

// Rectangle que ocupa la imatge: la posició és el punt de baix al mig, com els peus del personatge
export function spriteRect(position, img) {
  const w = img?.naturalWidth ?? 16, h = img?.naturalHeight ?? 16;
  return { x: Math.round(position[0] - w / 2), y: Math.round(position[1] - h), w, h };
}

// Opacitat dels píxels de cada imatge, per saber si un clic toca l'objecte o un forat transparent
const alphaCache = new WeakMap();

export function opaqueAt(img, x, y) {
  if (!img) return true;
  let data = alphaCache.get(img);
  if (!data) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    try {
      data = ctx.getImageData(0, 0, c.width, c.height).data;
    } catch {
      data = null;
    }
    alphaCache.set(img, data);
  }
  if (!data) return true;
  const px = Math.floor(x), py = Math.floor(y);
  if (px < 0 || py < 0 || px >= img.naturalWidth || py >= img.naturalHeight) return false;
  return data[(py * img.naturalWidth + px) * 4 + 3] > 16;
}
