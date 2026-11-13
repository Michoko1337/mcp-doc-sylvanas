import { test } from "node:test";
import assert from "node:assert/strict";

import { articleToMarkdown, decodeEntities } from "../tools/html-to-markdown.mjs";

test("decodeEntities handles named and numeric entities", () => {
  assert.equal(decodeEntities("a &amp; b &lt; c &#65; &#x42;"), "a & b < c A B");
});

test("converts headings and inline bold", () => {
  const md = articleToMarkdown("<article><h1>Title</h1><p>Hello <strong>world</strong>.</p></article>");
  assert.ok(md.includes("# Title"));
  assert.ok(md.includes("**world**"));
});

test("converts a Prism code block with its language", () => {
  const md = articleToMarkdown(
    '<article><pre class="language-lua"><code><div class="token-line">local x = 1</div><div class="token-line">print(x)</div></code></pre></article>',
  );
  assert.ok(md.includes("```lua"));
  assert.ok(md.includes("local x = 1"));
  assert.ok(md.includes("print(x)"));
});

test("converts a table", () => {
  const md = articleToMarkdown(
    "<article><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></article>",
  );
  assert.ok(md.includes("| A | B |"));
  assert.ok(md.includes("| 1 | 2 |"));
});

test("converts an admonition to a GitHub alert", () => {
  const md = articleToMarkdown(
    '<article><div class="theme-admonition theme-admonition-warning"><div class="admonitionHeading">Warning</div><div class="admonitionContent"><p>Be careful.</p></div></div></article>',
  );
  assert.ok(md.includes("[!WARNING]"));
  assert.ok(md.includes("Be careful."));
});

test("converts lists and links", () => {
  assert.ok(articleToMarkdown("<article><ul><li>one</li><li>two</li></ul></article>").includes("- one"));
  assert.ok(
    articleToMarkdown('<article><p><a href="/dev/api/core">core</a></p></article>').includes("[core](/dev/api/core)"),
  );
});

test("returns null when there is no <article>", () => {
  assert.equal(articleToMarkdown("<div>no article</div>"), null);
});
