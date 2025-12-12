/**
 * Normalize amount from one decimal precision to another
 * @param amount Amount in source decimals
 * @param fromDecimals Source decimal precision
 * @param toDecimals Target decimal precision
 * @returns Amount in target decimals
 */
export function normalizeDecimals(
  amount: bigint,
  fromDecimals: number,
  toDecimals: number
): bigint {
  if (fromDecimals === toDecimals) {
    return amount;
  }
  
  if (fromDecimals > toDecimals) {
    // Scale down (e.g., 18 decimals to 6 decimals)
    const divisor = 10n ** BigInt(fromDecimals - toDecimals);
    return amount / divisor;
  } else {
    // Scale up (e.g., 6 decimals to 18 decimals)
    const multiplier = 10n ** BigInt(toDecimals - fromDecimals);
    return amount * multiplier;
  }
}

/**
 * Format amount to human-readable string with decimals
 * @param amount Amount in smallest unit (e.g., wei)
 * @param decimals Token decimals
 * @param precision Number of decimal places to display (default: 4)
 * @returns Formatted string
 */
export function formatAmount(
  amount: bigint,
  decimals: number,
  precision: number = 4
): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  
  // Convert remainder to decimal string with leading zeros
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const decimalPart = remainderStr.slice(0, precision);
  
  if (precision === 0 || BigInt(decimalPart) === 0n) {
    return whole.toString();
  }
  
  // Trim trailing zeros
  const trimmed = decimalPart.replace(/0+$/, '');
  if (trimmed.length === 0) {
    return whole.toString();
  }
  
  return `${whole}.${trimmed}`;
}

/**
 * Parse human-readable amount to smallest unit
 * @param amount Amount as string (e.g., "1.5")
 * @param decimals Token decimals
 * @returns Amount in smallest unit
 */
export function parseAmount(amount: string, decimals: number): bigint {
  const parts = amount.split('.');
  const whole = BigInt(parts[0] || '0');
  const decimal = parts[1] || '';
  
  // Pad or truncate decimal part to match decimals
  const decimalPadded = decimal.padEnd(decimals, '0').slice(0, decimals);
  const decimalBigInt = BigInt(decimalPadded);
  
  const multiplier = 10n ** BigInt(decimals);
  return whole * multiplier + decimalBigInt;
}
