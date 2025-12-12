import { getConfig } from '../config/env';
import { Token } from '../types/quote';
import { UniswapV3QuoteProvider } from '../dex/uniswap/v3/quote';
import { OneInchQuoteProvider } from '../dex/oneinch/quote';
import { CowSwapQuoteProvider } from '../dex/cowswap/quote';
import { QuoteService } from '../services/quote/QuoteService';
import { ethers } from 'ethers';

/**
 * Demo script to check swap rates across multiple DEXs
 * 
 * This script demonstrates how to:
 * 1. Load configuration from environment variables
 * 2. Initialize quote providers
 * 3. Fetch and compare quotes from multiple DEXs
 * 
 * Usage: npx ts-node src/scripts/check-rates.ts
 */
async function main() {
  console.log('='.repeat(80));
  console.log('DEX RATE CHECKER');
  console.log('='.repeat(80));
  console.log();

  // Load configuration
  console.log('Loading configuration...');
  const config = getConfig();
  console.log(`✓ Chain ID: ${config.chainId}`);
  console.log(`✓ RPC URL: ${config.rpcUrl.substring(0, 40)}...`);
  console.log();

  // Define tokens for the swap
  // WETH -> USDC on Ethereum Mainnet
  const WETH: Token = {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    symbol: 'WETH',
    chainId: 1,
  };

  const USDC: Token = {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    symbol: 'USDC',
    chainId: 1,
  };

  // Amount to swap: 1 WETH
  const amountIn = ethers.parseEther('1');

  console.log(`Swap: ${ethers.formatEther(amountIn)} ${WETH.symbol} → ${USDC.symbol}`);
  console.log();

  // Initialize providers
  console.log('Initializing providers...');
  const providers = [
    new UniswapV3QuoteProvider(
      config.rpcUrl,
      config.uniswap.v3QuoterAddress,
      config.maxRetries
    ),
    new OneInchQuoteProvider(
      config.oneinch.apiBaseUrl,
      config.oneinch.apiKey,
      config.requestTimeout,
      config.maxRetries
    ),
    new CowSwapQuoteProvider(
      config.cowswap.apiBaseUrl,
      config.cowswap.appData,
      config.requestTimeout,
      config.maxRetries
    ),
  ];

  console.log(`✓ Initialized ${providers.length} providers`);
  console.log();

  // Create quote service
  const quoteService = new QuoteService(providers);

  // Fetch quotes
  console.log('Fetching quotes from all providers...');
  console.log('-'.repeat(80));
  console.log();

  try {
    const quotes = await quoteService.getQuotes({
      tokenIn: WETH,
      tokenOut: USDC,
      amountIn,
      chainId: config.chainId,
    });

    if (quotes.length === 0) {
      console.log('❌ All providers failed to return quotes.');
      console.log('   Check your RPC_URL and API configuration.');
      process.exit(1);
    }

    console.log(`✓ Received ${quotes.length} quote(s)`);
    console.log();
    console.log('RESULTS:');
    console.log('-'.repeat(80));
    console.log();

    quotes.forEach((quote, index) => {
      const amountOut = ethers.formatUnits(quote.amountOut, USDC.decimals);
      const rank = index === 0 ? '🥇 BEST' : `   #${index + 1}`;
      
      console.log(`${rank} ${quote.provider}`);
      console.log(`     Output: ${amountOut} ${USDC.symbol}`);
      
      if (quote.estimatedGas) {
        console.log(`     Estimated Gas: ${quote.estimatedGas.toString()}`);
      }
      
      if (quote.fee) {
        const feeAmount = ethers.formatUnits(quote.fee, USDC.decimals);
        console.log(`     Fee: ${feeAmount} ${USDC.symbol}`);
      }
      
      console.log();
    });

    // Calculate savings if using best rate
    if (quotes.length > 1) {
      const best = quotes[0];
      const worst = quotes[quotes.length - 1];
      const savings = best.amountOut - worst.amountOut;
      const savingsFormatted = ethers.formatUnits(savings, USDC.decimals);
      const savingsPercent = (Number(savings) * 100) / Number(worst.amountOut);

      console.log('COMPARISON:');
      console.log('-'.repeat(80));
      console.log(`Best rate (${best.provider}) vs Worst rate (${worst.provider}):`);
      console.log(`  Savings: ${savingsFormatted} ${USDC.symbol} (${savingsPercent.toFixed(2)}%)`);
      console.log();
    }

    console.log('='.repeat(80));
    console.log('✓ Rate check complete!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Error fetching quotes:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
