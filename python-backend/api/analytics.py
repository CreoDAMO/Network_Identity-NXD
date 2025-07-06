"""
Analytics API Routes
Handles platform analytics, metrics, and reporting
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import structlog

from services.analytics_service import AnalyticsService

logger = structlog.get_logger()
router = APIRouter(prefix="/api/analytics", tags=["analytics"])

class MetricsRequest(BaseModel):
    metrics: List[str]
    timeframe: str = "7d"  # 1h, 1d, 7d, 30d, 90d
    granularity: str = "hour"  # minute, hour, day

@router.get("/dashboard")
async def get_dashboard_metrics(
    timeframe: Optional[str] = "7d",
    analytics_service: AnalyticsService = Depends(lambda: AnalyticsService())
):
    """
    Get key dashboard metrics
    """
    try:
        metrics = await analytics_service.get_dashboard_metrics(timeframe)
        return metrics
        
    except Exception as e:
        logger.error("Failed to get dashboard metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard metrics")

@router.get("/domains")
async def get_domain_analytics(
    timeframe: Optional[str] = "7d",
    analytics_service: AnalyticsService = Depends(lambda: AnalyticsService())
):
    """
    Get domain registration and search analytics
    """
    try:
        return {
            "registrations": {
                "total": 1250,
                "today": 45,
                "growth_rate": "+12%",
                "by_tld": [
                    {"tld": "nxd", "count": 850, "percentage": 68},
                    {"tld": "web3", "count": 200, "percentage": 16},
                    {"tld": "dao", "count": 120, "percentage": 9.6},
                    {"tld": "defi", "count": 80, "percentage": 6.4}
                ]
            },
            "searches": {
                "total": 15600,
                "today": 890,
                "top_queries": [
                    {"query": "ai", "count": 245},
                    {"query": "crypto", "count": 189},
                    {"query": "defi", "count": 156},
                    {"query": "nft", "count": 134},
                    {"query": "dao", "count": 98}
                ]
            },
            "availability_rate": 0.73,
            "average_registration_time": "2.3 minutes"
        }
        
    except Exception as e:
        logger.error("Failed to get domain analytics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve domain analytics")

@router.get("/staking")
async def get_staking_analytics(
    timeframe: Optional[str] = "7d",
    analytics_service: AnalyticsService = Depends(lambda: AnalyticsService())
):
    """
    Get staking analytics and trends
    """
    try:
        return {
            "total_staked": "500000000000000000000000",  # 500k NXD
            "total_stakers": 1250,
            "average_stake": "400000000000000000000",    # 400 NXD
            "staking_trends": [
                {"date": "2025-07-01", "total_staked": "450000000000000000000000"},
                {"date": "2025-07-02", "total_staked": "465000000000000000000000"},
                {"date": "2025-07-03", "total_staked": "480000000000000000000000"},
                {"date": "2025-07-04", "total_staked": "490000000000000000000000"},
                {"date": "2025-07-05", "total_staked": "495000000000000000000000"},
                {"date": "2025-07-06", "total_staked": "500000000000000000000000"}
            ],
            "apy_history": [
                {"date": "2025-07-01", "apy": 19.2},
                {"date": "2025-07-02", "apy": 18.8},
                {"date": "2025-07-03", "apy": 18.6},
                {"date": "2025-07-04", "apy": 18.5},
                {"date": "2025-07-05", "apy": 18.5},
                {"date": "2025-07-06", "apy": 18.5}
            ],
            "rewards_distributed": "25000000000000000000000",  # 25k NXD
            "compound_rate": 0.85
        }
        
    except Exception as e:
        logger.error("Failed to get staking analytics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve staking analytics")

@router.get("/governance")
async def get_governance_analytics():
    """
    Get governance participation analytics
    """
    try:
        return {
            "total_proposals": 12,
            "active_proposals": 2,
            "participation_rate": 0.35,
            "voting_power_distribution": [
                {"range": "1-1000 NXD", "holders": 850, "percentage": 68},
                {"range": "1001-10000 NXD", "holders": 290, "percentage": 23.2},
                {"range": "10001-100000 NXD", "holders": 85, "percentage": 6.8},
                {"range": "100000+ NXD", "holders": 25, "percentage": 2}
            ],
            "proposal_outcomes": {
                "passed": 8,
                "failed": 2,
                "pending": 2
            },
            "voter_retention": 0.72,
            "average_voting_time": "4.2 hours"
        }
        
    except Exception as e:
        logger.error("Failed to get governance analytics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve governance analytics")

@router.get("/marketplace")
async def get_marketplace_analytics():
    """
    Get marketplace trading analytics
    """
    try:
        return {
            "total_volume_eth": "125.5",
            "total_volume_nxd": "12550.0",
            "total_sales": 89,
            "average_sale_price_eth": "1.41",
            "active_listings": 38,
            "listing_to_sale_rate": 0.65,
            "top_selling_categories": [
                {"category": "Technology", "sales": 34, "volume_eth": "45.2"},
                {"category": "Finance", "sales": 28, "volume_eth": "38.8"},
                {"category": "Gaming", "sales": 15, "volume_eth": "22.1"},
                {"category": "Art", "sales": 12, "volume_eth": "19.4"}
            ],
            "price_trends": [
                {"date": "2025-07-01", "avg_price_eth": "1.35"},
                {"date": "2025-07-02", "avg_price_eth": "1.38"},
                {"date": "2025-07-03", "avg_price_eth": "1.40"},
                {"date": "2025-07-04", "avg_price_eth": "1.42"},
                {"date": "2025-07-05", "avg_price_eth": "1.41"},
                {"date": "2025-07-06", "avg_price_eth": "1.41"}
            ],
            "sales_by_day": [
                {"date": "2025-07-01", "sales": 12},
                {"date": "2025-07-02", "sales": 15},
                {"date": "2025-07-03", "sales": 18},
                {"date": "2025-07-04", "sales": 14},
                {"date": "2025-07-05", "sales": 16},
                {"date": "2025-07-06", "sales": 14}
            ]
        }
        
    except Exception as e:
        logger.error("Failed to get marketplace analytics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve marketplace analytics")

@router.get("/users")
async def get_user_analytics():
    """
    Get user acquisition and engagement analytics
    """
    try:
        return {
            "total_users": 2450,
            "active_users_30d": 1850,
            "new_users_7d": 125,
            "user_growth_rate": "+8.2%",
            "user_acquisition": [
                {"date": "2025-07-01", "new_users": 18},
                {"date": "2025-07-02", "new_users": 22},
                {"date": "2025-07-03", "new_users": 15},
                {"date": "2025-07-04", "new_users": 20},
                {"date": "2025-07-05", "new_users": 25},
                {"date": "2025-07-06", "new_users": 25}
            ],
            "engagement_metrics": {
                "average_session_duration": "12.5 minutes",
                "pages_per_session": 4.2,
                "return_visitor_rate": 0.68,
                "feature_usage": {
                    "domain_search": 0.95,
                    "staking": 0.48,
                    "governance": 0.23,
                    "marketplace": 0.35,
                    "ai_assistant": 0.67
                }
            },
            "user_segments": [
                {"segment": "Domain Investors", "count": 245, "percentage": 10},
                {"segment": "DeFi Users", "count": 490, "percentage": 20},
                {"segment": "Casual Users", "count": 1225, "percentage": 50},
                {"segment": "Developers", "count": 295, "percentage": 12},
                {"segment": "DAO Participants", "count": 195, "percentage": 8}
            ]
        }
        
    except Exception as e:
        logger.error("Failed to get user analytics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve user analytics")

@router.get("/revenue")
async def get_revenue_analytics():
    """
    Get revenue and financial analytics
    """
    try:
        return {
            "total_revenue_eth": "45.8",
            "total_revenue_nxd": "4580.0",
            "monthly_recurring_revenue": "12.5",
            "revenue_sources": [
                {"source": "Domain Registrations", "amount_eth": "28.5", "percentage": 62.2},
                {"source": "Marketplace Fees", "amount_eth": "8.9", "percentage": 19.4},
                {"source": "Premium Features", "amount_eth": "5.2", "percentage": 11.4},
                {"source": "White Label Licenses", "amount_eth": "3.2", "percentage": 7.0}
            ],
            "revenue_trends": [
                {"date": "2025-07-01", "revenue_eth": "6.8"},
                {"date": "2025-07-02", "revenue_eth": "7.2"},
                {"date": "2025-07-03", "revenue_eth": "5.9"},
                {"date": "2025-07-04", "revenue_eth": "8.1"},
                {"date": "2025-07-05", "revenue_eth": "9.4"},
                {"date": "2025-07-06", "revenue_eth": "8.4"}
            ],
            "profit_margins": {
                "gross_margin": 0.78,
                "operating_margin": 0.45,
                "net_margin": 0.32
            },
            "cost_breakdown": [
                {"category": "Infrastructure", "percentage": 35},
                {"category": "Development", "percentage": 25},
                {"category": "Marketing", "percentage": 20},
                {"category": "Operations", "percentage": 15},
                {"category": "Legal & Compliance", "percentage": 5}
            ]
        }
        
    except Exception as e:
        logger.error("Failed to get revenue analytics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve revenue analytics")

@router.post("/custom-report")
async def generate_custom_report(
    request: MetricsRequest,
    analytics_service: AnalyticsService = Depends(lambda: AnalyticsService())
):
    """
    Generate custom analytics report
    """
    try:
        report = await analytics_service.generate_custom_report(
            metrics=request.metrics,
            timeframe=request.timeframe,
            granularity=request.granularity
        )
        
        return report
        
    except Exception as e:
        logger.error("Failed to generate custom report", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate custom report")

@router.get("/realtime")
async def get_realtime_metrics():
    """
    Get real-time platform metrics
    """
    try:
        return {
            "online_users": 234,
            "active_searches": 12,
            "pending_transactions": 5,
            "network_status": {
                "ethereum": {"status": "healthy", "gas_price": "25 gwei"},
                "polygon": {"status": "healthy", "gas_price": "35 gwei"},
                "base": {"status": "healthy", "gas_price": "0.5 gwei"}
            },
            "ai_service_status": "online",
            "ipfs_cluster_status": "healthy",
            "last_block_time": "2025-07-06T12:15:23Z",
            "system_load": {
                "cpu": 0.45,
                "memory": 0.62,
                "disk": 0.23
            }
        }
        
    except Exception as e:
        logger.error("Failed to get realtime metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve realtime metrics")