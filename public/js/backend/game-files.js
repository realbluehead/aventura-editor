// Els fitxers del joc exportat (index.html, el reproductor, les dades i els fitxers de l'aventura), comuns al
// servidor local i a la versió web. No fa servir res de Node: els fitxers són Uint8Array.

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const GAME_JS = `
const { createPlayer } = window.AventuraPlayer;
const adventure = window.ADVENTURE;
const player = createPlayer(document.querySelector(".play-stage"), adventure, {
  imageUrl: (file) => "files/" + encodeURIComponent(file),
  startSceneId: adventure.startSceneId ?? adventure.scenes[0]?.id,
  title: true,
});
// Maj+M silencia el so (les lletres soles són les dreceres dels verbs)
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m" && e.shiftKey && !e.metaKey && !e.ctrlKey) player.setMuted(!player.isMuted());
});
`;

function gameHtml(adventure) {
  const title = escapeHtml(adventure.title);
  return `<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="player.css">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; height: 100vh; height: 100dvh; overflow: hidden; display: flex; flex-direction: column; background: #000; }
</style>
</head>
<body>
<div class="play-stage"></div>
<script src="adventure.js"></script>
<script src="game.js"></script>
</body>
</html>
`;
}

const README = (adventure) => `${adventure.title}
${"=".repeat(adventure.title.length)}

Per jugar: obre index.html amb el navegador.
Per penjar-lo a internet: puja tota aquesta carpeta (index.html, game.js, adventure.js, player.css i files/) a qualsevol web.
Les partides es desen al navegador de qui juga.

Per tornar a editar-la: a l'Editor d'aventures, «Importa» aquest mateix zip.
`;

const encode = (s) => new TextEncoder().encode(s);

// Tots els fitxers del zip d'una aventura. «files» són els fitxers de l'aventura (imatges i sons): [{ name, data }].
// «player» és el reproductor ja empaquetat en un script (text) i «css», els seus estils.
export function gameEntries(adventure, files, { player, css }) {
  return [
    { name: "index.html", data: encode(gameHtml(adventure)) },
    { name: "game.js", data: encode(player + GAME_JS) },
    { name: "adventure.js", data: encode(`window.ADVENTURE = ${JSON.stringify(adventure)};\n`) },
    { name: "adventure.json", data: encode(JSON.stringify(adventure, null, 2) + "\n") },
    { name: "player.css", data: typeof css === "string" ? encode(css) : css },
    { name: "LLEGEIX-ME.txt", data: encode(README(adventure)) },
    ...files.map((f) => ({ name: `files/${f.name}`, data: f.data })),
  ];
}

// Un nom de fitxer per al zip a partir del títol: «El secret de l'illa» → «el-secret-de-l-illa.zip»
export const zipName = (title) =>
  `${title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aventura"}.zip`;
