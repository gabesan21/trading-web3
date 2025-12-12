import { Token, Quote } from '../types/quote';

/**
 * Format a token amount from bigint to human-readable string with decimals
 * 
 * @param amount Amount in smallest unit (e.g., wei)
 * @param decimals Number of decimals for the token
 * @param maxDecimals Maximum decimal places to display (default: 6)
 * @returns Formatted amount as string
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  maxDecimals: number = 6
): string {
  // Convert bigint to number with decimals
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  // Format whole part with thousand separators
  const wholeStr = wholePart.toLocaleString('en-US');
  
  if (fractionalPart === 0n) {
    return `${wholeStr}.00`;
  }
  
  // Format fractional part
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  
  // Limit to maxDecimals
  const limitedFractional = fractionalStr.slice(0, maxDecimals);
  
  // Remove trailing zeros
  const trimmedFractional = limitedFractional.replace(/0+$/, '');
  
  if (trimmedFractional.length === 0) {
    return `${wholeStr}.00`;
  }
  
  return `${wholeStr}.${trimmedFractional}`;
}

/**
 * Calculate exchange rate between two tokens
 * 
 * @param amountIn Amount of input token
 * @param decimalsIn Decimals of input token
 * @param amountOut Amount of output token
 * @param decimalsOut Decimals of output token
 * @returns Exchange rate as string
 */
export function calculateExchangeRate(
  amountIn: bigint,
  decimalsIn: number,
  amountOut: bigint,
  decimalsOut: number
): string {
  // Normalize both amounts to same scale (18 decimals for precision)
  const SCALE = 18;
  const normalizedIn = amountIn * BigInt(10 ** (SCALE - decimalsIn));
  const normalizedOut = amountOut * BigInt(10 ** (SCALE - decimalsOut));
  
  if (normalizedIn === 0n) {
    return '0';
  }
  
  // Calculate rate with high precision
  const rate = (normalizedOut * BigInt(10 ** 6)) / normalizedIn;
  
  // Convert to decimal
  const rateNumber = Number(rate) / 1_000_000;
  
  return rateNumber.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Format quote information for display
 * 
 * @param quote Quote object from provider
 * @param tokenIn Input token
 * @param tokenOut Output token
 * @param amountIn Input amount
 * @param network Network name
 * @returns Formatted quote display string
 */
export function formatQuoteDisplay(
  quote: Quote,
  tokenIn: Token,
  tokenOut: Token,
  amountIn: bigint,
  network: string
): string {
  const separator = '='.repeat(77);
  
  const formattedAmountIn = formatTokenAmount(amountIn, tokenIn.decimals);
  const formattedAmountOut = formatTokenAmount(quote.amountOut, tokenOut.decimals);
  const rate = calculateExchangeRate(
    amountIn,
    tokenIn.decimals,
    quote.amountOut,
    tokenOut.decimals
  );
  
  let output = `${separator}\n`;
  output += `TRADE QUOTE\n`;
  output += `${separator}\n\n`;
  
  output += `Provider: ${quote.provider}\n`;
  output += `Network:  ${network}\n\n`;
  
  output += `You Send:    ${formattedAmountIn} ${tokenIn.symbol}\n`;
  output += `You Receive: ~${formattedAmountOut} ${tokenOut.symbol}\n`;
  output += `Rate:        1 ${tokenIn.symbol} = ${rate} ${tokenOut.symbol}\n`;
  
  // Add optional fields if available
  if (quote.estimatedGas !== undefined) {
    output += `\nEstimated Gas: ${quote.estimatedGas.toLocaleString('en-US')} gas units\n`;
  }
  
  if (quote.fee !== undefined) {
    const formattedFee = formatTokenAmount(quote.fee, tokenOut.decimals);
    output += `Fee:           ${formattedFee} ${tokenOut.symbol}\n`;
  }
  
  output += `\n${separator}\n`;
  
  return output;
}
