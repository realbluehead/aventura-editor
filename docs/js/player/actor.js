// Personatge provisional (fins que a la fase 5 hi hagi sprites) i la seva mida segons la profunditat.
// La mida es dona en píxels de la imatge: «near» és l'alçada a la part de baix de la zona caminable (a prop de la càmera)
// i «far» a la part de dalt (lluny). Entremig, es reparteix en línia recta.

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function walkableRange(scene) {
  const ys = scene.walkable.flat().map((p) => p[1]);
  return ys.length ? { minY: Math.min(...ys), maxY: Math.max(...ys) } : null;
}

// Si l'escenari no en té de definida: a prop fa un 30% de l'alçada de la imatge, i lluny s'encongeix
// com si l'horitzó fos a dalt de tot de la imatge
export function autoActorHeight(scene, imageHeight) {
  const near = Math.round(imageHeight * 0.3);
  const range = walkableRange(scene);
  if (!range || range.maxY <= 0) return { near, far: near };
  return { near, far: Math.round(near * clamp(range.minY / range.maxY, 0.4, 1)) };
}

// Funció y → alçada del personatge en aquest escenari
export function actorHeightAt(scene, imageHeight) {
  const { near, far } = scene.actorHeight ?? autoActorHeight(scene, imageHeight);
  const range = walkableRange(scene);
  if (!range || range.maxY <= range.minY) return () => near;
  return (y) => far + (near - far) * clamp((y - range.minY) / (range.maxY - range.minY), 0, 1);
}

// Dibuixa el personatge amb els peus a (x, y), en coordenades de la imatge.
// La figura fa 16 unitats d'alt; «step» és la fase del pas (radians) i «facing» 1 (dreta) o -1 (esquerra).
// «shirt» canvia el color de la camisa, per distingir personatges que encara no tenen sprites.
export function drawActor(ctx, { x, y, height, facing = 1, step = 0, shirt = "#f2efe6" }) {
  const u = height / 16;
  const swing = Math.sin(step);
  // Les posicions són per a la figura mirant a la dreta; mirant a l'esquerra s'emmirallen
  const part = (color, x0, y0, w, h) => {
    const left = facing === 1 ? x0 : -(x0 + w);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + left * u), Math.round(y + y0 * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(h * u)));
  };

  ctx.fillStyle = "rgba(0, 0, 0, .3)";
  ctx.beginPath();
  ctx.ellipse(x, y, 3 * u, Math.max(1, 0.7 * u), 0, 0, Math.PI * 2);
  ctx.fill();

  const s = swing * 0.9;
  part("#1f2a4d", -1.6 - s, -6, 1.5, 6);      // cama de darrere
  part("#3b2416", -1.6 - s, -0.8, 1.9, 0.8);
  part("#2b3a67", 0.1 + s, -6, 1.5, 6);       // cama del davant
  part("#3b2416", 0.1 + s, -0.8, 1.9, 0.8);
  part(shirt, -2, -12, 4, 6.2);               // camisa
  part("#6b4226", -2, -6.6, 4, 0.7);          // cinturó
  part("#e3ddd0", -0.5 - swing * 0.6, -11.5, 1.2, 4.8); // braç
  part("#e8b48a", -0.5 - swing * 0.6, -6.9, 1.2, 1);
  part("#e8b48a", -1.5, -15.5, 3.2, 3.6);     // cap
  part("#c9772b", -1.8, -16.3, 3.6, 1.3);     // cabell
  part("#c9772b", -1.8, -15.2, 1.1, 2.6);
  part("#1a1405", 0.8, -14.4, 0.6, 0.7);      // ull
}
