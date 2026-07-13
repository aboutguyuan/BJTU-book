import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "北京交通大学生存指南", "北京交通大学生存手册_重构完整稿.md");
const outputPath = path.join(root, "content", "chapters");

function fileSlug(text) {
  return Array.from(text.matchAll(/[\u4e00-\u9fa5A-Za-z0-9]+/g))
    .map((match) => match[0])
    .join("-")
    .slice(0, 64);
}

function chapterNumber(title, index) {
  if (/^写在前面/.test(title)) return "00";
  if (/^序章/.test(title)) return "00-A";
  const appendix = title.match(/^附录\s*([A-Z])/i);
  if (appendix) return `90-${appendix[1].toUpperCase()}`;
  if (/^结语/.test(title)) return "99";

  const chineseNums = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12,
    十三: 13,
    十四: 14,
    十五: 15,
    十六: 16,
    十七: 17,
    十八: 18,
    十九: 19,
    二十: 20,
    二十一: 21,
    二十二: 22,
    二十三: 23,
    二十四: 24,
    二十五: 25,
    二十六: 26,
    二十七: 27
  };
  const match = title.match(/^第(.+?)章/);
  if (match && chineseNums[match[1]]) return String(chineseNums[match[1]]).padStart(2, "0");
  return String(index).padStart(2, "0");
}

const markdown = await readFile(sourcePath, "utf8");
const lines = markdown.replace(/\r\n/g, "\n").split("\n");
const chapters = [];
let current = null;

for (const line of lines) {
  if (line.startsWith("# ")) continue;
  const h2 = line.match(/^##\s+(.+)$/);
  if (h2) {
    current = { title: h2[1].trim(), lines: [line] };
    chapters.push(current);
    continue;
  }
  if (current) current.lines.push(line);
}

await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });

for (let index = 0; index < chapters.length; index += 1) {
  const chapter = chapters[index];
  const order = chapterNumber(chapter.title, index + 1);
  const filename = `${order}-${fileSlug(chapter.title)}.md`;
  await writeFile(path.join(outputPath, filename), `${chapter.lines.join("\n").trim()}\n`);
}

console.log(`Wrote ${chapters.length} chapter files to content/chapters/`);
