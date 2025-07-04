"""
NXD Platform Python FastAPI Backend
Comprehensive Web3 domain management system with AI integration
"""
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Security, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import uvicorn
import structlog
from prometheus_client import generate_latest, Counter, Histogram, Gauge
from starlette.responses import Response

from core.config import settings
from core.database import init_db, get_db
from services.ai_gateway import AIGateway
from services.ipfs_service import IPFSService
from services.domain_service import DomainService
from services.blockchain_service import BlockchainService
from services.communication_service import CommunicationService
from services.satellite_service import SatelliteService
from services.iot_service import IoTService
from services.analytics_service import AnalyticsService
from services.cst_service import CSTService
from api.domains import router as domains_router
from api.ai import router as ai_router
from api.staking import router as staking_router
from api.governance import router as governance_router
from api.marketplace import router as marketplace_router
from api.communication import router as communication_router
from api.analytics import router as analytics_router

# Configure structured logging
logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter('nxd_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('nxd_request_duration_seconds', 'Request duration')
ACTIVE_CONNECTIONS = Gauge('nxd_active_connections', 'Active connections')

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting NXD Platform Backend")
    
    # Initialize database
    await init_db()
    
    # Initialize services
    app.state.ai_gateway = AIGateway()
    app.state.ipfs_service = IPFSService()
    app.state.domain_service = DomainService()
    app.state.blockchain_service = BlockchainService()
    app.state.communication_service = CommunicationService()
    app.state.satellite_service = SatelliteService()
    app.state.iot_service = IoTService()
    app.state.analytics_service = AnalyticsService()
    app.state.cst_service = CSTService()
    
    logger.info("NXD Platform Backend started successfully")
    
    yield
    
    logger.info("Shutting down NXD Platform Backend")

# Create FastAPI app
app = FastAPI(
    title="NXD Platform API",
    description="Comprehensive Web3 domain management system with AI integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "https://*.replit.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for metrics
@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = REQUEST_DURATION.time()
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    ACTIVE_CONNECTIONS.inc()
    
    response = await call_next(request)
    
    REQUEST_DURATION.observe(start_time)
    ACTIVE_CONNECTIONS.dec()
    
    return response

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validate JWT token and return user info"""
    try:
        # TODO: Implement JWT validation
        token = credentials.credentials
        # Placeholder - implement actual JWT validation
        return {"user_id": "user123", "wallet_address": "0x123..."}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Health check endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "database": "connected",
            "ai_gateway": "active",
            "ipfs": "connected",
            "blockchain": "connected"
        }
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type="text/plain")

# Include routers
app.include_router(domains_router, prefix="/api/v1/domains", tags=["Domains"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(staking_router, prefix="/api/v1/staking", tags=["Staking"])
app.include_router(governance_router, prefix="/api/v1/governance", tags=["Governance"])
app.include_router(marketplace_router, prefix="/api/v1/marketplace", tags=["Marketplace"])
app.include_router(communication_router, prefix="/api/v1/communication", tags=["Communication"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NXD Platform API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error("HTTP exception", status_code=exc.status_code, detail=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error("Unhandled exception", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config=None
    )