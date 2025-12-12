# Implementation Tasks

## 1. Create Centralized DEX Configuration System
- [x] 1.1 Create config/dex.json with network-specific DEX configurations
- [x] 1.2 Define Polygon (137) configuration with all DEX addresses and parameters
- [x] 1.3 Define Polygon Amoy (80002) testnet configuration
- [x] 1.4 Create src/config/dex.ts with TypeScript interfaces for DEX config
- [x] 1.5 Implement loadDexConfig() function to read and validate dex.json
- [x] 1.6 Add network-specific config extraction based on CHAIN_ID
- [x] 1.7 Add validation to ensure V4 config is present (required, not optional)
- [x] 1.8 Export typed config object for use by all DEX integrations

## 2. Dependencies and Configuration
- [x] 2.1 Add @uniswap/v4-sdk package dependency to package.json
- [x] 2.2 Update Config interface in src/config/env.ts to reference DEX config
- [x] 2.3 Update environment variable parsing to use DEX config as base
- [x] 2.4 Update .env.example with V4 configuration variables and comments
- [x] 2.5 Add config validation at startup to fail fast if V4 not configured

## 3. Refactor Existing DEX Integrations to Use Centralized Config
- [x] 3.1 Update UniswapV3QuoteProvider to use DEX config for fee tiers
- [x] 3.2 Update UniswapV3QuoteProvider to try multiple fee tiers if needed
- [x] 3.3 Update UniswapV3Executor to use DEX config for router address
- [x] 3.4 Update OneInchQuoteProvider to use DEX config for API base URL
- [x] 3.5 Update CowSwapQuoteProvider to use DEX config for API base URL
- [x] 3.6 Remove hardcoded addresses and use config throughout
- [x] 3.7 Test existing integrations still work with new config system

## 4. Implement V4 Quote Provider
- [x] 4.1 Define V4 Quoter ABI with quoteExactInputSingle function signature
- [x] 4.2 Create PoolKey construction helper with proper token ordering
- [x] 4.3 Get fee tiers and tick spacing from DEX config
- [x] 4.4 Implement getQuote() method with Quoter contract call
- [x] 4.5 Add zeroForOne direction calculation based on token addresses
- [x] 4.6 Add input validation for tokens and amounts
- [x] 4.7 Implement retry logic with exponential backoff
- [x] 4.8 Add comprehensive error handling with QuoteError types
- [x] 4.9 Add logging for quote requests and responses
- [x] 4.10 Support trying multiple fee tiers to find best quote

## 5. Implement V4 Swap Executor
- [x] 5.1 Define Universal Router ABI with execute function
- [x] 5.2 Define Actions enum (SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL)
- [x] 5.3 Implement approveToken() method for UniversalRouter
- [x] 5.4 Implement swap action encoding with PoolKey and swap params
- [x] 5.5 Implement settle action encoding for input token payment
- [x] 5.6 Implement take action encoding for output token receipt
- [x] 5.7 Implement execute() method combining all actions
- [x] 5.8 Implement estimateGas() method for gas estimation
- [x] 5.9 Add transaction confirmation waiting and receipt parsing
- [x] 5.10 Add error handling for approval and execution failures

## 6. Integration with Scripts
- [x] 6.1 Update check-rates.ts to conditionally initialize V4 provider
- [x] 6.2 Add V4 provider to QuoteService in check-rates.ts
- [x] 6.3 Update run-arbitrage.ts to conditionally initialize V4 provider and executor
- [x] 6.4 Add V4 executor to executor list in run-arbitrage.ts
- [x] 6.5 Add logging to indicate V4 status (enabled/disabled)

## 7. Documentation
- [x] 7.1 Update README.md to reflect V4 as active
- [x] 7.2 Add V4 configuration instructions to README.md
- [x] 7.3 Add comments explaining PoolKey structure in code
- [x] 7.4 Document token ordering requirements (currency0 < currency1)
