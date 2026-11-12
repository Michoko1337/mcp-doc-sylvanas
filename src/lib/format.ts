/** Text rendering of tool results (compact, model-readable Markdown). */

import type {
  AvailabilityNote,
  CorpusStats,
  Doc,
  Insights,
  NamespaceMember,
  OfficialPage,
  SearchResult,
  SymbolEntry,
  SymbolOccurrence,
} from "./types.js";

const truncate = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n)}…` : s);

const SOURCE = "https://docs.project-sylvanas.net";
const CODE_FENCE = "```";

/** Wraps a value in Markdown inline code. */
const code = (s: string): string => `\`${s}\``;

export function formatSearchResults(results: SearchResult[], query: string): string {
  if (!results.length) {
    return `No results for "${query}".\n\nTip: sylvanas_api("function_name") for a precise function, sylvanas_list() for the page inventory.`;
  }

  const lines = [`## ${results.length} result(s) for "${query}"`, ""];

  results.forEach((r, i) => {
    const c = r.chunk;
    const path = c.headingPath.filter(Boolean).join(" › ");
    const tail = path && path !== c.sectionTitle ? ` › ${path.split(" › ").slice(1).join(" › ")}` : "";
    lines.push(`### ${i + 1}. ${c.sectionTitle}${tail}`);
    const meta = [code(c.file), `score ${r.score}`];
    if (r.hits?.length) meta.push(`matches: ${r.hits.join(", ")}`);
    lines.push(meta.join(" · "));
    lines.push("");
    if (r.snippet) {
      lines.push(r.snippet);
      lines.push("");
    }
    lines.push(`→ \`sylvanas_read(file="${c.docId}", section="${c.sectionTitle}")\``);
    lines.push("");
  });

  return lines.join("\n");
}

export function formatRead(
  doc: Doc,
  body: string,
  { section = null, pages = [] }: { section?: string | null; pages?: OfficialPage[] } = {},
): string {
  const header = [
    `# ${doc.title}`,
    "",
    `**Page**: ${code(doc.file)}${section ? ` · **Section**: ${section}` : ""}`,
  ];
  if (pages.length) {
    header.push(`**Source**: ${pages.map((p) => `<${SOURCE}${p.page}>`).join(", ")}`);
  }
  header.push("");
  return `${header.join("\n")}\n${body}`;
}

export function formatApiResults(
  query: string,
  {
    exact,
    related,
    methods,
    notesBySymbol = null,
  }: {
    exact: SymbolEntry[];
    methods: SymbolEntry[];
    related: SymbolEntry[];
    notesBySymbol?: Map<string, AvailabilityNote[]> | null;
  },
): string {
  const lines = [`# API "${query}"`, ""];

  /** Notes attached to the symbol: from the chunk + any that mention it. */
  const notesFor = (sym: SymbolEntry, occ: SymbolOccurrence): { note: string; where: string }[] => {
    const out: { note: string; where: string }[] = [];
    const push = (n: string, where: string) => {
      if (!n) return;
      if (out.some((x) => x.note === n)) return;
      out.push({ note: n, where });
    };
    for (const n of occ.notes) push(n, occ.file);
    for (const entry of notesBySymbol?.get(sym.key) ?? []) {
      push(entry.note, entry.file);
    }
    return out;
  };

  const pushCode = (codeText: string) => {
    lines.push("", `${CODE_FENCE}lua`, codeText.trimEnd(), CODE_FENCE);
  };

  if (exact.length) {
    lines.push(`## Exact match — ${exact.length} symbol(s)`, "");
    for (const sym of exact) {
      lines.push(`### ${code(sym.display)} — ${sym.count} occurrence(s)`);
      for (const occ of sym.occurrences.slice(0, 5)) {
        lines.push("");
        lines.push(`**${occ.file}** › ${occ.headingPath.join(" › ")}`);
        if (occ.code || occ.line) pushCode(occ.code ?? occ.line);
        if (occ.prose) {
          lines.push("");
          lines.push(truncate(occ.prose, 700));
        }
        const notes = notesFor(sym, occ);
        if (notes.length) {
          lines.push("");
          lines.push("**⚙️ Availability / version**");
          for (const n of notes) {
            lines.push(`- ${n.note}${n.where ? ` _(source: ${n.where})_` : ""}`);
          }
        }
        lines.push("");
        lines.push(`→ \`sylvanas_read(file="${occ.docId}", section="${occ.sectionTitle}")\``);
      }
      lines.push("");
    }
  }

  if (methods.length) {
    lines.push(`## Matching methods — ${methods.length}`, "");
    for (const sym of methods) {
      const occ = sym.occurrences[0]!;
      lines.push(`- ${code(sym.display)} (${sym.count}×) — ${occ.file} › ${occ.headingPath.join(" › ")}`);
      if (occ.line) {
        lines.push(`  ${CODE_FENCE}lua`);
        lines.push(`  ${occ.line}`);
        lines.push(`  ${CODE_FENCE}`);
      }
      const notes = notesFor(sym, occ);
      if (notes.length) {
        lines.push("");
        lines.push("  **⚙️ Availability / version**");
        for (const n of notes) {
          lines.push(`  - ${n.note}${n.where ? ` _(source: ${n.where})_` : ""}`);
        }
      }
    }
    lines.push("");
  }

  if (related.length) {
    lines.push(`## Related symbols — ${related.length}`, "");
    for (const sym of related.slice(0, 20)) {
      const occ = sym.occurrences[0]!;
      lines.push(`- ${code(sym.display)} (${sym.count}×) — ${occ.file} › ${occ.headingPath.join(" › ")}`);
    }
    lines.push("");
  }

  if (!exact.length && !methods.length && !related.length) {
    lines.push(
      `No symbol matches "${query}".\n\nTip: sylvanas_search("${query}") to search the prose, or sylvanas_list("sections") to browse sections.`,
    );
  }

  return lines.join("\n");
}

export function formatDocsList(documents: Doc[]): string {
  const lines = [
    "# Project Sylvanas knowledge base",
    "",
    `${documents.length} Markdown pages, fetched from docs.project-sylvanas.net.`,
    "",
    "| File | Title | Sections | Source page |",
    "|---|---|---|---|",
  ];
  for (const d of documents) {
    const pages = d.pages?.length ? d.pages.map((p) => p.page).join(", ") : "—";
    lines.push(`| ${code(d.id)} | ${d.title} | ${d.sections.length} | ${pages} |`);
  }
  return lines.join("\n");
}

export function formatSections(doc: Doc): string {
  const lines = [`# ${doc.title} — ${doc.file}`, "", `${doc.sections.length} sections.`, ""];
  doc.sections.forEach((s, i) => {
    lines.push(`${i + 1}. **${s.heading}** (lines ${s.lineStart + 1}–${s.lineEnd})`);
  });
  lines.push("");
  lines.push(`→ \`sylvanas_read(file="${doc.id}", section="<title>")\``);
  return lines.join("\n");
}

export function formatPages(pages: OfficialPage[]): string {
  const lines = ["| Official page | File | Title |", "|---|---|---|"];
  for (const p of pages) {
    lines.push(`| ${code(p.page)} | ${p.docId ? code(p.docId) : "—"} | ${p.label || ""} |`);
  }
  return lines.join("\n");
}

export function formatCoverage(pages: OfficialPage[], stats: CorpusStats, frozenAt: string | null = null): string {
  const lines = [
    "# Sylvanas documentation corpus",
    "",
    `**${pages.length || stats.documents} official pages** · ${stats.documents} files · ${stats.sections} sections · ${stats.chunks} indexed chunks · ${stats.symbols} symbols`,
    "",
    `Every page of docs.project-sylvanas.net is present in full (HTML-converted corpus, code intact).`,
    "",
  ];

  if (frozenAt) {
    lines.push(
      `**Frozen on ${frozenAt}** — the corpus is a snapshot, not a mirror: the site may have changed since.`,
      "",
      "> To refresh: `npm run fetch-docs -- --diff` to preview, `npm run fetch-docs -- --refresh` to rebuild, then run `npm test` and commit.",
      "",
    );
  } else {
    lines.push(
      "> No manifest found: this corpus carries no freeze date (custom corpus installed via SYLVANAS_DOCS_DIR?).",
      "",
    );
  }

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Symbol index by namespace                                          */
/* ------------------------------------------------------------------ */

export function formatSymbolsList({
  namespaces,
  prefix,
  stats,
}: {
  namespaces: Map<string, NamespaceMember[]>;
  prefix: string | null;
  stats: CorpusStats;
}): string {
  const lines = ["# API symbol index", ""];

  if (!prefix) {
    lines.push(
      `${stats.symbols} indexed symbols across **${namespaces.size} namespaces**.`,
      "",
      "| Namespace | Symbols |",
      "|---|---|",
    );
    const sorted = [...namespaces.entries()].sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
    );
    for (const [ns, list] of sorted) {
      lines.push(`| ${code(ns)} | ${list.length} |`);
    }
    lines.push("");
    lines.push('→ `sylvanas_symbols(prefix="core.spell_book")` for the full list of one namespace.');
    return lines.join("\n");
  }

  const key = prefix.trim().toLowerCase();
  const list = namespaces.get(key);
  if (!list) {
    const near = [...namespaces.keys()]
      .filter((k) => k.includes(key) || key.includes(k))
      .slice(0, 12);
    lines.push(`No namespace "${prefix}".`, "");
    lines.push(
      near.length
        ? `Nearby namespaces: ${near.map(code).join(", ")}`
        : `Available namespaces: ${[...namespaces.keys()].slice(0, 15).map(code).join(", ")}`,
    );
    return lines.join("\n");
  }

  lines.push(`## ${code(prefix)} — ${list.length} symbol(s)`, "", "| Symbol | Occurrences |", "|---|---|");
  for (const s of list) lines.push(`| ${code(s.display)} | ${s.count} |`);
  lines.push("");
  lines.push('→ `sylvanas_api(symbol="…")` for the signature and context of a symbol.');
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Availability notes                                                 */
/* ------------------------------------------------------------------ */

export function formatAvailability(notes: AvailabilityNote[], { query = null }: { query?: string | null } = {}): string {
  const lines = ["# Availability & version notes", ""];

  if (query) {
    const q = query.toLowerCase();
    const hits = notes.filter(
      (n) =>
        n.note.toLowerCase().includes(q) ||
        n.symbols.dotted.some((s) => s.toLowerCase().includes(q)) ||
        n.symbols.methods.some((s) => s.toLowerCase().includes(q)) ||
        n.headingPath.some((h) => h.toLowerCase().includes(q)),
    );
    if (!hits.length) {
      lines.push(`No availability note mentions "${query}".`);
      return lines.join("\n");
    }
    lines.push(`${hits.length} note(s) for "${query}".`, "");
    for (const n of hits) {
      lines.push(`- ⚙️ ${n.note}`);
      lines.push(`  — ${n.file} › ${n.headingPath.filter(Boolean).join(" › ")}`);
    }
    return lines.join("\n");
  }

  const byFile = new Map<string, AvailabilityNote[]>();
  for (const n of notes) {
    if (!byFile.has(n.file)) byFile.set(n.file, []);
    byFile.get(n.file)!.push(n);
  }

  lines.push(
    `${notes.length} availability notes in the corpus.`,
    "",
    "These sentences say **on which clients** an API actually exists and **since which core version** —",
    "the one thing a symbol index cannot render.",
    "",
  );

  for (const [file, list] of [...byFile.entries()].sort()) {
    lines.push(`## ${code(file)} — ${list.length} note(s)`, "");
    for (const n of list) {
      lines.push(`- ⚙️ ${n.note}`);
      lines.push(`  — ${n.headingPath.filter(Boolean).join(" › ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function formatPitfalls(insights: Insights): string {
  const lines = ["# Pitfalls & golden rules — Project Sylvanas", ""];

  if (!insights.installed) {
    lines.push(
      "No curated notes are installed for this corpus (docs/pitfalls.md is absent).",
      "",
      "The official pages remain fully searchable via sylvanas_search / sylvanas_read.",
    );
    return lines.join("\n");
  }

  if (insights.rules?.length) {
    lines.push(`## The ${insights.rules.length} golden rules`, "");
    insights.rules.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
    lines.push("");
  }

  if (insights.contradictions?.length) {
    lines.push(`## ${insights.contradictions.length} verified gotchas in the official docs`, "");
    for (const c of insights.contradictions) {
      lines.push(`### ${c.heading}`, "");
      lines.push(c.body);
      lines.push("");
    }
  }

  if (insights.warnings?.length) {
    lines.push("## Warnings", "");
    for (const w of insights.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  return lines.join("\n");
}
