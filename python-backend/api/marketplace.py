"""
Marketplace API Routes
Handles domain trading and marketplace operations
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

class ListingRequest(BaseModel):
    domain: str
    price_eth: str
    price_nxd: str
    seller_address: str
    preferred_currency: str = "ETH"  # ETH or NXD

class PurchaseRequest(BaseModel):
    listing_id: int
    buyer_address: str
    payment_currency: str  # ETH or NXD

class DomainListing(BaseModel):
    id: int
    domain: str
    price_eth: str
    price_nxd: str
    seller_address: str
    listed_at: str
    category: str
    is_premium: bool
    views: int
    status: str

@router.get("/listings", response_model=List[DomainListing])
async def get_marketplace_listings(
    category: Optional[str] = None,
    sort_by: Optional[str] = "price",  # price, date, views
    limit: Optional[int] = 20
):
    """
    Get marketplace domain listings
    """
    try:
        # Mock marketplace listings
        listings = [
            {
                "id": 1,
                "domain": "crypto.nxd",
                "price_eth": "5.0",
                "price_nxd": "500.0",
                "seller_address": "0x1234567890123456789012345678901234567890",
                "listed_at": "2025-07-01T10:00:00Z",
                "category": "Finance",
                "is_premium": True,
                "views": 245,
                "status": "active"
            },
            {
                "id": 2,
                "domain": "ai.nxd",
                "price_eth": "10.0",
                "price_nxd": "1000.0",
                "seller_address": "0x2345678901234567890123456789012345678901",
                "listed_at": "2025-07-02T14:30:00Z",
                "category": "Technology",
                "is_premium": True,
                "views": 189,
                "status": "active"
            },
            {
                "id": 3,
                "domain": "gamefi.nxd",
                "price_eth": "2.5",
                "price_nxd": "250.0",
                "seller_address": "0x3456789012345678901234567890123456789012",
                "listed_at": "2025-07-03T09:15:00Z",
                "category": "Gaming",
                "is_premium": False,
                "views": 67,
                "status": "active"
            }
        ]
        
        # Filter by category if provided
        if category:
            listings = [l for l in listings if l["category"].lower() == category.lower()]
        
        # Sort listings
        if sort_by == "price":
            listings.sort(key=lambda x: float(x["price_eth"]))
        elif sort_by == "date":
            listings.sort(key=lambda x: x["listed_at"], reverse=True)
        elif sort_by == "views":
            listings.sort(key=lambda x: x["views"], reverse=True)
        
        return listings[:limit] if limit else listings
        
    except Exception as e:
        logger.error("Failed to get marketplace listings", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve marketplace listings")

@router.get("/listings/{listing_id}")
async def get_listing_details(listing_id: int):
    """
    Get detailed information about a specific listing
    """
    try:
        # Mock listing details
        listing = {
            "id": listing_id,
            "domain": "crypto.nxd",
            "price_eth": "5.0",
            "price_nxd": "500.0",
            "seller_address": "0x1234567890123456789012345678901234567890",
            "listed_at": "2025-07-01T10:00:00Z",
            "category": "Finance",
            "is_premium": True,
            "views": 245,
            "status": "active",
            "description": "Premium crypto domain perfect for DeFi projects",
            "domain_info": {
                "registered_at": "2025-01-15T00:00:00Z",
                "expiry_date": "2026-01-15T00:00:00Z",
                "ipfs_content": "QmX...",
                "dns_records": 5,
                "subdomain_count": 0
            },
            "price_history": [
                {"date": "2025-07-01", "price_eth": "5.0"},
                {"date": "2025-06-15", "price_eth": "4.5"},
                {"date": "2025-06-01", "price_eth": "4.0"}
            ],
            "similar_domains": [
                {"domain": "defi.nxd", "price": "3.5"},
                {"domain": "web3.nxd", "price": "7.2"}
            ]
        }
        
        return listing
        
    except Exception as e:
        logger.error("Failed to get listing details", listing_id=listing_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve listing details")

@router.post("/listings")
async def create_listing(request: ListingRequest):
    """
    Create a new marketplace listing
    """
    try:
        # Mock listing creation
        listing_id = hash(request.domain) % 1000000
        
        return {
            "listing_id": listing_id,
            "domain": request.domain,
            "price_eth": request.price_eth,
            "price_nxd": request.price_nxd,
            "seller": request.seller_address,
            "status": "active",
            "listed_at": "2025-07-06T12:00:00Z"
        }
        
    except Exception as e:
        logger.error("Failed to create listing", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create marketplace listing")

@router.post("/purchase")
async def purchase_domain(request: PurchaseRequest):
    """
    Purchase a domain from marketplace
    """
    try:
        # Mock purchase transaction
        tx_hash = f"0x{'purchase':<55}"
        
        return {
            "transaction_hash": tx_hash,
            "listing_id": request.listing_id,
            "buyer": request.buyer_address,
            "payment_currency": request.payment_currency,
            "status": "pending",
            "estimated_confirmation": "2-5 minutes"
        }
        
    except Exception as e:
        logger.error("Purchase failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to process purchase")

@router.delete("/listings/{listing_id}")
async def cancel_listing(listing_id: int, seller_address: str):
    """
    Cancel a marketplace listing
    """
    try:
        return {
            "listing_id": listing_id,
            "status": "cancelled",
            "cancelled_at": "2025-07-06T12:00:00Z"
        }
        
    except Exception as e:
        logger.error("Failed to cancel listing", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to cancel listing")

@router.get("/user/{address}/listings")
async def get_user_listings(address: str):
    """
    Get listings created by a specific user
    """
    try:
        # Mock user listings
        listings = [
            {
                "id": 1,
                "domain": "crypto.nxd",
                "price_eth": "5.0",
                "price_nxd": "500.0",
                "listed_at": "2025-07-01T10:00:00Z",
                "status": "active",
                "views": 245,
                "offers": 3
            }
        ]
        
        return {"listings": listings}
        
    except Exception as e:
        logger.error("Failed to get user listings", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve user listings")

@router.get("/stats")
async def get_marketplace_stats():
    """
    Get marketplace statistics
    """
    try:
        return {
            "total_listings": 45,
            "active_listings": 38,
            "total_volume_eth": "125.5",
            "total_volume_nxd": "12550.0",
            "average_price_eth": "3.2",
            "sales_24h": 8,
            "top_categories": [
                {"category": "Technology", "count": 15},
                {"category": "Finance", "count": 12},
                {"category": "Gaming", "count": 8}
            ],
            "price_ranges": {
                "under_1_eth": 12,
                "1_to_5_eth": 18,
                "5_to_10_eth": 6,
                "over_10_eth": 2
            }
        }
        
    except Exception as e:
        logger.error("Failed to get marketplace stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve marketplace statistics")

@router.get("/trending")
async def get_trending_domains():
    """
    Get trending domains in marketplace
    """
    try:
        return {
            "trending": [
                {
                    "domain": "ai.nxd",
                    "price_change_24h": "+15%",
                    "views_24h": 89,
                    "category": "Technology"
                },
                {
                    "domain": "defi.nxd", 
                    "price_change_24h": "+8%",
                    "views_24h": 67,
                    "category": "Finance"
                },
                {
                    "domain": "meta.nxd",
                    "price_change_24h": "+12%",
                    "views_24h": 45,
                    "category": "Technology"
                }
            ]
        }
        
    except Exception as e:
        logger.error("Failed to get trending domains", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve trending domains")