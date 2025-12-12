# Change: Stablecoin Arbitrage Strategy

## Why
The project currently has quote capabilities across multiple DEXs (Uniswap V3/V4, 1Inch, CowSwap) but lacks trading execution and strategy implementations. Users need an automated way to identify and execute profitable stablecoin arbitrage opportunities across different DEXs and stablecoins on the same network. Stablecoins should maintain 1:1 parity, but temporary price discrepancies create low-risk arbitrage opportunities when the output exceeds the input by a meaningful threshold (0.3% minimum profit).

## What Changes
- **Stablecoin Configuration**: Create JSON configuration files defining supported stablecoins and DEX providers per network, starting with Polygon network supporting USDT, USDT0, USDC, USDC.e, and DAI (5 stablecoins total).
- **Wallet Balance Detection**: Implement wallet balance checking to identify which stablecoin the user holds and select the highest balance as the input token for arbitrage.
- **Trading Execution Layer**: Develop swap execution capabilities for each DEX provider (currently only quote functionality exists).
- **Arbitrage Strategy**: Build a strategy that systematically checks all stablecoin pairs across all providers, identifies opportunities with ≥0.3% profit, and executes the most profitable trade automatically.

## Impact
- **Affected specs**:
  - `stablecoin-config`: New capability for managing network-specific stablecoin and provider configurations.
  - `trading-executor`: New capability for executing swaps on Uniswap V3/V4, 1Inch, and CowSwap.
  - `arbitrage-strategy`: New capability implementing the stablecoin arbitrage logic with configurable profit thresholds.
  
- **Affected code**:
  - New files:
    - `config/stablecoins.json` - Network-keyed stablecoin definitions
    - `config/providers.json` - Network-keyed DEX provider lists
    - `src/dex/uniswap/v3/executor.ts` - Uniswap V3 swap execution
    - `src/dex/uniswap/v4/executor.ts` - Uniswap V4 swap execution (stub)
    - `src/dex/oneinch/executor.ts` - 1Inch swap execution
    - `src/dex/cowswap/executor.ts` - CowSwap swap execution
    - `src/services/wallet/BalanceService.ts` - Wallet balance checking
    - `src/strategies/arbitrage/StablecoinArbitrage.ts` - Main arbitrage strategy
    - `src/scripts/run-arbitrage.ts` - CLI script to run arbitrage
    - `src/types/executor.ts` - Type definitions for swap execution
  - Modified files:
    - `src/types/config.ts` - Add wallet/signer configuration
    - `src/config/env.ts` - Add private key and network configuration
    - `.env.example` - Add wallet and network configuration examples

- **New Dependencies**:
  - No new runtime dependencies required (ethers.js already supports signing)
  - Development: Consider adding testing utilities for transaction simulation

- **Configuration Requirements**:
  - `PRIVATE_KEY` - User's wallet private key for signing transactions
  - `NETWORK` - Target network (starting with polygon)
  - `CHAIN_ID` - Chain ID for the network (137 for Polygon)
  - `MIN_PROFIT_BPS` - Minimum profit threshold in basis points (default: 30 for 0.3%)
  - `MAX_SLIPPAGE_BPS` - Maximum acceptable slippage in basis points (default: 50 for 0.5%)

- **Security Considerations**:
  - Private key handling must be secure
  - Transaction simulation before execution
  - Gas estimation and limits
  - Slippage protection
  - Front-running mitigation through appropriate deadline settings

- **Risk Considerations**:
  - Gas costs may exceed small arbitrage profits
  - Price changes between quote and execution (slippage)
  - Failed transactions still consume gas
  - DEX-specific approval requirements for token spending
