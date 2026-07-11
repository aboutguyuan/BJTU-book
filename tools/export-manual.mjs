import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assembleManualMarkdown,
  chaptersPath,
  exportedMarkdownName,
  projectRoot,
  readChapterSources
} from "./manual-source.mjs";

function outputFromArgs(args) {
  if (!args.length) return path.join(projectRoot, "dist", exportedMarkdownName);
  if (args.length === 2 && args[0] === "--output" && args[1]) {
    return path.resolve(projectRoot, args[1]);
  }
  throw new Error("用法：node tools/export-manual.mjs [--output <输出文件.md>]");
}

const outputPath = outputFromArgs(process.argv.slice(2));
const relativeToChapters = path.relative(chaptersPath, outputPath);
if (!relativeToChapters.startsWith("..") && !path.isAbsolute(relativeToChapters)) {
  throw new Error("为保护唯一内容源，导出文件不能写入 content/chapters/。");
}

const sources = await readChapterSources();
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, assembleManualMarkdown(sources), "utf8");

console.log(`Exported ${sources.length} chapters to ${path.relative(projectRoot, outputPath)}`);
