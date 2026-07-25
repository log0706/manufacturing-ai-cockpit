/**
 * Markdown link audit.
 *
 * Walks every tracked Markdown file and verifies that each relative link and image
 * target actually exists on disk. This exists because a documentation reference to a
 * file that was never committed is indistinguishable from a working link when reading
 * the source — and one such reference (`docs/audit/*`, silently excluded by an
 * unanchored `audit/` .gitignore rule) shipped in an earlier commit on this branch.
 *
 * Only relative targets are checked. External URLs, protocol-relative URLs, mailto:,
 * and pure in-page anchors are out of scope.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "..");

/** Tracked Markdown files, so untracked scratch notes are not audited. */
const markdownFiles = execFileSync("git", ["ls-files", "*.md", "**/*.md"], {
  cwd: repoRoot,
  encoding: "utf8",
})
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

// [text](target) and ![alt](target); skips reference-style and bare autolinks.
const LINK_RE = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

const isExternal = (target: string) =>
  /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//") || target.startsWith("#");

interface Broken {
  file: string;
  target: string;
  resolved: string;
}

const broken: Broken[] = [];
let checked = 0;

for (const file of markdownFiles) {
  const absolute = join(repoRoot, file);
  if (!existsSync(absolute)) continue;
  const source = readFileSync(absolute, "utf8");

  for (const match of source.matchAll(LINK_RE)) {
    const rawTarget = match[1];
    if (isExternal(rawTarget)) continue;

    // Strip any in-page anchor or query before resolving on disk.
    const target = rawTarget.split("#")[0].split("?")[0];
    if (!target) continue;

    checked += 1;

    const base = target.startsWith("/") ? repoRoot : dirname(absolute);
    const resolved = normalize(join(base, target.replace(/^\//, "")));

    // Anything resolving outside the repository is a defect regardless of existence.
    const insideRepo = !relative(repoRoot, resolved).startsWith("..");
    if (!insideRepo || !existsSync(resolved)) {
      broken.push({ file, target: rawTarget, resolved: relative(repoRoot, resolved) });
      continue;
    }

    // A link to a directory only resolves in a browser if it has an index/README.
    if (statSync(resolved).isDirectory()) {
      const hasIndex = ["README.md", "index.md", "index.html"].some((name) =>
        existsSync(join(resolved, name)),
      );
      if (!hasIndex) {
        broken.push({
          file,
          target: rawTarget,
          resolved: `${relative(repoRoot, resolved)} (directory without README/index)`,
        });
      }
    }
  }
}

console.log("Markdown link audit");
console.log(`markdown files=${markdownFiles.length}`);
console.log(`relative links checked=${checked}`);

if (broken.length) {
  console.error("");
  console.error("Markdown link audit FAILED");
  for (const item of broken) {
    console.error(`- ${item.file} -> "${item.target}" (resolved: ${item.resolved})`);
  }
  process.exit(1);
}

console.log("Markdown link audit passed");
