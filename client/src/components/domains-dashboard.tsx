import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { formatTimeRemaining, formatNumber } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export function DomainsDashboard() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  // Get user domains
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["/api/domains/user", user?.id],
    enabled: !!user?.id,
  });

  const renewDomainMutation = useMutation({
    mutationFn: async (domainId: number) => {
      const response = await apiRequest("POST", `/api/domains/${domainId}/renew`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains/user"] });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <GlassmorphismCard key={i} className="p-6">
            <div className="loading-shimmer h-4 rounded mb-4"></div>
            <div className="loading-shimmer h-3 rounded mb-2"></div>
            <div className="loading-shimmer h-3 rounded w-3/4"></div>
          </GlassmorphismCard>
        ))}
      </div>
    );
  }

  if (!domains.length) {
    return (
      <div className="text-center py-12">
        <GlassmorphismCard className="p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-cosmic-purple to-nebula-blue rounded-xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-globe text-white text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Domains Yet</h3>
          <p className="text-white/70 mb-6">Start building your Web3 identity by registering your first domain.</p>
          <GradientButton>
            <i className="fas fa-plus mr-2"></i>Register Domain
          </GradientButton>
        </GlassmorphismCard>
      </div>
    );
  }

  const totalValue = domains.reduce((sum, domain) => sum + parseFloat(domain.registrationPrice), 0);
  const totalRewards = domains.reduce((sum, domain) => sum + parseFloat(domain.nxdRewards), 0);
  const averageVisitors = domains.reduce((sum, domain) => sum + domain.monthlyVisitors, 0) / domains.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Domain Cards */}
      <div className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {domains.map((domain) => (
            <GlassmorphismCard key={domain.id} className="p-6 hover-glow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${
                    domain.isPremium 
                      ? "from-starlight-pink to-solar-orange" 
                      : "from-cosmic-purple to-nebula-blue"
                  } rounded-lg flex items-center justify-center`}>
                    <i className={`fas ${domain.isPremium ? 'fa-crown' : 'fa-globe'} text-white`}></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{domain.fullDomain}</h3>
                    <p className="text-sm text-white/60">
                      Expires: {formatTimeRemaining(new Date(domain.expiresAt))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    domain.status === "active" 
                      ? "bg-meteor-green/20 text-meteor-green" 
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {domain.status}
                  </span>
                  <button className="text-white/60 hover:text-white">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Monthly Visitors</span>
                  <span className="text-white">{domain.monthlyVisitors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">NXD Rewards</span>
                  <span className="text-meteor-green">+{formatNumber(domain.nxdRewards)} NXD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Registration Price</span>
                  <span className="text-white">{formatNumber(domain.registrationPrice)} ETH</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <GradientButton 
                  size="sm" 
                  className="flex-1"
                  variant="outline"
                >
                  <i className="fas fa-edit mr-2"></i>Manage
                </GradientButton>
                <GradientButton 
                  size="sm" 
                  className="flex-1"
                  onClick={() => renewDomainMutation.mutate(domain.id)}
                  disabled={renewDomainMutation.isPending}
                >
                  <i className="fas fa-sync mr-2"></i>
                  {renewDomainMutation.isPending ? "Renewing..." : "Renew"}
                </GradientButton>
              </div>
            </GlassmorphismCard>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <GlassmorphismCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <GradientButton className="w-full">
              <i className="fas fa-plus mr-2"></i>Register New Domain
            </GradientButton>
            <button className="w-full bg-white/10 border border-white/20 p-4 rounded-lg hover:bg-white/20 transition-colors text-white">
              <i className="fas fa-sync mr-2"></i>Renew All Domains
            </button>
            <button className="w-full bg-white/10 border border-white/20 p-4 rounded-lg hover:bg-white/20 transition-colors text-white">
              <i className="fas fa-tags mr-2"></i>Bulk Transfer
            </button>
          </div>
        </GlassmorphismCard>

        {/* Portfolio Summary */}
        <GlassmorphismCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/60">Total Domains</span>
              <span className="text-white font-semibold">{domains.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Total Value</span>
              <span className="text-white font-semibold">₦ {formatNumber(totalValue * 2400)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Monthly Rewards</span>
              <span className="text-meteor-green font-semibold">+{formatNumber(totalRewards)} NXD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Avg. Visitors</span>
              <span className="text-nebula-blue font-semibold">{Math.round(averageVisitors).toLocaleString()}</span>
            </div>
          </div>
        </GlassmorphismCard>

        {/* Domain Analytics */}
        <GlassmorphismCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Analytics Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Traffic Growth</span>
                <span className="text-meteor-green">+12.5%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-meteor-green to-nebula-blue h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Revenue Growth</span>
                <span className="text-starlight-pink">+8.3%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-starlight-pink to-solar-orange h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </GlassmorphismCard>
      </div>
    </div>
  );
}
