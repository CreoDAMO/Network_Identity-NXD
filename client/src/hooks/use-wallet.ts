
import { useState, useEffect, useCallback } from 'react';

export interface WalletInfo {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (accounts: string[]) => void) => void;
      removeListener: (event: string, handler: (accounts: string[]) => void) => void;
    };
  }
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
  });

  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true }));
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      // Convert hex to decimal
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      const chainIdDecimal = parseInt(chainId, 16);

      setWallet({
        address,
        balance: balanceInEth.toFixed(4),
        chainId: chainIdDecimal,
        isConnected: true,
        isConnecting: false,
      });

      // Store in localStorage for persistence
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', address);

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setWallet(prev => ({ ...prev, isConnecting: false }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
    });
    setError(null);
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      const isConnected = localStorage.getItem('wallet_connected') === 'true';
      if (!isConnected) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          await connectWallet();
        } else {
          disconnectWallet();
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
        disconnectWallet();
      }
    };

    checkConnection();
  }, [connectWallet, disconnectWallet]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== wallet.address) {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Reload the page when chain changes
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [wallet.address, connectWallet, disconnectWallet]);

  return {
    wallet,
    error,
    connectWallet,
    disconnectWallet,
  };
}
