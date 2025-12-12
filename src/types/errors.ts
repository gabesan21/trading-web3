/**
 * Types of errors that can occur when fetching quotes
 */
export enum QuoteErrorType {
  /** Network or RPC unreachable */
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  /** Invalid token address or parameters */
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  /** Insufficient liquidity for the requested swap */
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  
  /** API rate limit hit */
  RATE_LIMIT = 'RATE_LIMIT',
  
  /** Request timeout */
  TIMEOUT = 'TIMEOUT',
  
  /** DEX-specific error */
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  
  /** Missing or invalid configuration */
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/**
 * Custom error class for quote-related errors
 */
export class QuoteError extends Error {
  /**
   * Creates a new QuoteError
   * @param type Error type classification
   * @param provider Name of the provider that threw the error
   * @param message Human-readable error message
   * @param originalError Original error if wrapped
   */
  constructor(
    public type: QuoteErrorType,
    public provider: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'QuoteError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QuoteError);
    }
  }
}
