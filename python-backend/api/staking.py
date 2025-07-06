"""
Staking API Routes
Handles NXD token staking operations and rewards
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
import structlog

from services.blockchain_service import BlockchainService

logger = structlog.get_logger()
router = APIRouter(prefix="/api/staking", tags=["staking"])

class StakeRequest(BaseModel):
    amount: str  # Amount in NXD tokens (wei format)
    duration: int  # Duration in days
    user_address: str

class UnstakeRequest(BaseModel):
    stake_id: int
    user_address: str

class StakingPosition(BaseModel):
    id: int
    amount: str
    start_time: int
    duration: int
    apy: str
    rewards_earned: str
    status: str

@router.post("/stake")
async def stake_tokens(
    request: StakeRequest,
    background_tasks: BackgroundTasks,
    blockchain_service: BlockchainService = Depends(lambda: BlockchainService())
):
    """
    Stake NXD tokens for rewards
    """
    try:
        # Initiate staking transaction
        tx_hash = await blockchain_service.stake_nxd(
            user_address=request.user_address,
            amount=int(request.amount),
            duration=request.duration
        )
        
        return {
            "transaction_hash": tx_hash,
            "amount": request.amount,
            "duration": request.duration,
            "estimated_apy": "18.5%",
            "status": "pending"
        }
        
    except Exception as e:
        logger.error("Staking failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Staking failed: {str(e)}")

@router.post("/unstake")
async def unstake_tokens(
    request: UnstakeRequest,
    blockchain_service: BlockchainService = Depends(lambda: BlockchainService())
):
    """
    Unstake NXD tokens and claim rewards
    """
    try:
        tx_hash = await blockchain_service.unstake_nxd(
            user_address=request.user_address,
            stake_id=request.stake_id
        )
        
        return {
            "transaction_hash": tx_hash,
            "stake_id": request.stake_id,
            "status": "pending"
        }
        
    except Exception as e:
        logger.error("Unstaking failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Unstaking failed: {str(e)}")

@router.get("/positions/{address}")
async def get_staking_positions(
    address: str,
    blockchain_service: BlockchainService = Depends(lambda: BlockchainService())
):
    """
    Get user's staking positions
    """
    try:
        staking_info = await blockchain_service.get_staking_info(address)
        return staking_info
        
    except Exception as e:
        logger.error("Failed to get staking positions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve staking positions")

@router.get("/stats")
async def get_staking_stats():
    """
    Get global staking statistics
    """
    try:
        # Mock staking stats - in production, calculate from blockchain data
        return {
            "totalStaked": "500000000000000000000000",  # 500k NXD
            "currentApy": "18.5",
            "poolUtilization": 0.65,
            "nextRewardTime": "2025-07-07T00:00:00Z",
            "totalStakers": 1250,
            "averageStakeDuration": 120  # days
        }
        
    except Exception as e:
        logger.error("Failed to get staking stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve staking statistics")

@router.get("/rewards/{address}")
async def get_pending_rewards(address: str):
    """
    Get pending staking rewards for user
    """
    try:
        # Mock rewards calculation
        return {
            "pending_rewards": "25000000000000000000",  # 25 NXD
            "last_claim": "2025-07-01T00:00:00Z",
            "next_distribution": "2025-07-07T00:00:00Z",
            "total_earned": "150000000000000000000"  # 150 NXD
        }
        
    except Exception as e:
        logger.error("Failed to get rewards", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve rewards")

@router.post("/claim-rewards")
async def claim_rewards(
    address: str,
    blockchain_service: BlockchainService = Depends(lambda: BlockchainService())
):
    """
    Claim pending staking rewards
    """
    try:
        # Mock reward claiming
        tx_hash = f"0x{'claim':<58}"
        
        return {
            "transaction_hash": tx_hash,
            "rewards_claimed": "25000000000000000000",  # 25 NXD
            "status": "pending"
        }
        
    except Exception as e:
        logger.error("Reward claiming failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to claim rewards")