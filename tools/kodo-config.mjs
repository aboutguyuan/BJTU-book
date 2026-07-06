import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const qiniuDir = path.join(root, ".qiniu");
const configPath = path.join(qiniuDir, "qupload.json");
const recordRoot = path.join(qiniuDir, "records");

const bucket = process.env.QINIU_BUCKET || process.argv[2];
const keyPrefix = process.env.QINIU_KEY_PREFIX || "";

if (!bucket) {
  console.error("Missing bucket name.");
  console.error("Usage: QINIU_BUCKET=<your-bucket> npm run kodo:config");
  console.error("   or: npm run kodo:config -- <your-bucket>");
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  console.error("Missing dist/. Run npm run build before generating the Kodo upload config.");
  process.exit(1);
}

fs.mkdirSync(qiniuDir, { recursive: true });
fs.mkdirSync(recordRoot, { recursive: true });

const config = {
  src_dir: distDir,
  bucket,
  key_prefix: keyPrefix,
  ignore_dir: false,
  overwrite: true,
  check_exists: true,
  check_hash: true,
  check_size: true,
  rescan_local: true,
  skip_suffixes: ".DS_Store",
  skip_fixed_strings: ".git,node_modules",
  log_file: path.join(qiniuDir, "qupload.log"),
  log_level: "info",
  log_stdout: true,
  file_type: 0,
  resumable_api_v2: true,
  detect_mime: 0,
  record_root: recordRoot
};

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Generated ${path.relative(root, configPath)}`);
console.log(`Bucket: ${bucket}`);
console.log(`Source: ${path.relative(root, distDir)}/`);
if (keyPrefix) {
  console.log(`Key prefix: ${keyPrefix}`);
}
