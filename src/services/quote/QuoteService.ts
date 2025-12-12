import { QuoteProvider, QuoteParams, Quote } from '../../types/quote';
import { Logger } from '../../utils/logger';
import { QuoteError } from '../../types/errors';

/**
 * Quote aggregation service that fetches quotes from multiple providers
 */
export class QuoteService {
  private providers: QuoteProvider[];

  /**
   * Creates a new QuoteService
   * @param providers Array of quote providers to aggregate
   */
  constructor(providers: QuoteProvider[]) {
    this.providers = providers;
    Logger.info('QuoteService initialized', {
      providers: providers.map((p) => p.name),
    });
  }

  /**
   * Fetches quotes from all providers in parallel
   * @param params Quote parameters
   * @returns Promise resolving to array of successful quotes, sorted by best rate
   */
  async getQuotes(params: QuoteParams): Promise<Quote[]> {
    const startTime = Date.now();

    Logger.info('Fetching quotes from all providers', {
      tokenIn: params.tokenIn.symbol,
      tokenOut: params.tokenOut.symbol,
      amountIn: params.amountIn.toString(),
      providers: this.providers.map((p) => p.name),
    });

    // Fetch quotes from all providers in parallel
    const quotePromises = this.providers.map(async (provider) => {
      try {
        const quote = await provider.getQuote(params);
        return { success: true as const, quote };
      } catch (error) {
        // Log the error but don't fail the entire aggregation
        if (error instanceof QuoteError) {
          Logger.warn(`Provider ${provider.name} failed`, {
            type: error.type,
            message: error.message,
          });
        } else {
          Logger.warn(`Provider ${provider.name} failed`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return { success: false as const, provider: provider.name, error };
      }
    });

    // Wait for all quotes to complete (success or failure)
    const results = await Promise.all(quotePromises);

    // Extract successful quotes
    const successfulQuotes = results
      .filter((result) => result.success)
      .map((result) => result.quote);

    // Sort by amountOut (descending - best rate first)
    successfulQuotes.sort((a, b) => {
      if (a.amountOut > b.amountOut) return -1;
      if (a.amountOut < b.amountOut) return 1;
      return 0;
    });

    const duration = Date.now() - startTime;
    const failedCount = results.length - successfulQuotes.length;

    Logger.info('Quote aggregation complete', {
      successful: successfulQuotes.length,
      failed: failedCount,
      duration: `${duration}ms`,
      bestProvider: successfulQuotes[0]?.provider,
      bestAmountOut: successfulQuotes[0]?.amountOut.toString(),
    });

    return successfulQuotes;
  }

  /**
   * Fetches the best quote from all providers
   * @param params Quote parameters
   * @returns Promise resolving to the best quote, or throws if all providers fail
   */
  async getBestQuote(params: QuoteParams): Promise<Quote> {
    const quotes = await this.getQuotes(params);

    if (quotes.length === 0) {
      throw new Error(
        'All quote providers failed. Check logs for details and verify your configuration.'
      );
    }

    // Return the first quote (already sorted by best rate)
    return quotes[0];
  }

  /**
   * Adds a provider to the service
   * @param provider Quote provider to add
   */
  addProvider(provider: QuoteProvider): void {
    this.providers.push(provider);
    Logger.info(`Added provider: ${provider.name}`);
  }

  /**
   * Gets the list of provider names
   * @returns Array of provider names
   */
  getProviderNames(): string[] {
    return this.providers.map((p) => p.name);
  }
}
