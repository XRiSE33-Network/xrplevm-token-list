# @xrise33/token-list - XRPL EVM Token List

[![npm version](https://img.shields.io/npm/v/@xrise33/token-list.svg)](https://www.npmjs.com/package/@xrise33/token-list)
[![CI](https://github.com/XRiSE33-Network/xrplevm-token-list/actions/workflows/ci.yml/badge.svg)](https://github.com/XRiSE33-Network/xrplevm-token-list/actions/workflows/ci.yml)

Canonical, versioned, and validated token metadata registry for the XRPL EVM sidechain ecosystem.

This repository contains:

- A validated token list JSON file
- A JSON Schema for tooling
- Logos for supported assets
- TypeScript type definitions for developers
- CI validation

## Install

```bash
npm install @xrise33/token-list
# or
pnpm add @xrise33/token-list
```

## Usage

ESM:

```ts
import tokenList from "@xrise33/token-list";

console.log(tokenList.name);
console.log(tokenList.version);
console.log(tokenList.tokens.length);
```

Access types:

```ts
import type { TokenListFile, TokenInfo } from "@xrise33/token-list/schema";

const list: TokenListFile = tokenList;

function filterStablecoins(tokens: TokenInfo[]) {
  return tokens.filter((t) => t.tags?.includes("stablecoin"));
}
```

Node (CJS):

```js
const tokenList = require("@xrise33/token-list");
```

From CDN (jsDelivr):

```txt
https://cdn.jsdelivr.net/npm/@xrise33/token-list/dist/tokenlist.json
```

Icons (example):

```
https://cdn.jsdelivr.net/npm/@xrise33/token-list/images/1440000/<CHECKSUM>.png

```

## JSON structure

The list follows a JSON schema (see schema/tokenlist.schema.json).

Top-level fields:

- `name`: Human-readable name of this list.
- `timestamp`: ISO8601 timestamp when this list was generated.
- `version`: { major, minor, patch } (semantic versioning).
- `logoURI`: Logo for this list.
- `keywords`: Optional keywords for discovery.
- `license`: License metadata.
- `tags`: Registry of tag IDs (e.g. stablecoin, bluechip).
- `sources`: Where this data came from.
- `verification`: Info about manual/automatic review.
- `tokens`: Array of token entries.

Each token:

- `address`: EIP-55 checksummed contract address.
- `chainId`: EIP-155 chain ID (1440000 for XRPLEVM).
- `symbol`: Ticker string.
- `decimals`: ERC-20 decimals.
- `name`, `description`: Metadata.
- `image`: Repo-relative logo path (images/<chainId>/<ADDRESS>.svg).
- `logoURI`: Optional absolute logo URI.
- `tags`: Array of tag IDs (must exist in top-level tags).
- `extensions`: Free-form extension fields.

See the schema file for full details.

## Versioning Policy

- `PATCH`: Fixes to existing token metadata (logos, names, decimals, links).
- `MINOR`: Add new tokens or non-breaking metadata fields.
- `MAJOR`: Breaking changes (removing tokens, schema changes, semantics).

Both the npm version and `version` field inside the JSON follow this policy.

## Contributing (Adding a token)

1. Add your token entry to `src/list.json`.
2. Add a logo file to `images/<chainId>/<checksummed-address>.svg` or `.png`.
3. Run:

   ```bash
   pnpm validate
   ```

4. Open a PR.

## Validation

Locally:

```bash
pnpm validate
```

CI runs the same validation on every push and pull request.

Rules enforced:

- JSON schema validation.
- Checksummed addresses and valid chain IDs.
- No duplicate `(chainId, address)` or `(chainId, symbol)` pairs.
- Logos live under `images/<chainId>/`.
- Logo filenames match checksummed addresses.
- Logos use allowed formats and size limits.
- Token tags reference existing top-level `tags`.

## 📦 SDK Usage

The package includes a small helper toolkit designed to make it easier to query tokens and construct logo URLs.

### Importing the SDK (TypeScript / ESM)

```ts
import list from "@xrise33/token-list";
import {
  getTokensByChain,
  getTokenByAddress,
  getTokenBySymbol,
  getTokensByTag,
  getLogoUri,
} from "@xrise33/token-list/sdk";

const xrplevm = getTokensByChain(list, 1440000);
const usdc = getTokenBySymbol(list, 1440000, "USDC");
const logo = usdc && getLogoUri(usdc);

console.log({ xrplevmCount: xrplevm.length, logo });
```

### CommonJS Usage (Node require)

Even though the package is ESM-native, CJS consumers can still use it:

```js
const list = require("@xrise33/token-list/dist/tokenlist.json");

// dynamic ESM import for SDK
(async () => {
  const { getTokenBySymbol } = await import("@xrise33/token-list/sdk");
  const token = getTokenBySymbol(list, 1440000, "USDC");
  console.log(token);
})();
```

> Full CJS support via .cjs builds may be added later if demand requires.

### CDN Logo Helper

```ts
const token = getTokenBySymbol(list, 1440000, "XRP");
const logoUri = token && getLogoUri(token);

console.log(logoUri);
// → https://cdn.jsdelivr.net/npm/@xrise33/token-list@latest/images/1440000/<address>.svg
```

### Helper Function Reference

| Function                                    | Purpose                         |
| ------------------------------------------- | ------------------------------- |
| `getTokensByChain(list, chainId)`           | returns all tokens on chain     |
| `getTokenByAddress(list, chainId, address)` | lookup by contract              |
| `getTokenBySymbol(list, chainId, symbol)`   | lookup by ticker                |
| `getTokensByTag(list, tagId)`               | filter by metadata tag          |
| `getLogoUri(token, opts?)`                  | deterministic CDN-safe logo URL |

---

## License

MIT © Contributors
