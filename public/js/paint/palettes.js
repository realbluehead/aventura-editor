// Paletes clàssiques per dibuixar i per pixelar. Els colors van en hexadecimal, sense «#».
const parse = (s) => s.split(" ").map((h) => "#" + h);

export const PALETTES = [
  { id: "aventura", name: "Aventura (32 colors)", colors: parse(
    // La de l'editor: tons càlids de pedra, cel i vegetació, bons per a escenaris
    "000000 1a1c2c 3b2a2a 5d3a24 8a5a3b b98653 e0b07a f4dcb0 ffffff 2b2f45 4a5070 727a9a a3abc4 d3d8e6 " +
    "16321f 2f5a2f 4f8a3a 8fbf4f 1d3b5a 2f6aa0 4fa0d8 9ad8f0 5a1a24 a02a2a e0503a f0903a f8d050 " +
    "6a2a6a b05a9a f0a0c0 7a6a5a b0a090") },
  { id: "pico8", name: "PICO-8 (16)", colors: parse("000000 1d2b53 7e2553 008751 ab5236 5f574f c2c3c7 fff1e8 ff004d ffa300 ffec27 00e436 29adff 83769c ff77a8 ffccaa") },
  { id: "db32", name: "DawnBringer 32", colors: parse("000000 222034 45283c 663931 8f563b df7126 d9a066 eec39a fbf236 99e550 6abe30 37946e 4b692f 524b24 323c39 3f3f74 306082 5b6ee1 639bff 5fcde4 cbdbfc ffffff 9badb7 847e87 696a6a 595652 76428a ac3232 d95763 d77bba 8f974a 8a6f30") },
  { id: "endesga32", name: "Endesga 32", colors: parse("be4a2f d77643 ead4aa e4a672 b86f50 733e39 3e2731 a22633 e43b44 f77622 feae34 fee761 63c74d 3e8948 265c42 193c3e 124e89 0099db 2ce8f5 ffffff c0cbdc 8b9bb4 5a6988 3a4466 262b44 181425 ff0044 68386c b55088 f6757a e8b796 c28569") },
  { id: "ega", name: "EGA (16)", colors: parse("000000 0000aa 00aa00 00aaaa aa0000 aa00aa aa5500 aaaaaa 555555 5555ff 55ff55 55ffff ff5555 ff55ff ffff55 ffffff") },
  { id: "c64", name: "Commodore 64 (16)", colors: parse("000000 ffffff 68372b 70a4b2 6f3d86 588d43 352879 b8c76f 6f4f25 433900 9a6759 444444 6c6c6c 9ad284 6c5eb5 959595") },
  { id: "gameboy", name: "Game Boy (4)", colors: parse("0f380f 306230 8bac0f 9bbc0f") },
  { id: "grays", name: "Grisos (8)", colors: parse("000000 242424 484848 6d6d6d 919191 b6b6b6 dadada ffffff") },
];

export const paletteById = (id) => PALETTES.find((p) => p.id === id) ?? null;
