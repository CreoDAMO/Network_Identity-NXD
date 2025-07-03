import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  type: "user" | "ai";
  messageType?: string;
  aiModel?: string;
  tokensUsed?: number;
}

interface AIAssistantProps {
  isMinimized?: boolean;
  onToggle?: () => void;
}

export default function AIAssistant({ isMinimized = false, onToggle }: AIAssistantProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      message: "",
      response: "Hello! I'm Grok, your AI assistant for the NXD platform. I can help you with domain suggestions, market analysis, platform navigation, and more. What would you like to explore today?",
      timestamp: new Date(),
      type: "ai",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAppStore();

  // Get chat history
  const { data: chatHistory = [] } = useQuery({
    queryKey: ["/api/ai/chat-history", user?.id],
    enabled: !!user?.id,
  });

  // Get user's AI usage stats
  const { data: usageStats, refetch: refetchUsage } = useQuery({
    queryKey: ["/api/ai/usage", user?.id],
    enabled: !!user?.id,
  });

  // Chat mutation using new AI Gateway
  const chatMutation = useMutation({
    mutationFn: async ({ message, messageType, preferredModel }: { 
      message: string; 
      messageType?: string; 
      preferredModel?: string;
    }) => {
      const response = await apiRequest("POST", "/api/ai/gateway", {
        prompt: message,
        messageType,
        preferredModel,
        userId: user?.id,
        userAddress: user?.walletAddress,
        context: "NXD platform assistance",
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message: variables.message,
        response: data.response,
        timestamp: new Date(),
        type: "ai",
        messageType: variables.messageType,
        aiModel: data.model_used,
        tokensUsed: data.tokens_consumed,
      };
      setMessages(prev => [...prev, newMessage]);
      setCurrentMessage("");
      refetchUsage(); // Refresh usage stats after AI call
    },
  });

  // Domain suggestions mutation
  const suggestionsMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/ai/suggest-domains", {
        query,
        context: "general",
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data, query) => {
      const suggestionText = data.suggestions
        .map((s: any) => `${s.fullDomain} - ${s.available ? 'Available' : 'Taken'} (${s.price} ETH)`)
        .join('\n');

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message: `Generate domain suggestions for: ${query}`,
        response: `Here are some domain suggestions for "${query}":\n\n${suggestionText}`,
        timestamp: new Date(),
        type: "ai",
        messageType: "domain_search",
      };
      setMessages(prev => [...prev, newMessage]);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + "_user",
      message: currentMessage,
      response: "",
      timestamp: new Date(),
      type: "user",
    };
    setMessages(prev => [...prev, userMessage]);

    // Determine message type based on content
    let messageType = "general";
    if (currentMessage.toLowerCase().includes("domain") || currentMessage.toLowerCase().includes("register")) {
      messageType = "domain_search";
    } else if (currentMessage.toLowerCase().includes("stake") || currentMessage.toLowerCase().includes("staking")) {
      messageType = "staking_guide";
    } else if (currentMessage.toLowerCase().includes("governance") || currentMessage.toLowerCase().includes("proposal")) {
      messageType = "governance_help";
    } else if (currentMessage.toLowerCase().includes("market") || currentMessage.toLowerCase().includes("price")) {
      messageType = "market_analysis";
    }

    chatMutation.mutate({ message: currentMessage, messageType });
  };

  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case "domain_search":
        chatMutation.mutate({ 
          message: "I need help finding available domains", 
          messageType: "domain_search" 
        });
        break;
      case "market_analysis":
        chatMutation.mutate({ 
          message: "Show me current domain market trends and pricing analysis", 
          messageType: "market_analysis" 
        });
        break;
      case "staking_guide":
        chatMutation.mutate({ 
          message: "Help me understand NXD staking and how to optimize my rewards", 
          messageType: "staking_guide" 
        });
        break;
      case "governance_help":
        chatMutation.mutate({ 
          message: "I want to participate in DAO governance. How do proposals and voting work?", 
          messageType: "governance_help" 
        });
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      // Start voice recognition (mock implementation)
      console.log("Voice mode activated");
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggle}
          className="w-14 h-14 bg-gradient-to-r from-cosmic-purple to-nebula-blue rounded-full 
                   flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <i className="fas fa-robot text-white text-xl"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] z-50">
      <GlassmorphismCard className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-starlight-pink to-cosmic-purple rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div>
              <h3 className="text-white font-semibold">NXD AI Assistant</h3>
              <div className="flex items-center space-x-2">
                <p className="text-white/60 text-xs">Multi-AI Gateway</p>
                {usageStats && (
                  <span className="text-xs bg-cosmic-purple px-2 py-0.5 rounded-full text-white">
                    {usageStats.tier.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Usage Stats */}
        {usageStats && (
          <div className="px-4 py-2 border-b border-white/10 bg-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60">Daily Usage:</span>
              <span className="text-white">
                {usageStats.daily_usage.prompts_used}/{usageStats.tier.daily_limit}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1 mt-1">
              <div 
                className="bg-gradient-to-r from-cosmic-purple to-nebula-blue h-1 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, (usageStats.daily_usage.prompts_used / usageStats.tier.daily_limit) * 100)}%` 
                }}
              ></div>
            </div>
            {usageStats.upgrade_benefits.length > 0 && (
              <p className="text-xs text-starlight-pink mt-1">
                💎 Upgrade for {usageStats.upgrade_benefits[0]}
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === "user" && (
                  <div className="flex justify-end">
                    <div className="flex max-w-[80%] flex-row-reverse items-start space-x-2 space-x-reverse">
                      <div className="w-8 h-8 rounded-full bg-cosmic-purple flex items-center justify-center">
                        <i className="fas fa-user text-white text-xs"></i>
                      </div>
                      <div className="bg-cosmic-purple text-white rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className="text-xs opacity-60 mt-1">{formatRelativeTime(message.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {message.type === "ai" && message.response && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%] items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-nebula-blue to-starlight-pink flex items-center justify-center">
                        <i className="fas fa-robot text-white text-xs"></i>
                      </div>
                      <div className="bg-white/10 text-white rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.response}</p>
                        <p className="text-xs opacity-60 mt-1">{formatRelativeTime(message.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-nebula-blue to-starlight-pink flex items-center justify-center">
                    <i className="fas fa-robot text-white text-xs"></i>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-white/10">
          <p className="text-white/60 text-xs mb-2">Quick Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAction("domain_search")}
              className="text-xs p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-white/80"
            >
              Find Domain
            </button>
            <button
              onClick={() => handleQuickAction("staking_guide")}
              className="text-xs p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-white/80"
            >
              Staking Guide
            </button>
            <button
              onClick={() => handleQuickAction("governance_help")}
              className="text-xs p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-white/80"
            >
              Governance Help
            </button>
            <button
              onClick={() => handleQuickAction("market_analysis")}
              className="text-xs p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-white/80"
            >
              Price Info
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about NXD..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white 
                         placeholder-white/60 focus:outline-none focus:border-cosmic-purple text-sm"
              />
            </div>
            <button
              onClick={toggleVoiceMode}
              className={`p-2 rounded-lg transition-colors ${
                isVoiceMode ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              <i className={`fas ${isVoiceMode ? 'fa-microphone-slash' : 'fa-microphone'} text-xs`}></i>
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim()}
              className="p-2 bg-cosmic-purple rounded-lg text-white hover:bg-cosmic-purple/80 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      </GlassmorphismCard>
    </div>
  );
}

export default AIAssistant;