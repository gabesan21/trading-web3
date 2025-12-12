# Proposal: Execute Trade Script

## Change ID
`execute-trade-script`

## Status
Draft

## Overview
Create a command-line trade execution script that accepts trade parameters as arguments, fetches a quote, prompts the user for confirmation, and executes the trade on a specified DEX provider for a given network.

## Problem Statement
Currently, the codebase has quote checking functionality (`check-rates.ts`) but lacks a direct way to execute trades from the command line. Users need:
1. A simple CLI interface to execute trades without writing custom scripts
2. Ability to specify tokens, amounts, networks, and providers via command-line arguments
3. Safety mechanism to review quotes before executing trades
4. Optional flag to skip confirmation for automated workflows

## Proposed Solution
Implement a new script `src/scripts/execute-trade.ts` that:
- Accepts CLI arguments: `<tokenIn> <amount> <tokenOut> <network> <provider>`
- Resolves token addresses from the stablecoin configuration
- Maps provider names to appropriate executor instances
- Fetches a quote from the specified provider
- Displays the quote details and prompts for user confirmation
- Executes the trade upon confirmation
- Supports a `--force` flag to skip confirmation prompts

### Example Usage
```bash
# With confirmation prompt
npm run trade USDT 1000 DAI polygon "Uniswap V3"

# Skip confirmation (automated mode)
npm run trade USDT 1000 DAI polygon "Uniswap V3" -- --force
```

## User Impact
**Who benefits:**
- Developers testing trade execution flows
- Users who want to execute one-off trades via CLI
- Automated trading scripts that need confirmation bypass

**Benefits:**
- Faster iteration on trade execution testing
- Safety-first design with confirmation prompts
- Flexibility for both manual and automated use cases

## Technical Approach
The solution involves three main capabilities:

1. **CLI Trade Executor** (`cli-trade-executor`): Main script orchestration
   - Argument parsing and validation
   - Workflow coordination (quote → confirm → execute)
   - Error handling and user feedback

2. **Quote Confirmation** (`quote-confirmation`): User interaction for safety
   - Display quote details in human-readable format
   - Prompt for yes/no confirmation
   - Handle force flag to skip prompts

3. **Provider Resolution** (`provider-resolution`): Map provider names to executors
   - Load providers from `config/providers.json`
   - Instantiate correct executor based on provider name
   - Handle provider name matching (case-insensitive, flexible)

## Dependencies
- Existing executor implementations (UniswapV3Executor, OneInchExecutor, CowSwapExecutor)
- Existing quote providers
- Stablecoin and provider configuration files
- Wallet configuration from environment variables

## Risks and Mitigations
| Risk | Mitigation |
|------|------------|
| User executes trades with incorrect parameters | Implement comprehensive validation and clear error messages |
| Wallet private key not configured | Check for PRIVATE_KEY env var early, fail fast with clear instructions |
| Provider name doesn't match config | Use flexible matching (normalize case, handle variations like "Uniswap V3" vs "UniswapV3") |
| Trade fails after confirmation | Display clear error messages with transaction hash if available |
| Force flag used inappropriately | Document force flag risks clearly in help text |

## Alternatives Considered
1. **Interactive prompts for all parameters**: More user-friendly but harder to script
2. **Config file approach**: More flexible but adds complexity for simple trades
3. **REST API endpoint**: Over-engineered for CLI use case

## Open Questions
1. Should we support multiple providers in a single command to compare quotes?
2. Do we need slippage configuration via CLI or use defaults from env?
3. Should we add a dry-run mode that shows what would happen without executing?
4. Should we support raw token addresses in addition to symbols?

## Success Criteria
- [ ] Script accepts all required CLI arguments
- [ ] Token symbols are correctly resolved from configuration
- [ ] Provider names map to correct executor instances
- [ ] Quote is fetched and displayed clearly
- [ ] User confirmation works as expected
- [ ] `--force` flag skips confirmation
- [ ] Trade executes successfully with valid parameters
- [ ] Clear error messages for all failure scenarios
- [ ] Help text documents all options and usage patterns

## Related Changes
- May influence future work on batch trading scripts
- Could be extended to support multi-step arbitrage execution
- Foundation for automated trading strategies

## Timeline
Estimated effort: 1-2 days
- Day 1: CLI parsing, provider resolution, quote confirmation
- Day 2: Trade execution integration, testing, documentation
