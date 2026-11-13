import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Package root, found by walking up from this file to the nearest
 * package.json. Robust whatever the layout: source, compiled `dist/`,
 * or a dependency nested in node_modules.
 */
function findPackageRoot(start: string): string {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`package.json not found above ${start}`);
    }
    dir = parent;
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));

/** Root of the MCP server package. */
export const SERVER_ROOT = findPackageRoot(here);

/**
 * Server version, read from package.json so the MCP handshake and the
 * package never drift apart. Falls back to "0.0.0" if it cannot be read.
 */
export const SERVER_VERSION: string = (() => {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(SERVER_ROOT, "package.json"), "utf8"),
    ) as { version?: string };
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
})();

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
