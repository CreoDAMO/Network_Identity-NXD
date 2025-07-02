import { create } from 'zustand';
import { User, Domain, StakingPosition, Proposal, MarketplaceListing } from '../../../shared/schema';

interface AppState {
  // User authentication
  user: User | null;
  isAuthenticated: boolean;
  
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
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
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
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    userDomains: [], 
    selectedDomain: null,
    stakingPosition: null 
  }),
}));