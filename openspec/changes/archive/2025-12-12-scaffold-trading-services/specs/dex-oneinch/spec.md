## ADDED Requirements

### Requirement: 1Inch Quote Fetching
The adapter SHALL fetch quotes using the 1Inch Aggregation Protocol API (v5.0 or latest).

#### Scenario: Get 1Inch Quote
- **WHEN** querying the 1Inch API `/quote` endpoint
- **THEN** it returns the `toAmount` (output quantity)
- **AND** it includes estimated gas
