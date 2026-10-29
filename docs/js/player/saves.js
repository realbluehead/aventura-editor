// Les partides desades: unes quantes ranures al navegador de qui juga (localStorage), una llista per aventura.
// Si el navegador no deixa guardar res (navegació privada…), les funcions ho diuen en lloc de petar.

export const SLOTS = 5;

export function createSaves(adventureId, storage = globalThis.localStorage) {
  const key = `aventura-partides:${adventureId}`;
  function read() {
    try {
      const list = JSON.parse(storage.getItem(key));
      return Array.from({ length: SLOTS }, (_, i) => list?.[i] ?? null);
    } catch {
      return Array(SLOTS).fill(null);
    }
  }
  function write(list) {
    try {
      storage.setItem(key, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  }
  return {
    list: read,
    // Retorna false si no s'ha pogut guardar
    save(slot, data) {
      const list = read();
      list[slot] = { ...data, savedAt: new Date().toISOString() };
      return write(list);
    },
    remove(slot) {
      const list = read();
      list[slot] = null;
      return write(list);
    },
    any: () => read().some(Boolean),
  };
}
