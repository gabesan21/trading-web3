import { ethers } from 'ethers';
import { QuoteProvider, QuoteParams, Quote } from '../../../types/quote';
import { QuoteError, QuoteErrorType } from '../../../types/errors';
import { validateToken, validateAmount } from '../../../utils/validation';
import { Logger } from '../../../utils/logger';
import { retry } from '../../../utils/retry';

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

  /**
   * Creates a new Uniswap V3 quote provider
   * @param rpcUrl Ethereum RPC endpoint
   * @param quoterAddress Uniswap V3 Quoter contract address
   * @param maxRetries Maximum number of retry attempts
   */
  constructor(rpcUrl: string, quoterAddress: string, maxRetries: number = 3) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, this.provider);
    this.maxRetries = maxRetries;
  }

  /**
   * Fetches a quote from Uniswap V3
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

      // Use the most common fee tier (0.3% = 3000)
      const feeTier = 3000;

      // Call quoter with retry logic
      const amountOut = await retry(
        async () => {
          const result = await this.quoter.quoteExactInputSingle.staticCall(
            params.tokenIn.address,
            params.tokenOut.address,
            feeTier,
            params.amountIn,
            0 // sqrtPriceLimitX96 = 0 means no price limit
          );
          return result;
        },
        { maxRetries: this.maxRetries },
        `${this.name} quote`
      );

      const duration = Date.now() - startTime;

      Logger.info(`${this.name}: Quote fetched successfully`, {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountOut: amountOut.toString(),
        duration: `${duration}ms`,
      });

      return {
        provider: this.name,
        amountOut: BigInt(amountOut.toString()),
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
