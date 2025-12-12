import { Contract, Wallet, AbiCoder } from 'ethers';
import { SwapExecutor, SwapParams, SwapResult } from '../../../types/executor';
import { Token } from '../../../types/quote';
import { Logger } from '../../../utils/logger';
import { UniswapV4Config } from '../../../config/dex';

/**
 * Uniswap V4 PoolKey structure (matches the quote provider)
 */
interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

/**
 * Universal Router V4 Actions
 * These are command codes for the Universal Router's multi-action pattern
 */
enum V4Actions {
  SWAP_EXACT_IN_SINGLE = '0x00',
  SWAP_EXACT_IN = '0x01',
  SWAP_EXACT_OUT_SINGLE = '0x02',
  SWAP_EXACT_OUT = '0x03',
  SETTLE = '0x09',
  TAKE = '0x0a',
  SETTLE_ALL = '0x10',
  TAKE_ALL = '0x11',
}

// ERC20 Token ABI (minimal)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
];

// Uniswap V4 Universal Router ABI (minimal interface for execute)
const UNIVERSAL_ROUTER_V4_ABI = [
  'function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external payable',
];

/**
 * Uniswap V4 Swap Executor
 * 
 * Executes swaps on Uniswap V4 using the Universal Router with multi-action pattern:
 * 1. SWAP_EXACT_IN_SINGLE - Execute the swap
 * 2. SETTLE_ALL - Pay input tokens
 * 3. TAKE_ALL - Receive output tokens
 */
export class UniswapV4Executor implements SwapExecutor {
  public readonly name = 'Uniswap V4';
  private v4Config: UniswapV4Config;
  private abiCoder: AbiCoder;

  constructor(v4Config: UniswapV4Config) {
    this.v4Config = v4Config;
    this.abiCoder = AbiCoder.defaultAbiCoder();
  }

  /**
   * Constructs a PoolKey with proper token ordering
   * Same logic as in the quote provider
   */
  private constructPoolKey(
    tokenIn: string,
    tokenOut: string,
    fee: number,
    tickSpacing: number,
    hooks: string
  ): { poolKey: PoolKey; zeroForOne: boolean } {
    const tokenInLower = tokenIn.toLowerCase();
    const tokenOutLower = tokenOut.toLowerCase();
    
    const isTokenInFirst = tokenInLower < tokenOutLower;
    const currency0 = isTokenInFirst ? tokenIn : tokenOut;
    const currency1 = isTokenInFirst ? tokenOut : tokenIn;
    const zeroForOne = isTokenInFirst;
    
    const poolKey: PoolKey = {
      currency0,
      currency1,
      fee,
      tickSpacing,
      hooks,
    };
    
    return { poolKey, zeroForOne };
  }

  /**
   * Approve token spending for Universal Router
   */
  async approveToken(token: Token, amount: bigint, signer: Wallet): Promise<void> {
    try {
      if (!this.v4Config.universalRouterAddress || this.v4Config.universalRouterAddress === '') {
        throw new Error('Uniswap V4 Universal Router address not configured');
      }

      const tokenContract = new Contract(token.address, ERC20_ABI, signer);
      
      // Check existing allowance
      const currentAllowance = await tokenContract.allowance(
        signer.address,
        this.v4Config.universalRouterAddress
      );
      
      if (currentAllowance >= amount) {
        Logger.debug(`${token.symbol} already approved for V4`, {
          allowance: currentAllowance.toString(),
        });
        return;
      }
      
      Logger.info(`Approving ${token.symbol} for Uniswap V4 Universal Router`, {
        amount: amount.toString(),
        router: this.v4Config.universalRouterAddress,
      });
      
      const tx = await tokenContract.approve(
        this.v4Config.universalRouterAddress,
        amount
      );
      await tx.wait();
      
      Logger.info(`${token.symbol} approved successfully for V4`);
    } catch (error) {
      Logger.error(`Failed to approve ${token.symbol} for V4`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Encodes SWAP_EXACT_IN_SINGLE action
   * @param poolKey Pool identification
   * @param zeroForOne Swap direction
   * @param amountIn Input amount
   * @param minAmountOut Minimum output (slippage protection)
   * @returns Encoded swap action input
   */
  private encodeSwapAction(
    poolKey: PoolKey,
    zeroForOne: boolean,
    amountIn: bigint,
    minAmountOut: bigint
  ): string {
    // Encode PoolKey as tuple
    const poolKeyEncoded = this.abiCoder.encode(
      ['tuple(address,address,uint24,int24,address)'],
      [[
        poolKey.currency0,
        poolKey.currency1,
        poolKey.fee,
        poolKey.tickSpacing,
        poolKey.hooks,
      ]]
    );

    // Encode swap parameters: (PoolKey, zeroForOne, uint128 amountIn, uint128 minAmountOut)
    const swapParams = this.abiCoder.encode(
      ['bytes', 'bool', 'uint128', 'uint128'],
      [poolKeyEncoded, zeroForOne, amountIn, minAmountOut]
    );

    return swapParams;
  }

  /**
   * Encodes SETTLE_ALL action (pay input tokens to pool)
   * @param currency Token address to settle
   * @returns Encoded settle action input
   */
  private encodeSettleAllAction(currency: string): string {
    return this.abiCoder.encode(['address'], [currency]);
  }

  /**
   * Encodes TAKE_ALL action (receive output tokens from pool)
   * @param currency Token address to take
   * @param recipient Recipient address
   * @returns Encoded take action input
   */
  private encodeTakeAllAction(currency: string, recipient: string): string {
    return this.abiCoder.encode(['address', 'address'], [currency, recipient]);
  }

  /**
   * Estimate gas for V4 swap
   */
  async estimateGas(params: SwapParams): Promise<bigint> {
    try {
      if (!this.v4Config.universalRouterAddress || this.v4Config.universalRouterAddress === '') {
        throw new Error('Uniswap V4 Universal Router address not configured');
      }

      const router = new Contract(
        this.v4Config.universalRouterAddress,
        UNIVERSAL_ROUTER_V4_ABI,
        params.signer
      );

      // Get fee tier configuration
      const feeTier = this.v4Config.feeTiers.find(
        (tier) => tier.fee === this.v4Config.defaultFeeTier
      );
      
      if (!feeTier) {
        throw new Error(`Default fee tier ${this.v4Config.defaultFeeTier} not found`);
      }

      // Construct PoolKey
      const { poolKey, zeroForOne } = this.constructPoolKey(
        params.tokenIn.address,
        params.tokenOut.address,
        feeTier.fee,
        feeTier.tickSpacing,
        this.v4Config.defaultHooks
      );

      // Encode actions
      const swapInput = this.encodeSwapAction(
        poolKey,
        zeroForOne,
        params.amountIn,
        params.minAmountOut
      );
      const settleInput = this.encodeSettleAllAction(params.tokenIn.address);
      const takeInput = this.encodeTakeAllAction(params.tokenOut.address, params.signer.address);

      // Combine commands and inputs
      const commands = V4Actions.SWAP_EXACT_IN_SINGLE + 
                      V4Actions.SETTLE_ALL.slice(2) + 
                      V4Actions.TAKE_ALL.slice(2);
      const inputs = [swapInput, settleInput, takeInput];

      const gasEstimate = await router.execute.estimateGas(commands, inputs, params.deadline);
      
      Logger.debug('Gas estimated for Uniswap V4 swap', {
        gas: gasEstimate.toString(),
      });
      
      return gasEstimate;
    } catch (error) {
      Logger.warn('Failed to estimate gas for V4, using default', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 400000n; // V4 may use slightly more gas than V3 due to multi-action pattern
    }
  }

  /**
   * Execute swap on Uniswap V4 using Universal Router
   */
  async execute(params: SwapParams): Promise<SwapResult> {
    try {
      if (!this.v4Config.universalRouterAddress || this.v4Config.universalRouterAddress === '') {
        throw new Error('Uniswap V4 Universal Router address not configured');
      }

      Logger.info('Executing Uniswap V4 swap', {
        tokenIn: params.tokenIn.symbol,
        tokenOut: params.tokenOut.symbol,
        amountIn: params.amountIn.toString(),
        minAmountOut: params.minAmountOut.toString(),
      });
      
      // Step 1: Approve token
      await this.approveToken(params.tokenIn, params.amountIn, params.signer);
      
      // Step 2: Get fee tier configuration
      const feeTier = this.v4Config.feeTiers.find(
        (tier) => tier.fee === this.v4Config.defaultFeeTier
      );
      
      if (!feeTier) {
        throw new Error(`Default fee tier ${this.v4Config.defaultFeeTier} not found`);
      }

      // Step 3: Construct PoolKey
      const { poolKey, zeroForOne } = this.constructPoolKey(
        params.tokenIn.address,
        params.tokenOut.address,
        feeTier.fee,
        feeTier.tickSpacing,
        this.v4Config.defaultHooks
      );

      Logger.debug('V4 Swap PoolKey', {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
        zeroForOne,
      });

      // Step 4: Encode actions
      const swapInput = this.encodeSwapAction(
        poolKey,
        zeroForOne,
        params.amountIn,
        params.minAmountOut
      );
      const settleInput = this.encodeSettleAllAction(params.tokenIn.address);
      const takeInput = this.encodeTakeAllAction(params.tokenOut.address, params.signer.address);

      // Step 5: Combine commands (multi-action pattern)
      // Commands are concatenated as bytes
      const commands = V4Actions.SWAP_EXACT_IN_SINGLE + 
                      V4Actions.SETTLE_ALL.slice(2) + 
                      V4Actions.TAKE_ALL.slice(2);
      const inputs = [swapInput, settleInput, takeInput];

      Logger.debug('V4 Universal Router execution', {
        commands,
        inputCount: inputs.length,
        deadline: params.deadline,
      });

      // Step 6: Execute via Universal Router
      const router = new Contract(
        this.v4Config.universalRouterAddress,
        UNIVERSAL_ROUTER_V4_ABI,
        params.signer
      );

      const tx = await router.execute(commands, inputs, params.deadline);
      const receipt = await tx.wait();
      
      Logger.info('Uniswap V4 swap successful', {
        hash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      });
      
      return {
        success: true,
        transactionHash: receipt.hash,
        amountOut: params.minAmountOut, // Simplified: actual parsing would require event logs
        gasUsed: receipt.gasUsed,
        provider: this.name,
      };
    } catch (error) {
      Logger.error('Uniswap V4 swap failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        provider: this.name,
      };
    }
  }
}
