
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Server, 
  Globe, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Upload,
  Download,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface DeploymentStatus {
  id: string;
  service: string;
  version: string;
  status: 'running' | 'stopped' | 'error' | 'deploying';
  environment: 'production' | 'staging' | 'development';
  lastUpdated: string;
  health: 'healthy' | 'warning' | 'critical';
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
}

interface DeploymentLog {
  id: string;
  timestamp: string;
  service: string;
  action: string;
  status: 'success' | 'error' | 'in_progress';
  message: string;
  version?: string;
}

export function DeploymentNetwork() {
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<'production' | 'staging' | 'development'>('production');

  useEffect(() => {
    loadDeploymentData();
    const interval = setInterval(loadDeploymentData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedEnvironment]);

  const loadDeploymentData = async () => {
    setLoading(true);
    try {
      const [deploymentsRes, logsRes] = await Promise.all([
        fetch(`/api/admin/deployments?env=${selectedEnvironment}`),
        fetch(`/api/admin/deployment-logs?env=${selectedEnvironment}&limit=20`)
      ]);

      if (deploymentsRes.ok) {
        const deploymentData = await deploymentsRes.json();
        setDeployments(deploymentData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Failed to load deployment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = async (serviceId: string, action: 'start' | 'stop' | 'restart' | 'deploy') => {
    try {
      const response = await fetch(`/api/admin/deployments/${serviceId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: selectedEnvironment })
      });

      if (response.ok) {
        loadDeploymentData();
      }
    } catch (error) {
      console.error(`Failed to ${action} service:`, error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="w-4 h-4 text-meteor-green" />;
      case 'stopped': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'deploying': return <RefreshCw className="w-4 h-4 text-cosmic-purple animate-spin" />;
      default: return <Activity className="w-4 h-4 text-white/60" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-meteor-green';
      case 'warning': return 'text-solar-orange';
      case 'critical': return 'text-red-500';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Deployment Network</h2>
        <div className="flex items-center space-x-3">
          <select 
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value as any)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
          <Button 
            onClick={loadDeploymentData}
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Environment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Services</p>
                <p className="text-2xl font-bold text-white">{deployments.length}</p>
              </div>
              <Server className="w-6 h-6 text-cosmic-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Running</p>
                <p className="text-2xl font-bold text-meteor-green">
                  {deployments.filter(d => d.status === 'running').length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-meteor-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Issues</p>
                <p className="text-2xl font-bold text-red-500">
                  {deployments.filter(d => d.status === 'error' || d.health === 'critical').length}
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
                <p className="text-sm text-white/60">Deploying</p>
                <p className="text-2xl font-bold text-cosmic-purple">
                  {deployments.filter(d => d.status === 'deploying').length}
                </p>
              </div>
              <Upload className="w-6 h-6 text-cosmic-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(deployment.status)}
                  <div>
                    <h3 className="font-semibold text-white">{deployment.service}</h3>
                    <p className="text-sm text-white/60">v{deployment.version} • {deployment.uptime}</p>
                  </div>
                  <Badge 
                    variant={deployment.status === 'running' ? 'default' : 'destructive'}
                    className="capitalize"
                  >
                    {deployment.status}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${getHealthColor(deployment.health)}`}
                  >
                    {deployment.health}
                  </Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <p className="text-white/60">CPU: {deployment.cpuUsage}%</p>
                    <p className="text-white/60">Memory: {deployment.memoryUsage}%</p>
                  </div>
                  <div className="flex space-x-2">
                    {deployment.status === 'running' ? (
                      <>
                        <Button
                          onClick={() => handleServiceAction(deployment.id, 'restart')}
                          size="sm"
                          variant="outline"
                          className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleServiceAction(deployment.id, 'stop')}
                          size="sm"
                          variant="destructive"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleServiceAction(deployment.id, 'start')}
                        size="sm"
                        className="bg-meteor-green hover:bg-meteor-green/80"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleServiceAction(deployment.id, 'deploy')}
                      size="sm"
                      variant="outline"
                      className="border-cosmic-purple text-cosmic-purple hover:bg-cosmic-purple/10"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Logs */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Deployment Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  log.status === 'success' ? 'bg-meteor-green' :
                  log.status === 'error' ? 'bg-red-500' : 'bg-cosmic-purple'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{log.service}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    {log.version && (
                      <span className="text-xs text-white/60">v{log.version}</span>
                    )}
                  </div>
                  <p className="text-sm text-white/80">{log.message}</p>
                </div>
                <span className="text-xs text-white/50">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
