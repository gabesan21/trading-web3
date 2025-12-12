import { JsonRpcProvider, Wallet } from 'ethers';
import { getConfig } from '../config/env';
import { loadStablecoins } from '../config/stablecoins';
import { QuoteService } from '../services/quote/QuoteService';
import { BalanceService } from '../services/wallet/BalanceService';
import { UniswapV3QuoteProvider } from '../dex/uniswap/v3/quote';
import { OneInchQuoteProvider } from '../dex/oneinch/quote';
import { CowSwapQuoteProvider } from '../dex/cowswap/quote';
import { UniswapV3Executor } from '../dex/uniswap/v3/executor';
import { OneInchExecutor } from '../dex/oneinch/executor';
import { CowSwapExecutor } from '../dex/cowswap/executor';
import { StablecoinArbitrage } from '../strategies/arbitrage/StablecoinArbitrage';
import { ArbitrageConfig } from '../types/arbitrage';
import { SwapExecutor } from '../types/executor';
import { Logger } from '../utils/logger';

/**
 * CLI options for the arbitrage script
 */
interface CliOptions {
  dryRun: boolean;
  configPath?: string;
  help: boolean;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--config':
      case '-c':
        if (i + 1 < args.length) {
          options.configPath = args[i + 1];
          i++; // Skip next arg
        } else {
          throw new Error('--config requires a path argument');
        }
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option: ${arg}`);
        }
    }
  }

  return options;
}

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
Stablecoin Arbitrage Bot

Usage: npm run arbitrage [options]

Options:
  -d, --dry-run       Simulate arbitrage without executing trades
  -c, --config PATH   Path to custom config directory (default: ./config)
  -h, --help          Show this help message

Examples:
  npm run arbitrage                    # Run arbitrage with real execution
  npm run arbitrage --dry-run          # Simulate without executing
  npm run arbitrage --config ./custom  # Use custom config path

Environment Variables:
  PRIVATE_KEY         Wallet private key (required)
  NETWORK             Network name (required, e.g., polygon)
  RPC_URL             RPC endpoint URL (required)
  MIN_PROFIT_BPS      Minimum profit in basis points (default: 30)
  MAX_SLIPPAGE_BPS    Maximum slippage in basis points (default: 50)
  CHECK_GAS_COST      Whether to check gas costs (default: true)
  `);
}

/**
 * Main arbitrage execution script
 */
async function main() {
  try {
    // Parse command-line arguments
    const cliOptions = parseArgs();
    
    // Show help if requested
    if (cliOptions.help) {
      showHelp();
      process.exit(0);
    }
    
    // Display mode
    if (cliOptions.dryRun) {
      Logger.info('🔍 Starting Stablecoin Arbitrage Bot (DRY-RUN MODE)');
      Logger.info('No trades will be executed - this is a simulation only');
    } else {
      Logger.info('🚀 Starting Stablecoin Arbitrage Bot');
    }

    // Load configuration
    const config = getConfig();

    // Validate wallet configuration
    if (!config.wallet) {
      throw new Error(
        'Wallet configuration missing. Please set PRIVATE_KEY and NETWORK in .env'
      );
    }

    const { privateKey, network } = config.wallet;

    // Validate arbitrage configuration
    if (!config.arbitrage) {
      throw new Error('Arbitrage configuration missing');
    }

    const arbitrageConfig: ArbitrageConfig = {
      minProfitBps: config.arbitrage.minProfitBps,
      maxSlippageBps: config.arbitrage.maxSlippageBps,
      deadlineSeconds: config.arbitrage.deadlineSeconds,
      checkGasCost: config.arbitrage.checkGasCost,
      minBalanceThreshold: 1000000n, // 1 USDC minimum (6 decimals)
      dryRun: cliOptions.dryRun,
    };

    Logger.info('Configuration loaded', {
      network,
      chainId: config.chainId,
      minProfitBps: arbitrageConfig.minProfitBps,
      maxSlippageBps: arbitrageConfig.maxSlippageBps,
    });

    // Initialize provider and wallet
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = new Wallet(privateKey, provider);
    const walletAddress = signer.address;

    Logger.info('Wallet initialized', {
      address: walletAddress,
    });

    // Load stablecoins configuration
    const stablecoins = loadStablecoins(network, config.chainId);

    // Initialize quote providers
    const uniswapV3Quoter = new UniswapV3QuoteProvider(
      config.rpcUrl,
      config.uniswap.v3QuoterAddress
    );
    const oneinchQuoter = new OneInchQuoteProvider(
      config.oneinch.apiBaseUrl,
      config.oneinch.apiKey
    );
    const cowswapQuoter = new CowSwapQuoteProvider(
      config.cowswap.apiBaseUrl,
      config.cowswap.appData
    );

    const quoteProviders = [uniswapV3Quoter, oneinchQuoter, cowswapQuoter];
    const quoteService = new QuoteService(quoteProviders);

    // Initialize swap executors
    const executors = new Map<string, SwapExecutor>();
    executors.set('Uniswap V3', new UniswapV3Executor());
    executors.set(
      '1Inch',
      new OneInchExecutor(config.oneinch.apiBaseUrl, config.oneinch.apiKey)
    );
    executors.set('CowSwap', new CowSwapExecutor(config.cowswap.apiBaseUrl));

    // Initialize balance service
    const balanceService = new BalanceService(provider);

    // Initialize arbitrage strategy
    const arbitrageStrategy = new StablecoinArbitrage(
      quoteService,
      executors,
      balanceService,
      arbitrageConfig
    );

    Logger.info('🔍 Searching for arbitrage opportunities...');

    // Run arbitrage
    const result = await arbitrageStrategy.run(
      walletAddress,
      signer,
      stablecoins
    );

    // Display results
    if (result.attempted) {
      if (result.success) {
        Logger.info('✅ Arbitrage executed successfully!', {
          provider: result.opportunity?.provider,
          pair: `${result.opportunity?.inputToken.symbol} → ${result.opportunity?.outputToken.symbol}`,
          profitBps: result.opportunity?.profitBps,
          txHash: result.transactionHash,
        });
      } else {
        Logger.error('❌ Arbitrage execution failed', {
          error: result.error,
        });
      }
    } else {
      // Check if it's a dry-run with opportunity found
      if (cliOptions.dryRun && result.opportunity) {
        Logger.info('💡 DRY-RUN: Opportunity found (not executed)', {
          provider: result.opportunity.provider,
          pair: `${result.opportunity.inputToken.symbol} → ${result.opportunity.outputToken.symbol}`,
          profitBps: `${result.opportunity.profitBps} bps (${(result.opportunity.profitBps / 100).toFixed(2)}%)`,
          amountIn: result.opportunity.amountIn.toString(),
          expectedAmountOut: result.opportunity.expectedAmountOut.toString(),
          estimatedGas: result.opportunity.estimatedGas?.toString() || 'N/A',
        });
      } else {
        Logger.info('ℹ️  No arbitrage executed', {
          reason: result.reason,
        });
      }
    }

    Logger.info('🏁 Arbitrage run completed');
  } catch (error) {
    Logger.error('Fatal error in arbitrage bot', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
