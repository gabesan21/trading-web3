import * as fs from 'fs';
import * as path from 'path';
import { Token } from '../types/quote';
import { Logger } from '../utils/logger';

/**
 * Stablecoin configuration structure
 */
interface StablecoinConfig {
  symbol: string;
  address: string;
  decimals: number;
}

/**
 * Network-keyed stablecoin configuration
 */
interface StablecoinsData {
  [network: string]: StablecoinConfig[];
}

/**
 * Load stablecoin configurations from config file
 * @param network Network name (e.g., 'polygon')
 * @param chainId Chain ID for the network
 * @param configPath Optional custom path to stablecoins.json
 * @returns Array of Token objects representing stablecoins
 */
export function loadStablecoins(
  network: string,
  chainId: number,
  configPath?: string
): Token[] {
  const filePath = configPath || path.join(process.cwd(), 'config', 'stablecoins.json');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data: StablecoinsData = JSON.parse(fileContent);
    
    if (!data[network]) {
      throw new Error(`No stablecoin configuration found for network: ${network}`);
    }
    
    const stablecoins = data[network].map((config) => ({
      symbol: config.symbol,
      address: config.address,
      decimals: config.decimals,
      chainId,
    }));
    
    Logger.info(`Loaded ${stablecoins.length} stablecoins for ${network}`, {
      stablecoins: stablecoins.map(s => s.symbol),
    });
    
    return stablecoins;
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`Failed to load stablecoin configuration: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate stablecoin configuration
 * @param stablecoins Array of stablecoins to validate
 * @returns true if valid, throws error otherwise
 */
export function validateStablecoins(stablecoins: Token[]): boolean {
  if (stablecoins.length === 0) {
    throw new Error('No stablecoins configured');
  }
  
  for (const token of stablecoins) {
    if (!token.address || !token.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error(`Invalid address for ${token.symbol}: ${token.address}`);
    }
    
    if (token.decimals <= 0 || token.decimals > 18) {
      throw new Error(`Invalid decimals for ${token.symbol}: ${token.decimals}`);
    }
    
    if (!token.symbol || token.symbol.trim().length === 0) {
      throw new Error('Token symbol cannot be empty');
    }
  }
  
  return true;
}
