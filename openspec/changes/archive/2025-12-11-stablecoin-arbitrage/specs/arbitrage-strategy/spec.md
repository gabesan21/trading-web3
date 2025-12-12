# Spec: Arbitrage Strategy

## ADDED Requirements

### Requirement: Detect wallet stablecoin balances
The system MUST identify which stablecoins the user holds and select the one with the highest balance as the input token.

#### Scenario: Select highest stablecoin balance
**Given** a wallet with the following balances:
  - 500 USDT
  - 2000 USDC
  - 100 DAI
  - 0 USDC.e  
**When** the system checks stablecoin balances  
**Then** it identifies USDC as the token with the highest balance  
**And** it returns USDC token details and balance of 2000  
**And** uses USDC as the input token for arbitrage

#### Scenario: Handle wallet with no stablecoin balance
**Given** a wallet with zero balance for all configured stablecoins  
**When** the system checks stablecoin balances  
**Then** it returns null or empty result  
**And** logs an informational message  
**And** exits the arbitrage process gracefully

#### Scenario: Handle wallet with dust balances only
**Given** a wallet with the following balances:
  - 0.01 USDT (below minimum trade threshold)
  - 0.001 USDC (below minimum trade threshold)  
**And** minimum trade threshold is 10 USD  
**When** the system checks stablecoin balances  
**Then** it filters out balances below the threshold  
**And** returns null or empty result  
**And** logs that no sufficient balance was found

### Requirement: Identify profitable arbitrage opportunities
The system MUST systematically check all stablecoin pairs across all providers to find opportunities with at least 0.3% profit.

#### Scenario: Find profitable opportunity on first provider
**Given** the input token is USDT with balance 1000  
**And** target stablecoins are [USDC, USDC.e, DAI]  
**And** providers are ["Uniswap V3", "1Inch", "CowSwap"]  
**And** Uniswap V3 quote for USDT → DAI returns 1004 DAI (0.4% profit)  
**When** the system searches for opportunities  
**Then** it queries Uniswap V3 for USDT → USDC quote  
**And** it queries Uniswap V3 for USDT → USDC.e quote  
**And** it queries Uniswap V3 for USDT → DAI quote  
**And** it identifies the DAI opportunity with 0.4% profit  
**And** it stops searching (doesn't query 1Inch or CowSwap)  
**And** returns the opportunity details

#### Scenario: Search across multiple providers before finding opportunity
**Given** the input token is USDC with balance 1000  
**And** Uniswap V3 quotes return max 0.1% profit (below threshold)  
**And** 1Inch quote for USDC → DAI returns 1003.5 DAI (0.35% profit)  
**When** the system searches for opportunities  
**Then** it queries all pairs on Uniswap V3 first  
**And** finds no profitable opportunities  
**And** moves to 1Inch provider  
**And** identifies the DAI opportunity with 0.35% profit  
**And** stops searching and returns the opportunity

#### Scenario: No profitable opportunity found
**Given** the input token is DAI with balance 1000  
**And** all quotes across all providers return less than 0.3% profit  
**When** the system searches for opportunities  
**Then** it queries all providers and all target stablecoins  
**And** finds no opportunities meeting the threshold  
**And** returns null  
**And** logs that no profitable opportunity was found

### Requirement: Calculate profit percentage accounting for decimal differences
The system MUST correctly calculate profit when tokens have different decimal places (e.g., 6 for USDT vs 18 for DAI).

#### Scenario: Calculate profit for 6-decimal to 18-decimal swap
**Given** input token is USDT (6 decimals) with amount 1000000000 (1000 USDT)  
**And** output quote is 1004000000000000000000 DAI (1004 DAI with 18 decimals)  
**When** the system calculates profit percentage  
**Then** it normalizes both amounts to the same decimal precision  
**And** it calculates profit as (1004 - 1000) / 1000 = 0.4%  
**And** it correctly identifies this as a profitable opportunity

#### Scenario: Calculate profit for same-decimal swap
**Given** input token is USDT (6 decimals) with amount 1000000000 (1000 USDT)  
**And** output quote is 1003000000 USDC (1003 USDC with 6 decimals)  
**When** the system calculates profit percentage  
**Then** it calculates profit as (1003 - 1000) / 1000 = 0.3%  
**And** it correctly identifies this as meeting the minimum threshold

#### Scenario: Handle rounding errors in profit calculation
**Given** an input amount and output amount that differ by tiny fractions  
**When** the system calculates profit percentage  
**Then** it uses sufficient precision to avoid rounding errors  
**And** it doesn't falsely identify unprofitable trades as profitable  
**And** it doesn't reject profitable trades due to precision loss

### Requirement: Execute arbitrage trades with safety mechanisms
The system MUST execute profitable opportunities while protecting against slippage, front-running, and excessive gas costs.

#### Scenario: Execute opportunity with slippage protection
**Given** an identified opportunity with expected output 1004 DAI  
**And** maximum slippage is configured as 0.5% (50 basis points)  
**When** the system executes the trade  
**Then** it calculates minAmountOut as 1004 * (1 - 0.005) = 999 DAI  
**And** it includes minAmountOut in the swap parameters  
**And** the trade reverts if actual output falls below 999 DAI

#### Scenario: Set transaction deadline to prevent stale execution
**Given** an identified opportunity  
**And** deadline configuration is 300 seconds (5 minutes)  
**When** the system executes the trade  
**Then** it sets the transaction deadline to current_time + 300 seconds  
**And** the transaction reverts if not mined before the deadline

#### Scenario: Execute successful arbitrage trade
**Given** an opportunity to swap 1000 USDT → 1003.5 DAI on 1Inch  
**And** the wallet has sufficient USDT balance  
**And** USDT is approved for the 1Inch router  
**When** the system executes the opportunity  
**Then** it submits the swap transaction  
**And** waits for transaction confirmation  
**And** verifies the received amount meets minAmountOut  
**And** logs the successful arbitrage with profit details  
**And** returns the transaction result

#### Scenario: Abort execution if approval fails
**Given** an identified opportunity  
**And** the token approval transaction fails  
**When** the system attempts to execute  
**Then** it detects the approval failure  
**And** it aborts the execution  
**And** it logs the failure reason  
**And** returns an error result without attempting the swap

### Requirement: Support configurable arbitrage parameters
The system MUST allow users to configure minimum profit threshold, slippage tolerance, and other strategy parameters.

#### Scenario: Apply custom minimum profit threshold
**Given** the user sets MIN_PROFIT_BPS to 50 (0.5%)  
**And** an opportunity exists with 0.4% profit  
**When** the system evaluates the opportunity  
**Then** it rejects the opportunity as below the threshold  
**And** continues searching for higher-profit opportunities

#### Scenario: Apply custom slippage tolerance
**Given** the user sets MAX_SLIPPAGE_BPS to 100 (1%)  
**And** an opportunity has expected output of 1000 DAI  
**When** the system executes the trade  
**Then** it calculates minAmountOut as 1000 * (1 - 0.01) = 990 DAI  
**And** accepts up to 1% slippage from the quoted amount

#### Scenario: Disable gas cost checking for testing
**Given** the user sets CHECK_GAS_COST to false  
**When** the system evaluates opportunities  
**Then** it does not estimate or subtract gas costs  
**And** it bases profitability solely on the price difference  
**And** proceeds with opportunities that meet the MIN_PROFIT_BPS threshold

### Requirement: Provide comprehensive logging and monitoring
The system MUST log all arbitrage attempts, successes, and failures with sufficient detail for analysis and debugging.

#### Scenario: Log opportunity discovery
**Given** a profitable opportunity is found  
**When** the system identifies the opportunity  
**Then** it logs the opportunity details including:
  - Provider name
  - Input token and amount
  - Output token and expected amount
  - Profit percentage
  - Timestamp

#### Scenario: Log execution results
**Given** a trade execution completes  
**When** the transaction is confirmed  
**Then** it logs the execution details including:
  - Transaction hash
  - Actual amount received
  - Gas used and cost
  - Net profit after gas
  - Execution duration
  - Success or failure status

#### Scenario: Log errors with context
**Given** an error occurs during arbitrage process  
**When** the error is caught  
**Then** it logs the error with full context including:
  - Error type and message
  - Stage where error occurred (balance check, quote, approval, execution)
  - Input parameters that caused the error
  - Stack trace for debugging
