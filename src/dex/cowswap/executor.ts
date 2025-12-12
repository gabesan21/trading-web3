import { Contract, Wallet } from 'ethers';
import axios, { AxiosInstance } from 'axios';
import { SwapExecutor, SwapParams, SwapResult } from '../../types/executor';
import { Token } from '../../types/quote';
import { Logger } from '../../utils/logger';
import { ERC20_ABI } from '../../utils/abis';
import { retry } from '../../utils/retry';

/**
 * CowSwap VaultRelayer address for approvals (Polygon)
 */
const COWSWAP_VAULT_RELAYER = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';

/**
 * CowSwap order data structure
 */
interface CowSwapOrderData {
  sellToken: string;
  buyToken: string;
  receiver: string;
  sellAmount: string;
  buyAmount: string;
  validTo: number;
  appData: string;
  feeAmount: string;
  kind: string;
  partiallyFillable: boolean;
  sellTokenBalance: string;
  buyTokenBalance: string;
}

/**
 * CowSwap order creation response
 */
interface CowSwapOrderResponse {
  orderId: string;
}

/**
 * CowSwap order status
 */
interface CowSwapOrderStatus {
  status: 'open' | 'fulfilled' | 'cancelled' | 'expired';
  executedSellAmount?: string;
  executedBuyAmount?: string;
}

/**
 * CowSwap Swap Executor
 * Executes swaps using CowSwap's intent-based order system
 */
export class CowSwapExecutor implements SwapExecutor {
  public readonly name = 'CowSwap';
  private client: AxiosInstance;
  private maxRetries: number;
  private vaultRelayerAddress: string;
  private orderTimeout: number;

  /**
   * Creates a new CowSwap swap executor
   * @param apiBaseUrl Base URL for the CowSwap API
   * @param vaultRelayerAddress Address of the VaultRelayer contract for approvals
   * @param requestTimeout Request timeout in milliseconds
   * @param maxRetries Maximum number of retry attempts
   * @param orderTimeout Maximum time to wait for order fulfillment in seconds
   */
  constructor(
    apiBaseUrl: string,
    vaultRelayerAddress: string = COWSWAP_VAULT_RELAYER,
    requestTimeout: number = 30000,
    maxRetries: number = 3,
    orderTimeout: number = 300 // 5 minutes
  ) {
    this.client = axios.create({
      baseURL: apiBaseUrl,
      timeout: requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.maxRetries = maxRetries;
    this.vaultRelayerAddress = vaultRelayerAddress;
    this.orderTimeout = orderTimeout;
  }

  /**
   * Approve token spending for CowSwap VaultRelayer
   */
  async approveToken(token: Token, amount: bigint, signer: Wallet): Promise<void> {
    try {
      const tokenContract = new Contract(token.address, ERC20_ABI, signer);
      
      // Check existing allowance
      const currentAllowance = await tokenContract.allowance(
        signer.address,
        this.vaultRelayerAddress
      );
      
      if (currentAllowance >= amount) {
        Logger.debug(`${token.symbol} already approved for CowSwap`, {
          allowance: currentAllowance.toString(),
        });
        return;
      }
      
      Logger.info(`Approving ${token.symbol} for CowSwap`, {
        amount: amount.toString(),
        spender: this.vaultRelayerAddress,
      });
      
      const tx = await tokenContract.approve(this.vaultRelayerAddress, amount);
      await tx.wait();
      
      Logger.info(`${token.symbol} approved successfully for CowSwap`);
    } catch (error) {
      Logger.error(`Failed to approve ${token.symbol} for CowSwap`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Estimate gas for swap
   * Note: CowSwap orders don't require upfront gas - solvers pay gas
   * This returns a nominal amount for compatibility
   */
  async estimateGas(params: SwapParams): Promise<bigint> {
    // CowSwap uses an intent-based model where solvers execute trades
    // The user only pays gas for approval (if needed) and signing the order
    // Return a minimal estimate for the order creation
    Logger.debug('CowSwap gas estimate (nominal - solvers pay execution gas)', {
      estimate: '50000',
    });
    return 50000n;
  }

  /**
   * Execute swap on CowSwap by creating and monitoring an order
   */
  async execute(params: SwapParams): Promise<SwapResult> {
    try {
      Logger.info('Executing CowSwap order', {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountIn: params.amountIn.toString(),
      });
      
      // Approve token
      await this.approveToken(params.tokenIn, params.amountIn, params.signer);
      
      // Create order
      const orderId = await this.createOrder(params);
      
      Logger.info('CowSwap order created', { orderId });
      
      // Monitor order status
      const result = await this.monitorOrder(orderId, params);
      
      return result;
    } catch (error) {
      Logger.error('CowSwap order failed', {
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
   * Create a CowSwap order
   */
  private async createOrder(params: SwapParams): Promise<string> {
    // Get fee quote
    const feeQuote = await this.getFeeQuote(params);
    
    // Build order data
    const orderData: CowSwapOrderData = {
      sellToken: params.tokenIn.address,
      buyToken: params.tokenOut.address,
      receiver: params.signer.address,
      sellAmount: params.amountIn.toString(),
      buyAmount: params.minAmountOut.toString(),
      validTo: params.deadline,
      appData: '0x0000000000000000000000000000000000000000000000000000000000000000',
      feeAmount: feeQuote.feeAmount,
      kind: 'sell',
      partiallyFillable: false,
      sellTokenBalance: 'erc20',
      buyTokenBalance: 'erc20',
    };
    
    // Sign order
    const signature = await this.signOrder(orderData, params.signer, params.chainId);
    
    // Submit order
    const response = await retry(
      async () => {
        return await this.client.post<CowSwapOrderResponse>('/api/v1/orders', {
          ...orderData,
          signature,
          signingScheme: 'eip712',
          from: params.signer.address,
        });
      },
      { maxRetries: this.maxRetries },
      'CowSwap order creation'
    );
    
    return response.data.orderId;
  }

  /**
   * Get fee quote from CowSwap
   */
  private async getFeeQuote(params: SwapParams): Promise<{ feeAmount: string }> {
    try {
      const response = await this.client.post('/api/v1/quote', {
        sellToken: params.tokenIn.address,
        buyToken: params.tokenOut.address,
        sellAmountBeforeFee: params.amountIn.toString(),
        kind: 'sell',
        from: params.signer.address,
      });
      
      return {
        feeAmount: response.data.quote.feeAmount,
      };
    } catch (error) {
      Logger.warn('Failed to get CowSwap fee quote, using zero fee', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { feeAmount: '0' };
    }
  }

  /**
   * Sign order using EIP-712
   */
  private async signOrder(
    orderData: CowSwapOrderData,
    signer: Wallet,
    chainId: number
  ): Promise<string> {
    // EIP-712 domain
    const domain = {
      name: 'Gnosis Protocol',
      version: 'v2',
      chainId,
      verifyingContract: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41', // GPv2Settlement on Polygon
    };
    
    // EIP-712 types
    const types = {
      Order: [
        { name: 'sellToken', type: 'address' },
        { name: 'buyToken', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'sellAmount', type: 'uint256' },
        { name: 'buyAmount', type: 'uint256' },
        { name: 'validTo', type: 'uint32' },
        { name: 'appData', type: 'bytes32' },
        { name: 'feeAmount', type: 'uint256' },
        { name: 'kind', type: 'string' },
        { name: 'partiallyFillable', type: 'bool' },
        { name: 'sellTokenBalance', type: 'string' },
        { name: 'buyTokenBalance', type: 'string' },
      ],
    };
    
    // Sign typed data
    const signature = await signer.signTypedData(domain, types, orderData);
    
    return signature;
  }

  /**
   * Monitor order status until fulfilled or timeout
   */
  private async monitorOrder(
    orderId: string,
    params: SwapParams
  ): Promise<SwapResult> {
    const startTime = Date.now();
    const timeoutMs = this.orderTimeout * 1000;
    const pollInterval = 5000; // Poll every 5 seconds
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.getOrderStatus(orderId);
        
        if (status.status === 'fulfilled') {
          const amountOut = status.executedBuyAmount
            ? BigInt(status.executedBuyAmount)
            : params.minAmountOut;
          
          Logger.info('CowSwap order fulfilled', {
            orderId,
            amountOut: amountOut.toString(),
          });
          
          return {
            success: true,
            transactionHash: orderId, // Use orderId as reference
            amountOut,
            gasUsed: 0n, // Solver pays gas
            provider: this.name,
          };
        }
        
        if (status.status === 'cancelled' || status.status === 'expired') {
          throw new Error(`Order ${status.status}: ${orderId}`);
        }
        
        // Still open, wait and retry
        Logger.debug('CowSwap order still pending', {
          orderId,
          status: status.status,
          elapsed: `${Date.now() - startTime}ms`,
        });
        
        await this.sleep(pollInterval);
      } catch (error) {
        Logger.error('Error monitoring CowSwap order', {
          orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
    
    // Timeout
    throw new Error(
      `CowSwap order timeout after ${this.orderTimeout} seconds: ${orderId}`
    );
  }

  /**
   * Get order status
   */
  private async getOrderStatus(orderId: string): Promise<CowSwapOrderStatus> {
    const response = await this.client.get<CowSwapOrderStatus>(
      `/api/v1/orders/${orderId}`
    );
    return response.data;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
