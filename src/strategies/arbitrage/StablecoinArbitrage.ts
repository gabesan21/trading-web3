import { Wallet } from 'ethers';
import { QuoteService } from '../../services/quote/QuoteService';
import { BalanceService } from '../../services/wallet/BalanceService';
import { SwapExecutor } from '../../types/executor';
import { Token, QuoteParams } from '../../types/quote';
import { ArbitrageConfig, ArbitrageOpportunity, ArbitrageResult } from '../../types/arbitrage';
import { calculateProfitBps, calculateMinAmountOut } from '../../utils/profit';
import { Logger } from '../../utils/logger';
import { formatAmount } from '../../utils/decimals';

/**
 * Stablecoin Arbitrage Strategy
 * Finds and executes profitable stablecoin swaps across multiple DEXs
 */
export class StablecoinArbitrage {
  constructor(
    private quoteService: QuoteService,
    private executors: Map<string, SwapExecutor>,
    private balanceService: BalanceService,
    private config: ArbitrageConfig
  ) {}

  /**
   * Find an arbitrage opportunity
   * @param inputToken Token to swap from
   * @param inputAmount Amount to swap
   * @param targetTokens Tokens to swap to
   * @returns First profitable opportunity found, or null
   */
  async findOpportunity(
    inputToken: Token,
    inputAmount: bigint,
    targetTokens: Token[]
  ): Promise<ArbitrageOpportunity | null> {
    Logger.info('Searching for arbitrage opportunities', {
      inputToken: inputToken.symbol,
      inputAmount: formatAmount(inputAmount, inputToken.decimals),
      targetCount: targetTokens.length,
    });

    // Get all quotes from all providers for all target tokens
    const quoteParams: QuoteParams = {
      tokenIn: inputToken,
      tokenOut: targetTokens[0], // Will be updated in loop
      amountIn: inputAmount,
      chainId: inputToken.chainId,
    };

    for (const targetToken of targetTokens) {
      if (targetToken.address === inputToken.address) {
        continue; // Skip same token
      }

      quoteParams.tokenOut = targetToken;

      try {
        const quotes = await this.quoteService.getQuotes(quoteParams);

        for (const quote of quotes) {
          const profitBps = calculateProfitBps(
            inputAmount,
            quote.amountOut,
            inputToken,
            targetToken
          );

          Logger.debug(`Quote from ${quote.provider}`, {
            pair: `${inputToken.symbol} → ${targetToken.symbol}`,
            amountOut: formatAmount(quote.amountOut, targetToken.decimals),
            profitBps,
          });

          if (profitBps >= this.config.minProfitBps) {
            const opportunity: ArbitrageOpportunity = {
              provider: quote.provider,
              inputToken,
              outputToken: targetToken,
              amountIn: inputAmount,
              expectedAmountOut: quote.amountOut,
              profitBps,
              quote,
              estimatedGas: quote.estimatedGas,
            };

            Logger.info('✅ Arbitrage opportunity found!', {
              provider: quote.provider,
              pair: `${inputToken.symbol} → ${targetToken.symbol}`,
              profitBps,
              expectedOutput: formatAmount(quote.amountOut, targetToken.decimals),
            });

            return opportunity; // Stop-on-first-match optimization
          }
        }
      } catch (error) {
        Logger.warn(`Failed to get quotes for ${targetToken.symbol}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    Logger.info('No profitable opportunities found');
    return null;
  }

  /**
   * Execute an arbitrage opportunity
   * @param opportunity Opportunity to execute
   * @param signer Wallet signer
   * @returns Execution result
   */
  async executeOpportunity(
    opportunity: ArbitrageOpportunity,
    signer: Wallet
  ): Promise<ArbitrageResult> {
    Logger.info('Executing arbitrage opportunity', {
      provider: opportunity.provider,
      pair: `${opportunity.inputToken.symbol} → ${opportunity.outputToken.symbol}`,
      profitBps: opportunity.profitBps,
    });

    const executor = this.executors.get(opportunity.provider);
    if (!executor) {
      return {
        attempted: false,
        success: false,
        reason: `No executor found for provider: ${opportunity.provider}`,
      };
    }

    try {
      // Calculate minimum amount out with slippage protection
      const minAmountOut = calculateMinAmountOut(
        opportunity.expectedAmountOut,
        this.config.maxSlippageBps
      );

      // Calculate deadline
      const deadline = Math.floor(Date.now() / 1000) + this.config.deadlineSeconds;

      // Execute swap
      const result = await executor.execute({
        tokenIn: opportunity.inputToken,
        tokenOut: opportunity.outputToken,
        amountIn: opportunity.amountIn,
        minAmountOut,
        deadline,
        signer,
        chainId: opportunity.inputToken.chainId,
      });

      if (result.success) {
        Logger.info('✅ Arbitrage executed successfully!', {
          txHash: result.transactionHash,
          amountOut: result.amountOut ? formatAmount(result.amountOut, opportunity.outputToken.decimals) : 'N/A',
          gasUsed: result.gasUsed?.toString(),
        });
      } else {
        Logger.error('❌ Arbitrage execution failed', {
          error: result.error?.message,
        });
      }

      return {
        attempted: true,
        success: result.success,
        opportunity,
        transactionHash: result.transactionHash,
        actualAmountOut: result.amountOut,
        gasUsed: result.gasUsed,
        error: result.error?.message,
      };
    } catch (error) {
      Logger.error('Exception during arbitrage execution', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        attempted: true,
        success: false,
        opportunity,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Run complete arbitrage flow
   * @param walletAddress Wallet address to check balances
   * @param signer Wallet signer for executing trades
   * @param stablecoins List of stablecoins to consider
   * @returns Arbitrage result
   */
  async run(
    walletAddress: string,
    signer: Wallet,
    stablecoins: Token[]
  ): Promise<ArbitrageResult> {
    Logger.info('Starting arbitrage run', {
      wallet: walletAddress,
      stablecoinCount: stablecoins.length,
    });

    // Get highest stablecoin balance
    const balanceResult = await this.balanceService.getHighestStablecoinBalance(
      walletAddress,
      stablecoins,
      this.config.minBalanceThreshold
    );

    if (!balanceResult) {
      return {
        attempted: false,
        success: false,
        reason: 'No stablecoin balance found above threshold',
      };
    }

    const { token: inputToken, balance: inputAmount } = balanceResult;

    // Find opportunity
    const targetTokens = stablecoins.filter(t => t.address !== inputToken.address);
    const opportunity = await this.findOpportunity(inputToken, inputAmount, targetTokens);

    if (!opportunity) {
      return {
        attempted: false,
        success: false,
        reason: 'No profitable opportunity found',
      };
    }

    // If dry-run mode, return without executing
    if (this.config.dryRun) {
      Logger.info('💡 DRY-RUN: Opportunity found but not executed', {
        provider: opportunity.provider,
        pair: `${opportunity.inputToken.symbol} → ${opportunity.outputToken.symbol}`,
        profitBps: opportunity.profitBps,
        amountIn: opportunity.amountIn.toString(),
        expectedAmountOut: opportunity.expectedAmountOut.toString(),
        estimatedGas: opportunity.estimatedGas?.toString(),
        netProfitAmount: opportunity.netProfitAmount?.toString(),
      });
      
      return {
        attempted: false,
        success: true,
        opportunity,
        reason: 'Dry-run mode: opportunity identified but not executed',
      };
    }

    // Execute opportunity
    return await this.executeOpportunity(opportunity, signer);
  }
}
