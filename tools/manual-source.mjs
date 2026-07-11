import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const chaptersPath = path.join(projectRoot, "content", "chapters");
export const manualTitle = "北京交通大学生存手册";
export const canonicalSourceLabel = "content/chapters/*.md";
export const exportedMarkdownName = "北京交通大学生存手册_完整稿.md";

const filenameCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base"
});

function headingsOutsideCodeFences(markdown) {
  const headings = [];
  let fence = null;

  for (const [index, line] of markdown.replace(/\r\n/g, "\n").split("\n").entries()) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }

    if (!fence) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) headings.push({ level: match[1].length, title: match[2].trim(), line: index + 1 });
    }
  }

  return headings;
}

function validateChapter(source) {
  if (!source.markdown.trim()) {
    throw new Error(`章节文件为空：content/chapters/${source.filename}`);
  }

  const headings = headingsOutsideCodeFences(source.markdown);
  const h1 = headings.find((heading) => heading.level === 1);
  if (h1) {
    throw new Error(
      `章节文件不应包含一级标题：content/chapters/${source.filename}:${h1.line}。` +
      `全书标题由构建工具统一生成。`
    );
  }

  const h2 = headings.filter((heading) => heading.level === 2);
  if (h2.length !== 1) {
    throw new Error(
      `章节文件必须且只能包含一个二级章节标题：content/chapters/${source.filename}（当前 ${h2.length} 个）。`
    );
  }

  const firstContentLine = source.markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .findIndex((line) => line.trim());
  if (firstContentLine + 1 !== h2[0].line) {
    throw new Error(
      `章节文件的第一段有效内容必须是二级标题：content/chapters/${source.filename}:${h2[0].line}。`
    );
  }

  return { ...source, title: h2[0].title };
}

export async function readChapterSources() {
  let entries;
  try {
    entries = await readdir(chaptersPath, { withFileTypes: true });
  } catch (error) {
    throw new Error(
      `无法读取唯一内容源 ${canonicalSourceLabel}。请确认 content/chapters/ 存在且可读。`,
      { cause: error }
    );
  }

  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort((a, b) => filenameCollator.compare(a, b));

  if (!filenames.length) {
    throw new Error(`唯一内容源 ${canonicalSourceLabel} 中没有 Markdown 章节，构建已停止。`);
  }

  const sources = [];
  for (const filename of filenames) {
    const markdown = await readFile(path.join(chaptersPath, filename), "utf8");
    sources.push(validateChapter({ filename, markdown }));
  }

  const seenTitles = new Map();
  for (const source of sources) {
    if (seenTitles.has(source.title)) {
      throw new Error(
        `章节标题重复：“${source.title}”（${seenTitles.get(source.title)} 与 ${source.filename}）。`
      );
    }
    seenTitles.set(source.title, source.filename);
  }

  return sources;
}

export function assembleManualMarkdown(sources) {
  const notice = [
    "<!--",
    `  此文件由 ${canonicalSourceLabel} 自动导出。`,
    "  请勿直接编辑；修改正文后重新运行 npm run export:markdown。",
    "-->"
  ].join("\n");
  const chapters = sources.map((source) => source.markdown.trim()).join("\n\n");
  return `# ${manualTitle}\n\n${notice}\n\n${chapters}\n`;
}
