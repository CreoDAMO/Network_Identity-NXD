import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { MarketplaceInterface } from "@/components/marketplace-interface";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { GradientButton } from "@/components/ui/gradient-button";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(2);
}

export default function MarketplacePage() {
  const [activeView, setActiveView] = useState<"browse" | "sell" | "analytics">("browse");
  const { user } = useAppStore();

  // Get marketplace data
  const { data: listings = [] } = useQuery({
    queryKey: ["/api/marketplace/listings"],
  });

  const { data: userListings = [] } = useQuery({
    queryKey: ["/api/marketplace/user", user?.id],
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Navigation */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Domain Marketplace</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveView("browse")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "browse"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-shopping-cart mr-3"></i>
                  Browse Domains
                </button>
                <button
                  onClick={() => setActiveView("sell")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "sell"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-tag mr-3"></i>
                  Sell Domains
                </button>
                <button
                  onClick={() => setActiveView("analytics")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "analytics"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-chart-bar mr-3"></i>
                  Market Analytics
                </button>
              </div>
            </GlassmorphismCard>

            {/* Market Statistics */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Market Overview</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-solar-orange mb-1">
                    {listings.length}
                  </div>
                  <div className="text-white/60 text-sm">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-meteor-green mb-1">
                    15.8 ETH
                  </div>
                  <div className="text-white/60 text-sm">24h Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-starlight-pink mb-1">
                    2.5 ETH
                  </div>
                  <div className="text-white/60 text-sm">Floor Price</div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Price Filters */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filter by Price</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Min Price (ETH)</label>
                  <input 
                    type="number" 
                    placeholder="0.0"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-cosmic-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Max Price (ETH)</label>
                  <input 
                    type="number" 
                    placeholder="100.0"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-cosmic-purple focus:outline-none"
                  />
                </div>
                <GradientButton className="w-full" size="sm" variant="solar">
                  Apply Filters
                </GradientButton>
              </div>
            </GlassmorphismCard>

            {/* Popular Categories */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Popular Categories</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-cosmic-purple rounded-full mr-3"></div>
                    <span className="text-white text-sm">Short (3-4 chars)</span>
                  </div>
                  <span className="text-white/60 text-xs">42 listed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-meteor-green rounded-full mr-3"></div>
                    <span className="text-white text-sm">DeFi Keywords</span>
                  </div>
                  <span className="text-white/60 text-xs">28 listed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-starlight-pink rounded-full mr-3"></div>
                    <span className="text-white text-sm">Gaming</span>
                  </div>
                  <span className="text-white/60 text-xs">19 listed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-solar-orange rounded-full mr-3"></div>
                    <span className="text-white text-sm">Brand Names</span>
                  </div>
                  <span className="text-white/60 text-xs">15 listed</span>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Your Listings */}
            {user && (
              <GlassmorphismCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Listings</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cosmic-purple mb-1">
                      {userListings.length}
                    </div>
                    <div className="text-white/60 text-sm">Active Listings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-meteor-green mb-1">
                      3.2 ETH
                    </div>
                    <div className="text-white/60 text-sm">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-starlight-pink mb-1">
                      0.5 ETH
                    </div>
                    <div className="text-white/60 text-sm">Last 7 Days</div>
                  </div>
                </div>
              </GlassmorphismCard>
            )}

            {/* Payment Methods */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Options</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                    <i className="fab fa-ethereum text-white text-sm"></i>
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Ethereum</div>
                    <div className="text-white/60 text-xs">ETH payments</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-cosmic-purple to-nebula-blue rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-coins text-white text-sm"></i>
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">NXD Token</div>
                    <div className="text-white/60 text-xs">Native token</div>
                  </div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Quick Actions */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <GradientButton className="w-full" size="sm" variant="cosmic">
                  <i className="fas fa-plus mr-2"></i>List Domain
                </GradientButton>
                <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition-colors text-white text-sm">
                  <i className="fas fa-heart mr-2"></i>Watchlist
                </button>
                <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition-colors text-white text-sm">
                  <i className="fas fa-download mr-2"></i>Export Data
                </button>
              </div>
            </GlassmorphismCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 bg-gradient-to-r from-solar-orange via-starlight-pink to-cosmic-purple bg-clip-text text-transparent">
                Domain Marketplace
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-6">
                Trade premium Web3 domains with secure blockchain transactions
              </p>
            </div>

            <MarketplaceInterface />
          </div>
        </div>
      </div>
    </div>
  );
}