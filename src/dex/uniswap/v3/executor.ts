import { Contract, Wallet } from 'ethers';
import { SwapExecutor, SwapParams, SwapResult } from '../../../types/executor';
import { Token } from '../../../types/quote';
import { Logger } from '../../../utils/logger';
import { ERC20_ABI, UNISWAP_V3_ROUTER_ABI } from '../../../utils/abis';
import { FeeTier } from '../../../config/dex';

/**
 * Uniswap V3 Swap Executor
 */
export class UniswapV3Executor implements SwapExecutor {
  public readonly name = 'Uniswap V3';
  private readonly routerAddress: string;
  private readonly feeTiers: FeeTier[];
  private readonly defaultFeeTier: number;

  constructor(
    routerAddress: string,
    feeTiers: FeeTier[],
    defaultFeeTier: number = 3000
  ) {
    this.routerAddress = routerAddress;
    this.feeTiers = feeTiers;
    this.defaultFeeTier = defaultFeeTier;
  }

  /**
   * Approve token spending for Uniswap router
   */
  async approveToken(token: Token, amount: bigint, signer: Wallet): Promise<void> {
    try {
      const tokenContract = new Contract(token.address, ERC20_ABI, signer);
      
      // Check existing allowance
      const currentAllowance = await tokenContract.allowance(
        signer.address,
        this.routerAddress
      );
      
      if (currentAllowance >= amount) {
        Logger.debug(`${token.symbol} already approved`, {
          allowance: currentAllowance.toString(),
        });
        return;
      }
      
      Logger.info(`Approving ${token.symbol} for Uniswap V3`, {
        amount: amount.toString(),
      });
      
      const tx = await tokenContract.approve(this.routerAddress, amount);
      await tx.wait();
      
      Logger.info(`${token.symbol} approved successfully`);
    } catch (error) {
      Logger.error(`Failed to approve ${token.symbol}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Estimate gas for swap
   */
  async estimateGas(params: SwapParams): Promise<bigint> {
    try {
      const router = new Contract(
        this.routerAddress,
        UNISWAP_V3_ROUTER_ABI,
        params.signer
      );
      
      const swapParams = {
        tokenIn: params.tokenIn.address,
        tokenOut: params.tokenOut.address,
        fee: this.defaultFeeTier,
        recipient: params.signer.address,
        amountIn: params.amountIn,
        amountOutMinimum: params.minAmountOut,
        sqrtPriceLimitX96: 0, // No price limit
      };
      
      const gasEstimate = await router.exactInputSingle.estimateGas(swapParams);
      
      Logger.debug('Gas estimated for Uniswap V3 swap', {
        gas: gasEstimate.toString(),
      });
      
      return gasEstimate;
    } catch (error) {
      Logger.warn('Failed to estimate gas, using default', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 300000n; // Default fallback
    }
  }

  /**
   * Execute swap on Uniswap V3
   */
  async execute(params: SwapParams): Promise<SwapResult> {
    try {
      Logger.info('Executing Uniswap V3 swap', {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountIn: params.amountIn.toString(),
      });
      
      // Approve token
      await this.approveToken(params.tokenIn, params.amountIn, params.signer);
      
      const router = new Contract(
        this.routerAddress,
        UNISWAP_V3_ROUTER_ABI,
        params.signer
      );
      
      const swapParams = {
        tokenIn: params.tokenIn.address,
        tokenOut: params.tokenOut.address,
        fee: this.defaultFeeTier,
        recipient: params.signer.address,
        amountIn: params.amountIn,
        amountOutMinimum: params.minAmountOut,
        sqrtPriceLimitX96: 0,
      };
      
      const tx = await router.exactInputSingle(swapParams);
      const receipt = await tx.wait();
      
      // Parse logs to get actual amountOut (simplified - assumes last Transfer event)
      const amountOut = params.minAmountOut; // Simplified: use minimum as estimate
      
      Logger.info('Uniswap V3 swap successful', {
        hash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      });
      
      return {
        success: true,
        transactionHash: receipt.hash,
        amountOut,
        gasUsed: receipt.gasUsed,
        provider: this.name,
      };
    } catch (error) {
      Logger.error('Uniswap V3 swap failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        provider: this.name,
      };
    }
  }
}
