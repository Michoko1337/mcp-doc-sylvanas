#!/usr/bin/env node
/**
 * Builds the English documentation corpus bundled with this server.
 *
 * The official docs are published at docs.project-sylvanas.net (Docusaurus).
 * Two sources are combined:
 *
 * - the site search index (search-index.json) — the complete, canonical list
 *   of pages and their section titles;
 * - the rendered HTML pages themselves — fetched and converted to Markdown
 *   so code blocks, tables and admonitions keep their real structure.
 *
 * When a page's HTML cannot be fetched, the tool falls back to that page's
 * flattened body from the search index (the `channel` field of the manifest
 * says which path each page took).
 *
 * Usage:
 *   node tools/fetch-docs.mjs            # build (uses the cached index)
 *   node tools/fetch-docs.mjs --refresh  # re-download the index first
 *   node tools/fetch-docs.mjs --diff     # report what would change, write nothing
 *
 * The downloaded index is cached in .cache/search-index.json (gitignored).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { articleToMarkdown } from "./html-to-markdown.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(HERE, "..");
const CACHE_DIR = path.join(SERVER_ROOT, ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "search-index.json");
const INDEX_URL = "https://docs.project-sylvanas.net/search-index.json";
const SITE_ORIGIN = "https://docs.project-sylvanas.net";
const DOCS_DIR = path.join(SERVER_ROOT, "docs");
const PAGES_DIR = path.join(DOCS_DIR, "pages");
const MANIFEST_FILE = path.join(DOCS_DIR, "manifest.json");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 mcp-sylvanas-docs-fetcher";
const FETCH_CONCURRENCY = 4;
const FETCH_TIMEOUT_MS = 30_000;
const INDEX_TIMEOUT_MS = 60_000;

/* ------------------------------------------------------------------ */
/*  Search index: download / cache                                     */
/* ------------------------------------------------------------------ */

async function loadIndex({ refresh = false } = {}) {
  if (!refresh && fs.existsSync(CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  }
  process.stderr.write("[fetch-docs] downloading the search index…\n");
  const res = await fetch(INDEX_URL, { signal: AbortSignal.timeout(INDEX_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${INDEX_URL}`);
  const text = await res.text();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, text, "utf8");
  return JSON.parse(text);
}

/** YYYY-MM-DD date for the corpus freeze: download date, or cache file date. */
function frozenDate(refresh) {
  const d = refresh ? new Date() : fs.statSync(CACHE_FILE).mtime;
  return d.toISOString().slice(0, 10);
}

/** Normalizes a site URL: `/dev/api/spellbook` ≡ `/dev/api/spellbook/`. */
function normalizeUrl(u) {
  if (!u) return "";
  let s = String(u).trim();
  if (!s.startsWith("/")) s = `/${s}`;
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

/**
 * In the Docusaurus index, a content entry carries the section BODY in `t`
 * and the section TITLE in `s`. Entries without `s` are table-of-contents
 * rows: duplicates content-wise, but they carry the page titles.
 */
const isContent = (entry) => typeof entry.s === "string" && entry.s.trim().length > 0;

/** Page titles and flattened section bodies, grouped by URL. */
function groupByPage(shards) {
  const titles = new Map();
  const sections = new Map();

  for (const shard of shards) {
    for (const entry of shard.documents ?? []) {
      const url = normalizeUrl(entry.u);
      if (!url) continue;
      if (!isContent(entry)) {
        if (!titles.has(url)) titles.set(url, String(entry.t ?? "").trim());
        continue;
      }
      if (!sections.has(url)) sections.set(url, []);
      sections.get(url).push(entry);
    }
  }
  return { titles, sections };
}

/** Flattened Markdown from the search index alone (fallback channel). */
function flattenedMarkdown(url, entries) {
  const lines = [];
  for (const entry of entries) {
    const title = (entry.s ?? "").trim();
    const body = (entry.t ?? "").trim();
    if (title) {
      const isSignature = /[.(]/.test(title) && !title.includes(" ");
      lines.push(isSignature ? `### ${title}` : `## ${title}`);
      lines.push("");
    }
    if (body) {
      lines.push(body);
      lines.push("");
    }
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ------------------------------------------------------------------ */
/*  HTML channel                                                       */
/* ------------------------------------------------------------------ */

async function fetchPageMarkdown(url) {
  const res = await fetch(`${SITE_ORIGIN}${url === "/" ? "" : url}`, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const markdown = articleToMarkdown(html);
  if (!markdown) throw new Error("no <article> in page");
  return markdown;
}

/** Fetches with one retry, returns null when both attempts fail. */
async function fetchWithRetry(url) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await fetchPageMarkdown(url);
    } catch (err) {
      if (attempt === 2) {
        process.stderr.write(`[fetch-docs] ${url}: ${err.message} — search-index fallback\n`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return null;
}

/**
 * Drops a trailing orphan code fence. Some pages of the site end with a
 * stray "```" in their source; keeping it would break every Markdown renderer
 * (and the section splitter) from that point on.
 */
function sanitizeFences(markdown) {
  const count = (markdown.match(/```/g) ?? []).length;
  if (count % 2 === 0) return markdown;
  const last = markdown.lastIndexOf("```");
  return markdown.slice(0, last) + markdown.slice(last + 3);
}

/** Inserts the source attribution right below the H1 title. */
function withSourceLine(markdown, url) {
  const nl = markdown.indexOf("\n");
  const head = nl === -1 ? markdown : markdown.slice(0, nl);
  const rest = nl === -1 ? "" : markdown.slice(nl + 1);
  return `${head}\n\n> Source: <${SITE_ORIGIN}${url}>\n${rest}`;
}

/** Small bounded-concurrency map. */
async function mapConcurrent(items, worker, limit) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

/* ------------------------------------------------------------------ */
/*  Build                                                              */
/* ------------------------------------------------------------------ */

/** File name for a page URL: `/dev/api/spellbook` → `dev-api-spellbook.md`. */
function fileNameFor(url) {
  const slug = normalizeUrl(url).replace(/^\//, "").replace(/\//g, "-");
  return `${slug || "home"}.md`;
}

async function buildCorpus(shards, frozenAt) {
  const { titles, sections } = groupByPage(shards);
  const urls = [...sections.keys()].sort();

  process.stderr.write(`[fetch-docs] fetching ${urls.length} pages…\n`);
  const htmlPages = await mapConcurrent(
    urls,
    async (url) => ({ url, markdown: await fetchWithRetry(url) }),
    FETCH_CONCURRENCY,
  );

  const usedNames = new Map();
  const pages = [];

  for (const { url, markdown } of htmlPages) {
    const file = fileNameFor(url);
    if (usedNames.has(file) && usedNames.get(file) !== url) {
      throw new Error(`file name collision between ${url} and ${usedNames.get(file)}: ${file}`);
    }
    usedNames.set(file, url);

    const entries = sections.get(url);
    const fallback = flattenedMarkdown(url, entries);
    const usedHtml = markdown !== null;
    const body = usedHtml ? markdown : `# ${titles.get(url) || url}\n\n${fallback}`;

    pages.push({
      url,
      file,
      title: titles.get(url) ?? "",
      channel: usedHtml ? "html" : "search-index",
      sections: entries.filter(isContent).length,
      markdown: withSourceLine(sanitizeFences(body), url),
    });
  }

  return {
    frozenAt,
    pages,
    manifest: {
      source: SITE_ORIGIN,
      searchIndexUrl: INDEX_URL,
      frozenAt,
      generatedBy: "tools/fetch-docs.mjs",
      pages: pages.map(({ url, file, title, channel, sections: count }) => ({
        url,
        file,
        title,
        channel,
        sections: count,
      })),
    },
  };
}

/** Compares the freshly built corpus with the one on disk. */
function diffCorpus(corpus) {
  const onDisk = new Set(
    fs.existsSync(PAGES_DIR) ? fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".md")) : [],
  );
  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];

  for (const page of corpus.pages) {
    const file = path.join(PAGES_DIR, page.file);
    if (!onDisk.has(page.file)) added.push(page);
    else if (fs.readFileSync(file, "utf8") === page.markdown) unchanged.push(page);
    else changed.push(page);
    onDisk.delete(page.file);
  }
  removed.push(...[...onDisk].map((file) => ({ file })));
  return { added, removed, changed, unchanged };
}

function writeCorpus(corpus) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
  for (const page of corpus.pages) {
    fs.writeFileSync(path.join(PAGES_DIR, page.file), page.markdown, "utf8");
  }
  // Pages that disappeared from the site must not linger in the corpus.
  for (const file of fs.readdirSync(PAGES_DIR)) {
    if (file.endsWith(".md") && !corpus.pages.some((p) => p.file === file)) {
      fs.rmSync(path.join(PAGES_DIR, file));
    }
  }
  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(corpus.manifest, null, 2)}\n`, "utf8");
}

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes("--refresh");
  const diff = args.includes("--diff");

  const shards = await loadIndex({ refresh });
  const corpus = await buildCorpus(shards, frozenDate(refresh));
  const fallbacks = corpus.pages.filter((p) => p.channel === "search-index").length;

  if (diff) {
    const { added, removed, changed, unchanged } = diffCorpus(corpus);
    console.log(`Corpus vs docs/pages: ${unchanged.length} unchanged`);
    for (const p of added) console.log(`  + ${p.file} (${p.title || p.url})`);
    for (const p of removed) console.log(`  - ${p.file}`);
    for (const p of changed) console.log(`  ~ ${p.file} (${p.title || p.url})`);
    console.log(`Frozen at: ${corpus.frozenAt}${fallbacks ? ` — ${fallbacks} page(s) via search-index fallback` : ""}`);
    return;
  }

  writeCorpus(corpus);
  const totalChars = corpus.pages.reduce((n, p) => n + p.markdown.length, 0);
  console.log(
    `docs/pages: ${corpus.pages.length} pages, ${totalChars.toLocaleString("en-US")} chars ` +
      `— frozen at ${corpus.frozenAt}` +
      (fallbacks ? ` (${fallbacks} via search-index fallback)` : ""),
  );
}

main().catch((err) => {
  console.error("[fetch-docs] error:", err.message);
  process.exit(1);
});
