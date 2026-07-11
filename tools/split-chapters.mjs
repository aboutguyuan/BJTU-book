console.error([
  "tools/split-chapters.mjs 已停用。",
  "content/chapters/ 是唯一内容源，工具不会再用旧完整稿覆盖它。",
  "如需生成完整 Markdown，请运行：npm run export:markdown"
].join("\n"));

process.exitCode = 1;
