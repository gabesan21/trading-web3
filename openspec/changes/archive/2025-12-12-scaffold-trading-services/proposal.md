# Change: Scaffold Trading Services and Quote Layer

## Why
The project requires a structured way to interact with multiple DEXs (Uniswap, 1Inch, CowSwap) to compare token prices and execute trades. Currently, there is no implementation, only research. We need to establish the project structure and build a unified service layer to check output token quantities (quotes) from these providers.

## What Changes
- **Project Structure**: Create the recommended directory structure (`src/services`, `src/dex`, `src/utils`, `src/types`, `src/config`).
- **Quote Capability**: Define a standard interface for fetching quotes (output token quantity) from any DEX.
- **DEX Integrations**: Implement the quote interface for:
    - Uniswap (V3/V4)
    - 1Inch
    - CowSwap
- **Service Layer**: Create a service to orchestrate quote fetching from multiple providers.

## Impact
- **Affected specs**:
    - `quote-service`: New capability for unified quoting.
    - `dex-uniswap`: New capability for Uniswap V3/V4 quote adapters.
    - `dex-oneinch`: New capability for 1Inch quote adapter.
    - `dex-cowswap`: New capability for CowSwap quote adapter.
    - `config-env`: New capability for environment configuration management.
- **Affected code**:
    - `src/` (creation of new directories: services, dex, types, utils, config, scripts).
    - `package.json` (new runtime dependencies and dev dependencies).
    - `.env.example` (new file with comprehensive configuration documentation).
- **New Dependencies**:
    - **Runtime**: 
        - `ethers` (^6.x) - Ethereum interaction
        - `axios` (^1.x) - HTTP requests
        - `dotenv` (^16.x) - Environment variable management
        - `@uniswap/sdk-core` (^4.x) - Uniswap type definitions
        - `@uniswap/v3-sdk` (^3.x) - Uniswap V3 utilities
        - `@cowprotocol/cow-sdk` (^latest) - CowSwap SDK
    - **Development**:
        - `jest` (^29.x) - Testing framework
        - `@types/jest` (^29.x) - Jest type definitions
        - `ts-jest` (^29.x) - TypeScript support for Jest
- **Configuration Requirements**:
    - Users must provide RPC_URL (Ethereum RPC endpoint)
    - Optional but recommended: ONEINCH_API_KEY for better rate limits
    - See `.env.example` for full configuration guide
