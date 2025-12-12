```
   ___   ___  ___     _   ______  ___ _____ _______  __
  / _ | / _ \/ _ )   | | / / __ \/ _ /_  _// __/ _ \/ /
 / __ |/ , _/ _  |   | |/ / /_/ / , _// / / _// ___/ /__
/_/ |_/_/|_/____/    |___/\____/_/|_|/_/ /___/_/  /____/

    Automated Blockchain Vortex - Stablecoin Arbitrage Engine
```

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0?style=flat-square)](https://docs.ethers.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.0+-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)

</div>

---

## What is ARB VORTEX?

**ARB VORTEX** is an automated stablecoin arbitrage bot for EVM blockchains. It monitors multiple decentralized exchanges (DEXs) to find and execute profitable arbitrage opportunities between stablecoins like USDC, USDT, and DAI.

---

## Supported DEXs

### Multi-DEX Integration
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Uniswap V3  │    │  Uniswap V4  │    │    1Inch     │    │   CowSwap    │
│              │    │              │    │              │    │              │
│  On-chain    │    │  Hooks-based │    │  API-based   │    │ Intent-based │
│  AMM DEX     │    │  AMM DEX     │    │  Aggregator  │    │  MEV-Safe    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       └───────────────────┴───────────────────┴───────────────────┘
                                      ▼
                             ┌─────────────────┐
                             │   ARB VORTEX    │
                             │  Quote Service  │
                             └─────────────────┘
```

| DEX | Type | MEV Protection | Gas Cost | Status |
|-----|------|----------------|----------|--------|
| **Uniswap V3** | On-chain AMM | ❌ No | ~150k gas | ✅ Active |
| **Uniswap V4** | Hooks-based AMM | ❌ No | ~100k gas (optimized) | ✅ Active |
| **1Inch** | Meta-aggregator | ⚠️ Partial | ~200k gas | ✅ Active |
| **CowSwap** | Intent-based | ✅ Yes | ~0 (solver pays) | ✅ Active |

---

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| **Polygon** | 137 | ✅ Production |
| **Polygon Amoy** | 80002 | ✅ Testnet |

---

## Quick Start

### Installation

```bash
# Clone and install
git clone <repository-url>
cd trading-web3
pnpm install

# Configure environment
cp .env.example .env
nano .env  # Add your settings
```

### Essential Commands

```bash
# Check rates across all DEXs (read-only)
pnpm check-rates

# Run arbitrage in simulation mode (no real trades)
pnpm arbitrage --dry-run

# Run arbitrage with real trades
pnpm arbitrage
```

---

## Configuration

Edit `.env` file with your settings:

### Required Settings

```bash
# Network
NETWORK=polygon
CHAIN_ID=137
RPC_URL=https://polygon-rpc.com

# Wallet (for trading only)
PRIVATE_KEY=your_private_key_without_0x_prefix
```

### Optional Settings

```bash
# API Keys (recommended)
ONEINCH_API_KEY=your_1inch_api_key

# Uniswap V4 Configuration (optional - overrides config/dex.json)
# Leave empty if not yet deployed on your target network
UNISWAP_V4_QUOTER_ADDRESS=
UNISWAP_V4_POOL_MANAGER_ADDRESS=
UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS=

# Trading Parameters
MIN_PROFIT_BPS=30        # 0.3% minimum profit
MAX_SLIPPAGE_BPS=50      # 0.5% max slippage
CHECK_GAS_COST=true      # Factor gas into profitability
```

### DEX Configuration

ARB VORTEX uses a centralized configuration system for DEX addresses and parameters.
Base configuration is in `config/dex.json` with network-specific settings for Ethereum, Polygon, and testnets.
Environment variables in `.env` can override these settings.

**Uniswap V4 Status:**
- Uniswap V4 is integrated into the system and will be used automatically when configured
- Currently, V4 is not yet deployed on all networks
- When V4 addresses are available for your network, set them in `.env` to enable V4 quotes
- The system will gracefully continue with V3, 1Inch, and CowSwap if V4 is not configured

### Getting Started

**For Quote Checking (No wallet needed):**
1. Set `RPC_URL` (get free from [Infura](https://infura.io/) or [Alchemy](https://alchemy.com/))
2. Run `pnpm check-rates`

**For Arbitrage Trading:**
1. Complete quote checking setup
2. Add `PRIVATE_KEY` to `.env`
3. Fund wallet with stablecoins (USDC, USDT, or DAI)
4. Ensure you have native tokens for gas (MATIC on Polygon)
5. Test with `pnpm arbitrage --dry-run` first
6. Run live with `pnpm arbitrage`

---

## Security Warnings

```
╔═══════════════════════════════════════════════════════════╗
║  ⚠️  CRITICAL SECURITY WARNINGS ⚠️                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  1. NEVER use your main wallet for automated trading     ║
║  2. NEVER commit private keys to version control         ║
║  3. ALWAYS test on testnet before mainnet                ║
║  4. ALWAYS start with small amounts                      ║
║  5. Create a dedicated arbitrage wallet                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Risk Disclosure:** Cryptocurrency trading involves substantial risk. You can lose your entire trading capital. Gas costs may exceed arbitrage profits. MEV bots may frontrun your transactions.

---

## How It Works

1. **Scans** all stablecoin pairs across Uniswap V3, Uniswap V4 (if configured), 1Inch, and CowSwap
2. **Calculates** profitability including gas costs
3. **Executes** trades automatically when profitable opportunities are found
4. **Logs** all activity for monitoring and analysis

### Multi-Tier Quote Optimization

- **Uniswap V3/V4**: Queries multiple fee tiers (0.05%, 0.3%, 1%) to find the best rate
- **1Inch**: Aggregates across multiple DEXs for best routing
- **CowSwap**: MEV-protected intents executed by solvers
- All quotes are compared to ensure you get the best possible price

---

## Development

```bash
# Build
pnpm build

# Run tests
pnpm test

# Type checking
npx tsc --noEmit
```

---

## License

ISC License - See LICENSE file for details

---

<div align="center">

**Built with ❤️ by the Web3 community**

```
   ___   ___  ___     _   ______  ___ _____ _______  __
  / _ | / _ \/ _ )   | | / / __ \/ _ /_  _// __/ _ \/ /
 / __ |/ , _/ _  |   | |/ / /_/ / , _// / / _// ___/ /__
/_/ |_/_/|_/____/    |___/\____/_/|_|/_/ /___/_/  /____/
```

**Happy Trading!**

</div>
