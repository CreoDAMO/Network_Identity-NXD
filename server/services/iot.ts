
import { Request, Response, Router } from "express";
import crypto from "crypto";

const router = Router();

interface IoTRequest {
  domain_id: string;
  device_id: string;
  data: any;
  user_id: string;
}

interface DeviceRegistrationRequest {
  domain_id: string;
  device_id: string;
  device_type: string;
  user_id: string;
}

// Mock CST calculation
const calculateCST = (amount: number): number => {
  return amount * 0.0572;
};

// Mock IPFS client
const mockIPFS = {
  add: (data: string) => ({
    Hash: crypto.createHash('sha256').update(data).digest('hex')
  })
};

// Mock device registry
const deviceRegistry = new Map<string, any>();

// Publish IoT data
router.post("/publish", async (req: Request, res: Response) => {
  try {
    const { domain_id, device_id, data, user_id }: IoTRequest = req.body;
    
    // Check if device is registered
    const deviceKey = `${domain_id}:${device_id}`;
    if (!deviceRegistry.has(deviceKey)) {
      return res.status(404).json({ message: "Device not registered" });
    }
    
    const serviceFee = 0.50;
    const cstAmount = calculateCST(serviceFee);
    
    // Store data on IPFS
    const ipfsHash = mockIPFS.add(JSON.stringify(data)).Hash;
    const txHash = crypto.randomBytes(32).toString('hex');
    
    // MQTT publish (mock)
    const mqttTopic = `nxd/${domain_id}/${device_id}`;
    
    // AI analysis of IoT data (mock)
    const analysis = {
      data_quality: "good",
      anomalies_detected: false,
      predictions: ["Normal operation expected"],
      alerts: []
    };
    
    const record = {
      user_id,
      domain_id,
      device_id,
      type: "iot_data",
      data_hash: ipfsHash,
      timestamp: new Date(),
      cst_amount: cstAmount,
      tx_hash: txHash,
      mqtt_topic: mqttTopic,
      analysis
    };
    
    res.json({ 
      status: "success", 
      data_id: ipfsHash, 
      tx_hash: txHash,
      cst_collected: cstAmount,
      mqtt_topic: mqttTopic,
      analysis 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to publish IoT data", error });
  }
});

// Register IoT device
router.post("/device/register", async (req: Request, res: Response) => {
  try {
    const { domain_id, device_id, device_type, user_id }: DeviceRegistrationRequest = req.body;
    
    const serviceFee = 2.00;
    const cstAmount = calculateCST(serviceFee);
    
    const deviceKey = `${domain_id}:${device_id}`;
    const deviceInfo = {
      domain_id,
      device_id,
      device_type,
      owner: user_id,
      registered_at: new Date(),
      status: "active"
    };
    
    deviceRegistry.set(deviceKey, deviceInfo);
    
    const txHash = crypto.randomBytes(32).toString('hex');
    
    res.json({ 
      status: "success", 
      device_key: deviceKey,
      tx_hash: txHash,
      cst_collected: cstAmount,
      device_info: deviceInfo 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to register device", error });
  }
});

// Get device status
router.get("/device/:domain_id/:device_id", async (req: Request, res: Response) => {
  try {
    const { domain_id, device_id } = req.params;
    const deviceKey = `${domain_id}:${device_id}`;
    
    const device = deviceRegistry.get(deviceKey);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    // Mock device metrics
    const metrics = {
      ...device,
      last_seen: new Date(),
      battery_level: Math.floor(Math.random() * 100),
      signal_strength: Math.floor(Math.random() * 100),
      data_points_today: Math.floor(Math.random() * 1000),
      uptime: "99.5%"
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: "Failed to get device status", error });
  }
});

// List devices for domain
router.get("/devices/:domain_id", async (req: Request, res: Response) => {
  try {
    const { domain_id } = req.params;
    
    const domainDevices = Array.from(deviceRegistry.entries())
      .filter(([key, device]) => device.domain_id === domain_id)
      .map(([key, device]) => ({
        ...device,
        device_key: key,
        last_seen: new Date(),
        status: "online"
      }));
    
    res.json({ devices: domainDevices, count: domainDevices.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to list devices", error });
  }
});

export { router as iotRouter };
