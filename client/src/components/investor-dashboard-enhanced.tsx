
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Globe, 
  Activity, 
  PieChart,
  BarChart3,
  LineChart,
  Target,
  Zap,
  Shield,
  Rocket
} from "lucide-react";

interface InvestorMetrics {
  totalRevenue: string;
  monthlyRecurring: string;
  userGrowth: number;
  domainSales: number;
  stakingRewards: string;
  marketCap: string;
  tokenPrice: string;
  tvl: string; // Total Value Locked
}

interface RevenueBreakdown {
  domainRegistrations: number;
  subscriptions: number;
  transactionFees: number;
  stakingRewards: number;
  whiteLabelLicenses: number;
}

export function InvestorDashboardEnhanced() {
  const [metrics, setMetrics] = useState<InvestorMetrics | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadInvestorData();
  }, [timeframe]);

  const loadInvestorData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from actual analytics API
      const mockMetrics: InvestorMetrics = {
        totalRevenue: "2,847,593",
        monthlyRecurring: "186,421",
        userGrowth: 23.7,
        domainSales: 1247,
        stakingRewards: "94,582",
        marketCap: "12,847,593",
        tokenPrice: "0.34",
        tvl: "5,692,847"
      };

      const mockBreakdown: RevenueBreakdown = {
        domainRegistrations: 45,
        subscriptions: 28,
        transactionFees: 15,
        stakingRewards: 8,
        whiteLabelLicenses: 4
      };

      setMetrics(mockMetrics);
      setRevenueBreakdown(mockBreakdown);
    } catch (error) {
      console.error("Failed to load investor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `$${metrics?.totalRevenue}`,
      change: "+18.2%",
      icon: DollarSign,
      color: "text-meteor-green"
    },
    {
      title: "Monthly Recurring",
      value: `$${metrics?.monthlyRecurring}`,
      change: "+12.4%",
      icon: TrendingUp,
      color: "text-cosmic-purple"
    },
    {
      title: "Token Price",
      value: `$${metrics?.tokenPrice}`,
      change: "+5.7%",
      icon: Zap,
      color: "text-solar-orange"
    },
    {
      title: "Market Cap",
      value: `$${metrics?.marketCap}`,
      change: "+15.3%",
      icon: Target,
      color: "text-nebula-blue"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-void via-deep-space to-quantum-blue p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <PieChart className="w-8 h-8 text-cosmic-purple" />
            <h1 className="text-3xl font-orbitron font-bold text-white">
              Investor Dashboard
            </h1>
            <Badge variant="outline" className="border-meteor-green text-meteor-green">
              Real-time Analytics
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <Button
              onClick={loadInvestorData}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <Card key={index} className="glassmorphism border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">{kpi.title}</p>
                    <p className="text-2xl font-bold text-white">{kpi.value}</p>
                    <p className={`text-sm ${kpi.color}`}>{kpi.change}</p>
                  </div>
                  <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glassmorphism border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-white/20 text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="growth" className="data-[state=active]:bg-white/20 text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Growth
            </TabsTrigger>
            <TabsTrigger value="platform" className="data-[state=active]:bg-white/20 text-white">
              <Globe className="w-4 h-4 mr-2" />
              Platform
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueBreakdown && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Domain Registrations</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-meteor-green rounded-full h-2" 
                              style={{ width: `${revenueBreakdown.domainRegistrations}%` }}
                            />
                          </div>
                          <span className="text-white text-sm">{revenueBreakdown.domainRegistrations}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Subscriptions</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-cosmic-purple rounded-full h-2" 
                              style={{ width: `${revenueBreakdown.subscriptions}%` }}
                            />
                          </div>
                          <span className="text-white text-sm">{revenueBreakdown.subscriptions}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Transaction Fees</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-nebula-blue rounded-full h-2" 
                              style={{ width: `${revenueBreakdown.transactionFees}%` }}
                            />
                          </div>
                          <span className="text-white text-sm">{revenueBreakdown.transactionFees}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Staking Rewards</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-solar-orange rounded-full h-2" 
                              style={{ width: `${revenueBreakdown.stakingRewards}%` }}
                            />
                          </div>
                          <span className="text-white text-sm">{revenueBreakdown.stakingRewards}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">White Label Licenses</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-stellar-cyan rounded-full h-2" 
                              style={{ width: `${revenueBreakdown.whiteLabelLicenses}%` }}
                            />
                          </div>
                          <span className="text-white text-sm">{revenueBreakdown.whiteLabelLicenses}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Platform Metrics */}
              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-cosmic-purple" />
                        <span className="text-white">Total Users</span>
                      </div>
                      <span className="text-white font-semibold">24,847</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-nebula-blue" />
                        <span className="text-white">Domains Registered</span>
                      </div>
                      <span className="text-white font-semibold">{metrics?.domainSales}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-meteor-green" />
                        <span className="text-white">TVL</span>
                      </div>
                      <span className="text-white font-semibold">${metrics?.tvl}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Rocket className="w-5 h-5 text-solar-orange" />
                        <span className="text-white">Growth Rate</span>
                      </div>
                      <span className="text-meteor-green font-semibold">+{metrics?.userGrowth}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-meteor-green/50 bg-meteor-green/10 mb-6">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription className="text-white/80">
                    Revenue has grown 18.2% over the last 30 days, with domain registrations leading growth.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <h3 className="text-lg font-semibold text-white">Daily Average</h3>
                    <p className="text-2xl font-bold text-meteor-green">$6,214</p>
                    <p className="text-sm text-white/60">+12% from last period</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <h3 className="text-lg font-semibold text-white">Weekly Average</h3>
                    <p className="text-2xl font-bold text-cosmic-purple">$43,498</p>
                    <p className="text-sm text-white/60">+8% from last period</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <h3 className="text-lg font-semibold text-white">Monthly Target</h3>
                    <p className="text-2xl font-bold text-nebula-blue">$200,000</p>
                    <p className="text-sm text-white/60">93% achieved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">User Acquisition</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/80">Organic</span>
                        <span className="text-meteor-green">67%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Referrals</span>
                        <span className="text-cosmic-purple">23%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Marketing</span>
                        <span className="text-nebula-blue">10%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Retention Rates</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/80">Day 1</span>
                        <span className="text-meteor-green">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Day 7</span>
                        <span className="text-cosmic-purple">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Day 30</span>
                        <span className="text-nebula-blue">65%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platform" className="space-y-6">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Activity className="w-8 h-8 text-meteor-green mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-white/80">Uptime</h3>
                    <p className="text-xl font-bold text-white">99.97%</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Zap className="w-8 h-8 text-solar-orange mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-white/80">Response Time</h3>
                    <p className="text-xl font-bold text-white">127ms</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Globe className="w-8 h-8 text-nebula-blue mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-white/80">Global Nodes</h3>
                    <p className="text-xl font-bold text-white">15</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Shield className="w-8 h-8 text-cosmic-purple mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-white/80">Security Score</h3>
                    <p className="text-xl font-bold text-white">A+</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
