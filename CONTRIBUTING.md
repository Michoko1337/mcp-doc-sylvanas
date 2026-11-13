# Contributing

Thanks for taking the time to contribute!

## Development setup

```bash
git clone https://github.com/Michoko1337/mcp-doc-sylvanas.git
cd mcp-doc-sylvanas
npm install
npm test
```

- Node.js ≥ 20 (ESM). Runtime code is TypeScript (strict) in `src/`, compiled
  to `dist/` by `npm run build` (automatic on `npm install`).
- The runtime dependencies are `@modelcontextprotocol/sdk` and `zod`; keep it
  that way unless there is a strong reason not to.
- Everything the server serves comes from `docs/pages/` — the index is
  rebuilt at every startup.

## Before opening a pull request

```bash
npm run build     # compile TypeScript to dist/
npm run typecheck # strict type check
npm run lint      # ESLint 10 + typescript-eslint
npm test          # end-to-end protocol test (28 checks)
npm run selftest  # quick offline smoke test
```

All must pass. CI runs the same on Node 20, 22 and 24.

## Refreshing the documentation corpus

The corpus is generated mechanically — never edit `docs/pages/` by hand:

```bash
npm run fetch-docs -- --diff      # what changed on the site?
npm run fetch-docs -- --refresh   # rebuild + update docs/manifest.json
npm test
```

Commit `docs/pages/` and `docs/manifest.json` together, with the freeze
date in the commit message.

## Curated notes

`docs/pitfalls.md` (golden rules, verified gotchas) is hand-curated.
Only add an entry you have **verified against the official docs**, and say
where each form was seen. If the site contradicts an entry, fix the entry.

## Conventions

- ES modules everywhere (`"type": "module"`); `node:` prefixed imports.
- English throughout the codebase, including tool descriptions and messages.
- Comments explain *why*, not *what*.
- One tool per concern in `tools/`; runtime code lives in `src/` (TypeScript,
  strict mode — no `any`, no non-null assertions unless provably safe).
