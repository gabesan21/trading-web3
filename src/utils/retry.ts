import { Logger } from './logger';

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Initial delay in milliseconds */
  initialDelay?: number;
  
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number;
}

/**
 * Retries an async operation with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @param context Context string for logging
 * @returns Promise resolving to the function's result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  context: string
): Promise<T> {
  const {
    maxRetries,
    initialDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 30000,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        Logger.error(`${context}: All ${maxRetries} retry attempts failed`, {
          error: lastError.message,
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      Logger.warn(
        `${context}: Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`,
        { error: lastError.message }
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed for unknown reason');
}

/**
 * Sleep utility
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
