
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  DollarSign, 
  Target, 
  Globe, 
  Zap,
  Eye,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Download,
  Share,
  Maximize,
  ChevronRight,
  ArrowUpRight,
  Briefcase
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';

interface InvestmentScenario {
  name: string;
  penetrationRate: number;
  annualRevenue: number;
  profitMargin: number;
  roi: number;
  timeToBreakeven: number;
}

interface CostBreakdown {
  cloud: number;
  blockchain: number;
  ipfs: number;
  cst: number;
  operational: number;
  total: number;
}

interface MarketSegment {
  name: string;
  tam: number;
  penetration: number;
  revenue: number;
  growth: number;
}

// InvestorDashboard component removed - using new version below

  const optimizedCosts: CostBreakdown = {
    cloud: 26664 - 5865,
    blockchain: 336792 - 100000,
    ipfs: 13800 - 9600,
    cst: 57804,
    operational: 351204,
    total: 670799
  };

  const marketSegments: MarketSegment[] = [
    { name: 'Web3 Communication', tam: 3120000000, penetration: 1, revenue: 3740000, growth: 45 },
    { name: 'Satellite Services', tam: 2500000000, penetration: 1, revenue: 1500000, growth: 25 },
    { name: 'IoT Services', tam: 50000000000, penetration: 1, revenue: 30000000, growth: 35 },
    { name: 'Domain Registration', tam: 700000000, penetration: 1, revenue: 700000, growth: 15 }
  ];

  const calculateScenario = (penetration: number): InvestmentScenario => {
    const baseRevenue = 35940000;
    const revenue = baseRevenue * (penetration / 100);
    const costs = optimizedCosts.total;
    const profit = revenue - costs;
    const profitMargin = (profit / revenue) * 100;
    const roi = (profit / investmentAmount) * 100;
    const timeToBreakeven = costs / (revenue / 12);

    return {
      name: `${penetration}% Market Penetration`,
      penetrationRate: penetration,
      annualRevenue: revenue,
      profitMargin,
      roi,
      timeToBreakeven
    };
  };

  const scenarios: InvestmentScenario[] = [
    calculateScenario(1),
    calculateScenario(3),
    calculateScenario(5),
    calculateScenario(10)
  ];

  const currentScenario = calculateScenario(penetrationRate[0]);

  // Market Visualization Components
  const MarketVisualization = () => (
    <div className="h-64 bg-white/5 rounded-lg p-4 flex flex-col justify-center items-center">
      <h3 className="text-white font-semibold mb-4">NXD Investment Analysis</h3>
      <div className="grid grid-cols-3 gap-4 w-full">
        {/* Revenue Bar */}
        <div className="text-center">
          <div className="bg-green-500 rounded h-24 mb-2" style={{ height: `${(currentScenario.annualRevenue / 100000000) * 100}px` }}></div>
          <p className="text-white/70 text-xs">Revenue</p>
          <p className="text-green-400 text-sm">${(currentScenario.annualRevenue / 1000000).toFixed(1)}M</p>
        </div>
        
        {/* Cost Bar */}
        <div className="text-center">
          <div className="bg-red-500 rounded h-16 mb-2" style={{ height: `${(optimizedCosts.total / 50000000) * 100}px` }}></div>
          <p className="text-white/70 text-xs">Costs</p>
          <p className="text-red-400 text-sm">${(optimizedCosts.total / 1000000).toFixed(1)}M</p>
        </div>
        
        {/* Profit Bar */}
        <div className="text-center">
          <div className="bg-blue-500 rounded h-20 mb-2" style={{ height: `${((currentScenario.annualRevenue - optimizedCosts.total) / 100000000) * 100}px` }}></div>
          <p className="text-white/70 text-xs">Profit</p>
          <p className="text-blue-400 text-sm">${((currentScenario.annualRevenue - optimizedCosts.total) / 1000000).toFixed(1)}M</p>
        </div>
      </div>
      
      {/* Market Segments */}
      <div className="flex gap-2 mt-4">
        {marketSegments.map((segment, index) => (
          <div key={segment.name} className="text-center">
            <div 
              className="rounded-full mb-1" 
              style={{ 
                width: `${Math.max(20, segment.revenue / 1000000)}px`,
                height: `${Math.max(20, segment.revenue / 1000000)}px`,
                backgroundColor: `hsl(${index * 90}, 70%, 50%)`
              }}
            ></div>
            <p className="text-white/60 text-xs">{segment.name}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const PitchDeckSlide = ({ title, content, metrics }: { title: string; content: string; metrics?: any[] }) => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 rounded-xl border border-white/20"
    >
      <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        {title}
      </h2>
      <p className="text-xl text-white/80 mb-8 leading-relaxed">{content}</p>
      {metrics && (
        <div className="grid grid-cols-2 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-4 bg-white/5 border-white/10">
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="text-sm text-white/60">{metric.label}</div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Investment Dashboard</h1>
          <p className="text-white/60">Interactive analysis for NXD Platform opportunities</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsVRMode(!isVRMode)} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            {isVRMode ? 'Exit VR' : 'VR Mode'}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
        <TabsList className="grid w-full grid-cols-5 bg-black/30">
          <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
          <TabsTrigger value="scenarios" className="text-white">Scenarios</TabsTrigger>
          <TabsTrigger value="market" className="text-white">Market Analysis</TabsTrigger>
          <TabsTrigger value="vr" className="text-white">3D Visualization</TabsTrigger>
          <TabsTrigger value="pitch" className="text-white">Live Pitch</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm">Annual Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    ${(currentScenario.annualRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm">Profit Margin</p>
                  <p className="text-2xl font-bold text-white">
                    {currentScenario.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <PieChart className="w-8 h-8 text-blue-400" />
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm">ROI</p>
                  <p className="text-2xl font-bold text-white">
                    {currentScenario.roi.toFixed(1)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm">Breakeven</p>
                  <p className="text-2xl font-bold text-white">
                    {currentScenario.timeToBreakeven.toFixed(1)} months
                  </p>
                </div>
                <Zap className="w-8 h-8 text-orange-400" />
              </div>
            </Card>
          </div>

          {/* Interactive Controls */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Investment Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-white/80 text-sm mb-2 block">Market Penetration (%)</label>
                <Slider
                  value={penetrationRate}
                  onValueChange={setPenetrationRate}
                  max={20}
                  min={0.1}
                  step={0.1}
                  className="mb-2"
                />
                <p className="text-white/60 text-sm">{penetrationRate[0]}%</p>
              </div>
              
              <div>
                <label className="text-white/80 text-sm mb-2 block">Investment Amount ($)</label>
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  className="bg-black/30 border-white/20 text-white"
                />
              </div>
              
              <div>
                <label className="text-white/80 text-sm mb-2 block">Time Horizon (years)</label>
                <Slider
                  value={timeHorizon}
                  onValueChange={setTimeHorizon}
                  max={10}
                  min={1}
                  step={1}
                  className="mb-2"
                />
                <p className="text-white/60 text-sm">{timeHorizon[0]} years</p>
              </div>
            </div>
          </Card>

          {/* Cost Breakdown */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Cost Optimization Analysis</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Base Costs</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/80">Cloud Infrastructure</span>
                    <span className="text-white">${baseCosts.cloud.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Blockchain</span>
                    <span className="text-white">${baseCosts.blockchain.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">IPFS Storage</span>
                    <span className="text-white">${baseCosts.ipfs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">CST Compliance</span>
                    <span className="text-white">${baseCosts.cst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Operational</span>
                    <span className="text-white">${baseCosts.operational.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-white/20 pt-2">
                    <span className="text-white">Total</span>
                    <span className="text-white">${baseCosts.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Optimized Costs</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/80">Cloud Infrastructure</span>
                    <span className="text-green-400">${optimizedCosts.cloud.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Blockchain</span>
                    <span className="text-green-400">${optimizedCosts.blockchain.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">IPFS Storage</span>
                    <span className="text-green-400">${optimizedCosts.ipfs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">CST Compliance</span>
                    <span className="text-white">${optimizedCosts.cst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Operational</span>
                    <span className="text-white">${optimizedCosts.operational.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-white/20 pt-2">
                    <span className="text-white">Total</span>
                    <span className="text-green-400">${optimizedCosts.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-300">
                Annual Savings: ${(baseCosts.total - optimizedCosts.total).toLocaleString()} 
                ({(((baseCosts.total - optimizedCosts.total) / baseCosts.total) * 100).toFixed(1)}% reduction)
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenarios.map((scenario, index) => (
              <Card 
                key={index} 
                className={`p-6 cursor-pointer transition-all ${
                  selectedScenario?.name === scenario.name 
                    ? 'bg-purple-500/20 border-purple-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                onClick={() => setSelectedScenario(scenario)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white">{scenario.name}</h3>
                  <Badge variant="outline" className="text-purple-300">
                    {scenario.penetrationRate}% Market
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/80">Annual Revenue</span>
                    <span className="text-white font-semibold">
                      ${(scenario.annualRevenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Profit Margin</span>
                    <span className="text-green-400 font-semibold">
                      {scenario.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">ROI</span>
                    <span className="text-blue-400 font-semibold">
                      {scenario.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Time to Breakeven</span>
                    <span className="text-orange-400 font-semibold">
                      {scenario.timeToBreakeven.toFixed(1)} months
                    </span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Select Strategy
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marketSegments.map((segment, index) => (
              <Card key={index} className="p-6 bg-white/5 border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white">{segment.name}</h3>
                  <Badge variant="outline" className="text-green-300">
                    +{segment.growth}% Growth
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/80">TAM</span>
                    <span className="text-white font-semibold">
                      ${(segment.tam / 1000000000).toFixed(1)}B
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Penetration</span>
                    <span className="text-blue-400 font-semibold">
                      {segment.penetration}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Revenue Potential</span>
                    <span className="text-green-400 font-semibold">
                      ${(segment.revenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
                <div className="mt-4 w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(segment.penetration * 10, 100)}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 3D Visualization Tab */}
        <TabsContent value="vr" className="space-y-6">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">3D Market Visualization</h3>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset View
                </Button>
                <Button size="sm" variant="outline">
                  <Maximize className="w-4 h-4 mr-2" />
                  Fullscreen
                </Button>
              </div>
            </div>
            <div className="h-96 bg-black/30 rounded-lg overflow-hidden">
              <MarketVisualization />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-white/80">Revenue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-white/80">Costs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-white/80">Profit</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-white/80">Market Segments</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Live Pitch Tab */}
        <TabsContent value="pitch" className="space-y-6">
          <div className="h-96">
            <PitchDeckSlide
              title="NXD Platform Investment Opportunity"
              content="The NXD Platform represents a revolutionary Web3 domain management ecosystem with multi-billion dollar market potential. Our comprehensive analysis shows exceptional profit margins and rapid growth opportunities across communication, satellite, and IoT services."
              metrics={[
                { value: `${(currentScenario.annualRevenue / 1000000).toFixed(1)}M`, label: 'Annual Revenue Potential' },
                { value: `${currentScenario.profitMargin.toFixed(1)}%`, label: 'Profit Margin' },
                { value: `${currentScenario.roi.toFixed(1)}%`, label: 'Return on Investment' },
                { value: `${currentScenario.timeToBreakeven.toFixed(1)} months`, label: 'Time to Breakeven' }
              ]}
            />
          </div>
          <div className="flex justify-center space-x-4">
            <Button className="bg-purple-600">
              <Play className="w-4 h-4 mr-2" />
              Start Presentation
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Whitepaper
            </Button>
            <Button variant="outline">
              <Briefcase className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default InvestorDashboard;

interface RevenueData {
  totalRevenue: number;
  founderShare: number;
  lpShare: number;
  ecosystemShare: number;
  whiteLabelShare: number;
  monthlyGrowth: number;
  revenueStreams: {
    domainRegistrations: number;
    tldCreation: number;
    apiIntegrations: number;
    subscriptions: number;
    tokenUtility: number;
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

  useEffect(() => {
    loadInvestorData();
  }, []);

  const loadInvestorData = async () => {
    setLoading(true);
    try {
      // Mock data - in production this would come from APIs
      const mockRevenueData: RevenueData = {
        totalRevenue: 2850000, // $2.85M
        founderShare: 570000, // 20%
        lpShare: 1425000, // 50%
        ecosystemShare: 855000, // 30%
        whiteLabelShare: 285000, // 10% from white label partners
        monthlyGrowth: 15.2,
        revenueStreams: {
          domainRegistrations: 1140000, // 40%
          tldCreation: 570000, // 20%
          apiIntegrations: 427500, // 15%
          subscriptions: 427500, // 15%
          tokenUtility: 285000 // 10%
        }
      };

      const mockTokenomicsData: TokenomicsData = {
        totalSupply: 1000000000, // 1B NXD
        circulatingSupply: 450000000, // 450M NXD
        marketCap: 67500000, // $67.5M (assuming $0.15/NXD)
        price: 0.15,
        distribution: {
          community: 20, // 200M NXD
          liquidityMining: 25, // 250M NXD
          treasury: 20, // 200M NXD
          founder: 15, // 150M NXD
          strategic: 10, // 100M NXD
          staking: 10 // 100M NXD
        },
        stakingStats: {
          totalStaked: 180000000, // 180M NXD staked
          stakingApr: 12.5,
          stakingParticipation: 40 // 40% of circulating supply staked
        }
      };

      setRevenueData(mockRevenueData);
      setTokenomicsData(mockTokenomicsData);
    } catch (error) {
      console.error("Failed to load investor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatToken = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-void via-deep-space to-quantum-blue p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-cosmic-purple" />
            <h1 className="text-3xl font-orbitron font-bold text-white">
              Investor Dashboard
            </h1>
            <Badge variant="outline" className="border-meteor-green text-meteor-green">
              NXD Platform
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm text-white/60">Current NXD Price</p>
              <p className="text-xl font-bold text-meteor-green">
                {tokenomicsData ? `$${tokenomicsData.price.toFixed(3)}` : '--'}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glassmorphism border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
              <PieChart className="w-4 h-4 mr-2" />
              Revenue Overview
            </TabsTrigger>
            <TabsTrigger value="tokenomics" className="data-[state=active]:bg-white/20">
              <Coins className="w-4 h-4 mr-2" />
              Tokenomics
            </TabsTrigger>
            <TabsTrigger value="growth" className="data-[state=active]:bg-white/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Growth Metrics
            </TabsTrigger>
            <TabsTrigger value="whitelabel" className="data-[state=active]:bg-white/20">
              <Building2 className="w-4 h-4 mr-2" />
              White Label
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">
                        {revenueData ? formatCurrency(revenueData.totalRevenue) : '--'}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-cosmic-purple" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Monthly Growth</p>
                      <p className="text-2xl font-bold text-meteor-green">
                        {revenueData ? `+${revenueData.monthlyGrowth}%` : '--'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-meteor-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Market Cap</p>
                      <p className="text-2xl font-bold text-white">
                        {tokenomicsData ? formatCurrency(tokenomicsData.marketCap) : '--'}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-nebula-blue" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Staking APR</p>
                      <p className="text-2xl font-bold text-solar-orange">
                        {tokenomicsData ? `${tokenomicsData.stakingStats.stakingApr}%` : '--'}
                      </p>
                    </div>
                    <Lock className="w-8 h-8 text-solar-orange" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Distribution */}
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Platform Revenue Distribution (100%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-cosmic-purple rounded-full"></div>
                        <span className="text-white">Founder/Developer</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">20%</p>
                        <p className="text-xs text-white/60">
                          {revenueData ? formatCurrency(revenueData.founderShare) : '--'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-meteor-green rounded-full"></div>
                        <span className="text-white">NXD Liquidity Providers</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">50%</p>
                        <p className="text-xs text-white/60">
                          {revenueData ? formatCurrency(revenueData.lpShare) : '--'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-nebula-blue rounded-full"></div>
                        <span className="text-white">NXD Ecosystem/DAO Treasury</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">30%</p>
                        <p className="text-xs text-white/60">
                          {revenueData ? formatCurrency(revenueData.ecosystemShare) : '--'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Revenue Sources</h4>
                    {revenueData && Object.entries(revenueData.revenueStreams).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/80 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-white">{formatCurrency(value)}</span>
                        </div>
                        <Progress 
                          value={(value / revenueData.totalRevenue) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-cosmic-purple/20 p-4 rounded-lg border border-cosmic-purple/50">
                  <p className="text-white text-sm">
                    <strong>Founder/Developer Address:</strong> <code className="text-cosmic-purple">0xCc380FD8bfbdF0c020de64075b86C84c2BB0AE79</code>
                  </p>
                  <p className="text-white/80 text-xs mt-2">
                    ✅ Every revenue dollar (or wei) is accounted for through smart contract logic and multisig-controlled treasury contracts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokenomics" className="space-y-6">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Coins className="w-5 h-5 mr-2" />
                  NXD Token Distribution (1B Total Supply)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {tokenomicsData && Object.entries(tokenomicsData.distribution).map(([key, percentage]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white capitalize">
                            {key === 'liquidityMining' ? 'Liquidity Mining & LP Incentives' : 
                             key === 'community' ? 'Community Rewards & Airdrops' :
                             key === 'treasury' ? 'Treasury / Ecosystem Fund' :
                             key === 'founder' ? 'Founder/Developer Allocation' :
                             key === 'strategic' ? 'Strategic Investors / Advisors' :
                             key === 'staking' ? 'Staking Rewards & Subscriptions' : key}
                          </p>
                          <p className="text-xs text-white/60">
                            {formatToken((percentage / 100) * 1000000000)} NXD
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{percentage}%</p>
                          <Progress value={percentage} className="w-20 h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Key Metrics</h4>
                    
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Circulating Supply</span>
                        <span className="text-white font-semibold">
                          {tokenomicsData ? formatToken(tokenomicsData.circulatingSupply) : '--'} NXD
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Total Staked</span>
                        <span className="text-white font-semibold">
                          {tokenomicsData ? formatToken(tokenomicsData.stakingStats.totalStaked) : '--'} NXD
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Staking Participation</span>
                        <span className="text-white font-semibold">
                          {tokenomicsData ? `${tokenomicsData.stakingStats.stakingParticipation}%` : '--'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-meteor-green/20 p-4 rounded-lg border border-meteor-green/50">
                      <h5 className="text-meteor-green font-semibold mb-2">Founder Vesting</h5>
                      <p className="text-white/80 text-sm">
                        15% (150M NXD) allocation with 4-year vesting schedule and 1-year cliff.
                        25% unlocks after year 1, then monthly thereafter.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Tiers */}
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Dynamic Subscription Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/20">
                    <h4 className="text-white font-semibold mb-2">Free Tier</h4>
                    <p className="text-white/60 text-sm mb-2">Just wallet connection</p>
                    <p className="text-meteor-green">Basic domain registration</p>
                  </div>

                  <div className="p-4 bg-cosmic-purple/20 rounded-lg border border-cosmic-purple/50">
                    <h4 className="text-white font-semibold mb-2">Pro Tier</h4>
                    <p className="text-white/60 text-sm mb-2">Hold 10,000 NXD</p>
                    <p className="text-cosmic-purple">Custom records, analytics, social graph</p>
                  </div>

                  <div className="p-4 bg-solar-orange/20 rounded-lg border border-solar-orange/50">
                    <h4 className="text-white font-semibold mb-2">Enterprise Tier</h4>
                    <p className="text-white/60 text-sm mb-2">Stake 50,000 NXD</p>
                    <p className="text-solar-orange">API access, gas sponsorship, team dashboard</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Growth Projections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/80">Q1 2025 Revenue Target</span>
                      <span className="text-meteor-green font-semibold">$3.5M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Annual Revenue Projection</span>
                      <span className="text-meteor-green font-semibold">$15M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Token Price Target (EOY)</span>
                      <span className="text-meteor-green font-semibold">$0.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Active Domains Target</span>
                      <span className="text-meteor-green font-semibold">100K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Market Opportunity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/80">Web3 Domain Market</span>
                      <span className="text-white font-semibold">$2.8B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">TAM (5-year)</span>
                      <span className="text-white font-semibold">$12B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Market Share Target</span>
                      <span className="text-cosmic-purple font-semibold">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Competitive Advantage</span>
                      <span className="text-nebula-blue font-semibold">Multi-chain + AI</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="whitelabel" className="space-y-6">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  White Label Program
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Program Benefits</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-meteor-green rounded-full"></div>
                        <span className="text-white/80">Revenue expansion through partner fees</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cosmic-purple rounded-full"></div>
                        <span className="text-white/80">Increased NXD token utility</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-nebula-blue rounded-full"></div>
                        <span className="text-white/80">Network effects and brand diversification</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-solar-orange rounded-full"></div>
                        <span className="text-white/80">Scalable infrastructure monetization</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Revenue Model</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-white/80">Founder/Developer</span>
                          <span className="text-white font-semibold">20%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-white/80">NXD LPs</span>
                          <span className="text-white font-semibold">40-50%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-white/80">White Label Partner</span>
                          <span className="text-white font-semibold">0-20%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-white/80">Ecosystem Treasury</span>
                          <span className="text-white font-semibold">Remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-nebula-blue/20 p-4 rounded-lg border border-nebula-blue/50">
                  <h5 className="text-nebula-blue font-semibold mb-2">Partner Requirements</h5>
                  <ul className="text-white/80 text-sm space-y-1">
                    <li>• Stake NXD tokens to access white label APIs</li>
                    <li>• Hold license NFT with metadata for limits and permissions</li>
                    <li>• Revenue sharing through smart contract automation</li>
                    <li>• API rate limits based on NXD holdings and tier</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
