# Spec: Stablecoin Configuration

## ADDED Requirements

### Requirement: Load network-specific stablecoin definitions
The system MUST provide stablecoin token configurations organized by network, allowing the arbitrage strategy to identify which stablecoins are supported on each network.

#### Scenario: Load Polygon stablecoins
**Given** the file `config/stablecoins.json` exists  
**And** it contains a "polygon" key with an array of stablecoin definitions  
**When** the system loads stablecoin configuration for the "polygon" network  
**Then** it returns an array of Token objects containing USDT, USDT0, USDC, USDC.e, and DAI  
**And** each token includes symbol, address, and decimals properties

#### Scenario: Handle missing network configuration
**Given** the file `config/stablecoins.json` exists  
**When** the system loads stablecoin configuration for a network that is not defined  
**Then** it returns an empty array  
**And** logs a warning indicating the network is not configured

#### Scenario: Validate stablecoin definitions
**Given** a stablecoin configuration entry  
**When** the system validates the entry  
**Then** it verifies that symbol is a non-empty string  
**And** it verifies that address is a valid Ethereum address (0x-prefixed, 42 characters)  
**And** it verifies that decimals is a positive integer  
**And** it throws an error if any validation fails

### Requirement: Load network-specific DEX provider configurations
The system MUST provide DEX provider names organized by network, allowing the arbitrage strategy to initialize the correct providers for each network.

#### Scenario: Load Polygon providers
**Given** the file `config/providers.json` exists  
**And** it contains a "polygon" key with an array of provider names  
**When** the system loads provider configuration for the "polygon" network  
**Then** it returns an array containing "Uniswap V3", "Uniswap V4", "1Inch", and "CowSwap"

#### Scenario: Handle missing provider configuration
**Given** the file `config/providers.json` exists  
**When** the system loads provider configuration for a network that is not defined  
**Then** it returns an empty array  
**And** logs a warning indicating no providers are configured for the network

#### Scenario: Validate provider names match available implementations
**Given** a list of provider names from configuration  
**When** the system validates the providers  
**Then** it verifies each provider name corresponds to an available QuoteProvider implementation  
**And** logs a warning for any provider name that doesn't match an implementation  
**And** excludes invalid providers from the returned list

### Requirement: Support configuration file hot-reloading
The system SHALL allow configuration updates without restarting the application.

#### Scenario: Reload stablecoin configuration
**Given** the system has loaded initial stablecoin configuration  
**When** the `config/stablecoins.json` file is modified  
**And** the system receives a reload signal or on next access  
**Then** it reads the updated configuration  
**And** applies the new stablecoin list for subsequent arbitrage runs

#### Scenario: Handle invalid JSON during reload
**Given** the system has valid stablecoin configuration loaded  
**When** the `config/stablecoins.json` file is modified with invalid JSON  
**And** the system attempts to reload  
**Then** it logs an error with JSON parsing details  
**And** continues using the previously valid configuration  
**And** does not crash the application
