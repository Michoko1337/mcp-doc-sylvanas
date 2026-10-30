#!/usr/bin/env node
/**
 * MCP server — Project Sylvanas knowledge base.
 *
 * Exposes the official developer documentation of docs.project-sylvanas.net
 * (bundled as one Markdown file per page under docs/pages/) as full-text
 * search, section reading, and an API symbol table.
 *
 * Transport: stdio. Never write to stdout (reserved for the protocol).
 */

import fs from "node:fs";

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { DOCS_DIR } from "./lib/paths.js";
import { buildIndex } from "./lib/indexer.js";
import { SearchIndex } from "./lib/search.js";
import { extractInsights } from "./lib/insights.js";
import { normalize } from "./lib/text.js";
import {
  formatApiResults,
  formatAvailability,
  formatCoverage,
  formatDocsList,
  formatPages,
  formatPitfalls,
  formatRead,
  formatSearchResults,
  formatSections,
  formatSymbolsList,
} from "./lib/format.js";
import type { CorpusIndex, Doc, DocSection, OfficialPage } from "./lib/types.js";

/* ------------------------------------------------------------------ */
/*  Loading the corpus                                                 */
/* ------------------------------------------------------------------ */

if (!fs.existsSync(DOCS_DIR)) {
  console.error(`[mcp-sylvanas] documentation directory not found: ${DOCS_DIR}`);
  process.exit(1);
}

const index: CorpusIndex = buildIndex(DOCS_DIR);
const search = new SearchIndex(index.chunks);
const insights = extractInsights();

console.error(
  `[mcp-sylvanas] ${index.stats.documents} pages · ${index.stats.sections} sections · ` +
    `${index.stats.chunks} chunks · ${index.stats.symbols} symbols`,
);

const rawCache = new Map<string, string>();
function readRaw(doc: Doc): string {
  if (!rawCache.has(doc.id)) {
    rawCache.set(doc.id, fs.readFileSync(doc.fullPath, "utf8"));
  }
  return rawCache.get(doc.id)!;
}

/* ------------------------------------------------------------------ */
/*  Target resolution                                                  */
/* ------------------------------------------------------------------ */

/** Finds a page by id, file name, or (fuzzy) title. */
function resolveDoc(query: string): { doc: Doc | null; candidates: Doc[] } {
  const q = String(query ?? "").trim().toLowerCase().replace(/\.md$/, "");
  if (!q) return { doc: null, candidates: [] };

  const exact = index.documents.find(
    (d) => d.id.toLowerCase() === q || d.file.toLowerCase().replace(/\.md$/, "") === q,
  );
  if (exact) return { doc: exact, candidates: [] };

  const startsWith = index.documents.filter(
    (d) => d.id.toLowerCase() === q.split("-")[0] || d.file.toLowerCase().replace(/\.md$/, "").startsWith(q),
  );
  if (startsWith.length === 1) return { doc: startsWith[0]!, candidates: [] };
  if (startsWith.length > 1) return { doc: null, candidates: startsWith };

  const slug = q.replace(/^\d{2}-/, "");
  const bySlug = index.documents.filter(
    (d) => d.file.toLowerCase().replace(/^\d{2}-/, "").replace(/\.md$/, "") === slug,
  );
  if (bySlug.length === 1) return { doc: bySlug[0]!, candidates: [] };

  const byTitle = index.documents.filter(
    (d) => d.title.toLowerCase().includes(q) || d.file.toLowerCase().includes(q),
  );
  if (byTitle.length === 1) return { doc: byTitle[0]!, candidates: [] };

  return { doc: null, candidates: byTitle };
}

function docPages(doc: Doc): OfficialPage[] {
  return index.pages.filter((p) => p.docId === doc.id);
}

/** Finds a section of a page (exact title, contains, or numeric index). */
function resolveSection(doc: Doc, sectionQuery: string): DocSection | null {
  const raw = String(sectionQuery ?? "").trim();
  if (!raw) return null;

  const numbered = /^(?:§\s*)?#?(\d+)$/.exec(raw);
  if (numbered) {
    const i = Number(numbered[1]) - 1;
    return doc.sections[i] ?? null;
  }

  const lower = raw.toLowerCase();
  const exact = doc.sections.find((s) => s.heading.toLowerCase() === lower);
  if (exact) return exact;

  const contains = doc.sections.filter((s) => s.heading.toLowerCase().includes(lower));
  if (contains.length) return contains[0]!;

  // Partial match on the heading path of chunks
  const chunk = doc.chunks.find((c) => c.headingPath.some((h) => h.toLowerCase().includes(lower)));
  if (chunk) {
    return doc.sections.find((s) => s.heading === chunk.sectionTitle) ?? null;
  }
  return null;
}

function sectionBody(doc: Doc, section: DocSection): string {
  const lines = readRaw(doc).split(/\r?\n/);
  return lines.slice(section.lineStart, section.lineEnd).join("\n").trim();
}

/* ------------------------------------------------------------------ */
/*  Server                                                             */
/* ------------------------------------------------------------------ */

const server = new McpServer(
  {
    name: "sylvanas-docs",
    version: "1.0.0",
  },
  {
    instructions:
      "Local knowledge base of Project Sylvanas (docs.project-sylvanas.net).\n" +
      "Use sylvanas_search to find an API, sylvanas_api for the signature of a function,\n" +
      "sylvanas_symbols for the inventory of a namespace, sylvanas_availability to know on which\n" +
      "client an API actually exists, sylvanas_read to read a whole section,\n" +
      "sylvanas_pitfalls for the verified gotchas of the official docs.",
  },
);

const text = (body: string): CallToolResult => ({ content: [{ type: "text", text: body }] });
const fail = (body: string): CallToolResult => ({ content: [{ type: "text", text: body }], isError: true });

/* --- Full-text search ------------------------------------------------ */

server.registerTool(
  "sylvanas_search",
  {
    title: "Search the Sylvanas docs",
    description:
      "Full-text search (BM25) across the developer documentation of Project Sylvanas " +
      "(core Lua API, IZI SDK, modules, menus, UI, combat, world/social, code examples). " +
      "Returns the most relevant sections with an excerpt and the read command to follow. " +
      "Ideal for: \"how to create a custom window\", \"buff_manager\", \"cast_safe\", \"write a plugin\".",
    inputSchema: {
      query: z.string().describe("Natural-language query or symbol name (e.g. \"cast_safe\", \"menu elements\")."),
      limit: z.number().int().min(1).max(25).optional().describe("Number of results (default 8)."),
      file: z
        .string()
        .optional()
        .describe("Restrict to one page (e.g. \"dev-api-spellbook\" or \"core\")."),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ query, limit = 8, file }) => {
    const docId = file ? resolveDoc(file).doc?.id : null;
    if (file && !docId) {
      return fail(
        `Page not found: "${file}". Available pages: ${index.documents.map((d) => d.id).join(", ")}`,
      );
    }
    const results = search.search(query, { limit, docId });
    return text(formatSearchResults(results, query));
  },
);

/* --- Read a page / section ------------------------------------------- */

server.registerTool(
  "sylvanas_read",
  {
    title: "Read a page or a section",
    description:
      "Reads the raw Markdown of a documentation page, or of one section. " +
      "Use after sylvanas_search to get the full content (code intact) of a section.",
    inputSchema: {
      file: z
        .string()
        .describe("Page to read: \"dev-api-spellbook\", \"dev-api-core\", \"dev-api-spellbook.md\"…"),
      section: z
        .string()
        .optional()
        .describe("Section title (or \"#3\" for the 3rd section of the page)."),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ file, section }) => {
    const { doc, candidates } = resolveDoc(file);
    if (!doc) {
      return fail(
        `Page not found: "${file}".\nCandidates: ${candidates.map((c) => `${c.id} (${c.title})`).join(", ") || "none"}`,
      );
    }
    const pages = docPages(doc);

    if (!section) {
      return text(formatRead(doc, readRaw(doc).trim(), { pages }));
    }

    const sec = resolveSection(doc, section);
    if (!sec) {
      return fail(
        `Section "${section}" not found in ${doc.file}.\nAvailable sections:\n${doc.sections
          .map((s, i) => `${i + 1}. ${s.heading}`)
          .join("\n")}`,
      );
    }
    return text(formatRead(doc, sectionBody(doc, sec), { section: sec.heading, pages }));
  },
);

/* --- API symbol table ------------------------------------------------ */

server.registerTool(
  "sylvanas_api",
  {
    title: "Signature of an API symbol",
    description:
      "Exact lookup of an API symbol in the Sylvanas docs; returns its occurrences " +
      "(call form, code, context). Handles qualified APIs (core.spell_book.cast_safe) " +
      "and methods called with \":\" (cast_safe, cooldown_remains, begin…). " +
      "Availability notes (which client, since which core) are attached to the occurrences.",
    inputSchema: {
      symbol: z
        .string()
        .describe("Symbol to look up, e.g. \"cast_safe\", \"core.spell_book.cast_safe\", \"core.menu\"."),
      limit: z.number().int().min(1).max(20).optional().describe("Number of occurrences (default 5)."),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ symbol, limit = 5 }) => {
    const key = normalize(symbol);
    const { dotted, methods, suffix } = index.symbols;

    const exact = dotted.has(key) ? [dotted.get(key)!] : [];
    const methodHits = methods.has(key) ? [methods.get(key)!] : [];

    const relatedKeys = new Set<string>(suffix.get(key) || []);
    for (const k of dotted.keys()) {
      if (k !== key && (k.startsWith(`${key}.`) || k.endsWith(`.${key}`))) {
        relatedKeys.add(k);
      }
    }
    for (const k of methods.keys()) {
      if (k !== key && (k.startsWith(key) || key.startsWith(k))) relatedKeys.add(k);
    }
    const related = [...relatedKeys]
      .map((k) => dotted.get(k) || methods.get(k))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    const body = formatApiResults(symbol, {
      exact: exact.map((s) => ({ ...s, occurrences: s.occurrences.slice(0, limit) })),
      methods: methodHits.map((s) => ({ ...s, occurrences: s.occurrences.slice(0, limit) })),
      notesBySymbol: index.notesBySymbol,
      related: related
        .map((s) => ({ ...s, occurrences: s.occurrences.slice(0, 1) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
    });
    return text(body);
  },
);

/* --- Symbol index by namespace ---------------------------------------- */

server.registerTool(
  "sylvanas_symbols",
  {
    title: "Symbol index by namespace",
    description:
      "Lists the API symbols indexed under a namespace — \"core.spell_book\", " +
      "\"core.input\", \"core.auction_house\"… Without a prefix, returns the map of all " +
      "namespaces with their symbol counts. This is the runtime inventory, not the prose: " +
      "for the signature and context of a symbol, use sylvanas_api(symbol).",
    inputSchema: {
      prefix: z
        .string()
        .optional()
        .describe("Namespace (e.g. \"core.spell_book\"). Without a value: the map of all namespaces."),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ prefix }) => {
    const body = formatSymbolsList({
      namespaces: index.namespaces,
      prefix: prefix ?? null,
      stats: index.stats,
    });
    return text(body);
  },
);

/* --- Availability notes ----------------------------------------------- */

server.registerTool(
  "sylvanas_availability",
  {
    title: "Availability and version notes",
    description:
      "What the site knows and a symbol index cannot render: on which clients an API " +
      "actually exists (Retail only, Classic only, Forever, private servers), since which " +
      "core version, and what happened before. Filterable by symbol or keyword " +
      "(e.g. \"2026-10-06\", \"cancel_buff\", \"Retail only\").",
    inputSchema: {
      query: z
        .string()
        .optional()
        .describe("Symbol or keyword to filter (e.g. \"cancel_buff\", \"2026-10-06\", \"Retail only\")."),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ query }) => {
    return text(formatAvailability(index.availability, { query: query ?? null }));
  },
);

/* --- Inventory -------------------------------------------------------- */

server.registerTool(
  "sylvanas_list",
  {
    title: "List pages, sections or official pages",
    description:
      "Inventory of the corpus: the bundled pages (sylvanas_list(\"files\")), " +
      "the sections of one page (sylvanas_list(\"sections\", file=\"dev-api-spellbook\")), " +
      "or the map of official site pages (sylvanas_list(\"pages\")).",
    inputSchema: {
      kind: z
        .enum(["files", "sections", "pages"])
        .optional()
        .describe("files (default) | sections | pages"),
      file: z.string().optional().describe("Page concerned (required for kind=\"sections\")."),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ kind = "files", file }) => {
    if (kind === "pages") return text(formatPages(index.pages));
    if (kind === "sections") {
      if (!file) return fail("The \"file\" parameter is required for kind=\"sections\".");
      const { doc, candidates } = resolveDoc(file);
      if (!doc) {
        return fail(
          `Page not found: "${file}". Candidates: ${candidates.map((c) => c.id).join(", ") || "none"}`,
        );
      }
      return text(formatSections(doc));
    }
    return text(formatDocsList(index.documents));
  },
);

/* --- Coverage ---------------------------------------------------------- */

server.registerTool(
  "sylvanas_coverage",
  {
    title: "Corpus coverage and freshness",
    description:
      "State of the corpus: how many official pages of docs.project-sylvanas.net are " +
      "bundled, the index statistics (sections, chunks, symbols, availability notes), " +
      "and the freeze date — the corpus is a snapshot, not a mirror, so the site may " +
      "have changed since.",
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async () => text(formatCoverage(index.pages, index.stats, index.frozenAt)),
);

/* --- Pitfalls ---------------------------------------------------------- */

server.registerTool(
  "sylvanas_pitfalls",
  {
    title: "Pitfalls and golden rules",
    description:
      "Curated community notes: the golden rules of the platform, the verified gotchas " +
      "of the official docs (get_local_player dot vs colon, specialization comparison, " +
      "cooldown vs cooldown_remains, check_los default, core.game_time units, " +
      "is_learned vs is_spell_learned, nil vs false), and general warnings. " +
      "Read before writing a plugin.",
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async () => text(formatPitfalls(insights)),
);

/* ------------------------------------------------------------------ */
/*  Resources                                                          */
/* ------------------------------------------------------------------ */

server.registerResource(
  "index",
  "sylvanas://index",
  {
    title: "Sylvanas corpus index",
    description: "JSON summary: pages, sections, symbols, statistics.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            docsDir: index.docsDir,
            builtAt: index.builtAt,
            frozenAt: index.frozenAt,
            stats: index.stats,
            documents: index.documents.map((d) => ({
              id: d.id,
              file: d.file,
              title: d.title,
              sections: d.sections.length,
              pages: docPages(d).map((p) => p.page),
            })),
            namespaces: Object.fromEntries(
              [...index.namespaces.entries()].map(([ns, list]) => [
                ns,
                list.map((s) => s.key),
              ]),
            ),
            pages: index.pages.map((p) => ({
              page: p.page,
              docId: p.docId,
              channel: p.channel,
            })),
          },
          null,
          2,
        ),
      },
    ],
  }),
);

server.registerResource(
  "coverage",
  "sylvanas://coverage",
  {
    title: "Documentation corpus coverage",
    description: "Official page map and corpus freshness.",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: formatCoverage(index.pages, index.stats, index.frozenAt),
      },
    ],
  }),
);

server.registerResource(
  "pitfalls",
  "sylvanas://pitfalls",
  {
    title: "Pitfalls and golden rules",
    description: "Curated community notes: golden rules, verified gotchas, warnings.",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: formatPitfalls(insights),
      },
    ],
  }),
);

// One resource per page: sylvanas://doc/<file>.md
for (const doc of index.documents) {
  server.registerResource(
    `doc-${doc.id}`,
    `sylvanas://doc/${doc.file}`,
    {
      title: `${doc.title}`,
      description: `${doc.file} — official docs page (raw Markdown).`,
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: readRaw(doc),
        },
      ],
    }),
  );
}

// Parameterized resource: sylvanas://raw/<id>
server.registerResource(
  "raw",
  new ResourceTemplate("sylvanas://raw/{id}", { list: undefined }),
  {
    title: "Raw page by id",
    description: "Raw Markdown of a page, by its id (dev-api-core, dev-api-spellbook…).",
    mimeType: "text/markdown",
  },
  async (uri, { id }) => {
    const pageId = Array.isArray(id) ? id[0] ?? "" : id;
    const { doc } = resolveDoc(pageId);
    if (!doc) throw new Error(`Unknown page: ${pageId}`);
    return {
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: readRaw(doc) }],
    };
  },
);

/* ------------------------------------------------------------------ */
/*  Prompt                                                             */
/* ------------------------------------------------------------------ */

server.registerPrompt(
  "sylvanas_quickstart",
  {
    title: "Project Sylvanas quickstart",
    description: "Starter context for writing a Project Sylvanas plugin.",
    argsSchema: {
      topic: z
        .string()
        .optional()
        .describe("Specific topic (e.g. \"menu\", \"combat\", \"custom UI\")."),
    },
  },
  async ({ topic }) => {
    const focus = topic
      ? `\nRequested topic: **${topic}**. Use sylvanas_search("${topic}") then sylvanas_read on the sections found.\n`
      : "\n";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `You are about to write a plugin for **Project Sylvanas** (Lua, docs.project-sylvanas.net).\n` +
              `The full knowledge base is available through this MCP server:\n` +
              `- sylvanas_search(query) — full-text search\n` +
              `- sylvanas_read(file, section) — read a whole section\n` +
              `- sylvanas_api(symbol) — exact signature of a symbol\n` +
              `- sylvanas_symbols(prefix) — inventory of a namespace (e.g. core.spell_book)\n` +
              `- sylvanas_availability(query) — on which client an API exists, since which core\n` +
              `- sylvanas_pitfalls() — verified gotchas of the official docs\n` +
              `- sylvanas_coverage() — corpus coverage and freshness\n` +
              focus +
              `\nGolden rules:\n` +
              insights.rules.map((r, i) => `${i + 1}. ${r}`).join("\n") +
              `\n\nStart with sylvanas_search before writing code, and verify every signature with sylvanas_api.` +
              `\nBefore depending on an API, check sylvanas_availability: a function may only exist on some clients.`,
          },
        },
      ],
    };
  },
);

/* ------------------------------------------------------------------ */
/*  Startup                                                            */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp-sylvanas] MCP server ready (stdio)");
}

// Self-test mode: node index.js --selftest [query]
if (process.argv.includes("--selftest")) {
  const query = process.argv.find((a) => !a.startsWith("--") && a !== process.argv[0] && a !== process.argv[1]);
  const out: string[] = [];
  out.push(`# Self-test — ${index.stats.documents} pages, ${index.stats.chunks} chunks, ${index.stats.symbols} symbols`);
  out.push("");
  out.push("## Search \"cast_safe\"");
  out.push(formatSearchResults(search.search("cast_safe", { limit: 3 }), "cast_safe"));
  out.push("## API \"core.spell_book.get_spell_charge\"");
  const sym = index.symbols.dotted.get("core.spell_book.get_spell_charge");
  out.push(sym ? `found: ${sym.count} occurrence(s)` : "not found");
  out.push("## Search \"custom window\"");
  out.push(formatSearchResults(search.search("custom window", { limit: 2 }), "custom window"));
  out.push("## Sections of dev-api-spellbook");
  const spellbook = index.documents.find((d) => d.id === "dev-api-spellbook");
  out.push(spellbook ? spellbook.sections.slice(0, 20).map((s) => `- ${s.heading}`).join("\n") : "page dev-api-spellbook missing");
  out.push("## Pitfalls");
  out.push(formatPitfalls(insights).slice(0, 1200));
  if (query) {
    out.push(`## Search "${query}"`);
    out.push(formatSearchResults(search.search(query, { limit: 3 }), query));
  }
  process.stdout.write(out.join("\n"));
} else {
  main().catch((err: unknown) => {
    console.error("[mcp-sylvanas] fatal error:", err);
    process.exit(1);
  });
}
