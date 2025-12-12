import { SwapExecutor } from '../types/executor';
import { QuoteProvider } from '../types/quote';
import { AppConfig } from '../types/config';
import { loadProviders } from '../config/providers';
import { UniswapV3Executor } from '../dex/uniswap/v3/executor';
import { OneInchExecutor } from '../dex/oneinch/executor';
import { CowSwapExecutor } from '../dex/cowswap/executor';
import { UniswapV3QuoteProvider } from '../dex/uniswap/v3/quote';
import { OneInchQuoteProvider } from '../dex/oneinch/quote';
import { CowSwapQuoteProvider } from '../dex/cowswap/quote';

/**
 * Normalize provider name for consistent matching
 * Handles case-insensitive matching and removes special characters
 * 
 * @param name Provider name to normalize
 * @returns Normalized provider name
 */
export function normalizeProviderName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[_-]/g, '') // Remove underscores and hyphens
    .replace(/\s+/g, ''); // Remove all whitespace
}

/**
 * Get executor instance for a given provider
 * 
 * @param providerName Provider name (e.g., "Uniswap V3", "1Inch", "CowSwap")
 * @param network Network name (e.g., "polygon")
 * @param config Application configuration
 * @returns SwapExecutor instance
 * @throws Error if provider is not supported or not available for the network
 */
export function getExecutorForProvider(
  providerName: string,
  network: string,
  config: AppConfig
): SwapExecutor {
  // Validate that provider is available for this network
  const availableProviders = loadProviders(network);
  const normalizedInput = normalizeProviderName(providerName);
  
  // Check if provider is in the list (with normalized comparison)
  const matchedProvider = availableProviders.find(
    p => normalizeProviderName(p) === normalizedInput
  );
  
  if (!matchedProvider) {
    throw new Error(
      `Provider "${providerName}" is not available for network "${network}". ` +
      `Available providers: ${availableProviders.join(', ')}`
    );
  }
  
  // Map normalized provider names to executor instances
  switch (normalizedInput) {
    case normalizeProviderName('Uniswap V3'):
    case normalizeProviderName('UniswapV3'):
      return new UniswapV3Executor(
        config.dex.uniswapV3.routerAddress,
        config.dex.uniswapV3.feeTiers,
        config.dex.uniswapV3.defaultFeeTier
      );
      
    case normalizeProviderName('1Inch'):
    case normalizeProviderName('OneInch'):
      return new OneInchExecutor(
        config.dex.oneinch.apiBaseUrl,
        config.oneinch.apiKey
      );
      
    case normalizeProviderName('CowSwap'):
    case normalizeProviderName('Cow Swap'):
      return new CowSwapExecutor(
        config.dex.cowswap.apiBaseUrl
      );
      
    default:
      throw new Error(
        `Unknown provider: ${providerName}. ` +
        `Supported providers: Uniswap V3, 1Inch, CowSwap`
      );
  }
}

/**
 * Get quote provider instance for a given provider
 * 
 * @param providerName Provider name (e.g., "Uniswap V3", "1Inch", "CowSwap")
 * @param network Network name (e.g., "polygon")
 * @param config Application configuration
 * @returns QuoteProvider instance
 * @throws Error if provider is not supported or not available for the network
 */
export function getQuoteProviderForProvider(
  providerName: string,
  network: string,
  config: AppConfig
): QuoteProvider {
  // Validate that provider is available for this network
  const availableProviders = loadProviders(network);
  const normalizedInput = normalizeProviderName(providerName);
  
  // Check if provider is in the list (with normalized comparison)
  const matchedProvider = availableProviders.find(
    p => normalizeProviderName(p) === normalizedInput
  );
  
  if (!matchedProvider) {
    throw new Error(
      `Provider "${providerName}" is not available for network "${network}". ` +
      `Available providers: ${availableProviders.join(', ')}`
    );
  }
  
  // Map normalized provider names to quote provider instances
  switch (normalizedInput) {
    case normalizeProviderName('Uniswap V3'):
    case normalizeProviderName('UniswapV3'):
      return new UniswapV3QuoteProvider(
        config.rpcUrl,
        config.dex.uniswapV3.quoterAddress,
        config.dex.uniswapV3.feeTiers,
        config.dex.uniswapV3.defaultFeeTier,
        config.maxRetries
      );
      
    case normalizeProviderName('1Inch'):
    case normalizeProviderName('OneInch'):
      return new OneInchQuoteProvider(
        config.dex.oneinch.apiBaseUrl,
        config.oneinch.apiKey,
        config.dex.oneinch.timeout,
        config.maxRetries
      );
      
    case normalizeProviderName('CowSwap'):
    case normalizeProviderName('Cow Swap'):
      return new CowSwapQuoteProvider(
        config.dex.cowswap.apiBaseUrl,
        config.cowswap.appData,
        config.dex.cowswap.timeout,
        config.maxRetries
      );
      
    default:
      throw new Error(
        `Unknown provider: ${providerName}. ` +
        `Supported providers: Uniswap V3, 1Inch, CowSwap`
      );
  }
}
