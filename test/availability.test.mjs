import { test } from "node:test";
import assert from "node:assert/strict";

import { availabilityNotes } from "../dist/lib/availability.js";

test("detects a Retail-only statement", () => {
  const notes = availabilityNotes("This API works on Retail only.");
  assert.equal(notes.length, 1);
  assert.ok(notes[0].includes("Retail only"));
});

test("detects 'works on every client'", () => {
  assert.equal(availabilityNotes("It works on every client.").length, 1);
});

test("detects a dated core update", () => {
  const notes = availabilityNotes("Added in the core update of 2026-10-06.");
  assert.equal(notes.length, 1);
  assert.ok(notes[0].includes("2026-10-06"));
});

test("ignores sentences without a game/core version context", () => {
  assert.deepEqual(availabilityNotes("This is only available on Visual Studio Code."), []);
});

test("drops fenced code before scanning", () => {
  assert.deepEqual(availabilityNotes("```\nRetail only\n```\n"), []);
});
