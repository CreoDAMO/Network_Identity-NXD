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
}

export function AIAssistant() {
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

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async ({ message, messageType }: { message: string; messageType?: string }) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message,
        messageType,
        userId: user?.id,
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
      };
      setMessages(prev => [...prev, newMessage]);
      setCurrentMessage("");
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

  return (
    <div className="max-w-4xl mx-auto">
      <GlassmorphismCard className="p-8 gradient-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-starlight-pink to-cosmic-purple rounded-xl flex items-center justify-center animate-pulse-slow">
              <i className="fas fa-robot text-white text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-orbitron font-bold text-white">Grok AI Assistant</h3>
              <p className="text-white/60 text-sm">Powered by xAI • Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoiceMode}
              className={`px-4 py-2 border border-white/20 rounded-lg transition-colors ${
                isVoiceMode 
                  ? "bg-starlight-pink/20 text-starlight-pink border-starlight-pink/30" 
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <i className="fas fa-microphone mr-2"></i>
              {isVoiceMode ? "Stop" : "Voice"}
            </button>
            <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-white">
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white/5 rounded-xl p-6 h-96 overflow-y-auto mb-6 custom-scrollbar">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === "user" && (
                  <div className="flex items-start space-x-3 justify-end">
                    <div className="flex-1 text-right">
                      <div className="bg-gradient-to-r from-cosmic-purple to-nebula-blue rounded-lg p-4 inline-block max-w-[80%]">
                        <p className="text-white text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                      <div className="text-xs text-white/50 mt-1">{formatRelativeTime(message.timestamp)}</div>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-nebula-blue to-meteor-green rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-user text-white text-sm"></i>
                    </div>
                  </div>
                )}
                
                {message.type === "ai" && message.response && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-starlight-pink to-cosmic-purple rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-white text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/10 rounded-lg p-4 max-w-[80%]">
                        <p className="text-white/90 text-sm whitespace-pre-wrap">{message.response}</p>
                      </div>
                      <div className="text-xs text-white/50 mt-1">{formatRelativeTime(message.timestamp)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-starlight-pink to-cosmic-purple rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <div className="bg-white/10 rounded-lg p-4 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cosmic-purple rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-nebula-blue rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-starlight-pink rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <span className="text-white/70 text-sm ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about domains, staking, or the NXD platform..."
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-cosmic-purple focus:border-transparent pr-12 h-14"
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white">
              <i className="fas fa-paperclip"></i>
            </button>
          </div>
          <GradientButton
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || chatMutation.isPending}
            className="h-14 px-6"
          >
            <i className="fas fa-paper-plane"></i>
          </GradientButton>
        </div>

        {/* Quick Actions */}
        <div className="pt-6 border-t border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white/90 font-semibold">Quick Actions</h4>
            <button className="text-cosmic-purple hover:text-white text-sm">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleQuickAction("domain_search")}
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors text-left group"
            >
              <i className="fas fa-search text-cosmic-purple mb-2 group-hover:scale-110 transition-transform"></i>
              <div className="text-white/90 text-sm font-medium">Domain Search</div>
              <div className="text-white/60 text-xs">Find available domains</div>
            </button>
            
            <button
              onClick={() => handleQuickAction("market_analysis")}
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors text-left group"
            >
              <i className="fas fa-chart-line text-nebula-blue mb-2 group-hover:scale-110 transition-transform"></i>
              <div className="text-white/90 text-sm font-medium">Market Analysis</div>
              <div className="text-white/60 text-xs">Domain price trends</div>
            </button>
            
            <button
              onClick={() => handleQuickAction("staking_guide")}
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors text-left group"
            >
              <i className="fas fa-coins text-solar-orange mb-2 group-hover:scale-110 transition-transform"></i>
              <div className="text-white/90 text-sm font-medium">Staking Guide</div>
              <div className="text-white/60 text-xs">Optimize your rewards</div>
            </button>
            
            <button
              onClick={() => handleQuickAction("governance_help")}
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors text-left group"
            >
              <i className="fas fa-vote-yea text-meteor-green mb-2 group-hover:scale-110 transition-transform"></i>
              <div className="text-white/90 text-sm font-medium">Governance Help</div>
              <div className="text-white/60 text-xs">Proposal assistance</div>
            </button>
          </div>
        </div>
      </GlassmorphismCard>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Mic, MicOff, Brain, Sparkles, User, Bot } from 'lucide-react';
import { GlassmorphismCard } from './ui/glassmorphism-card';
import { GradientButton } from './ui/gradient-button';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'domain_suggestion' | 'action';
}

interface AIAssistantProps {
  isMinimized?: boolean;
  onToggle?: () => void;
}

export default function AIAssistant({ isMinimized = false, onToggle }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your NXD AI assistant. I can help you find domains, explain staking, assist with governance, and much more. What would you like to know?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        sender: 'ai',
        timestamp: new Date(),
        type: aiResponse.type,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (input: string): { content: string; type?: string } => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('domain') && lowerInput.includes('register')) {
      return {
        content: "I'd be happy to help you register a domain! First, let me check availability. What domain name are you looking for? I can search across our TLDs: .nxd, .web3, .dao, and .defi.",
        type: 'domain_suggestion'
      };
    }
    
    if (lowerInput.includes('staking') || lowerInput.includes('stake')) {
      return {
        content: "Great question about staking! NXD staking offers multiple benefits:\n\n• Earn up to 15% APY on staked tokens\n• Participate in governance decisions\n• Access premium features\n• Gas fee sponsorship\n\nWould you like me to guide you through the staking process?",
      };
    }
    
    if (lowerInput.includes('governance') || lowerInput.includes('vote')) {
      return {
        content: "NXD governance is powered by our DAO system. Token holders can:\n\n• Create proposals for platform changes\n• Vote on new TLD additions\n• Decide fee structures\n• Emergency stop mechanisms\n\nYour voting power is proportional to your staked NXD. Want to see active proposals?",
      };
    }
    
    if (lowerInput.includes('price') || lowerInput.includes('nxd')) {
      return {
        content: "Current NXD stats:\n• Price: $0.1234\n• Market Cap: $12.4M\n• Staking APY: 15.5%\n• Total Staked: 45.2M NXD\n\nThe token economics include deflationary mechanisms through fee burning and regular buybacks. Would you like more details?",
      };
    }

    return {
      content: "I understand you're asking about " + input + ". I'm here to help with domains, staking, governance, and all things NXD. Could you be more specific about what you'd like to know?",
    };
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const quickActions = [
    { label: 'Find Domain', action: () => setInputMessage('Help me find a domain') },
    { label: 'Staking Guide', action: () => setInputMessage('How do I stake NXD tokens?') },
    { label: 'Governance Help', action: () => setInputMessage('How does NXD governance work?') },
    { label: 'Price Info', action: () => setInputMessage('What is the current NXD price?') },
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggle}
          className="w-14 h-14 bg-gradient-to-r from-cosmic-purple to-nebula-blue rounded-full 
                   flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <Brain className="w-6 h-6 text-white" />
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
            <div className="w-8 h-8 bg-gradient-to-r from-cosmic-purple to-nebula-blue rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">NXD AI Assistant</h3>
              <p className="text-white/60 text-xs">Powered by xAI Grok</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-cosmic-purple' 
                    : 'bg-gradient-to-r from-nebula-blue to-starlight-pink'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-cosmic-purple text-white'
                    : 'bg-white/10 text-white'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-nebula-blue to-starlight-pink flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
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

        {/* Quick Actions */}
        <div className="p-4 border-t border-white/10">
          <p className="text-white/60 text-xs mb-2">Quick Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="text-xs p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-white/80"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about NXD..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white 
                         placeholder-white/60 focus:outline-none focus:border-cosmic-purple text-sm"
              />
            </div>
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-lg transition-colors ${
                isListening ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="p-2 bg-cosmic-purple rounded-lg text-white hover:bg-cosmic-purple/80 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassmorphismCard>
    </div>
  );
}
