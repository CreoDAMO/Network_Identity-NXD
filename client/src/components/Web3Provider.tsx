import React, { createContext, useContext, useEffect, useState } from 'react';
import { MetaMaskSDK } from '@metamask/sdk';
import { ethers } from 'ethers';

interface Web3ContextType {
  // MetaMask connection
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  network: any;
  provider: any;
  
  // Circle USDC integration
  usdcBalance: string | null;
  usdcContract: any;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // USDC methods
  transferUSDC: (to: string, amount: string) => Promise<string>;
  approveUSDC: (spender: string, amount: string) => Promise<string>;
  
  // Gas sponsorship (NXD Paymaster integration)
  canSponsorGas: boolean;
  nxdBalance: string | null;
  
  // Loading states
  isConnecting: boolean;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | null>(null);

// USDC contract addresses
const USDC_ADDRESSES = {
  1: '0xA0b86a33E6417c86c8BFC71c4d9b6c57F4d7F8B5', // Ethereum mainnet
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Sepolia testnet
};

// NXD Token address (will be deployed)
const NXD_TOKEN_ADDRESS = '0x...'; // To be updated when deployed

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [usdcContract, setUsdcContract] = useState<any>(null);
  const [nxdBalance, setNxdBalance] = useState<string | null>(null);
  const [canSponsorGas, setCanSponsorGas] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sdk, setSdk] = useState<MetaMaskSDK | null>(null);

  // Initialize MetaMask SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        const MMSDK = new MetaMaskSDK({
          dappMetadata: {
            name: "NXD Platform",
            url: window.location.href,
          },
          infuraAPIKey: import.meta.env.VITE_INFURA_API_KEY,
          // Enable batch requests for better performance
          useDeeplink: false,
        });

        setSdk(MMSDK);

        // Check if already connected
        const ethereum = MMSDK.getProvider();
        if (ethereum && ethereum.isConnected?.()) {
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            await handleAccountsChanged(accounts);
          }
        }
      } catch (error) {
        console.error('Failed to initialize MetaMask SDK:', error);
      }
    };

    initSDK();
  }, []);

  // Handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAccount(accounts[0]);
      setIsConnected(true);
      await updateAccountData(accounts[0]);
    }
  };

  // Handle network changes
  const handleNetworkChanged = async (networkId: string) => {
    const network = {
      chainId: parseInt(networkId, 16),
      name: getNetworkName(parseInt(networkId, 16))
    };
    setNetwork(network);
    
    // Update USDC contract for new network
    if (provider && account) {
      await setupUSDCContract(provider, parseInt(networkId, 16));
      await updateAccountData(account);
    }
  };

  // Update account data (balances, etc.)
  const updateAccountData = async (accountAddress: string) => {
    if (!provider) return;

    setIsLoading(true);
    try {
      // Get ETH balance
      const ethBalance = await provider.getBalance(accountAddress);
      setBalance(ethers.formatEther(ethBalance));

      // Get network info
      const network = await provider.getNetwork();
      setNetwork(network);

      // Setup and get USDC balance
      await setupUSDCContract(provider, Number(network.chainId));
      
      // Get NXD balance (if contract deployed)
      await updateNXDBalance(accountAddress);
      
      // Check gas sponsorship eligibility
      await checkGasSponsorshipEligibility(accountAddress);

    } catch (error) {
      console.error('Failed to update account data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup USDC contract
  const setupUSDCContract = async (ethersProvider: any, chainId: number) => {
    try {
      const usdcAddress = USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES];
      if (!usdcAddress) {
        console.warn(`USDC not supported on chain ${chainId}`);
        return;
      }

      // USDC ABI (simplified)
      const usdcAbi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)',
      ];

      const contract = new ethers.Contract(usdcAddress, usdcAbi, ethersProvider);
      setUsdcContract(contract);

      // Get USDC balance
      if (account) {
        const balance = await contract.balanceOf(account);
        const decimals = await contract.decimals();
        setUsdcBalance(ethers.formatUnits(balance, decimals));
      }
    } catch (error) {
      console.error('Failed to setup USDC contract:', error);
    }
  };

  // Update NXD balance
  const updateNXDBalance = async (accountAddress: string) => {
    try {
      // This would connect to the deployed NXD token contract
      // For now, we'll set a placeholder
      setNxdBalance('1000.0'); // Placeholder
    } catch (error) {
      console.error('Failed to get NXD balance:', error);
    }
  };

  // Check gas sponsorship eligibility
  const checkGasSponsorshipEligibility = async (accountAddress: string) => {
    try {
      // This would check with the NXD Paymaster contract
      // For now, enable for all connected users
      setCanSponsorGas(true);
    } catch (error) {
      console.error('Failed to check gas sponsorship:', error);
      setCanSponsorGas(false);
    }
  };

  // Connect wallet
  const connect = async () => {
    if (!sdk) {
      throw new Error('MetaMask SDK not initialized');
    }

    setIsConnecting(true);
    try {
      const ethereum = sdk.getProvider();
      
      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Setup ethers provider
      const ethersProvider = new ethers.BrowserProvider(ethereum);
      setProvider(ethersProvider);

      // Set up event listeners
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleNetworkChanged);

      await handleAccountsChanged(accounts);

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setBalance(null);
    setUsdcBalance(null);
    setNxdBalance(null);
    setNetwork(null);
    setProvider(null);
    setUsdcContract(null);
    setCanSponsorGas(false);

    // Remove event listeners
    if (sdk) {
      const ethereum = sdk.getProvider();
      ethereum?.removeAllListeners?.();
    }
  };

  // Transfer USDC
  const transferUSDC = async (to: string, amount: string): Promise<string> => {
    if (!usdcContract || !provider || !account) {
      throw new Error('USDC contract not available or wallet not connected');
    }

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = usdcContract.connect(signer);
      
      const decimals = await usdcContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      const tx = await contractWithSigner.transfer(to, amountInWei);
      
      // Update balance after transaction
      setTimeout(() => updateAccountData(account), 2000);
      
      return tx.hash;
    } catch (error) {
      console.error('USDC transfer failed:', error);
      throw error;
    }
  };

  // Approve USDC spending
  const approveUSDC = async (spender: string, amount: string): Promise<string> => {
    if (!usdcContract || !provider) {
      throw new Error('USDC contract not available or wallet not connected');
    }

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = usdcContract.connect(signer);
      
      const decimals = await usdcContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      const tx = await contractWithSigner.approve(spender, amountInWei);
      return tx.hash;
    } catch (error) {
      console.error('USDC approval failed:', error);
      throw error;
    }
  };

  // Helper function to get network name
  const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      137: 'Polygon',
      8453: 'Base',
      11155111: 'Sepolia Testnet',
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  const value: Web3ContextType = {
    isConnected,
    account,
    balance,
    network,
    provider,
    usdcBalance,
    usdcContract,
    connect,
    disconnect,
    transferUSDC,
    approveUSDC,
    canSponsorGas,
    nxdBalance,
    isConnecting,
    isLoading,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

// Web3 Connection Component
export function Web3ConnectionButton() {
  const { isConnected, account, connect, disconnect, isConnecting, balance, usdcBalance, network } = useWeb3();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <div className="font-medium text-white">
            {`${account.slice(0, 6)}...${account.slice(-4)}`}
          </div>
          <div className="text-white/60">
            {network?.name || 'Unknown Network'}
          </div>
        </div>
        
        <div className="text-sm text-white/80">
          <div>ETH: {balance ? parseFloat(balance).toFixed(4) : '0.0'}</div>
          <div>USDC: {usdcBalance ? parseFloat(usdcBalance).toFixed(2) : '0.0'}</div>
        </div>
        
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-2 bg-gradient-to-r from-cosmic-purple to-nebula-blue hover:from-cosmic-purple/80 hover:to-nebula-blue/80 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}