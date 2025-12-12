# Implementation Tasks

## 1. Create Centralized DEX Configuration System
- [ ] 1.1 Create config/dex.json with network-specific DEX configurations
- [ ] 1.2 Define Polygon (137) configuration with all DEX addresses and parameters
- [ ] 1.3 Define Polygon Amoy (80002) testnet configuration
- [ ] 1.4 Create src/config/dex.ts with TypeScript interfaces for DEX config
- [ ] 1.5 Implement loadDexConfig() function to read and validate dex.json
- [ ] 1.6 Add network-specific config extraction based on CHAIN_ID
- [ ] 1.7 Add validation to ensure V4 config is present (required, not optional)
- [ ] 1.8 Export typed config object for use by all DEX integrations

## 2. Dependencies and Configuration
- [ ] 2.1 Add @uniswap/v4-sdk package dependency to package.json
- [ ] 2.2 Update Config interface in src/config/env.ts to reference DEX config
- [ ] 2.3 Update environment variable parsing to use DEX config as base
- [ ] 2.4 Update .env.example with V4 configuration variables and comments
- [ ] 2.5 Add config validation at startup to fail fast if V4 not configured

## 3. Refactor Existing DEX Integrations to Use Centralized Config
- [ ] 3.1 Update UniswapV3QuoteProvider to use DEX config for fee tiers
- [ ] 3.2 Update UniswapV3QuoteProvider to try multiple fee tiers if needed
- [ ] 3.3 Update UniswapV3Executor to use DEX config for router address
- [ ] 3.4 Update OneInchQuoteProvider to use DEX config for API base URL
- [ ] 3.5 Update CowSwapQuoteProvider to use DEX config for API base URL
- [ ] 3.6 Remove hardcoded addresses and use config throughout
- [ ] 3.7 Test existing integrations still work with new config system

## 4. Implement V4 Quote Provider
- [ ] 4.1 Define V4 Quoter ABI with quoteExactInputSingle function signature
- [ ] 4.2 Create PoolKey construction helper with proper token ordering
- [ ] 4.3 Get fee tiers and tick spacing from DEX config
- [ ] 4.4 Implement getQuote() method with Quoter contract call
- [ ] 4.5 Add zeroForOne direction calculation based on token addresses
- [ ] 4.6 Add input validation for tokens and amounts
- [ ] 4.7 Implement retry logic with exponential backoff
- [ ] 4.8 Add comprehensive error handling with QuoteError types
- [ ] 4.9 Add logging for quote requests and responses
- [ ] 4.10 Support trying multiple fee tiers to find best quote

## 3. Implement V4 Swap Executor
- [ ] 3.1 Define Universal Router ABI with execute function
- [ ] 3.2 Define Actions enum (SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL)
- [ ] 3.3 Implement approveToken() method for UniversalRouter
- [ ] 3.4 Implement swap action encoding with PoolKey and swap params
- [ ] 3.5 Implement settle action encoding for input token payment
- [ ] 3.6 Implement take action encoding for output token receipt
- [ ] 3.7 Implement execute() method combining all actions
- [ ] 3.8 Implement estimateGas() method for gas estimation
- [ ] 3.9 Add transaction confirmation waiting and receipt parsing
- [ ] 3.10 Add error handling for approval and execution failures

## 4. Integration with Scripts
- [ ] 4.1 Update check-rates.ts to conditionally initialize V4 provider
- [ ] 4.2 Add V4 provider to QuoteService in check-rates.ts
- [ ] 4.3 Update run-arbitrage.ts to conditionally initialize V4 provider and executor
- [ ] 4.4 Add V4 executor to executor list in run-arbitrage.ts
- [ ] 4.5 Add logging to indicate V4 status (enabled/disabled)

## 5. Documentation
- [ ] 5.1 Update README.md to reflect V4 as active (when configured)
- [ ] 5.2 Add V4 configuration instructions to README.md
- [ ] 5.3 Add comments explaining PoolKey structure in code
- [ ] 5.4 Document token ordering requirements (currency0 < currency1)
