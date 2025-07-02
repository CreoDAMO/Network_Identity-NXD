import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { StakingInterface } from "@/components/staking-interface";
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

export default function StakingPage() {
  const [activeView, setActiveView] = useState<"overview" | "stake" | "rewards">("overview");
  const { user } = useAppStore();

  // Get staking stats
  const { data: stakingStats } = useQuery({
    queryKey: ["/api/staking/stats"],
  });

  const { data: userPosition } = useQuery({
    queryKey: ["/api/staking/position", user?.id],
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
              <h3 className="text-lg font-semibold text-white mb-4">Staking Dashboard</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveView("overview")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "overview"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-chart-line mr-3"></i>
                  Overview
                </button>
                <button
                  onClick={() => setActiveView("stake")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "stake"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-coins mr-3"></i>
                  Stake NXD
                </button>
                <button
                  onClick={() => setActiveView("rewards")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "rewards"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-gift mr-3"></i>
                  Rewards
                </button>
              </div>
            </GlassmorphismCard>

            {/* Pool Statistics */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pool Statistics</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-meteor-green mb-1">
                    {stakingStats ? formatNumber(parseFloat(stakingStats.totalStaked)) : '0'}
                  </div>
                  <div className="text-white/60 text-sm">Total Staked NXD</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-starlight-pink mb-1">
                    {stakingStats ? stakingStats.currentApy : '0'}%
                  </div>
                  <div className="text-white/60 text-sm">Current APY</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-solar-orange mb-1">
                    {stakingStats ? stakingStats.poolUtilization : 0}%
                  </div>
                  <div className="text-white/60 text-sm">Pool Utilization</div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Your Position */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Position</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Staked Amount</span>
                    <span className="text-meteor-green font-semibold">
                      {userPosition ? formatNumber(parseFloat(userPosition.amount)) : '0'} NXD
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Current Tier</span>
                    <span className="text-cosmic-purple font-semibold">
                      {userPosition?.tier || 'None'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">APY Rate</span>
                    <span className="text-starlight-pink font-semibold">
                      {userPosition ? userPosition.currentApy : '0'}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Days Staked</span>
                    <span className="text-white">
                      {userPosition ? Math.floor((Date.now() - new Date(userPosition.startedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Staking Tiers */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Staking Tiers</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-meteor-green/20 to-transparent rounded-lg border border-meteor-green/30">
                  <div className="font-semibold text-meteor-green text-sm">BRONZE</div>
                  <div className="text-xs text-white/60">100+ NXD • 8% APY</div>
                </div>
                <div className="p-3 bg-gradient-to-r from-starlight-pink/20 to-transparent rounded-lg border border-starlight-pink/30">
                  <div className="font-semibold text-starlight-pink text-sm">SILVER</div>
                  <div className="text-xs text-white/60">1,000+ NXD • 12% APY</div>
                </div>
                <div className="p-3 bg-gradient-to-r from-solar-orange/20 to-transparent rounded-lg border border-solar-orange/30">
                  <div className="font-semibold text-solar-orange text-sm">GOLD</div>
                  <div className="text-xs text-white/60">10,000+ NXD • 18% APY</div>
                </div>
                <div className="p-3 bg-gradient-to-r from-cosmic-purple/20 to-transparent rounded-lg border border-cosmic-purple/30">
                  <div className="font-semibold text-cosmic-purple text-sm">DIAMOND</div>
                  <div className="text-xs text-white/60">100,000+ NXD • 25% APY</div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Quick Actions */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <GradientButton className="w-full" size="sm" variant="meteor">
                  <i className="fas fa-plus mr-2"></i>Stake More
                </GradientButton>
                <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition-colors text-white text-sm">
                  <i className="fas fa-gift mr-2"></i>Claim Rewards
                </button>
                <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition-colors text-white text-sm">
                  <i className="fas fa-minus mr-2"></i>Unstake
                </button>
              </div>
            </GlassmorphismCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 bg-gradient-to-r from-meteor-green via-starlight-pink to-solar-orange bg-clip-text text-transparent">
                NXD Staking Protocol
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-6">
                Stake your NXD tokens to earn rewards and participate in governance
              </p>
            </div>

            <StakingInterface />
          </div>
        </div>
      </div>
    </div>
  );
}