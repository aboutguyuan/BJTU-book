import { mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { projectRoot } from "./manual-source.mjs";

const pdfPath = path.resolve(
  projectRoot,
  process.argv[2] || path.join("output", "pdf", "北京交通大学生存手册.pdf")
);
const renderDir = path.join(projectRoot, "tmp", "pdfs", "verification");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr?.trim() || `退出码 ${result.status}`;
    throw new Error(`${command} 执行失败：${detail}`);
  }
  return result.stdout;
}

const info = run("pdfinfo", [pdfPath]);
const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
const pageSize = info.match(/^Page size:\s+(.+)$/m)?.[1] || "未知";
if (!Number.isInteger(pages) || pages < 1) throw new Error("pdfinfo 未返回有效页数。");
const dimensions = pageSize.match(/^(\d+(?:\.\d+)?)\s+x\s+(\d+(?:\.\d+)?)\s+pts/i);
const width = Number(dimensions?.[1]);
const height = Number(dimensions?.[2]);
if (Math.abs(width - 595.28) > 2 || Math.abs(height - 841.89) > 2) {
  throw new Error(`PDF 页面不是预期的 A4 尺寸：${pageSize}`);
}

await rm(renderDir, { recursive: true, force: true });
await mkdir(renderDir, { recursive: true });
const samples = [...new Set([1, Math.ceil(pages / 2), pages])];
for (const page of samples) {
  run("pdftoppm", [
    "-f", String(page),
    "-l", String(page),
    "-singlefile",
    "-png",
    "-r", "144",
    pdfPath,
    path.join(renderDir, `page-${String(page).padStart(3, "0")}`)
  ]);
}

console.log(`PDF verification passed: ${pages} pages, ${pageSize}`);
console.log(`Rendered review samples: ${path.relative(projectRoot, renderDir)}/`);
