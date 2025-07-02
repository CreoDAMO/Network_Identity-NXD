import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Input } from "@/components/ui/input";
import { formatNumber, calculateStakingRewards, getStakingTier } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export function StakingInterface() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const { user, walletAddress, nxdBalance } = useAppStore();
  const queryClient = useQueryClient();

  // Get staking statistics
  const { data: stakingStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/staking/stats"],
  });

  // Get user's staking position
  const { data: stakingPosition } = useQuery({
    queryKey: ["/api/staking/position", user?.id],
    enabled: !!user?.id,
  });

  // Stake NXD mutation
  const stakeMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("POST", "/api/staking/stake", {
        userId: user?.id,
        amount,
        currentApy: stakingStats?.currentApy || "18.5",
        userAddress: walletAddress || "0x1234567890123456789012345678901234567890",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staking/position"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/stats"] });
      setStakeAmount("");
    },
  });

  // Unstake NXD mutation
  const unstakeMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("POST", "/api/staking/unstake", {
        positionId: stakingPosition?.id,
        amount,
        currentAmount: stakingPosition?.amount,
        userAddress: walletAddress || "0x1234567890123456789012345678901234567890",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staking/position"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/stats"] });
      setStakeAmount("");
    },
  });

  // Claim rewards mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      const pendingRewards = calculateStakingRewards(
        stakingPosition?.amount || "0",
        stakingStats?.currentApy || "18.5",
        30
      );
      
      const response = await apiRequest("POST", "/api/staking/claim", {
        userId: user?.id,
        amount: pendingRewards,
        userAddress: walletAddress || "0x1234567890123456789012345678901234567890",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staking/position"] });
    },
  });

  const handleMaxClick = () => {
    if (activeTab === "stake") {
      setStakeAmount(nxdBalance);
    } else if (stakingPosition) {
      setStakeAmount(stakingPosition.amount);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    const balance = activeTab === "stake" ? parseFloat(nxdBalance) : parseFloat(stakingPosition?.amount || "0");
    const amount = (balance * percentage / 100).toString();
    setStakeAmount(amount);
  };

  const getExpectedRewards = () => {
    if (!stakeAmount || !stakingStats) return "0";
    return calculateStakingRewards(stakeAmount, stakingStats.currentApy, 1);
  };

  const getPendingRewards = () => {
    if (!stakingPosition || !stakingStats) return "0";
    return calculateStakingRewards(stakingPosition.amount, stakingStats.currentApy, 30);
  };

  const tier = stakingPosition ? getStakingTier(stakingPosition.amount) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* Staking Pool */}
      <GlassmorphismCard className="p-8 gradient-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-orbitron font-bold text-white">
            {activeTab === "stake" ? "Stake NXD" : "Unstake NXD"}
          </h3>
          <div className="flex items-center space-x-2">
            <i className="fas fa-coins text-solar-orange"></i>
            <span className="text-white/80">Balance: </span>
            <span className="text-white font-semibold">{formatNumber(nxdBalance)} NXD</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab("stake")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === "stake"
                ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => setActiveTab("unstake")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === "unstake"
                ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
            disabled={!stakingPosition}
          >
            Unstake
          </button>
        </div>

        {/* Staking Stats */}
        {statsLoading ? (
          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="loading-shimmer h-4 rounded mb-2"></div>
            <div className="loading-shimmer h-8 rounded mb-2"></div>
            <div className="loading-shimmer h-2 rounded"></div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/70">Current APY</span>
              <span className="text-2xl font-bold text-meteor-green">
                {stakingStats?.currentApy || "18.5"}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-meteor-green to-nebula-blue h-2 rounded-full" 
                style={{ width: `${stakingStats?.poolUtilization || 67}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Pool Utilization: {stakingStats?.poolUtilization || 67}%</span>
              <span>Next Reward: {stakingStats?.nextRewardTime || "2.4 hrs"}</span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-white/70 mb-2">
              Amount to {activeTab === "stake" ? "Stake" : "Unstake"}
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-cosmic-purple focus:border-transparent pr-20 h-14"
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cosmic-purple hover:text-white text-sm font-semibold"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Percentage Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[25, 50, 75].map((percentage) => (
              <button
                key={percentage}
                onClick={() => handlePercentageClick(percentage)}
                className="bg-white/10 border border-white/20 rounded-lg py-3 text-white/70 hover:bg-white/20 transition-colors font-semibold"
              >
                {percentage}%
              </button>
            ))}
          </div>

          {/* Expected Returns */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Expected Daily Rewards</span>
              <span className="text-meteor-green">+{formatNumber(getExpectedRewards())} NXD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Lock Period</span>
              <span className="text-white">Flexible</span>
            </div>
          </div>

          {/* Action Button */}
          <GradientButton
            className="w-full h-14"
            onClick={() => {
              if (activeTab === "stake") {
                stakeMutation.mutate(stakeAmount);
              } else {
                unstakeMutation.mutate(stakeAmount);
              }
            }}
            disabled={
              !stakeAmount || 
              parseFloat(stakeAmount) <= 0 || 
              stakeMutation.isPending || 
              unstakeMutation.isPending
            }
          >
            {stakeMutation.isPending || unstakeMutation.isPending 
              ? `${activeTab === "stake" ? "Staking" : "Unstaking"}...` 
              : `${activeTab === "stake" ? "Stake" : "Unstake"} NXD`
            }
          </GradientButton>
        </div>
      </GlassmorphismCard>

      {/* Staking Stats & History */}
      <div className="space-y-6">
        {/* Your Position */}
        <GlassmorphismCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Staking Position</h3>
          {stakingPosition ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-white/60">Staked Amount</span>
                <span className="text-white font-semibold">{formatNumber(stakingPosition.amount)} NXD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Pending Rewards</span>
                <span className="text-meteor-green font-semibold">+{formatNumber(getPendingRewards())} NXD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Total Earned</span>
                <span className="text-starlight-pink font-semibold">+{formatNumber(user?.totalRewards || "0")} NXD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Personal APY</span>
                <span className="text-nebula-blue font-semibold">{stakingPosition.currentApy}%</span>
              </div>

              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex space-x-3">
                  <GradientButton
                    className="flex-1"
                    variant="secondary"
                    onClick={() => claimMutation.mutate()}
                    disabled={claimMutation.isPending || parseFloat(getPendingRewards()) <= 0}
                  >
                    {claimMutation.isPending ? "Claiming..." : "Claim Rewards"}
                  </GradientButton>
                  <button
                    onClick={() => setActiveTab("unstake")}
                    className="flex-1 bg-white/10 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-white"
                  >
                    Unstake
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cosmic-purple to-nebula-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-coins text-white text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Staking Position</h3>
              <p className="text-white/70 mb-4">Start earning rewards by staking your NXD tokens.</p>
            </div>
          )}
        </GlassmorphismCard>

        {/* Staking Tiers */}
        <GlassmorphismCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Staking Tiers</h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              tier?.tier === "Bronze" ? "bg-white/10 border border-cosmic-purple/30" : "bg-white/5"
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-cosmic-purple rounded-full"></div>
                <span className="text-white/80">Bronze</span>
                {tier?.tier === "Bronze" && (
                  <span className="text-xs bg-cosmic-purple/20 text-cosmic-purple px-2 py-1 rounded-full">Current</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-white">1K - 10K NXD</div>
                <div className="text-xs text-white/60">Base APY</div>
              </div>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              tier?.tier === "Silver" ? "bg-white/10 border border-nebula-blue/30" : "bg-white/5"
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-nebula-blue rounded-full"></div>
                <span className="text-white/80">Silver</span>
                {tier?.tier === "Silver" && (
                  <span className="text-xs bg-nebula-blue/20 text-nebula-blue px-2 py-1 rounded-full">Current</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-white">10K - 100K NXD</div>
                <div className="text-xs text-white/60">+2% Bonus</div>
              </div>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              tier?.tier === "Gold" ? "bg-white/10 border border-solar-orange/30" : "bg-white/5"
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-solar-orange rounded-full"></div>
                <span className="text-white/80">Gold</span>
                {tier?.tier === "Gold" && (
                  <span className="text-xs bg-solar-orange/20 text-solar-orange px-2 py-1 rounded-full">Current</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-white">100K+ NXD</div>
                <div className="text-xs text-white/60">+5% Bonus</div>
              </div>
            </div>
          </div>
        </GlassmorphismCard>
      </div>
    </div>
  );
}
