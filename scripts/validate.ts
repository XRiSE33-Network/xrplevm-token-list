#!/usr/bin/env node
/**
 * Validate `src/list.json` against the JSON-Schema and extra domain rules.
 *
 * Usage:
 *   pnpm validate  # checks default tokens.json
 *   pnpm validate some/file.json
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import Ajv from "ajv";
import addFormats from "ajv-formats";

import { getAddress } from "ethers";

import sharp from "sharp";

import { TokenListFile } from "../schema/schema.js";

const root = path.resolve(__dirname, "..");
const tokensPath = path.resolve(root, "src", "list.json");
const schemaPath = path.resolve(root, "schema", "tokenlist.schema.json");

const ALLOWED_EXTS = [".png", ".svg", ".jpg", ".jpeg"];
const SIZE_LIMIT = {
  png: 50 * 1024,
  svg: 25 * 1024,
  jpg: 35 * 1024,
  jpeg: 35 * 1024,
};

/* Small helper so we keep the happy path readable */
function bail(msg: string): never {
  console.error("❌ " + msg);
  process.exit(1);
}

/* ──────────── Main ──────────── */

async function main() {
  const listPath = process.argv[2] ?? tokensPath;

  /* Load JSON & schema */
  const [rawList, rawSchema] = await Promise.all([
    fs.readFile(listPath, "utf8"),
    fs.readFile(schemaPath, "utf8"),
  ]);

  const data = JSON.parse(rawList) as TokenListFile;

  const schema = JSON.parse(rawSchema);

  // ---------- JSON-Schema validation ----------
  const ajv = new Ajv({ allErrors: true, strict: "log" });

  ajv.addKeyword("markdownDescription");

  addFormats(ajv);

  const validate = ajv.compile(schema);

  if (!validate(data)) {
    console.error("❌ Schema validation failed:");
    console.error(validate.errors);
    process.exit(1);
  }

  /* Custom invariants */
  const seenAddrChain = new Set<string>(); // `${chainId}:${address}`
  const seenSymbolChain = new Set<string>(); // `${chainId}:${SYMBOL}`

  // Collect allowed tag IDs from top-level tags (if any)
  const allowedTagIds = new Set<string>(
    data.tags ? Object.keys(data.tags) : []
  );

  for (const token of data.tokens) {
    /* ─ Chain ID ─ */
    const chainId = token.chainId;

    if (!Number.isInteger(chainId) || chainId <= 0)
      bail(
        `Invalid chainId for ${token.symbol ?? token.address}: ${token.chainId}`
      );

    /* address – must be checksummed & unique */
    let checksum: string;
    try {
      checksum = getAddress(token.address);
    } catch {
      bail(`Invalid address: ${token.address}`);
    }

    if (token.address !== checksum)
      bail(`Address not checksummed: ${token.address}`);

    const addrKey = `${chainId}:${checksum}`;

    if (seenAddrChain.has(addrKey)) bail(`Duplicate contract: ${addrKey}`);

    seenAddrChain.add(addrKey);

    /* symbol – unique per chain, case-insensitive */
    const sym = token.symbol.toUpperCase();
    const symKey = `${chainId}:${sym}`;

    if (seenSymbolChain.has(symKey))
      bail(`Duplicate symbol '${sym}' on chain ${chainId}`);

    seenSymbolChain.add(symKey);

    /* ─ Tag references ─ */
    if (token.tags && token.tags.length > 0) {
      for (const tagId of token.tags) {
        if (!allowedTagIds.has(tagId)) {
          bail(
            `Unknown tag '${tagId}' on token ${sym} (chain ${chainId}). ` +
              `Define it under top-level 'tags' in the token list.`
          );
        }
      }
    }

    /* ─ Logo rules ─ */
    if (token.image) {
      const rel = token.image.replace(/^\.?\//, ""); // strip leading ./ if present

      const expectedDir = `images/${chainId}/`;

      if (!rel.startsWith(expectedDir))
        bail(
          `Logo for ${sym} must live in '${expectedDir}' (got '${token.image}')`
        );

      const localPath = path.join(root, rel);

      const ext = path.extname(localPath).toLowerCase();

      if (!ALLOWED_EXTS.includes(ext))
        bail(
          `Logo for ${sym} must be one of: ${ALLOWED_EXTS.join(
            ", "
          )} (got “${ext}”)`
        );

      const fileName = path.basename(localPath, ext);

      if (fileName.toLowerCase() !== checksum.toLowerCase())
        bail(`Logo file name must match checksummed address for ${sym}`);

      try {
        const { size } = await fs.stat(localPath);
        const limit =
          SIZE_LIMIT[ext.slice(1) as "png" | "svg" | "jpg" | "jpeg"];
        if (size > limit)
          bail(
            `Logo ${rel} exceeds ${Math.round(
              limit / 1024
            )} KiB (${size} bytes)`
          );
      } catch {
        bail(`Logo file for ${sym} not found: ${rel}`);
      }

      // Raster formats: PNG/JPG — enforce square & optional size
      const meta = await sharp(localPath).metadata();

      if (!meta.width || !meta.height)
        bail(`Could not read dimensions for logo ${rel}`);

      if (meta.width !== meta.height)
        bail(`Logo ${rel} must be square (got ${meta.width}x${meta.height})`);

      if (ext === ".svg") {
        const svg = await fs.readFile(localPath, "utf8");

        // No script tags
        if (/<script[\s>]/i.test(svg)) {
          bail(`SVG logo ${rel} must not contain <script> tags`);
        }

        // No event handler attributes like onload=, onclick=, etc.
        if (/on[a-z]+\s*=/i.test(svg)) {
          bail(
            `SVG logo ${rel} must not contain inline event handlers (on* attributes)`
          );
        }

        // No SMIL/CSS animation elements
        if (/<(?:animate|animateTransform|animateMotion|set)\b/i.test(svg)) {
          bail(`SVG logo ${rel} must not be animated`);
        }

        // No embedded base64 images or external HTTP images
        if (/data:image\/[a-zA-Z]+;base64,/i.test(svg)) {
          bail(`SVG logo ${rel} must not embed base64 images`);
        }
        if (/<image[^>]+(xlink:href|href)\s*=\s*["']http/i.test(svg)) {
          bail(`SVG logo ${rel} must not load external HTTP(S) images`);
        }
      }
    }
  }

  console.log("✔ Token list valid — all checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
