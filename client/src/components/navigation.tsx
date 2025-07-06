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
  Crown,
  Sparkles,
  Moon,
  Sun
} from "lucide-react";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="font-orbitron font-bold text-2xl bg-gradient-to-r from-cosmic-purple to-nebula-blue bg-clip-text text-transparent">
            <a href="/" className="hover:scale-105 transition-transform">NXD</a>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/domains" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Domains
            </a>
            <a href="/staking" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Staking
            </a>
            <a href="/governance" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Governance
            </a>
            <a href="/marketplace" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Marketplace
            </a>
            <a href="/services" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Services
            </a>
            <a href="/investor" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Investor Dashboard
            </a>
            <a href="/investor-enhanced" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Enhanced Analytics
            </a>
             <a href="/comprehensive" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Comprehensive Dashboard
            </a>
            <a href="/token-studio" className="text-sm text-white/80 hover:text-white transition-colors hover:scale-105 transform duration-200">
              Token Studio
            </a>
          </div>
        </div>

        {/* Web3 Wallet Connection */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Web3ConnectionButton />

          {/* Wallet info with improved styling */}
          {walletConnected && (
              <div className="relative">
                <Button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="bg-gradient-to-r from-cosmic-purple to-nebula-blue hover:from-cosmic-purple/80 hover:to-nebula-blue/80 text-white border-0"
                >
                  <User className="w-4 h-4 mr-2" />
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>

                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-xl bg-gray-900/95 backdrop-blur-md border border-white/20 focus:outline-none z-50">
                    <div className="py-2" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-sm text-white/90 mb-2">
                          Balance: <Badge className="bg-cosmic-purple/20 text-cosmic-purple border-cosmic-purple/30">{nxdBalance} NXD</Badge>
                        </div>
                        <div className="text-sm text-white/90">
                          ETH: <Badge className="bg-nebula-blue/20 text-nebula-blue border-nebula-blue/30">{ethBalance} ETH</Badge>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <div className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/90 hover:text-white transition-colors">
                          <User className="w-4 h-4 inline mr-3" />
                          Profile
                        </div>
                        <div className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/90 hover:text-white transition-colors">
                          <Settings className="w-4 h-4 inline mr-3" />
                          Settings
                        </div>

                        <div 
                          className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/90 hover:text-white transition-colors"
                          onClick={() => setLocation('/admin')}
                        >
                          <Shield className="w-4 h-4 inline mr-3 text-cosmic-purple" />
                          <span className="text-white font-medium">Admin Panel</span>
                        </div>

                        <div 
                          className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/90 hover:text-white transition-colors"
                          onClick={() => setLocation('/investor')}
                        >
                          <Shield className="w-4 h-4 inline mr-3 text-meteor-green" />
                          <span className="text-white">Investor Dashboard</span>
                        </div>
                        <div 
                          className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/90 hover:text-white transition-colors"
                          onClick={() => setLocation('/comprehensive')}
                        >
                          <Crown className="w-4 h-4 inline mr-3 text-solar-orange" />
                          <span className="text-white">Comprehensive Dashboard</span>
                        </div>
                        <div 
                          className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/90 hover:text-white transition-colors"
                          onClick={() => setLocation('/tokens')}
                        >
                          <Sparkles className="w-4 h-4 inline mr-3 text-starlight-pink" />
                          <span className="text-white">Token Generator</span>
                        </div>
                        <div 
                          className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/90 hover:text-white transition-colors"
                          onClick={() => setLocation('/token-studio')}
                        >
                          <Sparkles className="w-4 h-4 inline mr-3 text-nebula-blue" />
                          <span className="text-white">Token Studio</span>
                        </div>

                        <div className="border-t border-white/10 mt-1 pt-1">
                          <div 
                            className="px-4 py-2 hover:bg-red-500/10 cursor-pointer text-red-400 hover:text-red-300 transition-colors"
                            onClick={() => disconnectWalletStore()}
                          >
                            <LogOut className="w-4 h-4 inline mr-3" />
                            <span>Disconnect</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Mobile Menu Button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden border-white/20 text-white hover:bg-white/10 hover:text-white" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
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
        <div className="border-t border-white/10 md:hidden bg-gray-900/95 backdrop-blur-md">
          <div className="flex flex-col space-y-2 p-4">
            <a href="/domains" className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Domains
            </a>
            <a href="/staking" className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Staking
            </a>
            <a href="/governance" className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Governance
            </a>
            <a href="/marketplace" className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Marketplace
            </a>
            <a href="/services" className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Services
            </a>
            <a href="/investor" className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Investor Dashboard
            </a>
            <a href="/investor-enhanced" className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Enhanced Analytics
            </a>
            <a href="/token-studio" className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Token Studio
            </a>
             <a 
              href="/admin" 
              className="block py-3 px-3 rounded-lg text-sm text-white/90 hover:text-white hover:bg-cosmic-purple/20 transition-colors font-medium border border-cosmic-purple/30"
            >
              <Shield className="w-4 h-4 inline mr-2 text-cosmic-purple" />
              Admin Panel
            </a>
            <a 
              href="/comprehensive" 
              className="block py-3 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Comprehensive Dashboard
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}