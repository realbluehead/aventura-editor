import { search } from "../../../skills/aventura-grafica/scripts/commons.mjs";
const Q = JSON.parse(process.argv[2]);
for (const [id, q] of Object.entries(Q)) {
  let r = [];
  try { r = (await search(q, { limit: 14 })).filter((x) => x.size[0] / x.size[1] >= 1.2).slice(0, 5); } catch (e) { console.log(id, "ERR", e.message); continue; }
  console.log(`## ${id} «${q}»`);
  for (const x of r) console.log(`  ${x.title.slice(5, 95)} | ${x.size.join("x")} | ${x.license}`);
}
