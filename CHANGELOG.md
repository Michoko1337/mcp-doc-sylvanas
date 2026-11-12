# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

Documentation corpus refresh — no server code change.

### Changed

- **Corpus re-frozen at 2026-11-12** (was 2026-10-30): 118 pages, 3,081
  sections, all fetched through the HTML channel. 14 of the 118 pages changed;
  no page was added or removed. The site now documents cores up to **2.200**,
  where the previous freeze stopped at 2.158.
- `docs/pitfalls.md` re-verified against the new pages: 9 new gotchas, a new
  golden rule about recent-core APIs, and a warning about APIs whose *meaning*
  changed between cores.

### Added (upstream pages)

- `/dev/api/addons` — Polestar (core 2.196+, Forever only), Dungeon Journal
  (core 2.200+, Forever only), `zygor.skip_current_step`,
  `questie.get_party_quests`.
- `/dev/api/auction-house` — Name Search (Browse) family (core 2.194+),
  `has_search_results`, `refresh_commodity_search_results`,
  `refresh_item_search_results`, `get_detailed_item_level`.
- `/dev/api/core` — `core.register_on_focus_changed_callback` (2.187+).
- `/dev/api/events`, `/dev/api/input`, `/dev/api/party` —
  `GROUP_INVITE_CONFIRMATION` / `answer_invite_confirmation` /
  `get_invite_confirmation` (2.190+); `move_container_item` and `sort_bags`
  (2.200+); `dismiss_pet`, `join_skirmish`, `join_arena`,
  `join_rated_solo_shuffle`.
- `/dev/api/game-object` — `get_surname` (Forever, 2.174+), `is_on_taxi` and
  `get_melee_reach` (2.186+).
- `/dev/api/game-ui` — user waypoint family and `is_mouse_over_ui` (2.197+),
  `get_minimap_info` (2.186+), `get_item_ref_tooltip_info` (2.197+).
- `/dev/api/object-manager` — `is_on_taxi`, `map_id`, `map_x`, `map_y` on
  `get_party_members` (2.177+).
- `/dev/api/quests` — `core.quests.is_unit_on_quest` (2.176+).

### Breaking (upstream)

- `core.graphics.native_intersect` was documented as
  `(end_pos, start_pos, …)`; the corrected order is `(start_pos, end_pos, …)`
  and `distance` is ignored. Code written against the old page traced its ray
  backwards.
- `core.auction_house.send_search_query` / `send_sell_search_query` now take
  `(item_id, item_level?, item_suffix?, separate_owner_items?, sorts?)`
  instead of no arguments.
- `core.game_ui.get_vendor_item_info().quantity` is the per-purchase stack
  size, not the merchant's stock.
- `core.pet_battle.use_toy` returns a boolean, and the toy calls now also work
  on Forever (core 2.200+).
- `has_role_check` / `accept_role_check` are core **2.159**+, not 2.158.

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
