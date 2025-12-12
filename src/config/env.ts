import * as dotenv from 'dotenv';
import { AppConfig } from '../types/config';

dotenv.config();

/**
 * Loads and validates environment configuration.
 * Throws descriptive errors if required configuration is missing.
 */
export function loadConfig(): AppConfig {
  // Required: Blockchain RPC connection
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    throw new Error(
      'RPC_URL is required. Get one from:\n' +
      '  - Infura: https://infura.io/ (free tier available)\n' +
      '  - Alchemy: https://www.alchemy.com/ (free tier available)\n' +
      '  - Public endpoints: https://chainlist.org/chain/1 (may have rate limits)\n' +
      'Example: RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID'
    );
  }

  // Required: Chain ID (1 = Ethereum Mainnet)
  const chainIdStr = process.env.CHAIN_ID || '1';
  const chainId = parseInt(chainIdStr, 10);
  if (isNaN(chainId)) {
    throw new Error(`CHAIN_ID must be a number. Got: ${chainIdStr}`);
  }

  // Uniswap V3 Quoter Contract Address
  // Default is Ethereum Mainnet address
  const uniswapV3QuoterAddress = 
    process.env.UNISWAP_V3_QUOTER_ADDRESS || 
    '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
  
  // Uniswap V4 Quoter (optional - V4 may not be deployed yet)
  const uniswapV4QuoterAddress = process.env.UNISWAP_V4_QUOTER_ADDRESS;

  // 1Inch API Configuration
  const oneinchApiKey = process.env.ONEINCH_API_KEY;
  if (!oneinchApiKey) {
    console.warn(
      '⚠️  ONEINCH_API_KEY not set. Using public tier (lower rate limits).\n' +
      '   Get an API key at: https://portal.1inch.dev/\n' +
      '   Public tier: 1 request/second, Private tier: up to 30 requests/second'
    );
  }
  
  const oneinchApiBaseUrl = 
    process.env.ONEINCH_API_BASE_URL || 
    `https://api.1inch.dev/swap/v5.2/${chainId}`;

  // CowSwap API Configuration
  const cowswapApiBaseUrl = 
    process.env.COWSWAP_API_BASE_URL || 
    (chainId === 1 
      ? 'https://api.cow.fi/mainnet' 
      : `https://api.cow.fi/goerli`);
  
  const cowswapAppData = process.env.COWSWAP_APP_DATA || 'trading-web3';

  // Operational settings
  const requestTimeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);
  const maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10);

  // Wallet configuration (optional - required for trading)
  const privateKey = process.env.PRIVATE_KEY;
  const network = process.env.NETWORK || 'polygon';
  
  // Arbitrage configuration (optional - required for arbitrage)
  const minProfitBps = parseInt(process.env.MIN_PROFIT_BPS || '30', 10);
  const maxSlippageBps = parseInt(process.env.MAX_SLIPPAGE_BPS || '50', 10);
  const deadlineSeconds = parseInt(process.env.DEADLINE_SECONDS || '300', 10);
  const checkGasCost = process.env.CHECK_GAS_COST !== 'false';

  return {
    rpcUrl,
    chainId,
    uniswap: {
      v3QuoterAddress: uniswapV3QuoterAddress,
      v4QuoterAddress: uniswapV4QuoterAddress,
    },
    oneinch: {
      apiKey: oneinchApiKey,
      apiBaseUrl: oneinchApiBaseUrl,
    },
    cowswap: {
      apiBaseUrl: cowswapApiBaseUrl,
      appData: cowswapAppData,
    },
    requestTimeout,
    maxRetries,
    wallet: privateKey ? {
      privateKey,
      network,
    } : undefined,
    arbitrage: {
      minProfitBps,
      maxSlippageBps,
      deadlineSeconds,
      checkGasCost,
    },
  };
}

/**
 * Singleton config instance.
 * Call this to get the validated configuration.
 */
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
