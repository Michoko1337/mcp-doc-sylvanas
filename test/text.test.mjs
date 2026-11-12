import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalize,
  tokenize,
  tokenizeWeighted,
  stripMarkdown,
  extractSymbolsFromCode,
  extractSymbolsFromInline,
  splitLongText,
  scanMarkdownUnits,
  paragraphs,
} from "../dist/lib/text.js";

test("normalize lowercases and strips diacritics", () => {
  assert.equal(normalize("Café"), "cafe");
  assert.equal(normalize("ÀBÇ"), "abc");
});

test("tokenizeWeighted deduplicates and weights underscore parts", () => {
  const terms = tokenizeWeighted("cast_safe cast_safe");
  assert.equal(terms.length, 3);
  assert.deepEqual(terms.find((t) => t.term === "cast_safe"), { term: "cast_safe", w: 1 });
  assert.deepEqual(terms.find((t) => t.term === "cast"), { term: "cast", w: 0.35 });
  assert.deepEqual(terms.find((t) => t.term === "safe"), { term: "safe", w: 0.35 });
});

test("tokenize preserves repetitions (BM25 term-frequency regression)", () => {
  // The inverted index must keep every occurrence: tf is what BM25 ranks on.
  const tokens = tokenize("cast_safe cast_safe");
  assert.equal(tokens.filter((t) => t === "cast_safe").length, 2);
  assert.equal(tokens.length, 6); // (cast_safe, cast, safe) x2
});

test("tokenize drops short underscore parts", () => {
  assert.deepEqual(tokenize("a_b"), ["a_b"]);
});

test("stripMarkdown removes syntax but keeps content", () => {
  const out = stripMarkdown("# Title\n\n`code` **bold** [link](http://x)");
  assert.ok(out.includes("Title"));
  assert.ok(out.includes("code"));
  assert.ok(out.includes("bold"));
  assert.ok(out.includes("link"));
  assert.ok(!out.includes("**"));
  assert.ok(!out.includes("`"));
  assert.ok(!out.includes("http"));
});

test("extractSymbolsFromCode finds qualified APIs and colon methods, rejects paths", () => {
  const found = extractSymbolsFromCode(
    "core.spell_book.cast_safe(spell_id)\nlocal p = object_manager:get_local_player()\nheader.lua",
  );
  assert.ok(found.dotted.includes("core.spell_book.cast_safe"));
  assert.ok(found.methods.includes("get_local_player"));
  assert.ok(found.methods.includes("cast_safe"));
  assert.ok(!found.dotted.includes("header.lua"));
});

test("extractSymbolsFromCode honours the stoplist", () => {
  const found = extractSymbolsFromCode("e.g. something");
  assert.ok(!found.dotted.includes("e.g"));
});

test("extractSymbolsFromInline accepts signature headings and bare methods", () => {
  assert.ok(extractSymbolsFromInline("get_spell_charge(spell_id)").methods.includes("get_spell_charge"));
  assert.ok(extractSymbolsFromInline("cast_safe").methods.includes("cast_safe"));
});

test("splitLongText splits on paragraphs and keeps oversized blocks whole", () => {
  assert.deepEqual(splitLongText("a\n\nb\n\nc", 3), ["a", "b", "c"]);
  assert.equal(splitLongText("x".repeat(5000), 2400).length, 1);
});

test("scanMarkdownUnits separates prose and fenced code", () => {
  const units = scanMarkdownUnits("prose line\n```lua\nlocal x = 1\n```\nafter");
  assert.equal(units.length, 3);
  assert.equal(units[0].type, "prose");
  assert.equal(units[1].type, "code");
  assert.equal(units[1].lang, "lua");
  assert.equal(units[1].code, "local x = 1");
  assert.equal(units[2].text, "after");
});

test("paragraphs splits on blank lines", () => {
  assert.deepEqual(paragraphs("a\n\nb\n\n"), ["a", "b"]);
});
