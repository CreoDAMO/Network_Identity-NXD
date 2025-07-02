import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { debounce, validateDomainName } from "@/lib/utils";
import { DomainSuggestion } from "@shared/schema";

export function DomainSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTld, setSelectedTld] = useState("nxd");
  const [validationError, setValidationError] = useState("");
  const queryClient = useQueryClient();
  const { user, setDomainSuggestions, domainSuggestions } = useAppStore();

  // Get available TLDs
  const { data: tlds = [] } = useQuery({
    queryKey: ["/api/tlds"],
  });

  // Domain availability check
  const { data: availabilityData, isLoading: isCheckingAvailability } = useQuery({
    queryKey: ["/api/domains/check", `${searchQuery}.${selectedTld}`],
    enabled: searchQuery.length >= 3 && !validationError,
  });

  // AI domain suggestions
  const suggestionsMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/ai/suggest-domains", {
        query,
        context: "general",
        tld: selectedTld,
        maxSuggestions: 8,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setDomainSuggestions(data.suggestions);
    },
  });

  // Domain registration
  const registerMutation = useMutation({
    mutationFn: async (domainData: any) => {
      const response = await apiRequest("POST", "/api/domains/register", domainData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains/user"] });
    },
  });

  const debouncedSuggestions = useCallback(
    debounce((query: string) => {
      if (query.length >= 3) {
        suggestionsMutation.mutate(query);
      }
    }, 500),
    [selectedTld]
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    const validation = validateDomainName(value);
    setValidationError(validation.error || "");
    
    if (validation.isValid) {
      debouncedSuggestions(value);
    }
  };

  const handleRegisterDomain = async (suggestion: DomainSuggestion) => {
    if (!user) return;

    const tld = tlds.find(t => t.name === suggestion.tld);
    if (!tld) return;

    const domainData = {
      name: suggestion.name,
      tld: suggestion.tld,
      fullDomain: suggestion.fullDomain,
      ownerId: user.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isPremium: suggestion.category === "premium",
      registrationPrice: suggestion.price,
      userAddress: "0x1234567890123456789012345678901234567890", // Mock address
    };

    registerMutation.mutate(domainData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Interface */}
      <GlassmorphismCard className="p-8 gradient-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter your domain name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-cosmic-purple focus:border-transparent h-14 text-lg"
              error={validationError}
            />
            {validationError && (
              <p className="text-red-400 text-sm mt-2">{validationError}</p>
            )}
          </div>
          
          <Select value={selectedTld} onValueChange={setSelectedTld}>
            <SelectTrigger className="w-full md:w-32 bg-white/10 border-white/20 text-white h-14">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tlds.map((tld) => (
                <SelectItem key={tld.name} value={tld.name}>
                  .{tld.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <GradientButton
            size="lg"
            disabled={!searchQuery || !!validationError || isCheckingAvailability}
            className="h-14 px-8"
          >
            <i className="fas fa-search mr-2"></i>
            {isCheckingAvailability ? "Checking..." : "Search"}
          </GradientButton>
        </div>

        {/* Availability Status */}
        {searchQuery.length >= 3 && !validationError && (
          <div className="mb-6 p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold text-white">
                  {searchQuery}.{selectedTld}
                </div>
                {isCheckingAvailability ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-cosmic-purple border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white/70">Checking...</span>
                  </div>
                ) : availabilityData?.available ? (
                  <span className="px-3 py-1 bg-meteor-green/20 text-meteor-green text-sm rounded-full">
                    Available
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">
                    Taken
                  </span>
                )}
              </div>
              
              {availabilityData?.available && (
                <GradientButton
                  onClick={() => handleRegisterDomain({
                    name: searchQuery,
                    tld: selectedTld,
                    fullDomain: `${searchQuery}.${selectedTld}`,
                    available: true,
                    price: tlds.find(t => t.name === selectedTld)?.basePrice || "0.1",
                    category: "available"
                  })}
                  disabled={registerMutation.isPending}
                  size="sm"
                >
                  {registerMutation.isPending ? "Registering..." : "Register"}
                </GradientButton>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {domainSuggestions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white/90">
                <i className="fas fa-robot text-starlight-pink mr-2"></i>
                AI Suggestions
              </h3>
              <button
                onClick={() => suggestionsMutation.mutate(searchQuery)}
                disabled={suggestionsMutation.isPending}
                className="text-sm text-cosmic-purple hover:text-white transition-colors"
              >
                {suggestionsMutation.isPending ? "Generating..." : "Get More Suggestions"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {domainSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="glassmorphism rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer group"
                  onClick={() => suggestion.available && handleRegisterDomain(suggestion)}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-white mb-1">
                      {suggestion.fullDomain}
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          suggestion.category === "available"
                            ? "bg-meteor-green/20 text-meteor-green"
                            : suggestion.category === "premium"
                            ? "bg-solar-orange/20 text-solar-orange"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {suggestion.category === "available"
                          ? "Available"
                          : suggestion.category === "premium"
                          ? "Premium"
                          : "Taken"}
                      </span>
                      {suggestion.available && (
                        <span className="text-xs text-white/70">
                          {suggestion.price} ETH
                        </span>
                      )}
                    </div>
                    
                    {suggestion.available && (
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-cosmic-purple">Click to register</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassmorphismCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <GlassmorphismCard className="p-6 hover-glow">
          <div className="text-3xl font-bold text-cosmic-purple mb-2">125,847</div>
          <div className="text-white/70">Domains Registered</div>
        </GlassmorphismCard>
        
        <GlassmorphismCard className="p-6 hover-glow">
          <div className="text-3xl font-bold text-nebula-blue mb-2">₦ 2.4M</div>
          <div className="text-white/70">NXD Staked</div>
        </GlassmorphismCard>
        
        <GlassmorphismCard className="p-6 hover-glow">
          <div className="text-3xl font-bold text-starlight-pink mb-2">18.5%</div>
          <div className="text-white/70">Current APY</div>
        </GlassmorphismCard>
      </div>
    </div>
  );
}
