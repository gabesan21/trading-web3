# Spec: Quote Confirmation

## ADDED Requirements

### Requirement: Display quote details before execution
The system SHALL present quote information in a clear, formatted display showing all relevant trade details.

#### Scenario: Format quote for user review
```
GIVEN a quote with:
  - provider = "Uniswap V3"
  - amountOut = 999850000000000000000n (999.85 DAI)
  - estimatedGas = 150000n
AND tokenIn is USDT (1000.00)
AND tokenOut is DAI
WHEN formatting the quote display
THEN output includes:
  - Provider name
  - Network name
  - "You Send: 1,000.00 USDT"
  - "You Receive: ~999.85 DAI"
  - Exchange rate calculation
  - "Estimated Gas: 150,000 gas units"
  - Clear visual separators
```

#### Scenario: Display quote without optional fields
```
GIVEN a quote with only required fields:
  - provider = "CowSwap"
  - amountOut = 1000000000000000000000n
AND no estimatedGas or fee
WHEN formatting the quote display
THEN output includes required fields
AND omits optional sections gracefully
AND does not show "undefined" or null values
```

---

### Requirement: Prompt user for trade confirmation
The system SHALL request user input to confirm or reject trade execution after displaying the quote.

#### Scenario: User confirms trade
```
GIVEN quote is displayed
WHEN prompt shows: "Execute this trade? (y/n): "
AND user inputs "y" followed by Enter
THEN function returns true
AND trade proceeds to execution
```

#### Scenario: User rejects trade
```
GIVEN quote is displayed
WHEN prompt shows: "Execute this trade? (y/n): "
AND user inputs "n" followed by Enter
THEN function returns false
AND script displays "Trade cancelled"
AND exits without executing
```

#### Scenario: User inputs invalid response
```
GIVEN confirmation prompt is shown
WHEN user inputs "maybe" or other invalid text
THEN prompt displays: "Please enter 'y' for yes or 'n' for no"
AND re-prompts for input
AND waits for valid response (y or n)
```

#### Scenario: User inputs with different cases
```
GIVEN confirmation prompt is shown
WHEN user inputs "Y" or "N" (uppercase)
THEN input is accepted (case-insensitive)
AND treated same as lowercase
```

---

### Requirement: Support force flag to skip confirmation
The system SHALL bypass user confirmation prompt when force flag is provided.

#### Scenario: Force flag enabled
```
GIVEN --force flag is passed in CLI arguments
AND quote is successfully fetched
WHEN confirmation logic executes
THEN user prompt is skipped
AND function immediately returns true
AND trade proceeds without waiting for input
```

#### Scenario: Force flag not provided
```
GIVEN --force flag is NOT in CLI arguments
AND quote is successfully fetched
WHEN confirmation logic executes
THEN user is prompted for confirmation
AND waits for user input before proceeding
```

---

### Requirement: Calculate and display exchange rate
The system SHALL compute and show the effective exchange rate between input and output tokens.

#### Scenario: Calculate rate for standard quote
```
GIVEN amountIn = 1000 USDT (6 decimals)
AND amountOut = 999.85 DAI (18 decimals)
WHEN calculating exchange rate
THEN display: "1 USDT = 0.99985 DAI"
AND use appropriate precision (5 decimal places)
```

#### Scenario: Calculate inverse rate when more intuitive
```
GIVEN amountIn = 1 WETH
AND amountOut = 2500 USDC
WHEN calculating exchange rate
THEN display: "1 WETH = 2,500 USDC"
AND optionally: "1 USDC = 0.0004 WETH"
```

---

### Requirement: Format amounts with proper decimals
The system SHALL convert bigint amounts to human-readable decimal format based on token decimals.

#### Scenario: Format 6-decimal token (USDT)
```
GIVEN amount = 1000000000n
AND decimals = 6
WHEN formatting for display
THEN output = "1,000.00"
AND includes thousand separators
AND shows 2 decimal places
```

#### Scenario: Format 18-decimal token (DAI)
```
GIVEN amount = 999850000000000000000n
AND decimals = 18
WHEN formatting for display
THEN output = "999.85"
AND uses appropriate precision
AND avoids scientific notation
```

#### Scenario: Format very small amount
```
GIVEN amount = 1000000000000000n (0.001 of 18-decimal token)
AND decimals = 18
WHEN formatting for display
THEN output = "0.001"
AND shows significant digits
AND does not round to "0.00"
```

---

### Requirement: Display gas estimation in readable format
The system SHALL show estimated gas cost when available from quote.

#### Scenario: Quote includes gas estimate
```
GIVEN quote.estimatedGas = 150000n
WHEN displaying quote details
THEN show: "Estimated Gas: 150,000 gas units"
AND include comma separators for readability
```

#### Scenario: Quote does not include gas estimate
```
GIVEN quote.estimatedGas is undefined
WHEN displaying quote details
THEN gas section is omitted
AND does not show "Estimated Gas: undefined"
```

---

### Requirement: Provide clear visual formatting for quote display
The system SHALL use visual separators and alignment to make quote information easy to scan.

#### Scenario: Full quote display format
```
GIVEN complete quote information
WHEN rendering to terminal
THEN output uses:
  - Horizontal lines (=== or ---) as section dividers
  - Consistent label alignment
  - Appropriate spacing between sections
  - Clear heading: "TRADE QUOTE"
  - Indentation for hierarchical info
```

#### Scenario: Highlight important information
```
GIVEN quote display
WHEN showing amounts
THEN use visual emphasis for:
  - Amount to receive (the key output)
  - Exchange rate
AND optionally use color codes if terminal supports them
```

---

### Requirement: Handle stdin input for confirmation
The system SHALL read user input from stdin for confirmation prompt.

#### Scenario: Read from terminal stdin
```
GIVEN script is running interactively
WHEN confirmation prompt is shown
THEN script waits for stdin input
AND reads line until newline character
AND parses first character (y/n)
```

#### Scenario: Handle EOF on stdin
```
GIVEN confirmation prompt is waiting
WHEN stdin receives EOF (Ctrl+D)
THEN treat as rejection (same as "n")
AND exit gracefully
```

#### Scenario: Non-interactive mode without force flag
```
GIVEN script runs in non-interactive environment (no TTY)
AND --force flag is NOT provided
WHEN confirmation is requested
THEN detect non-interactive mode
AND display error: "Cannot prompt for confirmation in non-interactive mode"
AND suggest: "Use --force flag for automated execution"
AND exit with error code 1
```
