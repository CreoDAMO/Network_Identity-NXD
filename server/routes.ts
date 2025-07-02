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

  const httpServer = createServer(app);
  return httpServer;
}
