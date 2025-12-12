import * as dotenv from 'dotenv';
import { AppConfig } from '../types/config';
import { getDexConfig, NetworkDexConfig } from './dex';

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

  // Load DEX configuration (V4 is optional)
  let dexConfig: NetworkDexConfig;
  try {
    dexConfig = getDexConfig(chainId, false); // V4 not required
  } catch (error) {
    // If DEX config fails to load, fall back to legacy env var approach
    console.warn('⚠️  Could not load DEX config, using legacy environment variables');
    dexConfig = {
      name: 'Unknown Network',
      uniswapV3: {
        quoterAddress: process.env.UNISWAP_V3_QUOTER_ADDRESS || '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
        routerAddress: process.env.UNISWAP_V3_ROUTER_ADDRESS || '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        feeTiers: [
          { fee: 500, tickSpacing: 10 },
          { fee: 3000, tickSpacing: 60 },
          { fee: 10000, tickSpacing: 200 }
        ],
        defaultFeeTier: 3000
      },
      uniswapV4: {
        quoterAddress: process.env.UNISWAP_V4_QUOTER_ADDRESS || '',
        poolManagerAddress: process.env.UNISWAP_V4_POOL_MANAGER_ADDRESS || '',
        universalRouterAddress: process.env.UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS || '',
        feeTiers: [
          { fee: 500, tickSpacing: 10 },
          { fee: 3000, tickSpacing: 60 },
          { fee: 10000, tickSpacing: 200 }
        ],
        defaultFeeTier: 3000,
        defaultHooks: '0x0000000000000000000000000000000000000000'
      },
      oneinch: {
        apiBaseUrl: process.env.ONEINCH_API_BASE_URL || `https://api.1inch.dev/swap/v5.2/${chainId}`,
        timeout: 30000
      },
      cowswap: {
        apiBaseUrl: process.env.COWSWAP_API_BASE_URL || (chainId === 1 ? 'https://api.cow.fi/mainnet' : 'https://api.cow.fi/goerli'),
        timeout: 30000
      }
    };
  }
  
  const uniswapV3QuoterAddress = dexConfig.uniswapV3.quoterAddress;
  const uniswapV4QuoterAddress = dexConfig.uniswapV4.quoterAddress || undefined;

  // 1Inch API Configuration
  const oneinchApiKey = process.env.ONEINCH_API_KEY;
  if (!oneinchApiKey) {
    console.warn(
      '⚠️  ONEINCH_API_KEY not set. Using public tier (lower rate limits).\n' +
      '   Get an API key at: https://portal.1inch.dev/\n' +
      '   Public tier: 1 request/second, Private tier: up to 30 requests/second'
    );
  }
  
  const oneinchApiBaseUrl = dexConfig.oneinch.apiBaseUrl;
  const cowswapApiBaseUrl = dexConfig.cowswap.apiBaseUrl;
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
    dex: dexConfig,
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
