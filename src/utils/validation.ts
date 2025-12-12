import { Token } from '../types/quote';
import { QuoteError, QuoteErrorType } from '../types/errors';

/**
 * Validates that a token has all required fields and valid values
 * @param token Token to validate
 * @param provider Provider name for error context
 * @throws QuoteError if token is invalid
 */
export function validateToken(token: Token, provider: string): void {
  if (!token.address || typeof token.address !== 'string') {
    throw new QuoteError(
      QuoteErrorType.INVALID_TOKEN,
      provider,
      `Invalid token address: ${token.address}`
    );
  }

  // Check if address looks like a valid Ethereum address (0x + 40 hex chars)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(token.address)) {
    throw new QuoteError(
      QuoteErrorType.INVALID_TOKEN,
      provider,
      `Token address format invalid: ${token.address}`
    );
  }

  if (typeof token.decimals !== 'number' || token.decimals < 0 || token.decimals > 255) {
    throw new QuoteError(
      QuoteErrorType.INVALID_TOKEN,
      provider,
      `Invalid token decimals: ${token.decimals}`
    );
  }

  if (!token.symbol || typeof token.symbol !== 'string') {
    throw new QuoteError(
      QuoteErrorType.INVALID_TOKEN,
      provider,
      `Invalid token symbol: ${token.symbol}`
    );
  }

  if (typeof token.chainId !== 'number' || token.chainId <= 0) {
    throw new QuoteError(
      QuoteErrorType.INVALID_TOKEN,
      provider,
      `Invalid token chainId: ${token.chainId}`
    );
  }
}

/**
 * Validates that an amount is positive
 * @param amount Amount to validate
 * @param provider Provider name for error context
 * @throws QuoteError if amount is invalid
 */
export function validateAmount(amount: bigint, provider: string): void {
  if (amount <= 0n) {
    throw new QuoteError(
      QuoteErrorType.INVALID_TOKEN,
      provider,
      `Amount must be positive, got: ${amount.toString()}`
    );
  }
}
