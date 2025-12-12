# provider-resolution Specification

## Purpose
TBD - created by archiving change execute-trade-script. Update Purpose after archive.
## Requirements
### Requirement: Map provider names to executor instances
The system SHALL accept a provider name string and return the appropriate SwapExecutor instance for the specified network.

#### Scenario: Resolve Uniswap V3 executor
```
GIVEN provider name is "Uniswap V3"
AND network is "polygon"
AND chainId is 137
WHEN resolving the executor
THEN return instance of UniswapV3Executor
AND executor is initialized with correct network parameters
```

#### Scenario: Resolve 1Inch executor
```
GIVEN provider name is "1Inch"
AND network is "polygon"
WHEN resolving the executor
THEN return instance of OneInchExecutor
AND executor is configured with polygon API endpoints
```

#### Scenario: Resolve CowSwap executor
```
GIVEN provider name is "CowSwap"
AND network is "polygon"
WHEN resolving the executor
THEN return instance of CowSwapExecutor
AND executor is configured for polygon network
```

---

### Requirement: Normalize provider name variations
The system SHALL handle different formatting variations of provider names (case, spacing, special characters).

#### Scenario: Case-insensitive matching
```
GIVEN provider name is "uniswap v3" (lowercase)
WHEN normalizing the name
THEN it matches "Uniswap V3" configuration
AND returns correct executor
```

#### Scenario: Handle spacing variations
```
GIVEN provider name is "UniswapV3" (no space)
OR "Uniswap  V3" (double space)
WHEN normalizing the name
THEN both match "Uniswap V3" configuration
AND return correct executor
```

#### Scenario: Handle special character variations
```
GIVEN provider name is "1-Inch" or "1 Inch" or "1inch"
WHEN normalizing the name
THEN all match "1Inch" configuration
AND return correct executor
```

---

### Requirement: Validate provider availability for network
The system SHALL verify that the requested provider is available on the specified network before attempting initialization.

#### Scenario: Provider available on network
```
GIVEN provider "Uniswap V3" is requested
AND network is "polygon"
AND config/providers.json lists "Uniswap V3" for polygon
WHEN validating provider availability
THEN validation passes
AND executor initialization proceeds
```

#### Scenario: Provider not available on network
```
GIVEN provider "Uniswap V4" is requested
AND network is "polygon"
AND config/providers.json does NOT list "Uniswap V4" for polygon
WHEN validating provider availability
THEN throw error: "Provider 'Uniswap V4' not available on polygon"
AND list available providers for polygon:
  - Uniswap V3
  - 1Inch
  - CowSwap
AND exit with error code 1
```

#### Scenario: Network not configured
```
GIVEN network is "ethereum"
AND config/providers.json does not contain "ethereum" key
WHEN attempting to validate provider
THEN throw error: "Network 'ethereum' not configured"
AND list available networks from config
AND exit with error code 1
```

---

### Requirement: Load provider configuration from JSON file
The system SHALL read available providers per network from config/providers.json.

#### Scenario: Load providers for polygon
```
GIVEN config/providers.json contains:
  {
    "polygon": ["Uniswap V3", "1Inch", "CowSwap"]
  }
WHEN loading providers for "polygon"
THEN return array: ["Uniswap V3", "1Inch", "CowSwap"]
```

#### Scenario: Configuration file missing
```
GIVEN config/providers.json does not exist
WHEN attempting to load providers
THEN throw error: "Provider configuration file not found"
AND show expected path: config/providers.json
AND exit with error code 1
```

#### Scenario: Invalid JSON format
```
GIVEN config/providers.json contains malformed JSON
WHEN attempting to parse file
THEN catch JSON parse error
AND throw: "Invalid provider configuration: [parse error details]"
AND exit with error code 1
```

---

### Requirement: Initialize executors with correct network parameters
The system SHALL configure each executor instance with appropriate network-specific settings (RPC URL, chain ID, contract addresses, API keys).

#### Scenario: Initialize UniswapV3Executor for polygon
```
GIVEN network is "polygon" (chainId 137)
AND environment has RPC_URL configured
WHEN creating UniswapV3Executor
THEN pass:
  - rpcUrl from environment
  - uniswap.v3QuoterAddress from config
  - chainId = 137
  - maxRetries from config
```

#### Scenario: Initialize OneInchExecutor for polygon
```
GIVEN network is "polygon"
AND ONEINCH_API_KEY is in environment
WHEN creating OneInchExecutor
THEN pass:
  - apiBaseUrl with polygon chain ID (137)
  - apiKey from environment
  - requestTimeout from config
  - maxRetries from config
```

#### Scenario: Initialize CowSwapExecutor for polygon
```
GIVEN network is "polygon"
WHEN creating CowSwapExecutor
THEN pass:
  - apiBaseUrl for polygon network
  - appData from config
  - requestTimeout from config
  - maxRetries from config
```

---

### Requirement: Provide clear error for unknown providers
The system SHALL display helpful error messages when a provider name doesn't match any known provider.

#### Scenario: Unknown provider name
```
GIVEN provider name is "PancakeSwap"
AND network is "polygon"
AND "PancakeSwap" is not in providers.json for polygon
WHEN attempting to resolve executor
THEN throw error: "Unknown provider: PancakeSwap"
AND display: "Available providers for polygon:"
AND list all configured providers:
  - Uniswap V3
  - 1Inch
  - CowSwap
AND suggest: "Check spelling or choose from the list above"
AND exit with error code 1
```

#### Scenario: Typo in provider name
```
GIVEN provider name is "Uniswap V4" (user meant V3)
AND network is "polygon"
WHEN validation fails
THEN suggest closest match: "Did you mean 'Uniswap V3'?"
AND list all available providers
```

---

### Requirement: Map network names to chain IDs
The system SHALL convert network name strings to numeric chain IDs required by executors.

#### Scenario: Map polygon to chain ID
```
GIVEN network name is "polygon"
WHEN resolving chain ID
THEN return 137
```

#### Scenario: Map ethereum to chain ID
```
GIVEN network name is "ethereum"
WHEN resolving chain ID
THEN return 1
```

#### Scenario: Unknown network name
```
GIVEN network name is "avalanche"
AND "avalanche" is not in network-to-chainId mapping
WHEN attempting to resolve chain ID
THEN throw error: "Unknown network: avalanche"
AND list supported networks
AND exit with error code 1
```

---

### Requirement: Support provider-specific quote providers
The system SHALL also instantiate the corresponding QuoteProvider for fetching quotes before execution.

#### Scenario: Get quote provider for Uniswap V3
```
GIVEN provider is "Uniswap V3"
WHEN getting quote provider
THEN return instance of UniswapV3QuoteProvider
AND quote provider shares configuration with executor
```

#### Scenario: Get quote provider for 1Inch
```
GIVEN provider is "1Inch"
WHEN getting quote provider
THEN return instance of OneInchQuoteProvider
AND configure with same API settings as executor
```

#### Scenario: Get quote provider for CowSwap
```
GIVEN provider is "CowSwap"
WHEN getting quote provider
THEN return instance of CowSwapQuoteProvider
AND configure with same API settings as executor
```

