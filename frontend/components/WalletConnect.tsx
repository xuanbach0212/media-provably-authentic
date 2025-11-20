'use client';

/**
 * Wallet Connection Component
 * Provides UI for connecting/disconnecting Sui wallet
 */

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function WalletConnect() {
  const account = useCurrentAccount();

  return (
    <div className="flex items-center gap-4">
      {account && (
        <div className="text-sm text-gray-600">
          <div className="font-medium">Connected Wallet</div>
          <div className="font-mono text-xs">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </div>
        </div>
      )}
      <ConnectButton />
    </div>
  );
}

