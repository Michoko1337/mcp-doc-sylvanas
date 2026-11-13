/**
 * Development helper: inspects the index built by the server.
 *   node tools/inspect-symbols.mjs [filter]
 */
import { buildIndex } from "../dist/lib/indexer.js";
import { DOCS_DIR } from "../dist/lib/paths.js";

const idx = buildIndex(DOCS_DIR);
const filter = process.argv[2] || "";

const dotted = [...idx.symbols.dotted.values()].sort((a, b) => b.count - a.count);
const methods = [...idx.symbols.methods.values()].sort((a, b) => b.count - a.count);

console.log(
  `index: ${idx.stats.documents} pages · ${idx.stats.sections} sections · ` +
    `${idx.stats.chunks} chunks · ${idx.stats.symbols} symbols`,
);
console.log(`official pages mapped: ${idx.pages.length}`);

console.log(`\n--- qualified symbols (${dotted.length}) ---`);
for (const s of dotted.filter((x) => !filter || x.key.includes(filter.toLowerCase())).slice(0, 40)) {
  console.log(String(s.count).padStart(4), s.display);
}

console.log(`\n--- methods (${methods.length}) ---`);
for (const s of methods.filter((x) => !filter || x.key.includes(filter.toLowerCase())).slice(0, 30)) {
  console.log(String(s.count).padStart(4), s.display);
}
