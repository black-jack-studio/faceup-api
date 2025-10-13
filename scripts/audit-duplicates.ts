import { readdir } from "fs/promises";
import path from "path";

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  "legacy",
]);

async function walk(dir: string, entries: string[] = []): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    if (dirent.name.startsWith(".")) continue;
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (IGNORED_DIRS.has(dirent.name)) continue;
      await walk(fullPath, entries);
    } else {
      entries.push(fullPath);
    }
  }

  return entries;
}

async function main() {
  const root = path.resolve(process.cwd());
  const files = await walk(root, []);
  const byBase = new Map<string, string[]>();

  for (const file of files) {
    const base = path.basename(file).split(".")[0];
    if (!byBase.has(base)) {
      byBase.set(base, []);
    }
    byBase.get(base)!.push(path.relative(root, file));
  }

  const duplicates = Array.from(byBase.entries())
    .filter(([, paths]) => paths.length > 1)
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (duplicates.length === 0) {
    console.log("No duplicate basenames found.");
    return;
  }

  for (const [base, paths] of duplicates) {
    console.log(base);
    for (const entry of paths) {
      console.log(`  - ${entry}`);
    }
  }
}

main().catch((error) => {
  console.error("Failed to scan duplicates:", error);
  process.exit(1);
});
