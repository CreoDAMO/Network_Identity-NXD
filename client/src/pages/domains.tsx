import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { DomainSearch } from "@/components/domain-search";
import { DomainsDashboard } from "@/components/domains-dashboard";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { DomainWithOwner, Tld } from "../../../shared/schema";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(2);
}

export default function DomainsPage() {
  const [activeView, setActiveView] = useState<"search" | "dashboard">("search");
  const { user } = useAppStore();

  // Get user domains for stats
  const { data: domains = [] } = useQuery<DomainWithOwner[]>({
    queryKey: ["/api/domains/user", user?.id],
    enabled: !!user?.id,
  });

  // Get TLD stats
  const { data: tlds = [] } = useQuery<Tld[]>({
    queryKey: ["/api/tlds"],
  });

  const totalValue = domains.reduce((sum, domain) => sum + parseFloat(domain.registrationPrice || '0'), 0);
  const totalRewards = domains.reduce((sum, domain) => sum + parseFloat(domain.nxdRewards || '0'), 0);

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Navigation */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Domain Management</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveView("search")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "search"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-search mr-3"></i>
                  Search Domains
                </button>
                <button
                  onClick={() => setActiveView("dashboard")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "dashboard"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-tachometer-alt mr-3"></i>
                  My Domains
                </button>
              </div>
            </GlassmorphismCard>

            {/* Quick Stats */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Portfolio</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic-purple mb-1">
                    {domains.length}
                  </div>
                  <div className="text-white/60 text-sm">Domains Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-meteor-green mb-1">
                    ₦ {formatNumber(totalValue * 2400)}
                  </div>
                  <div className="text-white/60 text-sm">Portfolio Value</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-starlight-pink mb-1">
                    +{formatNumber(totalRewards)}
                  </div>
                  <div className="text-white/60 text-sm">NXD Rewards</div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Available TLDs */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Available TLDs</h3>
              <div className="space-y-3">
                {tlds.map((tld) => (
                  <div key={tld.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">.{tld.name}</div>
                      <div className="text-white/60 text-sm">{tld.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm">{tld.basePrice} ETH</div>
                      <div className={`w-2 h-2 rounded-full ${tld.isActive ? 'bg-meteor-green' : 'bg-red-400'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassmorphismCard>

            {/* Domain Analytics */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Market Insights</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Registration Trend</span>
                    <span className="text-meteor-green">↗ +23%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-meteor-green to-nebula-blue h-2 rounded-full" style={{ width: '76%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Premium Demand</span>
                    <span className="text-starlight-pink">↗ +15%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-starlight-pink to-solar-orange h-2 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/20">
                  <div className="text-xs text-white/60">
                    <i className="fas fa-info-circle mr-1"></i>
                    Data from last 30 days
                  </div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Quick Actions */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <GradientButton className="w-full" size="sm">
                  <i className="fas fa-plus mr-2"></i>Register Domain
                </GradientButton>
                <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition-colors text-white text-sm">
                  <i className="fas fa-sync mr-2"></i>Bulk Renew
                </button>
                <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition-colors text-white text-sm">
                  <i className="fas fa-download mr-2"></i>Export List
                </button>
              </div>
            </GlassmorphismCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 bg-gradient-to-r from-cosmic-purple via-nebula-blue to-starlight-pink bg-clip-text text-transparent">
                {activeView === "search" ? "Discover Web3 Domains" : "Domain Portfolio"}
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-6">
                {activeView === "search" 
                  ? "Search and register premium Web3 domains with AI-powered suggestions"
                  : "Manage your domain portfolio and track performance metrics"
                }
              </p>
            </div>

            {activeView === "search" ? <DomainSearch /> : <DomainsDashboard />}
          </div>
        </div>
      </div>
    </div>
  );
}