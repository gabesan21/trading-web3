# cli-trade-executor Specification

## Purpose
TBD - created by archiving change execute-trade-script. Update Purpose after archive.
## Requirements
### Requirement: Script accepts command-line trade parameters
The script SHALL parse command-line arguments to accept trade execution parameters including token symbols, amount, network, and provider name.

#### Scenario: User provides all required arguments
```
GIVEN the user runs: npm run trade USDT 1000 DAI polygon "Uniswap V3"
WHEN the script parses arguments
THEN it extracts:
  - tokenInSymbol = "USDT"
  - amount = "1000"
  - tokenOutSymbol = "DAI"
  - network = "polygon"
  - provider = "Uniswap V3"
```

#### Scenario: User omits required arguments
```
GIVEN the user runs: npm run trade USDT 1000
WHEN the script parses arguments
THEN it displays usage help
AND exits with error code 1
AND shows which arguments are missing
```

#### Scenario: User requests help
```
GIVEN the user runs: npm run trade --help
WHEN the script processes the help flag
THEN it displays complete usage documentation
AND lists all required arguments
AND shows example commands
AND exits with code 0
```

---

### Requirement: Script resolves token metadata from configuration
The script SHALL look up token addresses and decimals from the stablecoin configuration based on network and symbol.

#### Scenario: Token exists in configuration
```
GIVEN the network is "polygon"
AND the stablecoin configuration contains USDT for polygon
WHEN the script resolves token "USDT"
THEN it returns a Token object with:
  - symbol = "USDT"
  - address = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
  - decimals = 6
  - chainId = 137
```

#### Scenario: Token does not exist in configuration
```
GIVEN the network is "polygon"
AND the stablecoin configuration does not contain WETH
WHEN the script attempts to resolve token "WETH"
THEN it throws an error
AND displays available tokens for the network
AND exits with error code 1
```

#### Scenario: Network is not configured
```
GIVEN the network is "ethereum"
AND the stablecoin configuration does not contain ethereum
WHEN the script attempts to load tokens
THEN it throws an error
AND lists available networks
AND exits with error code 1
```

---

### Requirement: Script validates wallet configuration
The script SHALL verify wallet private key is configured before attempting trade execution.

#### Scenario: Private key is configured
```
GIVEN PRIVATE_KEY is set in environment
WHEN the script initializes wallet
THEN it successfully creates a signer instance
AND continues execution
```

#### Scenario: Private key is missing
```
GIVEN PRIVATE_KEY is not set in environment
WHEN the script attempts to initialize wallet
THEN it displays error: "PRIVATE_KEY not configured"
AND shows instructions to add it to .env file
AND exits with error code 1
```

#### Scenario: Private key is invalid format
```
GIVEN PRIVATE_KEY is set to invalid value
WHEN the script attempts to create wallet
THEN it catches the error
AND displays: "Invalid PRIVATE_KEY format"
AND exits with error code 1
```

---

### Requirement: Script converts human-readable amounts to blockchain units
The script SHALL convert the amount argument to the appropriate number of smallest token units based on token decimals.

#### Scenario: Converting 6-decimal token amount
```
GIVEN tokenIn is USDT with decimals = 6
AND amount argument is "1000"
WHEN the script converts the amount
THEN amountIn = 1000000000n (1000 * 10^6)
```

#### Scenario: Converting 18-decimal token amount
```
GIVEN tokenIn is DAI with decimals = 18
AND amount argument is "1.5"
WHEN the script converts the amount
THEN amountIn = 1500000000000000000n (1.5 * 10^18)
```

#### Scenario: Invalid amount format
```
GIVEN amount argument is "abc"
WHEN the script attempts to convert the amount
THEN it throws an error
AND displays: "Invalid amount: must be a positive number"
AND exits with error code 1
```

#### Scenario: Negative amount
```
GIVEN amount argument is "-100"
WHEN the script validates the amount
THEN it throws an error
AND displays: "Amount must be positive"
AND exits with error code 1
```

---

### Requirement: Script orchestrates complete trade workflow
The script SHALL coordinate the sequence of operations: validation → provider resolution → quote → confirmation → execution.

#### Scenario: Successful trade execution flow
```
GIVEN all arguments are valid
AND wallet is configured
WHEN the script runs
THEN it:
  1. Validates and parses arguments
  2. Resolves token metadata
  3. Initializes provider executor
  4. Fetches quote
  5. Displays quote to user
  6. Prompts for confirmation
  7. Executes trade upon confirmation
  8. Displays success result
AND exits with code 0
```

#### Scenario: User cancels at confirmation
```
GIVEN quote is successfully fetched
AND user is prompted for confirmation
WHEN user responds "n"
THEN script displays "Trade cancelled"
AND exits with code 0 without executing trade
```

---

### Requirement: Script displays execution results
The script SHALL show clear, formatted output for successful trade execution including transaction hash and amounts.

#### Scenario: Trade succeeds
```
GIVEN trade executes successfully
AND returns SwapResult with:
  - success = true
  - transactionHash = "0x123..."
  - amountOut = 999820000000000000000n
  - gasUsed = 148234n
WHEN the script displays results
THEN output includes:
  - "✓ Trade executed successfully!"
  - "Transaction: 0x123..."
  - "Amount Received: 999.82 DAI"
  - "Gas Used: 148,234"
  - Block explorer link with transaction hash
```

#### Scenario: Trade fails
```
GIVEN trade execution fails
AND returns SwapResult with:
  - success = false
  - error = Error("Insufficient balance")
WHEN the script displays results
THEN output includes:
  - "❌ Trade failed"
  - Error message
  - Helpful troubleshooting suggestions
AND exits with error code 1
```

---

### Requirement: Script handles errors gracefully
The script SHALL catch and display user-friendly error messages for all failure scenarios.

#### Scenario: Network error during quote
```
GIVEN quote provider is called
WHEN network request fails with timeout
THEN script catches error
AND displays: "Failed to fetch quote: Network timeout"
AND suggests: "Check your internet connection and RPC_URL"
AND exits with error code 1
```

#### Scenario: Insufficient token balance
```
GIVEN wallet has 500 USDT
AND user attempts to trade 1000 USDT
WHEN balance check occurs
THEN script displays: "Insufficient balance"
AND shows: "Available: 500 USDT, Required: 1000 USDT"
AND exits with error code 1
```

---

### Requirement: Script supports NPM script execution
The script SHALL be invokable via npm run command defined in package.json.

#### Scenario: Execute via npm run
```
GIVEN package.json contains script: "trade": "ts-node src/scripts/execute-trade.ts"
WHEN user runs: npm run trade -- USDT 1000 DAI polygon "Uniswap V3"
THEN the script receives all arguments correctly
AND executes the trade workflow
```

#### Scenario: Pass options via npm
```
GIVEN user wants to use --force flag
WHEN user runs: npm run trade -- USDT 1000 DAI polygon "Uniswap V3" --force
THEN the --force flag is correctly passed to script
AND confirmation is skipped
```

