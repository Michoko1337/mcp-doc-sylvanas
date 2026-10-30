import { normalize, tokenize, tokenizeWeighted } from "./text.js";
import type { DocChunk, SearchResult, WeightedTerm } from "./types.js";

const K1 = 1.5;
const B = 0.75;

const W_BODY = 1.0;
const W_HEAD = 3.2;

const DOTTED_RE = /\b([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+)\b/g;

const avg = (nums: number[]): number =>
  nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Multi-field BM25 search engine over the doc chunks. */
export class SearchIndex {
  private readonly chunks: DocChunk[];
  private readonly body: string[][];
  private readonly head: string[][];
  private readonly bodyTf: Map<string, number>[];
  private readonly headTf: Map<string, number>[];
  private readonly bodyLen: number[];
  private readonly headLen: number[];
  private readonly avgBody: number;
  private readonly avgHead: number;
  private readonly df: Map<string, number> = new Map();

  constructor(chunks: DocChunk[]) {
    this.chunks = chunks;
    this.body = chunks.map((c) => tokenize(c.plain));
    this.head = chunks.map((c) =>
      tokenize([c.docTitle, c.sectionTitle, ...c.headingPath].filter(Boolean).join(" ")),
    );
    this.bodyTf = this.body.map(termFrequencies);
    this.headTf = this.head.map(termFrequencies);
    this.bodyLen = this.body.map((t) => t.length);
    this.headLen = this.head.map((t) => t.length);
    this.avgBody = avg(this.bodyLen) || 1;
    this.avgHead = avg(this.headLen) || 1;

    for (const tokens of this.body) {
      for (const t of new Set(tokens)) this.df.set(t, (this.df.get(t) || 0) + 1);
    }
    for (const tokens of this.head) {
      for (const t of new Set(tokens)) this.df.set(t, (this.df.get(t) || 0) + 1);
    }
  }

  private idf(term: string): number {
    const n = this.chunks.length;
    const df = this.df.get(term) || 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  /** BM25 score of one field, normalized by its own document length. */
  private bm25(field: Map<string, number>, dl: number, avgLen: number, terms: WeightedTerm[]): number {
    let score = 0;
    for (const { term, w } of terms) {
      const tf = field.get(term) || 0;
      if (!tf) continue;
      const norm = 1 - B + B * (dl / avgLen);
      score += w * this.idf(term) * ((tf * (K1 + 1)) / (tf + K1 * norm));
    }
    return score;
  }

  search(query: string, { limit = 8, docId = null }: { limit?: number; docId?: string | null } = {}): SearchResult[] {
    const raw = query.trim();
    if (!raw) return [];

    const terms = tokenizeWeighted(raw);
    if (!terms.length) return [];

    const normQuery = normalize(raw);

    // Symbols explicitly present in the query
    const qDotted = new Set<string>();
    DOTTED_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = DOTTED_RE.exec(raw)) !== null) qDotted.add(normalize(m[1]!));
    const qMethods = new Set(
      terms.filter((t) => t.term.includes("_") && t.w === 1).map((t) => t.term),
    );

    const results: SearchResult[] = [];
    for (let i = 0; i < this.chunks.length; i += 1) {
      const chunk = this.chunks[i]!;
      if (docId && chunk.docId !== docId) continue;

      let score =
        W_BODY * this.bm25(this.bodyTf[i]!, this.bodyLen[i]!, this.avgBody, terms) +
        W_HEAD * this.bm25(this.headTf[i]!, this.headLen[i]!, this.avgHead, terms);

      const hits: string[] = [];

      // Exact symbol match
      const chunkDotted = chunk.symbols?.dotted ?? [];
      const chunkMethods = chunk.symbols?.methods ?? [];
      const chunkDottedSet = new Set(chunkDotted.map((s) => normalize(s)));

      for (const s of qDotted) {
        if (chunkDottedSet.has(s)) {
          score += 30;
          hits.push(s);
          continue;
        }
        const last = s.split(".").pop();
        if (last && chunkMethods.some((x) => normalize(x) === last)) {
          score += 14;
          hits.push(`${s} (method ${last})`);
        }
      }

      for (const s of qMethods) {
        if (chunkMethods.some((x) => normalize(x) === s)) {
          score += 18;
          hits.push(s);
        } else if (chunkDotted.some((x) => normalize(x).split(".").pop() === s)) {
          score += 12;
          hits.push(`${s} (suffix)`);
        }
      }

      // Exact-phrase bonus
      if (normQuery.length >= 4) {
        const headNorm = normalize(
          [chunk.docTitle, chunk.sectionTitle, ...chunk.headingPath].filter(Boolean).join(" "),
        );
        if (headNorm.includes(normQuery)) {
          score += 22;
          hits.push("exact title");
        } else if (normalize(chunk.plain).includes(normQuery)) {
          score += 12;
          hits.push("exact phrase");
        }
      }

      if (score <= 0) continue;

      results.push({
        chunk,
        score: Math.round(score * 100) / 100,
        hits: [...new Set(hits)],
        snippet: this.snippet(chunk, terms),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /** Excerpt around the first match, ~460 characters. */
  private snippet(chunk: DocChunk, terms: WeightedTerm[]): string {
    const plain = chunk.plain;
    if (!plain) return "";

    const ranked = [...terms].sort((a, b) => b.w - a.w).slice(0, 6);
    let idx = -1;
    for (const { term } of ranked) {
      const re = new RegExp(escapeRe(term), "i");
      const found = plain.search(re);
      if (found !== -1 && (idx === -1 || found < idx)) idx = found;
    }
    if (idx === -1) idx = 0;

    const start = Math.max(0, idx - 140);
    const end = Math.min(plain.length, idx + 380);
    let out = plain.slice(start, end).replace(/\s+/g, " ").trim();
    if (start > 0) out = `… ${out}`;
    if (end < plain.length) out = `${out} …`;
    return out;
  }
}

/** Term-frequency table of one token list. */
function termFrequencies(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}
