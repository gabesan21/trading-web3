# Design: Execute Trade Script

## Architecture Overview

The execute-trade script follows a linear workflow with clear separation of concerns:

```
User Input → Validation → Provider Resolution → Quote → Confirmation → Execute
```

### Component Responsibilities

#### 1. CLI Trade Executor (Main Orchestrator)
**Location**: `src/scripts/execute-trade.ts`

**Responsibilities:**
- Parse command-line arguments
- Coordinate the execution flow
- Handle top-level error cases
- Output results to user

**Key Functions:**
```typescript
async function main(args: string[]): Promise<void>
async function parseArguments(args: string[]): TradeRequest
async function executeTrade(request: TradeRequest): Promise<void>
```

#### 2. Provider Resolution
**Location**: Utility functions within the script or `src/utils/provider-resolver.ts`

**Responsibilities:**
- Map provider names from CLI to executor instances
- Handle name variations and normalization
- Return appropriate executor based on provider and network

**Key Functions:**
```typescript
function getExecutorForProvider(
  providerName: string,
  network: string,
  chainId: number
): SwapExecutor

function normalizeProviderName(name: string): string
```

**Provider Mapping Strategy:**
- Load available providers from `config/providers.json`
- Normalize input (trim, lowercase, remove special characters)
- Match against known provider patterns:
  - "Uniswap V3" → UniswapV3Executor
  - "1Inch" → OneInchExecutor
  - "CowSwap" → CowSwapExecutor
- Throw clear error if provider not found or not available for network

#### 3. Quote Confirmation
**Location**: `src/utils/confirmation.ts` (new file)

**Responsibilities:**
- Format quote information for display
- Prompt user for yes/no input
- Handle force flag to bypass prompts
- Return confirmation decision

**Key Functions:**
```typescript
async function confirmTrade(
  quote: Quote,
  tokenIn: Token,
  tokenOut: Token,
  amountIn: bigint,
  force: boolean
): Promise<boolean>

function formatQuoteDisplay(
  quote: Quote,
  tokenIn: Token,
  tokenOut: Token,
  amountIn: bigint
): string
```

## Data Flow

### Input Processing
```
Command: "USDT 1000 DAI polygon UniswapV3"
         ↓
Arguments: {
  tokenInSymbol: "USDT",
  amount: "1000",
  tokenOutSymbol: "DAI",
  network: "polygon",
  provider: "UniswapV3"
}
         ↓
Resolved: {
  tokenIn: { symbol: "USDT", address: "0x...", decimals: 6, chainId: 137 },
  tokenOut: { symbol: "DAI", address: "0x...", decimals: 18, chainId: 137 },
  amountIn: 1000000000n (1000 * 10^6),
  network: "polygon",
  chainId: 137,
  provider: "Uniswap V3"
}
```

### Quote and Confirmation
```
QuoteParams → QuoteProvider.getQuote() → Quote
                                           ↓
                          Display to user with:
                          - Input amount and token
                          - Expected output and token
                          - Estimated gas
                          - Provider name
                          - Exchange rate
                                           ↓
                          Prompt: "Execute this trade? (y/n)"
                                           ↓
                          if force flag: skip prompt, return true
                          if user types 'y': return true
                          if user types 'n': return false
```

### Trade Execution
```
Confirmation = true
       ↓
SwapParams = {
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut: quote.amountOut * (1 - slippage),
  deadline: now + deadlineSeconds,
  signer: wallet,
  chainId
}
       ↓
executor.approveToken(tokenIn, amountIn, signer)
       ↓
executor.execute(swapParams)
       ↓
SwapResult { success, transactionHash, amountOut, gasUsed }
       ↓
Display results to user
```

## Error Handling Strategy

### Validation Errors (Fail Fast)
- Missing or invalid arguments → Show usage help
- Unknown token symbol → List available tokens
- Unknown provider → List available providers for network
- Missing PRIVATE_KEY → Show setup instructions

### Runtime Errors (Graceful)
- Quote fetch fails → Display clear error, suggest retrying
- Insufficient balance → Show current balance vs required
- Approval fails → Show transaction error details
- Trade execution fails → Show transaction hash (if available) and error

### Error Message Template
```
❌ Error: [Category]
   Reason: [Specific problem]
   Solution: [How to fix]
   [Additional context if helpful]
```

## Configuration Integration

### Environment Variables Required
```bash
PRIVATE_KEY=<wallet-private-key>
RPC_URL=<polygon-rpc-url>
CHAIN_ID=137
NETWORK=polygon
```

### Configuration Files Used
- `config/providers.json`: Available DEX providers per network
- `config/stablecoins.json`: Token addresses and metadata
- `.env`: Wallet and RPC configuration

### Chain ID Mapping
```typescript
const CHAIN_IDS: Record<string, number> = {
  'polygon': 137,
  'ethereum': 1,
  'goerli': 5,
  // Add more as needed
};
```

## User Experience Design

### Help Text
```
Usage: npm run trade <tokenIn> <amount> <tokenOut> <network> <provider> [options]

Arguments:
  tokenIn     Symbol of token to sell (e.g., USDT)
  amount      Amount to trade (in token units, e.g., 1000)
  tokenOut    Symbol of token to buy (e.g., DAI)
  network     Network name (e.g., polygon)
  provider    DEX provider name (e.g., "Uniswap V3")

Options:
  --force     Skip confirmation prompt (use with caution)
  --help      Show this help message

Examples:
  npm run trade USDT 1000 DAI polygon "Uniswap V3"
  npm run trade USDT 1000 DAI polygon "Uniswap V3" -- --force

Environment:
  Requires PRIVATE_KEY and RPC_URL in .env file
```

### Quote Display Format
```
=============================================================================
TRADE QUOTE
=============================================================================

Provider: Uniswap V3
Network:  Polygon

You Send:    1,000.00 USDT
You Receive: ~999.85 DAI
Rate:        1 USDT = 0.99985 DAI

Estimated Gas: 150,000 gas units
Fee:          0.15 DAI

=============================================================================
Execute this trade? (y/n): _
```

### Success Output
```
✓ Trade executed successfully!

Transaction: 0x1234...5678
Amount Received: 999.82 DAI
Gas Used: 148,234

View on Polygonscan:
https://polygonscan.com/tx/0x1234...5678
```

## Trade-offs and Decisions

### Decision 1: Synchronous vs Asynchronous Execution
**Choice**: Synchronous (script waits for confirmation and execution)
**Rationale**: Simpler UX, immediate feedback, suitable for CLI use case

### Decision 2: Argument Format
**Choice**: Positional arguments for main params, flags for options
**Rationale**: 
- Positional is fastest to type for common case
- Flags add clarity for optional behavior
- Matches common CLI patterns (git, npm, etc.)

### Decision 3: Token Resolution
**Choice**: Resolve by symbol from config, not raw addresses
**Rationale**:
- More user-friendly (symbols are memorable)
- Prevents address typos
- Config ensures correct addresses per network
- Can be extended later to support raw addresses if needed

### Decision 4: Single Provider vs Multi-Provider
**Choice**: Single provider per execution
**Rationale**:
- Simpler implementation
- Clearer intent (user picks provider explicitly)
- Can use separate `check-rates.ts` for comparison
- Keeps script focused on execution

### Decision 5: Slippage Configuration
**Choice**: Use default from environment, no CLI override
**Rationale**:
- Reduces argument complexity
- Slippage is typically a constant per user
- Power users can modify .env as needed
- Can add `--slippage` flag in future if requested

## Testing Strategy

### Unit Tests
- Argument parsing edge cases
- Provider name normalization
- Token resolution logic
- Quote display formatting

### Integration Tests
- Full flow with mocked executors
- Confirmation prompt handling
- Force flag behavior

### Manual Testing Checklist
- [ ] Execute trade with valid parameters
- [ ] Reject trade at confirmation prompt
- [ ] Execute trade with --force flag
- [ ] Handle invalid token symbol
- [ ] Handle invalid provider name
- [ ] Handle missing PRIVATE_KEY
- [ ] Handle insufficient balance
- [ ] Handle network errors during quote
- [ ] Handle transaction failure
- [ ] Verify transaction on block explorer

## Future Enhancements

### Potential Extensions (Out of Scope)
1. **Multi-hop trades**: Support token paths (USDT → ETH → DAI)
2. **Dry run mode**: Show what would happen without executing
3. **Quote comparison**: Show quotes from all providers before choosing
4. **Limit orders**: Wait for specific price before executing
5. **Batch execution**: Execute multiple trades from CSV
6. **Transaction monitoring**: Wait for confirmations, show status
7. **Gas price optimization**: Choose gas price based on urgency

### Backward Compatibility
- New script doesn't affect existing functionality
- Existing `check-rates.ts` remains unchanged
- Shared utilities are additive, no breaking changes
