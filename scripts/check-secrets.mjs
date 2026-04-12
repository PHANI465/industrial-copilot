/**
 * Fails if tracked git files contain patterns that look like API keys.
 * Run before push: npm run check-secrets
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

function trackedFiles() {
  try {
    const out = execSync("git ls-files", {
      encoding: "utf8",
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    console.error("check-secrets: not a git repo or git ls-files failed.");
    process.exit(1);
  }
}

const SKIP_NAMES = new Set([
  "package-lock.json",
  "check-secrets.mjs",
]);

const PATTERNS = [
  { name: "OpenAI-style secret key", re: /sk-(?:proj-)?[a-zA-Z0-9_-]{20,}/ },
  { name: "OPENAI_API_KEY with value", re: /OPENAI_API_KEY\s*=\s*sk-/i },
  { name: "Resend API key", re: /re_[a-zA-Z0-9_]{10,}/ },
  { name: "RESEND_API_KEY with value", re: /RESEND_API_KEY\s*=\s*re_/i },
];

let files = trackedFiles();
if (files.length === 0) {
  console.log("check-secrets: no tracked files yet (OK).");
  process.exit(0);
}

const violations = [];

for (const rel of files) {
  if (SKIP_NAMES.has(rel.split("/").pop() || rel)) continue;
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) continue;
  let text;
  try {
    text = readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  if (text.length > 5_000_000) continue;
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) {
      violations.push({ file: rel, pattern: name });
      break;
    }
  }
}

if (violations.length > 0) {
  console.error("check-secrets: possible secrets in tracked files:\n");
  for (const v of violations) {
    console.error(`  - ${v.file} (${v.pattern})`);
  }
  console.error(
    "\nRemove keys from git history if already committed; rotate keys at the provider; use .env.local only.\n"
  );
  process.exit(1);
}

console.log("check-secrets: OK (no obvious API keys in tracked files).");
