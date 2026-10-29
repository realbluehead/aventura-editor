// Accés a l'API: el servidor local, o el service worker a la versió web. Les adreces són relatives
// perquè la versió web pot viure en una subcarpeta (a GitHub Pages, /aventura-editor/).

export async function request(method, url, body, type = "application/json") {
  const isJson = body !== undefined && type === "application/json";
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "content-type": type } : undefined,
    body: isJson ? JSON.stringify(body) : body,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const adventureUrl = (id) => `api/adventures/${id}`;
export const scenesUrl = (adventureId) => `api/adventures/${adventureId}/scenes`;
export const sceneUrl = (adventureId, sceneId) => `${scenesUrl(adventureId)}/${sceneId}`;
export const imageUrl = (adventureId, file) => `files/${adventureId}/${encodeURIComponent(file)}`;

// Desa una aventura sense tocar els escenaris (el servidor només accepta aquests camps)
export const saveAdventure = (a, changes = {}) =>
  request("PUT", adventureUrl(a.id), { title: a.title, description: a.description, ...changes });

// Desa un escenari: el nom i la descripció sempre, i la resta de camps només si es passen
export const saveScene = (adventureId, s, changes = {}) =>
  request("PUT", sceneUrl(adventureId, s.id), { name: s.name, description: s.description, ...changes });
