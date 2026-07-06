import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "北京交通大学生存指南", "北京交通大学生存手册_重构完整稿.md");
const distPath = path.join(root, "dist");

function slugify(text, fallback) {
  const ascii = text
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=\[\]{}\\|;:'",.<>/?，。！？、：；“”‘’（）《》【】]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const chinese = Array.from(text.matchAll(/[\u4e00-\u9fa5A-Za-z0-9]+/g)).map((match) => match[0]).join("-");
  return (ascii || chinese || fallback).slice(0, 80);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function flushParagraph(paragraph, htmlParts) {
  if (!paragraph.length) return;
  htmlParts.push(`<p>${inlineMarkdown(paragraph.join(""))}</p>`);
  paragraph.length = 0;
}

function flushList(list, htmlParts) {
  if (!list) return null;
  const tag = list.type === "ol" ? "ol" : "ul";
  htmlParts.push(`<${tag}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`);
  return null;
}

function flushBlockquote(blockquote, htmlParts) {
  if (!blockquote.length) return;
  htmlParts.push(`<blockquote>${blockquote.map((line) => `<p>${inlineMarkdown(line)}</p>`).join("")}</blockquote>`);
  blockquote.length = 0;
}

function flushTable(table, htmlParts) {
  if (!table.length) return;
  const rows = table.map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
  if (rows.length < 2) return;
  const separator = rows[1].every((cell) => /^:?-{3,}:?$/.test(cell));
  const bodyRows = separator ? rows.slice(2) : rows.slice(1);
  const head = rows[0].map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("");
  const body = bodyRows
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
    .join("");
  htmlParts.push(`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
  table.length = 0;
}

function renderMarkdown(lines) {
  const htmlParts = [];
  const paragraph = [];
  const blockquote = [];
  const table = [];
  let list = null;
  let code = null;

  function flushFlow() {
    flushParagraph(paragraph, htmlParts);
    list = flushList(list, htmlParts);
    flushBlockquote(blockquote, htmlParts);
    flushTable(table, htmlParts);
  }

  for (const line of lines) {
    if (code) {
      if (/^```/.test(line)) {
        htmlParts.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
        code = null;
      } else {
        code.lines.push(line);
      }
      continue;
    }

    if (/^```/.test(line)) {
      flushFlow();
      code = { lines: [] };
      continue;
    }

    if (line.trim() === "<!-- pagebreak -->") {
      flushFlow();
      htmlParts.push('<hr class="pagebreak">');
      continue;
    }

    if (!line.trim()) {
      flushFlow();
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      flushParagraph(paragraph, htmlParts);
      list = flushList(list, htmlParts);
      flushBlockquote(blockquote, htmlParts);
      table.push(line);
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph(paragraph, htmlParts);
      list = flushList(list, htmlParts);
      flushTable(table, htmlParts);
      blockquote.push(line.replace(/^>\s?/, ""));
      continue;
    }

    const ordered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    if (ordered || unordered) {
      flushParagraph(paragraph, htmlParts);
      flushBlockquote(blockquote, htmlParts);
      flushTable(table, htmlParts);
      const type = ordered ? "ol" : "ul";
      if (!list || list.type !== type) list = flushList(list, htmlParts) || { type, items: [] };
      list.items.push(ordered ? ordered[2] : unordered[1]);
      continue;
    }

    flushTable(table, htmlParts);
    flushBlockquote(blockquote, htmlParts);
    list = flushList(list, htmlParts);
    paragraph.push(line.trim());
  }

  flushFlow();
  if (code) htmlParts.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
  return htmlParts.join("\n");
}

function toText(lines) {
  return lines
    .join(" ")
    .replace(/<!-- pagebreak -->/g, " ")
    .replace(/[`*_>#|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseManual(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const title = lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "").trim() || "北京交通大学生存手册";
  const chapters = [];
  let currentChapter = null;
  let currentSection = null;
  const usedIds = new Map();

  function uniqueId(base) {
    const count = usedIds.get(base) || 0;
    usedIds.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  }

  function ensureChapter(titleText) {
    const id = uniqueId(slugify(titleText, `chapter-${chapters.length + 1}`));
    currentChapter = {
      id,
      title: titleText,
      introLines: [],
      sections: []
    };
    chapters.push(currentChapter);
    currentSection = null;
  }

  for (const line of lines) {
    if (line.startsWith("# ")) continue;

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      ensureChapter(h2[1].trim());
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3 && currentChapter) {
      const titleText = h3[1].trim();
      currentSection = {
        id: uniqueId(slugify(titleText, `${currentChapter.id}-section-${currentChapter.sections.length + 1}`)),
        title: titleText,
        lines: []
      };
      currentChapter.sections.push(currentSection);
      continue;
    }

    if (!currentChapter && line.trim()) {
      ensureChapter("写在前面");
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else if (currentChapter) {
      currentChapter.introLines.push(line);
    }
  }

  for (const chapter of chapters) {
    chapter.introHtml = renderMarkdown(chapter.introLines);
    chapter.text = toText(chapter.introLines);
    for (const section of chapter.sections) {
      section.html = renderMarkdown(section.lines);
      section.text = toText(section.lines);
      delete section.lines;
    }
    delete chapter.introLines;
  }

  return {
    title,
    source: "北京交通大学生存指南/北京交通大学生存手册_重构完整稿.md",
    authorUrl: "https://github.com/aboutguyuan",
    projectUrl: "https://github.com/aboutguyuan/BJTU-book",
    builtAt: new Date().toISOString(),
    chapters
  };
}

await rm(distPath, { recursive: true, force: true });
await mkdir(distPath, { recursive: true });

const markdown = await readFile(sourcePath, "utf8");
const siteData = parseManual(markdown);

await copyFile(path.join(root, "index.html"), path.join(distPath, "index.html"));
await copyFile(path.join(root, "style.css"), path.join(distPath, "style.css"));
await copyFile(path.join(root, "app.js"), path.join(distPath, "app.js"));
await writeFile(path.join(distPath, "data.js"), `window.SITE_DATA = ${JSON.stringify(siteData)};\n`);

console.log(`Built ${siteData.chapters.length} chapters into dist/`);
