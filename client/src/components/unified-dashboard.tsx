
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Satellite, 
  HardDrive, 
  Radio,
  Zap,
  Globe,
  Activity,
  DollarSign
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ServiceMetrics {
  communication: {
    messages_sent: number;
    calls_made: number;
    data_transferred: number;
  };
  satellite: {
    telemetry_processed: number;
    payload_configs: number;
    satellites_managed: number;
  };
  iot: {
    devices_registered: number;
    data_points: number;
    active_devices: number;
  };
  cst: {
    total_collected: number;
    total_remitted: number;
    rate: number;
  };
}

export const UnifiedDashboard: React.FC = () => {
  const { address } = useAccount();
  const [serviceType, setServiceType] = useState('communication');
  const [domainId, setDomainId] = useState('');
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  
  // Communication fields
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  
  // Satellite fields
  const [telemetryData, setTelemetryData] = useState('');
  const [beamConfig, setBeamConfig] = useState('');
  
  // IoT fields
  const [deviceId, setDeviceId] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [iotData, setIotData] = useState('');

  useEffect(() => {
    // Mock metrics data
    setMetrics({
      communication: {
        messages_sent: 1247,
        calls_made: 89,
        data_transferred: 523
      },
      satellite: {
        telemetry_processed: 156,
        payload_configs: 12,
        satellites_managed: 3
      },
      iot: {
        devices_registered: 78,
        data_points: 15420,
        active_devices: 65
      },
      cst: {
        total_collected: 1456.78,
        total_remitted: 1200.00,
        rate: 5.72
      }
    });
  }, []);

  const handleCommunicationAction = async (action: string) => {
    try {
      let endpoint = '';
      let body = {};
      
      if (action === 'message') {
        endpoint = '/api/communication/message';
        body = { domain_id: domainId, recipient, content, user_id: address };
      } else if (action === 'voice') {
        endpoint = '/api/communication/voice/call';
        body = { domain_id: domainId, recipient, user_id: address };
      } else if (action === 'data') {
        endpoint = '/api/communication/data/transfer';
        body = { domain_id: domainId, file_path: content, user_id: address };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      toast.success(`${action} action successful - CST: $${result.cst_collected?.toFixed(2)}`);
    } catch (error) {
      toast.error(`Failed to perform ${action} action`);
    }
  };

  const handleSatelliteAction = async (action: string) => {
    try {
      let endpoint = '';
      let body = {};
      
      if (action === 'telemetry') {
        endpoint = '/api/satellite/telemetry';
        body = { 
          domain_id: domainId, 
          telemetry_data: JSON.parse(telemetryData || '{}'), 
          user_id: address 
        };
      } else if (action === 'configure') {
        endpoint = '/api/satellite/payload/configure';
        body = { 
          domain_id: domainId, 
          beam_config: beamConfig.split(',').map(Number), 
          user_id: address 
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      toast.success(`Satellite ${action} successful - CST: $${result.cst_collected?.toFixed(2)}`);
    } catch (error) {
      toast.error(`Failed to perform satellite ${action}`);
    }
  };

  const handleIoTAction = async (action: string) => {
    try {
      let endpoint = '';
      let body = {};
      
      if (action === 'register') {
        endpoint = '/api/iot/device/register';
        body = { 
          domain_id: domainId, 
          device_id: deviceId, 
          device_type: deviceType,
          user_id: address 
        };
      } else if (action === 'publish') {
        endpoint = '/api/iot/publish';
        body = { 
          domain_id: domainId, 
          device_id: deviceId, 
          data: JSON.parse(iotData || '{}'), 
          user_id: address 
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      toast.success(`IoT ${action} successful - CST: $${result.cst_collected?.toFixed(2)}`);
    } catch (error) {
      toast.error(`Failed to perform IoT ${action}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto space-y-6"
    >
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Communication</h3>
                <p className="text-purple-300">{metrics.communication.messages_sent} messages</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center space-x-3">
              <Satellite className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Satellites</h3>
                <p className="text-blue-300">{metrics.satellite.satellites_managed} managed</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center space-x-3">
              <Radio className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-lg font-bold text-white">IoT Devices</h3>
                <p className="text-green-300">{metrics.iot.active_devices} active</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-orange-400" />
              <div>
                <h3 className="text-lg font-bold text-white">CST Collected</h3>
                <p className="text-orange-300">${metrics.cst.total_collected.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Service Management */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <HardDrive className="w-6 h-6 text-purple-400" />
          <span>Unified Services Dashboard</span>
        </h2>
        
        <div className="mb-4">
          <Input
            type="text"
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            placeholder="Domain ID (e.g., example.nxd)"
            className="bg-black/30 border-white/20 text-white placeholder-white/60"
          />
        </div>

        <Tabs value={serviceType} onValueChange={setServiceType}>
          <TabsList className="grid w-full grid-cols-3 bg-black/30">
            <TabsTrigger value="communication" className="text-white">Communication</TabsTrigger>
            <TabsTrigger value="satellite" className="text-white">Satellite</TabsTrigger>
            <TabsTrigger value="iot" className="text-white">IoT</TabsTrigger>
          </TabsList>
          
          <TabsContent value="communication" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Recipient Address"
                className="bg-black/30 border-white/20 text-white placeholder-white/60"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content/File Path"
                className="bg-black/30 border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => handleCommunicationAction('message')} className="bg-purple-600">
                Send Message
              </Button>
              <Button onClick={() => handleCommunicationAction('voice')} className="bg-blue-600">
                Start Voice Call
              </Button>
              <Button onClick={() => handleCommunicationAction('data')} className="bg-green-600">
                Transfer Data
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="satellite" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                value={telemetryData}
                onChange={(e) => setTelemetryData(e.target.value)}
                placeholder="Telemetry Data (JSON)"
                className="bg-black/30 border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60"
              />
              <Input
                type="text"
                value={beamConfig}
                onChange={(e) => setBeamConfig(e.target.value)}
                placeholder="Beam Config (8 comma-separated values)"
                className="bg-black/30 border-white/20 text-white placeholder-white/60"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => handleSatelliteAction('telemetry')} className="bg-blue-600">
                Process Telemetry
              </Button>
              <Button onClick={() => handleSatelliteAction('configure')} className="bg-cyan-600">
                Configure Payload
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="iot" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Device ID"
                className="bg-black/30 border-white/20 text-white placeholder-white/60"
              />
              <Input
                type="text"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                placeholder="Device Type"
                className="bg-black/30 border-white/20 text-white placeholder-white/60"
              />
              <textarea
                value={iotData}
                onChange={(e) => setIotData(e.target.value)}
                placeholder="IoT Data (JSON)"
                className="bg-black/30 border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => handleIoTAction('register')} className="bg-green-600">
                Register Device
              </Button>
              <Button onClick={() => handleIoTAction('publish')} className="bg-emerald-600">
                Publish Data
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
};

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Satellite, 
  Wifi, 
  Shield, 
  TrendingUp, 
  Users, 
  Activity,
  Globe,
  Zap
} from "lucide-react";

interface ServiceMetrics {
  communication: {
    status: string;
    connections: number;
  };
  satellite: {
    status: string;
    satellites: number;
    coverage: string;
    latency: string;
  };
  iot: {
    totalDevices: number;
    activeDevices: number;
    status: string;
  };
  cst: {
    compliant: boolean;
    taxRate: number;
    jurisdiction: string;
  };
}

export function UnifiedDashboard() {
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [commRes, satRes, iotRes, cstRes] = await Promise.all([
          fetch("/api/communication/status"),
          fetch("/api/satellite/status"),
          fetch("/api/iot/devices"),
          fetch("/api/cst/compliance")
        ]);

        const metrics: ServiceMetrics = {
          communication: await commRes.json(),
          satellite: await satRes.json(),
          iot: await iotRes.json(),
          cst: await cstRes.json()
        };

        setMetrics(metrics);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cosmic-void via-deep-space to-quantum-blue flex items-center justify-center">
        <div className="text-white text-xl">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-void via-deep-space to-quantum-blue p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-orbitron font-bold text-white">
            NXD Services Dashboard
          </h1>
          <Badge variant="outline" className="border-meteor-green text-meteor-green">
            All Systems Operational
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glassmorphism border-white/20">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="satellite">Satellite</TabsTrigger>
            <TabsTrigger value="iot">IoT</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Communication</p>
                      <p className="text-2xl font-bold text-white">
                        {metrics?.communication.connections}
                      </p>
                      <p className="text-xs text-white/50">Active Connections</p>
                    </div>
                    <Wifi className="w-8 h-8 text-cosmic-purple" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Satellites</p>
                      <p className="text-2xl font-bold text-white">
                        {metrics?.satellite.satellites}
                      </p>
                      <p className="text-xs text-white/50">{metrics?.satellite.coverage} Coverage</p>
                    </div>
                    <Satellite className="w-8 h-8 text-nebula-blue" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">IoT Devices</p>
                      <p className="text-2xl font-bold text-white">
                        {metrics?.iot.activeDevices}
                      </p>
                      <p className="text-xs text-white/50">of {metrics?.iot.totalDevices} total</p>
                    </div>
                    <Zap className="w-8 h-8 text-meteor-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Tax Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {metrics?.cst.taxRate}%
                      </p>
                      <p className="text-xs text-white/50">CST Compliant</p>
                    </div>
                    <Shield className="w-8 h-8 text-solar-orange" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Communication Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Status</span>
                    <Badge variant="default" className="bg-meteor-green">
                      {metrics?.communication.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Active Connections</span>
                    <span className="text-white">{metrics?.communication.connections}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="satellite">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Satellite Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Status</span>
                    <Badge variant="default" className="bg-meteor-green">
                      {metrics?.satellite.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Satellites Online</span>
                    <span className="text-white">{metrics?.satellite.satellites}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Coverage</span>
                    <span className="text-white">{metrics?.satellite.coverage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Latency</span>
                    <span className="text-white">{metrics?.satellite.latency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iot">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">IoT Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Status</span>
                    <Badge variant="default" className="bg-meteor-green">
                      {metrics?.iot.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Total Devices</span>
                    <span className="text-white">{metrics?.iot.totalDevices}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Active Devices</span>
                    <span className="text-white">{metrics?.iot.activeDevices}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">CST Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Compliance Status</span>
                    <Badge variant="default" className="bg-meteor-green">
                      {metrics?.cst.compliant ? "Compliant" : "Non-Compliant"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Tax Rate</span>
                    <span className="text-white">{metrics?.cst.taxRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Jurisdiction</span>
                    <span className="text-white">{metrics?.cst.jurisdiction}</span>
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

export default UnifiedDashboard;
