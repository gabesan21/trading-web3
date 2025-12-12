## ADDED Requirements

### Requirement: Unified Quote Interface
The system SHALL provide a unified interface to request token swap quotes from multiple providers.

#### Scenario: Fetch quote successfully
- **WHEN** a quote is requested for a valid token pair and amount
- **THEN** the service returns the estimated output amount from the provider
- **AND** the response includes the provider name

#### Scenario: Aggregated quotes
- **WHEN** a quote is requested from the Aggregator Service
- **THEN** it queries all registered providers in parallel
- **AND** returns a list of quotes sorted by best output amount
