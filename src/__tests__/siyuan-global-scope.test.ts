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

    // Standard browser APIs that are OK to use directly
    const allowedGlobalAPIs = [
      "globalThis.setTimeout",
      "globalThis.clearTimeout",
      "globalThis.setInterval",
      "globalThis.clearInterval",
      "globalThis.fetch",
      "globalThis.crypto",
      "globalThis.console",
      "globalThis.Promise",
    ];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, "utf8");
      
      // Skip if file doesn't use globalThis
      if (!content.includes("globalThis")) {
        continue;
      }
      
      // Skip if it's the allowed file
      if (filePath === allowedGlobalScopeFile) {
        continue;
      }
      
      // Check if it uses disallowed globalThis patterns
      // Look for globalThis access that's not in the allowed list
      const globalThisMatches = content.match(/globalThis\.(\w+)/g) || [];
      const hasDisallowedAccess = globalThisMatches.some(match => {
        return !allowedGlobalAPIs.some(allowed => match.startsWith(allowed));
      });
      
      if (hasDisallowedAccess) {
        offenders.push(path.relative(repoRoot, filePath));
      }
    }

    expect(offenders).toEqual([]);
  });
});
