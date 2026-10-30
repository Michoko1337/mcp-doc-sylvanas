/**
 * Human inspection of the tool outputs.
 *   node tools/preview.mjs                # corpus coverage
 *   node tools/preview.mjs search "query" # search results
 *   node tools/preview.mjs api core.menu  # symbol lookup
 *   node tools/preview.mjs pitfalls       # curated notes
 */
import { buildIndex } from "../dist/lib/indexer.js";
import { SearchIndex } from "../dist/lib/search.js";
import { extractInsights } from "../dist/lib/insights.js";
import { DOCS_DIR } from "../dist/lib/paths.js";
import {
  formatCoverage,
  formatPitfalls,
  formatSearchResults,
  formatApiResults,
} from "../dist/lib/format.js";

const index = buildIndex(DOCS_DIR);
const search = new SearchIndex(index.chunks);
const insights = extractInsights();

const section = process.argv[2] || "coverage";

if (section === "coverage") {
  console.log(formatCoverage(index.pages, index.stats, index.frozenAt));
} else if (section === "pitfalls") {
  console.log(formatPitfalls(insights));
} else if (section === "search") {
  const q = process.argv[3] || "buff_manager duration";
  console.log(formatSearchResults(search.search(q, { limit: 4 }), q));
} else if (section === "api") {
  const sym = process.argv[3] || "core.menu";
  const key = sym.toLowerCase();
  const exact = index.symbols.dotted.has(key) ? [index.symbols.dotted.get(key)] : [];
  const methods = index.symbols.methods.has(key) ? [index.symbols.methods.get(key)] : [];
  console.log(
    formatApiResults(sym, {
      exact: exact.map((s) => ({ ...s, occurrences: s.occurrences.slice(0, 3) })),
      methods: methods.map((s) => ({ ...s, occurrences: s.occurrences.slice(0, 3) })),
      notesBySymbol: index.notesBySymbol,
      related: [],
    }),
  );
}
