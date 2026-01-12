import { describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const allowedGlobalScopeFile = path.join(srcRoot, "core", "api", "SiYuanApiAdapter.ts");

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") {
        continue;
      }
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".svelte"))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("SiYuan global scope access", () => {
  it("limits global scope usage to the API adapter", async () => {
    const files = await collectSourceFiles(srcRoot);
    const offenders: string[] = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, "utf8");
      if (content.includes("globalThis") && filePath !== allowedGlobalScopeFile) {
        offenders.push(path.relative(repoRoot, filePath));
      }
    }

    expect(offenders).toEqual([]);
  });
});
