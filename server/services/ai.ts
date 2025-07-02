import OpenAI from "openai";
import { DomainSuggestion } from "@shared/schema";

const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY || "test-key"
});

export interface AIDomainSuggestionRequest {
  query: string;
  context?: string;
  tld?: string;
  maxSuggestions?: number;
}

export interface AIChatRequest {
  message: string;
  context?: string;
  userId?: number;
  messageType?: string;
}

export class AIService {
  async generateDomainSuggestions({
    query,
    context = "general",
    tld = "nxd",
    maxSuggestions = 8
  }: AIDomainSuggestionRequest): Promise<DomainSuggestion[]> {
    try {
      const prompt = `Generate ${maxSuggestions} creative and relevant domain name suggestions for "${query}" in the ${context} context. 
      
      Requirements:
      - Use .${tld} extension
      - Make them brandable and memorable
      - Consider Web3, crypto, and blockchain themes
      - Mix short and longer options
      - Avoid trademark conflicts
      - Include availability status (available/premium/taken)
      - Include price in ETH (0.1-15.0 range)
      
      Respond with JSON array of objects with: name, tld, fullDomain, available, price, category`;

      const response = await openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are an expert domain name generator specializing in Web3 and blockchain domains. Generate creative, brandable domain suggestions with realistic pricing."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Ensure we return an array of suggestions
      if (result.suggestions && Array.isArray(result.suggestions)) {
        return result.suggestions.map((suggestion: any) => ({
          name: suggestion.name || suggestion.fullDomain?.split('.')[0] || "example",
          tld: suggestion.tld || tld,
          fullDomain: suggestion.fullDomain || `${suggestion.name}.${tld}`,
          available: suggestion.available !== false,
          price: suggestion.price || "0.1",
          category: suggestion.category || (suggestion.available ? "available" : "taken")
        }));
      }

      return [];
    } catch (error) {
      console.error("AI domain suggestion error:", error);
      
      // Fallback suggestions
      return [
        { name: query, tld, fullDomain: `${query}.${tld}`, available: true, price: "0.1", category: "available" },
        { name: `${query}dao`, tld, fullDomain: `${query}dao.${tld}`, available: true, price: "0.15", category: "available" },
        { name: `${query}defi`, tld, fullDomain: `${query}defi.${tld}`, available: true, price: "0.12", category: "available" },
        { name: `${query}nft`, tld, fullDomain: `${query}nft.${tld}`, available: false, price: "2.5", category: "taken" }
      ];
    }
  }

  async processChat({ message, context, messageType = "general" }: AIChatRequest): Promise<string> {
    try {
      let systemPrompt = "You are Grok, an AI assistant for the NXD Web3 domain platform. You're knowledgeable about domains, blockchain, staking, governance, and Web3 technologies. Be helpful, concise, and friendly.";
      
      switch (messageType) {
        case "domain_search":
          systemPrompt += " Focus on helping with domain search, availability, and suggestions.";
          break;
        case "market_analysis":
          systemPrompt += " Provide insights about domain market trends, pricing, and investment opportunities.";
          break;
        case "staking_guide":
          systemPrompt += " Help with NXD token staking, rewards calculation, and optimization strategies.";
          break;
        case "governance_help":
          systemPrompt += " Assist with DAO governance, proposal creation, voting, and platform governance.";
          break;
      }

      const response = await openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content || "I'm sorry, I couldn't process your request. Please try again.";
    } catch (error) {
      console.error("AI chat error:", error);
      return "I'm experiencing some technical difficulties. Please try your question again in a moment.";
    }
  }

  async analyzeDomainValue(domainName: string): Promise<{
    score: number;
    factors: string[];
    suggestedPrice: string;
  }> {
    try {
      const prompt = `Analyze the domain "${domainName}" and provide:
      1. Overall quality score (1-100)
      2. Key value factors
      3. Suggested market price in ETH
      
      Consider: length, memorability, brandability, Web3 relevance, keyword strength, TLD value.
      
      Respond in JSON format: { "score": number, "factors": ["factor1", "factor2"], "suggestedPrice": "X.X" }`;

      const response = await openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are a domain valuation expert specializing in Web3 and blockchain domains."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        score: result.score || 50,
        factors: result.factors || ["Standard domain"],
        suggestedPrice: result.suggestedPrice || "0.1"
      };
    } catch (error) {
      console.error("Domain analysis error:", error);
      return {
        score: 50,
        factors: ["Standard domain"],
        suggestedPrice: "0.1"
      };
    }
  }

  async generateGovernanceProposal(topic: string, context: string): Promise<{
    title: string;
    description: string;
    category: string;
  }> {
    try {
      const prompt = `Create a governance proposal for the NXD DAO about "${topic}".
      
      Context: ${context}
      
      Generate:
      1. Clear, professional title
      2. Detailed description with rationale, implementation steps, and expected outcomes
      3. Category (fee_adjustment, new_feature, tld_addition, platform_upgrade, treasury_use)
      
      Keep it professional, actionable, and community-focused.
      
      Respond in JSON: { "title": "...", "description": "...", "category": "..." }`;

      const response = await openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are a governance expert helping create well-structured DAO proposals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        title: result.title || `Proposal: ${topic}`,
        description: result.description || `This proposal addresses ${topic} to improve the NXD platform.`,
        category: result.category || "platform_upgrade"
      };
    } catch (error) {
      console.error("Proposal generation error:", error);
      return {
        title: `Proposal: ${topic}`,
        description: `This proposal addresses ${topic} to improve the NXD platform. Please provide more details and community input.`,
        category: "platform_upgrade"
      };
    }
  }
}

export const aiService = new AIService();
