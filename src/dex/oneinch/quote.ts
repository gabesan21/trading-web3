import axios, { AxiosInstance } from 'axios';
import { QuoteProvider, QuoteParams, Quote } from '../../types/quote';
import { QuoteError, QuoteErrorType } from '../../types/errors';
import { validateToken, validateAmount } from '../../utils/validation';
import { Logger } from '../../utils/logger';
import { retry } from '../../utils/retry';

/**
 * 1Inch API response for quotes
 */
interface OneInchQuoteResponse {
  toAmount: string;
  estimatedGas?: number;
}

/**
 * 1Inch Quote Provider
 */
export class OneInchQuoteProvider implements QuoteProvider {
  name = '1Inch';
  
  private client: AxiosInstance;
  private maxRetries: number;

  /**
   * Creates a new 1Inch quote provider
   * @param apiBaseUrl Base URL for the 1Inch API
   * @param apiKey Optional API key for higher rate limits
   * @param requestTimeout Request timeout in milliseconds
   * @param maxRetries Maximum number of retry attempts
   */
  constructor(
    apiBaseUrl: string,
    apiKey?: string,
    requestTimeout: number = 30000,
    maxRetries: number = 3
  ) {
    this.client = axios.create({
      baseURL: apiBaseUrl,
      timeout: requestTimeout,
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });
    this.maxRetries = maxRetries;
  }

  /**
   * Fetches a quote from 1Inch
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

      // Call 1Inch API with retry logic
      const response = await retry(
        async () => {
          return await this.client.get<OneInchQuoteResponse>('/quote', {
            params: {
              src: params.tokenIn.address,
              dst: params.tokenOut.address,
              amount: params.amountIn.toString(),
            },
          });
        },
        { maxRetries: this.maxRetries },
        `${this.name} quote`
      );

      const data = response.data;
      const duration = Date.now() - startTime;

      Logger.info(`${this.name}: Quote fetched successfully`, {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountOut: data.toAmount,
        estimatedGas: data.estimatedGas,
        duration: `${duration}ms`,
      });

      return {
        provider: this.name,
        amountOut: BigInt(data.toAmount),
        estimatedGas: data.estimatedGas ? BigInt(data.estimatedGas) : undefined,
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
              'Rate limit exceeded. Consider getting an API key at https://portal.1inch.dev/',
              error
            );
          }

          if (status === 400) {
            throw new QuoteError(
              QuoteErrorType.INVALID_TOKEN,
              this.name,
              `Invalid request: ${error.response.data?.message || 'Bad request'}`,
              error
            );
          }

          if (status >= 500) {
            throw new QuoteError(
              QuoteErrorType.PROVIDER_ERROR,
              this.name,
              '1Inch API server error',
              error
            );
          }
        }

        // Network errors
        if (!error.response) {
          throw new QuoteError(
            QuoteErrorType.NETWORK_ERROR,
            this.name,
            'Network error connecting to 1Inch API',
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
