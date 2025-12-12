# Tasks: Stablecoin Arbitrage Strategy

## 0. Configuration Files
- [x] 0.1 Create `config/stablecoins.json` with Polygon network stablecoins (USDT, USDC, USDC.e, DAI) including correct addresses and decimals.
- [x] 0.2 Create `config/providers.json` with Polygon network providers (Uniswap V3, 1Inch, CowSwap).
- [x] 0.3 Add configuration loader utility in `src/config/stablecoins.ts` to load and validate stablecoin configurations.
- [x] 0.4 Add provider configuration loader in `src/config/providers.ts` to load and validate provider configurations.

## 1. Type Definitions & Infrastructure
- [x] 1.1 Create swap executor types in `src/types/executor.ts` (SwapParams, SwapResult, SwapExecutor interface).
- [x] 1.2 Create arbitrage types in `src/types/arbitrage.ts` (ArbitrageOpportunity, ArbitrageConfig).
- [x] 1.3 Update `src/types/config.ts` to include wallet configuration (privateKey, network, chainId).
- [x] 1.4 Update `src/config/env.ts` to load wallet and arbitrage configuration from environment variables.
- [x] 1.5 Update `.env.example` with new configuration variables (PRIVATE_KEY, NETWORK, MIN_PROFIT_BPS, MAX_SLIPPAGE_BPS, DEADLINE_SECONDS, CHECK_GAS_COST).

## 2. Balance Service
- [x] 2.1 Create `src/services/wallet/BalanceService.ts` with ERC20 balance checking functionality.
- [x] 2.2 Implement `getBalance(walletAddress, token)` method using ethers.js Contract and balanceOf.
- [x] 2.3 Implement `getHighestStablecoinBalance(walletAddress, tokens)` to find highest balance among stablecoins.
- [x] 2.4 Add minimum balance threshold filtering to exclude dust balances.
- [x] 2.5 Add comprehensive logging for balance checks.

## 3. Swap Executors - Uniswap V3
- [x] 3.1 Create `src/dex/uniswap/v3/executor.ts` implementing SwapExecutor interface.
- [x] 3.2 Implement `approveToken(token, amount)` method with allowance checking.
- [x] 3.3 Implement `estimateGas(params)` method using SwapRouter simulation.
- [x] 3.4 Implement `execute(params)` method using SwapRouter's exactInputSingle.
- [x] 3.5 Add slippage protection (minAmountOut) and deadline enforcement.
- [x] 3.6 Add transaction receipt parsing to extract actual amountOut and gasUsed.

## 4. Swap Executors - 1Inch
- [x] 4.1 Create `src/dex/oneinch/executor.ts` as stub (full implementation pending).
- [x] 4.2 Implement `approveToken(token, amount)` for 1Inch router contract.
- [x] 4.3 Implement `estimateGas(params)` using 1Inch API gas estimates.
- [x] 4.4 Implement `execute(params)` using 1Inch swap API endpoint.
- [x] 4.5 Add transaction data validation before signing.
- [x] 4.6 Add retry logic for API rate limits with exponential backoff.

## 5. Swap Executors - CowSwap
- [x] 5.1 Create `src/dex/cowswap/executor.ts` as stub (full implementation pending).
- [x] 5.2 Implement `approveToken(token, amount)` for CowSwap VaultRelayer.
- [x] 5.3 Implement `execute(params)` to create and submit orders via CowSwap API.
- [x] 5.4 Implement order monitoring logic to track settlement status.
- [x] 5.5 Add timeout handling for unfilled orders.
- [x] 5.6 Extract actual amountOut from settlement transaction logs.

## 6. Swap Executors - Uniswap V4 (Stub)
- [x] 6.1 Create `src/dex/uniswap/v4/executor.ts` as stub implementation.
- [x] 6.2 Implement placeholder methods that throw "not yet deployed" errors.
- [x] 6.3 Add documentation comments for future V4 implementation.

## 7. Arbitrage Strategy Core Logic
- [x] 7.1 Create `src/strategies/arbitrage/StablecoinArbitrage.ts` class.
- [x] 7.2 Implement constructor accepting QuoteService, executors array, BalanceService, and config.
- [x] 7.3 Implement `findOpportunity(inputToken, inputAmount, targetTokens)` method.
- [x] 7.4 Add profit calculation logic with decimal normalization.
- [x] 7.5 Implement stop-on-first-match optimization (return as soon as profitable opportunity found).
- [x] 7.6 Implement `executeOpportunity(opportunity)` method with approval and swap execution.
- [x] 7.7 Add gas cost estimation and net profit calculation.
- [x] 7.8 Implement `run(walletAddress)` orchestration method combining balance check, search, and execution.

## 8. Configuration & Utilities
- [x] 8.1 Add decimal normalization utility function in `src/utils/decimals.ts`.
- [x] 8.2 Add profit calculation utility in `src/utils/profit.ts` (calculate BPS, normalize amounts).
- [x] 8.3 Add configuration validation in stablecoin and provider loaders.
- [x] 8.4 Add ERC20 ABI definition in `src/utils/abis.ts` for balance and approval calls.
- [x] 8.5 Add Uniswap V3 SwapRouter ABI in `src/utils/abis.ts`.

## 9. CLI Script & Entry Point
- [x] 9.1 Create `src/scripts/run-arbitrage.ts` as main execution script.
- [x] 9.2 Load configuration files (stablecoins.json, providers.json, environment variables).
- [x] 9.3 Initialize wallet signer from private key.
- [x] 9.4 Initialize all quote providers and executors for the selected network.
- [x] 9.5 Initialize QuoteService, BalanceService, and StablecoinArbitrage.
- [x] 9.6 Run arbitrage and display results.
- [x] 9.7 Add command-line argument parsing for dry-run mode and custom config paths.
- [x] 9.8 Add graceful error handling and exit codes.

## 10. Testing - Configuration & Balance
- [ ] 10.1 Write unit tests for stablecoin configuration loader (`src/config/stablecoins.test.ts`).
- [ ] 10.2 Write unit tests for provider configuration loader (`src/config/providers.test.ts`).
- [ ] 10.3 Write unit tests for BalanceService with mocked provider (`src/services/wallet/BalanceService.test.ts`).
- [ ] 10.4 Test highest balance selection logic with various balance scenarios.

## 11. Testing - Profit Calculation
- [ ] 11.1 Write unit tests for decimal normalization utility.
- [ ] 11.2 Write unit tests for profit calculation with same decimals (6→6, 18→18).
- [ ] 11.3 Write unit tests for profit calculation with different decimals (6→18, 18→6).
- [ ] 11.4 Test edge cases (zero profit, negative profit, rounding).

## 12. Testing - Executors
- [ ] 12.1 Write integration tests for Uniswap V3 executor with mocked router contract.
- [ ] 12.2 Write integration tests for 1Inch executor with mocked API responses.
- [ ] 12.3 Write integration tests for CowSwap executor with mocked API and order monitoring.
- [ ] 12.4 Test approval logic (existing allowance, new approval, approval failure).
- [ ] 12.5 Test gas estimation for each executor.
- [ ] 12.6 Test slippage protection and deadline enforcement.

## 13. Testing - Arbitrage Strategy
- [ ] 13.1 Write integration tests for opportunity finding with mocked quotes.
- [ ] 13.2 Test stop-on-first-match behavior (verifies it doesn't query unnecessary providers).
- [ ] 13.3 Test no-opportunity-found scenario (all providers queried, null returned).
- [ ] 13.4 Test execution flow with successful trade.
- [ ] 13.5 Test execution flow with approval failure.
- [ ] 13.6 Test execution flow with swap failure.
- [ ] 13.7 Test gas cost factoring into profitability decisions.

## 14. Documentation & Safety
- [x] 14.1 Document private key security best practices in README.
- [x] 14.2 Document how to obtain Polygon stablecoin addresses and verify them.
- [x] 14.3 Create troubleshooting guide for common execution errors.
- [x] 14.4 Add example output logs showing successful and failed arbitrage attempts.
- [x] 14.5 Document gas cost expectations and profitability considerations.
- [x] 14.6 Add warnings about mainnet execution risks and recommendation to test on testnet first.

## 15. Optional Enhancements (Future)
- [ ] 15.1 Add dry-run mode flag to simulate without executing.
- [ ] 15.2 Add configuration hot-reloading support.
- [ ] 15.3 Add historical performance tracking and logging.
- [ ] 15.4 Add Telegram/Discord notifications for successful arbitrages.
- [ ] 15.5 Add multi-network support (Ethereum, Arbitrum, etc.).
