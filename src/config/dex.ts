import * as fs from 'fs';
import * as path from 'path';

/**
 * Fee tier configuration
 */
export interface FeeTier {
  /** Fee in basis points (e.g., 3000 = 0.3%) */
  fee: number;
  /** Tick spacing for this fee tier */
  tickSpacing: number;
}

/**
 * Uniswap V3 configuration
 */
export interface UniswapV3Config {
  quoterAddress: string;
  routerAddress: string;
  feeTiers: FeeTier[];
  defaultFeeTier: number;
}

/**
 * Uniswap V4 configuration
 */
export interface UniswapV4Config {
  quoterAddress: string;
  poolManagerAddress: string;
  universalRouterAddress: string;
  feeTiers: FeeTier[];
  defaultFeeTier: number;
  defaultHooks: string;
}

/**
 * 1Inch DEX configuration
 */
export interface OneInchConfig {
  apiBaseUrl: string;
  timeout: number;
}

/**
 * CowSwap DEX configuration
 */
export interface CowSwapConfig {
  apiBaseUrl: string;
  timeout: number;
}

/**
 * Network-specific DEX configuration
 */
export interface NetworkDexConfig {
  name: string;
  uniswapV3: UniswapV3Config;
  uniswapV4: UniswapV4Config;
  oneinch: OneInchConfig;
  cowswap: CowSwapConfig;
}

/**
 * Complete DEX configuration structure
 */
export interface DexConfig {
  networks: {
    [chainId: string]: NetworkDexConfig;
  };
}

/**
 * Loads DEX configuration from config/dex.json
 * @returns Parsed DEX configuration
 */
export function loadDexConfig(): DexConfig {
  const configPath = path.join(process.cwd(), 'config', 'dex.json');
  
  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config: DexConfig = JSON.parse(configData);
    
    // Validate structure
    if (!config.networks || typeof config.networks !== 'object') {
      throw new Error('Invalid DEX configuration: missing or invalid "networks" field');
    }
    
    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `DEX configuration file not found at: ${configPath}\n` +
        'Please ensure config/dex.json exists with network-specific DEX configurations.'
      );
    }
    throw error;
  }
}

/**
 * Gets network-specific DEX configuration for a given chain ID
 * @param chainId Chain ID (e.g., 1 for Ethereum, 137 for Polygon)
 * @param requireV4 Whether V4 configuration is required (default: true)
 * @returns Network-specific DEX configuration
 */
export function getNetworkDexConfig(chainId: number, requireV4: boolean = true): NetworkDexConfig {
  const config = loadDexConfig();
  const chainIdStr = chainId.toString();
  
  const networkConfig = config.networks[chainIdStr];
  
  if (!networkConfig) {
    throw new Error(
      `No DEX configuration found for chain ID ${chainId}.\n` +
      `Available networks: ${Object.keys(config.networks).join(', ')}\n` +
      'Please add configuration for this network in config/dex.json'
    );
  }
  
  // Validate V4 configuration if required
  if (requireV4) {
    const v4Config = networkConfig.uniswapV4;
    
    if (!v4Config.quoterAddress || v4Config.quoterAddress === '') {
      throw new Error(
        `Uniswap V4 Quoter address is required but not configured for chain ID ${chainId}.\n` +
        'Please set uniswapV4.quoterAddress in config/dex.json or provide UNISWAP_V4_QUOTER_ADDRESS in .env'
      );
    }
    
    if (!v4Config.poolManagerAddress || v4Config.poolManagerAddress === '') {
      throw new Error(
        `Uniswap V4 PoolManager address is required but not configured for chain ID ${chainId}.\n` +
        'Please set uniswapV4.poolManagerAddress in config/dex.json or provide UNISWAP_V4_POOL_MANAGER_ADDRESS in .env'
      );
    }
    
    if (!v4Config.universalRouterAddress || v4Config.universalRouterAddress === '') {
      throw new Error(
        `Uniswap V4 Universal Router address is required but not configured for chain ID ${chainId}.\n` +
        'Please set uniswapV4.universalRouterAddress in config/dex.json or provide UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS in .env'
      );
    }
  }
  
  return networkConfig;
}

/**
 * Merges environment variable overrides with DEX configuration
 * @param networkConfig Base network configuration from dex.json
 * @returns Network configuration with environment overrides applied
 */
export function applyEnvOverrides(networkConfig: NetworkDexConfig): NetworkDexConfig {
  const overridden = { ...networkConfig };
  
  // Uniswap V3 overrides
  if (process.env.UNISWAP_V3_QUOTER_ADDRESS) {
    overridden.uniswapV3 = {
      ...overridden.uniswapV3,
      quoterAddress: process.env.UNISWAP_V3_QUOTER_ADDRESS,
    };
  }
  if (process.env.UNISWAP_V3_ROUTER_ADDRESS) {
    overridden.uniswapV3 = {
      ...overridden.uniswapV3,
      routerAddress: process.env.UNISWAP_V3_ROUTER_ADDRESS,
    };
  }
  
  // Uniswap V4 overrides
  if (process.env.UNISWAP_V4_QUOTER_ADDRESS) {
    overridden.uniswapV4 = {
      ...overridden.uniswapV4,
      quoterAddress: process.env.UNISWAP_V4_QUOTER_ADDRESS,
    };
  }
  if (process.env.UNISWAP_V4_POOL_MANAGER_ADDRESS) {
    overridden.uniswapV4 = {
      ...overridden.uniswapV4,
      poolManagerAddress: process.env.UNISWAP_V4_POOL_MANAGER_ADDRESS,
    };
  }
  if (process.env.UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS) {
    overridden.uniswapV4 = {
      ...overridden.uniswapV4,
      universalRouterAddress: process.env.UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS,
    };
  }
  
  // 1Inch overrides
  if (process.env.ONEINCH_API_BASE_URL) {
    overridden.oneinch = {
      ...overridden.oneinch,
      apiBaseUrl: process.env.ONEINCH_API_BASE_URL,
    };
  }
  
  // CowSwap overrides
  if (process.env.COWSWAP_API_BASE_URL) {
    overridden.cowswap = {
      ...overridden.cowswap,
      apiBaseUrl: process.env.COWSWAP_API_BASE_URL,
    };
  }
  
  return overridden;
}

/**
 * Singleton instance of network DEX config
 */
let networkDexConfigInstance: NetworkDexConfig | null = null;
let currentChainId: number | null = null;

/**
 * Gets the active network DEX configuration (with caching)
 * @param chainId Chain ID
 * @param requireV4 Whether V4 configuration is required (default: true)
 * @returns Network-specific DEX configuration with environment overrides
 */
export function getDexConfig(chainId: number, requireV4: boolean = true): NetworkDexConfig {
  // Return cached instance if chain ID matches
  if (networkDexConfigInstance && currentChainId === chainId) {
    return networkDexConfigInstance;
  }
  
  // Load and cache new configuration
  const baseConfig = getNetworkDexConfig(chainId, requireV4);
  const configWithOverrides = applyEnvOverrides(baseConfig);
  
  networkDexConfigInstance = configWithOverrides;
  currentChainId = chainId;
  
  return configWithOverrides;
}
