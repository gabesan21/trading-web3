import { ethers } from 'ethers';
import { QuoteProvider, QuoteParams, Quote } from '../../../types/quote';
import { QuoteError, QuoteErrorType } from '../../../types/errors';
import { validateToken, validateAmount } from '../../../utils/validation';
import { Logger } from '../../../utils/logger';
import { retry } from '../../../utils/retry';
import { FeeTier } from '../../../config/dex';

// Uniswap V3 Quoter ABI (minimal interface for quoteExactInputSingle)
const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
];

/**
 * Uniswap V3 Quote Provider
 */
export class UniswapV3QuoteProvider implements QuoteProvider {
  name = 'Uniswap V3';
  
  private provider: ethers.Provider;
  private quoter: ethers.Contract;
  private maxRetries: number;
  private feeTiers: FeeTier[];
  private defaultFeeTier: number;

  /**
   * Creates a new Uniswap V3 quote provider
   * @param rpcUrl Ethereum RPC endpoint
   * @param quoterAddress Uniswap V3 Quoter contract address
   * @param feeTiers Array of supported fee tiers
   * @param defaultFeeTier Default fee tier to try first
   * @param maxRetries Maximum number of retry attempts
   */
  constructor(
    rpcUrl: string,
    quoterAddress: string,
    feeTiers: FeeTier[],
    defaultFeeTier: number = 3000,
    maxRetries: number = 3
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, this.provider);
    this.maxRetries = maxRetries;
    this.feeTiers = feeTiers;
    this.defaultFeeTier = defaultFeeTier;
  }

  /**
   * Fetches a quote from Uniswap V3 for a specific fee tier
   * @param params Quote parameters
   * @param feeTier Fee tier to query
   * @returns Promise resolving to amountOut or null if pool doesn't exist
   */
  private async getQuoteForFeeTier(params: QuoteParams, feeTier: number): Promise<bigint | null> {
    try {
      const result = await this.quoter.quoteExactInputSingle.staticCall(
        params.tokenIn.address,
        params.tokenOut.address,
        feeTier,
        params.amountIn,
        0 // sqrtPriceLimitX96 = 0 means no price limit
      );
      return BigInt(result.toString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If pool doesn't exist or has no liquidity, return null
      if (errorMessage.includes('CALL_EXCEPTION') || errorMessage.includes('execution reverted')) {
        Logger.debug(`${this.name}: No liquidity for fee tier ${feeTier}`, {
          tokenIn: params.tokenIn.symbol,
          tokenOut: params.tokenOut.symbol,
        });
        return null;
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Fetches a quote from Uniswap V3
   * Tries multiple fee tiers and returns the best quote
   * @param params Quote parameters
   * @returns Promise resolving to a Quote
   */
  async getQuote(params: QuoteParams): Promise<Quote> {
    const startTime = Date.now();

    try {
      // Validate inputs
      validateToken(params.tokenIn, this.name);
      validateToken(params.tokenOut, this.name);
      validateAmount(params.amountIn, this.name);

      Logger.debug(`${this.name}: Fetching quote`, {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountIn: params.amountIn.toString(),
      });

      // Try default fee tier first
      let bestQuote: bigint | null = null;
      let bestFeeTier: number = this.defaultFeeTier;

      const defaultQuote = await retry(
        async () => this.getQuoteForFeeTier(params, this.defaultFeeTier),
        { maxRetries: this.maxRetries },
        `${this.name} quote (default fee tier)`
      );

      if (defaultQuote !== null) {
        bestQuote = defaultQuote;
        Logger.debug(`${this.name}: Quote from default fee tier ${this.defaultFeeTier}`, {
          amountOut: defaultQuote.toString(),
        });
      }

      // Try other fee tiers to find better quotes
      for (const feeTier of this.feeTiers) {
        if (feeTier.fee === this.defaultFeeTier) {
          continue; // Already tried
        }

        const quote = await retry(
          async () => this.getQuoteForFeeTier(params, feeTier.fee),
          { maxRetries: this.maxRetries },
          `${this.name} quote (fee tier ${feeTier.fee})`
        );

        if (quote !== null && (bestQuote === null || quote > bestQuote)) {
          bestQuote = quote;
          bestFeeTier = feeTier.fee;
          Logger.debug(`${this.name}: Better quote from fee tier ${feeTier.fee}`, {
            amountOut: quote.toString(),
          });
        }
      }

      if (bestQuote === null) {
        throw new QuoteError(
          QuoteErrorType.INSUFFICIENT_LIQUIDITY,
          this.name,
          'No liquidity found in any fee tier for this token pair'
        );
      }

      const duration = Date.now() - startTime;

      Logger.info(`${this.name}: Quote fetched successfully`, {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountOut: bestQuote.toString(),
        feeTier: bestFeeTier,
        duration: `${duration}ms`,
      });

      return {
        provider: this.name,
        amountOut: bestQuote,
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      Logger.error(`${this.name}: Quote failed`, {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      });

      // Wrap error with context
      if (error instanceof QuoteError) {
        throw error;
      }

      // Check for common error patterns
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('CALL_EXCEPTION') || errorMessage.includes('execution reverted')) {
        throw new QuoteError(
          QuoteErrorType.INSUFFICIENT_LIQUIDITY,
          this.name,
          'Insufficient liquidity or invalid token pair',
          error as Error
        );
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
        throw new QuoteError(
          QuoteErrorType.TIMEOUT,
          this.name,
          'Request timeout',
          error as Error
        );
      }

      if (errorMessage.includes('network') || errorMessage.includes('NETWORK_ERROR')) {
        throw new QuoteError(
          QuoteErrorType.NETWORK_ERROR,
          this.name,
          'Network error connecting to RPC',
          error as Error
        );
      }

      // Default to provider error
      throw new QuoteError(
        QuoteErrorType.PROVIDER_ERROR,
        this.name,
        errorMessage,
        error as Error
      );
    }
  }
}
