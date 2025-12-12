# Design: Stablecoin Arbitrage Strategy

## Overview
This design implements an automated stablecoin arbitrage strategy that identifies and exploits price discrepancies between stablecoins on the same network across multiple DEXs.

## Architecture

### Components

#### 1. Configuration Layer
**Files**: `config/stablecoins.json`, `config/providers.json`

Stores static configuration data organized by network:
- **stablecoins.json**: Maps network names to arrays of stablecoin definitions (symbol, address, decimals)
- **providers.json**: Maps network names to arrays of provider names (matching QuoteProvider implementations)

**Rationale**: JSON configuration files allow easy updates to supported tokens and providers without code changes. Network-keyed structure supports future multi-network expansion.

#### 2. Balance Service
**File**: `src/services/wallet/BalanceService.ts`

Responsibilities:
- Query token balances for a given wallet address
- Identify the stablecoin with the highest balance
- Return token details and balance amount

**Interface**:
```typescript
class BalanceService {
  constructor(provider: ethers.Provider)
  async getBalance(walletAddress: string, token: Token): Promise<bigint>
  async getHighestStablecoinBalance(walletAddress: string, tokens: Token[]): Promise<{ token: Token, balance: bigint } | null>
}
```

**Rationale**: Centralizes balance checking logic. Uses standard ERC20 `balanceOf` calls. Returns null if no balance found.

#### 3. Executor Layer
**Files**: `src/dex/{provider}/executor.ts`, `src/types/executor.ts`

Each DEX provider gets an executor implementing a common interface:
```typescript
interface SwapExecutor {
  name: string
  execute(params: SwapParams): Promise<SwapResult>
  estimateGas(params: SwapParams): Promise<bigint>
  approveToken(token: Token, amount: bigint): Promise<void>
}
```

**SwapParams**:
- tokenIn, tokenOut, amountIn
- minAmountOut (for slippage protection)
- deadline (for timeout protection)
- signer (for signing transactions)

**SwapResult**:
- success: boolean
- transactionHash: string
- amountOut: bigint (actual received)
- gasUsed: bigint
- error?: Error

**Implementation per DEX**:
- **Uniswap V3**: Direct router contract interaction (SwapRouter02)
- **Uniswap V4**: Stub implementation (not deployed yet)
- **1Inch**: API-based swap endpoint with transaction submission
- **CowSwap**: Order submission to off-chain auction system

**Rationale**: Mirrors the QuoteProvider pattern for consistency. Each DEX has unique execution requirements. Common interface allows strategy to be DEX-agnostic.

#### 4. Arbitrage Strategy
**File**: `src/strategies/arbitrage/StablecoinArbitrage.ts`

Main orchestration logic:

```typescript
class StablecoinArbitrage {
  constructor(
    quoteService: QuoteService,
    executors: SwapExecutor[],
    balanceService: BalanceService,
    config: ArbitrageConfig
  )
  
  async findOpportunity(inputToken: Token, inputAmount: bigint, targetTokens: Token[]): Promise<ArbitrageOpportunity | null>
  async executeOpportunity(opportunity: ArbitrageOpportunity): Promise<SwapResult>
  async run(walletAddress: string): Promise<SwapResult | null>
}
```

**Algorithm** (run method):
1. Load stablecoins and providers from config files
2. Get wallet's highest stablecoin balance
3. If no balance, exit
4. For each provider in providers.json:
   - For each target stablecoin (excluding input):
     - Get quote
     - Calculate profit percentage
     - If profit ≥ MIN_PROFIT_BPS, return opportunity immediately
5. If opportunity found, execute trade
6. Return result

**Opportunity Structure**:
```typescript
interface ArbitrageOpportunity {
  provider: string
  inputToken: Token
  outputToken: Token
  amountIn: bigint
  expectedAmountOut: bigint
  profitBps: number
  quote: Quote
}
```

**Rationale**: Stop-on-first-match optimization reduces unnecessary API calls. Profit calculation accounts for decimal differences between tokens. Gas estimation before execution prevents unprofitable trades.

### Configuration Values

**ArbitrageConfig**:
- `minProfitBps`: Minimum profit threshold (basis points, default 30 = 0.3%)
- `maxSlippageBps`: Maximum slippage tolerance (basis points, default 50 = 0.5%)
- `deadline`: Transaction deadline in seconds (default 300 = 5 minutes)
- `checkGasCost`: Whether to factor in gas costs (default true)

### Execution Flow

```
1. Load config files (stablecoins.json, providers.json)
2. Connect wallet via private key
3. Get highest stablecoin balance
   ↓
4. Loop providers (Uniswap V3, V4, 1Inch, CowSwap)
   ↓
5. Loop target stablecoins (all except input)
   ↓
6. Get quote from current provider
   ↓
7. Calculate profit = (amountOut - amountIn) / amountIn
   ↓
8. If profit ≥ 0.3%:
   → Found opportunity!
   → Estimate gas cost
   → Check net profit (profit - gas)
   → If still profitable:
      → Approve token spending (if needed)
      → Execute swap
      → Return result
   ↓
9. If no opportunity found across all combinations:
   → Return null (no action taken)
```

### Error Handling

- **No balance**: Log info and exit gracefully
- **All quotes fail**: Log warning and continue to next provider
- **Execution fails**: Log error with transaction details, return failure result
- **Approval fails**: Log error and abort execution
- **Gas estimation too high**: Skip opportunity and continue search

### Safety Mechanisms

1. **Slippage Protection**: Calculate `minAmountOut` as `expectedAmountOut * (1 - maxSlippage)`
2. **Deadline Protection**: Set transaction deadline to prevent execution after price change
3. **Gas Estimation**: Estimate gas before execution and factor into profitability
4. **Approval Checks**: Check existing allowance before requesting new approval
5. **Dry Run Mode**: Configuration option to simulate without executing

### Example Stablecoins Configuration

**config/stablecoins.json**:
```json
{
  "polygon": [
    {
      "symbol": "USDT",
      "address": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      "decimals": 6
    },
    {
      "symbol": "USDT0",
      "address": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      "decimals": 6
    },
    {
      "symbol": "USDC",
      "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "decimals": 6
    },
    {
      "symbol": "USDC.e",
      "address": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      "decimals": 6
    },
    {
      "symbol": "DAI",
      "address": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      "decimals": 18
    }
  ]
}
```

**config/providers.json**:
```json
{
  "polygon": [
    "Uniswap V3",
    "Uniswap V4",
    "1Inch",
    "CowSwap"
  ]
}
```

### Testing Strategy

1. **Unit Tests**:
   - BalanceService token balance retrieval
   - Profit calculation logic
   - Configuration loading

2. **Integration Tests** (with mocks):
   - Full arbitrage flow with simulated quotes
   - Executor approval and swap calls
   - Error handling paths

3. **E2E Tests** (testnet):
   - Real execution on Polygon testnet
   - Gas cost validation
   - Slippage handling

### Future Enhancements

- Multi-network support (add Ethereum, Arbitrum, etc.)
- Multi-hop arbitrage (USDT → DAI → USDC)
- Flash loan integration for larger trades
- MEV protection via private relayers
- Real-time monitoring and alerts
- Historical performance tracking
