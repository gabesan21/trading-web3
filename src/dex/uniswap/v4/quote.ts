import { ethers } from 'ethers';
import { QuoteProvider, QuoteParams, Quote } from '../../../types/quote';
import { QuoteError, QuoteErrorType } from '../../../types/errors';
import { validateToken, validateAmount } from '../../../utils/validation';
import { Logger } from '../../../utils/logger';
import { retry } from '../../../utils/retry';
import { UniswapV4Config } from '../../../config/dex';

/**
 * Uniswap V4 PoolKey structure
 * 
 * V4 uses a PoolKey to identify pools, consisting of:
 * - currency0: Lower address token (lexicographically)
 * - currency1: Higher address token (lexicographically)  
 * - fee: Fee tier in basis points (e.g., 3000 = 0.3%)
 * - tickSpacing: Spacing between initialized ticks
 * - hooks: Address of hook contract (0x0 for no hooks)
 * 
 * Token ordering: currency0 < currency1 (address comparison)
 */
interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

// Uniswap V4 Quoter ABI (quoteExactInputSingle function)
const QUOTER_V4_ABI = [
  'function quoteExactInputSingle((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool zeroForOne, uint128 exactAmount) external returns (uint256 amountOut, uint256 gasEstimate)',
];

/**
 * Uniswap V4 Quote Provider
 * 
 * Provides quotes from Uniswap V4 pools using the V4 Quoter contract.
 * Supports multiple fee tiers and proper token ordering (currency0 < currency1).
 */
export class UniswapV4QuoteProvider implements QuoteProvider {
  name = 'Uniswap V4';
  
  private provider: ethers.Provider;
  private quoter: ethers.Contract | null = null;
  private v4Config: UniswapV4Config;
  private maxRetries: number;
  private chainId: number;

  /**
   * Creates a new Uniswap V4 quote provider
   * @param rpcUrl Ethereum RPC endpoint
   * @param v4Config Uniswap V4 configuration
   * @param chainId Chain ID for the network
   * @param maxRetries Maximum number of retry attempts
   */
  constructor(
    rpcUrl: string,
    v4Config: UniswapV4Config,
    chainId: number,
    maxRetries: number = 3
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.v4Config = v4Config;
    this.chainId = chainId;
    this.maxRetries = maxRetries;
    
    // Only initialize quoter if address is provided
    if (v4Config.quoterAddress && v4Config.quoterAddress !== '') {
      this.quoter = new ethers.Contract(
        v4Config.quoterAddress,
        QUOTER_V4_ABI,
        this.provider
      );
      Logger.info(`${this.name}: Initialized with quoter at ${v4Config.quoterAddress}`);
    } else {
      Logger.warn(`${this.name}: No quoter address configured. V4 quotes will not be available.`);
    }
  }

  /**
   * Constructs a PoolKey with proper token ordering
   * 
   * V4 requires currency0 < currency1 (lexicographic address comparison).
   * This helper ensures correct ordering and calculates zeroForOne direction.
   * 
   * @param tokenIn Input token address
   * @param tokenOut Output token address
   * @param fee Fee tier in basis points
   * @param tickSpacing Tick spacing for the fee tier
   * @param hooks Hook contract address (0x0 for no hooks)
   * @returns PoolKey with ordered tokens and zeroForOne direction
   */
  private constructPoolKey(
    tokenIn: string,
    tokenOut: string,
    fee: number,
    tickSpacing: number,
    hooks: string
  ): { poolKey: PoolKey; zeroForOne: boolean } {
    // Normalize addresses to lowercase for comparison
    const tokenInLower = tokenIn.toLowerCase();
    const tokenOutLower = tokenOut.toLowerCase();
    
    // Determine token ordering: currency0 must be < currency1
    const isTokenInFirst = tokenInLower < tokenOutLower;
    const currency0 = isTokenInFirst ? tokenIn : tokenOut;
    const currency1 = isTokenInFirst ? tokenOut : tokenIn;
    
    // zeroForOne = true if swapping currency0 -> currency1
    // zeroForOne = false if swapping currency1 -> currency0
    const zeroForOne = isTokenInFirst;
    
    const poolKey: PoolKey = {
      currency0,
      currency1,
      fee,
      tickSpacing,
      hooks,
    };
    
    return { poolKey, zeroForOne };
  }

  /**
   * Fetches a quote from Uniswap V4
   * @param params Quote parameters
   * @returns Promise resolving to a Quote
   */
  async getQuote(params: QuoteParams): Promise<Quote> {
    const startTime = Date.now();

    try {
      // Check if quoter is configured
      if (!this.quoter) {
        throw new QuoteError(
          QuoteErrorType.CONFIGURATION_ERROR,
          this.name,
          'Uniswap V4 is not configured. Set UNISWAP_V4_QUOTER_ADDRESS or configure in config/dex.json when V4 becomes available.'
        );
      }

      // Validate inputs
      validateToken(params.tokenIn, this.name);
      validateToken(params.tokenOut, this.name);
      validateAmount(params.amountIn, this.name);

      Logger.debug(`${this.name}: Fetching quote`, {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountIn: params.amountIn.toString(),
      });

      // Get fee tier configuration
      const feeTier = this.v4Config.feeTiers.find(
        (tier) => tier.fee === this.v4Config.defaultFeeTier
      );
      
      if (!feeTier) {
        throw new QuoteError(
          QuoteErrorType.CONFIGURATION_ERROR,
          this.name,
          `Default fee tier ${this.v4Config.defaultFeeTier} not found in configuration`
        );
      }

      // Construct PoolKey with proper token ordering
      const { poolKey, zeroForOne } = this.constructPoolKey(
        params.tokenIn.address,
        params.tokenOut.address,
        feeTier.fee,
        feeTier.tickSpacing,
        this.v4Config.defaultHooks
      );

      Logger.debug(`${this.name}: Using PoolKey`, {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
        zeroForOne,
      });

      // Call quoter with retry logic
      const [amountOut, gasEstimate] = await retry(
        async () => {
          const result = await this.quoter!.quoteExactInputSingle.staticCall(
            poolKey,
            zeroForOne,
            params.amountIn
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
        gasEstimate: gasEstimate.toString(),
        duration: `${duration}ms`,
      });

      return {
        provider: this.name,
        amountOut: BigInt(amountOut.toString()),
        estimatedGas: BigInt(gasEstimate.toString()),
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
          'Insufficient liquidity or invalid token pair (pool may not exist)',
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

  /**
   * Tries multiple fee tiers to find the best quote
   * @param params Quote parameters
   * @returns Promise resolving to the best Quote across all fee tiers
   */
  async getBestQuote(params: QuoteParams): Promise<Quote> {
    if (!this.quoter) {
      throw new QuoteError(
        QuoteErrorType.CONFIGURATION_ERROR,
        this.name,
        'Uniswap V4 is not configured'
      );
    }

    Logger.debug(`${this.name}: Trying multiple fee tiers for best quote`);
    
    const quotePromises = this.v4Config.feeTiers.map(async (feeTier): Promise<Quote | null> => {
      try {
        // Construct PoolKey for this fee tier
        const { poolKey, zeroForOne } = this.constructPoolKey(
          params.tokenIn.address,
          params.tokenOut.address,
          feeTier.fee,
          feeTier.tickSpacing,
          this.v4Config.defaultHooks
        );

        // Get quote for this fee tier
        const [amountOut, gasEstimate] = await this.quoter!.quoteExactInputSingle.staticCall(
          poolKey,
          zeroForOne,
          params.amountIn
        );

        return {
          provider: `${this.name} (fee: ${feeTier.fee / 10000}%)`,
          amountOut: BigInt(amountOut.toString()),
          estimatedGas: BigInt(gasEstimate.toString()),
          timestamp: Date.now(),
          fee: BigInt(feeTier.fee),
        };
      } catch (error) {
        // Pool doesn't exist for this fee tier, skip
        Logger.debug(`${this.name}: No pool for fee tier ${feeTier.fee}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    });

    const quotes = await Promise.all(quotePromises);
    const validQuotes = quotes.filter((q): q is Quote => q !== null && q.estimatedGas !== undefined);

    if (validQuotes.length === 0) {
      throw new QuoteError(
        QuoteErrorType.INSUFFICIENT_LIQUIDITY,
        this.name,
        'No valid pools found for this token pair across any fee tier'
      );
    }

    // Return the quote with the highest output amount
    const bestQuote = validQuotes.reduce((best, current) => 
      current.amountOut > best.amountOut ? current : best
    );

    Logger.info(`${this.name}: Best quote found`, {
      provider: bestQuote.provider,
      amountOut: bestQuote.amountOut.toString(),
    });

    return bestQuote;
  }
}
