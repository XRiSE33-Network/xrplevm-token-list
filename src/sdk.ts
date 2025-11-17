import type { TokenInfo, TokenListFile } from "../schema/schema.js";

/**
 * Get all tokens on a given chain.
 */
export function getTokensByChain(
  list: TokenListFile,
  chainId: number
): TokenInfo[] {
  return list.tokens.filter((t) => t.chainId === chainId);
}

/**
 * Find a token by address (case-insensitive) on a given chain.
 */
export function getTokenByAddress(
  list: TokenListFile,
  chainId: number,
  address: string
): TokenInfo | undefined {
  const addrLower = address.toLowerCase();
  return list.tokens.find(
    (t) => t.chainId === chainId && t.address.toLowerCase() === addrLower
  );
}

/**
 * Find a token by symbol (case-insensitive) on a given chain.
 * Validator enforces uniqueness per chain.
 */
export function getTokenBySymbol(
  list: TokenListFile,
  chainId: number,
  symbol: string
): TokenInfo | undefined {
  const symUpper = symbol.toUpperCase();
  return list.tokens.find(
    (t) => t.chainId === chainId && t.symbol.toUpperCase() === symUpper
  );
}

/**
 * Get tokens that have a given tag ID (e.g. "stablecoin", "bluechip").
 */
export function getTokensByTag(
  list: TokenListFile,
  tagId: string
): TokenInfo[] {
  return list.tokens.filter((t) => t.tags?.includes(tagId));
}

/**
 * Build a logo URI for a token using jsDelivr, since the list stores
 * repo-relative `image` paths like "images/<chainId>/<address>.svg".
 *
 * If the token has `logoURI` set, that is preferred.
 */
export function getLogoUri(
  token: TokenInfo,
  options?: {
    /**
     * npm package name, default: "xrplevm-token-list"
     */
    packageName?: string;
    /**
     * Specific version or tag. Default: "latest".
     * Example: "1.2.3" or "1".
     */
    version?: string;
    /**
     * Override entire base (e.g. for self-hosted CDN).
     * Example: "https://cdn.mycdn.com/xrplevm-token-list/1.0.0"
     */
    baseUriOverride?: string;
  }
): string | undefined {
  if (token.logoURI) return token.logoURI;
  if (!token.image) return undefined;

  const {
    packageName = "@xrise33/token-list",
    version = "latest",
    baseUriOverride,
  } = options ?? {};

  const imagePath = token.image.replace(/^\//, "");

  if (baseUriOverride) {
    return `${baseUriOverride.replace(/\/$/, "")}/${imagePath}`;
  }

  // Default: jsDelivr CDN
  return `https://cdn.jsdelivr.net/npm/${packageName}@${version}/${imagePath}`;
}
