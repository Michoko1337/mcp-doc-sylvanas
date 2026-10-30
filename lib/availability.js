/**
 * Detection of availability / version notes in the official docs.
 *
 * The site states client and core constraints in plain sentences
 * ("Works on every client", "Retail only", "core update of 2026-10-06",
 * "deprecated after 03/2026"…). Those statements are the one thing a symbol
 * index cannot render, yet they decide whether an API can be called at all.
 */

import { stripMarkdown } from "./text.js";

/** Availability markers, most specific first. */
const MARKERS = [
  /core update of \d{4}-\d{2}-\d{2}/i,
  /core \d+\.\d+\+/i,
  /core \d+\.\d+ or (?:newer|later)/i,
  /deprecated after \d{2}\/\d{4}/i,
  /deprecated before \d{2}\/\d{4}/i,
  /Works on every client/i,
  /Works on Retail only/i,
  /Retail and Forever only/i,
  /Retail only/i,
  /Classic only/i,
  /Classic Era only/i,
  /Forever only/i,
  /Not on Classic/i,
  /not on every (?:game )?version/i,
  /private-server clients/i,
  /Forever answers/i,
];

/**
 * A sentence only counts when it talks about a game version or a core
 * version. Without this filter, "only available on Visual Studio Code"
 * would pass.
 */
const VERSION_CONTEXT =
  /\b(Retail|Classic|Forever|Titan|MoP|TBC|Vanilla|Wrath|Legion|BfA|Shadowlands|Dragonflight|private[- ]server|client|core)\b/i;

/** Splits a body into sentences. */
function sentences(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!])\s+(?=[A-Z“"])/);
}

/**
 * Availability sentences of a Markdown fragment. Fenced code is dropped
 * first: examples may repeat the wording, but the statement lives in prose.
 *
 * @param {string} markdown
 * @returns {string[]} sentences carrying an availability marker
 */
export function availabilityNotes(markdown) {
  const prose = stripMarkdown(String(markdown ?? "").replace(/```[\s\S]*?```/g, " "));
  if (!prose) return [];

  const hits = [];
  for (const s of sentences(prose)) {
    if (!MARKERS.some((m) => m.test(s))) continue;
    if (!VERSION_CONTEXT.test(s)) continue;
    hits.push(s.trim());
  }
  return hits;
}
