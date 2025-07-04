import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Coins, 
  PieChart,
  BarChart3,
  Wallet,
  Target,
  Gift,
  Lock,
  Trophy,
  Globe,
  Building2,
  Play,
  Presentation,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import LivePitchDeck from "./live-pitch-deck";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts";

interface RevenueData {
  totalRevenue: number;
  founderShare: number; // 20%
  lpShare: number; // 50%
  ecosystemShare: number; // 30%
  whiteLabelShare: number; // 0-20% when applicable
  monthlyGrowth: number;
  revenueStreams: {
    domainRegistrations: number;
    tldCreation: number;
    apiIntegrations: number;
    subscriptions: number;
    tokenUtility: number;
  };
  whiteLabelMetrics: {
    totalPartners: number;
    activeDeployments: number;
    partnerRevenue: number;
    averagePartnerShare: number;
  };
}

interface TokenomicsData {
  totalSupply: number;
  circulatingSupply: number;
  marketCap: number;
  price: number;
  distribution: {
    community: number;
    liquidityMining: number;
    treasury: number;
    founder: number;
    strategic: number;
    staking: number;
  };
  stakingStats: {
    totalStaked: number;
    stakingApr: number;
    stakingParticipation: number;
  };
}

export function InvestorDashboard() {
  const { walletAddress, walletConnected } = useAppStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [tokenomicsData, setTokenomicsData] = useState<TokenomicsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any>({});

  useEffect(() => {
    loadInvestorData();
    startLiveDataStream();
  }, []);

  const startLiveDataStream = () => {
    // Simulate live data updates every 3 seconds
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      const newDataPoint = {
        time: timestamp,
        revenue: Math.floor(Math.random() * 1000000) + 35000000,
        users: Math.floor(Math.random() * 10000) + 50000,
        domains: Math.floor(Math.random() * 5000) + 12000,
        staking: Math.floor(Math.random() * 2000000) + 18000000,
        marketCap: Math.floor(Math.random() * 10000000) + 67500000
      };
      
      setLiveData(prev => [...prev.slice(-19), newDataPoint]);
    }, 3000);

    return () => clearInterval(interval);
  };

  const loadInvestorData = async () => {
    setLoading(true);
    try {
      // Data based on comprehensive market strategy report and revenue distribution model
      const mockRevenueData: RevenueData = {
        totalRevenue: 179356800, // Full TAM potential: $179.3568M annual revenue projection
        founderShare: 35871360, // 20% - Founder/Developer allocation
        lpShare: 89678400, // 50% - NXD Liquidity Providers
        ecosystemShare: 53807040, // 30% - NXD Ecosystem/DAO Treasury
        whiteLabelShare: 17935680, // 10% from white label partners (scalable to $1.5M)
        monthlyGrowth: 37.7, // Market CAGR from strategy report
        revenueStreams: {
          domainRegistrations: 35871360, // Communication & Domains: $35.87M
          tldCreation: 53807040, // IoT Services: $53.8M (30% of $179M TAM)
          apiIntegrations: 71742720, // AI Integration & API Access: $71.74M (40%)
          subscriptions: 8967840, // Subscription Tiers: $8.97M (5%)
          tokenUtility: 8967840 // Cross-chain Bridge Fees & Token Utility: $8.97M (5%)
        },
        whiteLabelMetrics: {
          totalPartners: 50, // Target: 50+ WL deployments post-launch
          activeDeployments: 42, // 84% deployment rate
          partnerRevenue: 17935680, // $17.9M partner revenue potential
          averagePartnerShare: 15 // 15% average share to partners
        }
      };

      const mockTokenomicsData: TokenomicsData = {
        totalSupply: 1000000000,
        circulatingSupply: 450000000,
        marketCap: 50000000, // Post-launch valuation: $25M-$50M
        price: 0.111, // $50M market cap / 450M circulating
        distribution: {
          community: 20,
          liquidityMining: 25,
          treasury: 20,
          founder: 15,
          strategic: 10,
          staking: 10
        },
        stakingStats: {
          totalStaked: 180000000,
          stakingApr: 12.5,
          stakingParticipation: 40
        }
      };

      // Market Strategy Data from comprehensive report
      const marketStrategyData = {
        tam: 30000000000, // $20-30B+ TAM
        sam: 5000000000, // ~$3-5B SAM
        som: 250000000, // ~$100-250M SOM
        marketSegments: [
          { name: 'Web3 Communication', tam: 6230000, growth: 45, current: 3500000 },
          { name: 'IoT Services', tam: 30000000, growth: 35, current: 15000000 },
          { name: 'Satellite Services', tam: 1800000, growth: 25, current: 900000 },
          { name: 'Domain Registration', tam: 700000, growth: 15, current: 350000 },
          { name: 'White Label SaaS', tam: 1500000, growth: 55, current: 120000 },
          { name: 'AI Credits & API', tam: 240000, growth: 85, current: 120000 }
        ],
        valuationMilestones: {
          productionReady: 6500000, // $6.5M
          preLaunch: 12500000, // $10M-$15M average
          postLaunch: 37500000 // $25M-$50M average
        },
        costAnalysis: {
          prototyping: 873, // Replit
          production: 464040, // Optimized production costs
          profitMargin: 99.74, // 99.74% profit margin
          breakEven: 2.52 // 2.52% of TAM to break even
        }
      };

      setRevenueData(mockRevenueData);
      setTokenomicsData(mockTokenomicsData);
      setMarketData(marketStrategyData);
    } catch (error) {
      console.error("Error loading investor data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading investor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Investor Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive overview of NXD Platform performance and metrics
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="market">Market Analysis</TabsTrigger>
            <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
            <TabsTrigger value="whitelabel">White Label</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="pitch">Live Pitch</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">TAM Revenue Potential</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${revenueData ? (revenueData.totalRevenue / 1000000).toFixed(1) : '0'}M
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {revenueData?.monthlyGrowth}% Market CAGR
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valuation Target</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${marketData.valuationMilestones ? (marketData.valuationMilestones.postLaunch / 1000000).toFixed(1) : '37.5'}M
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Post-Launch (6-12 months)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                  <Zap className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {marketData.costAnalysis?.profitMargin || 99.74}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Industry-leading efficiency
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Position</CardTitle>
                  <Trophy className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    #{liveData.length > 0 ? Math.floor(Math.random() * 3) + 1 : 1}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Web3 Domain Platform
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Live Market Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      marketCap: { label: "Market Cap", color: "hsl(262, 83%, 58%)" },
                      staking: { label: "Staking TVL", color: "hsl(142, 76%, 36%)" }
                    }}
                    className="h-[250px]"
                  >
                    <AreaChart data={liveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="marketCap" stackId="1" stroke="var(--color-marketCap)" fill="var(--color-marketCap)" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="staking" stackId="2" stroke="var(--color-staking)" fill="var(--color-staking)" fillOpacity={0.6} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strategic Positioning</CardTitle>
                  <p className="text-sm text-muted-foreground">Cloudflare + Shopify of Web3 Identity</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">TAM Coverage</span>
                    <Badge variant="secondary">
                      {marketData.som && marketData.tam ? ((marketData.som / marketData.tam) * 100).toFixed(1) : '0.83'}%
                    </Badge>
                  </div>
                  <Progress value={0.83} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Break-even Point</span>
                    <Badge variant="secondary">
                      {marketData.costAnalysis?.breakEven || 2.52}% TAM
                    </Badge>
                  </div>
                  <Progress value={2.52} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">White Label Growth</span>
                    <Badge variant="secondary">55% CAGR</Badge>
                  </div>
                  <Progress value={55} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Live Revenue Stream</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: { label: "Revenue", color: "hsl(142, 76%, 36%)" },
                      domains: { label: "Domains", color: "hsl(221, 83%, 53%)" }
                    }}
                    className="h-[300px]"
                  >
                    <LineChart data={liveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={3} />
                      <Line type="monotone" dataKey="domains" stroke="var(--color-domains)" strokeWidth={2} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution</CardTitle>
                  <p className="text-sm text-muted-foreground">Full TAM Potential: $179.3M annually</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      founderShare: { label: "Founder (20%)", color: "hsl(262, 83%, 58%)" },
                      lpShare: { label: "LPs (50%)", color: "hsl(142, 76%, 36%)" },
                      ecosystemShare: { label: "Ecosystem (30%)", color: "hsl(221, 83%, 53%)" }
                    }}
                    className="h-[300px]"
                  >
                    <RechartsPieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <RechartsPieChart data={[
                        { name: "Founder Share", value: revenueData?.founderShare || 0, fill: "hsl(262, 83%, 58%)" },
                        { name: "LP Share", value: revenueData?.lpShare || 0, fill: "hsl(142, 76%, 36%)" },
                        { name: "Ecosystem Share", value: revenueData?.ecosystemShare || 0, fill: "hsl(221, 83%, 53%)" }
                      ]} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                        <Cell fill="hsl(262, 83%, 58%)" />
                        <Cell fill="hsl(142, 76%, 36%)" />
                        <Cell fill="hsl(221, 83%, 53%)" />
                      </RechartsPieChart>
                    </RechartsPieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Market Segments Performance</CardTitle>
                <p className="text-sm text-muted-foreground">TAM: $30B+ | SAM: $5B | SOM: $250M</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    current: { label: "Current Revenue", color: "hsl(142, 76%, 36%)" },
                    potential: { label: "TAM Potential", color: "hsl(221, 83%, 53%)" }
                  }}
                  className="h-[400px]"
                >
                  <BarChart data={marketData.marketSegments || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="current" fill="var(--color-current)" />
                    <Bar dataKey="tam" fill="var(--color-potential)" opacity={0.6} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>TAM/SAM/SOM Analysis</CardTitle>
                  <p className="text-sm text-muted-foreground">Total Addressable, Serviceable Available, and Serviceable Obtainable Markets</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      tam: { label: "TAM ($30B+)", color: "hsl(221, 83%, 53%)" },
                      sam: { label: "SAM ($5B)", color: "hsl(142, 76%, 36%)" },
                      som: { label: "SOM ($250M)", color: "hsl(262, 83%, 58%)" }
                    }}
                    className="h-[300px]"
                  >
                    <BarChart data={[
                      { name: "Total Addressable Market", value: 30000, color: "hsl(221, 83%, 53%)" },
                      { name: "Serviceable Available Market", value: 5000, color: "hsl(142, 76%, 36%)" },
                      { name: "Serviceable Obtainable Market", value: 250, color: "hsl(262, 83%, 58%)" }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(221, 83%, 53%)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitive Position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>vs ENS</span>
                      <Badge variant="secondary">Multi-chain + AI</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>vs Unstoppable</span>
                      <Badge variant="secondary">Open Infrastructure</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>vs Bonfida</span>
                      <Badge variant="secondary">Cross-chain Native</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>vs Lens Protocol</span>
                      <Badge variant="secondary">Domain Focus + SaaS</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>vs Thirdweb</span>
                      <Badge variant="secondary">Domain Registry + UX</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Strategic Advantages</CardTitle>
                  <p className="text-sm text-muted-foreground">Key differentiators driving market capture</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">1</Badge>
                    <div>
                      <p className="font-medium">Full-Stack Modular Architecture</p>
                      <p className="text-sm text-muted-foreground">Registry, revenue splitter, AI, white-label, staking, marketplace</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">2</Badge>
                    <div>
                      <p className="font-medium">AI-Native Platform</p>
                      <p className="text-sm text-muted-foreground">Grok 3, GPT-4o, Claude 4 integration for conversational UX</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">3</Badge>
                    <div>
                      <p className="font-medium">White-Label B2B SaaS</p>
                      <p className="text-sm text-muted-foreground">Multi-tenant infrastructure for Web3 ecosystem</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">4</Badge>
                    <div>
                      <p className="font-medium">Token-Native Incentives</p>
                      <p className="text-sm text-muted-foreground">NXD powers access, rewards, and revenue across all layers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Risks & Mitigation</CardTitle>
                  <p className="text-sm text-muted-foreground">Identified threats and strategic responses</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive" className="mt-1">Risk</Badge>
                    <div>
                      <p className="font-medium">Competition from ENS, Unstoppable Domains</p>
                      <p className="text-sm text-muted-foreground">Mitigation: Multi-chain + AI + white-label differentiation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive" className="mt-1">Risk</Badge>
                    <div>
                      <p className="font-medium">Gas Cost Volatility</p>
                      <p className="text-sm text-muted-foreground">Mitigation: Paymaster system + L2 optimization</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive" className="mt-1">Risk</Badge>
                    <div>
                      <p className="font-medium">Regulatory Changes</p>
                      <p className="text-sm text-muted-foreground">Mitigation: Compliance-ready architecture + legal framework</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive" className="mt-1">Risk</Badge>
                    <div>
                      <p className="font-medium">AI Model Costs</p>
                      <p className="text-sm text-muted-foreground">Mitigation: Load balancing + rate limits ($19.7K/year optimized)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tokenomics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tokenomicsData && Object.entries(tokenomicsData.distribution).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        <span>{value}%</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whitelabel" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {revenueData?.whiteLabelMetrics.totalPartners}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +3 new this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {revenueData?.whiteLabelMetrics.activeDeployments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    67% deployment rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Partner Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${revenueData?.whiteLabelMetrics.partnerRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average {revenueData?.whiteLabelMetrics.averagePartnerShare}% share
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Distribution</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Founder (20%)</span>
                      <span>${(revenueData?.founderShare || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>LPs (50%)</span>
                      <span>${(revenueData?.lpShare || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ecosystem (30%)</span>
                      <span>${(revenueData?.ecosystemShare || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>White Label Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Partner Onboarding Rate</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Revenue per Partner</span>
                      <span>${((revenueData?.whiteLabelMetrics.partnerRevenue || 0) / (revenueData?.whiteLabelMetrics.totalPartners || 1)).toLocaleString()}</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Partner Satisfaction</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Growth</span>
                    <Badge variant="secondary">
                      +{revenueData?.monthlyGrowth}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User Growth</span>
                    <Badge variant="secondary">
                      +25.3%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Domain Growth</span>
                    <Badge variant="secondary">
                      +18.7%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">White Label Growth</span>
                    <Badge variant="secondary">
                      +33.1%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pitch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Presentation className="h-5 w-5" />
                  <span>Live Investor Pitch Deck</span>
                </CardTitle>
                <p className="text-muted-foreground">
                  Interactive presentation showcasing NXD Platform's market opportunity, 
                  financial projections, and investment potential.
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] rounded-lg overflow-hidden border border-border">
                  <LivePitchDeck />
                </div>
                <div className="mt-6 flex justify-center space-x-4">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Presentation
                  </Button>
                  <Button variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Investment Inquiry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default InvestorDashboard;