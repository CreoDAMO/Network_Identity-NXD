
import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Loader2, CheckCircle, XCircle, Zap, Coins } from 'lucide-react';
import { GlassmorphismCard } from './ui/glassmorphism-card';
import { GradientButton } from './ui/gradient-button';
import { toast } from 'sonner';

// Mock contract ABI - in production, import from generated types
const NXD_CONTRACT_ABI = [
  {
    inputs: [
      { name: "_name", type: "string" },
      { name: "_tld", type: "string" },
      { name: "_ipfsHash", type: "string" },
      { name: "_subscriptionTier", type: "uint256" },
      { name: "_payWithNXD", type: "bool" },
      { name: "_whiteLabelId", type: "uint256" },
      { name: "_paymasterSignature", type: "bytes" }
    ],
    name: "registerDomain",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "_amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "getUserStats",
    outputs: [
      { name: "domainCount", type: "uint256" },
      { name: "nxdStakedAmount", type: "uint256" },
      { name: "nxdRewardsAmount", type: "uint256" },
      { name: "subscriptionTier", type: "uint256" },
      { name: "ownedDomains", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function",
  }
] as const;

const NXD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NXD_CONTRACT_ADDRESS as `0x${string}` || '0x1234567890123456789012345678901234567890';

interface ContractIntegrationProps {
  domainName?: string;
  tld?: string;
  onSuccess?: () => void;
}

export default function ContractIntegration({ domainName, tld, onSuccess }: ContractIntegrationProps) {
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const [payWithNXD, setPayWithNXD] = useState(false);

  // Read user stats
  const { data: userStats, isLoading: statsLoading, refetch: refetchStats } = useContractRead({
    address: NXD_CONTRACT_ADDRESS,
    abi: NXD_CONTRACT_ABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  });

  // Domain registration
  const { 
    data: registerData, 
    write: registerDomain, 
    isLoading: isRegistering 
  } = useContractWrite({
    address: NXD_CONTRACT_ADDRESS,
    abi: NXD_CONTRACT_ABI,
    functionName: 'registerDomain',
  });

  // Staking
  const { 
    data: stakeData, 
    write: stakeTokens, 
    isLoading: isStaking 
  } = useContractWrite({
    address: NXD_CONTRACT_ADDRESS,
    abi: NXD_CONTRACT_ABI,
    functionName: 'stake',
  });

  // Wait for transactions
  const { isLoading: waitingForRegister } = useWaitForTransaction({
    hash: registerData?.hash,
    onSuccess: () => {
      toast.success('Domain registered successfully!');
      refetchStats();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Registration failed: ' + error.message);
    }
  });

  const { isLoading: waitingForStake } = useWaitForTransaction({
    hash: stakeData?.hash,
    onSuccess: () => {
      toast.success('Tokens staked successfully!');
      refetchStats();
      setStakeAmount('');
    },
    onError: (error) => {
      toast.error('Staking failed: ' + error.message);
    }
  });

  const handleRegisterDomain = () => {
    if (!domainName || !tld) {
      toast.error('Please provide domain name and TLD');
      return;
    }

    registerDomain({
      args: [
        domainName,
        tld,
        'ipfs://placeholder-hash', // In production, upload to IPFS first
        0, // subscription tier
        payWithNXD,
        0, // white label ID
        '0x' // paymaster signature
      ],
      value: payWithNXD ? 0n : parseEther('0.1'), // 0.1 ETH if not paying with NXD
    });
  };

  const handleStake = () => {
    if (!stakeAmount || isNaN(Number(stakeAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const amount = parseEther(stakeAmount);
      stakeTokens({ args: [amount] });
    } catch (error) {
      toast.error('Invalid amount');
    }
  };

  if (!isConnected) {
    return (
      <GlassmorphismCard className="p-6 text-center">
        <Zap className="w-12 h-12 mx-auto mb-4 text-cosmic-purple" />
        <h3 className="text-white font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-white/60 mb-4">
          Connect your wallet to interact with NXD smart contracts
        </p>
        <GradientButton>Connect Wallet</GradientButton>
      </GlassmorphismCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <GlassmorphismCard className="p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <Coins className="w-5 h-5 mr-2 text-cosmic-purple" />
          Your NXD Stats
        </h3>
        
        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cosmic-purple" />
          </div>
        ) : userStats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm">Domains Owned</p>
              <p className="text-white text-2xl font-bold">{userStats[0].toString()}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm">NXD Staked</p>
              <p className="text-white text-2xl font-bold">
                {formatEther(userStats[1])}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm">Pending Rewards</p>
              <p className="text-white text-2xl font-bold text-meteor-green">
                {formatEther(userStats[2])}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm">Subscription Tier</p>
              <p className="text-white text-2xl font-bold">{userStats[3].toString()}</p>
            </div>
          </div>
        ) : (
          <p className="text-white/60">Failed to load stats</p>
        )}
      </GlassmorphismCard>

      {/* Domain Registration */}
      {domainName && tld && (
        <GlassmorphismCard className="p-6">
          <h3 className="text-white font-semibold mb-4">Register Domain</h3>
          
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <p className="text-white font-medium">{domainName}.{tld}</p>
            <p className="text-white/60 text-sm">Registration Fee: 0.1 ETH or equivalent NXD</p>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="payWithNXD"
              checked={payWithNXD}
              onChange={(e) => setPayWithNXD(e.target.checked)}
              className="rounded border-white/20 bg-white/10"
            />
            <label htmlFor="payWithNXD" className="text-white text-sm">
              Pay with NXD tokens (10% discount)
            </label>
          </div>

          <GradientButton
            onClick={handleRegisterDomain}
            disabled={isRegistering || waitingForRegister}
            className="w-full"
          >
            {isRegistering || waitingForRegister ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isRegistering ? 'Confirming...' : 'Processing...'}
              </>
            ) : (
              'Register Domain'
            )}
          </GradientButton>
        </GlassmorphismCard>
      )}

      {/* Staking */}
      <GlassmorphismCard className="p-6">
        <h3 className="text-white font-semibold mb-4">Stake NXD Tokens</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">Amount to Stake</label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Enter NXD amount"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white 
                       placeholder-white/60 focus:outline-none focus:border-cosmic-purple"
            />
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Staking Benefits</h4>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• Earn up to 15% APY</li>
              <li>• Governance voting power</li>
              <li>• Premium feature access</li>
              <li>• Gas fee sponsorship</li>
            </ul>
          </div>

          <GradientButton
            onClick={handleStake}
            disabled={!stakeAmount || isStaking || waitingForStake}
            className="w-full"
          >
            {isStaking || waitingForStake ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isStaking ? 'Confirming...' : 'Processing...'}
              </>
            ) : (
              'Stake NXD'
            )}
          </GradientButton>
        </div>
      </GlassmorphismCard>
    </div>
  );
}
