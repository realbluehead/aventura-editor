// Sons i músiques sintetitzats en WAV (mono, 16 bits, 22 050 Hz): ones quadrades i triangulars com els jocs de 8 bits.
const RATE = 22050;

const freq = (note) => {
  // «C4», «F#5»… a hertzs
  const m = note.match(/^([A-G])(#|b)?(\d)$/);
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return 440 * 2 ** ((base + (Number(m[3]) - 4) * 12) / 12);
};

const waves = {
  square: (t) => (t % 1 < 0.5 ? 1 : -1),
  pulse: (t) => (t % 1 < 0.25 ? 1 : -1),
  triangle: (t) => 1 - 4 * Math.abs((t % 1) - 0.5),
  sine: (t) => Math.sin(t * 2 * Math.PI),
};

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32000), 44 + i * 2);
  return buf;
}

// Afegeix una nota a la mescla. «at» i «dur» en segons.
function note(mixBuf, at, dur, hz, { wave = "square", vol = 0.2, decay = 3 } = {}) {
  const start = Math.round(at * RATE), len = Math.round(dur * RATE);
  for (let i = 0; i < len && start + i < mixBuf.length; i++) {
    const t = i / RATE;
    const env = Math.min(1, i / 60) * Math.exp(-t * decay) * Math.min(1, (len - i) / 200);
    mixBuf[start + i] += waves[wave](t * hz) * vol * env;
  }
}

// Una cançó: veus amb notes «C4:1» (nota:temps) o «-:1» (silenci), a «bpm» negres per minut
function song(bpm, voices, loops = 1) {
  const beat = 60 / bpm;
  const length = Math.max(...voices.map((v) => v.notes.trim().split(/\s+/).reduce((s, n) => s + Number(n.split(":")[1]), 0))) * beat;
  const out = new Float32Array(Math.ceil(length * loops * RATE) + 10);
  for (let l = 0; l < loops; l++) {
    for (const v of voices) {
      let t = l * length;
      for (const n of v.notes.trim().split(/\s+/)) {
        const [name, beats] = n.split(":");
        const d = Number(beats) * beat;
        if (name !== "-") note(out, t, d * 0.95, freq(name), v);
        t += d;
      }
    }
  }
  return wav(out);
}

// Tema principal: una melodia alegre en Re major, com una sardana de 8 bits
export const temaPrincipal = () => song(132, [
  { wave: "pulse", vol: 0.16, decay: 1.5, notes: `
    D5:1 F#5:1 A5:1 F#5:1 G5:1 E5:1 C#5:2
    D5:1 E5:1 F#5:1 G5:1 A5:2 -:2
    B5:1 A5:1 G5:1 F#5:1 E5:1 G5:1 F#5:1 E5:1
    D5:1 C#5:1 E5:1 C#5:1 D5:2 -:2` },
  { wave: "triangle", vol: 0.3, decay: 1, notes: `
    D3:2 A3:2 G3:2 A3:2 D3:2 A3:2 F#3:2 A3:2
    G3:2 D3:2 E3:2 A3:2 B2:2 A3:2 D3:4` },
], 2);

// Música de carrer: més tranquil·la, en Sol major
export const musicaCarrer = () => song(108, [
  { wave: "square", vol: 0.1, decay: 1.2, notes: `
    G4:1 B4:1 D5:2 C5:1 B4:1 A4:2 B4:1 C5:1 D5:1 E5:1 D5:4
    E5:1 D5:1 C5:1 B4:1 A4:1 B4:1 G4:2 A4:1 B4:1 A4:1 F#4:1 G4:4` },
  { wave: "triangle", vol: 0.28, decay: 0.8, notes: `
    G2:2 D3:2 C3:2 D3:2 G2:2 D3:2 G2:2 D3:2
    C3:2 G2:2 D3:2 G2:2 C3:2 D3:2 G2:4` },
], 2);

// Música del final, solemne i lluminosa
export const musicaFinal = () => song(96, [
  { wave: "pulse", vol: 0.15, decay: 0.9, notes: `
    D5:2 F#5:1 A5:1 D6:3 A5:1 B5:2 A5:1 G5:1 F#5:4
    G5:2 F#5:1 E5:1 D5:2 E5:1 F#5:1 E5:2 D5:1 C#5:1 D5:4` },
  { wave: "triangle", vol: 0.3, decay: 0.6, notes: `
    D3:4 D3:4 G3:4 D3:4 G3:4 D3:4 A3:4 D3:4` },
]);

// Efectes
export const sMoneda = () => {
  const out = new Float32Array(Math.round(0.35 * RATE));
  note(out, 0, 0.08, freq("B5"), { wave: "square", vol: 0.25, decay: 4 });
  note(out, 0.08, 0.27, freq("E6"), { wave: "square", vol: 0.25, decay: 8 });
  return wav(out);
};

export const sClic = () => {
  const out = new Float32Array(Math.round(0.12 * RATE));
  note(out, 0, 0.04, 1200, { wave: "square", vol: 0.25, decay: 40 });
  note(out, 0.05, 0.06, 700, { wave: "square", vol: 0.2, decay: 40 });
  return wav(out);
};

export const sAigua = () => {
  // un xiuxiueig de soroll que s'apaga, com l'aigua de la font aturant-se
  const out = new Float32Array(Math.round(1.2 * RATE));
  let s = 7;
  for (let i = 0; i < out.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const t = i / RATE;
    out[i] = ((s / 0x7fffffff) * 2 - 1) * 0.25 * Math.exp(-t * 2.5) * Math.min(1, i / 400);
  }
  note(out, 0, 0.6, 180, { wave: "sine", vol: 0.2, decay: 4 });
  return wav(out);
};

export const sBus = () => {
  // el clàxon del bus: dues notes
  const out = new Float32Array(Math.round(0.7 * RATE));
  note(out, 0, 0.25, 330, { wave: "square", vol: 0.18, decay: 1 });
  note(out, 0, 0.25, 415, { wave: "square", vol: 0.12, decay: 1 });
  note(out, 0.32, 0.35, 330, { wave: "square", vol: 0.18, decay: 1 });
  note(out, 0.32, 0.35, 415, { wave: "square", vol: 0.12, decay: 1 });
  return wav(out);
};

export const sExit = () => {
  // arpegi d'aconseguir una cosa
  const out = new Float32Array(Math.round(0.6 * RATE));
  ["C5", "E5", "G5", "C6"].forEach((n, i) => note(out, i * 0.09, 0.3, freq(n), { wave: "pulse", vol: 0.2, decay: 5 }));
  return wav(out);
};
