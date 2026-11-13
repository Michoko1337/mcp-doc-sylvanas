import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildIndex } from "../dist/lib/indexer.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(here, "fixtures", "pages");

test("buildIndex parses sections, chunks, symbols, namespaces and notes", () => {
  const index = buildIndex(fixtureDir);

  assert.equal(index.documents.length, 2);
  assert.deepEqual(index.documents.map((d) => d.id).sort(), ["01", "02"]);

  const sample = index.documents.find((d) => d.id === "01");
  assert.ok(sample.sections.some((s) => s.heading === "Overview"));
  assert.ok(sample.sections.some((s) => s.heading === "Details"));
  assert.ok(sample.chunks.length > 0);

  assert.ok(index.symbols.dotted.has("core.sample.do_thing"));
  assert.ok(index.symbols.dotted.has("core.menu.begin"));
  assert.ok(index.symbols.methods.has("do_thing"));
  assert.ok(index.namespaces.has("core.sample"));

  assert.ok(index.availability.some((note) => note.note.includes("Retail only")));
});
