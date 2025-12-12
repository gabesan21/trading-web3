import { Wallet } from 'ethers';
import { Token } from './quote';

/**
 * Parameters for executing a swap
 */
export interface SwapParams {
  /** Token to swap from */
  tokenIn: Token;
  
  /** Token to swap to */
  tokenOut: Token;
  
  /** Amount of tokenIn to swap (in smallest unit) */
  amountIn: bigint;
  
  /** Minimum amount of tokenOut to receive (for slippage protection) */
  minAmountOut: bigint;
  
  /** Transaction deadline timestamp (seconds since epoch) */
  deadline: number;
  
  /** Wallet signer for signing transactions */
  signer: Wallet;
  
  /** Chain ID for the swap */
  chainId: number;
}

/**
 * Result of a swap execution
 */
export interface SwapResult {
  /** Whether the swap was successful */
  success: boolean;
  
  /** Transaction hash */
  transactionHash?: string;
  
  /** Actual amount received */
  amountOut?: bigint;
  
  /** Gas used for the transaction */
  gasUsed?: bigint;
  
  /** Error if swap failed */
  error?: Error;
  
  /** Provider name */
  provider: string;
}

/**
 * Common interface for swap executors
 */
export interface SwapExecutor {
  /** Name of the executor/provider */
  name: string;
  
  /**
   * Execute a swap
   * @param params Swap parameters
   * @returns Promise resolving to swap result
   */
  execute(params: SwapParams): Promise<SwapResult>;
  
  /**
   * Estimate gas for a swap
   * @param params Swap parameters
   * @returns Promise resolving to estimated gas
   */
  estimateGas(params: SwapParams): Promise<bigint>;
  
  /**
   * Approve token spending if needed
   * @param token Token to approve
   * @param amount Amount to approve
   * @param signer Wallet signer
   * @returns Promise resolving when approval is complete
   */
  approveToken(token: Token, amount: bigint, signer: Wallet): Promise<void>;
}
