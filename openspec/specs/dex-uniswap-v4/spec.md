# dex-uniswap-v4 Specification

## Purpose
TBD - created by archiving change implement-uniswap-v4. Update Purpose after archive.
## Requirements
### Requirement: V4 Quote Provider
The system SHALL provide quote functionality for Uniswap V4 pools using the V4 Quoter contract.

#### Scenario: Successful quote retrieval
- **WHEN** valid token pair and amount are provided
- **AND** V4 Quoter address is configured
- **AND** a pool exists for the token pair
- **THEN** return a Quote with amountOut and estimatedGas
- **AND** Quote provider name is "Uniswap V4"

#### Scenario: PoolKey construction with proper token ordering
- **WHEN** constructing a PoolKey for token pair
- **THEN** currency0 address SHALL be lexicographically less than currency1 address
- **AND** zeroForOne direction is calculated based on input token position
- **AND** fee is set to 3000 (0.3%)
- **AND** tickSpacing is set appropriately for fee tier
- **AND** hooks address is set to 0x0 (no hooks)

#### Scenario: Configuration not provided
- **WHEN** V4 Quoter address is not configured in environment
- **AND** getQuote() is called
- **THEN** throw QuoteError with type CONFIGURATION_ERROR
- **AND** error message indicates V4 is not configured

#### Scenario: Pool does not exist
- **WHEN** requesting quote for token pair with no V4 pool
- **THEN** throw QuoteError with type INSUFFICIENT_LIQUIDITY
- **AND** error message indicates no pool found for pair

#### Scenario: Network error handling
- **WHEN** RPC call to Quoter fails due to network issue
- **THEN** retry up to maxRetries times with exponential backoff
- **AND** if all retries fail, throw QuoteError with type NETWORK_ERROR

#### Scenario: Logging quote requests
- **WHEN** getQuote() is called
- **THEN** log debug message with tokenIn, tokenOut, and amountIn
- **AND** log info message with amountOut and duration on success
- **AND** log error message with details on failure

### Requirement: V4 Swap Executor
The system SHALL execute swaps on Uniswap V4 using the Universal Router with multi-action pattern.

#### Scenario: Successful swap execution
- **WHEN** valid swap parameters are provided
- **AND** V4 Universal Router address is configured
- **THEN** approve input token for Universal Router
- **AND** encode SWAP_EXACT_IN_SINGLE action with PoolKey and amounts
- **AND** encode SETTLE_ALL action to pay input token
- **AND** encode TAKE_ALL action to receive output token
- **AND** execute all actions via UniversalRouter.execute()
- **AND** wait for transaction confirmation
- **AND** return SwapResult with success=true and transaction hash

#### Scenario: Token approval before swap
- **WHEN** executing a swap
- **THEN** call approveToken() for input token
- **AND** approval amount equals amountIn
- **AND** spender is Universal Router address
- **AND** wait for approval transaction to confirm

#### Scenario: Slippage protection
- **WHEN** encoding swap action
- **THEN** minAmountOut is calculated from expected amountOut and slippage tolerance
- **AND** transaction reverts if actual output is less than minAmountOut

#### Scenario: Deadline enforcement
- **WHEN** executing swap
- **THEN** deadline is set to current timestamp plus configured seconds
- **AND** transaction reverts if not mined before deadline

#### Scenario: Gas estimation
- **WHEN** estimateGas() is called
- **THEN** simulate the full swap transaction
- **AND** return estimated gas units required
- **AND** throw error if estimation fails

#### Scenario: Swap execution failure
- **WHEN** swap transaction reverts or fails
- **THEN** return SwapResult with success=false
- **AND** include error details in result
- **AND** log error with transaction context

#### Scenario: Configuration not provided
- **WHEN** Universal Router address is not configured
- **AND** execute() is called
- **THEN** throw error indicating V4 is not configured

### Requirement: Optional V4 Integration
The system SHALL support optional V4 integration based on configuration availability.

#### Scenario: V4 enabled when configured
- **WHEN** UNISWAP_V4_QUOTER_ADDRESS is set in environment
- **AND** scripts initialize providers
- **THEN** UniswapV4QuoteProvider is created and added to provider list
- **AND** log message indicates V4 is enabled

#### Scenario: V4 disabled when not configured
- **WHEN** UNISWAP_V4_QUOTER_ADDRESS is not set in environment
- **AND** scripts initialize providers
- **THEN** UniswapV4QuoteProvider is not created
- **AND** system continues with other providers (V3, 1Inch, CowSwap)
- **AND** log warning indicates V4 is not configured

#### Scenario: Executor enabled when configured
- **WHEN** UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS is set in environment
- **AND** arbitrage script initializes executors
- **THEN** UniswapV4Executor is created and added to executor list

#### Scenario: Executor disabled when not configured
- **WHEN** UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS is not set
- **AND** arbitrage script initializes executors
- **THEN** UniswapV4Executor is not created
- **AND** system continues with other executors

### Requirement: V4 Configuration
The system SHALL support configuration of V4 contract addresses via environment variables.

#### Scenario: Loading V4 configuration
- **WHEN** environment variables are loaded
- **THEN** UNISWAP_V4_QUOTER_ADDRESS is read as optional string
- **AND** UNISWAP_V4_POOL_MANAGER_ADDRESS is read as optional string
- **AND** UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS is read as optional string
- **AND** missing values are set to undefined (not errors)

#### Scenario: Configuration validation
- **WHEN** V4 provider is initialized
- **AND** quoter address is undefined
- **THEN** log warning and skip V4 initialization
- **WHEN** quoter address is provided
- **AND** address is not a valid Ethereum address
- **THEN** throw configuration error

#### Scenario: Environment example documentation
- **WHEN** .env.example is updated
- **THEN** include UNISWAP_V4_QUOTER_ADDRESS with comment "Optional - Uniswap V4 Quoter contract"
- **AND** include UNISWAP_V4_POOL_MANAGER_ADDRESS with comment "Optional - Uniswap V4 PoolManager contract"
- **AND** include UNISWAP_V4_UNIVERSAL_ROUTER_ADDRESS with comment "Optional - Uniswap V4 Universal Router contract"
- **AND** include note that V4 is not yet deployed on all networks

### Requirement: V4 SDK Integration
The system SHALL use @uniswap/v4-sdk for PoolKey management and token handling.

#### Scenario: SDK dependency installation
- **WHEN** package dependencies are installed
- **THEN** @uniswap/v4-sdk is available in node_modules
- **AND** version is compatible with ethers v6

#### Scenario: PoolKey helper usage
- **WHEN** constructing PoolKey structures
- **THEN** use SDK utilities for token ordering
- **AND** use SDK constants for tick spacing based on fee tier
- **AND** leverage SDK types for type safety

### Requirement: Consistency with Existing DEX Integrations
The system SHALL maintain consistency with V3, 1Inch, and CowSwap integration patterns.

#### Scenario: QuoteProvider interface implementation
- **WHEN** UniswapV4QuoteProvider is defined
- **THEN** it implements QuoteProvider interface
- **AND** has readonly name property set to "Uniswap V4"
- **AND** has getQuote() method matching interface signature

#### Scenario: SwapExecutor interface implementation
- **WHEN** UniswapV4Executor is defined
- **THEN** it implements SwapExecutor interface
- **AND** has readonly name property set to "Uniswap V4"
- **AND** has execute(), approveToken(), and estimateGas() methods

#### Scenario: Error handling consistency
- **WHEN** errors occur in V4 integration
- **THEN** use QuoteError class with appropriate QuoteErrorType
- **AND** include provider name in error context
- **AND** follow same error categorization as other providers

#### Scenario: Logging consistency
- **WHEN** V4 operations are performed
- **THEN** use Logger utility with appropriate levels
- **AND** include provider name prefix in messages
- **AND** follow same logging pattern as V3 provider

#### Scenario: Retry logic consistency
- **WHEN** network errors occur
- **THEN** use existing retry utility with exponential backoff
- **AND** respect maxRetries configuration
- **AND** follow same retry behavior as other providers

