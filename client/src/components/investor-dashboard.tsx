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
  Presentation
} from "lucide-react";
import LivePitchDeck from "./live-pitch-deck";

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

  useEffect(() => {
    loadInvestorData();
  }, []);

  const loadInvestorData = async () => {
    setLoading(true);
    try {
      // Data based on revenue distribution model from attached assets
      const mockRevenueData: RevenueData = {
        totalRevenue: 35900000, // $35.9M annual revenue projection
        founderShare: 7180000, // 20% - Founder/Developer allocation
        lpShare: 17950000, // 50% - NXD Liquidity Providers
        ecosystemShare: 10770000, // 30% - NXD Ecosystem/DAO Treasury
        whiteLabelShare: 3590000, // Variable based on white label activity
        monthlyGrowth: 15.2,
        revenueStreams: {
          domainRegistrations: 14360000, // 40% of revenue
          tldCreation: 10770000, // 30% of revenue
          apiIntegrations: 5385000, // 15% of revenue
          subscriptions: 3590000, // 10% of revenue
          tokenUtility: 1795000 // 5% of revenue
        },
        whiteLabelMetrics: {
          totalPartners: 12,
          activeDeployments: 8,
          partnerRevenue: 3590000,
          averagePartnerShare: 15 // 15% average share to partners
        }
      };

      const mockTokenomicsData: TokenomicsData = {
        totalSupply: 1000000000,
        circulatingSupply: 450000000,
        marketCap: 67500000,
        price: 0.15,
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

      setRevenueData(mockRevenueData);
      setTokenomicsData(mockTokenomicsData);
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
            <TabsTrigger value="whitelabel">White Label</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="pitch">Live Pitch</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${revenueData?.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{revenueData?.monthlyGrowth}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${tokenomicsData?.marketCap.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${tokenomicsData?.price} per NXD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Staking APR</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tokenomicsData?.stakingStats.stakingApr}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tokenomicsData?.stakingStats.stakingParticipation}% participation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Domains</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12,453</div>
                  <p className="text-xs text-muted-foreground">
                    +2,341 this month
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData && Object.entries(revenueData.revenueStreams).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                      <div className="text-sm font-bold">
                        ${value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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