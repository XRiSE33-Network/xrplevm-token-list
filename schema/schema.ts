interface Attribute {
  trait_type?: string; // e.g. "Category"
  value: string | number; // e.g. "Utility" or 1000000
  display_type?: string; // e.g. "number", "date"
}

interface TokenMetadata {
  name: string;
  description: string;
  image?: string; // repo-relative path or URI, validated by scripts
  external_url?: string;
  attributes?: Attribute[];
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;

  /**
   * Additional free-form fields (e.g. coingeckoId, documentation, etc.)
   */
  extensions?: Record<string, unknown>;

  /**
   * Tag IDs referencing top-level TokenListFile.tags.
   * Must match /^[a-z0-9-_]{1,32}$/ per JSON schema.
   */
  tags?: string[];

  /**
   * Optional absolute URI for the token logo.
   * Useful for UIs that want a direct URL separate from `image`.
   */
  logoURI?: string;
}

export type TokenInfo = Partial<TokenMetadata> & {
  address: string; // EIP‑55
  chainId: number; // EIP‑155 chain ID
  symbol: string;
  decimals: number;
  totalSupply?: string;
};

/* ───────────── Top-level list metadata ───────────── */

export interface TokenListVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface TokenListTag {
  name: string;
  description?: string;
}

export type TokenListTagId = string;

export interface TokenListLicense {
  name: string; // e.g. "MIT", "CC0-1.0"
  url?: string;
}

export type TokenListSourceType =
  | "coingecko"
  | "cmc"
  | "project"
  | "explorer"
  | "manual"
  | "other";

export interface TokenListSource {
  name: string;
  url?: string;
  type?: TokenListSourceType;

  // Allow for future extensions (e.g. apiKeyId, notes, etc.)
  [key: string]: unknown;
}

export interface TokenListVerification {
  policy?: string;
  lastAudit?: string; // ISO date-time
  auditor?: string;

  [key: string]: unknown;
}

export type TokenListFile = {
  name?: string;
  timestamp?: string; // ISO8601
  version?: TokenListVersion;
  logoURI?: string;
  keywords?: string[];
  license?: TokenListLicense;

  /**
   * Registry of tags: keys are tag IDs, values are definitions.
   * Keys must match /^[a-z0-9-_]{1,32}$/ per JSON schema.
   */
  tags?: Record<TokenListTagId, TokenListTag>;

  sources?: TokenListSource[];
  verification?: TokenListVerification;

  // Core data
  tokens: TokenInfo[];
};
