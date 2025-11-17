import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function safeCopy(src: string, dest: string) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function safeCopyDir(srcDir: string, destDir: string) {
  await fs.mkdir(destDir, { recursive: true });
  await fs.cp(srcDir, destDir, { recursive: true });
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const dist = path.join(root, "dist");

  // Clean dist
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });

  // Copy tokenlist.json
  await safeCopy(
    path.join(root, "src", "list.json"),
    path.join(dist, "tokenlist.json")
  );

  // Copy ONLY the JSON schema (we don't want schema.ts in dist)
  const schemaSrc = path.join(root, "schema", "tokenlist.schema.json");
  const schemaDestDir = path.join(dist, "schema");
  await fs.mkdir(schemaDestDir, { recursive: true });
  await fs.copyFile(
    schemaSrc,
    path.join(schemaDestDir, "tokenlist.schema.json")
  );

  // Copy images directory if it exists
  try {
    await safeCopyDir(path.join(root, "images"), path.join(dist, "images"));
  } catch {
    console.warn("⚠ No images directory found, skipping.");
  }

  console.log("✔ Build completed successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
