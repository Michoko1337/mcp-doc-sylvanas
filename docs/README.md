# Documentation corpus

This folder holds the **official Project Sylvanas developer documentation**,
fetched verbatim from [docs.project-sylvanas.net](https://docs.project-sylvanas.net)
and frozen on the date recorded in [`manifest.json`](manifest.json).

- `pages/` — one Markdown file per official page (count recorded in `manifest.json`),
  converted from the rendered site so code blocks, tables and admonitions
  keep their real structure.
- `manifest.json` — provenance: the source site, the freeze date
  (`frozenAt`), and the URL → file mapping for every page.
- `pitfalls.md` — **community notes** (not official content): contradictions
  and wrong examples verified in the official docs. Curated by the
  maintainers of this repository.

## Attribution

The content of `pages/` belongs to the Project Sylvanas team and is
republished here for developer convenience, unmodified, with a source link
at the top of every page. The MIT license of this repository covers the
server code only, not this corpus.

## Refreshing the corpus

The corpus is generated mechanically and committed to the repository:

```bash
npm run fetch-docs            # rebuild from the cached search index + live pages
npm run fetch-docs -- --diff  # preview what changed since the current corpus
```

Then review the diff, run the test suite (`npm test`), and commit
`docs/pages/` together with the updated `manifest.json`.
