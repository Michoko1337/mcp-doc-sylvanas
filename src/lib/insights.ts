import fs from "node:fs";

import { PITFALLS_FILE } from "./paths.js";
import type { Contradiction, Insights } from "./types.js";

const HEADING_RE = /^(#{1,6})\s+(.*)$/;

interface RawSubSection {
  heading: string;
  body: string[];
}

/**
 * Sections of level 3 that live under a given level-2 heading.
 * Returns [{ heading, body }].
 */
function subSectionsOf(md: string, titleMatcher: RegExp): Contradiction[] {
  const lines = md.split(/\r?\n/);
  const out: Contradiction[] = [];
  let inRegion = false;
  let current: RawSubSection | null = null;

  const flush = () => {
    if (current) out.push({ heading: current.heading, body: current.body.join("\n").trim() });
    current = null;
  };

  for (const line of lines) {
    const h = HEADING_RE.exec(line);
    if (h) {
      const level = h[1]!.length;
      if (!inRegion && level === 2 && titleMatcher.test(h[2]!)) {
        inRegion = true;
        continue;
      }
      if (inRegion) {
        if (level <= 2) break; // end of the region
        if (level === 3) {
          flush();
          current = { heading: h[2]!.trim(), body: [] };
          continue;
        }
      }
    }
    if (inRegion && current) current.body.push(line);
  }
  flush();
  return out;
}

/** Bullet or numbered list under a level-2 heading, continuations folded in. */
function listItems(md: string, headingMatcher: RegExp): string[] {
  const lines = md.split(/\r?\n/);
  const items: string[] = [];
  let inRegion = false;
  let current: string | null = null;

  for (const line of lines) {
    const h = HEADING_RE.exec(line);
    if (h) {
      if (inRegion) break;
      if (h[1]!.length === 2 && headingMatcher.test(h[2]!)) inRegion = true;
      continue;
    }
    if (!inRegion) continue;

    const bullet = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/.exec(line);
    if (bullet) {
      if (current) items.push(current);
      current = bullet[1]!.trim();
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
export function extractInsights(pitfallsFile: string = PITFALLS_FILE): Insights {
  if (!fs.existsSync(pitfallsFile)) {
    return { contradictions: [], rules: [], warnings: [], installed: false };
  }
  const md = fs.readFileSync(pitfallsFile, "utf8");

  return {
    installed: true,
    rules: listItems(md, /^golden rules$/i),
    contradictions: subSectionsOf(md, /^verified gotchas?/i),
    warnings: listItems(md, /^warnings?$/i),
  };
}
