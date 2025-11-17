// Re-export all the core types
export * from "../schema/schema";

// And declare the default export type (the JSON token list)
import type { TokenListFile } from "../schema/schema";

/**
 * Default export is the full token list as loaded from JSON.
 * This is *types only* – no runtime code – used to type the JSON entrypoint.
 */
declare const tokenList: TokenListFile;
export default tokenList;
