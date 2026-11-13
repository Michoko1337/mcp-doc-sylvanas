import { test } from "node:test";
import assert from "node:assert/strict";

import { SearchIndex } from "../dist/lib/search.js";

let n = 0;
function chunk({ plain, docId = "d1", title = "Doc", section = "Sec", headingPath, dotted = [], methods = [] }) {
  return {
    id: `c${n++}`,
    docId,
    file: `${docId}.md`,
    docTitle: title,
    sectionTitle: section,
    headingPath: headingPath ?? [section],
    part: 0,
    parts: 1,
    text: plain,
    plain,
    symbols: { dotted, methods },
    codeBlocks: [],
    notes: [],
  };
}

test("higher term frequency outranks a single occurrence (BM25 regression)", () => {
  const a = chunk({ plain: "widget " + "filler ".repeat(20) });
  const b = chunk({ plain: "widget ".repeat(5) + "filler ".repeat(16) });
  const index = new SearchIndex([a, b]);
  const results = index.search("widget", { limit: 5 });
  assert.equal(results.length, 2);
  assert.equal(results[0].chunk.id, b.id);
  assert.ok(results[0].score > results[1].score);
});

test("exact qualified symbol match is boosted and reported", () => {
  const x = chunk({
    plain: "cast_safe casts a spell",
    dotted: ["core.spell_book.cast_safe"],
    methods: ["cast_safe"],
  });
  const y = chunk({ plain: "menus and windows" });
  const index = new SearchIndex([x, y]);
  const results = index.search("core.spell_book.cast_safe");
  assert.equal(results[0].chunk.id, x.id);
  assert.ok(results[0].hits.includes("core.spell_book.cast_safe"));
});

test("known methods without an underscore get the method boost (begin)", () => {
  const m = chunk({ plain: "begin", methods: ["begin"] });
  const other = chunk({ plain: "begin" });
  const index = new SearchIndex([m, other]);
  const results = index.search("begin");
  assert.equal(results[0].chunk.id, m.id);
  assert.ok(results[0].hits.includes("begin"));
});

test("docId filter restricts results to one page", () => {
  const index = new SearchIndex([
    chunk({ plain: "widget", docId: "d1" }),
    chunk({ plain: "widget", docId: "d2" }),
  ]);
  const results = index.search("widget", { docId: "d2" });
  assert.equal(results.length, 1);
  assert.ok(results.every((r) => r.chunk.docId === "d2"));
});

test("exact phrase in a heading is reported", () => {
  const index = new SearchIndex([
    chunk({ plain: "some body text", section: "Custom Window", headingPath: ["Custom Window"] }),
  ]);
  const results = index.search("custom window");
  assert.ok(results[0].hits.includes("exact title"));
});

test("empty queries return no results", () => {
  const index = new SearchIndex([chunk({ plain: "widget" })]);
  assert.deepEqual(index.search(""), []);
  assert.deepEqual(index.search("   "), []);
});
