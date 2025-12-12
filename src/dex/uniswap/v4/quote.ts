import { QuoteProvider, QuoteParams, Quote } from '../../../types/quote';
import { QuoteError, QuoteErrorType } from '../../../types/errors';
import { Logger } from '../../../utils/logger';

/**
 * Uniswap V4 Quote Provider (Experimental)
 * 
 * NOTE: Uniswap V4 is still in development and may not be deployed.
 * This is a placeholder implementation that will throw an error until V4 is available.
 */
export class UniswapV4QuoteProvider implements QuoteProvider {
  name = 'Uniswap V4';
  
  private quoterAddress?: string;

  /**
   * Creates a new Uniswap V4 quote provider
   * @param _rpcUrl Ethereum RPC endpoint (unused for now)
   * @param quoterAddress Uniswap V4 Quoter contract address (optional)
   * @param _maxRetries Maximum number of retry attempts (unused for now)
   */
  constructor(
    _rpcUrl: string,
    quoterAddress?: string,
    _maxRetries: number = 3
  ) {
    this.quoterAddress = quoterAddress;
    
    if (!quoterAddress) {
      Logger.warn(`${this.name}: No quoter address provided. V4 quotes will not be available.`);
    }
  }

  /**
   * Fetches a quote from Uniswap V4
   * @param _params Quote parameters
   * @returns Promise resolving to a Quote
   */
  async getQuote(_params: QuoteParams): Promise<Quote> {
    // V4 is not yet deployed, throw configuration error
    if (!this.quoterAddress) {
      throw new QuoteError(
        QuoteErrorType.CONFIGURATION_ERROR,
        this.name,
        'Uniswap V4 is not yet deployed or configured. Set UNISWAP_V4_QUOTER_ADDRESS when V4 becomes available.'
      );
    }

    // Placeholder for future V4 implementation
    throw new QuoteError(
      QuoteErrorType.PROVIDER_ERROR,
      this.name,
      'Uniswap V4 support is not yet implemented. This will be added when V4 is officially deployed.'
    );
  }
}
