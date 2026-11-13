import fs from "node:fs";
import path from "node:path";

import { MANIFEST_FILE } from "./paths.js";
import { availabilityNotes } from "./availability.js";
import {
  extractCodeBlocks,
  extractInlineCode,
  extractSymbolsFromCode,
  extractSymbolsFromInline,
  extractSymbolsFromMarkdown,
  scanMarkdownUnits,
  splitLongText,
  stripMarkdown,
} from "./text.js";
import type {
  AvailabilityNote,
  CorpusIndex,
  CorpusStats,
  Doc,
  DocChunk,
  Manifest,
  NamespaceMember,
  OfficialPage,
  SymbolEntry,
  SymbolTables,
} from "./types.js";

const HEADING_RE = /^(#{1,6})\s+(.*)$/;

/** A section while being parsed, before its end line is known. */
interface RawSection {
  heading: string;
  level: number;
  lineStart: number;
  lineEnd: number;
  lines: string[];
}

/** A symbol occurrence as found in the text, before being flattened. */
interface RawOccurrence {
  display: string;
  chunk: DocChunk;
  line: string;
  lineNo: number;
  code: string | null;
  prose: string;
}

function docFiles(docsDir: string): string[] {
  return fs
    .readdirSync(docsDir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "en"));
}

/** Splits a document into sections (any heading below the H1 title). */
function splitSections(lines: string[]): { title: string; sections: RawSection[] } {
  const sections: RawSection[] = [];
  let current: RawSection | null = null;
  let title: string | null = null;

  for (const [i, line] of lines.entries()) {
    const m = HEADING_RE.exec(line);
    if (m) {
      const level = m[1]!.length;
      if (!title && level === 1) {
        title = m[2]!.trim();
        continue;
      }
      if (current) {
        current.lineEnd = i;
        sections.push(current);
      }
      current = { heading: m[2]!.trim(), level, lineStart: i, lineEnd: 0, lines: [line] };
      continue;
    }
    if (current) current.lines.push(line);
  }

  if (current) {
    current.lineEnd = lines.length;
    sections.push(current);
  }
  return { title: title ?? "", sections };
}

/** Splits a section into chunks (`###` boundaries first, then paragraphs). */
function buildChunks(doc: Doc, section: RawSection, seq: { n: number }): DocChunk[] {
  const body = section.lines.slice(1);
  const subs: { heading: string | null; lines: string[] }[] = [];
  let current = { heading: null as string | null, lines: [] as string[] };

  for (const line of body) {
    const m = /^(#{3,6})\s+(.*)$/.exec(line);
    if (m) {
      if (current.lines.length) subs.push(current);
      current = { heading: m[2]!.trim(), lines: [line] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length) subs.push(current);

  const chunks: DocChunk[] = [];
  for (const sub of subs) {
    const text = sub.lines.join("\n").trim();
    if (!text) continue;
    const headingPath = [section.heading];
    if (sub.heading) headingPath.push(sub.heading);

    const parts = splitLongText(text, 2400);
    parts.forEach((part, i) => {
      chunks.push({
        id: `${doc.id}#${seq.n++}`,
        docId: doc.id,
        file: doc.file,
        docTitle: doc.title,
        sectionTitle: section.heading,
        headingPath,
        part: parts.length > 1 ? i + 1 : 0,
        parts: parts.length,
        text: part,
        plain: stripMarkdown(part),
        symbols: extractSymbolsFromMarkdown(part),
        codeBlocks: extractCodeBlocks(part),
        notes: availabilityNotes(part),
      });
    });
  }
  return chunks;
}

/* ------------------------------------------------------------------ */
/*  Document parsing                                                   */
/* ------------------------------------------------------------------ */

/** Parses one Markdown file of the corpus. */
function parseDocument(file: string, raw: string, docsDir: string): Doc {
  const lines = raw.split(/\r?\n/);
  const { title, sections } = splitSections(lines);
  const idMatch = /^(\d{2})-/.exec(file);
  const id = idMatch ? idMatch[1]! : path.basename(file, ".md");

  const doc: Doc = {
    id,
    file,
    path: file,
    fullPath: path.join(docsDir, file),
    title: title || file,
    sections: [],
    chunks: [],
    chars: raw.length,
    lines: lines.length,
    pages: [],
  };

  const seq = { n: 0 };
  for (const section of sections) {
    const chunks = buildChunks(doc, section, seq);
    doc.sections.push({
      heading: section.heading,
      level: section.level,
      lineStart: section.lineStart,
      lineEnd: section.lineEnd,
      chunkIds: chunks.map((c) => c.id),
    });
    doc.chunks.push(...chunks);
  }

  return doc;
}

/* ------------------------------------------------------------------ */
/*  Page map (manifest.json)                                           */
/* ------------------------------------------------------------------ */

/** Reads the corpus manifest, when the corpus ships one. */
function readManifest(): Manifest | null {
  if (!fs.existsSync(MANIFEST_FILE)) return null;
  try {
    const data: unknown = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
    if (typeof data !== "object" || data === null) return null;
    const manifest = data as Manifest;
    if (!Array.isArray(manifest.pages)) return null;
    return manifest;
  } catch {
    return null;
  }
}

/**
 * Official page → corpus file map, straight from the manifest.
 * Returns [] when the corpus has no manifest (custom corpora).
 */
function buildPageMap(manifest: Manifest | null, documents: Doc[]): OfficialPage[] {
  if (!manifest) return [];
  const idByFile = new Map(documents.map((d) => [d.file, d.id]));

  return manifest.pages.map((p) => ({
    page: p.url,
    label: p.title ?? "",
    docId: idByFile.get(p.file) ?? path.basename(p.file, ".md"),
    channel: p.channel ?? "unknown",
    status: "complete",
  }));
}

/* ------------------------------------------------------------------ */
/*  Symbol table                                                       */
/* ------------------------------------------------------------------ */

function buildSymbolTable(chunks: DocChunk[]): SymbolTables {
  const dotted = new Map<string, SymbolEntry>();
  const methods = new Map<string, SymbolEntry>();

  for (const chunk of chunks) {
    const units = scanMarkdownUnits(chunk.text);

    units.forEach((unit, ui) => {
      if (unit.type === "code") {
        // Prose right before the block: context of the occurrence.
        const before = units
          .slice(0, ui)
          .filter((u) => u.type === "prose" && u.text.trim())
          .slice(-2)
          .map((u) => (u.type === "prose" ? u.text.trim() : ""))
          .join("\n\n");

        const lines = unit.code.split(/\r?\n/);
        for (const [i, line] of lines.entries()) {
          const found = extractSymbolsFromCode(line);
          for (const raw of found.dotted) {
            pushSymbol(dotted, raw.toLowerCase(), {
              display: raw,
              chunk,
              line: line.trim(),
              lineNo: unit.lineStart + i,
              code: unit.code,
              prose: before,
            });
          }
          for (const raw of found.methods) {
            pushSymbol(methods, raw.toLowerCase(), {
              display: raw,
              chunk,
              line: line.trim(),
              lineNo: unit.lineStart + i,
              code: unit.code,
              prose: before,
            });
          }
        }
        return;
      }

      // Prose: symbols quoted as inline code (signature tables).
      for (const inline of extractInlineCode(unit.text)) {
        const found = extractSymbolsFromInline(inline);
        for (const raw of found.dotted) {
          pushSymbol(dotted, raw.toLowerCase(), {
            display: raw,
            chunk,
            line: inline,
            lineNo: unit.lineNo,
            code: null,
            prose: unit.text.trim(),
          });
        }
        for (const raw of found.methods) {
          pushSymbol(methods, raw.toLowerCase(), {
            display: raw,
            chunk,
            line: inline,
            lineNo: unit.lineNo,
            code: null,
            prose: unit.text.trim(),
          });
        }
      }
    });
  }

  // Suffix index: "cast_safe" → ["core.spell_book.cast_safe", …]
  const suffix = new Map<string, string[]>();
  for (const key of dotted.keys()) {
    const last = key.split(".").pop();
    if (!last) continue;
    if (!suffix.has(last)) suffix.set(last, []);
    suffix.get(last)!.push(key);
  }

  return { dotted, methods, suffix };
}

function pushSymbol(table: Map<string, SymbolEntry>, key: string, occurrence: RawOccurrence): void {
  if (!table.has(key)) {
    table.set(key, { key, display: occurrence.display, count: 0, occurrences: [] });
  }
  const entry = table.get(key)!;
  entry.count += 1;
  if (entry.occurrences.length < 60) {
    entry.occurrences.push({
      docId: occurrence.chunk.docId,
      file: occurrence.chunk.file,
      docTitle: occurrence.chunk.docTitle,
      sectionTitle: occurrence.chunk.sectionTitle,
      headingPath: occurrence.chunk.headingPath,
      line: occurrence.line,
      code: occurrence.code,
      prose: occurrence.prose,
      notes: occurrence.chunk.notes ?? [],
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Index construction                                                 */
/* ------------------------------------------------------------------ */

/**
 * Index of availability notes, attached to their location and to the
 * symbols they mention. A note is attached to every symbol it mentions:
 * that is what lets `sylvanas_api("check_los")` surface the note about
 * `check_los` even when note and code live in different paragraphs.
 */
function buildAvailability(chunks: DocChunk[]): {
  notes: AvailabilityNote[];
  bySymbol: Map<string, AvailabilityNote[]>;
} {
  const out: AvailabilityNote[] = [];
  const bySymbol = new Map<string, AvailabilityNote[]>();
  const seen = new Set<string>();

  for (const chunk of chunks) {
    if (!chunk.notes?.length) continue;
    for (const note of chunk.notes) {
      // The same sentence can be indexed by several chunks of one page (a
      // note repeated per function); keep the first occurrence only.
      const dedupeKey = `${chunk.docId}::${note}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const own = extractSymbolsFromMarkdown(note);
      const entry: AvailabilityNote = {
        note,
        docId: chunk.docId,
        file: chunk.file,
        docTitle: chunk.docTitle,
        sectionTitle: chunk.sectionTitle,
        headingPath: chunk.headingPath,
        symbols: own,
        contextSymbols: chunk.symbols,
      };
      out.push(entry);

      for (const key of [...own.dotted, ...own.methods]) {
        const k = key.toLowerCase();
        if (!bySymbol.has(k)) bySymbol.set(k, []);
        bySymbol.get(k)!.push(entry);
      }
    }
  }

  return { notes: out, bySymbol };
}

/**
 * Symbols grouped by namespace: "core.spell_book" → its members.
 * That is the answer to "list the symbols of core.spell_book".
 */
function buildNamespaces(symbols: SymbolTables): Map<string, NamespaceMember[]> {
  const namespaces = new Map<string, NamespaceMember[]>();
  for (const [key, entry] of symbols.dotted) {
    const parts = key.split(".");
    if (parts.length < 2) continue;
    const ns = parts.slice(0, -1).join(".");
    if (!namespaces.has(ns)) namespaces.set(ns, []);
    namespaces.get(ns)!.push({ key, display: entry.display, count: entry.count });
  }
  for (const list of namespaces.values()) {
    list.sort((a, b) => a.key.localeCompare(b.key));
  }
  return namespaces;
}

/** Builds the full corpus index: documents, chunks, symbols, notes, stats. */
export function buildIndex(docsDir: string): CorpusIndex {
  const files = docFiles(docsDir);
  const documents = files.map((file) =>
    parseDocument(file, fs.readFileSync(path.join(docsDir, file), "utf8"), docsDir),
  );

  const manifest = readManifest();
  const chunks = documents.flatMap((d) => d.chunks);
  const pages = buildPageMap(manifest, documents);
  const symbols = buildSymbolTable(chunks);
  const availability = buildAvailability(chunks);
  const namespaces = buildNamespaces(symbols);

  // Official pages attached to each document
  for (const doc of documents) {
    doc.pages = pages.filter((p) => p.docId === doc.id);
  }

  const stats: CorpusStats = {
    documents: documents.length,
    sections: documents.reduce((n, d) => n + d.sections.length, 0),
    chunks: chunks.length,
    pages: pages.length,
    symbols: symbols.dotted.size + symbols.methods.size,
    namespaces: namespaces.size,
    availabilityNotes: availability.notes.length,
    chars: documents.reduce((n, d) => n + d.chars, 0),
  };

  return {
    docsDir,
    manifest,
    documents,
    chunks,
    pages,
    symbols,
    namespaces,
    availability: availability.notes,
    notesBySymbol: availability.bySymbol,
    frozenAt: manifest?.frozenAt ?? null,
    builtAt: new Date().toISOString(),
    stats,
  };
}
