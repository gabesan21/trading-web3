/**
 * Network-to-Chain ID mapping utility
 */

/**
 * Supported network names and their corresponding chain IDs
 */
export const CHAIN_IDS: Record<string, number> = {
  'polygon': 137,
  'ethereum': 1,
  'mainnet': 1,
  'goerli': 5,
  'sepolia': 11155111,
  'arbitrum': 42161,
  'optimism': 10,
  'base': 8453,
};

/**
 * Get chain ID for a given network name
 * @param network Network name (case-insensitive, e.g., 'polygon', 'Ethereum')
 * @returns Chain ID for the network
 * @throws Error if network is not supported
 */
export function getChainIdForNetwork(network: string): number {
  const normalizedNetwork = network.toLowerCase().trim();
  const chainId = CHAIN_IDS[normalizedNetwork];
  
  if (!chainId) {
    const supportedNetworks = Object.keys(CHAIN_IDS).join(', ');
    throw new Error(
      `Unknown network: ${network}. Supported networks: ${supportedNetworks}`
    );
  }
  
  return chainId;
}

/**
 * Get network name for a given chain ID
 * @param chainId Chain ID
 * @returns Network name
 * @throws Error if chain ID is not recognized
 */
export function getNetworkForChainId(chainId: number): string {
  for (const [network, id] of Object.entries(CHAIN_IDS)) {
    if (id === chainId) {
      return network === 'mainnet' ? 'ethereum' : network;
    }
  }
  
  throw new Error(`Unknown chain ID: ${chainId}`);
}
