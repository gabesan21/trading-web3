# Design: Uniswap V4 Integration

## Context

Uniswap V4 represents a significant architectural shift from V3, introducing a singleton PoolManager contract, flash accounting for gas optimization, and customizable hooks. The current codebase has placeholder implementations that need to be replaced with functional code based on the V4 SDK and contract interfaces.

Key V4 differences from V3:
- **Singleton architecture**: One PoolManager instead of separate pool contracts
- **Flash accounting**: Net balances settled once per transaction (saves gas)
- **PoolKey structure**: Pools identified by (currency0, currency1, fee, tickSpacing, hooks)
- **Hooks**: Optional custom logic that can be attached to pools
- **Universal Router**: Multi-action execution pattern (SWAP → SETTLE → TAKE)

## Goals / Non-Goals

### Goals
- Implement functional V4 quote fetching using Quoter contract
- Implement V4 swap execution using Universal Router
- Maintain consistency with existing V3, 1Inch, and CowSwap integration patterns
- Support configurable V4 contract addresses for different networks
- Enable V4 in production scripts (check-rates, arbitrage)

### Non-Goals
- Custom hook development (use hookless pools initially)
- Multi-hop routing (focus on single-pair swaps first)
- Pool creation or liquidity provision
- Migration tools from V3 to V4
- Advanced routing optimization

## Decisions

### Decision: Use V4 SDK for PoolKey Management
**Why**: The V4 SDK provides validated PoolKey construction and proper token ordering (currency0 < currency1). This prevents common errors like incorrect token pair ordering.

**Alternatives considered**:
- Manual PoolKey construction: Error-prone, requires custom validation
- Direct contract calls without SDK: Loses type safety and helper utilities

### Decision: Universal Router for Swap Execution  
**Why**: Universal Router is the canonical way to interact with V4, supporting multi-action patterns (SWAP, SETTLE, TAKE) in one transaction.

**Alternatives considered**:
- Direct PoolManager interaction: More complex, requires manual flash accounting
- Custom router: Reinventing the wheel, not audited

### Decision: Start with Hookless Pools
**Why**: Simplifies initial implementation. Hooks add complexity and are optional for basic swaps.

**Alternatives considered**:
- Implement hook support from day 1: Unnecessary complexity for MVP

### Decision: Single Fee Tier (3000 = 0.3%)
**Why**: Matches V3 implementation pattern. Can be extended to multi-tier support later.

**Alternatives considered**:
- Support all fee tiers: Adds complexity without immediate value

### Decision: Optional V4 Configuration
**Why**: V4 is not yet widely deployed. Making it optional allows gradual rollout.

**Implementation**: Check for `UNISWAP_V4_QUOTER_ADDRESS` in env. If not set, skip V4 provider initialization.

## Architecture

### Quote Flow
```
User → UniswapV4QuoteProvider.getQuote()
  → Validate tokens/amounts
  → Construct PoolKey (currency0, currency1, fee, tickSpacing, hooks=0x0)
  → Call Quoter.quoteExactInputSingle(poolKey, zeroForOne, amountIn)
  → Return Quote with amountOut, estimatedGas
```

### Swap Flow
```
User → UniswapV4Executor.execute()
  → Approve tokenIn for UniversalRouter
  → Encode SWAP_EXACT_IN_SINGLE action (poolKey, zeroForOne, amountIn, minAmountOut)
  → Encode SETTLE_ALL action (pay input token)
  → Encode TAKE_ALL action (receive output token)
  → UniversalRouter.execute(commands, inputs, deadline)
  → Wait for transaction confirmation
  → Return SwapResult
```

### PoolKey Structure
```typescript
interface PoolKey {
  currency0: string;      // Lower address token
  currency1: string;      // Higher address token  
  fee: number;            // Fee tier in hundredths of bps (3000 = 0.3%)
  tickSpacing: number;    // Depends on fee tier
  hooks: string;          // Hook contract address or 0x0
}
```

### Token Ordering
V4 requires `currency0 < currency1` (lexicographic address comparison).

```typescript
const isTokenAFirst = tokenA.address.toLowerCase() < tokenB.address.toLowerCase();
const currency0 = isTokenAFirst ? tokenA.address : tokenB.address;
const currency1 = isTokenAFirst ? tokenB.address : tokenA.address;
const zeroForOne = isTokenAFirst; // true if swapping tokenA → tokenB
```

## Contract Addresses

### Mainnet (Chain ID 1)
- PoolManager: TBD (not yet deployed)
- Quoter: TBD
- UniversalRouter: TBD

### Polygon (Chain ID 137)
- PoolManager: TBD
- Quoter: TBD
- UniversalRouter: TBD

### Testnet (Sepolia, Chain ID 11155111)
- Use for initial testing when V4 is deployed

**Note**: Addresses should be configurable via environment variables, not hardcoded.

## Dependencies

### New Package
```json
{
  "@uniswap/v4-sdk": "^1.x.x"
}
```

### Existing Packages (reuse)
- `ethers` - Contract interactions
- `@uniswap/sdk-core` - Token definitions

## Configuration

### Environment Variables (.env)
```bash
# Uniswap V4 Configuration (optional)
UNISWAP_V4_QUOTER_ADDRESS=0x...
UNISWAP_V4_POOL_MANAGER_ADDRESS=0x...
UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS=0x...
```

### Config Loader (src/config/env.ts)
```typescript
interface Config {
  // ... existing fields
  uniswap: {
    v3QuoterAddress: string;
    v3RouterAddress: string;
    v4QuoterAddress?: string;      // Optional
    v4PoolManagerAddress?: string; // Optional
    v4UniversalRouterAddress?: string; // Optional
  }
}
```

## Error Handling

### Common Errors
1. **Configuration error**: Missing V4 addresses
   - Throw `QuoteError(CONFIGURATION_ERROR)` with helpful message
   
2. **Pool not found**: PoolKey doesn't match any pool
   - Throw `QuoteError(INSUFFICIENT_LIQUIDITY)`
   
3. **Insufficient liquidity**: Pool exists but can't fill order
   - Throw `QuoteError(INSUFFICIENT_LIQUIDITY)`
   
4. **Network error**: RPC failure
   - Retry with exponential backoff (reuse existing retry util)

### Graceful Degradation
If V4 is not configured:
- Don't initialize V4 provider
- Continue with V3, 1Inch, CowSwap
- Log warning: "Uniswap V4 not configured, skipping"

## Testing Strategy

### Unit Tests
- PoolKey construction with proper token ordering
- Quote parsing and validation
- Swap action encoding
- Error handling for missing configuration

### Integration Tests (Manual on Testnet)
- Fetch quote from V4 Quoter
- Execute swap via Universal Router
- Verify token balances before/after

### Validation
- Run check-rates with V4 enabled
- Compare V4 quotes with V3/1Inch for same pair
- Ensure gas estimates are reasonable

## Migration Plan

### Phase 1: Implementation (This Change)
1. Implement quote provider
2. Implement swap executor
3. Add configuration support
4. Update scripts to include V4

### Phase 2: Deployment (After Approval)
1. Deploy to testnet first
2. Validate with small swaps
3. Monitor for errors/gas costs
4. Gradually enable on mainnet when V4 is deployed

### Rollback
If issues arise:
1. Remove V4 addresses from .env
2. V4 provider won't initialize
3. System continues with V3/1Inch/CowSwap

No code rollback needed due to optional configuration.

## Risks / Trade-offs

### Risk: V4 Not Yet Deployed on Target Networks
**Mitigation**: Make V4 optional. Only activate when addresses are configured.

### Risk: SDK Breaking Changes
**Mitigation**: Pin SDK version. Test thoroughly before upgrading.

### Risk: Higher Gas Costs Than Expected
**Mitigation**: Measure gas in testing. V4 should be more efficient due to flash accounting, but verify.

### Trade-off: Single-Hop Only
**Pro**: Simpler implementation, faster to ship
**Con**: Miss multi-hop opportunities
**Decision**: Start simple, add multi-hop later if needed

### Trade-off: No Hook Support
**Pro**: Reduces complexity, avoids unknown behaviors
**Con**: Can't leverage custom hooks (dynamic fees, etc.)
**Decision**: Acceptable for initial release

## Open Questions

1. **Are V4 contracts deployed on Polygon mainnet/testnet yet?**
   - Check Uniswap docs for deployment addresses
   - Use Sepolia for initial testing if Polygon not ready

2. **What fee tiers are supported in V4?**
   - V3 uses 500/3000/10000
   - V4 may have different tiers or dynamic fees via hooks
   - Start with 3000 (0.3%) as default

3. **Do we need to handle native ETH differently?**
   - V4 uses WETH, similar to V3
   - No special handling expected

4. **Should we implement quote batching?**
   - V4 supports batching multiple quotes
   - Not needed for MVP, add if performance issues arise
