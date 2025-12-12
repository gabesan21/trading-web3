/**
 * Token definition with metadata
 */
export interface Token {
  /** Contract address of the token */
  address: string;
  
  /** Number of decimals for the token (e.g., 18 for most ERC20s) */
  decimals: number;
  
  /** Token symbol (e.g., WETH, USDC) */
  symbol: string;
  
  /** Chain ID where the token exists */
  chainId: number;
}

/**
 * Parameters for requesting a quote
 */
export interface QuoteParams {
  /** Token to swap from */
  tokenIn: Token;
  
  /** Token to swap to */
  tokenOut: Token;
  
  /** Amount of tokenIn to swap (in smallest unit, e.g., wei) */
  amountIn: bigint;
  
  /** Chain ID for the swap */
  chainId: number;
}

/**
 * Quote response from a provider
 */
export interface Quote {
  /** Name of the provider that returned this quote */
  provider: string;
  
  /** Expected output amount in smallest unit (e.g., wei) */
  amountOut: bigint;
  
  /** Estimated gas cost (optional) */
  estimatedGas?: bigint;
  
  /** Route taken for the swap (optional) */
  route?: string[];
  
  /** Fee amount (optional) */
  fee?: bigint;
  
  /** Timestamp when the quote was generated */
  timestamp: number;
}

/**
 * Common interface for quote providers
 */
export interface QuoteProvider {
  /** Name of the provider */
  name: string;
  
  /**
   * Fetches a quote for the given parameters
   * @param params Quote parameters
   * @returns Promise resolving to a Quote
   */
  getQuote(params: QuoteParams): Promise<Quote>;
}
