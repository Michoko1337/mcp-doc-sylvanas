# mcp-sylvanas

[![Node](https://img.shields.io/badge/node-%E2%89%A518-339933)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-007EC6)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-protocol%20e2e-2ea44f)](tools/protocol-test.mjs)

A local **MCP server** that exposes the **official Project Sylvanas developer
documentation** ([docs.project-sylvanas.net](https://docs.project-sylvanas.net))
to AI agents: full-text search, section reading, an API symbol table, a
namespace inventory, and availability notes.

The whole site — **118 pages** — is bundled in the repository as a Markdown
corpus (`docs/pages/`), converted from the rendered pages so code blocks,
tables and admonitions keep their real structure. Clone, install, run: no
external service, no network access at runtime.

- **Transport**: stdio
- **Runtime**: Node.js ≥ 18 (tested on Node 22)
- **Dependency**: `@modelcontextprotocol/sdk` only
- **Index**: rebuilt at every startup (~1 s) — no cache to invalidate

## The 8 tools

| Tool | Role |
|---|---|
| `sylvanas_search(query, limit?, file?)` | BM25 full-text search. Returns the relevant sections, an excerpt, and the read command to follow. |
| `sylvanas_read(file, section?)` | Raw Markdown of a page or a section (code intact). |
| `sylvanas_api(symbol, limit?)` | Exact lookup of an API symbol: occurrences, call form, code, context, **availability notes**. Handles `core.spell_book.cast_safe` **and** bare `cast_safe`. |
| `sylvanas_symbols(prefix?)` | Symbol inventory of a namespace (`core.spell_book`, `core.input`…). Without a prefix: the map of all namespaces. |
| `sylvanas_availability(query?)` | **Version notes**: on which client an API exists, since which core. Filterable (`cancel_buff`, `2026-10-06`, `Retail only`). |
| `sylvanas_list(kind?, file?)` | Inventory: `files` (the bundled pages), `sections` (sections of a page), `pages` (the official site page map). |
| `sylvanas_coverage()` | Corpus state: page count, index statistics, freeze date. |
| `sylvanas_pitfalls()` | Curated community notes: golden rules, verified gotchas of the official docs, warnings. |

### Resources

| URI | Content |
|---|---|
| `sylvanas://index` | JSON summary of the index (pages, sections, namespaces, statistics). |
| `sylvanas://coverage` | Corpus coverage as Markdown. |
| `sylvanas://pitfalls` | Golden rules and verified gotchas. |
| `sylvanas://doc/<file>.md` | Raw Markdown of a page (one static resource per page). |
| `sylvanas://raw/{id}` | Raw Markdown by page id (`dev-api-core`, `dev-api-spellbook`…). |

### Prompt

`sylvanas_quickstart(topic?)` — starter context for writing a plugin
(golden rules + how to use each tool).

## Installation

```bash
git clone https://github.com/minchaka27/mcp-sylvanas.git
cd mcp-sylvanas
npm install
npm test   # end-to-end protocol test against a real client
```

## Register in an MCP client

The server speaks stdio; point any MCP client at it:

```json
{
  "mcpServers": {
    "sylvanas-docs": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-sylvanas/index.js"]
    }
  }
}
```

**Claude Desktop** — in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sylvanas-docs": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-sylvanas/index.js"]
    }
  }
}
```

**Cursor / Kilo Code / others** — same shape: command `node`, one argument
with the absolute path to `index.js`. On Windows, if `node` is not on the
`PATH` of the launching process, use the absolute path to `node.exe` as the
command.

### Serving a different corpus

By default the server indexes the bundled `docs/pages/`. Set
`SYLVANAS_DOCS_DIR` to point it at any other directory of Markdown files
(your own notes, a patched corpus…):

```json
"env": { "SYLVANAS_DOCS_DIR": "C:/path/to/your/markdown/corpus" }
```

## How it works

### Corpus

`tools/fetch-docs.mjs` builds `docs/pages/` from the official site: the page
list comes from the site's search index, and each page is fetched as HTML
and converted to Markdown by a purpose-built converter
(`tools/html-to-markdown.mjs`) — so ` ```lua ` code blocks, tables and
admonitions survive intact. `docs/manifest.json` records the source, the
freeze date and the url→file mapping. If a page's HTML cannot be fetched,
the tool falls back to that page's flattened body from the search index.

### Indexing

`lib/indexer.js` turns the Markdown corpus into:

1. **Sections** — split on headings.
2. **Chunks** — `###` subsections, then paragraph groups past 2 400
   characters. One chunk = one search unit.
3. **Symbol table** — qualified APIs (`core.spell_book.cast_safe`) and
   methods (`cast_safe`, `cooldown_remains`) extracted from code blocks,
   inline code, and signature headings (`get_spell_charge(spell_id)`).
4. **Namespaces** — symbols grouped by prefix (`core.spell_book` → its
   members).
5. **Availability notes** — sentences carrying a version statement
   (*Retail only*, *Works on every client*, *core update of 2026-10-06*…),
   attached to every symbol they mention. This is the channel that renders
   what the site knows and a symbol index cannot: which client, which core.

False positives are filtered: `header.lua`, `docs.project-sylvanas.net` and
other file paths never become API symbols.

### Search

`lib/search.js` — BM25 (`k1=1.5`, `b=0.75`) over two fields: body weight 1.0,
headings weight 3.2. Additional boosts: exact symbol match `+30`, method
`+18`, exact phrase in a heading `+22`, in the body `+12`. Tokenization is
diacritics-insensitive and compound words are split (`cast_safe` → `cast`,
`safe`) at a reduced weight.

### Rendering

`lib/format.js` produces compact Markdown: headings, metadata, highlighted
excerpt, and always the `sylvanas_read(...)` command to go further.

## Project structure

```
mcp-sylvanas/
├── index.js                    # MCP server: tools, resources, prompt
├── lib/
│   ├── paths.js                # corpus directory resolution (SYLVANAS_DOCS_DIR)
│   ├── text.js                 # normalization, tokenization, symbol extraction
│   ├── availability.js         # version-note sentence detection
│   ├── indexer.js              # markdown → sections, chunks, symbols, notes
│   ├── search.js               # multi-field BM25 + boosts
│   ├── insights.js             # curated notes from docs/pitfalls.md
│   └── format.js               # Markdown rendering of the results
├── docs/
│   ├── pages/                  # the 118 official pages (English, verbatim)
│   ├── manifest.json           # provenance + freeze date + page map
│   ├── pitfalls.md             # curated community notes
│   └── README.md               # corpus attribution & refresh guide
├── tools/
│   ├── fetch-docs.mjs          # rebuild the corpus from the official site
│   ├── html-to-markdown.mjs    # Docusaurus HTML → Markdown converter
│   ├── protocol-test.mjs       # end-to-end test (real MCP client)
│   ├── preview.mjs             # human inspection of tool outputs
│   └── inspect-symbols.mjs     # symbol table inspection
└── .github/workflows/ci.yml    # CI: protocol test on Node 18/20/22 + lint
```

## Tests

```bash
npm test          # end-to-end protocol test (real client over stdio)
npm run selftest  # quick offline smoke test
npm run preview   # coverage | search "query" | api symbol | pitfalls
npm run inspect   # symbol table statistics
```

The protocol test starts a real server, performs the handshake, exercises
the 8 tools, error handling, resources and prompts — 27 checks.

## Maintaining the corpus

The corpus is a committed snapshot. To refresh it from the official site:

```bash
npm run fetch-docs -- --diff      # 1. preview what changed
npm run fetch-docs -- --refresh   # 2. rebuild (re-downloads the site index)
npm test                          # 3. verify
git commit docs/                  # 4. commit the new freeze
```

`sylvanas_coverage()` always tells the agent how fresh the snapshot is.

## Attribution & license

- The code of this server is released under the [MIT license](LICENSE).
- The content of `docs/pages/` belongs to the **Project Sylvanas team** and
  is republished for developer convenience, unmodified, with a source link
  at the top of every page. The MIT license does not cover this corpus.
- `docs/pitfalls.md` is a community summary of contradictions verified in
  the official docs — see the file for details.
