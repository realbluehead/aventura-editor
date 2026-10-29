// So del reproductor: una música que es repeteix i efectes que sonen una vegada.
// Els navegadors no deixen sonar res fins que el jugador ha fet algun clic: si la música no pot començar,
// es torna a provar amb el següent clic (unlock).

export function createAudio(adventure, urlFor) {
  const sounds = new Map((adventure.sounds ?? []).map((s) => [s.id, s]));
  let music = null, musicId = null, muted = false, blocked = false;

  const tryPlay = (el) => el.play().then(() => { blocked = false; }).catch(() => { blocked = true; });

  return {
    // La mateixa música que ja sona continua; null l'atura
    music(id) {
      if (id === musicId) return;
      musicId = id;
      music?.pause();
      music = null;
      const s = sounds.get(id);
      if (!s) return;
      music = new Audio(urlFor(s.file));
      music.loop = true;
      music.volume = 0.5;
      music.muted = muted;
      tryPlay(music);
    },
    sound(id) {
      const s = sounds.get(id);
      if (!s || muted) return;
      const a = new Audio(urlFor(s.file));
      a.volume = 0.9;
      a.play().catch(() => {});
    },
    unlock() {
      if (blocked && music) tryPlay(music);
    },
    setMuted(on) {
      muted = on;
      if (music) music.muted = on;
    },
    stop() {
      music?.pause();
      music = null;
      musicId = null;
    },
    get musicId() { return musicId; },
  };
}
