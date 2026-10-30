# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-10-30

Modernization release: the runtime code is now TypeScript, strict.

### Changed

- **TypeScript migration**: `index.js` + `lib/*.js` → `src/` (strict mode,
  `NodeNext`, no unused code). Compiled to `dist/` by `npm run build`;
  `npm install` builds automatically (`prepare` script). `bin` and `main`
  now point to `dist/index.js`.
- **Node.js ≥ 20 required** (Node 18 is end-of-life). CI matrix: 20 / 22 / 24.
- ESLint 9 → 10 with `typescript-eslint`; `ecmaVersion: "latest"`.
- CI gains a `typecheck` job; Dependabot watches npm and GitHub Actions.
- Version bump to 2.0.0 (runtime requirement change).

### Fixed

- `zod` is now a declared dependency — it was imported directly but only
  present as a transitive dependency of the MCP SDK (phantom dependency).
  `@eslint/js` likewise.
- BM25 document-length normalization actually applies now: the per-field
  length was indexed by term (always 0), so every chunk was scored as if it
  had the average length. Ranking is now correctly length-normalized.
- Term-frequency tables are precomputed once at startup instead of being
  rebuilt on every query.
- The package root is resolved by walking up to `package.json`, so the
  corpus path is correct whatever the install layout.

### Added

- Protocol test now also covers the `sylvanas://raw/{id}` resource template.
- `.nvmrc` (Node 22).

## [1.0.0] — 2026-10-30

First public release.

### Added

- MCP server (stdio) exposing the official Project Sylvanas developer docs:
  - `sylvanas_search` — BM25 full-text search over the whole corpus
  - `sylvanas_read` — raw Markdown of a page or section
  - `sylvanas_api` — exact symbol lookup with occurrences and context
  - `sylvanas_symbols` — symbol inventory by namespace
  - `sylvanas_availability` — client/core version notes, filterable
  - `sylvanas_list` — corpus inventory (files, sections, official pages)
  - `sylvanas_coverage` — corpus statistics and freeze date
  - `sylvanas_pitfalls` — curated golden rules and verified gotchas
- Resources: `sylvanas://index`, `sylvanas://coverage`, `sylvanas://pitfalls`,
  one static resource per page, and the `sylvanas://raw/{id}` template.
- Prompt: `sylvanas_quickstart(topic?)`.
- Bundled corpus: the 118 official pages, HTML-converted to Markdown
  (frozen at 2026-10-30, see `docs/manifest.json`).
- `tools/fetch-docs.mjs` with `--refresh` and `--diff` modes, and the
  `tools/html-to-markdown.mjs` Docusaurus converter.
- End-to-end protocol test (`npm test`), selftest, preview and inspection
  tools.
- CI workflow: protocol test on Node 18/20/22 plus lint.
