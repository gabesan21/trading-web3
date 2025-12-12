# Tasks: Execute Trade Script

## Overview
This document outlines the implementation tasks for the execute-trade-script change. Tasks are ordered to deliver incremental, testable progress while maintaining dependencies.

## Task List

### 1. Add network-to-chainId mapping utility
**Capability**: Provider Resolution  
**Dependencies**: None  
**Deliverable**: Utility function to convert network names to chain IDs

- [x] Create mapping constant for supported networks (polygon → 137, ethereum → 1)
- [x] Implement `getChainIdForNetwork(network: string): number` function
- [x] Add error handling for unknown networks with list of supported networks
- [ ] Write unit tests for valid and invalid network names

**Validation**: Unit tests pass; function returns correct chain IDs

---

### 2. Create provider name normalization utility
**Capability**: Provider Resolution  
**Dependencies**: None  
**Deliverable**: Function to handle provider name variations

- [x] Implement `normalizeProviderName(name: string): string` function
- [x] Handle case-insensitive matching (lowercase conversion)
- [x] Remove extra whitespace (trim, collapse multiple spaces)
- [x] Remove special characters (-, _, etc.) for comparison
- [ ] Write unit tests for various input formats

**Validation**: Unit tests demonstrate "Uniswap V3", "uniswap v3", "UniswapV3" all normalize identically

---

### 3. Implement provider-to-executor factory
**Capability**: Provider Resolution  
**Dependencies**: Tasks #1, #2  
**Deliverable**: Factory function that returns appropriate executor instance

- [x] Create `getExecutorForProvider(provider, network, config)` function
- [x] Implement switch/map for provider names to executor classes
- [x] Initialize UniswapV3Executor with network-specific config
- [x] Initialize OneInchExecutor with API key and endpoints
- [x] Initialize CowSwapExecutor with API endpoints
- [x] Add validation against providers.json for network
- [x] Throw descriptive errors for unknown providers
- [ ] Write integration tests with mocked executors

**Validation**: Function returns correct executor type for each provider; errors clearly for unknown providers

---

### 4. Implement quote provider factory
**Capability**: Provider Resolution  
**Dependencies**: Task #3  
**Deliverable**: Factory function that returns appropriate quote provider instance

- [x] Create `getQuoteProviderForProvider(provider, network, config)` function
- [x] Map provider names to quote provider classes
- [x] Initialize quote providers with same config as executors
- [ ] Write integration tests

**Validation**: Function returns correct quote provider; shares configuration with corresponding executor

---

### 5. Create quote display formatter
**Capability**: Quote Confirmation  
**Dependencies**: None  
**Deliverable**: Function to format quote information for terminal display

- [x] Implement `formatQuoteDisplay(quote, tokenIn, tokenOut, amountIn): string`
- [x] Format amounts with proper decimals and thousand separators
- [x] Calculate and display exchange rate
- [x] Include provider name, network, amounts, gas estimate
- [x] Add visual separators and alignment
- [x] Handle optional fields gracefully (gas, fees)
- [ ] Write unit tests for various quote formats

**Validation**: Output is readable and properly formatted; unit tests cover edge cases

---

### 6. Implement confirmation prompt utility
**Capability**: Quote Confirmation  
**Dependencies**: Task #5  
**Deliverable**: Function to prompt user and read stdin response

- [x] Create `confirmTrade(quote, tokenIn, tokenOut, amountIn, force): Promise<boolean>`
- [x] Display formatted quote using formatter from Task #5
- [x] Show prompt: "Execute this trade? (y/n): "
- [x] Read stdin input line
- [x] Parse response (case-insensitive y/n)
- [ ] Re-prompt on invalid input
- [x] Skip prompt entirely if force=true, return true immediately
- [x] Detect non-interactive mode (no TTY) and error if force=false
- [ ] Write unit tests with mocked stdin

**Validation**: Prompt accepts y/n correctly; force flag skips prompt; non-interactive mode detected

---

### 7. Create CLI argument parser
**Capability**: CLI Trade Executor  
**Dependencies**: None  
**Deliverable**: Function to parse and validate command-line arguments

- [ ] Implement `parseArguments(args: string[]): TradeRequest` function
- [ ] Extract positional arguments: tokenIn, amount, tokenOut, network, provider
- [ ] Parse optional flags: --force, --help
- [ ] Validate required arguments are present
- [ ] Implement help text display
- [ ] Return structured TradeRequest object
- [ ] Write unit tests for valid and invalid argument combinations

**Validation**: Parser extracts arguments correctly; displays help on --help; errors on missing args

---

### 8. Implement amount conversion utility
**Capability**: CLI Trade Executor  
**Dependencies**: None  
**Deliverable**: Function to convert human-readable amounts to bigint

- [ ] Create `parseAmount(amount: string, decimals: number): bigint` function
- [ ] Handle integer and decimal inputs
- [ ] Validate amount is positive number
- [ ] Convert to smallest unit using token decimals
- [ ] Handle edge cases (scientific notation, very small/large numbers)
- [ ] Write unit tests for various amount formats and decimal places

**Validation**: Correctly converts "1000" with 6 decimals to 1000000000n; errors on invalid input

---

### 9. Implement token resolution from config
**Capability**: CLI Trade Executor  
**Dependencies**: None (uses existing loadStablecoins)  
**Deliverable**: Function to resolve token symbols to Token objects

- [ ] Create `resolveToken(symbol, network, chainId): Token` function
- [ ] Use existing `loadStablecoins(network, chainId)` utility
- [ ] Find token by symbol (case-insensitive)
- [ ] Throw descriptive error if token not found, list available tokens
- [ ] Handle network not configured in stablecoins.json
- [ ] Write unit tests with mocked config

**Validation**: Returns correct Token object for valid symbol; lists available tokens on error

---

### 10. Implement wallet initialization with validation
**Capability**: CLI Trade Executor  
**Dependencies**: None  
**Deliverable**: Function to create and validate wallet signer

- [ ] Create `initializeWallet(rpcUrl): Wallet` function
- [ ] Check PRIVATE_KEY environment variable exists
- [ ] Create ethers Wallet instance
- [ ] Connect wallet to provider
- [ ] Catch and handle invalid private key format
- [ ] Display helpful error messages with setup instructions
- [ ] Write unit tests with mocked environment

**Validation**: Creates wallet successfully with valid key; errors clearly with missing/invalid key

---

### 11. Implement trade execution workflow
**Capability**: CLI Trade Executor  
**Dependencies**: Tasks #3, #4, #6, #8, #9, #10  
**Deliverable**: Main orchestration function for trade execution

- [ ] Create `executeTrade(request: TradeRequest): Promise<void>` function
- [ ] Resolve tokenIn and tokenOut from symbols
- [ ] Convert amount to bigint
- [ ] Initialize wallet signer
- [ ] Get quote provider and executor for specified provider
- [ ] Fetch quote
- [ ] Call confirmation prompt (respecting force flag)
- [ ] Exit if user declines
- [ ] Build SwapParams from quote
- [ ] Call executor.approveToken if needed
- [ ] Call executor.execute
- [ ] Return SwapResult
- [ ] Write integration tests with mocked dependencies

**Validation**: Full workflow executes successfully; proper sequencing; errors handled at each step

---

### 12. Implement result display formatter
**Capability**: CLI Trade Executor  
**Dependencies**: None  
**Deliverable**: Function to format and display execution results

- [ ] Create `displayResult(result: SwapResult, tokenOut: Token)` function
- [ ] Show success message with transaction hash
- [ ] Format received amount with proper decimals
- [ ] Display gas used
- [ ] Generate block explorer link based on network
- [ ] Show clear error messages on failure
- [ ] Add visual formatting (colors if supported, emojis for status)
- [ ] Write unit tests for success and failure cases

**Validation**: Output is clear and informative; includes all relevant transaction details

---

### 13. Create main script entry point
**Capability**: CLI Trade Executor  
**Dependencies**: Tasks #7, #11, #12  
**Deliverable**: Complete execute-trade.ts script

- [ ] Create `src/scripts/execute-trade.ts` file
- [ ] Implement main() function that:
  - Calls parseArguments
  - Calls executeTrade
  - Displays result
  - Handles top-level errors
- [ ] Add comprehensive error handling with try-catch
- [ ] Display usage help on errors
- [ ] Set appropriate exit codes (0 success, 1 error)
- [ ] Add file-level documentation comments

**Validation**: Script runs end-to-end; handles all error paths; exits with correct codes

---

### 14. Add NPM script command
**Capability**: CLI Trade Executor  
**Dependencies**: Task #13  
**Deliverable**: Package.json script definition

- [ ] Add to package.json scripts: `"trade": "ts-node src/scripts/execute-trade.ts"`
- [ ] Test execution via `npm run trade -- --help`
- [ ] Verify arguments pass through correctly with `--` separator
- [ ] Update package.json if needed

**Validation**: `npm run trade -- --help` displays help; arguments are passed correctly

---

### 15. Write integration tests for complete workflow
**Capability**: All  
**Dependencies**: Tasks #13, #14  
**Deliverable**: End-to-end integration tests

- [ ] Create test file for execute-trade script
- [ ] Test successful trade execution (mocked executors)
- [ ] Test user confirmation flow
- [ ] Test force flag bypassing confirmation
- [ ] Test error scenarios:
  - Invalid token symbol
  - Unknown provider
  - Missing wallet configuration
  - Quote fetch failure
  - Trade execution failure
- [ ] Verify correct exit codes
- [ ] Verify error messages are helpful

**Validation**: All integration tests pass; coverage includes happy path and error cases

---

### 16. Create user documentation
**Capability**: CLI Trade Executor  
**Dependencies**: Task #13  
**Deliverable**: README section or separate doc

- [ ] Document command syntax and all arguments
- [ ] Provide usage examples for common scenarios
- [ ] Document --force flag and its risks
- [ ] Explain required environment variables
- [ ] List supported networks and providers
- [ ] Include troubleshooting section
- [ ] Add examples of error messages and solutions

**Validation**: Documentation is clear and comprehensive; examples are accurate

---

### 17. Manual testing and validation
**Capability**: All  
**Dependencies**: All previous tasks  
**Deliverable**: Verified working script on test network

- [ ] Test with valid parameters on polygon testnet
- [ ] Verify quote display is clear and accurate
- [ ] Test confirmation prompt (accept and reject)
- [ ] Test --force flag
- [ ] Verify transaction on block explorer
- [ ] Test all error scenarios manually
- [ ] Test with each supported provider
- [ ] Verify gas estimation and actual gas usage

**Validation**: Script works correctly in all tested scenarios; user experience is smooth

---

## Parallelizable Work

The following task groups can be worked on in parallel:

**Group A (Provider Resolution)**: Tasks #1, #2, #3, #4  
**Group B (Quote Confirmation)**: Tasks #5, #6  
**Group C (CLI Parsing)**: Tasks #7, #8, #9, #10, #12

Groups A, B, and C are independent. Task #11 depends on all three groups. Tasks #13-17 are sequential and depend on everything before them.

## Risk Mitigation Checkpoints

- After Task #7: Verify argument parsing handles edge cases
- After Task #11: Integration test with mocked dependencies before real executors
- After Task #13: Dry run on testnet before documenting
- After Task #17: Final validation with small amounts on mainnet

## Success Metrics

- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] Script executes trades successfully on testnet
- [ ] Error messages are clear and actionable
- [ ] Help text is comprehensive
- [ ] Documentation is complete
- [ ] Manual testing checklist completed
