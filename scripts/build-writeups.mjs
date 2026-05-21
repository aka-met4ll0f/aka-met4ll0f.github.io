import { access, copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();

function parseArgs(argv) {
  const args = {
    input: "writeups/md",
    output: "writeups",
    images: "src/images/writeups",
    attachments: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    if (!Object.prototype.hasOwnProperty.call(args, key)) {
      throw new Error(`Unknown option --${key}`);
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

function resolvePath(value) {
  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "writeup";
}

function safeFileName(value) {
  return path.basename(String(value)).replace(/[^a-zA-Z0-9._ -]/g, "-");
}

function safeHref(value) {
  const href = String(value || "").trim().replaceAll("&amp;", "&");

  if (/^(https?:\/\/|\/|\.\/|\.\.\/|#)/i.test(href)) {
    return href;
  }

  return "#";
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return { metadata: {}, body: markdown };
  }

  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return { metadata: {}, body: markdown };
  }

  const raw = markdown.slice(4, end).trim();
  const metadata = {};

  raw.split("\n").forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      return;
    }

    const key = match[1];
    const value = match[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      metadata[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      return;
    }

    metadata[key] = value.replace(/^['"]|['"]$/g, "");
  });

  return { metadata, body: markdown.slice(end + 5).trimStart() };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findAttachment(dir, fileName) {
  if (!dir || !(await exists(dir))) {
    return null;
  }

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === fileName) {
      return fullPath;
    }

    if (entry.isDirectory()) {
      const nested = await findAttachment(fullPath, fileName);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

async function normalizeObsidianImages(markdown, context) {
  const matches = [...markdown.matchAll(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)];
  let normalized = markdown;

  for (const match of matches) {
    const rawTarget = match[1].trim();
    const rawAlt = (match[2] || rawTarget).trim();
    const fileName = safeFileName(rawTarget);
    const alt = rawAlt.replace(/\.[A-Za-z0-9]+$/, "");
    const imageUrl = `/src/images/writeups/${context.slug}/${encodeURIComponent(fileName)}`;

    if (context.attachmentsDir) {
      const source = await findAttachment(context.attachmentsDir, fileName);
      if (source) {
        const destinationDir = path.join(context.imagesDir, context.slug);
        await mkdir(destinationDir, { recursive: true });
        await copyFile(source, path.join(destinationDir, fileName));
      }
    }

    normalized = normalized.replace(match[0], `![${alt}](${imageUrl})`);
  }

  return normalized;
}

function renderInline(value) {
  let output = escapeHtml(value);

  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    const safeSrc = safeHref(src);
    return `<figure class="writeup-figure"><img class="writeup-image" src="${escapeHtml(safeSrc)}" alt="${escapeHtml(alt)}" /></figure>`;
  });
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeUrl = safeHref(href);
    return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer noopener">${label}</a>`;
  });
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return output;
}

function flushParagraph(blocks, paragraph) {
  if (paragraph.length === 0) {
    return;
  }

  blocks.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  paragraph.length = 0;
}

function flushList(blocks, listItems) {
  if (listItems.length === 0) {
    return;
  }

  const items = listItems.map((item) => `<li>${renderInline(item)}</li>`).join("\n");
  blocks.push(`<ul>\n${items}\n</ul>`);
  listItems.length = 0;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  const paragraph = [];
  const listItems = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines = [];

  for (const line of lines) {
    const fence = line.match(/^```\s*([A-Za-z0-9_-]+)?\s*$/);
    if (fence) {
      if (inCode) {
        blocks.push(`<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLanguage = "";
        codeLines = [];
      } else {
        flushParagraph(blocks, paragraph);
        flushList(blocks, listItems);
        inCode = true;
        codeLanguage = fence[1] || "text";
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph(blocks, paragraph);
      flushList(blocks, listItems);
      continue;
    }

    if (/^!\[[^\]]*\]\([^)]+\)$/.test(line.trim())) {
      flushParagraph(blocks, paragraph);
      flushList(blocks, listItems);
      blocks.push(renderInline(line.trim()));
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph(blocks, paragraph);
      flushList(blocks, listItems);
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph(blocks, paragraph);
      listItems.push(listItem[1]);
      continue;
    }

    paragraph.push(line.trim());
  }

  if (inCode) {
    blocks.push(`<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  flushParagraph(blocks, paragraph);
  flushList(blocks, listItems);

  return blocks.join("\n");
}

function findTitle(markdown, filePath, metadata) {
  if (metadata.title) {
    return metadata.title;
  }

  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1) {
    return h1[1].trim();
  }

  return path.basename(filePath, path.extname(filePath));
}

function buildPage({ metadata, title, bodyHtml }) {
  const lang = metadata.lang === "es" ? "es" : "en";
  const isSpanish = lang === "es";
  const platform = metadata.platform || "Hack The Box";
  const category = metadata.category || metadata.type || "Writeup";
  const headline = metadata.headline || metadata.summary || "Technical writeup";
  const meta = metadata.meta || [metadata.difficulty, metadata.objective].filter(Boolean).join(" - ");
  const homeUrl = isSpanish ? "/writeups.html" : "/en/writeups.html";
  const navHome = isSpanish ? "Inicio" : "Home";
  const backText = isSpanish ? "Volver a writeups" : "Back to writeups";
  const ariaLabel = isSpanish ? "Navegación principal" : "Main navigation";

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | Daniel Galindo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/src/styles/styles.css" />
  </head>
  <body data-page="writeups">
    <div class="grid-overlay" aria-hidden="true"></div>
    <div class="noise-overlay" aria-hidden="true"></div>

    <header class="site-header">
      <a class="site-logo" href="/en/index.html">met4ll0f</a>
      <nav class="site-nav" aria-label="${ariaLabel}">
        <a data-nav="home" href="/en/index.html">${navHome}</a>
        <a data-nav="writeups" href="/en/writeups.html">Writeups</a>
        <a data-nav="scripts" href="/en/scripts.html">Scripts</a>
      </nav>
    </header>

    <section class="hero hero-compact">
      <p class="hero-kicker">${escapeHtml(platform)} - ${escapeHtml(category)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="headline">${escapeHtml(headline)}</p>
      ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ""}
    </section>

    <main class="writeup-article">
      <section class="panel panel-large">
${bodyHtml}
      </section>
    </main>

    <footer class="footer">
      <p>© <span class="js-year"></span> <span class="js-name"></span>.</p>
      <a href="${homeUrl}">${backText}</a>
    </footer>

    <script type="module" src="/src/js/site.js"></script>
    <script type="module" src="/src/js/writeup-media.js"></script>
  </body>
</html>
`;
}

async function buildWriteup(filePath, options) {
  const raw = await readFile(filePath, "utf8");
  const { metadata, body } = parseFrontmatter(raw);
  const title = findTitle(body, filePath, metadata);
  const slug = slugify(metadata.slug || title);
  const normalizedMarkdown = await normalizeObsidianImages(body.replace(/^#\s+.+$/m, "").trimStart(), {
    slug,
    attachmentsDir: options.attachmentsDir,
    imagesDir: options.imagesDir
  });
  const html = buildPage({ metadata, title, bodyHtml: renderMarkdown(normalizedMarkdown) });
  const outputFile = path.join(options.outputDir, `${slug}.html`);

  await mkdir(options.outputDir, { recursive: true });
  await writeFile(outputFile, html, "utf8");

  return outputFile;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputDir = resolvePath(args.input);
  const outputDir = resolvePath(args.output);
  const imagesDir = resolvePath(args.images);
  const attachmentsDir = args.attachments ? resolvePath(args.attachments) : null;

  if (!(await exists(inputDir))) {
    console.log(`No Markdown input directory found: ${inputDir}`);
    return;
  }

  const entries = await readdir(inputDir, { withFileTypes: true });
  const markdownFiles = entries
    .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name))
    .map((entry) => path.join(inputDir, entry.name));

  if (markdownFiles.length === 0) {
    console.log(`No Markdown files found in: ${inputDir}`);
    return;
  }

  for (const file of markdownFiles) {
    const outputFile = await buildWriteup(file, { outputDir, imagesDir, attachmentsDir });
    console.log(`Generated ${path.relative(rootDir, outputFile)}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
