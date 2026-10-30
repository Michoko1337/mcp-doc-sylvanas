import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Root of the MCP server package. */
export const SERVER_ROOT = path.resolve(here, "..");

/**
 * Directory holding the Markdown corpus — one file per official docs page.
 * Default: the bundled `docs/pages/`. Set SYLVANAS_DOCS_DIR to serve a
 * different, locally maintained corpus instead.
 */
export const DOCS_DIR = path.resolve(
  process.env.SYLVANAS_DOCS_DIR || path.join(SERVER_ROOT, "docs", "pages"),
);

/**
 * Corpus manifest (provenance, freeze date, url→file map), read from the
 * parent of the corpus directory. Optional: without it the page map is
 * simply not exposed.
 */
export const MANIFEST_FILE = path.join(path.dirname(DOCS_DIR), "manifest.json");

/**
 * Curated community notes (golden rules, verified gotchas), read from the
 * parent of the corpus directory. Optional: without it sylvanas_pitfalls
 * reports that no notes are installed.
 */
export const PITFALLS_FILE = path.join(path.dirname(DOCS_DIR), "pitfalls.md");
