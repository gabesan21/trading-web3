## 0. Configuration & Setup
- [x] 0.1 Create `.env.example` with all required environment variables and comprehensive documentation.
- [x] 0.2 Implement configuration loader in `src/config/env.ts` with validation and helpful error messages.
- [x] 0.3 Add configuration type definitions in `src/types/config.ts`.

## 1. Foundation
- [x] 1.1 Initialize project structure (create directories `src/services`, `src/dex`, `src/types`, `src/utils`, `src/config`, `src/scripts`).
- [x] 1.2 Install core dependencies (`ethers`, `axios`, `dotenv`, `@uniswap/sdk-core`, `@uniswap/v3-sdk`, `@cowprotocol/cow-sdk`).
- [x] 1.3 Install dev dependencies (`@types/node`, `jest`, `@types/jest`, `ts-jest` for testing).
- [x] 1.4 Define common types and interfaces for Tokens and Quotes in `src/types/quote.ts`.
- [x] 1.5 Define error types in `src/types/errors.ts`.

## 2. Utilities & Infrastructure
- [x] 2.1 Create logging utility in `src/utils/logger.ts` with structured logging support.
- [x] 2.2 Create retry utility in `src/utils/retry.ts` for handling transient failures.
- [x] 2.3 Create token validation utility in `src/utils/validation.ts`.

## 3. DEX Integrations (Quote Only)
- [x] 3.1 Implement Uniswap V3 quoter adapter in `src/dex/uniswap/v3/quote.ts`.
- [x] 3.2 Implement 1Inch quote adapter in `src/dex/oneinch/quote.ts`.
- [x] 3.3 Implement CowSwap quote adapter in `src/dex/cowswap/quote.ts`.
- [x] 3.4 Implement Uniswap V4 quoter adapter in `src/dex/uniswap/v4/quote.ts`.

## 4. Service Layer
- [x] 4.1 Implement `QuoteService` in `src/services/quote/QuoteService.ts` to aggregate quotes from all providers.
- [x] 4.2 Add error handling and logging to QuoteService.
- [x] 4.3 Create a demo script `src/scripts/check-rates.ts` to fetch and compare quotes for WETH -> USDC.

## 5. Testing
- [x] 5.1 Setup Jest configuration for TypeScript.
- [ ] 5.2 Write unit tests for configuration loading (`src/config/env.test.ts`).
- [ ] 5.3 Write unit tests for error handling (`src/types/errors.test.ts`).
- [ ] 5.4 Write integration tests for Uniswap V3 adapter (with mocked responses).
- [ ] 5.5 Write integration tests for 1Inch adapter (with mocked responses).
- [ ] 5.6 Write integration tests for CowSwap adapter (with mocked responses).
- [ ] 5.7 Write integration tests for QuoteService aggregation logic.

## 6. Documentation
- [x] 6.1 Document how to obtain RPC URLs (Infura, Alchemy, public endpoints).
- [x] 6.2 Document how to obtain 1Inch API key.
- [x] 6.3 Create troubleshooting guide for common errors (rate limits, invalid tokens, etc.).
