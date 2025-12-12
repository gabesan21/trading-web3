import { Token, Quote } from './quote';

/**
 * Configuration for arbitrage strategy
 */
export interface ArbitrageConfig {
  /** Minimum profit threshold in basis points (e.g., 30 = 0.3%) */
  minProfitBps: number;
  
  /** Maximum slippage tolerance in basis points (e.g., 50 = 0.5%) */
  maxSlippageBps: number;
  
  /** Transaction deadline in seconds from now (e.g., 300 = 5 minutes) */
  deadlineSeconds: number;
  
  /** Whether to factor in gas costs when calculating profitability */
  checkGasCost: boolean;
  
  /** Minimum balance threshold to consider (in smallest unit) */
  minBalanceThreshold?: bigint;
  
  /** Dry-run mode: find opportunities but don't execute trades */
  dryRun?: boolean;
}

/**
 * Represents an arbitrage opportunity
 */
export interface ArbitrageOpportunity {
  /** Provider name */
  provider: string;
  
  /** Input token */
  inputToken: Token;
  
  /** Output token */
  outputToken: Token;
  
  /** Amount to swap in */
  amountIn: bigint;
  
  /** Expected amount to receive */
  expectedAmountOut: bigint;
  
  /** Profit in basis points */
  profitBps: number;
  
  /** Original quote from provider */
  quote: Quote;
  
  /** Estimated gas cost */
  estimatedGas?: bigint;
  
  /** Net profit after gas (in output token units) */
  netProfitAmount?: bigint;
}

/**
 * Result of an arbitrage execution
 */
export interface ArbitrageResult {
  /** Whether arbitrage was attempted */
  attempted: boolean;
  
  /** Whether arbitrage was successful */
  success: boolean;
  
  /** Opportunity that was executed */
  opportunity?: ArbitrageOpportunity;
  
  /** Transaction hash */
  transactionHash?: string;
  
  /** Actual amount received */
  actualAmountOut?: bigint;
  
  /** Gas used */
  gasUsed?: bigint;
  
  /** Error message if failed */
  error?: string;
  
  /** Reason for not attempting (e.g., "No opportunity found") */
  reason?: string;
}
