import fs from "node:fs";

import { PITFALLS_FILE } from "./paths.js";

const HEADING_RE = /^(#{1,6})\s+(.*)$/;

/**
 * Sections of level 3 that live under a given level-2 heading.
 * Returns [{ heading, body }].
 */
function subSectionsOf(md, titleMatcher) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inRegion = false;
  let current = null;

  for (const line of lines) {
    const h = HEADING_RE.exec(line);
    if (h) {
      const level = h[1].length;
      if (!inRegion && level === 2 && titleMatcher.test(h[2])) {
        inRegion = true;
        continue;
      }
      if (inRegion) {
        if (level <= 2) break; // end of the region
        if (level === 3) {
          if (current) {
            current.body = current.body.join("\n").trim();
            out.push(current);
          }
          current = { heading: h[2].trim(), body: [] };
          continue;
        }
      }
    }
    if (inRegion && current) current.body.push(line);
  }
  if (inRegion && current) {
    current.body = current.body.join("\n").trim();
    out.push(current);
  }
  return out;
}

/** Bullet or numbered list under a level-2 heading, continuations folded in. */
function listItems(md, headingMatcher) {
  const lines = md.split(/\r?\n/);
  const items = [];
  let inRegion = false;
  let current = null;

  for (const line of lines) {
    const h = HEADING_RE.exec(line);
    if (h) {
      if (inRegion) break;
      if (h[1].length === 2 && headingMatcher.test(h[2])) inRegion = true;
      continue;
    }
    if (!inRegion) continue;

    const bullet = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/.exec(line);
    if (bullet) {
      if (current) items.push(current);
      current = bullet[1].trim();
    } else if (current && line.trim()) {
      current += ` ${line.trim()}`;
    }
  }
  if (current) items.push(current);
  return items;
}

/**
 * Curated community notes from docs/pitfalls.md.
 *
 * The file is optional: without it, sylvanas_pitfalls reports that no
 * curated notes are installed, and the golden rules disappear from the
 * quickstart prompt.
 */
export function extractInsights(pitfallsFile = PITFALLS_FILE) {
  const empty = { contradictions: [], rules: [], warnings: [], installed: false };
  if (!fs.existsSync(pitfallsFile)) return empty;
  const md = fs.readFileSync(pitfallsFile, "utf8");

  return {
    installed: true,
    rules: listItems(md, /^golden rules$/i),
    contradictions: subSectionsOf(md, /^verified gotchas?/i),
    warnings: listItems(md, /^warnings?$/i),
  };
}
