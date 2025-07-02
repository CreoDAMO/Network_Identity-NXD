import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  nxdBalance: decimal("nxd_balance", { precision: 18, scale: 6 }).default("0"),
  nxdStaked: decimal("nxd_staked", { precision: 18, scale: 6 }).default("0"),
  totalRewards: decimal("total_rewards", { precision: 18, scale: 6 }).default("0"),
  votingPower: decimal("voting_power", { precision: 18, scale: 6 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Domains table
export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tld: text("tld").notNull().default("nxd"),
  fullDomain: text("full_domain").notNull().unique(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  registeredAt: timestamp("registered_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isPremium: boolean("is_premium").default(false),
  registrationPrice: decimal("registration_price", { precision: 18, scale: 6 }).notNull(),
  monthlyVisitors: integer("monthly_visitors").default(0),
  nxdRewards: decimal("nxd_rewards", { precision: 18, scale: 6 }).default("0"),
  status: text("status").default("active"), // active, expired, transferred
  ipfsHash: text("ipfs_hash"),
  metadata: json("metadata"),
});

// TLD configurations
export const tlds = pgTable("tlds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  basePrice: decimal("base_price", { precision: 18, scale: 6 }).notNull(),
  premiumMultiplier: decimal("premium_multiplier", { precision: 3, scale: 2 }).default("2.0"),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staking positions
export const stakingPositions = pgTable("staking_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 18, scale: 6 }).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  lastRewardClaim: timestamp("last_reward_claim").defaultNow(),
  currentApy: decimal("current_apy", { precision: 5, scale: 2 }).notNull(),
  tier: text("tier").default("bronze"), // bronze, silver, gold
  isActive: boolean("is_active").default(true),
});

// Governance proposals
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proposerId: integer("proposer_id").references(() => users.id).notNull(),
  votesFor: decimal("votes_for", { precision: 18, scale: 6 }).default("0"),
  votesAgainst: decimal("votes_against", { precision: 18, scale: 6 }).default("0"),
  totalVotes: decimal("total_votes", { precision: 18, scale: 6 }).default("0"),
  quorumReached: boolean("quorum_reached").default(false),
  status: text("status").default("active"), // active, passed, rejected, executed
  createdAt: timestamp("created_at").defaultNow(),
  votingEndsAt: timestamp("voting_ends_at").notNull(),
  executedAt: timestamp("executed_at"),
});

// User votes on proposals
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  voteChoice: text("vote_choice").notNull(), // for, against
  votingPower: decimal("voting_power", { precision: 18, scale: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketplace listings
export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  domainId: integer("domain_id").references(() => domains.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  priceETH: decimal("price_eth", { precision: 18, scale: 6 }),
  priceNXD: decimal("price_nxd", { precision: 18, scale: 6 }),
  preferredPayment: text("preferred_payment").default("eth"), // eth, nxd, both
  isActive: boolean("is_active").default(true),
  listedAt: timestamp("listed_at").defaultNow(),
  endsAt: timestamp("ends_at"),
  category: text("category").default("standard"), // premium, hot, new, featured, rising, rare
});

// AI suggestions and interactions
export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  query: text("query").notNull(),
  suggestions: json("suggestions").notNull(),
  context: text("context"), // defi, nft, gaming, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages with AI
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  messageType: text("message_type").default("general"), // domain_search, market_analysis, staking_guide, governance_help
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  registeredAt: true,
});

export const insertTldSchema = createInsertSchema(tlds).omit({
  id: true,
  createdAt: true,
});

export const insertStakingPositionSchema = createInsertSchema(stakingPositions).omit({
  id: true,
  startedAt: true,
  lastRewardClaim: true,
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  executedAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  listedAt: true,
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;

export type InsertTld = z.infer<typeof insertTldSchema>;
export type Tld = typeof tlds.$inferSelect;

export type InsertStakingPosition = z.infer<typeof insertStakingPositionSchema>;
export type StakingPosition = typeof stakingPositions.$inferSelect;

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;

export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Extended types for frontend
export type DomainWithOwner = Domain & {
  owner: User;
};

export type ProposalWithProposer = Proposal & {
  proposer: User;
};

export type MarketplaceListingWithDomain = MarketplaceListing & {
  domain: Domain;
  seller: User;
};

export type StakingStats = {
  totalStaked: string;
  currentApy: string;
  poolUtilization: number;
  nextRewardTime: string;
  userPosition?: StakingPosition;
};

export type DomainSuggestion = {
  name: string;
  tld: string;
  fullDomain: string;
  available: boolean;
  price: string;
  category: "available" | "premium" | "taken";
};
