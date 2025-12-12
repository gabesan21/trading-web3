import { NetworkDexConfig } from '../config/dex';

/**
 * Application configuration interface.
 * All configuration is loaded from environment variables.
 */
export interface AppConfig {
  /** Ethereum RPC endpoint URL */
  rpcUrl: string;
  
  /** Ethereum chain ID (1 = Mainnet) */
  chainId: number;
  
  /** DEX configuration (centralized config for all DEX integrations) */
  dex: NetworkDexConfig;
  
  /** Uniswap-specific configuration */
  uniswap: {
    /** V3 Quoter contract address */
    v3QuoterAddress: string;
    /** V4 Quoter contract address (optional, may not be deployed) */
    v4QuoterAddress?: string;
  };
  
  /** 1Inch-specific configuration */
  oneinch: {
    /** API key for higher rate limits (optional) */
    apiKey?: string;
    /** Base URL for 1Inch API */
    apiBaseUrl: string;
  };
  
  /** CowSwap-specific configuration */
  cowswap: {
    /** Base URL for CowSwap API */
    apiBaseUrl: string;
    /** App identifier for analytics (optional) */
    appData?: string;
  };
  
  /** HTTP request timeout in milliseconds */
  requestTimeout: number;
  
  /** Maximum number of retry attempts for failed requests */
  maxRetries: number;
  
  /** Wallet and arbitrage configuration */
  wallet?: {
    /** Private key for signing transactions */
    privateKey: string;
    /** Network name (e.g., 'polygon') */
    network: string;
  };
  
  /** Arbitrage strategy configuration */
  arbitrage?: {
    /** Minimum profit threshold in basis points */
    minProfitBps: number;
    /** Maximum slippage tolerance in basis points */
    maxSlippageBps: number;
    /** Transaction deadline in seconds */
    deadlineSeconds: number;
    /** Whether to check gas costs */
    checkGasCost: boolean;
  };
}
