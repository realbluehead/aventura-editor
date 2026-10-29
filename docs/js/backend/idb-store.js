// On guarda les aventures la versió web: a IndexedDB, al navegador de qui fa servir l'editor.
// Té la mateixa forma que el «store» de server.mjs (que les guarda en carpetes).

export function idbStore(name = "aventura-editor") {
  const db = new Promise((resolve, reject) => {
    const open = indexedDB.open(name, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore("adventures", { keyPath: "id" });
      open.result.createObjectStore("files");   // clau: «idAventura/nomFitxer»
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });

  // Una operació en una transacció; torna el resultat quan la transacció s'ha completat
  async function run(storeName, mode, fn) {
    const tx = (await db).transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = tx.onabort = () => reject(tx.error ?? new Error("No s'ha pogut desar al navegador"));
    });
  }

  const key = (id, file) => `${id}/${file}`;
  const filesOf = (id) => IDBKeyRange.bound(`${id}/`, `${id}/￿`);

  return {
    list: () => run("adventures", "readonly", (s) => s.getAll()),
    load: async (id) => (await run("adventures", "readonly", (s) => s.get(id))) ?? null,
    save: (a) => run("adventures", "readwrite", (s) => s.put(a)),
    async remove(id) {
      await run("adventures", "readwrite", (s) => s.delete(id));
      await run("files", "readwrite", (s) => s.delete(filesOf(id)));
    },
    putFile: (id, file, bytes) => run("files", "readwrite", (s) => s.put(bytes, key(id, file))),
    getFile: async (id, file) => (await run("files", "readonly", (s) => s.get(key(id, file)))) ?? null,
    removeFile: (id, file) => run("files", "readwrite", (s) => s.delete(key(id, file))),
    async files(id) {
      const [keys, values] = await Promise.all([
        run("files", "readonly", (s) => s.getAllKeys(filesOf(id))),
        run("files", "readonly", (s) => s.getAll(filesOf(id))),
      ]);
      return keys.map((k, i) => ({ name: k.slice(id.length + 1), data: values[i] }));
    },
  };
}
