interface Attribute {
  trait_type?: string; // e.g. "Category"
  value: string | number; // e.g. "Utility" or 1000000
  display_type?: string; // e.g. "number", "date"
}

interface TokenMetadata {
  name: string;
  description: string;
  image?: string;
  external_url?: string;
  attributes?: Attribute[];
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;
  extensions?: Record<string, unknown>;
}

export type TokenInfo = Partial<TokenMetadata> & {
  address: string; // EIP‑55
  chainId: number; // EIP‑155 chain ID
  symbol: string;
  decimals: number;
  totalSupply?: string;
};

export type TokenListFile = { tokens: TokenInfo[] };
