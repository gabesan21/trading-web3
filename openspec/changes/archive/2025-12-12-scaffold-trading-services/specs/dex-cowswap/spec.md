## ADDED Requirements

### Requirement: CowSwap Quote Fetching
The adapter SHALL fetch quotes using the CowSwap API or SDK.

#### Scenario: Get CowSwap Quote
- **WHEN** querying the CowSwap API for a SELL order
- **THEN** it returns the `buyAmount` (output quantity)
- **AND** it includes the fee amount
