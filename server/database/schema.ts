
import { pgTable, text, timestamp, integer, boolean, decimal, jsonb, uuid, varchar, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 42 }).unique().notNull(),
  username: varchar('username', { length: 50 }),
  email: varchar('email', { length: 255 }),
  avatar: text('avatar'),
  nxdBalance: decimal('nxd_balance', { precision: 18, scale: 0 }).default('0'),
  stakedAmount: decimal('staked_amount', { precision: 18, scale: 0 }).default('0'),
  stakingStartTime: timestamp('staking_start_time'),
  tier: integer('tier').default(0),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Domains table
export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 63 }).notNull(),
  tld: varchar('tld', { length: 10 }).notNull(),
  fullDomain: varchar('full_domain', { length: 74 }).unique().notNull(), // name.tld
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  ipfsHash: text('ipfs_hash'),
  resolver: varchar('resolver', { length: 42 }),
  registeredAt: timestamp('registered_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  subscriptionTier: integer('subscription_tier').default(0),
  isPremium: boolean('is_premium').default(false),
  whiteLabelId: uuid('white_label_id'),
  nxdScore: integer('nxd_score').default(0),
  status: varchar('status', { length: 20 }).default('active'), // active, expired, pending
  records: jsonb('records').default({}),
  analytics: jsonb('analytics').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// TLDs table
export const tlds = pgTable('tlds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 10 }).unique().notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  registrationFee: decimal('registration_fee', { precision: 18, scale: 0 }).notNull(),
  premiumFee: decimal('premium_fee', { precision: 18, scale: 0 }).notNull(),
  nxdStakeRequired: decimal('nxd_stake_required', { precision: 18, scale: 0 }).default('0'),
  isActive: boolean('is_active').default(true),
  requiresKyc: boolean('requires_kyc').default(false),
  totalDomains: integer('total_domains').default(0),
  paymentToken: varchar('payment_token', { length: 42 }),
  royaltyPercentage: integer('royalty_percentage').default(250), // basis points
  whiteLabelId: uuid('white_label_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Staking records
export const stakingRecords = pgTable('staking_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 18, scale: 0 }).notNull(),
  action: varchar('action', { length: 10 }).notNull(), // stake, unstake
  txHash: varchar('tx_hash', { length: 66 }),
  blockNumber: bigint('block_number', { mode: 'number' }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Governance proposals
export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: integer('proposal_id').unique().notNull(),
  proposerId: uuid('proposer_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  forVotes: decimal('for_votes', { precision: 18, scale: 0 }).default('0'),
  againstVotes: decimal('against_votes', { precision: 18, scale: 0 }).default('0'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  executeTime: timestamp('execute_time'),
  executed: boolean('executed').default(false),
  callData: text('call_data'),
  targetContract: varchar('target_contract', { length: 42 }),
  status: varchar('status', { length: 20 }).default('active'), // active, passed, failed, executed
  createdAt: timestamp('created_at').defaultNow(),
});

// Governance votes
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id).notNull(),
  voterId: uuid('voter_id').references(() => users.id).notNull(),
  support: boolean('support').notNull(), // true for, false against
  weight: decimal('weight', { precision: 18, scale: 0 }).notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// White label licenses
export const whiteLabelLicenses = pgTable('white_label_licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  licenseId: integer('license_id').unique().notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  brandName: varchar('brand_name', { length: 100 }).notNull(),
  tier: varchar('tier', { length: 20 }).notNull(), // BASIC, PROFESSIONAL, ENTERPRISE
  nxdStaked: decimal('nxd_staked', { precision: 18, scale: 0 }).notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  isActive: boolean('is_active').default(true),
  apiCallLimit: integer('api_call_limit').notNull(),
  apiCallsUsed: integer('api_calls_used').default(0),
  revenueGenerated: decimal('revenue_generated', { precision: 18, scale: 0 }).default('0'),
  revenueSharePercentage: integer('revenue_share_percentage').notNull(),
  allowedTlds: jsonb('allowed_tlds').default([]),
  customFeatures: jsonb('custom_features').default({}),
});

// Revenue records
export const revenueRecords = pgTable('revenue_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: decimal('amount', { precision: 18, scale: 0 }).notNull(),
  token: varchar('token', { length: 42 }), // null for ETH
  source: varchar('source', { length: 50 }).notNull(), // domain_registration, marketplace_sale, etc.
  licenseId: uuid('license_id').references(() => whiteLabelLicenses.id),
  txHash: varchar('tx_hash', { length: 66 }),
  blockNumber: bigint('block_number', { mode: 'number' }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Marketplace listings
export const marketplaceListings = pgTable('marketplace_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: uuid('domain_id').references(() => domains.id).notNull(),
  sellerId: uuid('seller_id').references(() => users.id).notNull(),
  priceInEth: decimal('price_in_eth', { precision: 18, scale: 0 }),
  priceInNxd: decimal('price_in_nxd', { precision: 18, scale: 0 }),
  preferredToken: varchar('preferred_token', { length: 42 }),
  isActive: boolean('is_active').default(true),
  listedAt: timestamp('listed_at').defaultNow(),
  soldAt: timestamp('sold_at'),
  buyerId: uuid('buyer_id').references(() => users.id),
  salePrice: decimal('sale_price', { precision: 18, scale: 0 }),
  saleToken: varchar('sale_token', { length: 42 }),
});

// Communication records
export const communicationRecords = pgTable('communication_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  domainId: uuid('domain_id').references(() => domains.id),
  type: varchar('type', { length: 20 }).notNull(), // message, voice, data
  dataHash: text('data_hash'), // IPFS hash
  recipient: varchar('recipient', { length: 42 }),
  cstAmount: decimal('cst_amount', { precision: 10, scale: 2 }).default('0'),
  txHash: varchar('tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Satellite telemetry
export const satelliteTelemetry = pgTable('satellite_telemetry', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  domainId: uuid('domain_id').references(() => domains.id),
  satelliteId: varchar('satellite_id', { length: 50 }),
  telemetryData: jsonb('telemetry_data').notNull(),
  dataHash: text('data_hash'), // IPFS hash
  cstAmount: decimal('cst_amount', { precision: 10, scale: 2 }).default('0'),
  txHash: varchar('tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// IoT data
export const iotData = pgTable('iot_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  domainId: uuid('domain_id').references(() => domains.id),
  deviceId: varchar('device_id', { length: 100 }).notNull(),
  data: jsonb('data').notNull(),
  dataHash: text('data_hash'), // IPFS hash
  cstAmount: decimal('cst_amount', { precision: 10, scale: 2 }).default('0'),
  txHash: varchar('tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Audit logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action', { length: 100 }).notNull(),
  component: varchar('component', { length: 50 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  details: jsonb('details').default({}),
  ipfsHash: text('ipfs_hash'),
  txHash: varchar('tx_hash', { length: 66 }),
  blockNumber: bigint('block_number', { mode: 'number' }),
  isPublic: boolean('is_public').default(true),
  timestamp: timestamp('timestamp').defaultNow(),
});

// CST records for compliance
export const cstRecords = pgTable('cst_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  serviceType: varchar('service_type', { length: 50 }).notNull(), // communication, satellite, iot
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  cstAmount: decimal('cst_amount', { precision: 10, scale: 2 }).notNull(),
  cstRate: decimal('cst_rate', { precision: 5, scale: 4 }).notNull(), // 0.0572 for Miami
  isRemitted: boolean('is_remitted').default(false),
  remittedAt: timestamp('remitted_at'),
  txHash: varchar('tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// AI interactions
export const aiInteractions = pgTable('ai_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  prompt: text('prompt').notNull(),
  response: text('response'),
  model: varchar('model', { length: 50 }).default('grok'),
  type: varchar('type', { length: 50 }), // chat, domain_suggestion, analytics, etc.
  credits_consumed: integer('credits_consumed').default(1),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  domains: many(domains),
  stakingRecords: many(stakingRecords),
  proposals: many(proposals),
  votes: many(votes),
  whiteLabelLicenses: many(whiteLabelLicenses),
  marketplaceListings: many(marketplaceListings),
  communicationRecords: many(communicationRecords),
  satelliteTelemetry: many(satelliteTelemetry),
  iotData: many(iotData),
  auditLogs: many(auditLogs),
  cstRecords: many(cstRecords),
  aiInteractions: many(aiInteractions),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
  owner: one(users, {
    fields: [domains.ownerId],
    references: [users.id],
  }),
  tld: one(tlds, {
    fields: [domains.tld],
    references: [tlds.name],
  }),
  marketplaceListings: many(marketplaceListings),
  communicationRecords: many(communicationRecords),
  satelliteTelemetry: many(satelliteTelemetry),
  iotData: many(iotData),
}));

export const tldsRelations = relations(tlds, ({ one, many }) => ({
  owner: one(users, {
    fields: [tlds.ownerId],
    references: [users.id],
  }),
  domains: many(domains),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  proposer: one(users, {
    fields: [proposals.proposerId],
    references: [users.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  proposal: one(proposals, {
    fields: [votes.proposalId],
    references: [proposals.id],
  }),
  voter: one(users, {
    fields: [votes.voterId],
    references: [users.id],
  }),
}));
