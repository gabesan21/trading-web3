import { Provider, Contract } from 'ethers';
import { Token } from '../../types/quote';
import { Logger } from '../../utils/logger';
import { ERC20_ABI } from '../../utils/abis';
import { formatAmount } from '../../utils/decimals';

/**
 * Service for checking wallet token balances
 */
export class BalanceService {
  constructor(private provider: Provider) {}

  /**
   * Get balance of a specific token for a wallet
   * @param walletAddress Wallet address to check
   * @param token Token to check balance for
   * @returns Balance in smallest unit (e.g., wei)
   */
  async getBalance(walletAddress: string, token: Token): Promise<bigint> {
    try {
      const contract = new Contract(token.address, ERC20_ABI, this.provider);
      const balance = await contract.balanceOf(walletAddress);
      
      Logger.debug(`Balance for ${token.symbol}`, {
        wallet: walletAddress,
        balance: formatAmount(balance, token.decimals),
        raw: balance.toString(),
      });
      
      return balance;
    } catch (error) {
      Logger.error(`Failed to get balance for ${token.symbol}`, {
        wallet: walletAddress,
        token: token.address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get balances for multiple tokens
   * @param walletAddress Wallet address to check
   * @param tokens Array of tokens to check
   * @returns Map of token symbol to balance
   */
  async getBalances(
    walletAddress: string,
    tokens: Token[]
  ): Promise<Map<string, bigint>> {
    const balances = new Map<string, bigint>();
    
    const results = await Promise.allSettled(
      tokens.map(token => this.getBalance(walletAddress, token))
    );
    
    results.forEach((result, index) => {
      const token = tokens[index];
      if (result.status === 'fulfilled') {
        balances.set(token.symbol, result.value);
      } else {
        Logger.warn(`Failed to get balance for ${token.symbol}`, {
          reason: result.reason,
        });
        balances.set(token.symbol, 0n);
      }
    });
    
    return balances;
  }

  /**
   * Find the token with the highest balance
   * @param walletAddress Wallet address to check
   * @param tokens Array of tokens to check
   * @param minThreshold Minimum balance threshold (optional)
   * @returns Token with highest balance and the balance amount, or null if none found
   */
  async getHighestStablecoinBalance(
    walletAddress: string,
    tokens: Token[],
    minThreshold?: bigint
  ): Promise<{ token: Token; balance: bigint } | null> {
    const balances = await this.getBalances(walletAddress, tokens);
    
    let maxBalance = 0n;
    let maxToken: Token | null = null;
    
    for (const token of tokens) {
      const balance = balances.get(token.symbol) || 0n;
      
      // Skip if below threshold
      if (minThreshold && balance < minThreshold) {
        continue;
      }
      
      // Compare normalized balances (convert to same decimal precision)
      // For simplicity, compare raw balances since stablecoins are all similar value
      if (balance > maxBalance) {
        maxBalance = balance;
        maxToken = token;
      }
    }
    
    if (!maxToken || maxBalance === 0n) {
      Logger.info('No token balance found above threshold', {
        wallet: walletAddress,
        minThreshold: minThreshold?.toString(),
      });
      return null;
    }
    
    Logger.info(`Highest balance: ${maxToken.symbol}`, {
      balance: formatAmount(maxBalance, maxToken.decimals),
      raw: maxBalance.toString(),
    });
    
    return { token: maxToken, balance: maxBalance };
  }
}
