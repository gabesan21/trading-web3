# Change: Implement Uniswap V4 Integration with DEX Configuration System

## Why

Uniswap V4 introduces significant improvements over V3 including singleton architecture, flash accounting for gas savings, and hooks for customizable pool behavior. The current V4 implementation in the codebase is a non-functional stub that throws errors. This change will implement a fully functional Uniswap V4 quote provider and swap executor as a **required** component of the system.

Additionally, we need a centralized DEX configuration system to manage fee tiers, tick spacing, and other DEX-specific parameters across all integrations (V3, V4, 1Inch, CowSwap), enabling consistent configuration and easier maintenance.

## What Changes

- **Create centralized DEX configuration system** (`config/dex.json` and loader)
  - Define fee tiers for Uniswap V3 and V4 (500, 3000, 10000 basis points)
  - Define tick spacing mappings for each fee tier
  - Define contract addresses per network for all DEXs
  - Define default slippage and deadline parameters per DEX
- Implement functional Uniswap V4 quote provider using the V4 Quoter contract
- Implement Uniswap V4 swap executor using Universal Router with proper encoding
- Add V4-specific PoolKey structure with currency0/currency1, fee, tickSpacing, and hooks
- Integrate V4 SDK (@uniswap/v4-sdk) for pool management and routing
- **Refactor V3, 1Inch, and CowSwap to use centralized DEX configuration**
- Add V4 to the active quote providers in check-rates and arbitrage scripts (required, not optional)
- Update .env.example with V4-specific configuration variables

## Impact

- Affected specs: New capability `dex-uniswap-v4`, Modified capability `dex-config`
- Affected code:
  - **NEW** `config/dex.json` - Centralized DEX configuration file
  - **NEW** `src/config/dex.ts` - DEX configuration loader and types
  - `src/dex/uniswap/v3/quote.ts` - Use centralized config for fee tiers
  - `src/dex/uniswap/v3/executor.ts` - Use centralized config for contract addresses
  - `src/dex/uniswap/v4/quote.ts` - Replace stub with functional implementation using config
  - `src/dex/uniswap/v4/executor.ts` - Replace stub with functional implementation using config
  - `src/dex/oneinch/quote.ts` - Use centralized config for API endpoints
  - `src/dex/cowswap/quote.ts` - Use centralized config for API endpoints
  - `src/config/env.ts` - Add V4 configuration fields, reference DEX config
  - `src/scripts/check-rates.ts` - Add V4 provider as required
  - `src/scripts/run-arbitrage.ts` - Add V4 provider and executor as required
  - `.env.example` - Add V4 contract addresses
  - `package.json` - Add @uniswap/v4-sdk dependency
- **BREAKING**: V4 is now a required component; system will fail if V4 addresses are not configured
- Centralized configuration improves maintainability and consistency across all DEX integrations
