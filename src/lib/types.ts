/**
 * Structural types shared across the indexer, the search engine and the
 * result formatters. One source of truth for the shape of the corpus index.
 */

/** A fenced code block of a Markdown fragment. */
export interface CodeBlock {
  lang: string;
  code: string;
  start: number;
  end: number;
}

/** API symbols extracted from a fragment: qualified and bare. */
export interface SymbolSet {
  dotted: string[];
  methods: string[];
}

/** One heading-delimited section of a corpus page. */
export interface DocSection {
  heading: string;
  level: number;
  lineStart: number;
  lineEnd: number;
  chunkIds: string[];
}

/** A searchable unit of a page: a subsection, or a slice of a long one. */
export interface DocChunk {
  id: string;
  docId: string;
  file: string;
  docTitle: string;
  sectionTitle: string;
  headingPath: string[];
  /** Part number (1-based) when the subsection was split, else 0. */
  part: number;
  parts: number;
  text: string;
  plain: string;
  symbols: SymbolSet;
  codeBlocks: CodeBlock[];
  notes: string[];
}

/** A corpus page, parsed from one Markdown file. */
export interface Doc {
  id: string;
  file: string;
  path: string;
  fullPath: string;
  title: string;
  sections: DocSection[];
  chunks: DocChunk[];
  chars: number;
  lines: number;
  /** Official site pages this file covers (empty without a manifest). */
  pages: OfficialPage[];
}

/** One page of the official site, mapped to a corpus file. */
export interface OfficialPage {
  page: string;
  label: string;
  docId: string;
  channel: string;
  status: string;
}

export interface ManifestPage {
  url: string;
  title?: string;
  file: string;
  channel?: string;
}

export interface Manifest {
  frozenAt?: string;
  pages: ManifestPage[];
}

/** One place a symbol appears at, with its surrounding context. */
export interface SymbolOccurrence {
  docId: string;
  file: string;
  docTitle: string;
  sectionTitle: string;
  headingPath: string[];
  line: string;
  code: string | null;
  prose: string;
  notes: string[];
}

/** A symbol and all its occurrences across the corpus. */
export interface SymbolEntry {
  key: string;
  display: string;
  count: number;
  occurrences: SymbolOccurrence[];
}

/** Member of a namespace listing (`core.spell_book` → …). */
export interface NamespaceMember {
  key: string;
  display: string;
  count: number;
}

/** The three symbol tables of the corpus. */
export interface SymbolTables {
  dotted: Map<string, SymbolEntry>;
  methods: Map<string, SymbolEntry>;
  /** Last segment → dotted keys ending with it. */
  suffix: Map<string, string[]>;
}

/** A sentence carrying a client / core version statement. */
export interface AvailabilityNote {
  note: string;
  docId: string;
  file: string;
  docTitle: string;
  sectionTitle: string;
  headingPath: string[];
  symbols: SymbolSet;
  contextSymbols: SymbolSet;
}

export interface CorpusStats {
  documents: number;
  sections: number;
  chunks: number;
  pages: number;
  symbols: number;
  namespaces: number;
  availabilityNotes: number;
  chars: number;
}

/** The whole corpus, indexed — built once at startup. */
export interface CorpusIndex {
  docsDir: string;
  manifest: Manifest | null;
  documents: Doc[];
  chunks: DocChunk[];
  pages: OfficialPage[];
  symbols: SymbolTables;
  namespaces: Map<string, NamespaceMember[]>;
  availability: AvailabilityNote[];
  notesBySymbol: Map<string, AvailabilityNote[]>;
  frozenAt: string | null;
  builtAt: string;
  stats: CorpusStats;
}

/** A BM25 search hit. */
export interface SearchResult {
  chunk: DocChunk;
  score: number;
  hits: string[];
  snippet: string;
}

/** A token with its field weight. */
export interface WeightedTerm {
  term: string;
  w: number;
}

/** One verified gotcha of the official docs, from docs/pitfalls.md. */
export interface Contradiction {
  heading: string;
  body: string;
}

/** Curated community notes (docs/pitfalls.md), when installed. */
export interface Insights {
  installed: boolean;
  rules: string[];
  contradictions: Contradiction[];
  warnings: string[];
}

/** A markdown fragment, split into code blocks and prose lines. */
export type MarkdownUnit =
  | { type: "code"; lang: string; code: string; lineStart: number; lineEnd: number }
  | { type: "prose"; text: string; lineNo: number };
