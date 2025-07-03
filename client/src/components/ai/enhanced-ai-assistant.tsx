import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageCircle, 
  Bot, 
  Send, 
  Loader2, 
  Sparkles, 
  Brain, 
  Zap,
  Code,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  aiModel: string;
  messageType: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  strengths: string[];
}

const AI_MODELS: AIModel[] = [
  {
    id: "grok",
    name: "xAI Grok3",
    description: "Latest xAI model optimized for domain suggestions and Web3 queries",
    icon: <Zap className="w-4 h-4" />,
    color: "bg-blue-500",
    strengths: ["Domain Suggestions", "Web3 Knowledge", "Real-time Data"]
  },
  {
    id: "openai",
    name: "OpenAI GPT-4o",
    description: "Advanced reasoning and technical analysis",
    icon: <Brain className="w-4 h-4" />,
    color: "bg-green-500",
    strengths: ["Technical Analysis", "Market Insights", "Complex Reasoning"]
  },
  {
    id: "claude",
    name: "Claude 4 Sonnet",
    description: "Detailed explanations and safety-focused responses",
    icon: <Sparkles className="w-4 h-4" />,
    color: "bg-purple-500",
    strengths: ["Detailed Explanations", "Safety", "Content Creation"]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Specialized in coding and development tasks",
    icon: <Code className="w-4 h-4" />,
    color: "bg-orange-500",
    strengths: ["Code Generation", "Development", "Technical Solutions"]
  },
  {
    id: "auto",
    name: "Auto-Select",
    description: "Automatically choose the best model for your query",
    icon: <Bot className="w-4 h-4" />,
    color: "bg-gradient-to-r from-blue-500 to-purple-500",
    strengths: ["Adaptive", "Context-Aware", "Optimized"]
  }
];

const MESSAGE_TYPES = [
  { id: "general", name: "General Chat", icon: <MessageCircle className="w-4 h-4" /> },
  { id: "domain", name: "Domain Help", icon: <Zap className="w-4 h-4" /> },
  { id: "technical", name: "Technical", icon: <Code className="w-4 h-4" /> },
  { id: "explanation", name: "Explanation", icon: <Sparkles className="w-4 h-4" /> },
  { id: "coding", name: "Coding", icon: <Brain className="w-4 h-4" /> }
];

export function EnhancedAIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [messageType, setMessageType] = useState("general");
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await apiRequest({
        url: "/api/ai/chat",
        method: "POST",
        data: {
          message: userMessage,
          messageType,
          aiModel: selectedModel,
          context: "NXD platform assistance",
          userId: 1
        }
      });

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message: userMessage,
        response: response.response,
        timestamp: new Date(),
        aiModel: response.model_used || selectedModel,
        messageType
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Response copied to clipboard"
    });
  };

  const getModelById = (id: string) => AI_MODELS.find(m => m.id === id) || AI_MODELS[0];

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            NXD AI Assistant
            <Badge variant="outline" className="ml-2">Multi-Model</Badge>
          </CardTitle>
          <div className="flex gap-2">
            {AI_MODELS.slice(0, 4).map(model => (
              <div
                key={model.id}
                className={`w-3 h-3 rounded-full ${model.color}`}
                title={model.name}
              />
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="commands" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Commands
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="p-6 space-y-4">
            {/* AI Model & Type Selection */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">AI Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          {model.icon}
                          <span>{model.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Message Type</label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="h-96 border rounded-lg p-4 bg-background/30">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ask me anything about NXD domains, staking, governance, or Web3!</p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    <Badge variant="outline">Domain suggestions</Badge>
                    <Badge variant="outline">Market analysis</Badge>
                    <Badge variant="outline">Staking help</Badge>
                    <Badge variant="outline">Technical support</Badge>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className="space-y-4 mb-6">
                  {/* User Message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{msg.timestamp.toLocaleTimeString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {MESSAGE_TYPES.find(t => t.id === msg.messageType)?.name}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${getModelById(msg.aiModel).color} flex items-center justify-center`}>
                      {getModelById(msg.aiModel).icon}
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{msg.response}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{getModelById(msg.aiModel).name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(msg.response)}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full ${getModelById(selectedModel).color} flex items-center justify-center`}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about domains, staking, governance, or anything..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="models" className="p-6">
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">Available AI Models</h3>
              {AI_MODELS.map(model => (
                <Card key={model.id} className={`border-2 ${selectedModel === model.id ? 'border-primary' : 'border-border/50'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${model.color} flex items-center justify-center`}>
                        {model.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{model.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {model.strengths.map(strength => (
                            <Badge key={strength} variant="outline" className="text-xs">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button 
                        variant={selectedModel === model.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedModel(model.id)}
                      >
                        {selectedModel === model.id ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="commands" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Natural Language Commands</h3>
              <p className="text-sm text-muted-foreground">
                You can use natural language to perform platform actions. Here are some examples:
              </p>
              
              <div className="grid gap-3">
                {[
                  "Register crypto.nxd domain for me",
                  "Stake 1000 NXD tokens in gold tier", 
                  "Check availability of web3.dao",
                  "Create a proposal to reduce fees",
                  "Show my staking rewards",
                  "List my domain portfolio.nxd for 2 ETH"
                ].map((command, i) => (
                  <Card key={i} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setInputMessage(command)}>
                    <p className="text-sm">{command}</p>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}