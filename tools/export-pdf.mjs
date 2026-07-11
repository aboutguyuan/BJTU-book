import { access, mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "./manual-source.mjs";

const inputPath = path.join(projectRoot, "dist", "print.html");
const outputDir = path.join(projectRoot, "output", "pdf");
const outputPath = path.join(outputDir, "北京交通大学生存手册.pdf");
const tempRoot = path.join(projectRoot, "tmp", "pdfs");

async function executableFile(candidate) {
  if (!candidate) return false;
  try {
    await access(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findBrowser() {
  const configured = [process.env.BROWSER_BIN, process.env.CHROME_BIN, process.env.EDGE_BIN].filter(Boolean);
  const knownPaths = [
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Microsoft", "Edge", "Application", "msedge.exe"),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe")
  ].filter(Boolean);

  for (const candidate of [...configured, ...knownPaths]) {
    if (await executableFile(candidate)) return candidate;
  }

  for (const command of configured) {
    const probe = spawnSync(command, ["--version"], { stdio: "ignore" });
    if (!probe.error && probe.status === 0) return command;
  }

  for (const command of ["microsoft-edge", "microsoft-edge-stable", "google-chrome", "chromium", "chromium-browser"]) {
    const probe = spawnSync(command, ["--version"], { stdio: "ignore" });
    if (!probe.error && probe.status === 0) return command;
  }

  throw new Error([
    "没有找到可用于生成 PDF 的 Chromium 系浏览器。",
    "请安装 Microsoft Edge、Google Chrome 或 Chromium，",
    "或通过 BROWSER_BIN=/path/to/browser npm run pdf 指定可执行文件。"
  ].join(" "));
}

await access(inputPath, constants.R_OK).catch(() => {
  throw new Error("缺少 dist/print.html；请先运行 npm run build。");
});
await mkdir(outputDir, { recursive: true });
await mkdir(tempRoot, { recursive: true });

const browser = await findBrowser();
const profilePath = await mkdtemp(path.join(tempRoot, "browser-profile-"));
const baseArgs = [
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--no-first-run",
  "--allow-file-access-from-files",
  "--run-all-compositor-stages-before-draw",
  "--no-pdf-header-footer",
  `--user-data-dir=${profilePath}`,
  `--print-to-pdf=${outputPath}`,
  pathToFileURL(inputPath).href
];
if (typeof process.getuid === "function" && process.getuid() === 0) baseArgs.unshift("--no-sandbox");

let result;
try {
  await rm(outputPath, { force: true });
  result = spawnSync(browser, ["--headless=new", ...baseArgs], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000
  });
  if (result.status !== 0) {
    await rm(outputPath, { force: true });
    result = spawnSync(browser, ["--headless", ...baseArgs], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      timeout: 120_000
    });
  }
} finally {
  await rm(profilePath, { recursive: true, force: true });
}

if (result.error || result.status !== 0) {
  await rm(outputPath, { force: true });
  const detail = result.error?.message || result.stderr?.trim() ||
    `退出码 ${result.status ?? "无"}${result.signal ? `，信号 ${result.signal}` : ""}`;
  throw new Error(`浏览器生成 PDF 失败：${detail}`);
}

const pdfStat = await stat(outputPath);
if (pdfStat.size < 10_000) {
  throw new Error(`生成的 PDF 体积异常（${pdfStat.size} bytes）：${outputPath}`);
}

console.log(`Generated PDF with ${browser}`);
console.log(path.relative(projectRoot, outputPath));
