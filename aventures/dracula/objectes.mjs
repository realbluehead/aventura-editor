// Els objectes de «Dràcula», dibuixats píxel a píxel amb la paleta Nosferatu
const K = await import(new URL("../../skills/aventura-grafica/scripts/kit.mjs", import.meta.url));
const E = await import(new URL("./estil.mjs", import.meta.url));
const { Canvas } = K;

const C = {
  negre: "#07060b", fosc: "#161427", blau: "#2b2a48", blauMig: "#3b3a5c", gris: "#4c5266", grisMig: "#6b7287",
  grisClar: "#8f97a8", plata: "#b8bccb", blanc: "#dcdbe0", os: "#e8dcc0", palla: "#c9b48a", or: "#a08458",
  fusta: "#6e5638", fustaFosca: "#3e2e22", sangFosca: "#3a0a10", sang: "#6b0f1a", sangViva: "#9e1a24", vermell: "#cc2a2a",
  verd: "#2f4237", verdClar: "#4d5e4a", morat: "#573056",
};
export { C };

const canvas = (w, h, fn) => { const c = new Canvas(w, h); fn(c); return c; };

// El llum d'oli que porta el comte quan rep els convidats
export const llum = () => canvas(8, 14, (c) => { c.rect(3, 0, 2, 3, C.grisMig); c.rect(1, 3, 6, 8, C.fustaFosca); c.rect(2, 4, 4, 6, C.palla); c.rect(3, 5, 2, 3, C.os); c.rect(1, 11, 6, 2, C.fustaFosca); });
export const carta = () => canvas(12, 9, (c) => { c.rect(0, 0, 12, 9, C.os); c.rect(0, 0, 12, 1, C.palla); c.line(0, 0, 6, 5, C.palla); c.line(11, 0, 6, 5, C.palla); c.circle(6, 6, 1, C.sang); });
export const escriptures = () => canvas(12, 14, (c) => { c.rect(1, 0, 10, 14, C.os); c.rect(1, 0, 10, 1, C.palla); for (let y = 3; y < 11; y += 2) c.rect(3, y, 6, 1, C.grisMig); c.circle(8, 12, 1, C.sangViva); c.rect(0, 0, 1, 14, C.palla); });
export const crucifix = () => canvas(8, 13, (c) => { c.rect(3, 0, 2, 13, C.or); c.rect(0, 3, 8, 2, C.or); c.px(3, 0, C.palla); c.px(0, 3, C.palla); });
export const diari = () => canvas(10, 12, (c) => { c.rect(0, 0, 10, 12, C.fustaFosca); c.rect(1, 1, 8, 10, C.fusta); c.rect(9, 0, 1, 12, C.os); c.rect(3, 4, 4, 1, C.or); });
export const mirall = () => canvas(9, 12, (c) => { c.ellipse(4, 4, 4, 4, C.grisMig); c.ellipse(4, 4, 3, 3, C.plata); c.px(3, 2, C.blanc); c.rect(3, 8, 3, 4, C.fusta); });
export const clauRovellada = () => canvas(12, 5, (c) => { c.circle(2, 2, 2, C.fusta); c.px(2, 2, [0, 0, 0, 0]); c.rect(4, 2, 8, 1, C.fusta); c.rect(9, 3, 1, 2, C.fusta); c.rect(11, 3, 1, 2, C.fusta); c.px(6, 2, C.or); });
export const clauFerro = () => canvas(14, 6, (c) => { c.circle(2, 3, 2, C.grisMig); c.px(2, 3, [0, 0, 0, 0]); c.rect(4, 2, 10, 2, C.grisMig); c.rect(10, 4, 1, 2, C.grisMig); c.rect(12, 4, 2, 2, C.grisMig); c.rect(4, 2, 10, 1, C.grisClar); });
export const bossaOr = () => canvas(10, 10, (c) => { c.ellipse(5, 6, 4, 4, C.fusta); c.rect(3, 1, 4, 2, C.fusta); c.rect(2, 2, 6, 1, C.fustaFosca); c.px(4, 6, C.palla); c.px(6, 7, C.or); });
export const cofreOr = () => canvas(30, 18, (c) => {
  c.rect(1, 6, 28, 12, C.fustaFosca); c.rect(1, 6, 28, 2, C.fusta); c.rect(13, 9, 4, 4, C.or);
  for (let i = 0; i < 26; i++) c.px(3 + i, 4 + ((i * 7) % 3), i % 3 ? C.or : C.palla);
  c.rect(4, 2, 22, 3, C.or); c.px(8, 1, C.palla); c.px(15, 0, C.palla); c.px(21, 1, C.palla);
});
export const pala = () => canvas(8, 28, (c) => { c.rect(3, 0, 2, 20, C.fusta); c.rect(1, 0, 6, 2, C.fustaFosca); c.poly([[0, 19], [7, 19], [6, 27], [1, 27]], C.grisMig); c.rect(1, 19, 6, 1, C.grisClar); });
export const bitllet = () => canvas(12, 7, (c) => { c.rect(0, 0, 12, 7, C.palla); c.rect(0, 0, 12, 1, C.os); c.rect(2, 2, 5, 1, C.fustaFosca); c.rect(2, 4, 8, 1, C.fusta); c.px(10, 2, C.sang); });
export const quadern = () => canvas(12, 10, (c) => { c.rect(0, 0, 12, 10, C.sangFosca); c.rect(1, 1, 10, 8, C.sang); c.rect(0, 4, 12, 1, C.fustaFosca); c.rect(4, 2, 4, 1, C.or); });
export const xal = () => canvas(18, 8, (c) => { c.poly([[0, 1], [17, 0], [15, 7], [2, 7]], C.blanc); for (let x = 1; x < 17; x += 3) c.px(x, 7, C.os); c.line(0, 1, 17, 0, C.plata); });
export const florsAll = () => canvas(14, 12, (c) => { for (const [x, y] of [[3, 3], [7, 1], [11, 3], [5, 6], [9, 6]]) { c.circle(x, y, 2, C.os); c.px(x, y, C.palla); } c.rect(6, 7, 2, 5, C.verdClar); c.rect(3, 9, 8, 3, C.fusta); });
export const tornavis = () => canvas(12, 4, (c) => { c.rect(0, 1, 5, 2, C.fusta); c.rect(5, 1, 7, 1, C.plata); c.px(11, 2, C.plata); });
export const estaca = () => canvas(16, 5, (c) => { c.rect(0, 1, 11, 3, C.fusta); c.poly([[11, 0], [16, 2], [11, 4]], C.palla); c.rect(0, 1, 11, 1, C.or); });
export const mall = () => canvas(12, 10, (c) => { c.rect(5, 3, 2, 7, C.fusta); c.rect(0, 0, 12, 4, C.grisMig); c.rect(0, 0, 12, 1, C.grisClar); });
export const hosties = () => canvas(12, 9, (c) => { c.rect(0, 2, 12, 7, C.or); c.rect(0, 2, 12, 1, C.palla); c.rect(5, 4, 2, 4, C.os); c.rect(4, 5, 4, 1, C.os); c.circle(6, 1, 1, C.blanc); });
export const clauPanteo = () => canvas(14, 6, (c) => { c.circle(2, 3, 2, C.or); c.px(2, 3, [0, 0, 0, 0]); c.rect(4, 2, 10, 2, C.or); c.rect(11, 4, 1, 2, C.or); c.rect(13, 4, 1, 2, C.or); });
export const clauCarfax = () => canvas(14, 6, (c) => { c.circle(2, 3, 2, C.fustaFosca); c.px(2, 3, [0, 0, 0, 0]); c.rect(4, 2, 10, 2, C.fusta); c.rect(12, 4, 2, 2, C.fusta); });
export const sucre = () => canvas(10, 9, (c) => { c.ellipse(5, 5, 4, 3, C.blanc); c.rect(1, 5, 9, 4, C.blanc); c.rect(1, 8, 9, 1, C.grisClar); c.rect(2, 2, 6, 2, C.os); c.rect(4, 0, 2, 2, C.plata); });
export const potVidre = () => canvas(8, 11, (c) => { c.rect(1, 2, 6, 9, C.grisMig); c.rect(2, 3, 4, 7, C.blauMig); c.rect(1, 0, 6, 2, C.fusta); c.px(2, 4, C.plata); });
export const mosca = () => canvas(8, 11, (c) => { c.rect(1, 2, 6, 9, C.grisMig); c.rect(2, 3, 4, 7, C.blauMig); c.rect(1, 0, 6, 2, C.fusta); c.rect(3, 6, 2, 2, C.negre); c.px(2, 5, C.plata); c.px(5, 5, C.plata); });
export const xiulet = () => canvas(10, 5, (c) => { c.rect(0, 1, 8, 3, C.plata); c.circle(7, 2, 2, C.plata); c.px(1, 2, C.grisMig); c.rect(0, 0, 2, 1, C.grisClar); });
export const llista = () => canvas(10, 12, (c) => { c.rect(0, 0, 10, 12, C.os); for (let y = 2; y < 11; y += 2) c.rect(1, y, 7, 1, C.fustaFosca); c.rect(0, 0, 10, 1, C.palla); });
export const rebut = () => canvas(10, 8, (c) => { c.rect(0, 0, 10, 8, C.palla); c.rect(1, 2, 6, 1, C.fustaFosca); c.rect(1, 4, 8, 1, C.fusta); c.circle(7, 6, 1, C.blauMig); });
export const bitlletsTren = () => canvas(14, 9, (c) => { c.rect(2, 0, 12, 7, C.palla); c.rect(0, 2, 12, 7, C.os); c.rect(1, 4, 6, 1, C.fustaFosca); c.rect(1, 6, 9, 1, C.fusta); c.px(10, 4, C.sang); });
export const ganivet = () => canvas(16, 6, (c) => { c.rect(0, 2, 5, 2, C.fustaFosca); c.rect(5, 1, 1, 4, C.or); c.poly([[6, 1], [13, 0], [16, 3], [12, 4], [6, 4]], C.plata); c.line(7, 2, 14, 1, C.blanc); });
export const telegrama = () => canvas(12, 9, (c) => { c.rect(0, 0, 12, 9, C.os); c.rect(0, 0, 12, 2, C.sang); for (let y = 4; y < 9; y += 2) c.rect(1, y, 9, 1, C.gris); });
export const albara = () => canvas(10, 12, (c) => { c.rect(0, 0, 10, 12, C.palla); c.rect(0, 0, 10, 1, C.or); for (let y = 2; y < 10; y += 2) c.rect(1, y, 7, 1, C.fusta); c.rect(5, 10, 4, 1, C.sang); });

// Caixes de terra apilades
export function caixes(n = 3, segellades = false) {
  const w = 22, c = new Canvas(w * Math.min(n, 3) + 2, n > 3 ? 30 : 16);
  for (let i = 0; i < n; i++) {
    const x = (i % 3) * w, y = i < 3 ? c.h - 15 : 0;
    c.rect(x + 1, y, w - 1, 15, C.fustaFosca); c.rect(x + 1, y, w - 1, 2, C.fusta); c.rect(x + 1, y + 7, w - 1, 1, C.fusta);
    for (let k = 0; k < 6; k++) c.px(x + 3 + k * 3, y + 1, C.negre);
    if (segellades) { c.rect(x + 9, y + 4, 4, 7, C.os); c.rect(x + 7, y + 6, 8, 2, C.os); }
  }
  return c;
}
// La caixa del comte, oberta, amb ell dormint a dins
export function caixaComte(ferit = false) {
  const c = new Canvas(40, 20);
  c.rect(0, 6, 40, 14, C.fustaFosca); c.rect(0, 6, 40, 2, C.fusta); c.rect(2, 8, 36, 4, C.negre);
  const f = E.estirada(E.LOOKS.dracula);
  c.draw(f, 4, 3);
  c.rect(30, 0, 9, 7, C.fusta);   // la tapa, recolzada
  if (ferit) { c.rect(10, 6, 3, 1, C.vermell); c.px(11, 7, C.sangViva); }
  return c;
}
// Un taüt (tancat, buit o amb la Lucy en pau)
export function taut(estat = "tancat") {
  const c = new Canvas(44, 16);
  c.poly([[0, 6], [8, 3], [44, 3], [44, 15], [8, 15], [0, 12]], C.fustaFosca);
  c.line(8, 3, 44, 3, C.fusta);
  if (estat === "tancat") { c.rect(22, 6, 2, 7, C.or); c.rect(19, 8, 8, 2, C.or); }
  else { c.poly([[2, 7], [9, 5], [42, 5], [42, 13], [9, 13], [2, 11]], C.negre); }
  if (estat === "pau") { const f = E.estirada(E.LOOKS.lucy); c.draw(f, 8, 0); c.rect(20, 5, 1, 3, C.fusta); }
  return c;
}
// La Lucy al llit (pàl·lida)
export function lucyLlit(morta = false) {
  const c = new Canvas(44, 22);
  c.rect(0, 10, 44, 9, C.os); c.rect(0, 18, 44, 4, C.fustaFosca); c.rect(0, 2, 4, 20, C.fustaFosca); c.rect(40, 6, 4, 16, C.fustaFosca);
  const f = E.estirada({ ...E.LOOKS.lucy, skin: morta ? "#b8bccb" : "#dcdbe0" });
  c.draw(f, 6, 4);
  c.rect(14, 12, 26, 6, C.blanc);   // el llençol
  if (!morta) { c.px(10, 10, C.sangViva); c.px(11, 10, C.sangViva); }
  return c;
}
// El capità del Demeter, lligat al timó
export function capitaMort() {
  const c = new Canvas(26, 34);
  c.circle(13, 13, 12, C.fusta); c.circle(13, 13, 9, [0, 0, 0, 0]);
  for (let a = 0; a < 8; a++) c.line(13, 13, 13 + Math.cos(a * Math.PI / 4) * 13, 13 + Math.sin(a * Math.PI / 4) * 13, C.fusta);
  const f = E.figura({ skin: "#8f97a8", hair: "#4c5266", beard: "#4c5266", cap: "#161427", shirt: "#2b2a48", pants: "#161427", shoes: "#07060b" }, 4);
  c.draw(f, 5, 2);
  c.line(4, 14, 22, 14, C.palla); c.line(4, 16, 22, 16, C.palla);   // les cordes
  return c;
}
// El gos negre (llop), assegut
export function gosNegre() {
  const c = new Canvas(18, 14);
  c.poly([[2, 13], [4, 5], [9, 3], [12, 0], [14, 1], [15, 4], [13, 6], [13, 13]], C.negre);
  c.rect(1, 12, 15, 2, C.negre); c.px(13, 2, C.vermell); c.rect(5, 6, 6, 7, C.fosc);
  return c;
}
// Rates, moltes
export function rates() {
  const c = new Canvas(60, 12), r = K.rng(9);
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(r() * 54), y = 3 + Math.floor(r() * 7);
    c.rect(x, y, 5, 3, C.fosc); c.px(x + 5, y + 1, C.fosc); c.px(x + 1, y, C.vermell); c.line(x - 3, y + 2, x, y + 2, C.gris);
  }
  return c;
}
export function foc() {
  const c = new Canvas(20, 18);
  c.rect(1, 15, 18, 3, C.fustaFosca); c.line(2, 17, 17, 13, C.fusta); c.line(2, 13, 17, 17, C.fusta);
  c.poly([[4, 15], [7, 6], [10, 10], [12, 2], [15, 15]], C.sangViva); c.poly([[7, 15], [10, 7], [13, 15]], C.palla); c.px(10, 13, C.os);
  return c;
}
// La carreta dels gitanos amb la caixa
export function carreta() {
  const c = new Canvas(56, 30);
  c.rect(4, 16, 48, 5, C.fustaFosca); c.circle(12, 24, 6, C.fusta); c.circle(12, 24, 3, C.fustaFosca); c.circle(44, 24, 6, C.fusta); c.circle(44, 24, 3, C.fustaFosca);
  c.rect(12, 4, 32, 12, C.fustaFosca); c.rect(12, 4, 32, 2, C.fusta); c.rect(12, 10, 32, 1, C.fusta);
  c.line(52, 18, 56, 16, C.fusta);
  return c;
}
// Tres tombes petites, segellades o amb les germanes en pau
export function tombesGermanes(pau = false) {
  const c = new Canvas(66, 16);
  for (let i = 0; i < 3; i++) {
    const x = i * 22;
    c.rect(x + 1, 4, 20, 12, C.grisMig); c.rect(x + 1, 4, 20, 2, C.plata); c.rect(x + 1, 14, 20, 2, C.gris);
    if (pau) { c.rect(x + 10, 6, 2, 7, C.os); c.rect(x + 8, 8, 6, 2, C.os); }
    else c.rect(x + 3, 3, 16, 1, C.negre);
  }
  return c;
}
// Les germanes (grup de tres figures)
export const germanes = () => E.grup([E.figura(E.LOOKS.germana, 4), E.figura(E.LOOKS.germanaFosca, 4), E.figura({ ...E.LOOKS.germana, hair: "#9e1a24" }, 4)], 3);
// El cotxer negre del pas del Borgo: una figura alta amb barret, sobre una calessa
export function calessa() {
  const c = new Canvas(46, 40);
  c.rect(2, 22, 40, 10, C.negre); c.rect(2, 22, 40, 1, C.gris); c.circle(10, 33, 6, C.fosc); c.circle(36, 33, 6, C.fosc); c.circle(10, 33, 3, C.negre); c.circle(36, 33, 3, C.negre);
  c.rect(20, 8, 20, 14, C.negre); c.rect(22, 11, 6, 6, C.sangFosca);
  const f = E.figura({ ...E.LOOKS.dracula, hat: "#07060b", beard: "#07060b", hair: "#07060b" }, 0);
  c.draw(f, 2, 0); c.px(13, 6, C.vermell);
  return c;
}
