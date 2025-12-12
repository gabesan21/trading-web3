import axios, { AxiosInstance } from 'axios';
import { QuoteProvider, QuoteParams, Quote } from '../../types/quote';
import { QuoteError, QuoteErrorType } from '../../types/errors';
import { validateToken, validateAmount } from '../../utils/validation';
import { Logger } from '../../utils/logger';
import { retry } from '../../utils/retry';

/**
 * CowSwap API response for quotes
 */
interface CowSwapQuoteResponse {
  quote: {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    buyAmount: string;
    feeAmount: string;
    validTo: number;
  };
}

/**
 * CowSwap Quote Provider
 */
export class CowSwapQuoteProvider implements QuoteProvider {
  name = 'CowSwap';
  
  private client: AxiosInstance;
  private maxRetries: number;
  private appData: string;

  /**
   * Creates a new CowSwap quote provider
   * @param apiBaseUrl Base URL for the CowSwap API
   * @param appData App identifier for analytics
   * @param requestTimeout Request timeout in milliseconds
   * @param maxRetries Maximum number of retry attempts
   */
  constructor(
    apiBaseUrl: string,
    appData: string = 'trading-web3',
    requestTimeout: number = 30000,
    maxRetries: number = 3
  ) {
    this.client = axios.create({
      baseURL: apiBaseUrl,
      timeout: requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.maxRetries = maxRetries;
    this.appData = appData;
  }

  /**
   * Fetches a quote from CowSwap
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

      // Build quote request body
      const quoteRequest = {
        sellToken: params.tokenIn.address,
        buyToken: params.tokenOut.address,
        sellAmountBeforeFee: params.amountIn.toString(),
        kind: 'sell',
        from: '0x0000000000000000000000000000000000000000', // Dummy address for quotes
        appData: this.appData,
      };

      // Call CowSwap API with retry logic
      const response = await retry(
        async () => {
          return await this.client.post<CowSwapQuoteResponse>('/api/v1/quote', quoteRequest);
        },
        { maxRetries: this.maxRetries },
        `${this.name} quote`
      );

      const data = response.data.quote;
      const duration = Date.now() - startTime;

      Logger.info(`${this.name}: Quote fetched successfully`, {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        buyAmount: data.buyAmount,
        feeAmount: data.feeAmount,
        duration: `${duration}ms`,
      });

      return {
        provider: this.name,
        amountOut: BigInt(data.buyAmount),
        fee: BigInt(data.feeAmount),
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

      // Check for axios-specific errors
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new QuoteError(
            QuoteErrorType.TIMEOUT,
            this.name,
            'Request timeout',
            error
          );
        }

        if (error.response) {
          const status = error.response.status;
          
          if (status === 429) {
            throw new QuoteError(
              QuoteErrorType.RATE_LIMIT,
              this.name,
              'Rate limit exceeded',
              error
            );
          }

          if (status === 400 || status === 404) {
            const message = error.response.data?.description || error.response.data?.message || 'Invalid token pair or insufficient liquidity';
            throw new QuoteError(
              QuoteErrorType.INSUFFICIENT_LIQUIDITY,
              this.name,
              message,
              error
            );
          }

          if (status >= 500) {
            throw new QuoteError(
              QuoteErrorType.PROVIDER_ERROR,
              this.name,
              'CowSwap API server error',
              error
            );
          }
        }

        // Network errors
        if (!error.response) {
          throw new QuoteError(
            QuoteErrorType.NETWORK_ERROR,
            this.name,
            'Network error connecting to CowSwap API',
            error
          );
        }
      }

      // Default to provider error
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new QuoteError(
        QuoteErrorType.PROVIDER_ERROR,
        this.name,
        errorMessage,
        error as Error
      );
    }
  }
}
