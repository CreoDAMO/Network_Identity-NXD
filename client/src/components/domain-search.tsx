import { useState, useEffect } from "react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Search } from 'lucide-react';

export default function DomainSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [domainSuggestions] = useState([
    "bitcoin.nxd", 
    "ethereum.web3", 
    "defi.dao", 
    "nft.nxd",
    "metaverse.nxd",
    "web3.dao",
    "crypto.nxd",
    "blockchain.web3"
  ]);

  const handleSearch = async (term: string) => {
    if (!term.trim()) return;

    setIsSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock results
    const mockResults = [
      { name: term, tld: "nxd", available: true, price: "0.1 ETH" },
      { name: term, tld: "web3", available: false, price: "0.05 ETH" },
      { name: term, tld: "dao", available: true, price: "0.08 ETH" },
    ];

    setSearchResults(mockResults);
    setIsSearching(false);
  };

  useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm);
    }
  }, [searchTerm]);

  return (
    <GlassmorphismCard className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for your perfect domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg 
                     text-white placeholder-white/60 focus:outline-none focus:border-cosmic-purple 
                     transition-colors"
          />
        </div>
        <GradientButton>
          <Search className="w-4 h-4 mr-2" />
          Search
        </GradientButton>
      </div>

      {isSearching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-purple mx-auto"></div>
          <p className="text-white/60 mt-4">Searching available domains...</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold mb-4">Search Results</h3>
          {searchResults.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${result.available ? 'bg-meteor-green' : 'bg-red-400'}`}></div>
                <span className="text-white font-medium">{result.name}.{result.tld}</span>
                <span className="text-white/60">{result.price}</span>
              </div>
              <div className="flex items-center space-x-3">
                {result.available ? (
                  <GradientButton size="sm">Register</GradientButton>
                ) : (
                  <span className="text-red-400 text-sm">Taken</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Domain Suggestions */}
      <div className="mt-8">
        <h3 className="text-white font-semibold mb-4">Trending Domains</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {domainSuggestions.slice(0, 4).map((domain) => (
            <button
              key={domain}
              onClick={() => setSearchTerm(domain.split('.')[0])}
              className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 
                       transition-colors text-white/80 hover:text-white text-sm"
            >
              {domain}
            </button>
          ))}
        </div>
      </div>
    </GlassmorphismCard>
  );
}