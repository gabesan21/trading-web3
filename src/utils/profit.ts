import { Token } from '../types/quote';
import { normalizeDecimals } from './decimals';

/**
 * Calculate profit in basis points
 * @param amountIn Input amount
 * @param amountOut Output amount
 * @param tokenIn Input token
 * @param tokenOut Output token
 * @returns Profit in basis points (100 bps = 1%)
 */
export function calculateProfitBps(
  amountIn: bigint,
  amountOut: bigint,
  tokenIn: Token,
  tokenOut: Token
): number {
  // Normalize amounts to same decimal precision for comparison
  const normalizedAmountOut = normalizeDecimals(
    amountOut,
    tokenOut.decimals,
    tokenIn.decimals
  );
  
  // Calculate profit: (amountOut - amountIn) / amountIn * 10000
  // For stablecoins, we expect amountOut ≈ amountIn (1:1 parity)
  // Profit when amountOut > amountIn
  
  if (amountIn === 0n) {
    return 0;
  }
  
  const difference = normalizedAmountOut - amountIn;
  
  // Convert to basis points (multiply by 10000 before dividing to avoid floating point)
  // We multiply difference by 10000 first, then divide by amountIn
  const bps = (difference * 10000n) / amountIn;
  
  return Number(bps);
}

/**
 * Calculate minimum amount out based on slippage tolerance
 * @param expectedAmountOut Expected output amount
 * @param slippageBps Slippage tolerance in basis points
 * @returns Minimum amount out
 */
export function calculateMinAmountOut(
  expectedAmountOut: bigint,
  slippageBps: number
): bigint {
  // minAmountOut = expectedAmountOut * (10000 - slippageBps) / 10000
  const multiplier = 10000n - BigInt(slippageBps);
  return (expectedAmountOut * multiplier) / 10000n;
}

/**
 * Calculate net profit after gas costs
 * @param grossProfit Gross profit in output token units
 * @param gasUsed Gas used in wei
 * @param gasPrice Gas price in gwei
 * @param outputToken Output token
 * @param ethPriceInOutputToken ETH price in output token (e.g., 1 ETH = 2000 USDC)
 * @returns Net profit in output token units
 */
export function calculateNetProfit(
  grossProfit: bigint,
  gasUsed: bigint,
  gasPrice: bigint,
  outputToken: Token,
  ethPriceInOutputToken: number
): bigint {
  // Calculate gas cost in ETH (wei)
  const gasCostWei = gasUsed * gasPrice;
  
  // Convert ETH to output token units
  // Example: 0.001 ETH * 2000 USDC/ETH = 2 USDC
  const ethAmount = Number(gasCostWei) / 1e18; // Convert wei to ETH
  const gasCostInOutputToken = ethAmount * ethPriceInOutputToken;
  
  // Convert to output token smallest unit
  const gasCostBigInt = BigInt(
    Math.floor(gasCostInOutputToken * 10 ** outputToken.decimals)
  );
  
  return grossProfit - gasCostBigInt;
}

/**
 * Check if opportunity is profitable after gas costs
 * @param profitBps Profit in basis points
 * @param amountIn Input amount
 * @param gasUsed Gas used estimate
 * @param gasPrice Gas price in gwei
 * @param outputToken Output token
 * @param ethPriceInOutputToken ETH price in output token
 * @returns true if still profitable after gas
 */
export function isProfitableAfterGas(
  profitBps: number,
  amountIn: bigint,
  gasUsed: bigint,
  gasPrice: bigint,
  outputToken: Token,
  ethPriceInOutputToken: number
): boolean {
  // Calculate gross profit
  const grossProfit = (amountIn * BigInt(profitBps)) / 10000n;
  
  // Calculate net profit
  const netProfit = calculateNetProfit(
    grossProfit,
    gasUsed,
    gasPrice,
    outputToken,
    ethPriceInOutputToken
  );
  
  return netProfit > 0n;
}
