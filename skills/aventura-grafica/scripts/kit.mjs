// Kit per escriure una aventura gràfica sencera des d'un script de Node i deixar-la en un zip que l'editor importa.
// Ho fa servir el skill «aventura-grafica»: un script build.mjs del projecte importa aquest fitxer, ho declara tot
// (escenaris, personatges, objectes, regles, diàlegs, seqüències, sons) i crida project.write("joc.zip").
//
// Reaprofita el codi de l'editor: el llenç de píxels i els personatges de tools/barcelona, els filtres de pixelar
// de l'editor de dibuix (public/js/paint) i la mateixa validació del servidor (vegeu check.mjs).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { inflateSync } from "node:zlib";
import { Canvas, rgba, mix, rng } from "../../../tools/barcelona/pixels.mjs";
import { characterSheet, FRAME_W, FRAME_H, ANIMATIONS, icon } from "../../../tools/barcelona/sprites.mjs";
import { song, sMoneda, sClic, sAigua, sBus, sExit } from "../../../tools/barcelona/audio.mjs";
import { zip } from "../../../export.mjs";
import { DEFAULT_VERBS } from "../../../public/js/defaults.js";
import * as ops from "../../../public/js/paint/image-ops.js";
import { PALETTES } from "../../../public/js/paint/palettes.js";
import { checkZip, printReport } from "./check.mjs";

export { Canvas, rgba, mix, rng, characterSheet, FRAME_W, FRAME_H, ANIMATIONS, icon, song, ops, PALETTES, DEFAULT_VERBS };
// Efectes de so ja fets: monedes, clics, aigua, clàxon i «aconseguit»
export const SFX = { coin: sMoneda, click: sClic, water: sAigua, horn: sBus, success: sExit };

/* ---------- Imatges ---------- */

// Llegeix un PNG (8 o 16 bits, qualsevol tipus de color, sense entrellaçat) a { width, height, data } RGBA
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("No és un PNG");
  let pos = 8, width, height, depth, type, interlace, palette = null, trns = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), kind = buf.toString("ascii", pos + 4, pos + 8), body = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === "IHDR") { width = body.readUInt32BE(0); height = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (kind === "PLTE") palette = body;
    else if (kind === "tRNS") trns = body;
    else if (kind === "IDAT") idat.push(body);
    else if (kind === "IEND") break;
    pos += 12 + len;
  }
  if (interlace) throw new Error("PNG entrellaçat: converteix-lo primer (per exemple, amb ffmpeg)");
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const bpp = Math.max(1, (channels * depth) >> 3), stride = Math.ceil((width * channels * depth) / 8);
  const raw = inflateSync(Buffer.concat(idat)), px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride), prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0, b = prev ? prev[i] : 0, c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[i] = v & 255;
    }
  }
  const sample = (y, i) => {
    // El valor «i» d'una fila, escalat a 0–255
    if (depth === 16) return px[y * stride + i * 2];
    if (depth === 8) return px[y * stride + i];
    const perByte = 8 / depth, byte = px[y * stride + Math.floor(i / perByte)], shift = 8 - depth * (1 + (i % perByte));
    const v = (byte >> shift) & ((1 << depth) - 1);
    return type === 3 ? v : Math.round((v * 255) / ((1 << depth) - 1));
  };
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const o = (y * width + x) * 4, s = (i) => sample(y, x * channels + i);
    if (type === 3) {
      const k = s(0);
      data[o] = palette[k * 3]; data[o + 1] = palette[k * 3 + 1]; data[o + 2] = palette[k * 3 + 2];
      data[o + 3] = trns && k < trns.length ? trns[k] : 255;
    } else if (type === 0 || type === 4) {
      data[o] = data[o + 1] = data[o + 2] = s(0);
      data[o + 3] = type === 4 ? s(1) : 255;
    } else {
      data[o] = s(0); data[o + 1] = s(1); data[o + 2] = s(2);
      data[o + 3] = type === 6 ? s(3) : 255;
    }
  }
  return { width, height, data };
}

const has = (cmd) => { try { execFileSync(cmd, ["-version"], { stdio: "ignore" }); return true; } catch { return false; } };

// Llegeix qualsevol imatge (JPG, PNG, WebP, GIF, TIFF…) com a { width, height, data }, reduïda com a molt a «maxSide».
// Fa servir ffmpeg si hi és, o sips (macOS); un PNG es pot llegir sense res.
export function readImage(path, maxSide = 1024) {
  if (!existsSync(path)) throw new Error(`No existeix ${path}`);
  const dir = mkdtempSync(join(tmpdir(), "aventura-img-"));
  try {
    const out = join(dir, "img.png");
    if (has("ffmpeg")) {
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path, "-frames:v", "1",
        "-vf", `scale='min(${maxSide},iw)':'min(${maxSide},ih)':force_original_aspect_ratio=decrease`, "-pix_fmt", "rgba", out]);
    } else if (process.platform === "darwin") {
      execFileSync("sips", ["-s", "format", "png", "-Z", String(maxSide), path, "--out", out], { stdio: "ignore" });
    } else if (extname(path).toLowerCase() === ".png") {
      return decodePng(readFileSync(path));
    } else {
      throw new Error("Per llegir JPG/WebP cal ffmpeg (o sips a macOS). Converteix la imatge a PNG.");
    }
    return decodePng(readFileSync(out));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Passa una imatge { width, height, data } a un llenç de Canvas (per dibuixar-hi a sobre i treure'n el PNG)
export function toCanvas(img) {
  const c = new Canvas(img.width, img.height);
  c.data.set(img.data);
  return c;
}
export const fromCanvas = (c) => ({ width: c.w, height: c.h, data: c.data });

// Estils de pixelat (els mateixos de «Pixela i filtres» a l'editor)
export const PRESETS = {
  photo: { method: "average", colors: 32, dither: "floyd", ditherAmount: 0.6, contrast: 10, saturation: 15 },
  painting: { method: "average", colors: 48, dither: "floyd", ditherAmount: 0.4, contrast: 15, saturation: 20 },
  soft: { method: "average", colors: 64, dither: "none" },
  sprite: { method: "dominant", colors: 16, dither: "none", contrast: 10, saturation: 10, outline: "#1a1c2c" },
  ega: { method: "average", palette: "ega", dither: "bayer4", ditherAmount: 0.8, contrast: 15, saturation: 20 },
  pico8: { method: "average", palette: "pico8", dither: "atkinson", ditherAmount: 0.7, contrast: 10, saturation: 10 },
  gameboy: { method: "average", palette: "gameboy", dither: "bayer4", contrast: 20, brightness: 5 },
};

// Converteix una imatge (fitxer o { width, height, data }) en pixel art i en torna un Canvas.
//   width, height: la mida final (per defecte 320×200, la d'un fons);
//   fit: "cover" (omple i retalla), "contain" (sencera, amb vores transparents), "stretch";
//   crop: [x, y, w, h] en fraccions (0–1) de l'original, per quedar-se'n un tros abans d'encaixar;
//   preset: un de PRESETS; i qualsevol opció de ops.pixelate per sobreescriure'l
//   (colors, palette: id de PALETTES o llista de "#rrggbb", dither, ditherAmount, brightness, contrast, saturation,
//   method, removeBg, bgTolerance, alphaThreshold, outline: "#rrggbb").
export function pixelArt(source, opts = {}) {
  let img = typeof source === "string" ? readImage(source, opts.maxSide ?? 1600) : source;
  const o = { ...PRESETS[opts.preset ?? "photo"], ...opts };
  const W = o.width ?? 320, H = o.height ?? 200, fit = o.fit ?? "cover";
  if (o.crop) {
    const [cx, cy, cw, ch] = o.crop;
    img = ops.crop(img, Math.round(cx * img.width), Math.round(cy * img.height), Math.max(1, Math.round(cw * img.width)), Math.max(1, Math.round(ch * img.height)));
  }
  let tw = W, th = H;
  if (fit === "cover") {
    const target = W / H, have = img.width / img.height;
    if (have > target) { const w = Math.round(img.height * target); img = ops.crop(img, Math.round((img.width - w) * (o.anchorX ?? 0.5)), 0, w, img.height); }
    else if (have < target) { const h = Math.round(img.width / target); img = ops.crop(img, 0, Math.round((img.height - h) * (o.anchorY ?? 0.5)), img.width, h); }
  } else if (fit === "contain") {
    const s = Math.min(W / img.width, H / img.height);
    tw = Math.max(1, Math.round(img.width * s)); th = Math.max(1, Math.round(img.height * s));
  }
  const palette = Array.isArray(o.palette) ? o.palette.map(ops.hexToRgba)
    : o.palette ? PALETTES.find((p) => p.id === o.palette)?.colors.map(ops.hexToRgba) : null;
  if (o.palette && !palette) throw new Error(`No hi ha cap paleta «${o.palette}». N'hi ha: ${PALETTES.map((p) => p.id).join(", ")}`);
  const { image } = ops.pixelate(img, {
    width: tw, height: th, method: o.method, palette, colors: palette ? 0 : o.colors ?? 32,
    dither: o.dither ?? "none", ditherAmount: o.ditherAmount ?? 1,
    brightness: o.brightness ?? 0, contrast: o.contrast ?? 0, saturation: o.saturation ?? 0,
    alphaThreshold: o.alphaThreshold ?? 128, removeBg: o.removeBg ?? false, bgTolerance: o.bgTolerance ?? 24,
    outlineColor: o.outline ? ops.hexToRgba(o.outline) : null,
  });
  if (fit !== "contain" || (tw === W && th === H)) return toCanvas(image);
  const c = new Canvas(W, H);
  c.draw(toCanvas(image), Math.floor((W - tw) / 2), H - th);   // les coses es recolzen a terra: a baix al mig
  return c;
}

// Un PNG ampliat per mirar-lo (els píxels es veuen grossos); útil per revisar el que s'ha fet amb l'eina Read
export function zoomed(c, scale = 3) {
  const z = new Canvas(c.w * scale, c.h * scale);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const p = c.get(x, y);
    if (p[3]) z.rect(x * scale, y * scale, scale, scale, p);
  }
  return z;
}

/* ---------- Peces de l'aventura ---------- */

// Geometria: tot en píxels del fons (320×200 per defecte); els polígons són llistes de [x, y]
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const ground = (top, W = 320, H = 200) => [rect(0, top, W, H - 1 - top)];
export const leftEdge = (top = 152, H = 200) => rect(0, top, 18, H - 1 - top);
export const rightEdge = (top = 152, W = 320, H = 200) => rect(W - 18, top, 18, H - 1 - top);

// Punts calents i sortides d'un escenari
export const spot = (id, name, description, polygon) => ({ id, name, description, polygon, exit: null });
export const exit = (id, name, polygon, sceneId, arrival, { conditions = [], blocked = "", description = "" } = {}) =>
  ({ id, name, description, polygon, exit: { sceneId, arrival, conditions, blocked } });
// Un personatge o un objecte col·locat en un escenari. La posició és on toca a terra (els peus, la base).
export const npc = (characterId, position, facing = "down", walkTo = null) => ({ characterId, position, walkTo, facing });
export const place = (objectId, position, walkTo = null, { facing = "auto", layer = "auto" } = {}) => ({ objectId, position, walkTo, facing, layer });

// Referències per a les regles
export const obj = (id) => ({ kind: "object", id });
export const chr = (id) => ({ kind: "character", id });
export const hot = (id) => ({ kind: "hotspot", id });

// Condicions
export const hasItem = (objectId, not = false) => ({ type: "has", objectId, not });
export const inState = (objectId, stateId, not = false) => ({ type: "state", objectId, stateId, not });
export const isVar = (varId, value, op = "==") => ({ type: "var", varId, op, value });
export const said = (dialogueId, optionId, not = false) => ({ type: "said", dialogueId, optionId, not });

// Accions (by = id del personatge que parla o camina; null = el protagonista)
export const say = (text, by = null) => ({ type: "say", text, by });
export const take = (objectId) => ({ type: "take", objectId });
export const lose = (objectId) => ({ type: "lose", objectId });
export const setState = (objectId, stateId) => ({ type: "setState", objectId, stateId });
export const setVar = (varId, value, op = "set") => ({ type: "setVar", varId, op, value });
export const goto = (sceneId, arrival = null) => ({ type: "goto", sceneId, arrival });
export const wait = (seconds) => ({ type: "wait", seconds });
export const talkTo = (dialogueId) => ({ type: "dialogue", dialogueId });
export const walk = (point, by = null, sceneId = null) => ({ type: "walk", point, by, sceneId });
export const sound = (soundId) => ({ type: "sound", soundId });
export const music = (soundId) => ({ type: "music", soundId });
export const cutscene = (cutsceneId) => ({ type: "cutscene", cutsceneId });
export const end = (text) => ({ type: "end", text });

let ruleN = 0, optN = 0;
// Una regla: quan es fa «verb» sobre «target» (i «withRef» per a Dóna/Fes servir X amb Y) i es compleixen les
// condicions, es fan les accions. La primera regla que encaixa guanya: posa les més concretes abans.
export const rule = (verb, target, withRef, conditions, actions) => ({ id: `r-${++ruleN}`, verb, target, with: withRef, conditions, actions });

// Diàlegs: node(id, [[qui, frase], ...], [opcions]); qui = id del personatge o null per al protagonista
export const opt = (text, next = null, { once = false, conditions = [], actions = [], id } = {}) =>
  ({ id: id ?? `op-${++optN}`, text, once, conditions, actions, next });
export const node = (id, lines, options) => ({ id, position: null, lines: lines.map(([by, text]) => ({ by, text })), options });
export function dialogue(id, name, characterId, nodes) {
  // Els nodes en graella, perquè l'editor de diàlegs els mostri endreçats
  nodes.forEach((nd, i) => (nd.position = [40 + (i % 3) * 300, 40 + Math.floor(i / 3) * 220]));
  return { id, name, characterId, start: nodes[0].id, nodes };
}

/* ---------- El projecte ---------- */

// Va recollint els fitxers (imatges i sons) i les peces, i ho escriu tot en un zip importable
export class Project {
  constructor({ title, description = "", width = 320, height = 200 } = {}) {
    Object.assign(this, { title, description, width, height });
    this.files = [];
    this.scenes = []; this.characters = []; this.objects = []; this.sounds = [];
    this.rules = []; this.dialogues = []; this.cutscenes = []; this.variables = [];
    this.credits = [];
    this.now = new Date().toISOString();
  }

  // Afegeix un fitxer (un Canvas, un Buffer o el camí d'un fitxer) i en torna el nom
  file(name, data) {
    const bytes = data instanceof Canvas ? data.png() : typeof data === "string" ? readFileSync(data) : data;
    if (this.files.some((f) => f.name === `files/${name}`)) throw new Error(`Fitxer repetit: ${name}`);
    this.files.push({ name: `files/${name}`, data: bytes });
    return name;
  }

  sound(id, name, wav) {
    this.sounds.push({ id, name, file: this.file(`${id}.wav`, wav) });
    return id;
  }

  // Un personatge. «look» fa servir el generador de figures de 16×32 (vegeu references/art.md);
  // o bé «sheet» (un Canvas amb el full de sprites) amb frameWidth, frameHeight i animations.
  character({ id, name, description = "", color = "#ffffff", look, sheet, frameWidth = FRAME_W, frameHeight = FRAME_H, animations = ANIMATIONS }) {
    const img = sheet ?? characterSheet(look);
    this.characters.push({ id, name, description, color, sheet: this.file(`${id}.png`, img), frameWidth, frameHeight, animations, createdAt: this.now, updatedAt: this.now });
    return id;
  }

  // Un objecte de la biblioteca. states: [[idEstat, nom, Canvas o null, fps?], ...]; el primer és l'inicial.
  // En lloc d'un Canvas, una llista de Canvas fa l'estat animat (fotogrames en bucle a «fps», per defecte 8).
  // decor: true el fa decoratiu (es veu però no es pot tocar: llums, fum, espelmes...).
  // Els que es poden agafar reben una icona d'inventari de 24×24 feta de la imatge (o «icon», si es passa).
  object({ id, name, description = "", pickable = false, decor = false, states, icon: iconCanvas = null, initial }) {
    const st = states.map(([sid, sname, img, fps]) => {
      if (!Array.isArray(img)) return { id: `${id}-${sid}`, name: sname, image: img ? this.file(`${id}-${sid}.png`, img) : null };
      const frames = img.map((f, k) => this.file(`${id}-${sid}-${k}.png`, f));
      return { id: `${id}-${sid}`, name: sname, image: frames[0], frames, fps: fps ?? 8 };
    });
    const firstImg = states.map(([, , img]) => (Array.isArray(img) ? img[0] : img)).find(Boolean);
    const ico = iconCanvas ?? (pickable && firstImg ? icon(firstImg) : null);
    this.objects.push({
      id, name, description, pickable, ...(decor ? { decor: true } : {}), states: st, initialState: initial ? `${id}-${initial}` : st[0].id,
      icon: ico ? this.file(`${id}-icona.png`, ico) : null, createdAt: this.now, updatedAt: this.now,
    });
    return id;
  }

  // Un escenari. background: un Canvas (normalment 320×200). La resta, com a l'editor.
  scene({ id, name, description = "", background, walkable, hotspots = [], objects = [], characters = [], music = null,
    transition = "fade", onEnter = null, mapPosition = null, actorHeight = null }) {
    this.scenes.push({
      id, name, description, background: background ? this.file(`${id}.png`, background) : null,
      walkable, hotspots, objects, characters, music, transition, onEnter, mapPosition, actorHeight,
      createdAt: this.now, updatedAt: this.now,
    });
    return id;
  }

  variable(id, name, type = "bool", initial = type === "bool" ? false : type === "number" ? 0 : "") {
    this.variables.push({ id, name, type, initial });
    return id;
  }

  // Afegeix als crèdits l'autoria d'una imatge baixada amb commons.mjs (el fitxer .json que hi deixa al costat)
  attribute(imagePath) {
    const meta = JSON.parse(readFileSync(`${imagePath}.json`, "utf8"));
    const line = `«${meta.title}», de ${meta.author} (${meta.license}${meta.licenseUrl ? `, ${meta.licenseUrl}` : ""}), ${meta.page}`;
    if (!this.credits.includes(line)) { this.credits.push(line); this.creditMeta = [...(this.creditMeta ?? []), meta]; }
    return meta;
  }

  // Escriu el zip, el valida amb el mateix codi del servidor i n'analitza si es pot acabar. Torna l'informe.
  async write(out, { startSceneId, playerId, introCutsceneId = null, titleScreen = null, credits = "", verbs = DEFAULT_VERBS, cursor = "cross", strict = true } = {}) {
    let imageCredits = this.credits.length ? `\n\nImatges (adaptades a pixel art):\n${this.credits.join("\n")}` : "";
    // Si no hi caben senceres (el joc en deixa 3000 caràcters), s'escriuen curtes: autor i llicència
    if ((credits + imageCredits).length > 3000) {
      const short = this.creditMeta.map((m) => `${m.author.replace(/\s+/g, " ").slice(0, 32)} (${m.license})`);
      imageCredits = `\n\nImatges de Wikimedia Commons, adaptades a pixel art: ${short.join(" · ")}.`;
    }
    const adventure = {
      title: this.title, description: this.description, formatVersion: 10,
      createdAt: this.now, updatedAt: this.now,
      startSceneId: startSceneId ?? this.scenes[0]?.id ?? null,
      scenes: this.scenes, verbs, objects: this.objects, variables: this.variables, rules: this.rules,
      characters: this.characters, playerId: playerId ?? null, dialogues: this.dialogues, sounds: this.sounds,
      cutscenes: this.cutscenes, introCutsceneId,
      titleScreen: {
        image: titleScreen?.image ? this.file("titol.png", titleScreen.image) : null,
        subtitle: titleScreen?.subtitle ?? "", music: titleScreen?.music ?? null,
      },
      credits: (credits + imageCredits).trim().slice(0, 3000), cursor,
    };
    const bytes = zip([{ name: "adventure.json", data: Buffer.from(JSON.stringify(adventure, null, 2)) }, ...this.files]);
    writeFileSync(out, bytes);
    const report = await printReport(checkZip(bytes), out);
    if (strict && report.errors.length) process.exitCode = 1;
    return report;
  }
}
