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
  // Format: https://suiscan.xyz/testnet/tx/{digest}
  suiscan: {
    testnet: 'https://suiscan.xyz/testnet',
    devnet: 'https://suiscan.xyz/devnet',
    mainnet: 'https://suiscan.xyz/mainnet',
  },
  // Alternative: SuiVision
  // Format: https://testnet.suivision.xyz/txblock/{digest}
  suivision: {
    testnet: 'https://testnet.suivision.xyz',
    devnet: 'https://devnet.suivision.xyz',
    mainnet: 'https://suivision.xyz',
  },
  // Official: Sui Foundation Explorer
  // Format: https://suiexplorer.com/?network=testnet (then search)
  // Or: https://explorer.sui.io/txblock/{digest}?network=testnet
  official: {
    testnet: 'https://suiexplorer.com',
    devnet: 'https://suiexplorer.com',
    mainnet: 'https://suiexplorer.com',
  },
} as const;

/**
 * Walrus Storage Explorers
 * Multiple public aggregator endpoints available for testnet
 * Source: https://docs.wal.app/usage/web-api.html
 */
export const WALRUS_EXPLORERS = {
  // Walruscan Explorer (for viewing blobs, events, account activity)
  // Format: https://walruscan.com/testnet/account/{address}/blobs
  walruscan: {
    testnet: 'https://walruscan.com/testnet',
    devnet: 'https://walruscan.com/devnet',
    mainnet: 'https://walruscan.com/mainnet',
  },
  // Aggregator endpoints (for downloading blobs)
  // Multiple options available, using most reliable ones
  aggregator: {
    // Primary: StakeTab (reliable, well-maintained)
    testnet: 'https://wal-aggregator-testnet.staketab.org/v1',
    devnet: 'https://wal-aggregator-testnet.staketab.org/v1',
    mainnet: 'https://aggregator.walrus.space/v1', // Will be available on mainnet
  },
  // Alternative aggregators (backups)
  alternativeAggregators: {
    testnet: [
      'https://walrus-testnet-aggregator.nodes.guru/v1',
      'https://walrus-testnet-aggregator.bartestnet.com/v1',
      'https://sui-walrus-testnet.bwarelabs.com/aggregator/v1',
      'https://walrus-testnet.blockscope.net/v1',
      'https://walrus-cache-testnet.overclock.run/v1',
    ],
  },
  // Walrus Sites (for viewing blobs as websites)
  // Format: https://{blob_id}.walrus.site
  sites: {
    testnet: 'walrus.site',
    devnet: 'walrus.site',
    mainnet: 'walrus.site',
  },
} as const;

/**
 * Validate if a Sui transaction hash looks valid
 * @param txHash - Transaction hash to validate
 * @returns true if hash looks valid
 */
function isValidSuiTxHash(txHash: string): boolean {
  if (!txHash) return false;
  
  // Sui transaction digests are 32-byte hex strings (64 characters) with 0x prefix
  // Total length should be 66 characters (0x + 64 hex chars)
  if (!txHash.startsWith('0x')) return false;
  if (txHash.length !== 66) return false;
  
  // Check if it's all zeros (mock data)
  const hexPart = txHash.slice(2);
  if (/^0+$/.test(hexPart)) return false;
  
  // Check if it's valid hex
  if (!/^[0-9a-fA-F]+$/.test(hexPart)) return false;
  
  return true;
}

/**
 * Get Sui transaction explorer URL
 * @param txHash - Transaction hash/digest
 * @param network - Network (testnet, devnet, mainnet)
 * @param explorer - Which explorer to use (default: suiscan)
 * @returns Explorer URL or null if hash is invalid
 */
export function getSuiTxUrl(
  txHash: string,
  network: Network = 'testnet',
  explorer: keyof typeof SUI_EXPLORERS = 'suiscan'
): string | null {
  // Validate transaction hash
  if (!isValidSuiTxHash(txHash)) {
    console.warn(`[Explorers] Invalid Sui transaction hash: ${txHash}`);
    return null;
  }
  
  const baseUrl = SUI_EXPLORERS[explorer][network];
  
  if (explorer === 'official') {
    // Official explorer uses search page format
    return `${baseUrl}/?network=${network}`;
  }
  
  if (explorer === 'suivision') {
    // SuiVision uses 'txblock' instead of 'tx'
    return `${baseUrl}/txblock/${txHash}`;
  }
  
  // SuiScan and default
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
 * Get Walruscan blob explorer URL
 * @param blobId - Blob ID/CID
 * @param network - Network (testnet, devnet, mainnet)
 */
export function getWalruscanBlobUrl(
  blobId: string,
  network: Network = 'testnet'
): string {
  const baseUrl = WALRUS_EXPLORERS.walruscan[network];
  return `${baseUrl}/blob/${blobId}`;
}

/**
 * Get Walruscan account blobs URL
 * @param address - Wallet address
 * @param network - Network (testnet, devnet, mainnet)
 */
export function getWalruscanAccountUrl(
  address: string,
  network: Network = 'testnet'
): string {
  const baseUrl = WALRUS_EXPLORERS.walruscan[network];
  return `${baseUrl}/account/${address}/blobs`;
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
 * Validate if a Walrus blob ID looks valid
 * @param blobId - Blob ID to validate
 * @returns true if blob ID looks valid
 */
function isValidWalrusBlobId(blobId: string): boolean {
  if (!blobId) return false;
  
  // Walrus blob IDs are typically base64url encoded (43-44 characters)
  // They contain alphanumeric, -, and _ characters
  if (blobId.length < 20) return false; // Too short
  if (!/^[A-Za-z0-9_-]+$/.test(blobId)) return false; // Invalid characters
  
  return true;
}

/**
 * Convenience function: Get Sui TX URL with current network
 * Returns null if transaction hash is invalid (e.g., mock data)
 */
export function getSuiTxUrlAuto(txHash: string): string | null {
  return getSuiTxUrl(txHash, getCurrentNetwork());
}

/**
 * Convenience function: Get Walrus blob URL with current network
 * Returns null if blob ID is invalid
 */
export function getWalrusBlobUrlAuto(blobId: string): string | null {
  if (!isValidWalrusBlobId(blobId)) {
    console.warn(`[Explorers] Invalid Walrus blob ID: ${blobId}`);
    return null;
  }
  return getWalrusBlobUrl(blobId, getCurrentNetwork());
}

