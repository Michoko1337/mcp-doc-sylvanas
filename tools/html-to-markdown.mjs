/**
 * Minimal HTML → Markdown converter for Docusaurus page markup.
 *
 * The official docs are rendered by Docusaurus: headings, paragraphs, Prism
 * code blocks (one <div class="token-line"> per line), tables and themed
 * admonitions. The markup is machine-generated and extremely regular, which
 * a small purpose-built converter can exploit — no DOM dependency needed.
 *
 * Exported for reuse by tools/fetch-docs.mjs.
 */

/* ------------------------------------------------------------------ */
/*  HTML entities                                                      */
/* ------------------------------------------------------------------ */

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, name) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X"
        ? parseInt(name.slice(2), 16)
        : parseInt(name.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[name] ?? match;
  });
}

/* ------------------------------------------------------------------ */
/*  Parser: HTML string → element tree                                 */
/* ------------------------------------------------------------------ */

const VOID_TAGS = new Set(["br", "hr", "img", "input", "source", "path", "use"]);

/**
 * Parses an HTML fragment into a tree of
 * `{ type: "text", text }` and `{ type: "el", tag, attrs, children }` nodes.
 * Comments are dropped. Malformed nesting degrades gracefully (an unexpected
 * close tag pops the stack until it matches or the input ends).
 */
export function parseHtml(html) {
  const root = { type: "el", tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  let i = 0;

  const top = () => stack[stack.length - 1];

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      top().children.push({ type: "text", text: decodeEntities(html.slice(i)) });
      break;
    }
    if (lt > i) {
      top().children.push({ type: "text", text: decodeEntities(html.slice(i, lt)) });
    }

    // Comment
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt);
      i = end === -1 ? html.length : end + 3;
      continue;
    }

    const tagMatch = /^<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/.exec(
      html.slice(lt),
    );
    if (!tagMatch) {
      // Stray "<" — treat as text.
      top().children.push({ type: "text", text: "<" });
      i = lt + 1;
      continue;
    }

    const [full, tag, attrText] = tagMatch;
    const closing = full[1] === "/";
    i = lt + full.length;

    if (closing) {
      for (let d = stack.length - 1; d > 0; d -= 1) {
        if (stack[d].tag === tag) {
          stack.length = d;
          break;
        }
      }
      continue;
    }

    const attrs = {};
    for (const m of attrText.matchAll(/([a-zA-Z-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
    }

    const el = { type: "el", tag: tag.toLowerCase(), attrs, children: [] };
    top().children.push(el);
    if (!VOID_TAGS.has(el.tag) && !/\/>$/.test(full)) stack.push(el);
  }

  return root;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const childElements = (node) => node.children.filter((c) => c.type === "el");

const hasClass = (node, needle) => {
  const cls = node.attrs?.class ?? "";
  return cls.split(/\s+/).includes(needle) || cls.split(/\s+/).some((c) => c.startsWith(needle));
};

/** Stripped entirely: icon SVGs, anchors added by Docusaurus, nav, buttons. */
const isNoise = (node) =>
  ["svg", "nav", "button"].includes(node.tag) || hasClass(node, "hash-link");

/** Concatenated text of a subtree. */
function textOf(node) {
  if (node.type === "text") return node.text;
  return node.children.map(textOf).join("");
}

const collapse = (s) => s.replace(/[ \t\r\n]+/g, " ").trim();

/* ------------------------------------------------------------------ */
/*  Inline rendering                                                   */
/* ------------------------------------------------------------------ */

function inlineMarkdown(nodes) {
  let out = "";
  for (const node of nodes) {
    if (node.type === "text") {
      out += node.text.replace(/[ \t\r\n]+/g, " ");
      continue;
    }
    if (isNoise(node)) continue;

    switch (node.tag) {
      case "br":
        out += " ";
        break;
      case "strong":
      case "b":
        out += `**${collapse(inlineMarkdown(node.children))}**`;
        break;
      case "em":
      case "i":
        out += `*${collapse(inlineMarkdown(node.children))}*`;
        break;
      case "code":
        out += `\`${node.children.map(textOf).join("").replace(/[ \t\r\n]+/g, " ").trim()}\``;
        break;
      case "a": {
        const label = collapse(inlineMarkdown(node.children));
        const href = node.attrs.href ?? "";
        if (!label && !href) break;
        out += href && !href.startsWith("#") ? `[${label || href}](${href})` : label;
        break;
      }
      case "img": {
        const alt = node.attrs.alt ?? "";
        const src = node.attrs.src ?? "";
        out += src ? `![${alt}](${src})` : alt;
        break;
      }
      default:
        out += inlineMarkdown(node.children);
    }
  }
  return out.replace(/[ \t]{2,}/g, " ");
}

/* ------------------------------------------------------------------ */
/*  Block rendering                                                    */
/* ------------------------------------------------------------------ */

const ALERT_TYPES = { note: "NOTE", tip: "TIP", info: "INFO", caution: "CAUTION", warning: "WARNING", danger: "DANGER", important: "IMPORTANT" };

/** Prism code block: one <div class="token-line"> per source line. */
function codeBlockMarkdown(pre) {
  const lang = /language-([\w+-]+)/.exec(pre.attrs.class ?? "")?.[1] ?? "";
  const lines = [];

  const lineDivs = [];
  const walk = (node) => {
    for (const child of node.children) {
      if (child.type !== "el") continue;
      if (hasClass(child, "token-line")) lineDivs.push(child);
      else walk(child);
    }
  };
  walk(pre);

  if (lineDivs.length) {
    for (const div of lineDivs) lines.push(div.children.map(textOf).join(""));
  } else {
    // Fallback for non-Prism blocks: text content, keeping line breaks.
    const code = childElements(pre).find((c) => c.tag === "code") ?? pre;
    lines.push(...textOf(code).replace(/\u00a0/g, " ").split("\n"));
  }

  const fence = "```";
  return `${fence}${lang}\n${lines.join("\n")}\n${fence}`;
}

function listMarkdown(list, depth = 0) {
  const ordered = list.tag === "ol";
  const lines = [];
  let n = 0;

  for (const item of childElements(list)) {
    if (item.tag !== "li") continue;
    n += 1;
    const marker = ordered ? `${n}. ` : "- ";
    const indent = "  ".repeat(depth);

    // Separate the li's inline content from nested lists.
    const nested = [];
    const flat = [];
    for (const child of item.children) {
      if (child.type === "el" && ["ul", "ol"].includes(child.tag)) nested.push(child);
      else flat.push(child);
    }

    const text = collapse(blockMarkdown(flat));
    if (text) lines.push(`${indent}${marker}${text}`);
    for (const sub of nested) lines.push(listMarkdown(sub, depth + 1));
  }
  return lines.join("\n");
}

function tableMarkdown(table) {
  const rows = [];
  for (const tr of table.children.flatMap((c) => (c.type === "el" && ["thead", "tbody"].includes(c.tag) ? childElements(c) : [c]))) {
    if (tr.type !== "el" || tr.tag !== "tr") continue;
    const cells = childElements(tr)
      .filter((c) => ["td", "th"].includes(c.tag))
      .map((c) => collapse(inlineMarkdown(c.children)).replace(/\|/g, "\\|"));
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return "";

  const width = Math.max(...rows.map((r) => r.length));
  const norm = rows.map((r) => {
    const copy = [...r];
    while (copy.length < width) copy.push("");
    return copy;
  });
  const [header, ...body] = norm;
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
    ...body.map((r) => `| ${r.join(" | ")} |`),
  ];
  return lines.join("\n");
}

/** Docusaurus admonition → GitHub alert blockquote. */
function admonitionMarkdown(div) {
  const type = /theme-admonition-([\w-]+)/.exec(div.attrs.class ?? "")?.[1] ?? "note";
  const heading = childElements(div).find((c) => hasClass(c, "admonitionHeading"));
  const content = childElements(div).find((c) => hasClass(c, "admonitionContent"));

  const title = collapse(inlineMarkdown((heading ?? { children: [] }).children));
  const body = content
    ? blockMarkdown(content.children)
    : blockMarkdown(div.children.filter((c) => c !== heading));
  const alert = ALERT_TYPES[type] ?? title.toUpperCase();
  const custom = ALERT_TYPES[type] ? "" : `**${title || type}** — `;

  const quote = body.split("\n").map((l) => `> ${l}`.trimEnd());
  return [`> [!${alert}]${custom ? ` ${custom.trim()}` : ""}`, ...quote].join("\n");
}

function blockMarkdown(nodes) {
  const blocks = [];

  // Inline-level text is collapsed to one line; content rendered by
  // blockMarkdown() already carries its own layout and must be kept verbatim.
  const pushInline = (text) => {
    const t = collapse(text);
    if (t) blocks.push(t);
  };
  const pushBlock = (text) => {
    const t = String(text).trim();
    if (t) blocks.push(t);
  };

  for (const node of nodes) {
    if (node.type === "text") {
      pushInline(node.text);
      continue;
    }
    if (isNoise(node)) continue;

    switch (node.tag) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const text = collapse(inlineMarkdown(node.children));
        if (text) blocks.push(`${"#".repeat(Number(node.tag[1]))} ${text}`);
        break;
      }
      case "p":
        pushInline(inlineMarkdown(node.children));
        break;
      case "pre":
        blocks.push(codeBlockMarkdown(node));
        break;
      case "ul":
      case "ol":
        blocks.push(listMarkdown(node));
        break;
      case "table":
        blocks.push(tableMarkdown(node));
        break;
      case "blockquote": {
        const inner = blockMarkdown(node.children);
        if (inner) blocks.push(inner.split("\n").map((l) => `> ${l}`.trimEnd()).join("\n"));
        break;
      }
      case "hr":
        blocks.push("---");
        break;
      case "br":
        break;
      case "div":
        if (hasClass(node, "theme-admonition")) {
          blocks.push(admonitionMarkdown(node));
          break;
        }
        pushBlock(blockMarkdown(node.children));
        break;
      case "header":
      case "article":
      case "section":
      case "main":
        pushBlock(blockMarkdown(node.children));
        break;
      default:
        pushInline(inlineMarkdown([node]));
    }
  }

  return blocks.filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ */
/*  Entry point                                                        */
/* ------------------------------------------------------------------ */

/**
 * Converts a Docusaurus <article> (or whole page) to Markdown.
 *
 * @param {string} html — the page HTML
 * @returns {string|null} Markdown, or null when no <article> is found
 */
export function articleToMarkdown(html) {
  const start = html.search(/<article[^>]*>/);
  if (start === -1) return null;
  const openEnd = html.indexOf(">", start) + 1;
  const end = html.indexOf("</article>", openEnd);
  const tree = parseHtml(html.slice(openEnd, end === -1 ? undefined : end));
  return blockMarkdown(tree.children);
}
