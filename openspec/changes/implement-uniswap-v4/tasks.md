# Implementation Tasks

## 1. Dependencies and Configuration
- [ ] 1.1 Add @uniswap/v4-sdk package dependency to package.json
- [ ] 1.2 Add V4 contract address fields to Config interface in src/config/env.ts
- [ ] 1.3 Add V4 environment variable parsing with optional handling
- [ ] 1.4 Update .env.example with V4 configuration variables and comments

## 2. Implement V4 Quote Provider
- [ ] 2.1 Define V4 Quoter ABI with quoteExactInputSingle function signature
- [ ] 2.2 Create PoolKey construction helper with proper token ordering
- [ ] 2.3 Implement getQuote() method with Quoter contract call
- [ ] 2.4 Add zeroForOne direction calculation based on token addresses
- [ ] 2.5 Add input validation for tokens and amounts
- [ ] 2.6 Implement retry logic with exponential backoff
- [ ] 2.7 Add comprehensive error handling with QuoteError types
- [ ] 2.8 Add logging for quote requests and responses

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
