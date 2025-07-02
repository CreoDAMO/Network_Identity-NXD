import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { GovernanceInterface } from "@/components/governance-interface";
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

export default function GovernancePage() {
  const [activeView, setActiveView] = useState<"proposals" | "voting" | "history">("proposals");
  const { user } = useAppStore();

  // Get governance data
  const { data: proposals = [] } = useQuery({
    queryKey: ["/api/governance/proposals"],
  });

  const { data: userVotes = [] } = useQuery({
    queryKey: ["/api/governance/votes", user?.id],
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
              <h3 className="text-lg font-semibold text-white mb-4">DAO Governance</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveView("proposals")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "proposals"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-file-alt mr-3"></i>
                  Active Proposals
                </button>
                <button
                  onClick={() => setActiveView("voting")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "voting"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-vote-yea mr-3"></i>
                  Vote
                </button>
                <button
                  onClick={() => setActiveView("history")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeView === "history"
                      ? "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white"
                      : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <i className="fas fa-history mr-3"></i>
                  Vote History
                </button>
              </div>
            </GlassmorphismCard>

            {/* Voting Power */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Voting Power</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-cosmic-purple mb-2">
                  {user?.votingPower ? formatNumber(parseFloat(user.votingPower)) : '0'}
                </div>
                <div className="text-white/60 text-sm mb-4">Total Voting Power</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Staked NXD:</span>
                    <span className="text-meteor-green">{user?.nxdStaked ? formatNumber(parseFloat(user.nxdStaked)) : '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Domain Bonus:</span>
                    <span className="text-starlight-pink">+{user?.votingPower && user?.nxdStaked ? formatNumber(parseFloat(user.votingPower) - parseFloat(user.nxdStaked)) : '0'}</span>
                  </div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Governance Stats */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">DAO Statistics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Active Proposals</span>
                    <span className="text-cosmic-purple font-semibold">{proposals.length}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cosmic-purple to-nebula-blue h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Participation Rate</span>
                    <span className="text-meteor-green font-semibold">78%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-meteor-green to-starlight-pink h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Quorum Threshold</span>
                    <span className="text-solar-orange font-semibold">10M+</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-solar-orange to-cosmic-purple h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Proposal Categories */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Proposal Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-cosmic-purple rounded-full mr-3"></div>
                    <span className="text-white text-sm">Protocol Upgrade</span>
                  </div>
                  <span className="text-white/60 text-xs">2 active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-meteor-green rounded-full mr-3"></div>
                    <span className="text-white text-sm">Treasury</span>
                  </div>
                  <span className="text-white/60 text-xs">1 active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-starlight-pink rounded-full mr-3"></div>
                    <span className="text-white text-sm">Policy Change</span>
                  </div>
                  <span className="text-white/60 text-xs">3 active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-solar-orange rounded-full mr-3"></div>
                    <span className="text-white text-sm">Community</span>
                  </div>
                  <span className="text-white/60 text-xs">1 active</span>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Quick Actions */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <GradientButton className="w-full" size="sm" variant="cosmic">
                  <i className="fas fa-plus mr-2"></i>Create Proposal
                </GradientButton>
                <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition-colors text-white text-sm">
                  <i className="fas fa-gavel mr-2"></i>Delegate Vote
                </button>
                <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition-colors text-white text-sm">
                  <i className="fas fa-download mr-2"></i>Export Report
                </button>
              </div>
            </GlassmorphismCard>

            {/* Voting Timeline */}
            <GlassmorphismCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines</h3>
              <div className="space-y-4">
                <div className="border-l-2 border-cosmic-purple pl-4">
                  <div className="text-white font-medium text-sm">NXD-012</div>
                  <div className="text-white/60 text-xs">Ends in 2 days</div>
                </div>
                <div className="border-l-2 border-meteor-green pl-4">
                  <div className="text-white font-medium text-sm">NXD-015</div>
                  <div className="text-white/60 text-xs">Ends in 5 days</div>
                </div>
                <div className="border-l-2 border-starlight-pink pl-4">
                  <div className="text-white font-medium text-sm">NXD-018</div>
                  <div className="text-white/60 text-xs">Ends in 1 week</div>
                </div>
              </div>
            </GlassmorphismCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 bg-gradient-to-r from-cosmic-purple via-nebula-blue to-starlight-pink bg-clip-text text-transparent">
                DAO Governance
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-6">
                Participate in decentralized governance and shape the future of NXD
              </p>
            </div>

            <GovernanceInterface />
          </div>
        </div>
      </div>
    </div>
  );
}