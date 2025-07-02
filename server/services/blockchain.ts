// Mock blockchain service for Web3 interactions
export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: Date;
}

export interface WalletInfo {
  address: string;
  balance: string;
  nxdBalance: string;
  networkId: number;
}

export interface StakingTransaction {
  hash: string;
  type: "stake" | "unstake" | "claim";
  amount: string;
  user: string;
  timestamp: Date;
  status: "pending" | "confirmed";
}

export interface GovernanceTransaction {
  hash: string;
  type: "propose" | "vote" | "execute";
  proposalId: number;
  voter?: string;
  votingPower?: string;
  choice?: "for" | "against";
  timestamp: Date;
}

export class BlockchainService {
  private transactions: Map<string, BlockchainTransaction> = new Map();
  private stakingTransactions: Map<string, StakingTransaction> = new Map();
  private governanceTransactions: Map<string, GovernanceTransaction> = new Map();

  // Generate mock transaction hash
  private generateTxHash(): string {
    return "0x" + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }

  // Mock wallet connection
  async connectWallet(address: string): Promise<WalletInfo> {
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      address,
      balance: (Math.random() * 10).toFixed(4), // Random ETH balance
      nxdBalance: (Math.random() * 50000).toFixed(2), // Random NXD balance
      networkId: 1, // Ethereum mainnet
    };
  }

  // Mock domain registration transaction
  async registerDomain(
    userAddress: string,
    domainName: string,
    price: string,
    paymentToken: "ETH" | "NXD"
  ): Promise<BlockchainTransaction> {
    const hash = this.generateTxHash();
    
    const transaction: BlockchainTransaction = {
      hash,
      from: userAddress,
      to: "0x742D35Cc6635C0532925a3b8D2b3C37B3Fd5F4F3", // Mock NXD contract
      value: price,
      gasUsed: "0.002",
      status: "pending",
      timestamp: new Date(),
    };

    this.transactions.set(hash, transaction);

    // Simulate transaction confirmation after 3 seconds
    setTimeout(() => {
      transaction.status = Math.random() > 0.1 ? "confirmed" : "failed";
      this.transactions.set(hash, transaction);
    }, 3000);

    return transaction;
  }

  // Mock staking transaction
  async stakeNXD(userAddress: string, amount: string): Promise<StakingTransaction> {
    const hash = this.generateTxHash();
    
    const transaction: StakingTransaction = {
      hash,
      type: "stake",
      amount,
      user: userAddress,
      timestamp: new Date(),
      status: "pending",
    };

    this.stakingTransactions.set(hash, transaction);

    // Simulate confirmation
    setTimeout(() => {
      transaction.status = "confirmed";
      this.stakingTransactions.set(hash, transaction);
    }, 2000);

    return transaction;
  }

  // Mock unstaking transaction
  async unstakeNXD(userAddress: string, amount: string): Promise<StakingTransaction> {
    const hash = this.generateTxHash();
    
    const transaction: StakingTransaction = {
      hash,
      type: "unstake",
      amount,
      user: userAddress,
      timestamp: new Date(),
      status: "pending",
    };

    this.stakingTransactions.set(hash, transaction);

    setTimeout(() => {
      transaction.status = "confirmed";
      this.stakingTransactions.set(hash, transaction);
    }, 2000);

    return transaction;
  }

  // Mock reward claiming
  async claimRewards(userAddress: string, amount: string): Promise<StakingTransaction> {
    const hash = this.generateTxHash();
    
    const transaction: StakingTransaction = {
      hash,
      type: "claim",
      amount,
      user: userAddress,
      timestamp: new Date(),
      status: "pending",
    };

    this.stakingTransactions.set(hash, transaction);

    setTimeout(() => {
      transaction.status = "confirmed";
      this.stakingTransactions.set(hash, transaction);
    }, 1500);

    return transaction;
  }

  // Mock governance vote
  async vote(
    userAddress: string,
    proposalId: number,
    choice: "for" | "against",
    votingPower: string
  ): Promise<GovernanceTransaction> {
    const hash = this.generateTxHash();
    
    const transaction: GovernanceTransaction = {
      hash,
      type: "vote",
      proposalId,
      voter: userAddress,
      votingPower,
      choice,
      timestamp: new Date(),
    };

    this.governanceTransactions.set(hash, transaction);
    return transaction;
  }

  // Mock proposal creation
  async createProposal(userAddress: string, proposalId: number): Promise<GovernanceTransaction> {
    const hash = this.generateTxHash();
    
    const transaction: GovernanceTransaction = {
      hash,
      type: "propose",
      proposalId,
      timestamp: new Date(),
    };

    this.governanceTransactions.set(hash, transaction);
    return transaction;
  }

  // Get transaction status
  async getTransaction(hash: string): Promise<BlockchainTransaction | undefined> {
    return this.transactions.get(hash);
  }

  // Get staking transaction
  async getStakingTransaction(hash: string): Promise<StakingTransaction | undefined> {
    return this.stakingTransactions.get(hash);
  }

  // Mock marketplace purchase
  async purchaseDomain(
    buyerAddress: string,
    sellerAddress: string,
    domainId: number,
    price: string,
    paymentToken: "ETH" | "NXD"
  ): Promise<BlockchainTransaction> {
    const hash = this.generateTxHash();
    
    const transaction: BlockchainTransaction = {
      hash,
      from: buyerAddress,
      to: sellerAddress,
      value: price,
      gasUsed: "0.003",
      status: "pending",
      timestamp: new Date(),
    };

    this.transactions.set(hash, transaction);

    setTimeout(() => {
      transaction.status = Math.random() > 0.05 ? "confirmed" : "failed";
      this.transactions.set(hash, transaction);
    }, 4000);

    return transaction;
  }

  // Calculate staking rewards (APY based)
  calculateStakingRewards(stakedAmount: string, days: number, apy: number): string {
    const amount = parseFloat(stakedAmount);
    const dailyRate = apy / 365 / 100;
    const rewards = amount * dailyRate * days;
    return rewards.toFixed(6);
  }

  // Get current gas price (mock)
  async getGasPrice(): Promise<string> {
    // Random gas price between 20-100 Gwei
    return (Math.random() * 80 + 20).toFixed(0);
  }

  // Estimate transaction cost
  async estimateTransactionCost(type: "register" | "stake" | "vote" | "transfer"): Promise<string> {
    const gasLimits = {
      register: 150000,
      stake: 100000,
      vote: 80000,
      transfer: 21000,
    };

    const gasPrice = await this.getGasPrice();
    const gasLimit = gasLimits[type];
    const costInWei = parseInt(gasPrice) * gasLimit;
    const costInEth = costInWei / 1e18;
    
    return costInEth.toFixed(6);
  }
}

export const blockchainService = new BlockchainService();
