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

**Polygon** • **Ethereum** • **Multi-DEX** • **MEV-Protected**

[Quick Start](#-quick-start-in-60-seconds) • [Features](#-core-features) • [Documentation](#-documentation) • [Security](#-security-first)

</div>

---

## 🎯 What is ARB VORTEX?

**ARB VORTEX** is an automated stablecoin arbitrage trading bot built for Ethereum Virtual Machine (EVM) blockchains. It intelligently scans multiple decentralized exchanges (DEXs) to identify and execute profitable arbitrage opportunities between stablecoins with **military-grade** precision.

```bash
┌─────────────────────────────────────────────────────────┐
│  💰 Arbitrage Opportunity Detected                     │
├─────────────────────────────────────────────────────────┤
│  Route:       USDC → USDT                              │
│  DEX:         Uniswap V3                               │
│  Input:       1,000.00 USDC                            │
│  Output:      1,003.50 USDT                            │
│  Profit:      3.50 USDT (0.35%)                        │
│  Gas Cost:    ~$0.06                                   │
│  Net Profit:  $3.44 ✅                                 │
│                                                         │
│  [Execute Trade] [Skip] [View Details]                 │
└─────────────────────────────────────────────────────────┘
```

### Why ARB VORTEX?

- **Multi-DEX Aggregation**: Compare quotes from Uniswap V3, 1inch, and CowSwap simultaneously
- **Gas-Aware Trading**: Automatically factors in transaction costs to ensure net profitability
- **MEV Protection**: CowSwap integration provides protection against frontrunning
- **Dry-Run Mode**: Test strategies risk-free before committing real capital
- **Battle-Tested**: Production-ready TypeScript with comprehensive error handling

---

## ⚡ Quick Start in 60 Seconds

Get ARB VORTEX running in under a minute:

```bash
# 1. Clone the repository
$ git clone <repository-url>
$ cd trading-web3

# 2. Install pnpm (if not already installed)
$ npm install -g pnpm

# 3. Install dependencies
$ pnpm install

# 4. Configure your environment
$ cp .env.example .env
$ nano .env  # Add your RPC_URL

# 5. Check rates across all DEXs (read-only, no wallet needed)
$ pnpm check-rates

# ✅ Success! You should see quotes from multiple DEXs
```

**Example Output:**
```
[INFO] 🔍 Fetching quotes for 1.0 WETH → USDC
[INFO] Uniswap V3: 2,450.32 USDC ✅
[INFO] 1Inch: 2,451.87 USDC ✅ (Best Rate)
[INFO] CowSwap: 2,449.95 USDC ✅
[INFO] 🏆 Best quote: 1Inch (2,451.87 USDC)
```

**Ready to run arbitrage?** See the [Arbitrage Setup Guide](#-stablecoin-arbitrage-setup) below.

---

## 🚀 Core Features

### Multi-DEX Integration
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Uniswap V3  │    │    1Inch     │    │   CowSwap    │
│              │    │              │    │              │
│  On-chain    │    │  API-based   │    │ Intent-based │
│  AMM DEX     │    │  Aggregator  │    │  MEV-Safe    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           ▼
                  ┌─────────────────┐
                  │   ARB VORTEX    │
                  │  Quote Service  │
                  └─────────────────┘
```

**Supported DEX Features:**

| DEX | Status | Type | MEV Protection | Gas Cost |
|-----|--------|------|----------------|----------|
| **Uniswap V3** | ✅ Active | On-chain AMM | ❌ No | ~150k gas |
| **1Inch** | ✅ Active | Meta-aggregator | ⚠️ Partial | ~200k gas |
| **CowSwap** | ✅ Active | Intent-based | ✅ Yes | ~0 (solver pays) |
| **Uniswap V4** | 🔜 Planned | Hooks-based | TBD | TBD |

### Key Capabilities

🎯 **Intelligent Arbitrage Detection**
- Systematic scanning of all stablecoin pairs across all DEXs
- Real-time profitability calculations with gas cost factoring
- Configurable minimum profit thresholds (default: 0.3%)

🛡️ **Production-Grade Safety**
- Dry-run mode for risk-free testing
- Slippage protection with configurable limits
- Transaction deadline enforcement
- Automatic retry with exponential backoff

📊 **Advanced Features**
- Wallet balance auto-detection
- Multi-network support (Polygon, Ethereum)
- Structured logging for monitoring and debugging
- Type-safe architecture with full TypeScript

🔧 **Developer-Friendly**
- Clean, modular architecture
- Comprehensive error handling
- Easy DEX integration via provider pattern
- Extensive documentation with examples

---

## 📁 Project Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      ARB VORTEX ENGINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Strategies Layer                                     │ │
│  │  • StablecoinArbitrage                                │ │
│  └───────────────┬───────────────────────────────────────┘ │
│                  │                                          │
│  ┌───────────────▼───────────────────────────────────────┐ │
│  │  Services Layer                                       │ │
│  │  • QuoteService  • BalanceService                     │ │
│  └───────────────┬───────────────────────────────────────┘ │
│                  │                                          │
│  ┌───────────────▼───────────────────────────────────────┐ │
│  │  DEX Providers                                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │ Uniswap  │  │  1Inch   │  │ CowSwap  │            │ │
│  │  │   V3     │  │   API    │  │  Orders  │            │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │ │
│  └───────┼─────────────┼─────────────┼──────────────────┘ │
│          │             │             │                     │
│  ┌───────▼─────────────▼─────────────▼──────────────────┐ │
│  │  Blockchain Layer (Ethers.js)                        │ │
│  │  • RPC Provider  • Wallet  • Contract Calls          │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
trading-web3/
│
├── src/
│   ├── config/                 # 📝 Configuration management
│   │   ├── env.ts              # Environment variables loader
│   │   ├── stablecoins.ts      # Stablecoin addresses per chain
│   │   └── providers.ts        # DEX provider configurations
│   │
│   ├── dex/                    # 🔌 DEX integrations
│   │   ├── uniswap/
│   │   │   ├── v3/             # Uniswap V3 implementation
│   │   │   │   ├── quote.ts    # Quote fetching
│   │   │   │   └── executor.ts # Swap execution
│   │   │   └── v4/             # Uniswap V4 (placeholder)
│   │   ├── oneinch/            # 1Inch aggregator
│   │   │   ├── quote.ts
│   │   │   └── executor.ts
│   │   └── cowswap/            # CowSwap intent orders
│   │       ├── quote.ts
│   │       └── executor.ts
│   │
│   ├── services/               # 🎛️ Business logic
│   │   ├── quote/
│   │   │   └── QuoteService.ts # Multi-DEX quote aggregation
│   │   └── wallet/
│   │       └── BalanceService.ts # Wallet balance checker
│   │
│   ├── strategies/             # 🧠 Trading strategies
│   │   └── arbitrage/
│   │       └── StablecoinArbitrage.ts
│   │
│   ├── types/                  # 📐 TypeScript definitions
│   │   ├── quote.ts
│   │   ├── executor.ts
│   │   ├── arbitrage.ts
│   │   └── errors.ts
│   │
│   ├── utils/                  # 🛠️ Utilities
│   │   ├── logger.ts           # Structured logging
│   │   ├── retry.ts            # Retry with backoff
│   │   ├── validation.ts       # Input validation
│   │   ├── profit.ts           # Profit calculations
│   │   └── confirmation.ts     # User prompts
│   │
│   └── scripts/                # 🚀 Executable scripts
│       ├── check-rates.ts      # Rate checker demo
│       └── run-arbitrage.ts    # Arbitrage bot
│
├── config/
│   ├── stablecoins.json        # Stablecoin addresses
│   └── providers.json          # DEX provider configs
│
└── [config files: .env, tsconfig.json, package.json, etc.]
```

---

## 🔐 Security First

<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║  ⚠️  CRITICAL SECURITY WARNINGS ⚠️                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  1. NEVER use your main wallet for automated trading     ║
║  2. NEVER commit private keys to version control         ║
║  3. ALWAYS test on testnet before mainnet                ║
║  4. ALWAYS start with small amounts                      ║
║  5. ALWAYS use a dedicated arbitrage wallet              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

</div>

### Private Key Management Best Practices

**🔑 Create a Dedicated Wallet**

```bash
# Generate a new wallet using ethers
$ npx ethers-wallet create

# Output:
# Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
# Private Key: abc123...def456 (KEEP THIS SECRET!)
```

**🔒 Secure Your Environment File**

```bash
# Copy the example environment file
$ cp .env.example .env

# Set restrictive permissions (Unix/Linux/macOS)
$ chmod 600 .env

# Verify .env is ignored by git
$ git status
# (Ensure .env does NOT appear in the output)
```

**📝 Required .env Configuration:**

```bash
# ================================
# WALLET CONFIGURATION (REQUIRED)
# ================================
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# ================================
# NETWORK CONFIGURATION (REQUIRED)
# ================================
NETWORK=polygon
CHAIN_ID=137
RPC_URL=https://polygon-rpc.com

# ================================
# ARBITRAGE PARAMETERS (OPTIONAL)
# ================================
MIN_PROFIT_BPS=30        # 0.3% minimum profit
MAX_SLIPPAGE_BPS=50      # 0.5% max slippage
DEADLINE_SECONDS=300     # 5 minute deadline
CHECK_GAS_COST=true      # Factor gas into profitability
```

### Financial Risk Disclosure

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  TRADING RISKS                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  • Cryptocurrency trading involves substantial risk    │
│  • You can lose your entire trading capital            │
│  • Smart contract bugs may result in loss of funds     │
│  • Gas costs can exceed arbitrage profits              │
│  • MEV bots may frontrun your transactions             │
│  • Impermanent loss and slippage are always risks      │
│                                                         │
│  ✅ RECOMMENDATION: Start with $10-50 on testnet       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 Stablecoin Arbitrage Setup

### How Arbitrage Works

```bash
Step 1: Wallet Balance Detection
        └─> Find highest stablecoin balance in your wallet

Step 2: Opportunity Scanning
        └─> Check all pairs: USDC↔USDT, USDC↔DAI, USDT↔DAI, etc.
        └─> Query all DEXs: Uniswap V3, 1Inch, CowSwap

Step 3: Profitability Analysis
        └─> Calculate: (Output - Input) / Input
        └─> Factor in gas costs
        └─> Check against MIN_PROFIT_BPS threshold

Step 4: Execution (if profitable)
        └─> Approve token spending
        └─> Execute swap on best DEX
        └─> Log results
```

### Prerequisites Checklist

Before running arbitrage, ensure you have:

```bash
# ✅ Node.js 18 or higher
$ node --version
# v18.x.x or higher

# ✅ pnpm package manager
$ pnpm --version
# 8.x.x or higher

# ✅ RPC endpoint (Alchemy, Infura, or public RPC)
# Set in .env: RPC_URL=https://...

# ✅ Wallet with private key
# Set in .env: PRIVATE_KEY=...

# ✅ Native tokens for gas (MATIC on Polygon)
$ # Check your balance on PolygonScan

# ✅ Stablecoins for trading (USDC, USDT, DAI)
$ # Bridge funds or buy from exchange
```

### Verified Stablecoin Addresses (Polygon)

The following addresses are pre-configured in `config/stablecoins.json`:

| Token | Address | Decimals | Verified |
|-------|---------|----------|----------|
| **USDT** | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | 6 | ✅ [PolygonScan](https://polygonscan.com/token/0xc2132D05D31c914a87C6611C10748AEb04B58e8F) |
| **USDC** | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` | 6 | ✅ [PolygonScan](https://polygonscan.com/token/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174) |
| **USDC.e** | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | 6 | ✅ [PolygonScan](https://polygonscan.com/token/0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359) |
| **DAI** | `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` | 18 | ✅ [PolygonScan](https://polygonscan.com/token/0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063) |

**How to Verify Token Addresses:**
1. Visit [PolygonScan](https://polygonscan.com/)
2. Search for the token symbol
3. Verify the contract is verified and audited
4. Cross-reference with [CoinGecko](https://www.coingecko.com/)
5. Check official project documentation

### Running the Arbitrage Bot

**Test Mode (Dry-Run) - RECOMMENDED FIRST STEP:**

```bash
$ pnpm arbitrage --dry-run
```

**Expected Dry-Run Output:**
```
╔═══════════════════════════════════════════════════════════╗
║  ARB VORTEX - Stablecoin Arbitrage Engine v1.0           ║
║  Mode: DRY-RUN (Simulation Only)                         ║
╚═══════════════════════════════════════════════════════════╝

[INFO] 🔍 Starting arbitrage scan...
[INFO] Network: Polygon (Chain ID: 137)
[INFO] Wallet: 0x742d...f0bEb
[INFO] Balance: 1,000.00 USDC

┌─────────────────────────────────────────────────────────┐
│  💡 Opportunity Found (DRY-RUN - Not Executed)          │
├─────────────────────────────────────────────────────────┤
│  Provider:        Uniswap V3                            │
│  Route:           USDC → USDT                           │
│  Input Amount:    1,000.00 USDC                         │
│  Output Amount:   1,003.50 USDT                         │
│  Profit:          3.50 USDT (0.35%)                     │
│  Estimated Gas:   150,000 gas (~$0.06)                  │
│  Net Profit:      $3.44 ✅                              │
└─────────────────────────────────────────────────────────┘

[INFO] ✅ Dry-run completed successfully
[INFO] No trades were executed (simulation mode)
```

**Live Execution (REAL TRADES):**

```bash
# Execute real trades (use with caution!)
$ pnpm arbitrage

# With custom config directory
$ pnpm arbitrage --config ./custom-config
```

**Live Execution Output:**
```
╔═══════════════════════════════════════════════════════════╗
║  ARB VORTEX - Stablecoin Arbitrage Engine v1.0           ║
║  Mode: LIVE EXECUTION ⚠️                                  ║
╚═══════════════════════════════════════════════════════════╝

[INFO] 🚀 Starting live arbitrage...
[INFO] 🔍 Scanning for opportunities...
[INFO] 💡 Profitable opportunity found!
[INFO] 🔄 Approving USDC for Uniswap V3...
[INFO] ✅ Approval confirmed (tx: 0xabc123...)
[INFO] 💸 Executing swap: 1,000 USDC → USDT
[INFO] ⏳ Waiting for transaction confirmation...
[INFO] ✅ Swap successful!
        TX Hash: 0xdef456...
        Gas Used: 148,523
        Output: 1,003.50 USDT
        Profit: 3.50 USDT (0.35%)
        Net Profit: $3.44

[INFO] 🏁 Arbitrage cycle complete
```

### Gas Costs & Profitability Guide

**Understanding Gas Economics:**

```
┌───────────────────────────────────────────────────────┐
│  GAS COST CALCULATION                                 │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Gas Units × Gas Price (gwei) × MATIC Price = Cost   │
│                                                       │
│  Example (Polygon):                                   │
│  150,000 gas × 50 gwei × $0.80/MATIC = $0.06         │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Typical Gas Costs on Polygon:**

| DEX | Gas Units | Cost @ 50 gwei | Cost @ 100 gwei |
|-----|-----------|----------------|-----------------|
| Uniswap V3 | ~150,000 | $0.06 | $0.12 |
| 1Inch | ~200,000 | $0.08 | $0.16 |
| CowSwap | ~0 | $0.00 | $0.00 (solver pays) |

**Minimum Profitable Trade Amounts:**

At **0.3% profit threshold** (MIN_PROFIT_BPS=30):

```
Trade Size  │  Gross Profit  │  Gas Cost  │  Net Profit  │  Status
────────────┼────────────────┼────────────┼──────────────┼─────────
$100        │  $0.30         │  $0.06     │  $0.24       │  ⚠️  Risky
$500        │  $1.50         │  $0.06     │  $1.44       │  ✅ OK
$1,000      │  $3.00         │  $0.06     │  $2.94       │  ✅ Good
$5,000      │  $15.00        │  $0.06     │  $14.94      │  ✅ Excellent
```

**Pro Tips for Profitability:**
1. Use larger trade sizes to offset gas costs
2. Monitor gas prices (use [PolygonScan Gas Tracker](https://polygonscan.com/gastracker))
3. Trade during off-peak hours for lower gas
4. Set `CHECK_GAS_COST=true` to skip unprofitable trades
5. Consider CowSwap for gas-free execution

---

## 🛠️ Development

### Build and Test Commands

```bash
# Install dependencies
$ pnpm install

# Build the project
$ pnpm build

# Run type checking
$ npx tsc --noEmit

# Run tests
$ pnpm test

# Check rates (read-only demo)
$ pnpm check-rates

# Run arbitrage (dry-run)
$ pnpm arbitrage --dry-run

# Run arbitrage (live)
$ pnpm arbitrage
```

### Development Workflow

```bash
# 1. Create a new branch
$ git checkout -b feature/your-feature-name

# 2. Make your changes
$ nano src/...

# 3. Build and test
$ pnpm build
$ pnpm test

# 4. Commit with conventional commits
$ git commit -m "feat: add new DEX integration"

# 5. Push and create PR
$ git push origin feature/your-feature-name
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

**Issue: "Wallet configuration missing"**

```bash
# Solution: Ensure environment variables are set
$ cat .env | grep PRIVATE_KEY
# Should output: PRIVATE_KEY=your_key_here

# If missing, copy from example and configure
$ cp .env.example .env
$ nano .env
```

**Issue: "No stablecoin balance found"**

```bash
# Solution: Check your wallet balance
# 1. Visit PolygonScan: https://polygonscan.com/address/<your-address>
# 2. Verify you have stablecoins on the correct network
# 3. Ensure minimum balance (1 USDC = 1,000,000 with 6 decimals)

# Debug: Check wallet address from env
$ node -e "console.log(require('ethers').Wallet.fromPrivateKey('0x' + process.env.PRIVATE_KEY).address)"
```

**Issue: "Insufficient funds for gas"**

```bash
# Solution: Get native tokens for gas
# Polygon: Need MATIC
# Ethereum: Need ETH

# Check gas balance:
# Visit: https://polygonscan.com/address/<your-address>

# Get MATIC:
# • Testnet: https://mumbaifaucet.com/
# • Mainnet: Bridge from exchange or use Polygon Bridge
```

**Issue: "Rate limit exceeded" (1Inch)**

```bash
# Solution: Get a free API key
# 1. Visit: https://portal.1inch.dev/
# 2. Sign up and create an API key
# 3. Add to .env:
$ echo "ONEINCH_API_KEY=your_api_key_here" >> .env

# The bot will continue with other DEXs if 1Inch fails
```

**Issue: "Transaction reverted"**

```bash
# Possible causes:
# 1. Slippage too tight
#    → Increase MAX_SLIPPAGE_BPS in .env
# 2. Price moved between quote and execution
#    → This is normal; bot will retry next cycle
# 3. Insufficient token allowance
#    → Bot should handle this; check logs for approval tx
# 4. Insufficient balance
#    → Verify balance on block explorer
```

**Issue: "No profitable opportunity found"**

```
┌─────────────────────────────────────────────────────────┐
│  ℹ️  This is NORMAL behavior                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  • Arbitrage opportunities are rare and fleeting        │
│  • Market efficiency = fewer opportunities              │
│  • Other bots may be faster                             │
│                                                         │
│  SUGGESTIONS:                                           │
│  → Lower MIN_PROFIT_BPS (but watch gas costs!)          │
│  → Use larger trade amounts                             │
│  → Run continuously to catch opportunities              │
│  → Try different networks (Ethereum, Arbitrum, etc.)    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Debug Commands

```bash
# Check Node.js version
$ node --version

# Check pnpm version
$ pnpm --version

# Verify environment variables are loaded
$ node -e "require('dotenv').config(); console.log(process.env.RPC_URL)"

# Test RPC connection
$ curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check wallet address from private key
$ node -e "console.log(new (require('ethers').Wallet)(process.env.PRIVATE_KEY).address)"
```

---

## 🌐 Network Support

### Supported Networks

| Network | Chain ID | Status | RPC Endpoints |
|---------|----------|--------|---------------|
| **Polygon** | 137 | ✅ Production | [RPC List](https://chainlist.org/chain/137) |
| **Ethereum** | 1 | ✅ Production | [RPC List](https://chainlist.org/chain/1) |
| **Polygon Mumbai** | 80001 | ✅ Testnet | [Faucet](https://mumbaifaucet.com/) |
| **Arbitrum** | 42161 | 🔜 Planned | [RPC List](https://chainlist.org/chain/42161) |
| **Optimism** | 10 | 🔜 Planned | [RPC List](https://chainlist.org/chain/10) |

### Getting RPC Endpoints

**Recommended Providers:**

```bash
# 1. Alchemy (Recommended for production)
#    • Visit: https://www.alchemy.com/
#    • Free tier: 300M compute units/month
#    • Networks: Ethereum, Polygon, Arbitrum, Optimism

# 2. Infura (Good for beginners)
#    • Visit: https://infura.io/
#    • Free tier: 100,000 requests/day
#    • Networks: Ethereum, Polygon

# 3. Public RPCs (Not recommended for production)
#    • Visit: https://chainlist.org/
#    • Free but may be slow/unreliable
```

**Example .env for different networks:**

```bash
# Polygon Mainnet
NETWORK=polygon
CHAIN_ID=137
RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Ethereum Mainnet
NETWORK=ethereum
CHAIN_ID=1
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Polygon Mumbai Testnet
NETWORK=polygon-mumbai
CHAIN_ID=80001
RPC_URL=https://rpc-mumbai.maticvigil.com
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### Contribution Workflow

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
$ git clone https://github.com/YOUR_USERNAME/trading-web3.git
$ cd trading-web3

# 3. Create a feature branch
$ git checkout -b feature/amazing-feature

# 4. Install dependencies
$ pnpm install

# 5. Make your changes
$ nano src/...

# 6. Build and test
$ pnpm build
$ pnpm test
$ npx tsc --noEmit

# 7. Commit your changes (use conventional commits)
$ git commit -m "feat: add amazing feature"

# 8. Push to your fork
$ git push origin feature/amazing-feature

# 9. Open a Pull Request on GitHub
```

### Conventional Commit Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Feature
$ git commit -m "feat: add CowSwap MEV protection"

# Bug fix
$ git commit -m "fix: resolve rate limit handling in 1Inch provider"

# Documentation
$ git commit -m "docs: update README with new examples"

# Refactor
$ git commit -m "refactor: simplify quote aggregation logic"

# Tests
$ git commit -m "test: add unit tests for profit calculations"

# Chore
$ git commit -m "chore: update dependencies"
```

### Code Style Guidelines

- **Language**: TypeScript with strict mode enabled
- **Formatting**: Use Prettier defaults (auto-formatted on commit)
- **Linting**: Follow ESLint rules
- **Naming**: 
  - Classes: PascalCase (`QuoteService`)
  - Functions/Variables: camelCase (`getQuote`)
  - Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
  - Files: kebab-case or PascalCase matching class name

### Development Commands Reference

```bash
┌────────────────────┬──────────────────────────────────────┐
│ Command            │ Description                          │
├────────────────────┼──────────────────────────────────────┤
│ pnpm install       │ Install dependencies                 │
│ pnpm build         │ Build TypeScript to JavaScript       │
│ pnpm test          │ Run test suite                       │
│ pnpm check-rates   │ Run quote demo script                │
│ pnpm arbitrage     │ Run arbitrage bot (live)             │
│ npx tsc --noEmit   │ Type check without building          │
└────────────────────┴──────────────────────────────────────┘
```

---

## 📊 Roadmap

### Completed Features

- [x] Multi-DEX quote aggregation (Uniswap V3, 1Inch, CowSwap)
- [x] Stablecoin arbitrage strategy
- [x] Swap execution across all DEXs
- [x] Dry-run mode for safe testing
- [x] Gas-aware profitability calculations
- [x] Automatic retry with exponential backoff
- [x] Comprehensive error handling
- [x] Structured logging

### Upcoming Features

```
🔜 Q1 2025
├─ Uniswap V4 integration (when deployed)
├─ Flash loan support for capital-free arbitrage
└─ Advanced slippage optimization

🔜 Q2 2025
├─ Multi-hop arbitrage (USDC → DAI → USDT → USDC)
├─ MEV protection via Flashbots integration
├─ Historical performance tracking and analytics
└─ Web dashboard for monitoring

🔜 Q3 2025
├─ Multi-network deployment (Arbitrum, Optimism, Base)
├─ Additional DEX integrations (Balancer, Curve)
├─ Telegram/Discord notification bot
└─ Advanced backtesting framework

🔜 Q4 2025
├─ Machine learning price prediction
├─ Automated portfolio rebalancing
└─ DAO governance for strategy parameters
```

---

## 📜 License

This project is licensed under the **ISC License**.

```
Copyright (c) 2025 ARB VORTEX Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 📞 Support & Community

```
┌─────────────────────────────────────────────────────────┐
│  Need Help?                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📖 Documentation    Read the full guide above          │
│  🐛 Bug Reports      Open an issue on GitHub            │
│  💡 Feature Ideas    Start a discussion on GitHub       │
│  🤝 Contributing     See Contributing section above     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

<div align="center">

**Built with ❤️ by the Web3 community**

```
   ___   ___  ___     _   ______  ___ _____ _______  __
  / _ | / _ \/ _ )   | | / / __ \/ _ /_  _// __/ _ \/ /
 / __ |/ , _/ _  |   | |/ / /_/ / , _// / / _// ___/ /__
/_/ |_/_/|_/____/    |___/\____/_/|_|/_/ /___/_/  /____/
```

**Happy Trading! May the arbitrage opportunities be ever in your favor.**

</div>

---

## 🔍 Documentation

### API Reference

For developers integrating ARB VORTEX into their own projects:

**QuoteService Usage:**

```typescript
import { QuoteService } from './services/quote/QuoteService';
import { UniswapV3QuoteProvider } from './dex/uniswap/v3/quote';
import { Token } from './types/quote';
import { ethers } from 'ethers';

// Initialize providers
const providers = [
  new UniswapV3QuoteProvider(rpcUrl, quoterAddress, maxRetries),
  // ... other providers
];

// Create quote service
const quoteService = new QuoteService(providers);

// Define tokens
const WETH: Token = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  decimals: 18,
  symbol: 'WETH',
  chainId: 1,
};

const USDC: Token = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  symbol: 'USDC',
  chainId: 1,
};

// Fetch quotes
const quotes = await quoteService.getQuotes({
  tokenIn: WETH,
  tokenOut: USDC,
  amountIn: ethers.parseEther('1'),
  chainId: 1,
});

// Best quote is first (sorted by amountOut descending)
const bestQuote = quotes[0];
console.log(`Best rate: ${bestQuote.provider}`);
console.log(`Output: ${ethers.formatUnits(bestQuote.amountOut, 6)} USDC`);
```

**Adding a New DEX Provider:**

```typescript
// 1. Implement the QuoteProvider interface
import { QuoteProvider, QuoteParams, Quote } from '../../types/quote';

export class MyDexQuoteProvider implements QuoteProvider {
  readonly name = 'MyDex';

  async getQuote(params: QuoteParams): Promise<Quote> {
    // Implement quote fetching logic
    // ...
    return {
      provider: this.name,
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      amountOut: /* calculated output */,
      route: [params.tokenIn.address, params.tokenOut.address],
      estimatedGas: /* gas estimate */,
    };
  }
}

// 2. Add to QuoteService
const quoteService = new QuoteService([
  new UniswapV3QuoteProvider(...),
  new MyDexQuoteProvider(...),
]);
```

### Environment Variables Reference

Complete list of all environment variables:

```bash
# ================================
# REQUIRED FOR ARBITRAGE
# ================================
PRIVATE_KEY=                    # Wallet private key (without 0x)
NETWORK=                        # Network name (polygon, ethereum)
CHAIN_ID=                       # Chain ID (137 for Polygon)
RPC_URL=                        # RPC endpoint URL

# ================================
# OPTIONAL: API KEYS
# ================================
ONEINCH_API_KEY=                # 1Inch API key for higher limits

# ================================
# OPTIONAL: NETWORK SETTINGS
# ================================
REQUEST_TIMEOUT=30000           # HTTP request timeout (ms)
MAX_RETRIES=3                   # Max retry attempts

# ================================
# OPTIONAL: ARBITRAGE PARAMETERS
# ================================
MIN_PROFIT_BPS=30               # Min profit in basis points (0.3%)
MAX_SLIPPAGE_BPS=50             # Max slippage tolerance (0.5%)
DEADLINE_SECONDS=300            # Transaction deadline (seconds)
CHECK_GAS_COST=true             # Factor gas into profitability

# ================================
# OPTIONAL: DEX ADDRESSES
# ================================
# (Usually auto-configured per network)
UNISWAP_V3_QUOTER_ADDRESS=      # Uniswap V3 quoter contract
UNISWAP_V3_ROUTER_ADDRESS=      # Uniswap V3 router contract
ONEINCH_API_BASE_URL=           # 1Inch API base URL
COWSWAP_API_BASE_URL=           # CowSwap API base URL
```

---

**End of Documentation**
