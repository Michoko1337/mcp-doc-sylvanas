# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

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
