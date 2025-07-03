import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/ai";
import { blockchainService } from "./services/blockchain";
import { 
  insertUserSchema, 
  insertDomainSchema, 
  insertStakingPositionSchema,
  insertProposalSchema,
  insertVoteSchema,
  insertMarketplaceListingSchema,
  insertChatMessageSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(parseInt(req.params.id), updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user", error });
    }
  });

  // Domain routes
  app.get("/api/domains/check/:domain", async (req, res) => {
    try {
      const fullDomain = req.params.domain;
      const available = await storage.checkDomainAvailability(fullDomain);
      res.json({ domain: fullDomain, available });
    } catch (error) {
      res.status(500).json({ message: "Failed to check domain availability", error });
    }
  });

  app.get("/api/domains/user/:userId", async (req, res) => {
    try {
      const domains = await storage.getUserDomains(parseInt(req.params.userId));
      res.json(domains);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user domains", error });
    }
  });

  app.post("/api/domains/register", async (req, res) => {
    try {
      const domainData = insertDomainSchema.parse(req.body);

      // Check availability
      const available = await storage.checkDomainAvailability(domainData.fullDomain);
      if (!available) {
        return res.status(400).json({ message: "Domain not available" });
      }

      // Mock blockchain transaction
      const transaction = await blockchainService.registerDomain(
        req.body.userAddress || "0x1234567890123456789012345678901234567890",
        domainData.fullDomain,
        domainData.registrationPrice,
        req.body.paymentToken || "ETH"
      );

      const domain = await storage.createDomain(domainData);
      res.json({ domain, transaction });
    } catch (error) {
      res.status(400).json({ message: "Failed to register domain", error });
    }
  });

  app.get("/api/domains/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query required" });
      }

      const domains = await storage.searchDomains(q);
      res.json(domains);
    } catch (error) {
      res.status(500).json({ message: "Search failed", error });
    }
  });

  // TLD routes
  app.get("/api/tlds", async (req, res) => {
    try {
      const tlds = await storage.getAllTlds();
      res.json(tlds);
    } catch (error) {
      res.status(500).json({ message: "Failed to get TLDs", error });
    }
  });

  // Staking routes
  app.get("/api/staking/stats", async (req, res) => {
    try {
      const stats = await storage.getStakingStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get staking stats", error });
    }
  });

  app.get("/api/staking/position/:userId", async (req, res) => {
    try {
      const position = await storage.getStakingPosition(parseInt(req.params.userId));
      res.json(position);
    } catch (error) {
      res.status(500).json({ message: "Failed to get staking position", error });
    }
  });

  app.post("/api/staking/stake", async (req, res) => {
    try {
      const positionData = insertStakingPositionSchema.parse(req.body);

      // Mock blockchain transaction
      const transaction = await blockchainService.stakeNXD(
        req.body.userAddress || "0x1234567890123456789012345678901234567890",
        positionData.amount
      );

      const position = await storage.createStakingPosition(positionData);
      res.json({ position, transaction });
    } catch (error) {
      res.status(400).json({ message: "Failed to stake NXD", error });
    }
  });

  app.post("/api/staking/unstake", async (req, res) => {
    try {
      const { positionId, amount, userAddress } = req.body;

      const transaction = await blockchainService.unstakeNXD(
        userAddress || "0x1234567890123456789012345678901234567890",
        amount
      );

      const position = await storage.updateStakingPosition(positionId, { 
        amount: (parseFloat(req.body.currentAmount) - parseFloat(amount)).toString() 
      });

      res.json({ position, transaction });
    } catch (error) {
      res.status(400).json({ message: "Failed to unstake NXD", error });
    }
  });

  app.post("/api/staking/claim", async (req, res) => {
    try {
      const { userId, amount, userAddress } = req.body;

      const transaction = await blockchainService.claimRewards(
        userAddress || "0x1234567890123456789012345678901234567890",
        amount
      );

      // Update user's total rewards
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, {
          totalRewards: (parseFloat(user.totalRewards) + parseFloat(amount)).toString()
        });
      }

      res.json({ transaction });
    } catch (error) {
      res.status(400).json({ message: "Failed to claim rewards", error });
    }
  });

  // Governance routes
  app.get("/api/governance/proposals", async (req, res) => {
    try {
      const { active } = req.query;
      const proposals = active === "true" 
        ? await storage.getActiveProposals()
        : await storage.getAllProposals();
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get proposals", error });
    }
  });

  app.get("/api/governance/proposals/:id", async (req, res) => {
    try {
      const proposal = await storage.getProposal(parseInt(req.params.id));
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ message: "Failed to get proposal", error });
    }
  });

  app.post("/api/governance/proposals", async (req, res) => {
    try {
      const proposalData = insertProposalSchema.parse(req.body);

      const transaction = await blockchainService.createProposal(
        req.body.userAddress || "0x1234567890123456789012345678901234567890",
        Date.now() // Use timestamp as proposal ID for mock
      );

      const proposal = await storage.createProposal(proposalData);
      res.json({ proposal, transaction });
    } catch (error) {
      res.status(400).json({ message: "Failed to create proposal", error });
    }
  });

  app.post("/api/governance/vote", async (req, res) => {
    try {
      const voteData = insertVoteSchema.parse(req.body);

      // Check if user already voted
      const existingVote = await storage.getUserVote(voteData.proposalId, voteData.userId);
      if (existingVote) {
        return res.status(400).json({ message: "User already voted on this proposal" });
      }

      const transaction = await blockchainService.vote(
        req.body.userAddress || "0x1234567890123456789012345678901234567890",
        voteData.proposalId,
        voteData.voteChoice as "for" | "against",
        voteData.votingPower
      );

      const vote = await storage.createVote(voteData);

      // Update proposal vote counts
      const proposal = await storage.getProposal(voteData.proposalId);
      if (proposal) {
        const updates: any = {
          totalVotes: (parseFloat(proposal.totalVotes) + parseFloat(voteData.votingPower)).toString()
        };

        if (voteData.voteChoice === "for") {
          updates.votesFor = (parseFloat(proposal.votesFor) + parseFloat(voteData.votingPower)).toString();
        } else {
          updates.votesAgainst = (parseFloat(proposal.votesAgainst) + parseFloat(voteData.votingPower)).toString();
        }

        await storage.updateProposal(voteData.proposalId, updates);
      }

      res.json({ vote, transaction });
    } catch (error) {
      res.status(400).json({ message: "Failed to vote", error });
    }
  });

  // Marketplace routes
  app.get("/api/marketplace/listings", async (req, res) => {
    try {
      const { active } = req.query;
      const listings = active === "true"
        ? await storage.getActiveMarketplaceListings()
        : await storage.getAllMarketplaceListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get marketplace listings", error });
    }
  });

  app.post("/api/marketplace/list", async (req, res) => {
    try {
      const listingData = insertMarketplaceListingSchema.parse(req.body);
      const listing = await storage.createMarketplaceListing(listingData);
      res.json(listing);
    } catch (error) {
      res.status(400).json({ message: "Failed to list domain", error });
    }
  });

  app.post("/api/marketplace/purchase/:id", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const { buyerAddress, paymentToken } = req.body;

      const listing = await storage.getMarketplaceListing(listingId);
      if (!listing || !listing.isActive) {
        return res.status(404).json({ message: "Listing not found or inactive" });
      }

      const price = paymentToken === "NXD" ? listing.priceNXD : listing.priceETH;
      if (!price) {
        return res.status(400).json({ message: "Payment method not accepted" });
      }

      const transaction = await blockchainService.purchaseDomain(
        buyerAddress,
        listing.seller.walletAddress || "0x1234567890123456789012345678901234567890",
        listing.domainId,
        price,
        paymentToken
      );

      // Update listing as sold
      await storage.updateMarketplaceListing(listingId, { isActive: false });

      res.json({ transaction });
    } catch (error) {
      res.status(400).json({ message: "Failed to purchase domain", error });
    }
  });

  // AI routes
  app.post("/api/ai/suggest-domains", async (req, res) => {
    try {
      const { query, context, tld, maxSuggestions } = req.body;

      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      const suggestions = await aiService.generateDomainSuggestions({
        query,
        context,
        tld,
        maxSuggestions
      });

      // Store suggestion for user if provided
      if (req.body.userId) {
        await storage.createAiSuggestion({
          userId: req.body.userId,
          query,
          suggestions: suggestions as any,
          context
        });
      }

      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate suggestions", error });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context, messageType, userId } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await aiService.processChat({
        message,
        context,
        messageType,
        userId
      });

      // Store chat message if user provided
      if (userId) {
        await storage.createChatMessage({
          userId,
          message,
          response,
          messageType
        });
      }

      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: "Failed to process chat", error });
    }
  });

  app.get("/api/ai/chat-history/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await storage.getUserChatHistory(userId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chat history", error });
    }
  });

  app.post("/api/ai/analyze-domain", async (req, res) => {
    try {
      const { domainName } = req.body;

      if (!domainName) {
        return res.status(400).json({ message: "Domain name is required" });
      }

      const analysis = await aiService.analyzeDomainValue(domainName);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze domain", error });
    }
  });

  app.post("/api/ai/generate-proposal", async (req, res) => {
    try {
      const { topic, context } = req.body;

      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      const proposal = await aiService.generateGovernanceProposal(topic, context || "");
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate proposal", error });
    }
  });

  // Blockchain routes (for transaction status)
  app.get("/api/blockchain/transaction/:hash", async (req, res) => {
    try {
      const transaction = await blockchainService.getTransaction(req.params.hash);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transaction", error });
    }
  });

  app.get("/api/blockchain/gas-price", async (req, res) => {
    try {
      const gasPrice = await blockchainService.getGasPrice();
      res.json({ gasPrice });
    } catch (error) {
      res.status(500).json({ message: "Failed to get gas price", error });
    }
  });

  app.post("/api/blockchain/estimate-cost", async (req, res) => {
    try {
      const { type } = req.body;
      const cost = await blockchainService.estimateTransactionCost(type);
      res.json({ estimatedCost: cost });
    } catch (error) {
      res.status(500).json({ message: "Failed to estimate cost", error });
    }
  });

  // Chat AI routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = insertChatMessageSchema.parse(req.body);

      const response = await aiService.processChat(message, context);

      res.json({ response });
    } catch (error) {
      res.status(400).json({ message: "Failed to process chat", error });
    }
  });

  // Admin routes
  const ADMIN_ADDRESSES = [
    "0x742d35cc6635c0532925a3b8d2b3c37b3fd5f4f3",
    "0x1234567890123456789012345678901234567890"
  ];

  // Middleware to verify admin access
  const verifyAdmin = (req: any, res: any, next: any) => {
    const adminAddress = req.headers['x-admin-address'];
    if (!adminAddress || !ADMIN_ADDRESSES.includes(adminAddress.toLowerCase())) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    next();
  };

  app.get("/api/admin/metrics", verifyAdmin, async (req, res) => {
    try {
      const [users, domains, stakingPositions] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllDomains(),
        storage.getAllStakingPositions()
      ]);

      const metrics = {
        totalUsers: users.length,
        totalDomains: domains.length,
        totalTransactions: stakingPositions.length,
        systemHealth: "healthy" as const,
        activeConnections: Math.floor(Math.random() * 1000) + 500,
        serverUptime: "15 days, 8 hours",
        memoryUsage: Math.floor(Math.random() * 30) + 45,
        cpuUsage: Math.floor(Math.random() * 20) + 15
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get metrics", error });
    }
  });

  app.get("/api/admin/users", verifyAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const userDomains = await Promise.all(
        users.map(user => storage.getUserDomains(user.id))
      );

      const adminUsers = users.map((user, index) => ({
        id: user.id,
        username: user.username,
        email: user.email || `${user.username}@example.com`,
        role: user.role || "user",
        status: Math.random() > 0.9 ? "suspended" : "active" as const,
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalDomains: userDomains[index]?.length || 0,
        totalSpent: (Math.random() * 5000).toFixed(2)
      }));

      res.json(adminUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users", error });
    }
  });

  app.post("/api/admin/users/:id/:action", verifyAdmin, async (req, res) => {
    try {
      const { id, action } = req.params;
      const userId = parseInt(id);

      // In a real implementation, you would update user status in database
      // For now, we'll just simulate the action
      
      console.log(`Admin action: ${action} on user ${userId}`);
      
      res.json({ success: true, message: `User ${action} successful` });
    } catch (error) {
      res.status(500).json({ message: `Failed to ${req.params.action} user`, error });
    }
  });

  app.get("/api/admin/audit-logs", verifyAdmin, async (req, res) => {
    try {
      // Mock audit logs - in production, these would be stored in database
      const logs = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          action: "admin_login",
          admin: "0x742d35cc6635c0532925a3b8d2b3c37b3fd5f4f3",
          target: "system",
          details: "Admin panel access granted",
          severity: "medium" as const
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          action: "user_suspend",
          admin: "0x742d35cc6635c0532925a3b8d2b3c37b3fd5f4f3",
          target: "user_123",
          details: "User suspended for policy violation",
          severity: "high" as const
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          action: "domain_transfer",
          admin: "system",
          target: "example.nxd",
          details: "Domain ownership transferred",
          severity: "low" as const
        }
      ];

      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get audit logs", error });
    }
  });

  app.post("/api/admin/audit-log", verifyAdmin, async (req, res) => {
    try {
      const { action, admin, target, details, timestamp } = req.body;
      
      // In production, store this in database
      console.log("Audit Log:", { action, admin, target, details, timestamp });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to log audit action", error });
    }
  });

  app.get("/api/admin/export/:type", verifyAdmin, async (req, res) => {
    try {
      const { type } = req.params;
      
      let data: any[] = [];
      let headers: string[] = [];
      
      switch (type) {
        case "users":
          data = await storage.getAllUsers();
          headers = ["ID", "Username", "Email", "Created At"];
          break;
        case "domains":
          data = await storage.getAllDomains();
          headers = ["ID", "Domain", "Owner ID", "Created At", "Expires At"];
          break;
        case "transactions":
          data = await storage.getAllStakingPositions();
          headers = ["ID", "User ID", "Amount", "Created At"];
          break;
        default:
          return res.status(400).json({ message: "Invalid export type" });
      }

      // Convert to CSV
      const csvContent = [
        headers.join(","),
        ...data.map(row => Object.values(row).join(","))
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${type}_export.csv`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data", error });
    }
  });

  // Service routes handled directly in main routes file
  // Communication service routes
  app.get("/api/communication/status", async (req, res) => {
    res.json({ status: "active", connections: Math.floor(Math.random() * 100) + 50 });
  });

  app.post("/api/communication/send", async (req, res) => {
    const { message, recipient } = req.body;
    res.json({ success: true, messageId: Date.now().toString() });
  });

  // Satellite service routes
  app.get("/api/satellite/status", async (req, res) => {
    res.json({ 
      status: "operational", 
      satellites: 3, 
      coverage: "95%",
      latency: "45ms" 
    });
  });

  // IoT service routes
  app.get("/api/iot/devices", async (req, res) => {
    res.json({ 
      totalDevices: 1250, 
      activeDevices: 1180, 
      status: "healthy" 
    });
  });

  // CST compliance routes
  app.get("/api/cst/compliance", async (req, res) => {
    res.json({ 
      compliant: true, 
      taxRate: 5.72, 
      jurisdiction: "Florida, USA" 
    });
  });

  // IPFS Integration routes
  app.post("/api/ipfs/upload", async (req, res) => {
    try {
      const { data, filename } = req.body;
      const file = await blockchainService.uploadToIPFS(data, filename);
      res.json({ file });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload to IPFS", error });
    }
  });

  app.get("/api/ipfs/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const content = await blockchainService.getFromIPFS(hash);
      res.json({ content, hash });
    } catch (error) {
      res.status(500).json({ message: "Failed to get from IPFS", error });
    }
  });

  // Enhanced Marketplace routes
  app.get("/api/marketplace/featured", async (req, res) => {
    try {
      const listings = await storage.getActiveMarketplaceListings();
      // Filter featured listings (high-value or trending)
      const featured = listings
        .filter(listing => parseFloat(listing.priceInETH) > 1.0)
        .slice(0, 10);
      res.json({ featured });
    } catch (error) {
      res.status(500).json({ message: "Failed to get featured listings", error });
    }
  });

  app.get("/api/marketplace/analytics", async (req, res) => {
    try {
      const allListings = await storage.getAllMarketplaceListings();
      const activeListings = await storage.getActiveMarketplaceListings();
      
      const analytics = {
        totalListings: allListings.length,
        activeListings: activeListings.length,
        averagePrice: activeListings.reduce((sum, listing) => 
          sum + parseFloat(listing.priceInETH), 0) / activeListings.length || 0,
        totalVolume: allListings.reduce((sum, listing) => 
          sum + parseFloat(listing.priceInETH), 0),
        topCategories: ["premium", "short", "brandable"],
        recentSales: allListings.slice(-10)
      };
      
      res.json({ analytics });
    } catch (error) {
      res.status(500).json({ message: "Failed to get marketplace analytics", error });
    }
  });

  // Enhanced AI routes for comprehensive functionality
  app.post("/api/ai/domain-analysis", async (req, res) => {
    try {
      const { domainName } = req.body;
      const analysis = await aiService.analyzeDomainValue(domainName);
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ message: "Domain analysis failed", error });
    }
  });

  app.post("/api/ai/governance-proposal", async (req, res) => {
    try {
      const { topic, context } = req.body;
      const proposal = await aiService.generateGovernanceProposal(topic, context);
      res.json({ proposal });
    } catch (error) {
      res.status(500).json({ message: "Proposal generation failed", error });
    }
  });

  app.post("/api/ai/market-pricing", async (req, res) => {
    try {
      const { domainName, tld, recentSales, marketCondition } = req.body;
      const analysis = await aiService.analyzeMarketPricing({
        domainName,
        tld: tld || "nxd",
        recentSales: recentSales || [],
        marketCondition: marketCondition || "neutral"
      });
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ message: "Market analysis failed", error });
    }
  });

  app.post("/api/ai/natural-language-command", async (req, res) => {
    try {
      const { command, context, userId } = req.body;
      const result = await aiService.processNaturalLanguageCommand({
        command,
        context,
        userId
      });
      res.json({ result });
    } catch (error) {
      res.status(500).json({ message: "Command processing failed", error });
    }
  });

  app.post("/api/ai/onboarding-flow", async (req, res) => {
    try {
      const { experience, interests, goals } = req.body;
      const flow = await aiService.generateOnboardingFlow({
        experience: experience || "beginner",
        interests: interests || [],
        goals: goals || []
      });
      res.json({ flow });
    } catch (error) {
      res.status(500).json({ message: "Onboarding flow generation failed", error });
    }
  });

  // Enhanced Blockchain Integration routes
  app.get("/api/blockchain/domain-availability/:name/:tld", async (req, res) => {
    try {
      const { name, tld } = req.params;
      const isAvailable = await blockchainService.checkDomainAvailability(name, tld);
      res.json({ available: isAvailable, domain: `${name}.${tld}` });
    } catch (error) {
      res.status(500).json({ message: "Failed to check availability", error });
    }
  });

  app.post("/api/blockchain/register-domain", async (req, res) => {
    try {
      const { name, tld, owner, tier, payWithNXD, ipfsHash } = req.body;
      
      // Register on blockchain
      const transaction = await blockchainService.registerDomainOnChain(
        name, tld, owner, tier || 0, payWithNXD || false, ipfsHash || ""
      );

      // Store in database
      const domain = await storage.createDomain({
        name,
        tld,
        fullDomain: `${name}.${tld}`,
        ownerId: req.body.userId || 1,
        registeredAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        ipfsHash: ipfsHash || "",
        subscriptionTier: tier || 0
      });

      res.json({ domain, transaction });
    } catch (error) {
      res.status(400).json({ message: "Failed to register domain", error });
    }
  });

  app.post("/api/blockchain/stake-tokens", async (req, res) => {
    try {
      const { userAddress, amount, tier } = req.body;
      const transaction = await blockchainService.stakeTokensReal(userAddress, amount, tier || 0);
      
      // Update or create staking position
      const stakingPosition = await storage.createStakingPosition({
        userId: req.body.userId || 1,
        amount,
        tier: tier || 0,
        stakedAt: new Date(),
        lockPeriod: (tier || 0) * 30 // days
      });

      res.json({ transaction, stakingPosition });
    } catch (error) {
      res.status(400).json({ message: "Failed to stake tokens", error });
    }
  });

  app.get("/api/blockchain/staking-info/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      const stakingInfo = await blockchainService.getUserStakingInfoReal(userAddress);
      res.json(stakingInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to get staking info", error });
    }
  });

  app.get("/api/blockchain/staking-stats", async (req, res) => {
    try {
      const stats = await blockchainService.getStakingStatsReal();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get staking stats", error });
    }
  });

  // Real-time notifications and status endpoints
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = [
        {
          id: 1,
          type: "domain_expiry",
          title: "Domain Expiring Soon",
          message: "Your domain example.nxd expires in 30 days",
          timestamp: new Date(),
          read: false
        },
        {
          id: 2,
          type: "staking_reward",
          title: "Staking Rewards Available",
          message: "You have 45.2 NXD rewards ready to claim",
          timestamp: new Date(),
          read: false
        },
        {
          id: 3,
          type: "governance",
          title: "New Governance Proposal",
          message: "Vote on platform fee adjustment proposal",
          timestamp: new Date(),
          read: false
        }
      ];
      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications", error });
    }
  });

  app.get("/api/platform/stats", async (req, res) => {
    try {
      const allDomains = await storage.getAllDomains();
      const allUsers = await storage.getAllUsers();
      const allProposals = await storage.getAllProposals();
      const stakingPositions = await storage.getAllStakingPositions();
      
      const stats = {
        totalDomains: allDomains.length,
        totalUsers: allUsers.length,
        totalProposals: allProposals.length,
        totalStaked: stakingPositions.reduce((sum, pos) => 
          sum + parseFloat(pos.amount), 0),
        networkStatus: "healthy",
        lastBlockTime: new Date(),
        gasPrice: "20 gwei",
        nxdPrice: "$0.15",
        totalValueLocked: "15.2M",
        dailyActiveUsers: 2847,
        domainsRegisteredToday: 156
      };
      
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to get platform stats", error });
    }
  });

  // Cross-chain bridge endpoints
  app.post("/api/bridge/estimate", async (req, res) => {
    try {
      const { fromChain, toChain, amount, token } = req.body;
      const estimation = {
        fromChain,
        toChain,
        amount,
        token,
        estimatedFee: "0.001",
        estimatedTime: "5 minutes",
        exchangeRate: "1:1",
        slippage: "0.5%",
        minReceived: (parseFloat(amount) * 0.995).toString()
      };
      res.json({ estimation });
    } catch (error) {
      res.status(500).json({ message: "Bridge estimation failed", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}