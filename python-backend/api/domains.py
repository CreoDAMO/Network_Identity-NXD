"""
Domain Management API Routes
Handles domain registration, search, and management operations
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel, validator
import structlog

from core.database import get_db
from services.domain_service import DomainService
from services.blockchain_service import BlockchainService
from services.ai_gateway import AIGateway

logger = structlog.get_logger()
router = APIRouter(prefix="/api/domains", tags=["domains"])

# Request/Response Models
class DomainSearchRequest(BaseModel):
    query: str
    tlds: Optional[List[str]] = ["nxd"]
    max_results: Optional[int] = 10

class DomainRegistrationRequest(BaseModel):
    name: str
    tld: str
    duration_years: int = 1
    payment_token: str = "ETH"  # ETH or NXD
    ipfs_content: Optional[str] = None
    auto_renew: Optional[bool] = False

class DomainResponse(BaseModel):
    id: int
    full_domain: str
    name: str
    tld: str
    owner_address: str
    registration_date: str
    expiry_date: str
    ipfs_hash: Optional[str]
    is_premium: bool
    price_eth: str
    price_nxd: str

class DomainSuggestion(BaseModel):
    name: str
    tld: str
    full_domain: str
    available: bool
    price_eth: str
    price_nxd: str
    ai_score: float
    category: str

@router.get("/search", response_model=List[DomainSuggestion])
async def search_domains(
    query: str,
    tlds: Optional[str] = "nxd",
    max_results: Optional[int] = 10,
    domain_service: DomainService = Depends(lambda: DomainService()),
    ai_gateway: AIGateway = Depends(lambda: AIGateway())
):
    """
    Search for available domains with AI-powered suggestions
    """
    try:
        tld_list = tlds.split(",") if tlds else ["nxd"]
        
        # Get availability and pricing
        suggestions = await domain_service.search_domains(
            query=query,
            tlds=tld_list,
            max_results=max_results
        )
        
        # Enhance with AI scoring
        enhanced_suggestions = await ai_gateway.enhance_domain_suggestions(suggestions)
        
        return enhanced_suggestions
        
    except Exception as e:
        logger.error("Domain search failed", error=str(e))
        raise HTTPException(status_code=500, detail="Domain search failed")

@router.get("/check/{domain}")
async def check_domain_availability(
    domain: str,
    domain_service: DomainService = Depends(lambda: DomainService())
):
    """
    Check if a specific domain is available
    """
    try:
        if "." not in domain:
            domain += ".nxd"
            
        availability = await domain_service.check_availability(domain)
        pricing = await domain_service.get_domain_pricing(domain)
        
        return {
            "domain": domain,
            "available": availability.available,
            "premium": availability.premium,
            "price_eth": pricing.price_eth,
            "price_nxd": pricing.price_nxd,
            "estimated_gas": pricing.estimated_gas
        }
        
    except Exception as e:
        logger.error("Domain availability check failed", domain=domain, error=str(e))
        raise HTTPException(status_code=500, detail="Availability check failed")

@router.post("/register")
async def register_domain(
    request: DomainRegistrationRequest,
    background_tasks: BackgroundTasks,
    domain_service: DomainService = Depends(lambda: DomainService()),
    blockchain_service: BlockchainService = Depends(lambda: BlockchainService())
):
    """
    Register a new domain
    """
    try:
        full_domain = f"{request.name}.{request.tld}"
        
        # Validate domain availability
        availability = await domain_service.check_availability(full_domain)
        if not availability.available:
            raise HTTPException(status_code=400, detail="Domain not available")
        
        # Initiate blockchain registration
        registration_result = await blockchain_service.register_domain(
            name=request.name,
            tld=request.tld,
            duration=request.duration_years,
            payment_token=request.payment_token,
            ipfs_content=request.ipfs_content
        )
        
        # Store in database
        domain_record = await domain_service.create_domain_record(
            full_domain=full_domain,
            owner_address=registration_result.owner,
            transaction_hash=registration_result.tx_hash,
            ipfs_hash=request.ipfs_content
        )
        
        # Schedule follow-up tasks
        background_tasks.add_task(
            domain_service.update_domain_status,
            domain_record.id,
            registration_result.tx_hash
        )
        
        return {
            "domain_id": domain_record.id,
            "transaction_hash": registration_result.tx_hash,
            "estimated_confirmation": "2-5 minutes",
            "domain": full_domain
        }
        
    except Exception as e:
        logger.error("Domain registration failed", request=request.dict(), error=str(e))
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.get("/user/{address}", response_model=List[DomainResponse])
async def get_user_domains(
    address: str,
    domain_service: DomainService = Depends(lambda: DomainService())
):
    """
    Get all domains owned by a user
    """
    try:
        domains = await domain_service.get_user_domains(address)
        return domains
        
    except Exception as e:
        logger.error("Failed to get user domains", address=address, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve domains")

@router.get("/trending")
async def get_trending_domains(
    limit: int = 10,
    domain_service: DomainService = Depends(lambda: DomainService())
):
    """
    Get trending domain registrations
    """
    try:
        trending = await domain_service.get_trending_domains(limit)
        return trending
        
    except Exception as e:
        logger.error("Failed to get trending domains", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve trending domains")

@router.post("/ai/suggestions")
async def get_ai_domain_suggestions(
    prompt: str,
    category: Optional[str] = None,
    ai_gateway: AIGateway = Depends(lambda: AIGateway())
):
    """
    Get AI-powered domain name suggestions
    """
    try:
        suggestions = await ai_gateway.generate_domain_suggestions(
            prompt=prompt,
            category=category,
            count=20
        )
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error("AI domain suggestion failed", prompt=prompt, error=str(e))
        raise HTTPException(status_code=500, detail="AI suggestion failed")