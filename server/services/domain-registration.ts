
import { DatabaseService } from './database.js';
import { BlockchainService } from './blockchain.js';
import { IPFSService } from './ipfs.js';
import { CSTComplianceService } from './cst-compliance.js';
import { AIGatewayService } from './ai-gateway.js';
import crypto from 'crypto';

export interface DomainRegistrationRequest {
  name: string;
  tld: string;
  ownerId: string;
  ownerAddress: string;
  ipfsContent?: string;
  subscriptionTier?: number;
  payWithNXD?: boolean;
  whiteLabelId?: string;
  paymasterSignature?: string;
}

export interface DomainScore {
  baseScore: number;
  lengthBonus: number;
  tldBonus: number;
  tierBonus: number;
  totalScore: number;
}

export class DomainRegistrationService {
  // Core domain scoring algorithm (will be moved to Rust)
  static calculateDomainScore(name: string, tld: string, tier: number = 0): DomainScore {
    let baseScore = 100;
    let lengthBonus = 0;
    let tldBonus = 0;
    let tierBonus = tier * 200;

    // Length-based scoring (shorter = better)
    const nameLength = name.length;
    if (nameLength <= 3) {
      lengthBonus = 300;
    } else if (nameLength <= 5) {
      lengthBonus = 200;
    } else if (nameLength <= 8) {
      lengthBonus = 100;
    }

    // TLD-based scoring
    const premiumTLDs: Record<string, number> = {
      'nxd': 500,
      'dao': 300,
      'defi': 300,
      'web3': 250,
    };
    tldBonus = premiumTLDs[tld] || 0;

    const totalScore = baseScore + lengthBonus + tldBonus + tierBonus;

    return {
      baseScore,
      lengthBonus,
      tldBonus,
      tierBonus,
      totalScore,
    };
  }

  // Validate domain name
  static validateDomainName(name: string): { valid: boolean; error?: string } {
    if (!name || name.length === 0) {
      return { valid: false, error: 'Domain name cannot be empty' };
    }

    if (name.length > 63) {
      return { valid: false, error: 'Domain name cannot exceed 63 characters' };
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      return { valid: false, error: 'Domain name can only contain lowercase letters, numbers, and hyphens' };
    }

    if (name.startsWith('-') || name.endsWith('-')) {
      return { valid: false, error: 'Domain name cannot start or end with a hyphen' };
    }

    if (name.includes('--')) {
      return { valid: false, error: 'Domain name cannot contain consecutive hyphens' };
    }

    return { valid: true };
  }

  // Check domain availability
  static async checkAvailability(name: string, tld: string): Promise<{
    available: boolean;
    domain?: any;
    suggestions?: string[];
  }> {
    const validation = this.validateDomainName(name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fullDomain = `${name}.${tld}`;
    const existingDomain = await DatabaseService.getDomainByName(fullDomain);

    if (existingDomain) {
      return {
        available: false,
        domain: existingDomain,
      };
    }

    // Generate AI-powered suggestions if domain is taken
    let suggestions: string[] = [];
    if (!existingDomain) {
      try {
        const suggestionsResponse = await AIGatewayService.queryGrok(
          `Generate 5 creative domain name suggestions similar to "${name}" for the .${tld} TLD. Focus on Web3, crypto, and tech themes. Return only the names, one per line.`,
          { originalName: name, tld, context: 'domain_suggestions' }
        );
        
        if (suggestionsResponse.response) {
          suggestions = suggestionsResponse.response
            .split('\n')
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 0 && s !== name)
            .slice(0, 5);
        }
      } catch (error) {
        console.error('Failed to generate domain suggestions:', error);
      }
    }

    return {
      available: true,
      suggestions,
    };
  }

  // Register domain
  static async registerDomain(request: DomainRegistrationRequest): Promise<{
    success: boolean;
    domain?: any;
    txHash?: string;
    error?: string;
  }> {
    try {
      // 1. Validate inputs
      const validation = this.validateDomainName(request.name);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 2. Check availability
      const availability = await this.checkAvailability(request.name, request.tld);
      if (!availability.available) {
        return { success: false, error: 'Domain is not available' };
      }

      // 3. Verify TLD exists and is active
      const tld = await DatabaseService.getTLDByName(request.tld);
      if (!tld || !tld.isActive) {
        return { success: false, error: 'TLD is not active or does not exist' };
      }

      // 4. Calculate fees and scoring
      const subscriptionTier = request.subscriptionTier || 0;
      const fee = subscriptionTier > 0 ? tld.premiumFee : tld.registrationFee;
      const domainScore = this.calculateDomainScore(request.name, request.tld, subscriptionTier);

      // 5. Calculate CST if applicable
      let cstAmount = '0';
      if (request.ownerAddress && await CSTComplianceService.isSubjectToCST(request.ownerAddress)) {
        cstAmount = await CSTComplianceService.calculateCST(fee, 'domain_registration');
      }

      // 6. Store content on IPFS if provided
      let ipfsHash = request.ipfsContent ? '' : undefined;
      if (request.ipfsContent) {
        try {
          const ipfsResult = await IPFSService.pinContent(request.ipfsContent, {
            name: `${request.name}.${request.tld}`,
            description: 'Domain content',
          });
          ipfsHash = ipfsResult.hash;
        } catch (error) {
          console.error('IPFS pinning failed:', error);
          // Continue without IPFS - not critical for registration
        }
      }

      // 7. Set expiration (1 year from now)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // 8. Interact with smart contract
      let txHash: string | undefined;
      try {
        const contractResult = await BlockchainService.registerDomain({
          name: request.name,
          tld: request.tld,
          ipfsHash: ipfsHash || '',
          subscriptionTier,
          payWithNXD: request.payWithNXD || false,
          whiteLabelId: request.whiteLabelId ? parseInt(request.whiteLabelId) : 0,
          paymasterSignature: request.paymasterSignature || '',
          from: request.ownerAddress,
        });
        txHash = contractResult.transactionHash;
      } catch (error) {
        console.error('Smart contract interaction failed:', error);
        return { success: false, error: 'Blockchain transaction failed' };
      }

      // 9. Create domain record in database
      const domain = await DatabaseService.createDomain({
        name: request.name,
        tld: request.tld,
        ownerId: request.ownerId,
        ipfsHash,
        subscriptionTier,
        expiresAt,
        whiteLabelId: request.whiteLabelId,
      });

      // 10. Update domain score
      await DatabaseService.updateDomainScore(domain.id, domainScore.totalScore);

      // 11. Record revenue
      await DatabaseService.recordRevenue({
        amount: fee,
        token: request.payWithNXD ? 'NXD' : 'ETH',
        source: 'domain_registration',
        licenseId: request.whiteLabelId,
        txHash,
      });

      // 12. Record CST if applicable
      if (parseFloat(cstAmount) > 0) {
        await DatabaseService.recordCST({
          userId: request.ownerId,
          serviceType: 'domain_registration',
          amount: fee,
          cstAmount,
          cstRate: '0.0572', // Miami rate
          txHash,
        });
      }

      // 13. Create audit log
      await DatabaseService.createAuditLog({
        action: 'domain_registered',
        component: 'domain_registration',
        userId: request.ownerId,
        details: {
          domain: `${request.name}.${request.tld}`,
          subscriptionTier,
          payWithNXD: request.payWithNXD,
          whiteLabelId: request.whiteLabelId,
          score: domainScore.totalScore,
          fee,
          cstAmount,
        },
        txHash,
        isPublic: true,
      });

      // 14. AI-powered domain analysis and suggestions
      try {
        await AIGatewayService.queryGrok(
          `Analyze the newly registered domain "${request.name}.${request.tld}" and provide insights about its potential value, use cases, and market positioning.`,
          {
            domain: `${request.name}.${request.tld}`,
            score: domainScore.totalScore,
            tier: subscriptionTier,
            context: 'domain_analysis',
          }
        );
      } catch (error) {
        console.error('AI analysis failed:', error);
        // Non-critical, continue
      }

      return {
        success: true,
        domain,
        txHash,
      };

    } catch (error) {
      console.error('Domain registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Transfer domain
  static async transferDomain(
    domainId: string,
    fromUserId: string,
    toAddress: string,
    toUserId?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // 1. Verify domain ownership
      const domain = await DatabaseService.getDomainById(domainId);
      if (!domain || domain.ownerId !== fromUserId) {
        return { success: false, error: 'Domain not found or not owned by user' };
      }

      // 2. Get or create recipient user
      let recipient = toUserId ? await DatabaseService.getUserById(toUserId) : null;
      if (!recipient) {
        recipient = await DatabaseService.getUserByAddress(toAddress);
        if (!recipient) {
          recipient = await DatabaseService.createUser({
            address: toAddress,
          });
        }
      }

      // 3. Interact with smart contract
      const contractResult = await BlockchainService.transferDomain({
        tokenId: domain.tokenId,
        from: domain.owner.address,
        to: toAddress,
      });

      // 4. Update database
      await DatabaseService.updateDomainOwner(domainId, recipient.id);

      // 5. Create audit log
      await DatabaseService.createAuditLog({
        action: 'domain_transferred',
        component: 'domain_registration',
        userId: fromUserId,
        details: {
          domain: domain.fullDomain,
          fromUser: fromUserId,
          toUser: recipient.id,
          toAddress,
        },
        txHash: contractResult.transactionHash,
        isPublic: true,
      });

      return {
        success: true,
        txHash: contractResult.transactionHash,
      };

    } catch (error) {
      console.error('Domain transfer failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  // Renew domain
  static async renewDomain(
    domainId: string,
    userId: string,
    payWithNXD: boolean = false
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // 1. Verify domain ownership
      const domain = await DatabaseService.getDomainById(domainId);
      if (!domain || domain.ownerId !== userId) {
        return { success: false, error: 'Domain not found or not owned by user' };
      }

      // 2. Get TLD info
      const tld = await DatabaseService.getTLDByName(domain.tld);
      if (!tld) {
        return { success: false, error: 'TLD not found' };
      }

      // 3. Calculate renewal fee (20% discount)
      const baseFee = domain.isPremium ? tld.premiumFee : tld.registrationFee;
      const renewalFee = (BigInt(baseFee) * BigInt(80) / BigInt(100)).toString();

      // 4. Interact with smart contract
      const contractResult = await BlockchainService.renewDomain({
        tokenId: domain.tokenId,
        payWithNXD,
        from: domain.owner.address,
      });

      // 5. Update expiration date
      const newExpiresAt = new Date(domain.expiresAt);
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
      
      await DatabaseService.updateDomainExpiration(domainId, newExpiresAt);

      // 6. Record revenue
      await DatabaseService.recordRevenue({
        amount: renewalFee,
        token: payWithNXD ? 'NXD' : 'ETH',
        source: 'domain_renewal',
        licenseId: domain.whiteLabelId,
        txHash: contractResult.transactionHash,
      });

      // 7. Create audit log
      await DatabaseService.createAuditLog({
        action: 'domain_renewed',
        component: 'domain_registration',
        userId,
        details: {
          domain: domain.fullDomain,
          newExpiresAt,
          renewalFee,
          payWithNXD,
        },
        txHash: contractResult.transactionHash,
        isPublic: true,
      });

      return {
        success: true,
        txHash: contractResult.transactionHash,
      };

    } catch (error) {
      console.error('Domain renewal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Renewal failed',
      };
    }
  }

  // Batch register domains with discount
  static async batchRegisterDomains(
    requests: Omit<DomainRegistrationRequest, 'paymasterSignature'>[],
    userId: string,
    userAddress: string
  ): Promise<{
    success: boolean;
    results: Array<{ domain: string; success: boolean; error?: string }>;
    txHash?: string;
    totalDiscount?: string;
  }> {
    try {
      if (requests.length > 10) {
        throw new Error('Cannot register more than 10 domains at once');
      }

      const results: Array<{ domain: string; success: boolean; error?: string }> = [];
      
      // Calculate bulk discount (10% for 5+, 15% for 8+)
      let discountPercentage = 0;
      if (requests.length >= 8) {
        discountPercentage = 15;
      } else if (requests.length >= 5) {
        discountPercentage = 10;
      }

      // Process each domain
      for (const request of requests) {
        const fullRequest: DomainRegistrationRequest = {
          ...request,
          ownerId: userId,
          ownerAddress: userAddress,
        };

        const result = await this.registerDomain(fullRequest);
        results.push({
          domain: `${request.name}.${request.tld}`,
          success: result.success,
          error: result.error,
        });
      }

      const successCount = results.filter(r => r.success).length;
      
      // Create audit log for batch operation
      await DatabaseService.createAuditLog({
        action: 'batch_domain_registration',
        component: 'domain_registration',
        userId,
        details: {
          totalDomains: requests.length,
          successfulRegistrations: successCount,
          discountPercentage,
          domains: requests.map(r => `${r.name}.${r.tld}`),
        },
        isPublic: true,
      });

      return {
        success: successCount > 0,
        results,
        totalDiscount: discountPercentage > 0 ? `${discountPercentage}%` : undefined,
      };

    } catch (error) {
      console.error('Batch domain registration failed:', error);
      return {
        success: false,
        results: requests.map(r => ({
          domain: `${r.name}.${r.tld}`,
          success: false,
          error: error instanceof Error ? error.message : 'Batch registration failed',
        })),
      };
    }
  }

  // Get domain analytics
  static async getDomainAnalytics(domainId: string): Promise<{
    score: number;
    scoreBreakdown: DomainScore;
    marketValue?: string;
    suggestedPrice?: string;
    analytics: any;
  }> {
    const domain = await DatabaseService.getDomainById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const scoreBreakdown = this.calculateDomainScore(
      domain.name,
      domain.tld,
      domain.subscriptionTier
    );

    // AI-powered market analysis
    let marketValue: string | undefined;
    let suggestedPrice: string | undefined;
    
    try {
      const analysisResponse = await AIGatewayService.queryGrok(
        `Analyze the domain "${domain.fullDomain}" with score ${scoreBreakdown.totalScore}. Provide market value estimation and suggested listing price. Consider length (${domain.name.length} chars), TLD (.${domain.tld}), and Web3 market trends.`,
        {
          domain: domain.fullDomain,
          score: scoreBreakdown.totalScore,
          context: 'market_analysis',
        }
      );

      if (analysisResponse.response) {
        // Parse AI response for market data
        const response = analysisResponse.response.toLowerCase();
        const valueMatch = response.match(/value[:\s]*([0-9.]+)\s*(eth|nxd)/);
        const priceMatch = response.match(/price[:\s]*([0-9.]+)\s*(eth|nxd)/);
        
        if (valueMatch) {
          marketValue = `${valueMatch[1]} ${valueMatch[2].toUpperCase()}`;
        }
        if (priceMatch) {
          suggestedPrice = `${priceMatch[1]} ${priceMatch[2].toUpperCase()}`;
        }
      }
    } catch (error) {
      console.error('AI market analysis failed:', error);
    }

    return {
      score: scoreBreakdown.totalScore,
      scoreBreakdown,
      marketValue,
      suggestedPrice,
      analytics: domain.analytics || {},
    };
  }
}
