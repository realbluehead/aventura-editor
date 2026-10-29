// Personatges: fotogrames del full de sprites, animacions i dibuix. Compartit per l'editor i el reproductor.
// El full és una graella de fotogrames iguals (frameWidth × frameHeight), numerats d'esquerra a dreta i de dalt a baix.
// Els peus del personatge són al mig de la vora de baix del fotograma.
import { drawActor } from "./actor.js";
import { opaqueAt } from "./objects.js";

// Si una animació no té fotogrames, se'n fa servir una de semblant: la mateixa de costat o de cara,
// i si no, estar quiet. Així un personatge amb només «quiet de costat» ja funciona.
export function animationKeyFor(ch, anim, dir) {
  const keys = [`${anim}-${dir}`, `${anim}-side`, `${anim}-down`];
  if (anim !== "idle") keys.push(`idle-${dir}`, "idle-side", "idle-down");
  return keys.find((k) => ch.animations[k]?.frames.length) ?? null;
}

export function animationFor(ch, anim, dir) {
  return ch.animations[animationKeyFor(ch, anim, dir)] ?? { frames: [0], fps: 1 };
}

export function frameAt(ch, anim, dir, time) {
  const a = animationFor(ch, anim, dir);
  return a.frames[Math.floor(time * a.fps) % a.frames.length];
}

export function sheetGrid(ch, sheet) {
  const cols = Math.max(1, Math.floor(sheet.naturalWidth / ch.frameWidth));
  const rows = Math.max(1, Math.floor(sheet.naturalHeight / ch.frameHeight));
  return { cols, rows, count: cols * rows };
}

export function frameSource(ch, sheet, index) {
  const { cols } = sheetGrid(ch, sheet);
  return { sx: (index % cols) * ch.frameWidth, sy: Math.floor(index / cols) * ch.frameHeight, sw: ch.frameWidth, sh: ch.frameHeight };
}

// Cap on mira, tal com es guarda a les col·locacions, convertit a direcció d'animació i a emmirallat
export function facingToDir(facing) {
  if (facing === "left") return { dir: "side", flip: -1 };
  if (facing === "right") return { dir: "side", flip: 1 };
  return { dir: facing === "up" ? "up" : "down", flip: 1 };
}

// Rectangle que ocupa el personatge, en coordenades de l'escenari.
// «height» és l'alçada a què es dibuixa; sense full de sprites, la figura provisional és més estreta que alta.
export function characterRect(ch, sheet, x, y, height) {
  const w = sheet ? (ch.frameWidth / ch.frameHeight) * height : height * 0.38;
  return { x: x - w / 2, y: y - height, w, h: height };
}

// Dibuixa el personatge amb els peus a (x, y). Sense full de sprites, fa servir la figura provisional amb la camisa del seu color.
export function drawCharacter(ctx, ch, sheet, { x, y, height, dir = "side", flip = 1, anim = "idle", time = 0, step = 0 }) {
  if (!ch || !sheet) {
    drawActor(ctx, { x, y, height, facing: flip, step, shirt: ch?.color });
    return;
  }
  const scale = height / ch.frameHeight;
  const w = ch.frameWidth * scale;
  const src = frameSource(ch, sheet, frameAt(ch, anim, dir, time));
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (dir === "side" && flip < 0) ctx.scale(-1, 1);
  ctx.drawImage(sheet, src.sx, src.sy, src.sw, src.sh, -w / 2, -height, w, height);
  ctx.restore();
}

// Si un punt de l'escenari toca un píxel opac del fotograma que s'està mostrant
export function characterHit(ch, sheet, { x, y, height, dir = "side", flip = 1, anim = "idle", time = 0 }, p) {
  const r = characterRect(ch, sheet, x, y, height);
  if (p[0] < r.x || p[0] >= r.x + r.w || p[1] < r.y || p[1] >= r.y + r.h) return false;
  if (!sheet) return true;
  const scale = height / ch.frameHeight;
  let lx = (p[0] - r.x) / scale;
  const ly = (p[1] - r.y) / scale;
  if (dir === "side" && flip < 0) lx = ch.frameWidth - lx;
  const src = frameSource(ch, sheet, frameAt(ch, anim, dir, time));
  return opaqueAt(sheet, src.sx + lx, src.sy + ly);
}

// On es posa el protagonista per parlar amb un personatge (si no se n'ha triat cap): al costat cap on mira,
// a una distància proporcional a la seva alçada
export function defaultApproach(position, facing, height) {
  const side = facing === "left" ? -1 : 1;
  return [position[0] + side * height * 0.6, position[1]];
}
