# Change: Implement Uniswap V4 Integration

## Why

Uniswap V4 introduces significant improvements over V3 including singleton architecture, flash accounting for gas savings, and hooks for customizable pool behavior. The current V4 implementation in the codebase is a non-functional stub that throws errors. This change will implement a fully functional Uniswap V4 quote provider and swap executor to enable V4 trading capabilities.

## What Changes

- Implement functional Uniswap V4 quote provider using the V4 Quoter contract
- Implement Uniswap V4 swap executor using Universal Router with proper encoding
- Add V4-specific PoolKey structure with currency0/currency1, fee, tickSpacing, and hooks
- Integrate V4 SDK (@uniswap/v4-sdk) for pool management and routing
- Update configuration to support V4 contract addresses (PoolManager, Quoter, Universal Router)
- Add V4 to the active quote providers in check-rates and arbitrage scripts
- Update .env.example with V4-specific configuration variables

## Impact

- Affected specs: New capability `dex-uniswap-v4`
- Affected code:
  - `src/dex/uniswap/v4/quote.ts` - Replace stub with functional implementation
  - `src/dex/uniswap/v4/executor.ts` - Replace stub with functional implementation  
  - `src/config/env.ts` - Add V4 configuration fields
  - `src/scripts/check-rates.ts` - Add V4 provider
  - `src/scripts/run-arbitrage.ts` - Add V4 provider and executor
  - `.env.example` - Add V4 contract addresses
  - `package.json` - Add @uniswap/v4-sdk dependency
- No breaking changes to existing functionality
- V4 will be opt-in based on configuration
