## ADDED Requirements

### Requirement: Environment Configuration Management
The system SHALL provide a centralized configuration module that loads and validates all required environment variables for DEX integrations.

#### Scenario: Load complete configuration
- **WHEN** the application starts
- **THEN** the config module loads all environment variables from `.env`
- **AND** validates that all required fields are present
- **AND** provides sensible defaults for optional fields

#### Scenario: Missing required configuration
- **WHEN** a required environment variable is missing
- **THEN** the config module throws a descriptive error
- **AND** explains which variable is missing and how to obtain it

#### Scenario: Invalid configuration format
- **WHEN** an environment variable has an invalid format (e.g., non-numeric chainId)
- **THEN** the config module throws a validation error
- **AND** explains the expected format

### Implementation: src/config/env.ts

```typescript
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
```

### Implementation: .env.example

```bash
# ==============================================================================
# TRADING WEB3 CONFIGURATION
# ==============================================================================
# Copy this file to .env and fill in your values.
# Required fields are marked with [REQUIRED].
# Optional fields have defaults.

# ==============================================================================
# BLOCKCHAIN CONNECTION
# ==============================================================================

# [REQUIRED] Ethereum RPC URL
# This is your connection to the Ethereum blockchain.
#
# How to get one:
#   1. Infura (recommended for beginners):
#      - Sign up at https://infura.io/
#      - Create a new project
#      - Copy the Mainnet HTTPS endpoint
#      - Free tier: 100,000 requests/day
#      Example: https://mainnet.infura.io/v3/YOUR-PROJECT-ID
#
#   2. Alchemy (recommended for production):
#      - Sign up at https://www.alchemy.com/
#      - Create a new app on Ethereum Mainnet
#      - Copy the HTTPS endpoint
#      - Free tier: 300M compute units/month
#      Example: https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
#
#   3. Public RPC (not recommended - rate limited):
#      - Find endpoints at https://chainlist.org/chain/1
#      - Use at your own risk (often slow or unreliable)
#      Example: https://ethereum.publicnode.com
#
RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID

# Chain ID (default: 1 = Ethereum Mainnet)
# Change only if you want to use a different network.
#   1 = Ethereum Mainnet
#   5 = Goerli Testnet
#   11155111 = Sepolia Testnet
CHAIN_ID=1

# ==============================================================================
# UNISWAP CONFIGURATION
# ==============================================================================

# Uniswap V3 Quoter Contract Address
# Default is the official Ethereum Mainnet Quoter V2 contract.
# Only change if using a different network or custom deployment.
#
# Official addresses:
#   Ethereum Mainnet: 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6
#   Goerli Testnet: 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6
#   See more: https://docs.uniswap.org/contracts/v3/reference/deployments
#
UNISWAP_V3_QUOTER_ADDRESS=0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6

# Uniswap V4 Quoter Contract Address (optional)
# V4 is still in development. Leave empty unless you have a V4 deployment.
# UNISWAP_V4_QUOTER_ADDRESS=

# ==============================================================================
# 1INCH CONFIGURATION
# ==============================================================================

# 1Inch API Key (optional but recommended)
# Without an API key, you'll use the public tier with strict rate limits.
#
# Rate limits:
#   - Public (no key): 1 request/second
#   - Growth tier: 10 requests/second
#   - Business tier: 30 requests/second
#
# How to get an API key:
#   1. Go to https://portal.1inch.dev/
#   2. Sign up / Log in
#   3. Create a new API key
#   4. Copy the key here
#
# Pricing (as of 2024):
#   - Growth: $49/month
#   - Business: Custom pricing
#   - Free tier available for testing
#
ONEINCH_API_KEY=

# 1Inch API Base URL (default: auto-configured based on CHAIN_ID)
# Only change if using a custom endpoint or proxy.
# Default: https://api.1inch.dev/swap/v5.2/{chainId}
# ONEINCH_API_BASE_URL=

# ==============================================================================
# COWSWAP CONFIGURATION
# ==============================================================================

# CowSwap API Base URL (default: auto-configured based on CHAIN_ID)
# CowSwap (MEV-protected DEX aggregator) doesn't require an API key.
#
# Official endpoints:
#   Ethereum Mainnet: https://api.cow.fi/mainnet
#   Gnosis Chain: https://api.cow.fi/xdai
#   Goerli Testnet: https://api.cow.fi/goerli
#
# Rate limits: Generous, no key required
# Docs: https://docs.cow.fi/
#
# COWSWAP_API_BASE_URL=https://api.cow.fi/mainnet

# CowSwap App Data (optional identifier for your app)
# This helps CowSwap identify your application in their analytics.
# Default: "trading-web3"
COWSWAP_APP_DATA=trading-web3

# ==============================================================================
# OPERATIONAL SETTINGS
# ==============================================================================

# HTTP Request Timeout (milliseconds)
# How long to wait for API/RPC responses before timing out.
# Default: 30000 (30 seconds)
REQUEST_TIMEOUT=30000

# Max Retries
# How many times to retry failed requests (network errors only).
# Default: 3
MAX_RETRIES=3

# ==============================================================================
# QUICK START CHECKLIST
# ==============================================================================
# 
# Minimum required to get started:
#   ✓ Set RPC_URL (get from Infura or Alchemy)
#   ✓ Copy this file to .env
#   ✓ Run: npm install
#   ✓ Run: npm run dev
#
# For better performance:
#   ✓ Get a 1Inch API key (recommended for serious trading)
#   ✓ Use a paid RPC provider tier (Alchemy/Infura)
#
# ==============================================================================
```

### Implementation: src/types/config.ts

```typescript
/**
 * Application configuration interface.
 * All configuration is loaded from environment variables.
 */
export interface AppConfig {
  /** Ethereum RPC endpoint URL */
  rpcUrl: string;
  
  /** Ethereum chain ID (1 = Mainnet) */
  chainId: number;
  
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
}
```
