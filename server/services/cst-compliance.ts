
import { Request, Response, Router } from "express";
import crypto from "crypto";

const router = Router();

interface TaxRecord {
  service_type: string;
  amount: number;
  cst_amount: number;
  user_id: string;
  domain_id: string;
  timestamp: Date;
  tx_hash: string;
}

// Mock tax records storage
const taxRecords: TaxRecord[] = [];

// Miami CST rate (5.72%)
const CST_RATE = 0.0572;

// Calculate CST
router.post("/calculate", async (req: Request, res: Response) => {
  try {
    const { amount, service_type, location } = req.body;
    
    // Check if location is Miami, FL
    const isMiami = location?.city?.toLowerCase() === "miami" && 
                   location?.state?.toLowerCase() === "fl";
    
    const cstAmount = isMiami ? amount * CST_RATE : 0;
    
    res.json({
      amount,
      cst_rate: isMiami ? CST_RATE : 0,
      cst_amount: cstAmount,
      total: amount + cstAmount,
      applicable: isMiami
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to calculate CST", error });
  }
});

// Record tax collection
router.post("/record", async (req: Request, res: Response) => {
  try {
    const { service_type, amount, user_id, domain_id } = req.body;
    
    const cstAmount = amount * CST_RATE;
    const txHash = crypto.randomBytes(32).toString('hex');
    
    const record: TaxRecord = {
      service_type,
      amount,
      cst_amount: cstAmount,
      user_id,
      domain_id,
      timestamp: new Date(),
      tx_hash: txHash
    };
    
    taxRecords.push(record);
    
    res.json({
      status: "success",
      record_id: txHash,
      cst_collected: cstAmount
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to record tax", error });
  }
});

// Get tax summary
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    let filteredRecords = taxRecords;
    
    if (start_date || end_date) {
      const startDate = start_date ? new Date(start_date as string) : new Date(0);
      const endDate = end_date ? new Date(end_date as string) : new Date();
      
      filteredRecords = taxRecords.filter(record => 
        record.timestamp >= startDate && record.timestamp <= endDate
      );
    }
    
    const summary = {
      total_records: filteredRecords.length,
      total_revenue: filteredRecords.reduce((sum, record) => sum + record.amount, 0),
      total_cst: filteredRecords.reduce((sum, record) => sum + record.cst_amount, 0),
      by_service: {} as Record<string, any>
    };
    
    // Group by service type
    filteredRecords.forEach(record => {
      if (!summary.by_service[record.service_type]) {
        summary.by_service[record.service_type] = {
          count: 0,
          revenue: 0,
          cst: 0
        };
      }
      summary.by_service[record.service_type].count++;
      summary.by_service[record.service_type].revenue += record.amount;
      summary.by_service[record.service_type].cst += record.cst_amount;
    });
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Failed to get tax summary", error });
  }
});

// Remit CST (admin only)
router.post("/remit", async (req: Request, res: Response) => {
  try {
    const { admin_id, period } = req.body;
    
    // Mock admin check
    if (admin_id !== process.env.ADMIN_ADDRESS) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const totalCst = taxRecords.reduce((sum, record) => sum + record.cst_amount, 0);
    const totalRecords = taxRecords.length;
    
    // Mock remittance to Florida Department of Revenue
    const remittanceId = crypto.randomBytes(16).toString('hex');
    const auditHash = crypto.randomBytes(32).toString('hex');
    
    const remittance = {
      remittance_id: remittanceId,
      period,
      total_cst: totalCst,
      total_records: totalRecords,
      submitted_at: new Date(),
      audit_hash: auditHash,
      status: "submitted"
    };
    
    res.json({
      status: "success",
      remittance,
      message: `Remitted $${totalCst.toFixed(2)} CST for ${totalRecords} transactions`
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to remit CST", error });
  }
});

export { router as cstRouter };
