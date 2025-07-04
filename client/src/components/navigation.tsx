import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useWeb3, Web3ConnectionButton } from "@/components/Web3Provider";
import { 
  Wallet, 
  User, 
  LogOut, 
  Settings,
  Shield,
  ChevronDown,
  Menu,
  X,
  Crown
} from "lucide-react";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { 
    walletAddress, 
    walletConnected, 
    nxdBalance, 
    ethBalance,
    isAdmin,
    connectWallet: connectWalletStore,
    disconnectWallet: disconnectWalletStore 
  } = useAppStore();

  // Legacy wallet removed - now using Web3Provider

  // Web3 provider now handles wallet state management

  return (
    <nav className="bg-background border-b">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="font-semibold text-2xl">
            <a href="/">NXD</a>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/domains" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Domains
            </a>
            <a href="/staking" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Staking
            </a>
            <a href="/governance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Governance
            </a>
            <a href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </a>
            <a href="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Services
            </a>
            <a href="/investor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Investor Dashboard
            </a>
            <a href="/investor-enhanced" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Enhanced Analytics
            </a>
             <a href="/comprehensive" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Comprehensive Dashboard
            </a>
          </div>
        </div>

        {/* Web3 Wallet Connection */}
        <div className="flex items-center space-x-4">
          <Web3ConnectionButton />
          
          {/* Legacy wallet info - will be replaced by Web3 context */}
          {walletConnected && (
              <div className="relative">
                <Button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  <User className="w-4 h-4 mr-2" />
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>

                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <div className="px-4 py-2 text-sm text-gray-700" role="menuitem">
                        Balance: <Badge variant="secondary">{nxdBalance} NXD</Badge>
                      </div>
                      <div className="px-4 py-2 text-sm text-gray-700" role="menuitem">
                        ETH: <Badge variant="secondary">{ethBalance} ETH</Badge>
                      </div>
                      <div className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/80 hover:text-white transition-colors">
                        <User className="w-4 h-4 inline mr-2" />
                        Profile
                      </div>
                      <div className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/80 hover:text-white transition-colors">
                        <Settings className="w-4 h-4 inline mr-2" />
                        Settings
                      </div>

                      <div 
                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/80 hover:text-white transition-colors"
                        onClick={() => setLocation('/admin')}
                      >
                        <Shield className="w-4 h-4 inline mr-2" />
                        Admin Panel
                      </div>

                      <div 
                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/80 hover:text-white transition-colors"
                        onClick={() => setLocation('/investor')}
                      >
                        <Shield className="w-4 h-4 inline mr-2" />
                        Investor Dashboard
                      </div>
                      <div 
                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/80 hover:text-white transition-colors"
                        onClick={() => setLocation('/comprehensive')}
                      >
                        <Crown className="w-4 h-4 inline mr-2" />
                        Comprehensive Dashboard
                      </div>
                      <div 
                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/80 hover:text-white transition-colors"
                        onClick={() => setLocation('/tokens')}
                      >
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        Token Generator
                      </div>

                      <div 
                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/80 hover:text-white transition-colors"
                        onClick={handleDisconnectWallet}
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Disconnect
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Mobile Menu Button */}
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t md:hidden">
          <div className="flex flex-col space-y-3 p-4">
            <a href="/domains" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Domains
            </a>
            <a href="/staking" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Staking
            </a>
            <a href="/governance" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Governance
            </a>
            <a href="/marketplace" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </a>
            <a href="/services" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Services
            </a>
            <a href="/investor" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Investor Dashboard
            </a>
            <a href="/investor-enhanced" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Enhanced Analytics
            </a>
             <a 
              href="/admin" 
              className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Panel
            </a>
            <a 
              href="/comprehensive" 
              className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Comprehensive Dashboard
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}