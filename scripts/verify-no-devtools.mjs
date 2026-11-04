/**
 * Fails (exit 1) if developer tooling leaked into a production artifact.
 *
 *   node scripts/verify-no-devtools.mjs dist
 *   node scripts/verify-no-devtools.mjs android/app/src/main/assets/public
 *   node scripts/verify-no-devtools.mjs path/to/app.apk      (or a directory containing .apk files)
 *
 * Scans every text file (and the contents of APKs) for markers that only exist in src/devtools or in dev-only hooks.
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MARKERS = [
  "stickman-devtools",
  "Developer Panel",
  "Super Mode",
  "Wipe REAL save",
  "devtools-root",
  "__stickman",
  "__DEV_TOOLS__",
  "Reset enemy kills",
  "DEV SANDBOX",
];
const TEXT = /\.(js|mjs|css|html|json|map|txt|webmanifest|dex)$/i;

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("usage: verify-no-devtools.mjs <dir|apk>...");
  process.exit(2);
}

function* walk(p) {
  const st = statSync(p);
  if (st.isDirectory()) for (const f of readdirSync(p)) yield* walk(join(p, f));
  else yield p;
}

const hits = [];
let scanned = 0;
function scanFile(file, label) {
  const isText = TEXT.test(file);
  if (!isText) return;
  const buf = readFileSync(file);
  const s = buf.toString("latin1");
  scanned++;
  for (const m of MARKERS)
    if (s.includes(m)) hits.push(`${label}: contains "${m}"`);
}
function scanApk(apk) {
  const dir = mkdtempSync(join(tmpdir(), "apk-scan-"));
  try {
    execFileSync("unzip", ["-qo", apk, "-d", dir]);
    for (const f of walk(dir)) scanFile(f, `${apk}!${f.slice(dir.length + 1)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const t of targets) {
  if (!existsSync(t)) {
    console.error(`missing: ${t}`);
    process.exit(2);
  }
  for (const f of walk(t)) {
    if (/\.apk$/i.test(f)) scanApk(f);
    else scanFile(f, f);
  }
}
if (hits.length) {
  console.error(
    `FAIL: developer tooling found in production output:\n  ${hits.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `OK: no developer tooling in ${targets.join(", ")} (${scanned} files scanned)`,
);
