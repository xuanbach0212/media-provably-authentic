'use client';

/**
 * Sui Wallet Provider
 * Wraps the app with Sui wallet integration for authentication
 */

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import '@mysten/dapp-kit/dist/index.css';

// Create a client
const queryClient = new QueryClient();

// Configure Sui networks
const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  devnet: { url: getFullnodeUrl('devnet') },
};

const defaultNetwork = 'testnet';

interface AppWalletProviderProps {
  children: ReactNode;
}

export function AppWalletProvider({ children }: AppWalletProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

