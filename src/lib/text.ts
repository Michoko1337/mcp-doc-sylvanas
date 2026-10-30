/**
 * Text utilities: normalization, tokenization, code and symbol extraction.
 * Search identifiers carry no diacritics: search is accent-insensitive while
 * display keeps the original text.
 */

import type { CodeBlock, MarkdownUnit, SymbolSet, WeightedTerm } from "./types.js";

/** Lowercase + diacritics stripped. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const TOKEN_RE = /[a-z0-9]+(?:_[a-z0-9]+)*/g;

/**
 * Tokenizes a text into weighted terms.
 * A compound word ("cast_safe") yields its full term (weight 1) plus its
 * parts (weight 0.35) so stem searches still hit.
 */
export function tokenizeWeighted(text: string): WeightedTerm[] {
  const norm = normalize(text);
  const raw = norm.match(TOKEN_RE);
  if (!raw) return [];
  const out: WeightedTerm[] = [];
  const seen = new Set<string>();
  for (const token of raw) {
    if (!seen.has(token)) {
      seen.add(token);
      out.push({ term: token, w: 1 });
    }
    if (token.includes("_")) {
      for (const part of token.split("_")) {
        if (part.length > 2 && !seen.has(part)) {
          seen.add(part);
          out.push({ term: part, w: 0.35 });
        }
      }
    }
  }
  return out;
}

/** Flat token list (full terms + parts), for the inverted index. */
export function tokenize(text: string): string[] {
  return tokenizeWeighted(text).map((t) => t.term);
}

/** Strips Markdown syntax, keeping the content (code stays readable). */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[^\n]*\n?/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<![*\w])\*([^*\n]+)\*(?![*\w])/g, "$1")
    .replace(/^\s*\|/gm, " ")
    .replace(/\|/g, "  ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Code blocks of a markdown text: { lang, code, start, end }. */
export function extractCodeBlocks(md: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const re = /```([A-Za-z0-9_+.-]*)\r?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    blocks.push({
      lang: (m[1] || "").trim(),
      code: m[2],
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return blocks;
}

/** Inline code spans (`...`). */
export function extractInlineCode(md: string): string[] {
  const out: string[] = [];
  const re = /`([^`\n]{2,120})`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) out.push(m[1]);
  return out;
}

const LUA_KEYWORDS = new Set([
  "function", "end", "local", "if", "then", "else", "elseif", "for", "while", "do",
  "return", "nil", "true", "false", "and", "or", "not", "in", "repeat", "until",
  "break", "goto", "self", "print", "require", "pcall", "xpcall", "ipairs",
  "pairs", "type", "tostring", "tonumber", "table", "string", "math", "os", "io",
  "assert", "error", "select", "setmetatable", "getmetatable", "rawget", "rawset",
  "unpack", "next", "load", "dofile", "collectgarbage",
]);

/** Symbols that are not APIs (grammatical false positives). */
const SYMBOL_STOPLIST = new Set([
  "e.g", "i.e", "etc", "ex", "vs", "u.s", "a.m", "p.m", "docs.project",
  "readme.md", "http", "https", "www",
]);

const DOTTED_RE = /\b([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+)\b/g;
const METHOD_RE = /[:.]([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;

/** File extensions: `header.lua` is not an API. */
const FILE_EXT = new Set([
  "lua", "md", "json", "xml", "txt", "png", "jpg", "jpeg", "gif", "yaml", "yml",
  "toml", "ini", "cfg", "zip", "exe", "dll", "html", "css", "js", "ts", "py",
  "sh", "bat", "log", "csv", "pdf", "cache", "tmp", "dat", "url", "docx", "so",
]);

/** Segments marking a file or URL path, not an API. */
const SEGMENT_BLACKLIST = new Set([
  "scripts_data", "www", "http", "https", "docs", "doc", "dev", "sylvanas",
  "getting-started", "examples", "modules", "libraries", "plugins", "guides",
  "api", "index", "src", "dist", "node_modules", "common", "utility",
]);

/** A dotted symbol is plausible when it does not look like a path. */
function isPlausibleDotted(sym: string): boolean {
  const segs = sym.toLowerCase().split(".");
  if (segs.length < 2) return false;
  if (FILE_EXT.has(segs[segs.length - 1]!)) return false;
  if (SEGMENT_BLACKLIST.has(segs[0]!)) return false;
  if (segs.some((s) => s.length > 40)) return false;
  return true;
}

/**
 * Extracts the API symbols of a code block.
 * - "core.spell_book.cast_safe": qualified API
 * - "cast_safe": method called with ":"
 */
export function extractSymbolsFromCode(code: string): SymbolSet {
  const dotted = new Map<string, string>();
  const methods = new Map<string, string>();

  let m: RegExpExecArray | null;
  DOTTED_RE.lastIndex = 0;
  while ((m = DOTTED_RE.exec(code)) !== null) {
    const raw = m[1]!;
    if (SYMBOL_STOPLIST.has(raw.toLowerCase())) continue;
    if (!isPlausibleDotted(raw)) continue;
    if (!dotted.has(raw)) dotted.set(raw, raw.toLowerCase());
  }

  METHOD_RE.lastIndex = 0;
  while ((m = METHOD_RE.exec(code)) !== null) {
    const name = m[1]!;
    const lower = name.toLowerCase();
    if (LUA_KEYWORDS.has(lower)) continue;
    if (name.length < 3) continue;
    if (!methods.has(name)) methods.set(name, lower);
  }

  return { dotted: [...dotted.values()], methods: [...methods.values()] };
}

/** Symbols from an inline-code fragment (`...`): accepts `cast_safe` alone. */
export function extractSymbolsFromInline(inline: string): SymbolSet {
  const found = extractSymbolsFromCode(inline);
  const dotted = new Set(found.dotted);
  const methods = new Set(found.methods);

  let trimmed = inline.trim();
  // Signature headings like `get_spell_charge(spell_id)`: keep the bare
  // function name as a method.
  const call = /^([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)$/.exec(trimmed);
  if (call) trimmed = call[1]!;

  if (
    /^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed) &&
    trimmed.includes("_") &&
    trimmed.length >= 5 &&
    !LUA_KEYWORDS.has(trimmed.toLowerCase())
  ) {
    methods.add(trimmed);
  }
  return { dotted: [...dotted], methods: [...methods] };
}

/** Splits a markdown into units: code blocks and prose lines. */
export function scanMarkdownUnits(md: string): MarkdownUnit[] {
  const lines = md.split(/\r?\n/);
  const units: MarkdownUnit[] = [];
  let inFence = false;
  let lang = "";
  let buf: string[] = [];
  let startNo = 0;

  lines.forEach((line, i) => {
    const fence = /^\s*```(.*)$/.exec(line);
    if (fence) {
      if (!inFence) {
        inFence = true;
        lang = fence[1]!.trim();
        buf = [];
        startNo = i + 1;
      } else {
        inFence = false;
        units.push({
          type: "code",
          lang,
          code: buf.join("\n"),
          lineStart: startNo,
          lineEnd: i,
        });
      }
      return;
    }
    if (inFence) {
      buf.push(line);
      return;
    }
    units.push({ type: "prose", text: line, lineNo: i + 1 });
  });

  if (inFence) {
    units.push({
      type: "code",
      lang,
      code: buf.join("\n"),
      lineStart: startNo,
      lineEnd: lines.length,
    });
  }
  return units;
}

/** Symbols of a Markdown fragment: code blocks + inline code. */
export function extractSymbolsFromMarkdown(md: string): SymbolSet {
  const dotted = new Set<string>();
  const methods = new Set<string>();

  for (const block of extractCodeBlocks(md)) {
    const found = extractSymbolsFromCode(block.code);
    for (const s of found.dotted) dotted.add(s);
    for (const s of found.methods) methods.add(s);
  }

  for (const inline of extractInlineCode(md)) {
    const found = extractSymbolsFromInline(inline);
    for (const s of found.dotted) dotted.add(s);
    for (const s of found.methods) methods.add(s);
  }

  return { dotted: [...dotted], methods: [...methods] };
}

/** Splits a text into paragraphs. */
export function paragraphs(md: string): string[] {
  return md
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Splits an overly long block at paragraph boundaries. */
export function splitLongText(md: string, max = 2400): string[] {
  const paras = paragraphs(md);
  if (!paras.length) return [md];
  const out: string[] = [];
  let buf: string[] = [];
  let size = 0;
  for (const p of paras) {
    if (buf.length && size + p.length + 2 > max) {
      out.push(buf.join("\n\n"));
      buf = [p];
      size = p.length;
    } else {
      buf.push(p);
      size += p.length + 2;
    }
  }
  if (buf.length) out.push(buf.join("\n\n"));
  return out;
}
