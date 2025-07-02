import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTimeRemaining, formatNumber, formatAddress } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface MarketplaceFilters {
  minPrice: string;
  maxPrice: string;
  tld: string;
  length: string[];
  paymentMethod: string;
  sortBy: string;
}

export function MarketplaceInterface() {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    minPrice: "",
    maxPrice: "",
    tld: "all",
    length: [],
    paymentMethod: "all",
    sortBy: "price_low_high",
  });

  const { user, walletAddress } = useAppStore();
  const queryClient = useQueryClient();

  // Get marketplace listings
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["/api/marketplace/listings", { active: true }],
  });

  // Purchase domain mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ listingId, paymentToken }: { listingId: number; paymentToken: "ETH" | "NXD" }) => {
      const response = await apiRequest("POST", `/api/marketplace/purchase/${listingId}`, {
        buyerAddress: walletAddress || "0x1234567890123456789012345678901234567890",
        paymentToken,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
    },
  });

  const handleFilterChange = (key: keyof MarketplaceFilters, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLengthToggle = (length: string) => {
    setFilters(prev => ({
      ...prev,
      length: prev.length.includes(length) 
        ? prev.length.filter(l => l !== length)
        : [...prev.length, length],
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "premium": return { icon: "fa-gem", color: "from-starlight-pink to-solar-orange" };
      case "hot": return { icon: "fa-fire", color: "from-red-500 to-orange-500" };
      case "new": return { icon: "fa-star", color: "from-meteor-green to-nebula-blue" };
      case "featured": return { icon: "fa-rocket", color: "from-cosmic-purple to-starlight-pink" };
      case "rising": return { icon: "fa-chart-line", color: "from-nebula-blue to-meteor-green" };
      case "rare": return { icon: "fa-lightning", color: "from-solar-orange to-starlight-pink" };
      default: return { icon: "fa-globe", color: "from-cosmic-purple to-nebula-blue" };
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "premium": return "bg-solar-orange/20 text-solar-orange";
      case "hot": return "bg-red-500/20 text-red-400";
      case "new": return "bg-nebula-blue/20 text-nebula-blue";
      case "featured": return "bg-cosmic-purple/20 text-cosmic-purple";
      case "rising": return "bg-meteor-green/20 text-meteor-green";
      case "rare": return "bg-starlight-pink/20 text-starlight-pink";
      default: return "bg-white/20 text-white";
    }
  };

  // Filter and sort listings
  const filteredListings = listings.filter(listing => {
    if (filters.tld !== "all" && listing.domain.tld !== filters.tld) return false;
    if (filters.minPrice && parseFloat(listing.priceETH || "0") < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && parseFloat(listing.priceETH || "0") > parseFloat(filters.maxPrice)) return false;
    if (filters.paymentMethod === "eth" && !listing.priceETH) return false;
    if (filters.paymentMethod === "nxd" && !listing.priceNXD) return false;
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case "price_high_low":
        return parseFloat(b.priceETH || "0") - parseFloat(a.priceETH || "0");
      case "recently_listed":
        return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
      case "ending_soon":
        return new Date(a.endsAt || "").getTime() - new Date(b.endsAt || "").getTime();
      default: // price_low_high
        return parseFloat(a.priceETH || "0") - parseFloat(b.priceETH || "0");
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters */}
      <GlassmorphismCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 mb-2">Price Range (ETH)</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 text-sm"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 mb-2">TLD</label>
            <Select value={filters.tld} onValueChange={(value) => handleFilterChange("tld", value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All TLDs</SelectItem>
                <SelectItem value="nxd">.nxd</SelectItem>
                <SelectItem value="web3">.web3</SelectItem>
                <SelectItem value="dao">.dao</SelectItem>
                <SelectItem value="defi">.defi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-white/70 mb-2">Length</label>
            <div className="space-y-2">
              {["3", "4", "5+"].map((length) => (
                <label key={length} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.length.includes(length)}
                    onChange={() => handleLengthToggle(length)}
                    className="rounded border-white/20 bg-white/10 text-cosmic-purple focus:ring-cosmic-purple"
                  />
                  <span className="text-white/80 text-sm">{length} characters</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white/70 mb-2">Payment</label>
            <div className="space-y-2">
              {[
                { value: "all", label: "All" },
                { value: "eth", label: "ETH" },
                { value: "nxd", label: "NXD" },
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value={option.value}
                    checked={filters.paymentMethod === option.value}
                    onChange={(e) => handleFilterChange("paymentMethod", e.target.value)}
                    className="border-white/20 bg-white/10 text-cosmic-purple focus:ring-cosmic-purple"
                  />
                  <span className="text-white/80 text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <GradientButton className="w-full">
            Apply Filters
          </GradientButton>
        </div>
      </GlassmorphismCard>

      {/* Domain Listings */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-white/70">Sort by:</span>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_low_high">Price: Low to High</SelectItem>
                <SelectItem value="price_high_low">Price: High to Low</SelectItem>
                <SelectItem value="recently_listed">Recently Listed</SelectItem>
                <SelectItem value="ending_soon">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-white/70">
            {filteredListings.length.toLocaleString()} domains
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <GlassmorphismCard key={i} className="p-6">
                <div className="loading-shimmer h-4 rounded mb-4"></div>
                <div className="loading-shimmer h-6 rounded mb-2"></div>
                <div className="loading-shimmer h-4 rounded w-3/4 mb-4"></div>
                <div className="loading-shimmer h-10 rounded"></div>
              </GlassmorphismCard>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <GlassmorphismCard className="p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-cosmic-purple to-nebula-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Domains Found</h3>
              <p className="text-white/70 mb-6">Try adjusting your filters to see more results.</p>
              <GradientButton onClick={() => setFilters({
                minPrice: "", maxPrice: "", tld: "all", length: [], paymentMethod: "all", sortBy: "price_low_high"
              })}>
                Clear Filters
              </GradientButton>
            </GlassmorphismCard>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map((listing) => {
                const categoryData = getCategoryIcon(listing.category);
                
                return (
                  <GlassmorphismCard key={listing.id} className="p-6 hover-glow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 bg-gradient-to-br ${categoryData.color} rounded-lg flex items-center justify-center`}>
                          <i className={`fas ${categoryData.icon} text-white text-sm`}></i>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(listing.category)}`}>
                          {listing.category}
                        </span>
                      </div>
                      <button className="text-white/60 hover:text-white transition-colors">
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{listing.domain.fullDomain}</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-white/60 text-sm">owned by</span>
                      <span className="text-cosmic-purple text-sm">
                        {formatAddress(listing.seller.walletAddress || "0x1234...abcd")}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {listing.priceETH && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">ETH Price</span>
                          <span className="text-white font-semibold">{formatNumber(listing.priceETH)} ETH</span>
                        </div>
                      )}
                      {listing.priceNXD && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">NXD Price</span>
                          <span className="text-meteor-green font-semibold">{formatNumber(listing.priceNXD)} NXD</span>
                        </div>
                      )}
                      {listing.endsAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Ends in</span>
                          <span className="text-starlight-pink">{formatTimeRemaining(new Date(listing.endsAt))}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <GradientButton
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const paymentToken = listing.preferredPayment === "nxd" ? "NXD" : "ETH";
                          purchaseMutation.mutate({ listingId: listing.id, paymentToken });
                        }}
                        disabled={purchaseMutation.isPending || !user}
                      >
                        {purchaseMutation.isPending ? "Buying..." : "Buy Now"}
                      </GradientButton>
                      <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                        <i className="fas fa-gavel"></i>
                      </button>
                    </div>
                  </GlassmorphismCard>
                );
              })}
            </div>

            {/* Pagination */}
            {filteredListings.length > 12 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-white">
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button className="px-4 py-2 bg-cosmic-purple text-white rounded-lg">1</button>
                  <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-white">2</button>
                  <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-white">3</button>
                  <span className="px-4 py-2 text-white/60">...</span>
                  <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-white">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
