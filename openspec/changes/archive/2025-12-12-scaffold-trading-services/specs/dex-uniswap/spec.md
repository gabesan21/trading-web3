## ADDED Requirements

### Requirement: Uniswap Quote Fetching
The adapter SHALL fetch quotes from Uniswap V3 Quoter contract.

#### Scenario: Get V3 Quote
- **WHEN** querying the Uniswap V3 Quoter with token A, token B, and amount
- **THEN** it returns the expected output amount of token B
- **AND** it handles standard fee tiers (e.g., 3000)

### Requirement: Uniswap V4 Support
The adapter SHALL support Uniswap V4 quoting.

#### Scenario: Get V4 Quote
- **WHEN** querying the Uniswap V4 Quoter
- **THEN** it returns the expected output amount
