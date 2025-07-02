import { create } from 'zustand';
import { User, Domain, StakingPosition, Proposal, MarketplaceListing, DomainSuggestion } from '@shared/schema';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Domain state
  userDomains: Domain[];
  domainSuggestions: DomainSuggestion[];
  
  // Staking state
  stakingPosition: StakingPosition | null;
  stakingStats: {
    totalStaked: string;
    currentApy: string;
    poolUtilization: number;
    nextRewardTime: string;
  } | null;
  
  // Governance state
  proposals: Proposal[];
  activeProposals: Proposal[];
  
  // Marketplace state
  marketplaceListings: MarketplaceListing[];
  
  // AI state
  chatMessages: Array<{
    id: string;
    message: string;
    response: string;
    timestamp: Date;
    type: 'user' | 'ai';
  }>;
  
  // UI state
  isLoading: boolean;
  currentSection: string;
  walletConnected: boolean;
  walletAddress: string | null;
  nxdBalance: string;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setUserDomains: (domains: Domain[]) => void;
  setDomainSuggestions: (suggestions: DomainSuggestion[]) => void;
  setStakingPosition: (position: StakingPosition | null) => void;
  setStakingStats: (stats: any) => void;
  setProposals: (proposals: Proposal[]) => void;
  setActiveProposals: (proposals: Proposal[]) => void;
  setMarketplaceListings: (listings: MarketplaceListing[]) => void;
  addChatMessage: (message: string, response: string, type: 'user' | 'ai') => void;
  setLoading: (loading: boolean) => void;
  setCurrentSection: (section: string) => void;
  connectWallet: (address: string, balance: string) => void;
  disconnectWallet: () => void;
  updateNXDBalance: (balance: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  userDomains: [],
  domainSuggestions: [],
  stakingPosition: null,
  stakingStats: null,
  proposals: [],
  activeProposals: [],
  marketplaceListings: [],
  chatMessages: [],
  isLoading: false,
  currentSection: 'home',
  walletConnected: false,
  walletAddress: null,
  nxdBalance: '0',

  // Actions
  setUser: (user) => set({ user }),
  
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  
  setUserDomains: (domains) => set({ userDomains: domains }),
  
  setDomainSuggestions: (suggestions) => set({ domainSuggestions: suggestions }),
  
  setStakingPosition: (position) => set({ stakingPosition: position }),
  
  setStakingStats: (stats) => set({ stakingStats: stats }),
  
  setProposals: (proposals) => set({ proposals }),
  
  setActiveProposals: (proposals) => set({ activeProposals: proposals }),
  
  setMarketplaceListings: (listings) => set({ marketplaceListings: listings }),
  
  addChatMessage: (message, response, type) => {
    const newMessage = {
      id: Date.now().toString(),
      message: type === 'user' ? message : '',
      response: type === 'ai' ? response : '',
      timestamp: new Date(),
      type,
    };
    
    set((state) => ({
      chatMessages: [...state.chatMessages, newMessage],
    }));
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setCurrentSection: (section) => set({ currentSection: section }),
  
  connectWallet: (address, balance) =>
    set({
      walletConnected: true,
      walletAddress: address,
      nxdBalance: balance,
    }),
  
  disconnectWallet: () =>
    set({
      walletConnected: false,
      walletAddress: null,
      nxdBalance: '0',
    }),
  
  updateNXDBalance: (balance) => set({ nxdBalance: balance }),
}));
