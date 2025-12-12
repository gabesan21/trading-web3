import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

/**
 * Network-keyed provider configuration
 */
interface ProvidersData {
  [network: string]: string[];
}

/**
 * Load provider configurations from config file
 * @param network Network name (e.g., 'polygon')
 * @param configPath Optional custom path to providers.json
 * @returns Array of provider names
 */
export function loadProviders(
  network: string,
  configPath?: string
): string[] {
  const filePath = configPath || path.join(process.cwd(), 'config', 'providers.json');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data: ProvidersData = JSON.parse(fileContent);
    
    if (!data[network]) {
      throw new Error(`No provider configuration found for network: ${network}`);
    }
    
    const providers = data[network];
    
    Logger.info(`Loaded ${providers.length} providers for ${network}`, {
      providers,
    });
    
    return providers;
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`Failed to load provider configuration: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate provider configuration
 * @param providers Array of provider names to validate
 * @returns true if valid, throws error otherwise
 */
export function validateProviders(providers: string[]): boolean {
  if (providers.length === 0) {
    throw new Error('No providers configured');
  }
  
  for (const provider of providers) {
    if (!provider || provider.trim().length === 0) {
      throw new Error('Provider name cannot be empty');
    }
  }
  
  return true;
}
