import * as readline from 'readline';
import { Quote, Token } from '../types/quote';
import { formatQuoteDisplay } from './formatting';

/**
 * Prompt user for confirmation and read response from stdin
 * 
 * @param message Prompt message to display
 * @returns Promise resolving to true if user confirms, false otherwise
 */
async function promptForConfirmation(message: string): Promise<boolean> {
  // Check if stdin is a TTY (interactive mode)
  if (!process.stdin.isTTY) {
    throw new Error(
      'Cannot prompt for confirmation in non-interactive mode. ' +
      'Use --force flag to skip confirmation.'
    );
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * Display quote and prompt user for trade confirmation
 * 
 * @param quote Quote object from provider
 * @param tokenIn Input token
 * @param tokenOut Output token
 * @param amountIn Input amount
 * @param network Network name
 * @param force If true, skip confirmation prompt
 * @returns Promise resolving to true if user confirms or force is true
 */
export async function confirmTrade(
  quote: Quote,
  tokenIn: Token,
  tokenOut: Token,
  amountIn: bigint,
  network: string,
  force: boolean = false
): Promise<boolean> {
  // Display formatted quote
  const quoteDisplay = formatQuoteDisplay(
    quote,
    tokenIn,
    tokenOut,
    amountIn,
    network
  );
  
  console.log(quoteDisplay);
  
  // Skip confirmation if force flag is set
  if (force) {
    console.log('Force mode enabled - skipping confirmation\n');
    return true;
  }
  
  // Prompt for confirmation
  const confirmed = await promptForConfirmation('Execute this trade? (y/n): ');
  
  if (!confirmed) {
    console.log('\nTrade cancelled by user.');
  }
  
  return confirmed;
}
