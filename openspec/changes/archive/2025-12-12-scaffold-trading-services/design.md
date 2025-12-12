## Context
We need to compare exchange rates across different DEXs to find the best trading opportunities. Each DEX has a different API or smart contract interface for querying prices (quotes).

## Goals / Non-Goals
- **Goals**: 
    - a unified interface for "getting output amount for input amount".
    - support for Uniswap V3, 1Inch, and CowSwap.
    - easily extensible for future DEXs.
- **Non-Goals**:
    - Execution/Swapping (this will be a separate change/proposal).
    - Gas estimation normalization (we will capture what is returned, but not normalize yet).
    - Complex routing or splitting (just simple A -> B quotes for now).

## Decisions
- **Decision**: Use a common `QuoteProvider` interface.
    ```typescript
    interface QuoteProvider {
      name: string;
      getQuote(params: QuoteParams): Promise<Quote>;
    }
    
    interface QuoteParams {
      tokenIn: Token;
      tokenOut: Token;
      amountIn: bigint;
      chainId: number;
    }
    
    interface Token {
      address: string;
      decimals: number;
      symbol: string;
      chainId: number;
    }
    
    interface Quote {
      provider: string;
      amountOut: bigint;
      estimatedGas?: bigint;
      route?: string[];
      fee?: bigint;
      timestamp: number;
    }
    ```
- **Decision**: Use `ethers.js` for blockchain interaction (Uniswap) and `axios` for HTTP APIs (1Inch, CowSwap).
- **Decision**: Uniswap V4 will be implemented as a core provider alongside V3, 1Inch, and CowSwap.
- **Decision**: Default to Ethereum Mainnet (chainId: 1), but make chainId configurable in all providers.
- **Decision**: Use `dotenv` for environment configuration management.
- **Decision**: Implement graceful error handling - log and continue for individual provider failures in the aggregator.

## Configuration Strategy
The system will use a centralized configuration management approach:
- **Environment Variables**: All sensitive data (RPC URLs, API keys) stored in `.env` file
- **Config Module**: `src/config/env.ts` will load and validate all required configuration
- **Chain Support**: Initially Ethereum Mainnet, designed to be chain-agnostic for future expansion
- **Required Configuration**:
    ```typescript
    interface AppConfig {
      // Blockchain connection
      rpcUrl: string;              // Ethereum RPC endpoint (Infura, Alchemy, etc.)
      chainId: number;             // 1 for Ethereum Mainnet
      
      // DEX-specific configuration
      uniswap: {
        v3QuoterAddress: string;   // Uniswap V3 Quoter contract
        v4QuoterAddress?: string;  // Uniswap V4 Quoter contract (when available)
      };
      
      oneinch: {
        apiKey?: string;           // Optional for higher rate limits
        apiBaseUrl: string;        // 1Inch API endpoint
      };
      
      cowswap: {
        apiBaseUrl: string;        // CowSwap API endpoint
        appData?: string;          // Optional app identifier
      };
      
      // Operational settings
      requestTimeout: number;      // HTTP request timeout in ms
      maxRetries: number;          // Max retry attempts for failed requests
    }
    ```

## Error Handling Strategy
Robust error handling across all layers:

### Error Types
```typescript
enum QuoteErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // RPC/API unreachable
  INVALID_TOKEN = 'INVALID_TOKEN',           // Token address invalid
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  RATE_LIMIT = 'RATE_LIMIT',                 // API rate limit hit
  TIMEOUT = 'TIMEOUT',                       // Request timeout
  PROVIDER_ERROR = 'PROVIDER_ERROR',         // DEX-specific error
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR' // Missing/invalid config
}

class QuoteError extends Error {
  constructor(
    public type: QuoteErrorType,
    public provider: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
  }
}
```

### Handling Approach
- **Provider Level**: Catch and wrap errors with context (provider name, error type)
- **Service Level**: Log errors, continue with other providers (don't fail entire aggregation)
- **Application Level**: Present meaningful errors to user with actionable information

### Retry Strategy
- Network errors: Retry up to 3 times with exponential backoff
- Rate limits: Log warning, skip provider for this request
- Configuration errors: Fail fast at startup

## Testing Strategy
Comprehensive testing at multiple levels:

### Unit Tests
- Token validation logic
- Quote response parsing
- Error handling for each error type
- Configuration loading and validation

### Integration Tests
- **Mocked DEX Responses**: Test each adapter with mocked API/contract responses
- **Provider Interface Compliance**: Verify all providers implement QuoteProvider correctly
- **Error Scenarios**: Test handling of rate limits, timeouts, invalid tokens

### Manual Testing Checklist
- Verify quotes from each DEX with known token pairs (WETH/USDC)
- Test with different amounts (small, large)
- Validate gas estimation values
- Confirm error handling with invalid token addresses

### Test Data
- Use well-known token addresses on Ethereum Mainnet:
    - WETH: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
    - USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
    - DAI: `0x6B175474E89094C44Da98b954EedeAC495271d0F`

## Logging & Observability
Basic logging infrastructure:
- **Logger Utility**: Simple console logger with levels (DEBUG, INFO, WARN, ERROR)
- **Structured Logs**: Include timestamp, provider name, operation, duration
- **Key Events to Log**:
    - Quote requests (tokenIn, tokenOut, amountIn, provider)
    - Quote responses (amountOut, gas, duration)
    - Errors (type, provider, message)
    - Configuration loading

## Risks / Trade-offs
- **Risk**: Rate limits on public APIs (1Inch, CowSwap).
    - **Mitigation**: Implement basic rate limiting utility, log warnings, provide guidance on API keys.
- **Risk**: RPC provider failures or rate limits.
    - **Mitigation**: Document need for reliable RPC provider (Infura, Alchemy), implement retry logic.
- **Risk**: Uniswap V4 is still evolving.
    - **Mitigation**: Design interface to accommodate future changes, treat V4 as experimental initially.
- **Trade-off**: No complex routing optimization (direct swaps only).
    - **Rationale**: Keeps initial implementation simple, can add routing optimization later.

## Open Questions
- ~~Do we need an API key for 1Inch?~~ **Resolved**: Optional - better rates with key, but works without.
- ~~Which chain?~~ **Resolved**: Ethereum Mainnet (chainId: 1) as default, architecture supports other chains.
