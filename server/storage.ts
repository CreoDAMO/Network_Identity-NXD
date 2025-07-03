import {
  users,
  domains,
  tlds,
  stakingPositions,
  proposals,
  votes,
  marketplaceListings,
  aiSuggestions,
  chatMessages,
  type User,
  type InsertUser,
  type Domain,
  type InsertDomain,
  type Tld,
  type InsertTld,
  type StakingPosition,
  type InsertStakingPosition,
  type Proposal,
  type InsertProposal,
  type Vote,
  type InsertVote,
  type MarketplaceListing,
  type InsertMarketplaceListing,
  type AiSuggestion,
  type InsertAiSuggestion,
  type ChatMessage,
  type InsertChatMessage,
  type DomainWithOwner,
  type ProposalWithProposer,
  type MarketplaceListingWithDomain,
  type StakingStats,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Domains
  getDomain(id: number): Promise<Domain | undefined>;
  getDomainByFullName(fullDomain: string): Promise<Domain | undefined>;
  getUserDomains(userId: number): Promise<DomainWithOwner[]>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, updates: Partial<Domain>): Promise<Domain | undefined>;
  searchDomains(query: string): Promise<Domain[]>;
  checkDomainAvailability(fullDomain: string): Promise<boolean>;

  // TLDs
  getTld(name: string): Promise<Tld | undefined>;
  getAllTlds(): Promise<Tld[]>;
  createTld(tld: InsertTld): Promise<Tld>;

  // Staking
  getStakingPosition(userId: number): Promise<StakingPosition | undefined>;
  createStakingPosition(position: InsertStakingPosition): Promise<StakingPosition>;
  updateStakingPosition(id: number, updates: Partial<StakingPosition>): Promise<StakingPosition | undefined>;
  getStakingStats(): Promise<StakingStats>;

  // Governance
  getProposal(id: number): Promise<ProposalWithProposer | undefined>;
  getAllProposals(): Promise<ProposalWithProposer[]>;
  getActiveProposals(): Promise<ProposalWithProposer[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, updates: Partial<Proposal>): Promise<Proposal | undefined>;
  getUserVote(proposalId: number, userId: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;

  // Marketplace
  getMarketplaceListing(id: number): Promise<MarketplaceListingWithDomain | undefined>;
  getAllMarketplaceListings(): Promise<MarketplaceListingWithDomain[]>;
  getActiveMarketplaceListings(): Promise<MarketplaceListingWithDomain[]>;
  createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;
  updateMarketplaceListing(id: number, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined>;

  // AI
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  getUserAiSuggestions(userId: number): Promise<AiSuggestion[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getUserChatHistory(userId: number, limit?: number): Promise<ChatMessage[]>;

  // Admin helper methods
  getAllUsers(): Promise<User[]>;
  getAllDomains(): Promise<Domain[]>;
  getAllStakingPositions(): Promise<StakingPosition[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private domains: Map<number, Domain> = new Map();
  private tlds: Map<string, Tld> = new Map();
  private stakingPositions: Map<number, StakingPosition> = new Map();
  private proposals: Map<number, Proposal> = new Map();
  private votes: Map<string, Vote> = new Map(); // key: `${proposalId}-${userId}`
  private marketplaceListings: Map<number, MarketplaceListing> = new Map();
  private aiSuggestions: Map<number, AiSuggestion> = new Map();
  private chatMessages: Map<number, ChatMessage> = new Map();

  private currentUserId = 1;
  private currentDomainId = 1;
  private currentStakingId = 1;
  private currentProposalId = 1;
  private currentVoteId = 1;
  private currentListingId = 1;
  private currentAiSuggestionId = 1;
  private currentChatId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize TLDs
    const defaultTlds: InsertTld[] = [
      { name: "nxd", basePrice: "0.1", description: "Primary NXD domain extension" },
      { name: "web3", basePrice: "0.15", premiumMultiplier: "3.0", description: "Web3 focused domains" },
      { name: "dao", basePrice: "0.12", description: "DAO community domains" },
      { name: "defi", basePrice: "0.18", premiumMultiplier: "2.5", description: "DeFi protocol domains" },
    ];

    defaultTlds.forEach((tld) => {
      this.tlds.set(tld.name, {
        id: this.tlds.size + 1,
        ...tld,
        createdAt: new Date(),
      });
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.walletAddress === walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Domains
  async getDomain(id: number): Promise<Domain | undefined> {
    return this.domains.get(id);
  }

  async getDomainByFullName(fullDomain: string): Promise<Domain | undefined> {
    return Array.from(this.domains.values()).find((domain) => domain.fullDomain === fullDomain);
  }

  async getUserDomains(userId: number): Promise<DomainWithOwner[]> {
    const userDomains = Array.from(this.domains.values()).filter((domain) => domain.ownerId === userId);
    const user = await this.getUser(userId);

    return userDomains.map((domain) => ({
      ...domain,
      owner: user!,
    }));
  }

  async createDomain(insertDomain: InsertDomain): Promise<Domain> {
    const id = this.currentDomainId++;
    const domain: Domain = {
      ...insertDomain,
      id,
      registeredAt: new Date(),
    };
    this.domains.set(id, domain);
    return domain;
  }

  async updateDomain(id: number, updates: Partial<Domain>): Promise<Domain | undefined> {
    const domain = this.domains.get(id);
    if (!domain) return undefined;

    const updatedDomain = { ...domain, ...updates };
    this.domains.set(id, updatedDomain);
    return updatedDomain;
  }

  async searchDomains(query: string): Promise<Domain[]> {
    return Array.from(this.domains.values()).filter((domain) =>
      domain.fullDomain.toLowerCase().includes(query.toLowerCase())
    );
  }

  async checkDomainAvailability(fullDomain: string): Promise<boolean> {
    return !Array.from(this.domains.values()).some((domain) => domain.fullDomain === fullDomain);
  }

  // TLDs
  async getTld(name: string): Promise<Tld | undefined> {
    return this.tlds.get(name);
  }

  async getAllTlds(): Promise<Tld[]> {
    return Array.from(this.tlds.values());
  }

  async createTld(insertTld: InsertTld): Promise<Tld> {
    const id = this.tlds.size + 1;
    const tld: Tld = {
      ...insertTld,
      id,
      createdAt: new Date(),
    };
    this.tlds.set(insertTld.name, tld);
    return tld;
  }

  // Staking
  async getStakingPosition(userId: number): Promise<StakingPosition | undefined> {
    return Array.from(this.stakingPositions.values()).find(
      (position) => position.userId === userId && position.isActive
    );
  }

  async createStakingPosition(insertPosition: InsertStakingPosition): Promise<StakingPosition> {
    const id = this.currentStakingId++;
    const position: StakingPosition = {
      ...insertPosition,
      id,
      startedAt: new Date(),
      lastRewardClaim: new Date(),
    };
    this.stakingPositions.set(id, position);
    return position;
  }

  async updateStakingPosition(id: number, updates: Partial<StakingPosition>): Promise<StakingPosition | undefined> {
    const position = this.stakingPositions.get(id);
    if (!position) return undefined;

    const updatedPosition = { ...position, ...updates };
    this.stakingPositions.set(id, updatedPosition);
    return updatedPosition;
  }

  async getStakingStats(): Promise<StakingStats> {
    const positions = Array.from(this.stakingPositions.values()).filter((p) => p.isActive);
    const totalStaked = positions.reduce((sum, p) => sum + parseFloat(p.amount), 0).toString();

    return {
      totalStaked,
      currentApy: "18.5",
      poolUtilization: 67,
      nextRewardTime: "2.4 hrs",
    };
  }

  // Governance
  async getProposal(id: number): Promise<ProposalWithProposer | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;

    const proposer = await this.getUser(proposal.proposerId);
    return {
      ...proposal,
      proposer: proposer!,
    };
  }

  async getAllProposals(): Promise<ProposalWithProposer[]> {
    const proposals = Array.from(this.proposals.values());
    const proposalsWithProposers = await Promise.all(
      proposals.map(async (proposal) => {
        const proposer = await this.getUser(proposal.proposerId);
        return {
          ...proposal,
          proposer: proposer!,
        };
      })
    );
    return proposalsWithProposers;
  }

  async getActiveProposals(): Promise<ProposalWithProposer[]> {
    const activeProposals = Array.from(this.proposals.values()).filter(
      (proposal) => proposal.status === "active" && new Date() < proposal.votingEndsAt
    );

    const proposalsWithProposers = await Promise.all(
      activeProposals.map(async (proposal) => {
        const proposer = await this.getUser(proposal.proposerId);
        return {
          ...proposal,
          proposer: proposer!,
        };
      })
    );
    return proposalsWithProposers;
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const id = this.currentProposalId++;
    const proposal: Proposal = {
      ...insertProposal,
      id,
      createdAt: new Date(),
    };
    this.proposals.set(id, proposal);
    return proposal;
  }

  async updateProposal(id: number, updates: Partial<Proposal>): Promise<Proposal | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;

    const updatedProposal = { ...proposal, ...updates };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  async getUserVote(proposalId: number, userId: number): Promise<Vote | undefined> {
    return this.votes.get(`${proposalId}-${userId}`);
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = this.currentVoteId++;
    const vote: Vote = {
      ...insertVote,
      id,
      createdAt: new Date(),
    };
    this.votes.set(`${insertVote.proposalId}-${insertVote.userId}`, vote);
    return vote;
  }

  // Marketplace
  async getMarketplaceListing(id: number): Promise<MarketplaceListingWithDomain | undefined> {
    const listing = this.marketplaceListings.get(id);
    if (!listing) return undefined;

    const domain = await this.getDomain(listing.domainId);
    const seller = await this.getUser(listing.sellerId);

    return {
      ...listing,
      domain: domain!,
      seller: seller!,
    };
  }

  async getAllMarketplaceListings(): Promise<MarketplaceListingWithDomain[]> {
    const listings = Array.from(this.marketplaceListings.values());
    const listingsWithDetails = await Promise.all(
      listings.map(async (listing) => {
        const domain = await this.getDomain(listing.domainId);
        const seller = await this.getUser(listing.sellerId);
        return {
          ...listing,
          domain: domain!,
          seller: seller!,
        };
      })
    );
    return listingsWithDetails;
  }

  async getActiveMarketplaceListings(): Promise<MarketplaceListingWithDomain[]> {
    const activeListings = Array.from(this.marketplaceListings.values()).filter(
      (listing) => listing.isActive && (!listing.endsAt || new Date() < listing.endsAt)
    );

    const listingsWithDetails = await Promise.all(
      activeListings.map(async (listing) => {
        const domain = await this.getDomain(listing.domainId);
        const seller = await this.getUser(listing.sellerId);
        return {
          ...listing,
          domain: domain!,
          seller: seller!,
        };
      })
    );
    return listingsWithDetails;
  }

  async createMarketplaceListing(insertListing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    const id = this.currentListingId++;
    const listing: MarketplaceListing = {
      ...insertListing,
      id,
      listedAt: new Date(),
    };
    this.marketplaceListings.set(id, listing);
    return listing;
  }

  async updateMarketplaceListing(id: number, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined> {
    const listing = this.marketplaceListings.get(id);
    if (!listing) return undefined;

    const updatedListing = { ...listing, ...updates };
    this.marketplaceListings.set(id, updatedListing);
    return updatedListing;
  }

  // AI
  async createAiSuggestion(insertSuggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    const id = this.currentAiSuggestionId++;
    const suggestion: AiSuggestion = {
      ...insertSuggestion,
      id,
      createdAt: new Date(),
    };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
  }

  async getUserAiSuggestions(userId: number): Promise<AiSuggestion[]> {
    return Array.from(this.aiSuggestions.values()).filter((suggestion) => suggestion.userId === userId);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getUserChatHistory(userId: number, limit = 50): Promise<ChatMessage[]> {
    const userMessages = Array.from(this.chatMessages.values())
      .filter((message) => message.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return userMessages.reverse(); // Return in chronological order
  }

  // Admin helper methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllDomains(): Promise<Domain[]> {
    return Array.from(this.domains.values());
  }

  async getAllStakingPositions(): Promise<StakingPosition[]> {
    return Array.from(this.stakingPositions.values());
  }
}

export const storage = new MemStorage();