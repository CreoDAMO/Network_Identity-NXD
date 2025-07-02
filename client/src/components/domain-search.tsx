import { useState } from "react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";

export function DomainSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTld, setSelectedTld] = useState("nxd");
  
  const mockSuggestions = [
    { name: "cosmic", tld: "nxd", fullDomain: "cosmic.nxd", available: true, price: "0.5", category: "premium" },
    { name: "web3", tld: "nxd", fullDomain: "web3.nxd", available: true, price: "1.2", category: "premium" },
    { name: "defi", tld: "nxd", fullDomain: "defi.nxd", available: false, price: "2.0", category: "taken" },
    { name: "nft", tld: "nxd", fullDomain: "nft.nxd", available: true, price: "0.8", category: "available" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Interface */}
      <GlassmorphismCard className="p-8 gradient-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Enter your domain name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-cosmic-purple focus:outline-none h-14 text-lg"
          />
          
          <select 
            value={selectedTld} 
            onChange={(e) => setSelectedTld(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white h-14 w-full md:w-32"
          >
            <option value="nxd">.nxd</option>
            <option value="web3">.web3</option>
            <option value="dao">.dao</option>
          </select>
          
          <GradientButton size="lg" className="h-14 px-8">
            <i className="fas fa-search mr-2"></i>
            Search
          </GradientButton>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 3 && (
          <div className="mb-6 p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold text-white">
                  {searchQuery}.{selectedTld}
                </div>
                <span className="px-3 py-1 bg-meteor-green/20 text-meteor-green text-sm rounded-full">
                  Available
                </span>
              </div>
              
              <GradientButton size="sm">
                Register
              </GradientButton>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {searchQuery.length > 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white/90">
                <i className="fas fa-robot text-starlight-pink mr-2"></i>
                AI Suggestions
              </h3>
              <button className="text-sm text-cosmic-purple hover:text-white transition-colors">
                Get More Suggestions
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {mockSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`glassmorphism rounded-lg p-4 transition-colors cursor-pointer group ${
                    suggestion.available ? 'hover:bg-white/20' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-white">
                      {suggestion.fullDomain}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      suggestion.available ? 'bg-meteor-green' : 'bg-red-400'
                    }`}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-cosmic-purple font-medium">
                      {suggestion.price} ETH
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      suggestion.category === 'premium' ? 'bg-starlight-pink/20 text-starlight-pink' :
                      suggestion.category === 'available' ? 'bg-meteor-green/20 text-meteor-green' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {suggestion.category}
                    </div>
                  </div>
                  
                  {suggestion.available && (
                    <GradientButton size="sm" className="w-full mt-3">
                      Register
                    </GradientButton>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassmorphismCard>
    </div>
  );
}