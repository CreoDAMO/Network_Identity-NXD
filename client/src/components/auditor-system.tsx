
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  Search, 
  ExternalLink, 
  Download, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  Zap
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blockchain_hash?: string;
  ipfs_hash?: string;
  ai_analysis?: {
    risk_score: number;
    anomaly_detected: boolean;
    recommendations: string[];
  };
}

interface AIAuditReport {
  id: string;
  timestamp: string;
  scan_type: 'deployment' | 'transaction' | 'access' | 'performance';
  findings: {
    anomalies: number;
    warnings: number;
    recommendations: string[];
  };
  risk_assessment: 'low' | 'medium' | 'high' | 'critical';
  automated_actions: string[];
}

export function AuditorSystem() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiReports, setAiReports] = useState<AIAuditReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    loadAuditData();
    const interval = setInterval(loadAuditData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [logsRes, reportsRes] = await Promise.all([
        fetch(`/api/admin/audit-logs?timeRange=${selectedTimeRange}&limit=100`),
        fetch(`/api/admin/ai-audit-reports?timeRange=${selectedTimeRange}&limit=20`)
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setAiReports(reportsData);
      }
    } catch (error) {
      console.error('Failed to load audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAIScan = async (scanType: string) => {
    try {
      const response = await fetch('/api/admin/trigger-ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_type: scanType })
      });

      if (response.ok) {
        loadAuditData();
      }
    } catch (error) {
      console.error('Failed to trigger AI scan:', error);
    }
  };

  const exportAuditData = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/admin/export-audit-logs?format=${format}&timeRange=${selectedTimeRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to export audit data:', error);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.target.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 border-red-500';
      case 'high': return 'text-orange-500 border-orange-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      case 'low': return 'text-meteor-green border-meteor-green';
      default: return 'text-white/60 border-white/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/20 border-red-500/50 text-red-300';
      case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-300';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      case 'low': return 'bg-meteor-green/20 border-meteor-green/50 text-meteor-green';
      default: return 'bg-white/5 border-white/20 text-white/60';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-cosmic-purple" />
          <h2 className="text-2xl font-bold text-white">Auditor System</h2>
          <Badge variant="outline" className="border-meteor-green text-meteor-green">
            Real-time Monitoring
          </Badge>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => triggerAIScan('full')}
            size="sm"
            className="bg-cosmic-purple hover:bg-cosmic-purple/80"
          >
            <Zap className="w-4 h-4 mr-2" />
            AI Scan
          </Button>
          <Button
            onClick={() => exportAuditData('csv')}
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Logs</p>
                <p className="text-2xl font-bold text-white">{auditLogs.length}</p>
              </div>
              <FileText className="w-6 h-6 text-cosmic-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Critical Issues</p>
                <p className="text-2xl font-bold text-red-500">
                  {auditLogs.filter(log => log.severity === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">AI Anomalies</p>
                <p className="text-2xl font-bold text-solar-orange">
                  {auditLogs.filter(log => log.ai_analysis?.anomaly_detected).length}
                </p>
              </div>
              <Eye className="w-6 h-6 text-solar-orange" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">On-Chain Logs</p>
                <p className="text-2xl font-bold text-meteor-green">
                  {auditLogs.filter(log => log.blockchain_hash).length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-meteor-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glassmorphism border-white/20">
          <TabsTrigger value="logs" className="data-[state=active]:bg-white/20">
            <FileText className="w-4 h-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="ai-reports" className="data-[state=active]:bg-white/20">
            <Zap className="w-4 h-4 mr-2" />
            AI Reports
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="data-[state=active]:bg-white/20">
            <ExternalLink className="w-4 h-4 mr-2" />
            On-Chain Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card className="glassmorphism border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card className="glassmorphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-white/5 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(log.severity)}
                        >
                          {log.severity.toUpperCase()}
                        </Badge>
                        <span className="text-white font-medium">{log.action}</span>
                        {log.ai_analysis?.anomaly_detected && (
                          <Badge variant="destructive" className="text-xs">
                            AI Anomaly
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-white/50">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Actor: </span>
                        <span className="text-white">{log.actor}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Target: </span>
                        <span className="text-white">{log.target}</span>
                      </div>
                    </div>

                    <p className="text-white/80 text-sm">{log.details}</p>

                    {log.ai_analysis && (
                      <div className="bg-cosmic-purple/20 p-3 rounded-lg border border-cosmic-purple/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-cosmic-purple font-medium">AI Analysis</span>
                          <Badge variant="outline" className="text-cosmic-purple border-cosmic-purple">
                            Risk Score: {log.ai_analysis.risk_score}/100
                          </Badge>
                        </div>
                        {log.ai_analysis.recommendations.length > 0 && (
                          <ul className="text-sm text-white/80 space-y-1">
                            {log.ai_analysis.recommendations.map((rec, idx) => (
                              <li key={idx}>• {rec}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs">
                      {log.blockchain_hash && (
                        <a
                          href={`https://etherscan.io/tx/${log.blockchain_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-meteor-green hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View on Etherscan</span>
                        </a>
                      )}
                      {log.ipfs_hash && (
                        <a
                          href={`https://ipfs.io/ipfs/${log.ipfs_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-nebula-blue hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View on IPFS</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-reports" className="space-y-6">
          <Card className="glassmorphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">AI Security Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiReports.map((report) => (
                  <div key={report.id} className={`p-4 rounded-lg border ${getRiskColor(report.risk_assessment)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="capitalize">
                          {report.scan_type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${getSeverityColor(report.risk_assessment)}`}
                        >
                          {report.risk_assessment} Risk
                        </Badge>
                      </div>
                      <span className="text-xs opacity-75">
                        {new Date(report.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-lg font-bold">{report.findings.anomalies}</p>
                        <p className="text-xs opacity-75">Anomalies</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{report.findings.warnings}</p>
                        <p className="text-xs opacity-75">Warnings</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{report.automated_actions.length}</p>
                        <p className="text-xs opacity-75">Auto Actions</p>
                      </div>
                    </div>

                    {report.findings.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Recommendations:</p>
                        <ul className="text-sm space-y-1 opacity-90">
                          {report.findings.recommendations.map((rec, idx) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <Card className="glassmorphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">On-Chain Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-meteor-green/50 bg-meteor-green/10 mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-white/80">
                  All critical actions are automatically logged to Ethereum blockchain for immutable audit trail.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                {auditLogs
                  .filter(log => log.blockchain_hash)
                  .slice(0, 10)
                  .map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{log.action}</p>
                        <p className="text-xs text-white/60">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={`https://etherscan.io/tx/${log.blockchain_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-meteor-green hover:underline"
                      >
                        <span className="text-sm">View Transaction</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
