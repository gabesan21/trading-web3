import { Wallet } from 'ethers';
import { SwapExecutor, SwapParams, SwapResult } from '../../../types/executor';
import { Token } from '../../../types/quote';
import { Logger } from '../../../utils/logger';

/**
 * Uniswap V4 Swap Executor (Stub - V4 not deployed yet)
 */
export class UniswapV4Executor implements SwapExecutor {
  public readonly name = 'Uniswap V4';

  async approveToken(token: Token, amount: bigint, signer: Wallet): Promise<void> {
    Logger.warn('Uniswap V4 not yet deployed');
    throw new Error('Uniswap V4 is not yet deployed on this network');
  }

  async estimateGas(params: SwapParams): Promise<bigint> {
    throw new Error('Uniswap V4 is not yet deployed on this network');
  }

  async execute(params: SwapParams): Promise<SwapResult> {
    Logger.error('Uniswap V4 not yet deployed');
    return {
      success: false,
      error: new Error('Uniswap V4 is not yet deployed on this network'),
      provider: this.name,
    };
  }
}
