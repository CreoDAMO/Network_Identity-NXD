"""
Governance API Routes
Handles DAO proposals, voting, and governance operations
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import structlog

from services.blockchain_service import BlockchainService

logger = structlog.get_logger()
router = APIRouter(prefix="/api/governance", tags=["governance"])

class ProposalRequest(BaseModel):
    title: str
    description: str
    proposer: str
    actions: List[Dict[str, Any]] = []
    voting_duration: int = 7  # days

class VoteRequest(BaseModel):
    proposal_id: int
    voter: str
    support: bool  # True for yes, False for no
    reason: Optional[str] = None

class Proposal(BaseModel):
    id: int
    title: str
    description: str
    proposer: str
    status: str  # pending, active, passed, failed, executed
    votes_for: str
    votes_against: str
    created_at: str
    voting_ends_at: str
    execution_eta: Optional[str] = None

@router.get("/proposals", response_model=List[Proposal])
async def get_proposals(
    status: Optional[str] = None,
    limit: Optional[int] = 20
):
    """
    Get governance proposals
    """
    try:
        # Mock proposals data
        proposals = [
            {
                "id": 1,
                "title": "Increase Domain Registration Fees for Premium TLDs",
                "description": "Proposal to increase registration fees for premium TLDs to better reflect market value and support platform development.",
                "proposer": "0x1234567890123456789012345678901234567890",
                "status": "active",
                "votes_for": "15000000000000000000000000",  # 15M NXD
                "votes_against": "5000000000000000000000000",   # 5M NXD
                "created_at": "2025-07-01T00:00:00Z",
                "voting_ends_at": "2025-07-08T00:00:00Z",
                "execution_eta": None
            },
            {
                "id": 2,
                "title": "Add Support for New .ai TLD",
                "description": "Proposal to add support for .ai top-level domain with specialized pricing for AI-related projects.",
                "proposer": "0x2345678901234567890123456789012345678901",
                "status": "pending",
                "votes_for": "8000000000000000000000000",   # 8M NXD
                "votes_against": "2000000000000000000000000",  # 2M NXD
                "created_at": "2025-07-03T00:00:00Z",
                "voting_ends_at": "2025-07-10T00:00:00Z",
                "execution_eta": None
            }
        ]
        
        # Filter by status if provided
        if status:
            proposals = [p for p in proposals if p["status"] == status]
        
        return proposals[:limit] if limit else proposals
        
    except Exception as e:
        logger.error("Failed to get proposals", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve proposals")

@router.get("/proposals/{proposal_id}")
async def get_proposal(proposal_id: int):
    """
    Get specific proposal details
    """
    try:
        # Mock proposal detail
        proposal = {
            "id": proposal_id,
            "title": "Increase Domain Registration Fees for Premium TLDs",
            "description": "Detailed proposal to increase registration fees for premium TLDs...",
            "proposer": "0x1234567890123456789012345678901234567890",
            "status": "active",
            "votes_for": "15000000000000000000000000",
            "votes_against": "5000000000000000000000000",
            "created_at": "2025-07-01T00:00:00Z",
            "voting_ends_at": "2025-07-08T00:00:00Z",
            "actions": [
                {
                    "target": "0x...",
                    "value": "0",
                    "function": "setRegistrationFee",
                    "parameters": ["0.02"]
                }
            ],
            "voting_history": [
                {
                    "voter": "0x...",
                    "support": True,
                    "voting_power": "1000000000000000000000",
                    "timestamp": "2025-07-02T10:00:00Z"
                }
            ]
        }
        
        return proposal
        
    except Exception as e:
        logger.error("Failed to get proposal", proposal_id=proposal_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve proposal")

@router.post("/proposals")
async def create_proposal(
    request: ProposalRequest,
    blockchain_service: BlockchainService = Depends(lambda: BlockchainService())
):
    """
    Create a new governance proposal
    """
    try:
        tx_hash = await blockchain_service.create_governance_proposal(
            proposer=request.proposer,
            title=request.title,
            description=request.description,
            actions=request.actions
        )
        
        return {
            "proposal_id": hash(request.title) % 1000000,  # Mock ID
            "transaction_hash": tx_hash,
            "title": request.title,
            "proposer": request.proposer,
            "status": "pending"
        }
        
    except Exception as e:
        logger.error("Proposal creation failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Proposal creation failed: {str(e)}")

@router.post("/vote")
async def vote_on_proposal(
    request: VoteRequest,
    blockchain_service: BlockchainService = Depends(lambda: BlockchainService())
):
    """
    Vote on a governance proposal
    """
    try:
        # Mock voting power calculation (based on NXD holdings + staking)
        voting_power = 1000000000000000000000  # 1000 NXD
        
        tx_hash = await blockchain_service.vote_on_proposal(
            voter=request.voter,
            proposal_id=request.proposal_id,
            support=request.support,
            voting_power=voting_power
        )
        
        return {
            "transaction_hash": tx_hash,
            "proposal_id": request.proposal_id,
            "support": request.support,
            "voting_power": str(voting_power),
            "status": "pending"
        }
        
    except Exception as e:
        logger.error("Voting failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Voting failed: {str(e)}")

@router.get("/voting-power/{address}")
async def get_voting_power(address: str):
    """
    Get user's voting power
    """
    try:
        # Mock voting power calculation
        nxd_balance = "5000000000000000000000"   # 5000 NXD
        staked_balance = "3000000000000000000000" # 3000 NXD
        
        # Voting power = NXD balance + 1.5x staked balance
        base_power = int(nxd_balance)
        staked_power = int(float(staked_balance) * 1.5)
        total_power = base_power + staked_power
        
        return {
            "address": address,
            "nxd_balance": nxd_balance,
            "staked_balance": staked_balance,
            "voting_power": str(total_power),
            "voting_power_breakdown": {
                "from_balance": str(base_power),
                "from_staking": str(staked_power),
                "staking_multiplier": 1.5
            }
        }
        
    except Exception as e:
        logger.error("Failed to get voting power", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to calculate voting power")

@router.get("/user-votes/{address}")
async def get_user_votes(address: str):
    """
    Get user's voting history
    """
    try:
        # Mock voting history
        votes = [
            {
                "proposal_id": 1,
                "proposal_title": "Increase Domain Registration Fees",
                "support": True,
                "voting_power": "8000000000000000000000",
                "timestamp": "2025-07-02T10:00:00Z",
                "reason": "This will help fund platform development"
            },
            {
                "proposal_id": 2,
                "proposal_title": "Add Support for New .ai TLD",
                "support": True,
                "voting_power": "8000000000000000000000", 
                "timestamp": "2025-07-04T15:30:00Z",
                "reason": "AI domains are in high demand"
            }
        ]
        
        return {"votes": votes}
        
    except Exception as e:
        logger.error("Failed to get user votes", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve voting history")

@router.get("/stats")
async def get_governance_stats():
    """
    Get governance statistics
    """
    try:
        return {
            "total_proposals": 12,
            "active_proposals": 2,
            "passed_proposals": 8,
            "failed_proposals": 2,
            "total_voters": 450,
            "average_turnout": 0.35,  # 35% participation
            "total_voting_power": "100000000000000000000000000",  # 100M NXD
            "quorum_requirement": "10000000000000000000000000"     # 10M NXD
        }
        
    except Exception as e:
        logger.error("Failed to get governance stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve governance statistics")

@router.post("/execute/{proposal_id}")
async def execute_proposal(proposal_id: int):
    """
    Execute a passed proposal (admin only)
    """
    try:
        # Mock proposal execution
        tx_hash = f"0x{'execute':<56}"
        
        return {
            "proposal_id": proposal_id,
            "transaction_hash": tx_hash,
            "status": "executed",
            "execution_time": "2025-07-06T12:00:00Z"
        }
        
    except Exception as e:
        logger.error("Proposal execution failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to execute proposal")