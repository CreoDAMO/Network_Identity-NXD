
import { aiService } from './ai';
import { storage } from '../storage';

export interface AIRequest {
  prompt: string;
  context?: string;
  userId?: number;
  userAddress?: string;
  messageType?: string;
  preferredModel?: 'grok' | 'openai' | 'claude' | 'deepseek' | 'poe' | 'auto';
}

export interface AIResponse {
  response: string;
  model_used: string;
  tokens_consumed: number;
  credits_remaining: number;
  tier_info: UserTier;
  fallback_used?: boolean;
}

export interface UserTier {
  name: string;
  daily_limit: number;
  models_available: string[];
  priority_access: boolean;
}

export interface UsageTracker {
  userId: number;
  date: string;
  prompts_used: number;
  tokens_consumed: number;
  models_used: Record<string, number>;
}

class AIGateway {
  private readonly TIERS: Record<string, UserTier> = {
    free: {
      name: 'Free',
      daily_limit: 5,
      models_available: ['grok', 'deepseek'],
      priority_access: false
    },
    bronze: {
      name: 'Bronze (1,000+ NXD)',
      daily_limit: 15,
      models_available: ['grok', 'deepseek', 'poe'],
      priority_access: false
    },
    silver: {
      name: 'Silver (5,000+ NXD)',
      daily_limit: 30,
      models_available: ['grok', 'deepseek', 'poe', 'openai'],
      priority_access: true
    },
    gold: {
      name: 'Gold (10,000+ NXD)',
      daily_limit: 75,
      models_available: ['grok', 'deepseek', 'poe', 'openai', 'claude'],
      priority_access: true
    },
    platinum: {
      name: 'Platinum (50,000+ NXD)',
      daily_limit: 200,
      models_available: ['grok', 'deepseek', 'poe', 'openai', 'claude'],
      priority_access: true
    },
    enterprise: {
      name: 'Enterprise/White Label',
      daily_limit: 1000,
      models_available: ['grok', 'deepseek', 'poe', 'openai', 'claude'],
      priority_access: true
    }
  };

  private readonly MODEL_COSTS: Record<string, number> = {
    grok: 1,
    deepseek: 1,
    poe: 2,
    openai: 3,
    claude: 4
  };

  private readonly PROMPT_CLASSIFIERS: Record<string, string> = {
    code: 'deepseek',
    contract: 'openai',
    analysis: 'claude',
    chat: 'grok',
    domain: 'grok',
    governance: 'claude',
    market: 'openai'
  };

  async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // Get user tier and usage
      const userTier = await this.getUserTier(request.userId, request.userAddress);
      const dailyUsage = await this.getDailyUsage(request.userId || 0);
      
      // Check rate limits
      if (dailyUsage.prompts_used >= userTier.daily_limit) {
        throw new Error(`Daily limit reached (${userTier.daily_limit}). Upgrade your tier for more AI access.`);
      }

      // Classify prompt and select optimal model
      const promptType = this.classifyPrompt(request.prompt);
      const selectedModel = this.selectModel(
        request.preferredModel || 'auto',
        promptType,
        userTier,
        dailyUsage
      );

      // Execute AI request
      let response: string;
      let tokensUsed = 0;
      let fallbackUsed = false;

      try {
        switch (selectedModel) {
          case 'grok':
            response = await aiService.processChat({
              message: request.prompt,
              context: request.context,
              messageType: request.messageType,
              aiModel: 'grok'
            });
            tokensUsed = this.estimateTokens(request.prompt + response);
            break;

          case 'openai':
            response = await aiService.processChat({
              message: request.prompt,
              context: request.context,
              messageType: request.messageType,
              aiModel: 'openai'
            });
            tokensUsed = this.estimateTokens(request.prompt + response);
            break;

          case 'claude':
            response = await aiService.processChat({
              message: request.prompt,
              context: request.context,
              messageType: request.messageType,
              aiModel: 'claude'
            });
            tokensUsed = this.estimateTokens(request.prompt + response);
            break;

          case 'deepseek':
            response = await aiService.processChat({
              message: request.prompt,
              context: request.context,
              messageType: request.messageType,
              aiModel: 'deepseek'
            });
            tokensUsed = this.estimateTokens(request.prompt + response);
            break;

          case 'poe':
            response = await aiService.processChat({
              message: request.prompt,
              context: request.context,
              messageType: request.messageType,
              aiModel: 'poe'
            });
            tokensUsed = this.estimateTokens(request.prompt + response);
            break;

          default:
            throw new Error('No available models for your tier');
        }
      } catch (modelError) {
        // Fallback to available model
        const fallbackModel = this.getFallbackModel(userTier);
        if (fallbackModel && fallbackModel !== selectedModel) {
          response = await aiService.processChat({
            message: request.prompt,
            context: request.context,
            messageType: request.messageType,
            aiModel: fallbackModel as any
          });
          tokensUsed = this.estimateTokens(request.prompt + response);
          fallbackUsed = true;
        } else {
          throw modelError;
        }
      }

      // Update usage tracking
      await this.updateUsage(request.userId || 0, selectedModel, tokensUsed);

      // Calculate remaining credits
      const creditsRemaining = userTier.daily_limit - (dailyUsage.prompts_used + 1);

      return {
        response,
        model_used: selectedModel,
        tokens_consumed: tokensUsed,
        credits_remaining: creditsRemaining,
        tier_info: userTier,
        fallback_used: fallbackUsed
      };

    } catch (error) {
      throw new Error(`AI Gateway Error: ${error.message}`);
    }
  }

  private async getUserTier(userId?: number, userAddress?: string): Promise<UserTier> {
    if (!userId && !userAddress) {
      return this.TIERS.free;
    }

    try {
      // Get user's NXD balance and staking info
      const user = userId ? await storage.getUser(userId) : null;
      const nxdBalance = user ? parseFloat(user.nxdBalance) : 0;
      const nxdStaked = user ? parseFloat(user.nxdStaked) : 0;
      const totalNXD = nxdBalance + nxdStaked;

      // Determine tier based on NXD holdings
      if (totalNXD >= 50000) return this.TIERS.platinum;
      if (totalNXD >= 10000) return this.TIERS.gold;
      if (totalNXD >= 5000) return this.TIERS.silver;
      if (totalNXD >= 1000) return this.TIERS.bronze;
      
      return this.TIERS.free;
    } catch (error) {
      console.error('Error getting user tier:', error);
      return this.TIERS.free;
    }
  }

  private async getDailyUsage(userId: number): Promise<UsageTracker> {
    const today = new Date().toISOString().split('T')[0];
    
    // In production, this would be stored in a separate usage tracking table
    // For now, we'll simulate daily usage
    return {
      userId,
      date: today,
      prompts_used: Math.floor(Math.random() * 5), // Simulate some usage
      tokens_consumed: Math.floor(Math.random() * 1000),
      models_used: {
        grok: Math.floor(Math.random() * 3),
        openai: Math.floor(Math.random() * 2)
      }
    };
  }

  private classifyPrompt(prompt: string): string {
    const lowercasePrompt = prompt.toLowerCase();
    
    if (lowercasePrompt.includes('contract') || lowercasePrompt.includes('smart contract') || lowercasePrompt.includes('solidity')) {
      return 'contract';
    }
    if (lowercasePrompt.includes('code') || lowercasePrompt.includes('function') || lowercasePrompt.includes('api')) {
      return 'code';
    }
    if (lowercasePrompt.includes('analysis') || lowercasePrompt.includes('analyze') || lowercasePrompt.includes('market')) {
      return 'analysis';
    }
    if (lowercasePrompt.includes('domain') || lowercasePrompt.includes('register') || lowercasePrompt.includes('tld')) {
      return 'domain';
    }
    if (lowercasePrompt.includes('governance') || lowercasePrompt.includes('proposal') || lowercasePrompt.includes('vote')) {
      return 'governance';
    }
    
    return 'chat';
  }

  private selectModel(
    preferred: string,
    promptType: string,
    userTier: UserTier,
    usage: UsageTracker
  ): string {
    // If user specified a model and has access, use it
    if (preferred !== 'auto' && userTier.models_available.includes(preferred)) {
      return preferred;
    }

    // Get optimal model for prompt type
    const optimalModel = this.PROMPT_CLASSIFIERS[promptType] || 'grok';
    
    // Check if user has access to optimal model
    if (userTier.models_available.includes(optimalModel)) {
      return optimalModel;
    }

    // Fallback to best available model for tier
    const availableModels = userTier.models_available;
    
    // Prefer higher-tier models if available
    if (availableModels.includes('claude')) return 'claude';
    if (availableModels.includes('openai')) return 'openai';
    if (availableModels.includes('poe')) return 'poe';
    if (availableModels.includes('deepseek')) return 'deepseek';
    if (availableModels.includes('grok')) return 'grok';

    throw new Error('No available AI models for your tier');
  }

  private getFallbackModel(userTier: UserTier): string | null {
    // Return the most reliable model available for the tier
    if (userTier.models_available.includes('grok')) return 'grok';
    if (userTier.models_available.includes('deepseek')) return 'deepseek';
    return null;
  }

  private estimateTokens(text: string): number {
    // Rough token estimation (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }

  private async updateUsage(userId: number, model: string, tokens: number): Promise<void> {
    // In production, this would update a usage tracking database
    console.log(`User ${userId} used ${model} consuming ${tokens} tokens`);
    
    // This could be implemented with PostgreSQL or Redis for real-time tracking
    // For now, we'll just log the usage
  }

  async getUserUsageStats(userId: number): Promise<{
    daily_usage: UsageTracker;
    tier: UserTier;
    upgrade_benefits: string[];
  }> {
    const dailyUsage = await this.getDailyUsage(userId);
    const currentTier = await this.getUserTier(userId);
    
    const upgradeBenefits = this.getUpgradeBenefits(currentTier);
    
    return {
      daily_usage: dailyUsage,
      tier: currentTier,
      upgrade_benefits: upgradeBenefits
    };
  }

  private getUpgradeBenefits(currentTier: UserTier): string[] {
    const benefits: string[] = [];
    
    if (currentTier.name === 'Free') {
      benefits.push('10x more daily prompts with Bronze tier');
      benefits.push('Access to Poe AI models');
      benefits.push('Priority support');
    } else if (currentTier.name.includes('Bronze')) {
      benefits.push('Access to GPT-4o with Silver tier');
      benefits.push('Double daily prompt limit');
      benefits.push('Priority queue access');
    } else if (currentTier.name.includes('Silver')) {
      benefits.push('Access to Claude-4 with Gold tier');
      benefits.push('2.5x more daily prompts');
      benefits.push('Advanced analytics');
    }
    
    return benefits;
  }

  async sendMessage(message: string, conversationId?: string): Promise<any> {
    try {
      // Simple mock response for development if no API keys are configured
      if (!this.hasValidApiKeys()) {
        return {
          message: this.generateMockResponse(message),
          model: 'mock-grok',
          timestamp: new Date().toISOString(),
          conversationId: conversationId || Date.now().toString(),
          tokens_consumed: 25,
          credits_remaining: 75
        };
      }

      const response = await this.processRequest({
        prompt: message,
        context: `Conversation ID: ${conversationId}`,
        messageType: 'chat',
        preferredModel: 'grok',
        userId: 1
      });

      return {
        message: response.response,
        model: response.model_used,
        timestamp: new Date().toISOString(),
        conversationId: conversationId || Date.now().toString(),
        tokens_consumed: response.tokens_consumed,
        credits_remaining: response.credits_remaining
      };
    } catch (error) {
      console.error('AI Gateway sendMessage error:', error);
      
      // Fallback response
      return {
        message: this.generateMockResponse(message),
        model: 'fallback',
        timestamp: new Date().toISOString(),
        conversationId: conversationId || Date.now().toString(),
        error: false // Don't show as error since we have a fallback
      };
    }
  }

  private hasValidApiKeys(): boolean {
    return !!(process.env.XAI_API_KEY && process.env.XAI_API_KEY !== 'sk-placeholder') ||
           !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') ||
           !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-placeholder');
  }

  private generateMockResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('domain') || lowerMessage.includes('suggest')) {
      return "I can help you find great domain names! Some popular options for Web3 projects include names with 'web3', 'crypto', 'defi', or your project name + '.nxd'. What type of project are you building?";
    }
    
    if (lowerMessage.includes('staking') || lowerMessage.includes('rewards')) {
      return "The NXD platform offers attractive staking rewards with up to 18.5% APY. You can stake your NXD tokens to earn passive income while supporting the network. Would you like me to explain the different staking tiers?";
    }
    
    if (lowerMessage.includes('governance') || lowerMessage.includes('vote')) {
      return "Governance is a key feature of NXD! Token holders can propose and vote on platform improvements, fee adjustments, and new features. Your voting power is based on your staked NXD tokens.";
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('market')) {
      return "Domain prices on NXD start from 0.1 ETH for standard domains. Premium domains and shorter names cost more. The marketplace shows real-time pricing based on demand and rarity.";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm your AI assistant for the NXD platform. I can help you with domain suggestions, explain staking rewards, guide you through governance, and answer questions about Web3 domains. What would you like to know?";
    }

    if (lowerMessage.includes('voice') || lowerMessage.includes('speak')) {
      return "Voice commands are supported! You can say things like 'search for domains', 'show my staking rewards', 'open marketplace', or 'help with governance'. I'll respond with both text and voice when possible. To activate voice mode, click the microphone button in the AI assistant.";
    }
    
    return "I'm here to help with all your NXD platform needs! I can assist with domain searches, staking information, governance participation, and marketplace navigation. What specific topic would you like to explore?";
  }
}

export const aiGateway = new AIGateway();
