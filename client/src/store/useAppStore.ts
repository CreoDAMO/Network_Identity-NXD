import { create } from 'zustand';
import { User, Domain, StakingPosition, Proposal, MarketplaceListing } from '../../../shared/schema';

interface AppState {
  // User authentication
  user: User | null;
  isAuthenticated: boolean;

  // Wallet
  walletAddress: string | null;
  walletConnected: boolean;
  nxdBalance: string;
  ethBalance: string;
  chainId: number | null;
  isLoading: boolean;
  isAdmin: boolean;

  // Domain management
  userDomains: Domain[];
  selectedDomain: Domain | null;

  // Staking
  stakingPosition: StakingPosition | null;

  // Navigation
  activeSection: 'domains' | 'staking' | 'governance' | 'marketplace';
  sidebarOpen: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setUserDomains: (domains: Domain[]) => void;
  setSelectedDomain: (domain: Domain | null) => void;
  setStakingPosition: (position: StakingPosition | null) => void;
  setActiveSection: (section: 'domains' | 'staking' | 'governance' | 'marketplace') => void;
  setSidebarOpen: (open: boolean) => void;
  connectWallet: (address: string, chainId?: number) => void;
  disconnectWallet: () => void;
  updateBalances: (nxd: string, eth: string) => void;
  setLoading: (loading: boolean) => void;
  checkAdminStatus: (address: string) => void;
  logout: () => void;
}

// Admin wallet addresses - in production, this would be stored securely
const ADMIN_ADDRESSES = [
  "0x742d35cc6635c0532925a3b8d2b3c37b3fd5f4f3".toLowerCase(), // Main admin
  "0x1234567890123456789012345678901234567890".toLowerCase(), // Secondary admin
];

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  walletAddress: null,
  walletConnected: false,
  nxdBalance: "0",
  ethBalance: "0",
  chainId: null,
  isLoading: false,
  isAdmin: false,
  userDomains: [],
  selectedDomain: null,
  stakingPosition: null,
  activeSection: 'domains',
  sidebarOpen: false,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setUserDomains: (userDomains) => set({ userDomains }),
  setSelectedDomain: (selectedDomain) => set({ selectedDomain }),
  setStakingPosition: (stakingPosition) => set({ stakingPosition }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  connectWallet: (address: string, chainId?: number) => {
    const lowerAddress = address.toLowerCase();
    const isAdmin = ADMIN_ADDRESSES.includes(lowerAddress);

    set({
      walletAddress: lowerAddress,
      walletConnected: true,
      chainId: chainId || null,
      isAdmin,
    });
  },
  disconnectWallet: () => {
    set({
      walletAddress: null,
      walletConnected: false,
      nxdBalance: "0",
      ethBalance: "0",
      chainId: null,
      isAdmin: false,
    });
  },
  updateBalances: (nxd: string, eth: string) => {
    set({
      nxdBalance: nxd,
      ethBalance: eth,
    });
  },
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  checkAdminStatus: (address: string) => {
    const isAdmin = ADMIN_ADDRESSES.includes(address.toLowerCase());
    set({ isAdmin });
  },
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    walletConnected: false,
    walletAddress: null,
    nxdBalance: "0",
    ethBalance: "0",
    chainId: null,
    isAdmin: false,
    userDomains: [], 
    selectedDomain: null,
    stakingPosition: null 
  }),
}));