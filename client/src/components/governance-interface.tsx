import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeRemaining, formatVotingPercentage, calculateVotingPower } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface CreateProposalForm {
  title: string;
  description: string;
}

export function GovernanceInterface() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProposal, setNewProposal] = useState<CreateProposalForm>({
    title: "",
    description: "",
  });
  const { user, nxdBalance } = useAppStore();
  const queryClient = useQueryClient();

  // Get all proposals
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["/api/governance/proposals"],
  });

  // Get active proposals
  const { data: activeProposals = [] } = useQuery({
    queryKey: ["/api/governance/proposals", { active: true }],
  });

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async (proposalData: any) => {
      const response = await apiRequest("POST", "/api/governance/proposals", proposalData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/governance/proposals"] });
      setShowCreateForm(false);
      setNewProposal({ title: "", description: "" });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, choice }: { proposalId: number; choice: "for" | "against" }) => {
      const votingPower = calculateVotingPower(nxdBalance);
      const response = await apiRequest("POST", "/api/governance/vote", {
        proposalId,
        userId: user?.id,
        voteChoice: choice,
        votingPower,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/governance/proposals"] });
    },
  });

  // AI proposal generation
  const aiProposalMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest("POST", "/api/ai/generate-proposal", {
        topic,
        context: "NXD DAO governance proposal",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setNewProposal({
        title: data.title,
        description: data.description,
      });
    },
  });

  const handleCreateProposal = () => {
    if (!user || !newProposal.title || !newProposal.description) return;

    const votingEndsAt = new Date();
    votingEndsAt.setDate(votingEndsAt.getDate() + 7); // 7 days voting period

    createProposalMutation.mutate({
      title: newProposal.title,
      description: newProposal.description,
      proposerId: user.id,
      votingEndsAt,
    });
  };

  const userVotingPower = calculateVotingPower(nxdBalance);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Active Proposals */}
      <div className="lg:col-span-2">
        <GlassmorphismCard className="p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-orbitron font-bold text-white">Active Proposals</h3>
            <GradientButton
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="sm"
            >
              <i className="fas fa-plus mr-2"></i>New Proposal
            </GradientButton>
          </div>

          {/* Create Proposal Form */}
          {showCreateForm && (
            <div className="mb-6 p-6 bg-white/5 rounded-xl border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">Create New Proposal</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 mb-2">Title</label>
                  <Input
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                    placeholder="Enter proposal title..."
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 mb-2">Description</label>
                  <Textarea
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                    placeholder="Describe your proposal in detail..."
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 min-h-[120px]"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <Input
                    placeholder="AI topic suggestion (e.g., 'reduce domain fees')"
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        if (target.value) {
                          aiProposalMutation.mutate(target.value);
                          target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="AI topic"]') as HTMLInputElement;
                      if (input?.value) {
                        aiProposalMutation.mutate(input.value);
                        input.value = '';
                      }
                    }}
                    disabled={aiProposalMutation.isPending}
                    className="text-starlight-pink hover:text-white transition-colors"
                  >
                    <i className="fas fa-robot"></i>
                  </button>
                </div>
                
                <div className="flex space-x-3">
                  <GradientButton
                    onClick={handleCreateProposal}
                    disabled={!newProposal.title || !newProposal.description || createProposalMutation.isPending}
                    className="flex-1"
                  >
                    {createProposalMutation.isPending ? "Creating..." : "Create Proposal"}
                  </GradientButton>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-white/10 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Proposals List */}
          <div className="space-y-6">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="loading-shimmer h-6 rounded mb-4"></div>
                  <div className="loading-shimmer h-4 rounded mb-2"></div>
                  <div className="loading-shimmer h-4 rounded w-3/4 mb-4"></div>
                  <div className="loading-shimmer h-2 rounded"></div>
                </div>
              ))
            ) : activeProposals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-cosmic-purple to-nebula-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-vote-yea text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Active Proposals</h3>
                <p className="text-white/70 mb-6">Be the first to create a proposal for the NXD DAO.</p>
                <GradientButton onClick={() => setShowCreateForm(true)}>
                  Create Proposal
                </GradientButton>
              </div>
            ) : (
              activeProposals.map((proposal) => {
                const { forPercentage, againstPercentage } = formatVotingPercentage(
                  proposal.votesFor,
                  proposal.votesAgainst
                );
                
                return (
                  <div key={proposal.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Proposal #{proposal.id}: {proposal.title}
                        </h4>
                        <p className="text-white/70 text-sm mb-3 line-clamp-3">
                          {proposal.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-white/60">
                          <span>
                            <i className="fas fa-user mr-1"></i>
                            {proposal.proposer.username}
                          </span>
                          <span>
                            <i className="fas fa-clock mr-1"></i>
                            {formatTimeRemaining(new Date(proposal.votingEndsAt))} left
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-nebula-blue/20 text-nebula-blue text-xs rounded-full">
                        {proposal.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Voting Progress</span>
                        <span className="text-white">
                          {Math.round((parseFloat(proposal.totalVotes) / 10000000) * 100)}% participation
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-meteor-green to-nebula-blue h-2 rounded-full" 
                          style={{ width: `${Math.min((parseFloat(proposal.totalVotes) / 10000000) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>For: {proposal.votesFor} NXD ({forPercentage}%)</span>
                        <span>Against: {proposal.votesAgainst} NXD ({againstPercentage}%)</span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <GradientButton
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => voteMutation.mutate({ proposalId: proposal.id, choice: "for" })}
                        disabled={voteMutation.isPending || !user}
                      >
                        <i className="fas fa-thumbs-up mr-2"></i>Vote For
                      </GradientButton>
                      <button
                        onClick={() => voteMutation.mutate({ proposalId: proposal.id, choice: "against" })}
                        disabled={voteMutation.isPending || !user}
                        className="flex-1 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <i className="fas fa-thumbs-down mr-2"></i>Vote Against
                      </button>
                      <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                        <i className="fas fa-info-circle"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassmorphismCard>
      </div>

      {/* Voting Power & History */}
      <div className="space-y-6">
        <GlassmorphismCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Voting Power</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-cosmic-purple mb-2">
                {Math.round(parseFloat(userVotingPower)).toLocaleString()}
              </div>
              <div className="text-white/60">NXD Voting Power</div>
            </div>
            <div className="pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Available NXD</span>
                <span className="text-white">{Math.round(parseFloat(nxdBalance)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Delegated To You</span>
                <span className="text-white">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">You Delegated</span>
                <span className="text-white">0</span>
              </div>
            </div>
            <button className="w-full bg-white/10 border border-white/20 py-3 rounded-lg hover:bg-white/20 transition-colors text-white">
              <i className="fas fa-users mr-2"></i>Delegate Votes
            </button>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Proposals</h3>
          <div className="space-y-3">
            {proposals.slice(0, 5).map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    proposal.status === "passed" ? "bg-meteor-green" : 
                    proposal.status === "rejected" ? "bg-red-400" : "bg-nebula-blue"
                  }`}></div>
                  <span className="text-white/80 text-sm">Proposal #{proposal.id}</span>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${
                    proposal.status === "passed" ? "text-meteor-green" : 
                    proposal.status === "rejected" ? "text-red-400" : "text-nebula-blue"
                  }`}>
                    {proposal.status}
                  </div>
                  <div className="text-xs text-white/60">{proposal.totalVotes} NXD</div>
                </div>
              </div>
            ))}
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Governance Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/60">Total Proposals</span>
              <span className="text-white font-semibold">{proposals.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Active Proposals</span>
              <span className="text-nebula-blue font-semibold">{activeProposals.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Your Participation</span>
              <span className="text-meteor-green font-semibold">
                {proposals.length > 0 ? Math.round((proposals.filter(p => p.status !== "active").length / proposals.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </GlassmorphismCard>
      </div>
    </div>
  );
}
