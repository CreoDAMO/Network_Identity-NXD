
import { Request, Response, Router } from "express";
import crypto from "crypto";

const router = Router();

interface MessageRequest {
  domain_id: string;
  recipient: string;
  content: string;
  user_id: string;
}

interface VoiceCallRequest {
  domain_id: string;
  recipient: string;
  user_id: string;
}

interface DataTransferRequest {
  domain_id: string;
  file_path: string;
  user_id: string;
}

// Mock CST calculation (5.72% for Miami)
const calculateCST = (amount: number): number => {
  return amount * 0.0572;
};

// Mock IPFS client
const mockIPFS = {
  add: (data: string) => ({
    Hash: crypto.createHash('sha256').update(data).digest('hex')
  })
};

// Messaging service
router.post("/message", async (req: Request, res: Response) => {
  try {
    const { domain_id, recipient, content, user_id }: MessageRequest = req.body;
    
    // Calculate CST
    const serviceFee = 1.00;
    const cstAmount = calculateCST(serviceFee);
    
    // Store message on IPFS (mock)
    const ipfsHash = mockIPFS.add(content).Hash;
    
    // Mock blockchain transaction
    const txHash = crypto.randomBytes(32).toString('hex');
    
    // Store record in database (mock)
    const record = {
      user_id,
      domain_id,
      type: "message",
      data_hash: ipfsHash,
      timestamp: new Date(),
      cst_amount: cstAmount,
      tx_hash: txHash
    };
    
    res.json({ 
      status: "success", 
      message_id: ipfsHash, 
      tx_hash: txHash,
      cst_collected: cstAmount 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error });
  }
});

// Voice call service
router.post("/voice/call", async (req: Request, res: Response) => {
  try {
    const { domain_id, recipient, user_id }: VoiceCallRequest = req.body;
    
    const serviceFee = 2.00;
    const cstAmount = calculateCST(serviceFee);
    
    const callData = { caller: user_id, recipient, domain_id };
    const ipfsHash = mockIPFS.add(JSON.stringify(callData)).Hash;
    const txHash = crypto.randomBytes(32).toString('hex');
    
    const record = {
      user_id,
      domain_id,
      type: "voice",
      data_hash: ipfsHash,
      timestamp: new Date(),
      cst_amount: cstAmount,
      tx_hash: txHash
    };
    
    res.json({ 
      status: "success", 
      call_id: ipfsHash, 
      tx_hash: txHash,
      cst_collected: cstAmount 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to initiate call", error });
  }
});

// Data transfer service
router.post("/data/transfer", async (req: Request, res: Response) => {
  try {
    const { domain_id, file_path, user_id }: DataTransferRequest = req.body;
    
    const serviceFee = 1.50;
    const cstAmount = calculateCST(serviceFee);
    
    const ipfsHash = mockIPFS.add(file_path).Hash;
    const txHash = crypto.randomBytes(32).toString('hex');
    
    const record = {
      user_id,
      domain_id,
      type: "data",
      data_hash: ipfsHash,
      timestamp: new Date(),
      cst_amount: cstAmount,
      tx_hash: txHash
    };
    
    res.json({ 
      status: "success", 
      transfer_id: ipfsHash, 
      tx_hash: txHash,
      cst_collected: cstAmount 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to transfer data", error });
  }
});

export { router as communicationRouter };
