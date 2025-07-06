import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Users, 
  Database, 
  Settings, 
  Activity, 
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Sparkles,
  Wallet,
  Layers,
  Bot,
  Coins
} from "lucide-react";
import { DeploymentNetwork } from './deployment-network';
import { AuditorSystem } from './auditor-system';
import TokenGenerator from './token-generator';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "pending";
  lastLogin: string;
  totalDomains: number;
  totalSpent: string;
}

interface SystemMetrics {
  totalUsers: number;
  totalDomains: number;
  totalTransactions: number;
  systemHealth: "healthy" | "warning" | "critical";
  activeConnections: number;
  serverUptime: string;
  memoryUsage: number;
  cpuUsage: number;
  whiteLabelPartners: number;
  activeDeployments: number;
  partnerRevenue: number;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  admin: string;
  target: string;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
}

export function AdminPanel() {
  const { walletAddress, walletConnected } = useAppStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Admin wallet addresses - in production, this would be stored securely
  const FOUNDER_ADDRESS = "0xCc380FD8bfbdF0c020de64075b86C84c2BB0AE79".toLowerCase(); // Founder/Developer
  const WHITE_LABEL_ADMINS = [
    "0x742d35cc6635c0532925a3b8d2b3c37b3fd5f4f3".toLowerCase(), // White label admin 1
    "0x1234567890123456789012345678901234567890".toLowerCase(), // White label admin 2
  ];

  const ADMIN_PASSWORD = "NXD_ADMIN_2025_SECURE"; // In production, use proper authentication
  const [adminType, setAdminType] = useState<"founder" | "white_label" | null>(null);

  useEffect(() => {
    // Check if wallet is connected and determine admin type
    if (walletConnected && walletAddress) {
      if (walletAddress.toLowerCase() === FOUNDER_ADDRESS) {
        setAdminType("founder");
      } else if (WHITE_LABEL_ADMINS.includes(walletAddress.toLowerCase())) {
        setAdminType("white_label");
      } else {
        setAdminType(null);
        setIsAuthorized(false);
      }
    } else {
      setAdminType(null);
      setIsAuthorized(false);
    }
  }, [walletConnected, walletAddress]);

  const handlePasswordVerification = async () => {
    if (!walletConnected || !adminType || !walletAddress) {
      alert("Please connect your admin wallet first");
      return;
    }

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          password: adminPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("adminToken", result.token);
        setIsAuthorized(true);
        loadAdminData();
        logAuditAction(
          "admin_login", 
          "system", 
          `${adminType === "founder" ? "Founder" : "White Label"} admin panel access granted`
        );
      } else {
        alert(result.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load system metrics
      const metricsResponse = await fetch("/api/admin/metrics");
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Load users
      const usersResponse = await fetch("/api/admin/users");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Load audit logs
      const logsResponse = await fetch("/api/admin/audit-logs");
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAuditLogs(logsData);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logAuditAction = async (action: string, target: string, details: string) => {
    try {
      await fetch("/api/admin/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          admin: walletAddress,
          target,
          details,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to log audit action:", error);
    }
  };

  const handleUserAction = async (userId: number, action: "suspend" | "activate" | "delete") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        loadAdminData();
        logAuditAction(`user_${action}`, `user_${userId}`, `User ${action} action performed`);
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const exportData = async (type: "users" | "domains" | "transactions") => {
    try {
      const response = await fetch(`/api/admin/export/${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        logAuditAction("data_export", type, `${type} data exported`);
      }
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cosmic-void via-deep-space to-quantum-blue">
        <Card className="w-full max-w-md glassmorphism border-white/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-cosmic-purple" />
            </div>
            <CardTitle className="text-2xl font-orbitron text-white">
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-white/80">
                This panel requires admin wallet connection and password verification.
              </AlertDescription>
            </Alert>

            {!walletConnected && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-white/80">
                  Please connect your admin wallet first.
                </AlertDescription>
              </Alert>
            )}

            {walletConnected && !adminType && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-white/80">
                  Connected wallet is not authorized for admin access.
                </AlertDescription>
              </Alert>
            )}

            {walletConnected && adminType && (
              <Alert className="border-meteor-green/50 bg-meteor-green/10 mb-4">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-white/80">
                  {adminType === "founder" 
                    ? "Founder/Developer admin access detected" 
                    : "White Label admin access detected"
                  }
                </AlertDescription>
              </Alert>
            )}

            {walletConnected && adminType && (
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    onKeyPress={(e) => e.key === "Enter" && handlePasswordVerification()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {adminPassword && (
                  <div className="text-xs space-y-1">
                    <div className="text-white/60">Password Requirements:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`${adminPassword.length >= 12 ? 'text-meteor-green' : 'text-red-400'}`}>
                        ✓ 12+ characters
                      </div>
                      <div className={`${/[A-Z]/.test(adminPassword) ? 'text-meteor-green' : 'text-red-400'}`}>
                        ✓ Uppercase
                      </div>
                      <div className={`${/[a-z]/.test(adminPassword) ? 'text-meteor-green' : 'text-red-400'}`}>
                        ✓ Lowercase
                      </div>
                      <div className={`${/\d/.test(adminPassword) ? 'text-meteor-green' : 'text-red-400'}`}>
                        ✓ Numbers
                      </div>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handlePasswordVerification}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cosmic-purple to-nebula-blue"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  {loading ? "Authenticating..." : "Access Admin Panel"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-void via-deep-space to-quantum-blue p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-cosmic-purple" />
            <h1 className="text-3xl font-orbitron font-bold text-white">
              NXD Admin Panel
            </h1>
            <div className="flex space-x-2">
              <Badge variant="outline" className="border-meteor-green text-meteor-green">
                Authorized
              </Badge>
              {adminType && (
                <Badge 
                  variant="outline" 
                  className={`${
                    adminType === "founder" 
                      ? "border-cosmic-purple text-cosmic-purple" 
                      : "border-nebula-blue text-nebula-blue"
                  }`}
                >
                  {adminType === "founder" ? "Founder Admin" : "White Label Admin"}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => loadAdminData()}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsAuthorized(false)}
              size="sm"
              variant="destructive"
            >
              <Lock className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glassmorphism border-white/20 grid w-full grid-cols-11">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 text-white">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20 text-white">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="whitelabel" className="data-[state=active]:bg-white/20 text-white">
              <Users className="w-4 h-4 mr-2" />
              White Label
            </TabsTrigger>
            <TabsTrigger value="tokens" className="data-[state=active]:bg-white/20 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="agentkit" className="data-[state=active]:bg-white/20 text-white">
              <Bot className="w-4 h-4 mr-2" />
              AgentKit
            </TabsTrigger>
            <TabsTrigger value="paymaster" className="data-[state=active]:bg-white/20 text-white">
              <Coins className="w-4 h-4 mr-2" />
              Paymaster
            </TabsTrigger>
            <TabsTrigger value="agglayer" className="data-[state=active]:bg-white/20 text-white">
              <Layers className="w-4 h-4 mr-2" />
              AggLayer
            </TabsTrigger>
            <TabsTrigger value="deployment" className="data-[state=active]:bg-white/20 text-white">
              <Database className="w-4 h-4 mr-2" />
              Deploy
            </TabsTrigger>
            <TabsTrigger value="auditor" className="data-[state=active]:bg-white/20 text-white">
              <Shield className="w-4 h-4 mr-2" />
              Auditor
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-white/20 text-white">
              <Database className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 text-white">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glassmorphism border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">Total Users</p>
                        <p className="text-2xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</p>
                      </div>
                      <Users className="w-8 h-8 text-cosmic-purple" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">Total Domains</p>
                        <p className="text-2xl font-bold text-white">{metrics.totalDomains.toLocaleString()}</p>
                      </div>
                      <Database className="w-8 h-8 text-nebula-blue" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">Transactions</p>
                        <p className="text-2xl font-bold text-white">{metrics.totalTransactions.toLocaleString()}</p>
                      </div>
                      <Activity className="w-8 h-8 text-meteor-green" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">System Health</p>
                        <p className="text-2xl font-bold text-white capitalize">{metrics.systemHealth}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full ${
                        metrics.systemHealth === "healthy" ? "bg-meteor-green" :
                        metrics.systemHealth === "warning" ? "bg-solar-orange" : "bg-red-500"
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">User Management</h2>
              <Button
                onClick={() => exportData("users")}
                size="sm"
                className="bg-cosmic-purple hover:bg-cosmic-purple/80"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Users
              </Button>
            </div>

            <Card className="glassmorphism border-white/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-white">{user.username}</h3>
                        <p className="text-sm text-white/60">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={user.status === "active" ? "default" : "destructive"}>
                            {user.status}
                          </Badge>
                          <span className="text-xs text-white/50">
                            {user.totalDomains} domains • ${user.totalSpent} spent
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {user.status === "active" ? (
                          <Button
                            onClick={() => handleUserAction(user.id, "suspend")}
                            size="sm"
                            variant="outline"
                            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleUserAction(user.id, "activate")}
                            size="sm"
                            variant="outline"
                            className="border-meteor-green text-meteor-green hover:bg-meteor-green/10"
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          onClick={() => handleUserAction(user.id, "delete")}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whitelabel" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">White Label Partner Management</h2>
              <Button
                onClick={() => exportData("partners")}
                size="sm"
                className="bg-cosmic-purple hover:bg-cosmic-purple/80"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Partners
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Total Partners</p>
                      <p className="text-2xl font-bold text-white">12</p>
                    </div>
                    <Users className="w-8 h-8 text-cosmic-purple" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Active Deployments</p>
                      <p className="text-2xl font-bold text-white">8</p>
                    </div>
                    <Database className="w-8 h-8 text-nebula-blue" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Partner Revenue</p>
                      <p className="text-2xl font-bold text-white">$3.6M</p>
                    </div>
                    <Activity className="w-8 h-8 text-meteor-green" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Revenue Distribution Model</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Founder/Developer (20%)</h4>
                    <p className="text-2xl font-bold text-cosmic-purple">$7.2M</p>
                    <p className="text-sm text-white/60">Fixed allocation</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">NXD LPs (50%)</h4>
                    <p className="text-2xl font-bold text-nebula-blue">$18M</p>
                    <p className="text-sm text-white/60">Liquidity providers</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Ecosystem/DAO (30%)</h4>
                    <p className="text-2xl font-bold text-meteor-green">$10.8M</p>
                    <p className="text-sm text-white/60">Treasury & grants</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <h4 className="font-semibold text-white mb-2">White Label Share (0-20%)</h4>
                  <p className="text-sm text-white/80">
                    Partners receive 10-20% of revenue they generate based on their tier and performance.
                    Current average: 15% • Total partner revenue: $3.6M
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <h2 className="text-xl font-semibold text-white">System Monitoring</h2>

            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glassmorphism border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Server Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/60">Uptime</span>
                      <span className="text-white">{metrics.serverUptime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Active Connections</span>
                      <span className="text-white">{metrics.activeConnections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Memory Usage</span>
                      <span className="text-white">{metrics.memoryUsage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">CPU Usage</span>
                      <span className="text-white">{metrics.cpuUsage}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => exportData("domains")}
                      className="w-full justify-start bg-white/10 hover:bg-white/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Domain Data
                    </Button>
                    <Button
                      onClick={() => exportData("transactions")}
                      className="w-full justify-start bg-white/10 hover:bg-white/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Transaction Data
                    </Button>
                    <Button
                      onClick={() => loadAdminData()}
                      className="w-full justify-start bg-white/10 hover:bg-white/20"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh All Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <TokenGenerator />
          </TabsContent>

          {/* AgentKit Tab */}
          <TabsContent value="agentkit" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    AI AgentKit Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">xAI Grok Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">OpenAI GPT-4 Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">Anthropic Claude Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">DeepSeek Status</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh AI Services
                  </Button>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Autonomous Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Domain Approvals</span>
                      <Button size="sm" variant="outline" className="border-white/20">
                        Configure
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Fee Adjustments</span>
                      <Button size="sm" variant="outline" className="border-white/20">
                        Configure
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Proposal Generation</span>
                      <Button size="sm" variant="outline" className="border-white/20">
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Paymaster Tab */}
          <TabsContent value="paymaster" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    NXD Paymaster System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">Paymaster Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">Gas Sponsorship Pool</span>
                      <span className="text-yellow-400">15,000 NXD</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">Transactions Sponsored</span>
                      <span className="text-white">2,847</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">Conversion Rate</span>
                      <span className="text-white">1 NXD = 0.0001 ETH gas</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500">
                    <Coins className="w-4 h-4 mr-2" />
                    Add Funds to Pool
                  </Button>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Gas Sponsorship Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="text-sm text-white/80 mb-2">Domain Registration</div>
                      <div className="text-green-400">✓ Fully Sponsored</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="text-sm text-white/80 mb-2">Staking Operations</div>
                      <div className="text-green-400">✓ 50% Sponsored</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="text-sm text-white/80 mb-2">Marketplace Trades</div>
                      <div className="text-yellow-400">⚡ 25% Sponsored</div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Rules
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AggLayer Tab */}
          <TabsContent value="agglayer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Polygon AggLayer Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">AggLayer Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">Cross-Chain Domains</span>
                      <span className="text-white">1,247</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">Bridge Transactions</span>
                      <span className="text-white">856</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <span className="text-white/80">Unified Liquidity</span>
                      <span className="text-purple-400">$2.4M TVL</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                    <Layers className="w-4 h-4 mr-2" />
                    Sync AggLayer State
                  </Button>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Multi-Chain Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/80">Ethereum Mainnet</span>
                        <Badge className="bg-blue-500/20 text-blue-400">Active</Badge>
                      </div>
                      <div className="text-sm text-white/60">2,847 domains</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/80">Polygon PoS</span>
                        <Badge className="bg-purple-500/20 text-purple-400">Active</Badge>
                      </div>
                      <div className="text-sm text-white/60">1,543 domains</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/80">Arbitrum One</span>
                        <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                      </div>
                      <div className="text-sm text-white/60">892 domains</div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Manage Chains
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-6">
            <DeploymentNetwork />
          </TabsContent>

          <TabsContent value="auditor" className="space-y-6">
            <AuditorSystem />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-xl font-semibold text-white">System Settings</h2>

            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-white/80">
                    Changing these settings may affect platform security. Proceed with caution.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => logAuditAction("security_scan", "system", "Manual security scan initiated")}
                    className="w-full justify-start bg-cosmic-purple hover:bg-cosmic-purple/80"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Run Security Scan
                  </Button>

                  <Button
                    onClick={() => logAuditAction("cache_clear", "system", "System cache cleared")}
                    className="w-full justify-start bg-white/10 hover:bg-white/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear System Cache
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