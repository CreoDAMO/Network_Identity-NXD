import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAppStore } from "@/store/useAppStore";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { walletConnected, walletAddress, nxdBalance, connectWallet, disconnectWallet } = useAppStore();

  const navItems = [
    { href: "/", label: "Home", section: "home" },
    { href: "/domains", label: "Domains", section: "domains" },
    { href: "/staking", label: "Staking", section: "staking" },
    { href: "/governance", label: "Governance", section: "governance" },
    { href: "/marketplace", label: "Marketplace", section: "marketplace" },
    { href: "/ai", label: "AI Assistant", section: "ai" },
    { href: "/investor", label: "Investor Dashboard", section: "investor" },
    { href: "/admin", label: "Admin Panel", section: "admin" },
  ];

  const handleWalletConnect = async () => {
    if (walletConnected) {
      disconnectWallet();
    } else {
      // Mock wallet connection
      const mockAddress = "0x742d35cc6635c0532925a3b8d2b3c37b3fd5f4f3";
      const mockBalance = (Math.random() * 50000).toFixed(2);
      connectWallet(mockAddress, mockBalance);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a href="/" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-cosmic-purple to-nebula-blue rounded-xl flex items-center justify-center">
                <i className="fas fa-cube text-white text-xl"></i>
              </div>
              <h1 className="text-2xl font-orbitron font-bold bg-gradient-to-r from-cosmic-purple to-starlight-pink bg-clip-text text-transparent">
                NXD
              </h1>
            </a>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.slice(1).map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "text-white/80 hover:text-white transition-colors",
                    location === item.href && "text-white font-semibold"
                  )}
                >
                  {item.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Wallet & User Info */}
          <div className="flex items-center space-x-4">
            {walletConnected && (
              <div className="hidden md:flex items-center space-x-2 glassmorphism px-4 py-2 rounded-full">
                <i className="fas fa-coins text-solar-orange"></i>
                <span className="text-sm font-semibold">{parseFloat(nxdBalance).toLocaleString()} NXD</span>
              </div>
            )}

            <GradientButton
              onClick={handleWalletConnect}
              size="sm"
            >
              {walletConnected ? (
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-meteor-green rounded-full"></div>
                  <span>{formatAddress(walletAddress!)}</span>
                </span>
              ) : (
                "Connect Wallet"
              )}
            </GradientButton>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/20">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "text-white/80 hover:text-white transition-colors py-2",
                      location === item.href && "text-white font-semibold"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}

              {walletConnected && (
                <div className="flex items-center space-x-2 glassmorphism px-4 py-2 rounded-full self-start">
                  <i className="fas fa-coins text-solar-orange"></i>
                  <span className="text-sm font-semibold">{parseFloat(nxdBalance).toLocaleString()} NXD</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}