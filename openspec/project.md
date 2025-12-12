# Project Context

## Purpose
This project aims to develop various trading strategies for Web3 decentralized exchanges (DEXs), leveraging the main swapping endpoints from Uniswap V3/V4, 1inch, and Cowswap. The goal is to create automated trading scripts that can execute trades efficiently on the Ethereum Virtual Machine (EVM).

## Tech Stack
- TypeScript: Primary programming language for type safety and maintainability.
- Ethers.js: Library for interacting with Ethereum blockchain and smart contracts.
- pnpm: Fast, disk space efficient package manager for managing project dependencies.

## Project Conventions

### Code Completion Policy
- **ALWAYS write production-ready code.** No placeholders, no TODO comments, no incomplete implementations.
- **When a task is requested, it MUST be completed fully.** All updates and new logic must be implemented.
- **Breaking changes are intentional.** Do not preserve backward compatibility if a change is requested.

### Package Management
- Use pnpm as the package manager (not npm or yarn).
- Always use `pnpm install` to install dependencies.
- Use `pnpm add <package>` to add new dependencies.
- Use `pnpm remove <package>` to remove dependencies.
- Lock file (`pnpm-lock.yaml`) must be committed to version control.
- Do not commit `package-lock.json` or `yarn.lock`.

### Code Style
- Use TypeScript strict mode.
- Follow ESLint and Prettier for code formatting.
- Naming conventions: camelCase for variables and functions, PascalCase for classes and interfaces.

### Architecture Patterns
- Modular architecture with separate modules for each DEX integration.
- Strategy pattern for implementing different trading strategies.
- Error handling with try-catch and custom error classes.

### Testing Strategy
- Unit tests for individual functions and modules using Jest.
- Integration tests for DEX interactions.
- Mock external dependencies for testing.

### Git Workflow
- Use GitHub Flow: main branch for production, feature branches for development.
- Commit messages: Use conventional commits (feat, fix, docs, etc.).
- Pull requests required for merging to main.

## Domain Context
Web3 trading involves decentralized finance (DeFi) protocols on blockchain networks. Swapping endpoints allow for token exchanges without intermediaries. Strategies may include arbitrage, market making, or automated trading based on price feeds.

## Important Constraints
- Gas fees on Ethereum network.
- Smart contract security and audits.
- Regulatory compliance for trading activities.
- Rate limits and API restrictions from DEXs.

## External Dependencies
- Uniswap V3/V4 contracts on Ethereum.
- 1inch API for swaps.
- Cowswap protocol for batch auctions.

## Project Structure
Organize the codebase into modular folders for maintainability and scalability.

### Suggested Folder Structure
```
src/
├── services/           # Shared services (orchestration, state, logging)
│   ├── orchestrator/   # Trading loop coordination
│   ├── state/          # Persistence for balances, positions, history
│   └── logging/        # Metrics and alerting hooks
├── strategies/         # Trading strategy implementations
│   ├── basic/          # Basic swap and trade strategies
│   ├── arbitrage/      # Arbitrage opportunities across DEXs
│   ├── liquidity/      # Liquidity provision and management
│   └── futures/        # Futures and derivatives trading (if applicable)
├── dex/                # DEX-specific integrations
│   ├── uniswap/        # Uniswap V3/V4 integration
│   ├── oneinch/        # 1inch API integration
│   └── cowswap/        # Cowswap protocol integration
├── utils/              # Shared utilities (e.g., price feeds, gas estimation)
├── types/              # TypeScript type definitions
├── config/             # Configuration files and constants
└── index.ts            # Main entry point
```

### Folder Responsibilities
- **services/**: Centralized orchestration, state persistence, and logging that other modules consume.
- **strategies/**: Each subfolder contains strategy-specific logic, with interfaces for common operations.
- **dex/**: Abstraction layers for each DEX, handling API calls, contract interactions, and data parsing.
- **utils/**: Reusable functions like wallet management, transaction signing, and error handling.
- **types/**: Centralized type definitions for tokens, trades, and DEX responses.
- **config/**: Environment-specific settings, API keys, and network configurations.

### Capability Specifications
Define requirements for each major module under `openspec/specs/` before implementation. Start with:
- `trading-orchestrator`: Main execution loop covering quote aggregation, strategy selection, submission, and retries.
- `dex-uniswap`, `dex-oneinch`, `dex-cowswap`: DEX adapters exposing quote/execute methods with gas and slippage handling.
- `strategy-basic`: Base interface describing `estimate()` and `execute()` behavior with configurable parameters.

Use OpenSpec changes to capture these capabilities so the codebase stays aligned with the documented architecture.
