/**
 * End-to-end test of the MCP server: handshake, tools/list, tools/call,
 * resources/list, prompts/list — through a real MCP client over stdio.
 *
 *   node tools/protocol-test.mjs   (or: npm test)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(here, "..", "index.js");

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
  stderr: "pipe",
});

const client = new Client({ name: "protocol-test", version: "1.0.0" });

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

transport.stderr?.on("data", (d) => {
  const s = String(d).trim();
  if (s) console.log(`     [server] ${s}`);
});

await client.connect(transport);
check("handshake initialize", true, client.getServerVersion()?.name);

// --- Tools ---
const { tools } = await client.listTools();
check("tools/list", tools.length === 8, `${tools.length} tools: ${tools.map((t) => t.name).join(", ")}`);

const searchTool = tools.find((t) => t.name === "sylvanas_search");
check("sylvanas_search has an input schema", Boolean(searchTool?.inputSchema?.properties?.query));

const res = await client.callTool({
  name: "sylvanas_search",
  arguments: { query: "create a custom window", limit: 3 },
});
const searchText = res.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_search",
  searchText.includes("result(s)") && /window/i.test(searchText),
  `${searchText.length} chars`,
);

// A qualified core API must resolve to an exact symbol match
const apiRes = await client.callTool({
  name: "sylvanas_api",
  arguments: { symbol: "core.object_manager.get_local_player" },
});
const apiText = apiRes.content?.[0]?.text ?? "";
check("tools/call sylvanas_api", apiText.includes("Exact match"), `${apiText.length} chars`);

// The spell book API must be fully indexed: qualified form in examples,
// bare signature form in headings
const spellBookRes = await client.callTool({
  name: "sylvanas_api",
  arguments: { symbol: "core.spell_book.get_spell_cooldown" },
});
const spellBookText = spellBookRes.content?.[0]?.text ?? "";
check(
  "sylvanas_api finds core.spell_book.get_spell_cooldown",
  spellBookText.includes("Exact match"),
  `${spellBookText.length} chars`,
);

const spellBookHeadingRes = await client.callTool({
  name: "sylvanas_api",
  arguments: { symbol: "is_spell_learned" },
});
const spellBookHeadingText = spellBookHeadingRes.content?.[0]?.text ?? "";
check(
  "sylvanas_api indexes signature headings (is_spell_learned)",
  spellBookHeadingText.includes("Matching methods") || spellBookHeadingText.includes("Exact match"),
  `${spellBookHeadingText.length} chars`,
);

// Methods called with ":" resolve through the method table
const methodRes = await client.callTool({
  name: "sylvanas_api",
  arguments: { symbol: "cast_safe" },
});
const methodText = methodRes.content?.[0]?.text ?? "";
check(
  "sylvanas_api resolves methods (cast_safe)",
  methodText.includes("Matching methods") || methodText.includes("Exact match"),
  `${methodText.length} chars`,
);

// Availability notes are attached to the occurrences they mention
const availSymbolRes = await client.callTool({
  name: "sylvanas_api",
  arguments: { symbol: "core.auction_house.post_item" },
});
const availSymbolText = availSymbolRes.content?.[0]?.text ?? "";
check(
  "sylvanas_api attaches availability notes",
  availSymbolText.includes("Availability / version") && availSymbolText.includes("core update"),
);

// Namespace inventory
const symRes = await client.callTool({ name: "sylvanas_symbols", arguments: {} });
const symText = symRes.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_symbols (map)",
  symText.includes("API symbol index") && symText.includes("core.spell_book"),
  `${symText.length} chars`,
);

const nsRes = await client.callTool({
  name: "sylvanas_symbols",
  arguments: { prefix: "core.spell_book" },
});
const nsText = nsRes.content?.[0]?.text ?? "";
check(
  "sylvanas_symbols(core.spell_book) lists members",
  nsText.includes("get_spell_cooldown") && nsText.includes("get_specialization_id"),
  `${nsText.split("\n").length} lines`,
);

// Availability notes
const availRes = await client.callTool({ name: "sylvanas_availability", arguments: {} });
const availText = availRes.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_availability",
  availText.includes("Availability & version notes") && /\d+ availability notes/.test(availText),
  `${availText.length} chars`,
);

const availQueryRes = await client.callTool({
  name: "sylvanas_availability",
  arguments: { query: "2026-10-06" },
});
const availQueryText = availQueryRes.content?.[0]?.text ?? "";
check(
  "sylvanas_availability is filterable",
  availQueryText.includes("2026-10-06") && availQueryText.includes("note(s) for"),
  `${availQueryText.split("\n").length} lines`,
);

// Reading
const readRes = await client.callTool({
  name: "sylvanas_read",
  arguments: { file: "dev-api-spellbook", section: "Overview" },
});
const readText = readRes.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_read (section)",
  readText.length > 200 && readText.includes("comprehensive set of methods"),
  `${readText.length} chars`,
);

const readFullRes = await client.callTool({
  name: "sylvanas_read",
  arguments: { file: "dev-api-spellbook" },
});
const readFullText = readFullRes.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_read (full page)",
  readFullText.length > 5000 && readFullText.includes("is_spell_learned"),
  `${readFullText.length} chars`,
);

const listRes = await client.callTool({ name: "sylvanas_list", arguments: { kind: "files" } });
const listText = listRes.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_list(files)",
  listText.includes("knowledge base") && /Markdown pages/.test(listText),
);

const sectionsRes = await client.callTool({
  name: "sylvanas_list",
  arguments: { kind: "sections", file: "dev-api-spellbook" },
});
const sectionsText = sectionsRes.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_list(sections)",
  sectionsText.includes("get_spell_charge(spell_id)"),
);

const pagesRes = await client.callTool({ name: "sylvanas_list", arguments: { kind: "pages" } });
const pagesText = pagesRes.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_list(pages)",
  pagesText.includes("/dev/api/spellbook") && pagesText.includes("/dev/api/core"),
);

const covRes = await client.callTool({ name: "sylvanas_coverage", arguments: {} });
const covText = covRes.content?.[0]?.text ?? "";
check("tools/call sylvanas_coverage", covText.includes("official pages"), covText.split("\n")[2] ?? "");
check(
  "sylvanas_coverage exposes the freeze date",
  covText.includes("Frozen on") && /\d{4}-\d{2}-\d{2}/.test(covText),
);

const pitRes = await client.callTool({ name: "sylvanas_pitfalls", arguments: {} });
const pitText = pitRes.content?.[0]?.text ?? "";
check(
  "tools/call sylvanas_pitfalls",
  pitText.includes("golden rules") && pitText.includes("verified gotchas"),
  `${pitText.length} chars`,
);

// --- Error handling ---
const badRes = await client.callTool({ name: "sylvanas_read", arguments: { file: "zzz" } });
check("handled error (unknown page)", badRes.isError === true, (badRes.content?.[0]?.text ?? "").slice(0, 60));

// --- Resources ---
const { resources } = await client.listResources();
check("resources/list", resources.length >= 121, `${resources.length} resources`);

const docRes = await client.readResource({ uri: "sylvanas://doc/dev-api-core.md" });
const docText = docRes.contents?.[0]?.text ?? "";
check(
  "resources/read sylvanas://doc/dev-api-core.md",
  docText.length > 1000 && docText.includes("core"),
  `${docText.length} chars`,
);

const idxRes = await client.readResource({ uri: "sylvanas://index" });
const idxText = idxRes.contents?.[0]?.text ?? "";
check(
  "resources/read sylvanas://index",
  idxText.startsWith("{") && idxText.includes("frozenAt"),
);

// --- Prompts ---
const { prompts } = await client.listPrompts();
check("prompts/list", prompts.length === 1, prompts.map((p) => p.name).join(", "));

const promptRes = await client.getPrompt({
  name: "sylvanas_quickstart",
  arguments: { topic: "menu" },
});
const promptText = promptRes.messages?.[0]?.content?.text ?? "";
check(
  "prompts/get sylvanas_quickstart",
  promptText.includes("menu") && promptText.includes("Golden rules"),
);

await client.close();
console.log(failures === 0 ? "\nALL TESTS PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
