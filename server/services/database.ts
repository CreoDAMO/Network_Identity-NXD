
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc, asc, gte, lte, count } from 'drizzle-orm';
import * as schema from '../database/schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nxd_platform';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export interface CreateUserData {
  address: string;
  username?: string;
  email?: string;
  avatar?: string;
}

export interface CreateDomainData {
  name: string;
  tld: string;
  ownerId: string;
  ipfsHash?: string;
  subscriptionTier?: number;
  expiresAt: Date;
  whiteLabelId?: string;
}

export interface CreateProposalData {
  proposalId: number;
  proposerId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  callData?: string;
  targetContract?: string;
}

export class DatabaseService {
  // User operations
  static async createUser(data: CreateUserData) {
    const [user] = await db.insert(schema.users).values(data).returning();
    return user;
  }

  static async getUserByAddress(address: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.address, address));
    return user;
  }

  static async getUserById(id: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  static async updateUserBalance(userId: string, nxdBalance: string, stakedAmount?: string) {
    const updateData: any = { nxdBalance, updatedAt: new Date() };
    if (stakedAmount !== undefined) {
      updateData.stakedAmount = stakedAmount;
    }
    
    const [user] = await db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  // Domain operations
  static async createDomain(data: CreateDomainData) {
    const fullDomain = `${data.name}.${data.tld}`;
    const domainData = {
      ...data,
      fullDomain,
      registeredAt: new Date(),
    };
    
    const [domain] = await db.insert(schema.domains).values(domainData).returning();
    return domain;
  }

  static async getDomainByName(fullDomain: string) {
    const [domain] = await db.select().from(schema.domains)
      .where(eq(schema.domains.fullDomain, fullDomain));
    return domain;
  }

  static async getDomainsByOwner(ownerId: string) {
    return await db.select().from(schema.domains)
      .where(eq(schema.domains.ownerId, ownerId))
      .orderBy(desc(schema.domains.registeredAt));
  }

  static async updateDomainScore(domainId: string, nxdScore: number) {
    const [domain] = await db.update(schema.domains)
      .set({ nxdScore, updatedAt: new Date() })
      .where(eq(schema.domains.id, domainId))
      .returning();
    return domain;
  }

  static async getDomainStats() {
    const [totalDomains] = await db.select({ count: count() }).from(schema.domains);
    const [activeDomains] = await db.select({ count: count() }).from(schema.domains)
      .where(eq(schema.domains.status, 'active'));
    
    return {
      total: totalDomains.count,
      active: activeDomains.count,
    };
  }

  // TLD operations
  static async createTLD(data: {
    name: string;
    ownerId: string;
    registrationFee: string;
    premiumFee: string;
    nxdStakeRequired?: string;
    whiteLabelId?: string;
  }) {
    const [tld] = await db.insert(schema.tlds).values(data).returning();
    return tld;
  }

  static async getTLDByName(name: string) {
    const [tld] = await db.select().from(schema.tlds)
      .where(eq(schema.tlds.name, name));
    return tld;
  }

  static async getActiveTLDs() {
    return await db.select().from(schema.tlds)
      .where(eq(schema.tlds.isActive, true))
      .orderBy(asc(schema.tlds.name));
  }

  // Staking operations
  static async recordStaking(data: {
    userId: string;
    amount: string;
    action: 'stake' | 'unstake';
    txHash?: string;
    blockNumber?: number;
  }) {
    const [record] = await db.insert(schema.stakingRecords).values(data).returning();
    return record;
  }

  static async getStakingHistory(userId: string, limit = 50) {
    return await db.select().from(schema.stakingRecords)
      .where(eq(schema.stakingRecords.userId, userId))
      .orderBy(desc(schema.stakingRecords.timestamp))
      .limit(limit);
  }

  static async getTotalStaked() {
    const result = await db.select({
      totalStaked: schema.users.stakedAmount
    }).from(schema.users);
    
    return result.reduce((sum, user) => sum + BigInt(user.totalStaked || '0'), BigInt(0));
  }

  // Governance operations
  static async createProposal(data: CreateProposalData) {
    const [proposal] = await db.insert(schema.proposals).values(data).returning();
    return proposal;
  }

  static async getProposalById(id: string) {
    const [proposal] = await db.select().from(schema.proposals)
      .where(eq(schema.proposals.id, id));
    return proposal;
  }

  static async getActiveProposals() {
    return await db.select().from(schema.proposals)
      .where(eq(schema.proposals.status, 'active'))
      .orderBy(desc(schema.proposals.createdAt));
  }

  static async recordVote(data: {
    proposalId: string;
    voterId: string;
    support: boolean;
    weight: string;
    txHash?: string;
  }) {
    const [vote] = await db.insert(schema.votes).values(data).returning();
    
    // Update proposal vote counts
    const voteField = data.support ? 'forVotes' : 'againstVotes';
    await db.update(schema.proposals)
      .set({
        [voteField]: data.weight, // This should be properly calculated with existing votes
      })
      .where(eq(schema.proposals.id, data.proposalId));
    
    return vote;
  }

  // White label operations
  static async createWhiteLabelLicense(data: {
    licenseId: number;
    ownerId: string;
    brandName: string;
    tier: string;
    nxdStaked: string;
    expiresAt: Date;
    apiCallLimit: number;
    revenueSharePercentage: number;
    allowedTlds: string[];
  }) {
    const [license] = await db.insert(schema.whiteLabelLicenses).values(data).returning();
    return license;
  }

  static async getWhiteLabelLicense(licenseId: number) {
    const [license] = await db.select().from(schema.whiteLabelLicenses)
      .where(eq(schema.whiteLabelLicenses.licenseId, licenseId));
    return license;
  }

  static async updateAPIUsage(licenseId: number, callsUsed: number) {
    const [license] = await db.update(schema.whiteLabelLicenses)
      .set({ apiCallsUsed: callsUsed })
      .where(eq(schema.whiteLabelLicenses.licenseId, licenseId))
      .returning();
    return license;
  }

  // Revenue operations
  static async recordRevenue(data: {
    amount: string;
    token?: string;
    source: string;
    licenseId?: string;
    txHash?: string;
    blockNumber?: number;
  }) {
    const [record] = await db.insert(schema.revenueRecords).values(data).returning();
    return record;
  }

  static async getRevenueStats(timeframe: 'day' | 'week' | 'month' = 'month') {
    const timeAgo = new Date();
    switch (timeframe) {
      case 'day':
        timeAgo.setDate(timeAgo.getDate() - 1);
        break;
      case 'week':
        timeAgo.setDate(timeAgo.getDate() - 7);
        break;
      case 'month':
        timeAgo.setMonth(timeAgo.getMonth() - 1);
        break;
    }

    return await db.select().from(schema.revenueRecords)
      .where(gte(schema.revenueRecords.timestamp, timeAgo))
      .orderBy(desc(schema.revenueRecords.timestamp));
  }

  // Marketplace operations
  static async createListing(data: {
    domainId: string;
    sellerId: string;
    priceInEth?: string;
    priceInNxd?: string;
    preferredToken?: string;
  }) {
    const [listing] = await db.insert(schema.marketplaceListings).values(data).returning();
    return listing;
  }

  static async getActiveListings(limit = 50) {
    return await db.select().from(schema.marketplaceListings)
      .where(eq(schema.marketplaceListings.isActive, true))
      .orderBy(desc(schema.marketplaceListings.listedAt))
      .limit(limit);
  }

  static async updateListingSold(listingId: string, buyerId: string, salePrice: string, saleToken?: string) {
    const [listing] = await db.update(schema.marketplaceListings)
      .set({
        isActive: false,
        soldAt: new Date(),
        buyerId,
        salePrice,
        saleToken,
      })
      .where(eq(schema.marketplaceListings.id, listingId))
      .returning();
    return listing;
  }

  // Audit operations
  static async createAuditLog(data: {
    action: string;
    component: string;
    userId?: string;
    details?: any;
    ipfsHash?: string;
    txHash?: string;
    blockNumber?: number;
    isPublic?: boolean;
  }) {
    const [log] = await db.insert(schema.auditLogs).values({
      ...data,
      isPublic: data.isPublic ?? true,
    }).returning();
    return log;
  }

  static async getAuditLogs(isPublic = true, limit = 100) {
    return await db.select().from(schema.auditLogs)
      .where(eq(schema.auditLogs.isPublic, isPublic))
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit);
  }

  // Communication operations
  static async recordCommunication(data: {
    userId: string;
    domainId?: string;
    type: 'message' | 'voice' | 'data';
    dataHash?: string;
    recipient?: string;
    cstAmount?: string;
    txHash?: string;
  }) {
    const [record] = await db.insert(schema.communicationRecords).values(data).returning();
    return record;
  }

  // AI operations
  static async recordAIInteraction(data: {
    userId?: string;
    prompt: string;
    response?: string;
    model?: string;
    type?: string;
    creditsConsumed?: number;
  }) {
    const [interaction] = await db.insert(schema.aiInteractions).values(data).returning();
    return interaction;
  }

  static async getUserAIUsage(userId: string, timeframe: 'day' | 'month' = 'day') {
    const timeAgo = new Date();
    if (timeframe === 'day') {
      timeAgo.setDate(timeAgo.getDate() - 1);
    } else {
      timeAgo.setMonth(timeAgo.getMonth() - 1);
    }

    const result = await db.select({
      totalCredits: count(schema.aiInteractions.creditsConsumed)
    }).from(schema.aiInteractions)
      .where(and(
        eq(schema.aiInteractions.userId, userId),
        gte(schema.aiInteractions.timestamp, timeAgo)
      ));

    return result[0]?.totalCredits || 0;
  }

  // CST compliance operations
  static async recordCST(data: {
    userId: string;
    serviceType: string;
    amount: string;
    cstAmount: string;
    cstRate: string;
    txHash?: string;
  }) {
    const [record] = await db.insert(schema.cstRecords).values(data).returning();
    return record;
  }

  static async getUnremittedCST() {
    return await db.select().from(schema.cstRecords)
      .where(eq(schema.cstRecords.isRemitted, false));
  }

  static async markCSTRemitted(recordIds: string[]) {
    return await db.update(schema.cstRecords)
      .set({ isRemitted: true, remittedAt: new Date() })
      .where(eq(schema.cstRecords.id, recordIds[0])); // This would need proper IN clause
  }
}
