# Spec: Trading Executor

## ADDED Requirements

### Requirement: Execute token swaps on Uniswap V3
The system MUST support executing token swaps on Uniswap V3 with slippage protection and deadline enforcement.

#### Scenario: Execute successful swap on Uniswap V3
**Given** a wallet with sufficient USDT balance  
**And** USDT approval has been granted to the Uniswap V3 Router  
**And** swap parameters specify USDT → DAI with 1000 USDT input  
**When** the executor performs the swap  
**Then** the transaction is submitted to the blockchain  
**And** the result includes the transaction hash  
**And** the result includes the actual amountOut received  
**And** the result includes the gas used  
**And** the success flag is true

#### Scenario: Handle insufficient balance during swap
**Given** a wallet with 100 USDT balance  
**And** swap parameters specify 1000 USDT input  
**When** the executor attempts to perform the swap  
**Then** the transaction simulation fails  
**And** an error is returned indicating insufficient balance  
**And** no transaction is submitted to the blockchain

#### Scenario: Respect slippage protection
**Given** swap parameters with minAmountOut of 1000 DAI  
**And** the current pool state would return only 995 DAI  
**When** the executor performs the swap  
**Then** the transaction reverts with a slippage error  
**And** no tokens are exchanged  
**And** only gas fees are consumed

#### Scenario: Enforce transaction deadline
**Given** swap parameters with a deadline of 5 minutes from now  
**When** the transaction is submitted after the deadline has passed  
**Then** the transaction reverts with a deadline exceeded error  
**And** no tokens are exchanged

### Requirement: Approve token spending for DEX contracts
The system MUST manage ERC20 token approvals for DEX router contracts.

#### Scenario: Check existing approval before requesting
**Given** a token that has an existing approval of 1000 USDT for the router  
**When** the executor needs to swap 500 USDT  
**Then** it checks the current allowance  
**And** it skips the approval step since allowance is sufficient  
**And** proceeds directly to the swap

#### Scenario: Request approval when needed
**Given** a token with zero approval for the router  
**When** the executor needs to swap 1000 USDT  
**Then** it requests approval for the swap amount  
**And** waits for the approval transaction to be mined  
**And** proceeds to the swap after approval is confirmed

#### Scenario: Handle approval failures
**Given** a token approval transaction that fails  
**When** the executor attempts to swap  
**Then** it detects the approval failure  
**And** returns an error indicating approval failed  
**And** does not attempt the swap transaction

### Requirement: Execute token swaps on 1Inch
The system MUST support executing token swaps using the 1Inch aggregator API with proper transaction construction.

#### Scenario: Execute successful swap on 1Inch
**Given** a wallet with sufficient USDC balance  
**And** USDC approval has been granted to the 1Inch router  
**And** swap parameters specify USDC → USDT  
**When** the executor requests swap transaction data from 1Inch API  
**Then** it receives transaction data including to, data, value, and gas  
**And** it signs and submits the transaction  
**And** returns the transaction hash and result

#### Scenario: Handle 1Inch API rate limits
**Given** the 1Inch API is rate limiting requests  
**When** the executor attempts to get swap transaction data  
**Then** it receives a 429 Too Many Requests response  
**And** it retries with exponential backoff  
**And** returns an error if all retries are exhausted

#### Scenario: Validate 1Inch transaction before signing
**Given** swap transaction data received from 1Inch API  
**When** the executor validates the transaction  
**Then** it verifies the tokenIn and tokenOut match the request  
**And** it verifies the amountIn matches the request  
**And** it verifies the to address is a known 1Inch router  
**And** it rejects the transaction if any validation fails

### Requirement: Execute token swaps on CowSwap
The system MUST support submitting orders to the CowSwap protocol for off-chain execution.

#### Scenario: Submit order to CowSwap
**Given** a wallet with sufficient DAI balance  
**And** DAI approval has been granted to the CowSwap VaultRelayer  
**And** swap parameters specify DAI → USDC  
**When** the executor creates and submits an order  
**Then** the order is submitted to the CowSwap API  
**And** an order UID is returned  
**And** the executor monitors order status until filled or expired

#### Scenario: Monitor CowSwap order execution
**Given** an order submitted to CowSwap  
**When** the order is included in a settlement  
**Then** the executor detects the settlement transaction  
**And** returns the actual amountOut from the settlement  
**And** marks the swap as successful

#### Scenario: Handle CowSwap order expiration
**Given** an order submitted to CowSwap  
**When** the order expires without being filled  
**Then** the executor detects the expiration  
**And** returns an error indicating the order was not filled  
**And** no tokens were exchanged

### Requirement: Estimate gas costs for swaps
The system MUST provide accurate gas cost estimates before executing swaps.

#### Scenario: Estimate gas for Uniswap V3 swap
**Given** swap parameters for a Uniswap V3 swap  
**When** the executor estimates gas  
**Then** it simulates the transaction using eth_estimateGas  
**And** it adds a 20% buffer for gas price fluctuations  
**And** returns the estimated gas units and cost in native token

#### Scenario: Factor gas costs into profitability check
**Given** an arbitrage opportunity with 0.4% profit  
**And** estimated gas costs of 0.2% of the trade value  
**When** the system calculates net profit  
**Then** it subtracts gas costs from gross profit  
**And** the net profit is 0.2%  
**And** the opportunity is still considered profitable (above 0.3% minimum)

#### Scenario: Reject unprofitable trades after gas estimation
**Given** an arbitrage opportunity with 0.35% gross profit  
**And** estimated gas costs of 0.1% of the trade value  
**When** the system calculates net profit  
**Then** the net profit is 0.25%  
**And** the opportunity is rejected (below 0.3% minimum)  
**And** no swap is executed

### Requirement: Support dry-run mode for testing
The system MUST allow simulation of swaps without actual execution.

#### Scenario: Execute swap in dry-run mode
**Given** the executor is configured with dry-run mode enabled  
**When** the executor is requested to perform a swap  
**Then** it simulates the transaction using eth_call  
**And** it logs the expected outcome  
**And** it returns a successful result with simulated values  
**And** no transaction is submitted to the blockchain

#### Scenario: Validate transaction construction in dry-run mode
**Given** the executor is in dry-run mode  
**When** a swap is requested  
**Then** it constructs the full transaction  
**And** it validates all parameters  
**And** it simulates the execution  
**And** it reports any errors that would occur in real execution
