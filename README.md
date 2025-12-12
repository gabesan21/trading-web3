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

| DEX | Type | MEV Protection | Status |
|-----|------|----------------|--------|
| **Uniswap V3** | On-chain AMM | ❌ No | ✅ Active |
| **1Inch** | Meta-aggregator | ⚠️ Partial | ✅ Active |
| **CowSwap** | Intent-based | ✅ Yes | ✅ Active |

---

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| **Polygon** | 137 | ✅ Production |
| **Ethereum** | 1 | ✅ Production |
| **Polygon Mumbai** | 80001 | ✅ Testnet |

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

# Trading Parameters
MIN_PROFIT_BPS=30        # 0.3% minimum profit
MAX_SLIPPAGE_BPS=50      # 0.5% max slippage
CHECK_GAS_COST=true      # Factor gas into profitability
```

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

1. **Scans** all stablecoin pairs across Uniswap V3, 1Inch, and CowSwap
2. **Calculates** profitability including gas costs
3. **Executes** trades automatically when profitable opportunities are found
4. **Logs** all activity for monitoring and analysis

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
