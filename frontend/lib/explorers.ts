/**
 * Blockchain Explorer URLs
 * Centralized configuration for all blockchain and storage explorer links
 */

export type Network = 'testnet' | 'devnet' | 'mainnet';

/**
 * Sui Blockchain Explorers
 * Multiple options available, using the most reliable ones
 */
export const SUI_EXPLORERS = {
  // Primary: SuiScan (most popular, best UX)
  suiscan: {
    testnet: 'https://suiscan.xyz/testnet',
    devnet: 'https://suiscan.xyz/devnet',
    mainnet: 'https://suiscan.xyz/mainnet',
  },
  // Alternative: SuiVision
  suivision: {
    testnet: 'https://testnet.suivision.xyz',
    devnet: 'https://devnet.suivision.xyz',
    mainnet: 'https://suivision.xyz',
  },
  // Official: Sui Foundation Explorer
  official: {
    testnet: 'https://explorer.sui.io',
    devnet: 'https://explorer.sui.io',
    mainnet: 'https://explorer.sui.io',
  },
} as const;

/**
 * Walrus Storage Explorers
 */
export const WALRUS_EXPLORERS = {
  // Aggregator endpoint (for downloading blobs)
  aggregator: {
    testnet: 'https://aggregator-devnet.walrus.space/v1',
    devnet: 'https://aggregator-devnet.walrus.space/v1',
    mainnet: 'https://aggregator.walrus.space/v1', // Will be available on mainnet
  },
  // Walrus Sites (for viewing blobs as websites)
  sites: {
    testnet: 'https://walrus.site',
    devnet: 'https://walrus.site',
    mainnet: 'https://walrus.site',
  },
} as const;

/**
 * Get Sui transaction explorer URL
 * @param txHash - Transaction hash/digest
 * @param network - Network (testnet, devnet, mainnet)
 * @param explorer - Which explorer to use (default: suiscan)
 */
export function getSuiTxUrl(
  txHash: string,
  network: Network = 'testnet',
  explorer: keyof typeof SUI_EXPLORERS = 'suiscan'
): string {
  const baseUrl = SUI_EXPLORERS[explorer][network];
  
  if (explorer === 'official') {
    // Official explorer uses different format
    return `${baseUrl}/txblock/${txHash}?network=${network}`;
  }
  
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get Sui object explorer URL
 * @param objectId - Object ID
 * @param network - Network (testnet, devnet, mainnet)
 * @param explorer - Which explorer to use (default: suiscan)
 */
export function getSuiObjectUrl(
  objectId: string,
  network: Network = 'testnet',
  explorer: keyof typeof SUI_EXPLORERS = 'suiscan'
): string {
  const baseUrl = SUI_EXPLORERS[explorer][network];
  
  if (explorer === 'official') {
    return `${baseUrl}/object/${objectId}?network=${network}`;
  }
  
  return `${baseUrl}/object/${objectId}`;
}

/**
 * Get Sui address explorer URL
 * @param address - Wallet address
 * @param network - Network (testnet, devnet, mainnet)
 * @param explorer - Which explorer to use (default: suiscan)
 */
export function getSuiAddressUrl(
  address: string,
  network: Network = 'testnet',
  explorer: keyof typeof SUI_EXPLORERS = 'suiscan'
): string {
  const baseUrl = SUI_EXPLORERS[explorer][network];
  
  if (explorer === 'official') {
    return `${baseUrl}/address/${address}?network=${network}`;
  }
  
  return `${baseUrl}/account/${address}`;
}

/**
 * Get Walrus blob URL (for downloading)
 * @param blobId - Blob ID/CID
 * @param network - Network (testnet, devnet, mainnet)
 */
export function getWalrusBlobUrl(
  blobId: string,
  network: Network = 'testnet'
): string {
  const baseUrl = WALRUS_EXPLORERS.aggregator[network];
  return `${baseUrl}/${blobId}`;
}

/**
 * Get Walrus site URL (for viewing as website)
 * @param blobId - Blob ID/CID
 * @param network - Network (testnet, devnet, mainnet)
 */
export function getWalrusSiteUrl(
  blobId: string,
  network: Network = 'testnet'
): string {
  // Walrus Sites format: https://{blob_id}.walrus.site
  return `https://${blobId}.${WALRUS_EXPLORERS.sites[network]}`;
}

/**
 * Get current network from environment
 */
export function getCurrentNetwork(): Network {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // Try to get from environment variable (Next.js public env vars)
    const envNetwork = process.env.NEXT_PUBLIC_SUI_NETWORK;
    if (envNetwork === 'testnet' || envNetwork === 'devnet' || envNetwork === 'mainnet') {
      return envNetwork;
    }
  }
  
  // Default to testnet
  return 'testnet';
}

/**
 * Convenience function: Get Sui TX URL with current network
 */
export function getSuiTxUrlAuto(txHash: string): string {
  return getSuiTxUrl(txHash, getCurrentNetwork());
}

/**
 * Convenience function: Get Walrus blob URL with current network
 */
export function getWalrusBlobUrlAuto(blobId: string): string {
  return getWalrusBlobUrl(blobId, getCurrentNetwork());
}

