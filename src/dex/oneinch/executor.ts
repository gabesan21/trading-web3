import { Contract, Wallet } from 'ethers';
import axios, { AxiosInstance } from 'axios';
import { SwapExecutor, SwapParams, SwapResult } from '../../types/executor';
import { Token } from '../../types/quote';
import { Logger } from '../../utils/logger';
import { ERC20_ABI } from '../../utils/abis';
import { retry } from '../../utils/retry';

/**
 * 1Inch API swap response
 */
interface OneInchSwapResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
  };
  toAmount: string;
}

/**
 * 1Inch Swap Executor
 * Executes swaps using the 1Inch aggregation protocol API
 */
export class OneInchExecutor implements SwapExecutor {
  public readonly name = '1Inch';
  private client: AxiosInstance;
  private maxRetries: number;

  /**
   * Creates a new 1Inch swap executor
   * @param apiBaseUrl Base URL for the 1Inch API (e.g., https://api.1inch.dev/swap/v6.0/137)
   * @param apiKey Optional API key for higher rate limits
   * @param requestTimeout Request timeout in milliseconds
   * @param maxRetries Maximum number of retry attempts
   */
  constructor(
    apiBaseUrl: string,
    apiKey?: string,
    requestTimeout: number = 30000,
    maxRetries: number = 3
  ) {
    this.client = axios.create({
      baseURL: apiBaseUrl,
      timeout: requestTimeout,
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        'Content-Type': 'application/json',
      },
    });
    this.maxRetries = maxRetries;
  }

  /**
   * Approve token spending for 1Inch router contract
   */
  async approveToken(token: Token, amount: bigint, signer: Wallet): Promise<void> {
    try {
      // Get the 1Inch router address from approve/spender endpoint
      const spenderResponse = await retry(
        async () => this.client.get('/approve/spender'),
        { maxRetries: this.maxRetries },
        '1Inch spender address'
      );
      
      const spenderAddress = spenderResponse.data.address;
      
      const tokenContract = new Contract(token.address, ERC20_ABI, signer);
      
      // Check existing allowance
      const currentAllowance = await tokenContract.allowance(
        signer.address,
        spenderAddress
      );
      
      if (currentAllowance >= amount) {
        Logger.debug(`${token.symbol} already approved for 1Inch`, {
          allowance: currentAllowance.toString(),
        });
        return;
      }
      
      Logger.info(`Approving ${token.symbol} for 1Inch`, {
        amount: amount.toString(),
        spender: spenderAddress,
      });
      
      const tx = await tokenContract.approve(spenderAddress, amount);
      await tx.wait();
      
      Logger.info(`${token.symbol} approved successfully for 1Inch`);
    } catch (error) {
      Logger.error(`Failed to approve ${token.symbol} for 1Inch`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Estimate gas for swap using 1Inch API
   */
  async estimateGas(params: SwapParams): Promise<bigint> {
    try {
      // 1Inch API returns gas estimate in the swap response
      const swapData = await this.getSwapData(params);
      const gasEstimate = BigInt(swapData.tx.gas);
      
      Logger.debug('Gas estimated for 1Inch swap', {
        gas: gasEstimate.toString(),
      });
      
      return gasEstimate;
    } catch (error) {
      Logger.warn('Failed to estimate gas from 1Inch, using default', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 300000n; // Default fallback
    }
  }

  /**
   * Execute swap on 1Inch
   */
  async execute(params: SwapParams): Promise<SwapResult> {
    try {
      Logger.info('Executing 1Inch swap', {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountIn: params.amountIn.toString(),
      });
      
      // Approve token
      await this.approveToken(params.tokenIn, params.amountIn, params.signer);
      
      // Get swap transaction data
      const swapData = await this.getSwapData(params);
      
      // Validate transaction data
      this.validateTransactionData(swapData, params);
      
      // Execute the transaction
      const tx = await params.signer.sendTransaction({
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: BigInt(swapData.tx.value),
        gasLimit: BigInt(swapData.tx.gas),
      });
      
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }
      
      const amountOut = BigInt(swapData.toAmount);
      
      Logger.info('1Inch swap successful', {
        hash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amountOut: amountOut.toString(),
      });
      
      return {
        success: true,
        transactionHash: receipt.hash,
        amountOut,
        gasUsed: receipt.gasUsed,
        provider: this.name,
      };
    } catch (error) {
      Logger.error('1Inch swap failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        provider: this.name,
      };
    }
  }

  /**
   * Get swap transaction data from 1Inch API
   */
  private async getSwapData(params: SwapParams): Promise<OneInchSwapResponse> {
    return retry(
      async () => {
        const response = await this.client.get<OneInchSwapResponse>('/swap', {
          params: {
            src: params.tokenIn.address,
            dst: params.tokenOut.address,
            amount: params.amountIn.toString(),
            from: params.signer.address,
            slippage: this.calculateSlippagePercentage(params),
            disableEstimate: false,
            allowPartialFill: false,
          },
        });
        return response.data;
      },
      { 
        maxRetries: this.maxRetries,
        initialDelay: 2000, // Longer delay for rate limits
        backoffMultiplier: 2,
      },
      '1Inch swap data'
    );
  }

  /**
   * Calculate slippage percentage from minAmountOut
   */
  private calculateSlippagePercentage(params: SwapParams): number {
    // Estimate expected output (simplified - in reality comes from quote)
    // For now, calculate from minAmountOut
    // slippage = (1 - minAmountOut/expectedOut) * 100
    // Default to 1% if can't calculate
    return 1;
  }

  /**
   * Validate transaction data before execution
   */
  private validateTransactionData(
    swapData: OneInchSwapResponse,
    params: SwapParams
  ): void {
    // Validate recipient matches signer
    if (swapData.tx.from.toLowerCase() !== params.signer.address.toLowerCase()) {
      throw new Error(
        `Transaction 'from' address mismatch: expected ${params.signer.address}, got ${swapData.tx.from}`
      );
    }
    
    // Validate output amount meets minimum
    const receivedAmount = BigInt(swapData.toAmount);
    if (receivedAmount < params.minAmountOut) {
      throw new Error(
        `Output amount ${receivedAmount} is less than minimum ${params.minAmountOut}`
      );
    }
    
    // Validate transaction has data
    if (!swapData.tx.data || swapData.tx.data === '0x') {
      throw new Error('Invalid transaction data received from 1Inch API');
    }
    
    Logger.debug('1Inch transaction data validated', {
      to: swapData.tx.to,
      value: swapData.tx.value,
      gas: swapData.tx.gas,
      expectedOutput: swapData.toAmount,
    });
  }
}
